import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Player {
    id: PlayerId;
    referralCode: string;
    username: string;
    winningBalance: bigint;
    wins: bigint;
    email: string;
    referredBy?: string;
    totalEarnings: bigint;
    matchesPlayed: bigint;
    totalKills: bigint;
    walletBalance: bigint;
}
export type Time = bigint;
export type TxId = number;
export interface WalletTransaction {
    id: TxId;
    userId: PlayerId;
    description: string;
    timestamp: Time;
    txType: TxType;
    amount: bigint;
}
export interface WithdrawRequest {
    id: RequestId;
    status: Variant_pending_approved_rejected;
    playerId: PlayerId;
    adminNote: string;
    timestamp: Time;
    upiId: string;
    amount: bigint;
}
export type MatchId = number;
export interface Match {
    id: MatchId;
    playerIds: Uint32Array;
    matchType: MatchType;
    status: MatchStatus;
    title: string;
    mapName: string;
    totalPlayers: bigint;
    prizeAmount: bigint;
    roomPassword: string;
    resultKills: bigint;
    winnerName: string;
    matchSubType: MatchSubType;
    entryFee: bigint;
    roomId: string;
    scheduledAt: Time;
}
export type PlayerId = number;
export interface DepositRequest {
    id: RequestId;
    status: Variant_pending_approved_rejected;
    playerId: PlayerId;
    adminNote: string;
    timestamp: Time;
    amount: bigint;
    transactionId: string;
}
export type RequestId = number;
export interface UserProfile {
    username: string;
    playerId?: PlayerId;
    email: string;
}
export enum MatchStatus {
    upcoming = "upcoming",
    completed = "completed",
    ongoing = "ongoing"
}
export enum MatchSubType {
    lossToWin = "lossToWin",
    lonewolf1v1 = "lonewolf1v1",
    lonewolf2v2 = "lonewolf2v2",
    cs1v1 = "cs1v1",
    cs2v2 = "cs2v2",
    cs4v4 = "cs4v4",
    perKill = "perKill",
    survival = "survival"
}
export enum MatchType {
    free = "free",
    paid = "paid"
}
export enum TxType {
    credit = "credit",
    debit = "debit"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_pending_approved_rejected {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export interface backendInterface {
    adjustPlayerWallet(playerId: PlayerId, amount: bigint, description: string): Promise<void>;
    approveDepositRequest(id: RequestId): Promise<void>;
    approveWithdrawRequest(id: RequestId): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createMatch(title: string, matchType: MatchType, matchSubType: MatchSubType, mapName: string, totalPlayers: bigint, entryFee: bigint, prizeAmount: bigint, scheduledAt: Time, roomId: string, roomPassword: string): Promise<MatchId>;
    deleteMatch(matchId: MatchId): Promise<void>;
    getAdminDashboard(): Promise<[bigint, bigint, bigint]>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDepositRequests(): Promise<Array<DepositRequest>>;
    getLeaderboard(): Promise<Array<[string, bigint, bigint, bigint]>>;
    getMatchRoomDetails(matchId: MatchId): Promise<[string, string] | null>;
    getMatches(): Promise<Array<Match>>;
    getPlayerDepositRequests(): Promise<Array<DepositRequest>>;
    getPlayerDetails(playerId: PlayerId): Promise<Player>;
    getPlayerMatches(playerId: PlayerId): Promise<Array<Match>>;
    getPlayerWithdrawRequests(): Promise<Array<WithdrawRequest>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWalletTransactions(playerId: PlayerId): Promise<Array<WalletTransaction>>;
    getWithdrawRequests(): Promise<Array<WithdrawRequest>>;
    isCallerAdmin(): Promise<boolean>;
    joinMatch(matchId: MatchId): Promise<void>;
    registerPlayer(username: string, email: string): Promise<PlayerId>;
    rejectDepositRequest(id: RequestId, note: string): Promise<void>;
    rejectWithdrawRequest(id: RequestId, note: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setMatchResult(matchId: MatchId, winnerName: string, resultKills: bigint): Promise<void>;
    submitDepositRequest(amount: bigint, transactionId: string): Promise<RequestId>;
    submitWithdrawRequest(amount: bigint, upiId: string): Promise<RequestId>;
    updateMatch(matchId: MatchId, title: string, matchType: MatchType, matchSubType: MatchSubType, mapName: string, totalPlayers: bigint, entryFee: bigint, prizeAmount: bigint, scheduledAt: Time, roomId: string, roomPassword: string, status: MatchStatus): Promise<void>;
}
