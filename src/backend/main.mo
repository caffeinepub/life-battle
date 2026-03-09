import List "mo:core/List";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Nat32 "mo:core/Nat32";
import Order "mo:core/Order";
import Int "mo:core/Int";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";

actor {
  // Types
  type PlayerId = Nat32;
  type MatchId = Nat32;
  type TxId = Nat32;

  type MatchType = {
    #free;
    #paid;
  };

  type MatchStatus = {
    #upcoming;
    #live;
    #completed;
  };

  type TxType = {
    #credit;
    #debit;
  };

  type Player = {
    id : PlayerId;
    username : Text;
    walletBalance : Nat;
    referralCode : Text;
    referredBy : ?Text;
    matchesPlayed : Nat;
    wins : Nat;
    totalEarnings : Nat;
  };

  type Match = {
    id : MatchId;
    title : Text;
    matchType : MatchType;
    entryFee : Nat;
    prizeAmount : Nat;
    scheduledAt : Time.Time;
    roomId : Text;
    status : MatchStatus;
    playerIds : [PlayerId];
    winnerId : ?PlayerId;
  };

  type WalletTransaction = {
    id : TxId;
    userId : PlayerId;
    amount : Nat;
    txType : TxType;
    description : Text;
    timestamp : Time.Time;
  };

  public type UserProfile = {
    playerId : ?PlayerId;
    username : Text;
  };

  module LeaderboardEntryCompare {
    public func compare(a : (Text, ?Nat), b : (Text, ?Nat)) : Order.Order {
      func compareValues(x : ?Nat, y : ?Nat, namesSwapped : Bool) : Order.Order {
        switch (x, y) {
          case (null, null) { #equal };
          case (null, ?_) { if (namesSwapped) { #greater } else { #less } };
          case (?_, null) { if (namesSwapped) { #less } else { #greater } };
          case (?valueX, ?valueY) {
            if (valueX < valueY) { if (namesSwapped) { #greater } else { #less } }
            else if (valueX > valueY) { if (namesSwapped) { #less } else { #greater } }
            else { #equal };
          };
        };
      };
      switch (Text.compare(a.0, b.0)) {
        case (#equal) { compareValues(a.1, b.1, false) };
        case (order) { order };
      };
    };
  };

  // State
  let players = Map.empty<PlayerId, Player>();
  let matches = Map.empty<MatchId, Match>();
  let walletTransactions = Map.empty<TxId, WalletTransaction>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let principalToPlayerId = Map.empty<Principal, PlayerId>();
  var nextPlayerId : PlayerId = 1;
  var nextMatchId : MatchId = 1;
  var nextTxId : TxId = 1;

  // Authorization
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Helper functions
  func getPlayer(id : PlayerId) : Player {
    switch (players.get(id)) {
      case (?player) { player };
      case (null) { Runtime.trap("Player not found") };
    };
  };

  func getMatch(id : MatchId) : Match {
    switch (matches.get(id)) {
      case (?match) { match };
      case (null) { Runtime.trap("Match not found") };
    };
  };

  func getPlayerIdForCaller(caller : Principal) : ?PlayerId {
    principalToPlayerId.get(caller);
  };

  // User Profile Management (required by frontend)
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access profiles");
    };
    userProfiles.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    userProfiles.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    userProfiles.add(caller, profile);
  };

  // Player functionality
  public shared ({ caller }) func registerPlayer(username : Text) : async PlayerId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register as players");
    };

    // Check if caller already has a player account
    switch (principalToPlayerId.get(caller)) {
      case (?existingId) {
        Runtime.trap("Player already registered for this principal");
      };
      case (null) {};
    };

    let id = nextPlayerId;
    nextPlayerId += 1;
    let player : Player = {
      id;
      username;
      walletBalance = 0;
      referralCode = "ref_" # id.toText();
      referredBy = null;
      matchesPlayed = 0;
      wins = 0;
      totalEarnings = 0;
    };
    players.add(id, player);
    principalToPlayerId.add(caller, id);

    // Also save to user profile
    let profile : UserProfile = {
      playerId = ?id;
      username = username;
    };
    userProfiles.add(caller, profile);

    id;
  };

  public shared ({ caller }) func joinMatch(matchId : MatchId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join matches");
    };

    // Get the player ID for the caller
    let playerId = switch (getPlayerIdForCaller(caller)) {
      case (?id) { id };
      case (null) { Runtime.trap("Player not registered. Please register first.") };
    };

    var player = getPlayer(playerId);
    var match = getMatch(matchId);

    // Check if player already joined
    if (match.playerIds.find<PlayerId>(func(id) { id == playerId }) != null) {
      Runtime.trap("Player already joined this match");
    };

    switch (match.matchType) {
      case (#paid) {
        if (player.walletBalance < match.entryFee) {
          Runtime.trap("Insufficient balance");
        };
        player := { player with walletBalance = player.walletBalance - match.entryFee };

        // Record transaction
        let txId = nextTxId;
        nextTxId += 1;
        let tx : WalletTransaction = {
          id = txId;
          userId = playerId;
          amount = match.entryFee;
          txType = #debit;
          description = "Entry fee for match: " # match.title;
          timestamp = Time.now();
        };
        walletTransactions.add(txId, tx);
      };
      case (#free) {};
    };

    player := { player with matchesPlayed = player.matchesPlayed + 1 };
    match := { match with playerIds = match.playerIds.concat([playerId]) };
    players.add(playerId, player);
    matches.add(matchId, match);
  };

  public query ({ caller }) func getLeaderboard() : async [(Text, ?Nat)] {
    // Public endpoint - no authorization required
    players.toArray().map<(PlayerId, Player), (Text, ?Nat)>(
      func((_, p)) { (p.username, ?p.wins) }
    );
  };

  public query ({ caller }) func getPlayerMatches(playerId : PlayerId) : async [Match] {
    // Allow users to view their own matches, admins can view any
    switch (getPlayerIdForCaller(caller)) {
      case (?callerPlayerId) {
        if (callerPlayerId != playerId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own matches");
        };
      };
      case (null) {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own matches");
        };
      };
    };

    matches.values().toArray().filter<Match>(
      func(m) { m.playerIds.find<PlayerId>(func(id) { id == playerId }) != null }
    );
  };

  public query ({ caller }) func getWalletTransactions(playerId : PlayerId) : async [WalletTransaction] {
    // Allow users to view their own transactions, admins can view any
    switch (getPlayerIdForCaller(caller)) {
      case (?callerPlayerId) {
        if (callerPlayerId != playerId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own wallet transactions");
        };
      };
      case (null) {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own wallet transactions");
        };
      };
    };

    walletTransactions.values().toArray().filter<WalletTransaction>(
      func(tx) { tx.userId == playerId }
    );
  };

  public query ({ caller }) func getPlayerDetails(playerId : PlayerId) : async Player {
    // Allow users to view their own details, admins can view any
    switch (getPlayerIdForCaller(caller)) {
      case (?callerPlayerId) {
        if (callerPlayerId != playerId and not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own player details");
        };
      };
      case (null) {
        if (not AccessControl.isAdmin(accessControlState, caller)) {
          Runtime.trap("Unauthorized: Can only view your own player details");
        };
      };
    };

    getPlayer(playerId);
  };

  public query ({ caller }) func getMatches() : async [Match] {
    // Public endpoint - no authorization required
    matches.values().toArray();
  };

  // Admin functionality
  public shared ({ caller }) func createMatch(title : Text, matchType : MatchType, entryFee : Nat, prizeAmount : Nat, scheduledAt : Time.Time, roomId : Text) : async MatchId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create matches");
    };
    let id = nextMatchId;
    nextMatchId += 1;
    let match : Match = {
      id;
      title;
      matchType;
      entryFee;
      prizeAmount;
      scheduledAt;
      roomId;
      status = #upcoming;
      playerIds = [];
      winnerId = null;
    };
    matches.add(id, match);
    id;
  };

  public shared ({ caller }) func updateMatch(matchId : MatchId, title : Text, matchType : MatchType, entryFee : Nat, prizeAmount : Nat, scheduledAt : Time.Time, roomId : Text, status : MatchStatus) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update matches");
    };

    let match = getMatch(matchId);
    let updatedMatch : Match = {
      match with
      title = title;
      matchType = matchType;
      entryFee = entryFee;
      prizeAmount = prizeAmount;
      scheduledAt = scheduledAt;
      roomId = roomId;
      status = status;
    };
    matches.add(matchId, updatedMatch);
  };

  public shared ({ caller }) func deleteMatch(matchId : MatchId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete matches");
    };

    matches.remove(matchId);
  };

  public shared ({ caller }) func setMatchResult(matchId : MatchId, winnerId : PlayerId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set match results");
    };

    let match = getMatch(matchId);
    var winner = getPlayer(winnerId);

    // Verify winner is in the match
    if (match.playerIds.find<PlayerId>(func(id) { id == winnerId }) == null) {
      Runtime.trap("Winner must be a participant in the match");
    };

    // Credit prize to winner
    winner := {
      winner with
      walletBalance = winner.walletBalance + match.prizeAmount;
      wins = winner.wins + 1;
      totalEarnings = winner.totalEarnings + match.prizeAmount;
    };
    players.add(winnerId, winner);

    // Record transaction
    let txId = nextTxId;
    nextTxId += 1;
    let tx : WalletTransaction = {
      id = txId;
      userId = winnerId;
      amount = match.prizeAmount;
      txType = #credit;
      description = "Prize for winning match: " # match.title;
      timestamp = Time.now();
    };
    walletTransactions.add(txId, tx);

    // Update match
    matches.add(matchId, { match with status = #completed; winnerId = ?winnerId });
  };

  public shared ({ caller }) func adjustPlayerWallet(playerId : PlayerId, amount : Int, description : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can adjust player wallets");
    };

    var player = getPlayer(playerId);

    let newBalance = if (amount >= 0) {
      player.walletBalance + Int.abs(amount);
    } else {
      let absAmount = Int.abs(amount);
      if (player.walletBalance < absAmount) {
        Runtime.trap("Insufficient balance for deduction");
      };
      player.walletBalance - absAmount;
    };

    player := { player with walletBalance = newBalance };
    players.add(playerId, player);

    // Record transaction
    let txId = nextTxId;
    nextTxId += 1;
    let tx : WalletTransaction = {
      id = txId;
      userId = playerId;
      amount = Int.abs(amount);
      txType = if (amount >= 0) { #credit } else { #debit };
      description = description;
      timestamp = Time.now();
    };
    walletTransactions.add(txId, tx);
  };

  public query ({ caller }) func getAdminDashboard() : async (Nat, Nat, Nat) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access dashboard");
    };

    // Calculate total revenue from paid matches
    var totalRevenue : Nat = 0;
    for ((_, match) in matches.entries()) {
      switch (match.matchType) {
        case (#paid) {
          totalRevenue += match.entryFee * match.playerIds.size();
        };
        case (#free) {};
      };
    };

    (players.size(), matches.size(), totalRevenue);
  };
};
