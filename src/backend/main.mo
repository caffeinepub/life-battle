import List "mo:core/List";
import Array "mo:core/Array";
import Text "mo:core/Text";
import Map "mo:core/Map";
import Nat32 "mo:core/Nat32";
import Iter "mo:core/Iter";
import Time "mo:core/Time";
import Order "mo:core/Order";
import Int "mo:core/Int";
import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";



actor {
  // Types
  // Player, Match, Transaction Ids
  type PlayerId = Nat32;
  type MatchId = Nat32;
  type TxId = Nat32;
  type RequestId = Nat32;

  public type MatchType = {
    #free;
    #paid;
  };

  public type MatchSubType = {
    #survival;
    #perKill;
    #lossToWin;
    #lonewolf1v1;
    #lonewolf2v2;
    #cs1v1;
    #cs2v2;
    #cs4v4;
  };

  public type MatchStatus = {
    #upcoming;
    #ongoing;
    #completed;
  };

  public type TxType = {
    #credit;
    #debit;
  };

  public type UserProfile = {
    username : Text;
    email : Text;
    playerId : ?PlayerId;
  };

  public type Player = {
    id : PlayerId;
    username : Text;
    email : Text;
    walletBalance : Nat;
    winningBalance : Nat;
    referralCode : Text;
    referredBy : ?Text;
    matchesPlayed : Nat;
    wins : Nat;
    totalKills : Nat;
    totalEarnings : Nat;
  };

  public type Match = {
    id : MatchId;
    title : Text;
    matchType : MatchType;
    matchSubType : MatchSubType;
    mapName : Text;
    totalPlayers : Nat;
    entryFee : Nat;
    prizeAmount : Nat;
    scheduledAt : Time.Time;
    roomId : Text;
    roomPassword : Text;
    status : MatchStatus;
    playerIds : [PlayerId];
    winnerName : Text;
    resultKills : Nat;
  };

  public type WalletTransaction = {
    id : TxId;
    userId : PlayerId;
    amount : Nat;
    txType : TxType;
    description : Text;
    timestamp : Time.Time;
  };

  public type DepositRequest = {
    id : RequestId;
    playerId : PlayerId;
    amount : Nat;
    transactionId : Text;
    status : {
      #pending;
      #approved;
      #rejected;
    };
    timestamp : Time.Time;
    adminNote : Text;
  };

  public type WithdrawRequest = {
    id : RequestId;
    playerId : PlayerId;
    amount : Nat;
    upiId : Text;
    status : {
      #pending;
      #approved;
      #rejected;
    };
    timestamp : Time.Time;
    adminNote : Text;
  };

  // State
  let players = Map.empty<PlayerId, Player>();
  let matches = Map.empty<MatchId, Match>();
  let walletTransactions = Map.empty<TxId, WalletTransaction>();
  let depositRequests = Map.empty<RequestId, DepositRequest>();
  let withdrawRequests = Map.empty<RequestId, WithdrawRequest>();
  let userProfiles = Map.empty<Principal, UserProfile>();
  let principalToPlayerId = Map.empty<Principal, PlayerId>();

  var nextPlayerId : PlayerId = 1;
  var nextMatchId : MatchId = 1;
  var nextTxId : TxId = 1;
  var nextDepositRequestId : RequestId = 1;
  var nextWithdrawRequestId : RequestId = 1;

  // Authorization (MixinAuthorization)
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

  // User Handling - Profile Endpoints
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

  // Player Functionality (Players, Matches, Wallet)
  public shared ({ caller }) func registerPlayer(username : Text, email : Text) : async PlayerId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can register as players");
    };

    // Check if username/email is already taken
    let filteredPlayers = players.filter(
      func(_id, p) {
        p.username == username or p.email == email;
      }
    );

    if (filteredPlayers.size() > 0) {
      Runtime.trap("Username or Email already exists");
    };

    // Check if caller already has a player account
    switch (principalToPlayerId.get(caller)) {
      case (?_existingId) {
        Runtime.trap("Player already registered for this principal");
      };
      case (null) {};
    };

    // Create new player
    let id = nextPlayerId;
    nextPlayerId += 1;

    let player : Player = {
      id;
      username;
      email;
      walletBalance = 0;
      winningBalance = 0;
      referralCode = "ref_" # id.toText();
      referredBy = null;
      matchesPlayed = 0;
      wins = 0;
      totalKills = 0;
      totalEarnings = 0;
    };

    players.add(id, player);
    principalToPlayerId.add(caller, id);

    let profile : UserProfile = {
      playerId = ?id;
      username;
      email;
    };
    userProfiles.add(caller, profile);

    id;
  };

  public shared ({ caller }) func joinMatch(matchId : MatchId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join matches");
    };

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

  // Returns (playerId, username, matchesPlayed, totalKills, wins)
  public query func getLeaderboard() : async [(PlayerId, Text, Nat, Nat, Nat)] {
    players.toArray().map<(PlayerId, Player), (PlayerId, Text, Nat, Nat, Nat)>(
      func((_, p)) {
        (p.id, p.username, p.matchesPlayed, p.totalKills, p.wins);
      }
    );
  };

  public query ({ caller }) func getPlayerMatches(playerId : PlayerId) : async [Match] {
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

  // Returns all registered players (admin only)
  public query ({ caller }) func getAllPlayers() : async [Player] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all players");
    };
    players.values().toArray();
  };

  public query func getMatches() : async [Match] {
    matches.values().toArray();
  };

  public query ({ caller }) func getMatchRoomDetails(matchId : MatchId) : async ?(Text, Text) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can access room details");
    };

    switch (getPlayerIdForCaller(caller)) {
      case (?playerId) {
        let match = getMatch(matchId);

        let hasJoined = match.playerIds.find<PlayerId>(func(id) { id == playerId }) != null;
        if (hasJoined and match.status == #ongoing) {
          return ?(match.roomId, match.roomPassword);
        };

        Runtime.trap("Unauthorized: Room details available only for joined, ongoing matches");
      };
      case (null) { Runtime.trap("Player not registered. Please register first.") };
    };
  };

  // Admin Functionality
  public shared ({ caller }) func createMatch(
    title : Text,
    matchType : MatchType,
    matchSubType : MatchSubType,
    mapName : Text,
    totalPlayers : Nat,
    entryFee : Nat,
    prizeAmount : Nat,
    scheduledAt : Time.Time,
    roomId : Text,
    roomPassword : Text,
  ) : async MatchId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create matches");
    };

    let id = nextMatchId;
    nextMatchId += 1;

    let match : Match = {
      id;
      title;
      matchType;
      matchSubType;
      mapName;
      totalPlayers;
      entryFee;
      prizeAmount;
      scheduledAt;
      roomId;
      roomPassword;
      status = #upcoming;
      playerIds = [];
      winnerName = "";
      resultKills = 0;
    };

    matches.add(id, match);
    id;
  };

  public shared ({ caller }) func updateMatch(
    matchId : MatchId,
    title : Text,
    matchType : MatchType,
    matchSubType : MatchSubType,
    mapName : Text,
    totalPlayers : Nat,
    entryFee : Nat,
    prizeAmount : Nat,
    scheduledAt : Time.Time,
    roomId : Text,
    roomPassword : Text,
    status : MatchStatus,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can update matches");
    };

    let match = getMatch(matchId);
    let updatedMatch : Match = {
      match with
      title = title;
      matchType = matchType;
      matchSubType = matchSubType;
      mapName = mapName;
      totalPlayers = totalPlayers;
      entryFee = entryFee;
      prizeAmount = prizeAmount;
      scheduledAt = scheduledAt;
      roomId = roomId;
      roomPassword = roomPassword;
      status = status;
    };
    matches.add(matchId, updatedMatch);
  };

  public shared ({ caller }) func setMatchResult(
    matchId : MatchId,
    winnerName : Text,
    resultKills : Nat,
  ) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can set match results");
    };

    let match = getMatch(matchId);

    var playerOpt : ?Player = null;
    for ((_, player) in players.entries()) {
      if (player.username == winnerName) {
        playerOpt := ?player;
      };
    };

    switch (playerOpt) {
      case (null) {
        Runtime.trap("Winner not found in players.");
      };
      case (?player) {
        let updatedPlayer = {
          player with
          winningBalance = player.winningBalance + match.prizeAmount;
          wins = player.wins + 1;
        };
        players.add(player.id, updatedPlayer);

        let txId = nextTxId;
        nextTxId += 1;
        let tx : WalletTransaction = {
          id = txId;
          userId = player.id;
          amount = match.prizeAmount;
          txType = #credit;
          description = "Winning prize for match: " # match.title;
          timestamp = Time.now();
        };
        walletTransactions.add(txId, tx);
      };
    };

    let updatedMatch = {
      match with
      winnerName = winnerName;
      resultKills = resultKills;
      status = #completed;
    };

    matches.add(matchId, updatedMatch);
  };

  public shared ({ caller }) func deleteMatch(matchId : MatchId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete matches");
    };
    matches.remove(matchId);
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
      player.walletBalance - absAmount;
    };

    player := { player with walletBalance = newBalance };
    players.add(playerId, player);

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

  public shared ({ caller }) func submitDepositRequest(amount : Nat, transactionId : Text) : async RequestId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit deposit requests");
    };

    let playerId = switch (getPlayerIdForCaller(caller)) {
      case (?id) { id };
      case (null) { Runtime.trap("Player not registered. Please register first.") };
    };

    let id = nextDepositRequestId;
    nextDepositRequestId += 1;
    let request : DepositRequest = {
      id;
      playerId;
      amount;
      transactionId;
      status = #pending;
      timestamp = Time.now();
      adminNote = "";
    };

    depositRequests.add(id, request);
    id;
  };

  public shared ({ caller }) func submitWithdrawRequest(amount : Nat, upiId : Text) : async RequestId {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit withdraw requests");
    };

    let playerId = switch (getPlayerIdForCaller(caller)) {
      case (?id) { id };
      case (null) { Runtime.trap("Player not registered. Please register first.") };
    };

    let player = getPlayer(playerId);

    if (player.winningBalance < amount) {
      Runtime.trap("Insufficient winning balance for withdrawal request");
    };

    let id = nextWithdrawRequestId;
    nextWithdrawRequestId += 1;
    let request : WithdrawRequest = {
      id;
      playerId;
      amount;
      upiId;
      status = #pending;
      timestamp = Time.now();
      adminNote = "";
    };

    withdrawRequests.add(id, request);
    id;
  };

  public query ({ caller }) func getPlayerDepositRequests() : async [DepositRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view deposit requests");
    };

    let playerId = switch (getPlayerIdForCaller(caller)) {
      case (?id) { id };
      case (null) { Runtime.trap("Player not registered. Please register first.") };
    };

    depositRequests.values().toArray().filter<DepositRequest>(
      func(r) { r.playerId == playerId }
    );
  };

  public query ({ caller }) func getPlayerWithdrawRequests() : async [WithdrawRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view withdraw requests");
    };

    let playerId = switch (getPlayerIdForCaller(caller)) {
      case (?id) { id };
      case (null) { Runtime.trap("Player not registered. Please register first.") };
    };

    withdrawRequests.values().toArray().filter<WithdrawRequest>(
      func(r) { r.playerId == playerId }
    );
  };

  public query ({ caller }) func getDepositRequests() : async [DepositRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view deposit requests");
    };
    depositRequests.values().toArray();
  };

  public query ({ caller }) func getWithdrawRequests() : async [WithdrawRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view withdraw requests");
    };
    withdrawRequests.values().toArray();
  };

  public shared ({ caller }) func approveDepositRequest(id : RequestId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve deposit requests");
    };

    let request = switch (depositRequests.get(id)) {
      case (?req) { req };
      case (null) { Runtime.trap("Deposit request not found") };
    };

    if (request.status != #pending) {
      Runtime.trap("Deposit request already processed");
    };

    var player = getPlayer(request.playerId);
    player := { player with walletBalance = player.walletBalance + request.amount };
    players.add(player.id, player);

    let txId = nextTxId;
    nextTxId += 1;
    let tx : WalletTransaction = {
      id = txId;
      userId = player.id;
      amount = request.amount;
      txType = #credit;
      description = "Deposit approved (UPI " # request.transactionId # ")";
      timestamp = Time.now();
    };
    walletTransactions.add(txId, tx);

    let updatedRequest = { request with status = #approved };
    depositRequests.add(id, updatedRequest);
  };

  public shared ({ caller }) func rejectDepositRequest(id : RequestId, note : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject deposit requests");
    };

    let request = switch (depositRequests.get(id)) {
      case (?req) { req };
      case (null) { Runtime.trap("Deposit request not found") };
    };

    if (request.status != #pending) {
      Runtime.trap("Deposit request already processed");
    };

    let updatedRequest = { request with status = #rejected; adminNote = note };
    depositRequests.add(id, updatedRequest);
  };

  public shared ({ caller }) func approveWithdrawRequest(id : RequestId) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve withdraw requests");
    };

    let request = switch (withdrawRequests.get(id)) {
      case (?req) { req };
      case (null) { Runtime.trap("Withdraw request not found") };
    };

    if (request.status != #pending) {
      Runtime.trap("Withdraw request already processed");
    };

    var player = getPlayer(request.playerId);

    if (player.winningBalance < request.amount) {
      Runtime.trap("Player has insufficient balance for withdrawal");
    };

    player := { player with winningBalance = player.winningBalance - request.amount };
    players.add(player.id, player);

    let txId = nextTxId;
    nextTxId += 1;
    let tx : WalletTransaction = {
      id = txId;
      userId = player.id;
      amount = request.amount;
      txType = #debit;
      description = "Withdraw approved (UPI " # request.upiId # ")";
      timestamp = Time.now();
    };
    walletTransactions.add(txId, tx);

    let updatedRequest = { request with status = #approved };
    withdrawRequests.add(id, updatedRequest);
  };

  public shared ({ caller }) func rejectWithdrawRequest(id : RequestId, note : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject withdraw requests");
    };

    let request = switch (withdrawRequests.get(id)) {
      case (?req) { req };
      case (null) { Runtime.trap("Withdraw request not found") };
    };

    if (request.status != #pending) {
      Runtime.trap("Withdraw request already processed");
    };

    let updatedRequest = { request with status = #rejected; adminNote = note };
    withdrawRequests.add(id, updatedRequest);
  };

  public query ({ caller }) func getAdminDashboard() : async (Nat, Nat, Nat) {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can access dashboard");
    };

    let totalPlayers = players.size();
    let totalMatches = matches.size();

    var totalRevenue : Nat = 0;
    for ((_, match) in matches.entries()) {
      switch (match.matchType) {
        case (#paid) {
          totalRevenue += match.entryFee * match.playerIds.size();
        };
        case (#free) {};
      };
    };

    (totalPlayers, totalMatches, totalRevenue);
  };
};
