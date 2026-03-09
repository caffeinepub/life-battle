import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type PlayerId = number;
export interface Player {
    id: PlayerId;
    referralCode: string;
    username: string;
    wins: bigint;
    referredBy?: string;
    totalEarnings: bigint;
    matchesPlayed: bigint;
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
export interface Match {
    id: MatchId;
    playerIds: Uint32Array;
    matchType: MatchType;
    status: MatchStatus;
    title: string;
    winnerId?: PlayerId;
    prizeAmount: bigint;
    entryFee: bigint;
    roomId: string;
    scheduledAt: Time;
}
export type MatchId = number;
export interface UserProfile {
    username: string;
    playerId?: PlayerId;
}
export enum MatchStatus {
    upcoming = "upcoming",
    live = "live",
    completed = "completed"
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
export interface backendInterface {
    adjustPlayerWallet(playerId: PlayerId, amount: bigint, description: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createMatch(title: string, matchType: MatchType, entryFee: bigint, prizeAmount: bigint, scheduledAt: Time, roomId: string): Promise<MatchId>;
    deleteMatch(matchId: MatchId): Promise<void>;
    getAdminDashboard(): Promise<[bigint, bigint, bigint]>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getLeaderboard(): Promise<Array<[string, bigint | null]>>;
    getMatches(): Promise<Array<Match>>;
    getPlayerDetails(playerId: PlayerId): Promise<Player>;
    getPlayerMatches(playerId: PlayerId): Promise<Array<Match>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getWalletTransactions(playerId: PlayerId): Promise<Array<WalletTransaction>>;
    isCallerAdmin(): Promise<boolean>;
    joinMatch(matchId: MatchId): Promise<void>;
    registerPlayer(username: string): Promise<PlayerId>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    setMatchResult(matchId: MatchId, winnerId: PlayerId): Promise<void>;
    updateMatch(matchId: MatchId, title: string, matchType: MatchType, entryFee: bigint, prizeAmount: bigint, scheduledAt: Time, roomId: string, status: MatchStatus): Promise<void>;
}
