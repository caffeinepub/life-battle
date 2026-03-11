import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Nat32 "mo:core/Nat32";
import List "mo:core/List";
import Time "mo:core/Time";

module {
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

  type OldPlayer = {
    id : PlayerId;
    username : Text;
    email : Text;
    walletBalance : Nat;
    referralCode : Text;
    referredBy : ?Text;
    matchesPlayed : Nat;
    wins : Nat;
    totalKills : Nat;
    totalEarnings : Nat;
  };

  type OldActor = {
    players : Map.Map<PlayerId, OldPlayer>;
    matches : Map.Map<MatchId, Match>;
    walletTransactions : Map.Map<TxId, WalletTransaction>;
    userProfiles : Map.Map<Principal, UserProfile>;
    principalToPlayerId : Map.Map<Principal, PlayerId>;
    nextPlayerId : PlayerId;
    nextMatchId : MatchId;
    nextTxId : TxId;
  };

  type NewActor = {
    players : Map.Map<PlayerId, Player>;
    matches : Map.Map<MatchId, Match>;
    walletTransactions : Map.Map<TxId, WalletTransaction>;
    depositRequests : Map.Map<RequestId, DepositRequest>;
    withdrawRequests : Map.Map<RequestId, WithdrawRequest>;
    userProfiles : Map.Map<Principal, UserProfile>;
    principalToPlayerId : Map.Map<Principal, PlayerId>;
    nextPlayerId : PlayerId;
    nextMatchId : MatchId;
    nextTxId : TxId;
    nextDepositRequestId : RequestId;
    nextWithdrawRequestId : RequestId;
  };

  public func run(old : OldActor) : NewActor {
    let newPlayers = old.players.map<PlayerId, OldPlayer, Player>(
      func(_id, oldPlayer) {
        { oldPlayer with winningBalance = 0 };
      }
    );

    let emptyDepositRequests = Map.empty<RequestId, DepositRequest>();
    let emptyWithdrawRequests = Map.empty<RequestId, WithdrawRequest>();

    {
      old with
      players = newPlayers;
      depositRequests = emptyDepositRequests;
      withdrawRequests = emptyWithdrawRequests;
      nextDepositRequestId = 1;
      nextWithdrawRequestId = 1;
    };
  };
};
