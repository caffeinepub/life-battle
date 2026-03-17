import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  equalTo,
  get,
  orderByChild,
  query,
  ref,
  runTransaction,
  set,
  update,
} from "firebase/database";
import type {
  DepositRequest,
  Match,
  MatchStatus,
  MatchSubType,
  MatchType,
  Player,
  RequestId,
  WalletTransaction,
  WithdrawRequest,
} from "../backend.d";
import { db } from "../lib/firebase";
import { useActor } from "./useActor";
import { useFirebaseAuth } from "./useFirebaseAuth";
import { updatePlayerProfile, useFirebaseProfile } from "./useFirebaseProfile";

// ─── Helpers ─────────────────────────────────────────────────────

function convertToPlayer(data: any): Player {
  return {
    id: data.playerId as number,
    username: data.username ?? "",
    email: data.email ?? "",
    winningBalance: BigInt(Math.round(data.winningBalance ?? 0)),
    walletBalance: BigInt(Math.round(data.walletBalance ?? 0)),
    wins: BigInt(Math.round(data.wins ?? 0)),
    totalEarnings: BigInt(Math.round(data.totalEarnings ?? 0)),
    matchesPlayed: BigInt(Math.round(data.matchesPlayed ?? 0)),
    totalKills: BigInt(Math.round(data.totalKills ?? 0)),
    referralCode: data.referralCode ?? "",
    referredBy: data.referredBy,
  };
}

function convertToDepositRequest(data: any): DepositRequest {
  return {
    id: data.id as number,
    playerId: data.playerId as number,
    amount: BigInt(Math.round(data.amount ?? 0)),
    transactionId: data.transactionId ?? "",
    status: data.status,
    timestamp: BigInt(data.timestamp ?? 0),
    adminNote: data.adminNote ?? "",
  };
}

function convertToWithdrawRequest(data: any): WithdrawRequest {
  return {
    id: data.id as number,
    playerId: data.playerId as number,
    amount: BigInt(Math.round(data.amount ?? 0)),
    upiId: data.upiId ?? "",
    status: data.status,
    timestamp: BigInt(data.timestamp ?? 0),
    adminNote: data.adminNote ?? "",
  };
}

// ─── Auth / Profile queries (Firebase) ─────────────────────────

export function useGetCallerProfile() {
  const { user, isLoading: authLoading } = useFirebaseAuth();
  const { profile, isLoading: profileLoading } = useFirebaseProfile(user?.uid);

  return {
    data: profile
      ? {
          username: profile.username,
          email: profile.email,
          playerId: profile.playerId,
        }
      : null,
    isLoading: authLoading || (!!user && profileLoading),
  };
}

export function useGetCallerRole() {
  return useQuery({
    queryKey: ["callerRole"],
    queryFn: async () => null,
    staleTime: Number.POSITIVE_INFINITY,
  });
}

// ─── Player queries (Firebase) ─────────────────────────────────

export function useGetPlayerDetails(playerId: number | undefined) {
  return useQuery<Player>({
    queryKey: ["player", playerId],
    queryFn: async () => {
      if (playerId === undefined) throw new Error("No playerId");
      const uidSnap = await get(ref(db, `playerById/${playerId}`));
      if (!uidSnap.exists()) throw new Error("Player not found");
      const uid = uidSnap.val();
      const playerSnap = await get(ref(db, `players/${uid}`));
      if (!playerSnap.exists()) throw new Error("Player data not found");
      return convertToPlayer(playerSnap.val());
    },
    enabled: playerId !== undefined,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useGetAllPlayers() {
  return useQuery<Player[]>({
    queryKey: ["allPlayers"],
    queryFn: async () => {
      const snap = await get(ref(db, "players"));
      if (!snap.exists()) return [];
      const data = snap.val();
      return Object.values(data).map((p) => convertToPlayer(p as any));
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

// ─── Wallet / Transactions (Firebase) ─────────────────────────

export function useGetWalletTransactions(playerId: number | undefined) {
  const { user } = useFirebaseAuth();
  return useQuery<WalletTransaction[]>({
    queryKey: ["walletTx", playerId],
    queryFn: async () => {
      if (!user || playerId === undefined) return [];
      const snap = await get(ref(db, `transactions/${user.uid}`));
      if (!snap.exists()) return [];
      const data = snap.val();
      return Object.values(data).map((tx: any) => ({
        id: tx.id as number,
        userId: tx.userId as number,
        description: tx.description ?? "",
        timestamp: BigInt(tx.timestamp ?? 0),
        txType: tx.txType,
        amount: BigInt(Math.round(tx.amount ?? 0)),
      })) as WalletTransaction[];
    },
    enabled: !!user && playerId !== undefined,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useGetPlayerDepositRequests() {
  const { user } = useFirebaseAuth();
  return useQuery<DepositRequest[]>({
    queryKey: ["playerDepositRequests"],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        ref(db, "depositRequests"),
        orderByChild("uid"),
        equalTo(user.uid),
      );
      const snap = await get(q);
      if (!snap.exists()) return [];
      return Object.values(snap.val()).map(convertToDepositRequest);
    },
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useGetPlayerWithdrawRequests() {
  const { user } = useFirebaseAuth();
  return useQuery<WithdrawRequest[]>({
    queryKey: ["playerWithdrawRequests"],
    queryFn: async () => {
      if (!user) return [];
      const q = query(
        ref(db, "withdrawRequests"),
        orderByChild("uid"),
        equalTo(user.uid),
      );
      const snap = await get(q);
      if (!snap.exists()) return [];
      return Object.values(snap.val()).map(convertToWithdrawRequest);
    },
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useGetDepositRequests() {
  return useQuery<DepositRequest[]>({
    queryKey: ["depositRequests"],
    queryFn: async () => {
      const snap = await get(ref(db, "depositRequests"));
      if (!snap.exists()) return [];
      return Object.values(snap.val()).map(convertToDepositRequest);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useGetWithdrawRequests() {
  return useQuery<WithdrawRequest[]>({
    queryKey: ["withdrawRequests"],
    queryFn: async () => {
      const snap = await get(ref(db, "withdrawRequests"));
      if (!snap.exists()) return [];
      return Object.values(snap.val()).map(convertToWithdrawRequest);
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useGetAdminDashboard() {
  return useQuery<[bigint, bigint, bigint]>({
    queryKey: ["adminDashboard"],
    queryFn: async () => {
      const [playersSnap, depositsSnap, withdrawalsSnap] = await Promise.all([
        get(ref(db, "players")),
        get(ref(db, "depositRequests")),
        get(ref(db, "withdrawRequests")),
      ]);

      const playerCount = playersSnap.exists()
        ? Object.keys(playersSnap.val()).length
        : 0;

      const deposits: any[] = depositsSnap.exists()
        ? Object.values(depositsSnap.val())
        : [];
      const withdrawals: any[] = withdrawalsSnap.exists()
        ? Object.values(withdrawalsSnap.val())
        : [];

      const totalDeposits = deposits
        .filter((d) => d.status === "approved")
        .reduce((sum, d) => sum + (d.amount ?? 0), 0);

      const totalWithdrawals = withdrawals
        .filter((w) => w.status === "approved")
        .reduce((sum, w) => sum + (w.amount ?? 0), 0);

      return [
        BigInt(playerCount),
        BigInt(Math.round(totalDeposits)),
        BigInt(Math.round(totalWithdrawals)),
      ];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

// ─── Match queries (Motoko actor) ─────────────────────────────────

export function useGetMatches() {
  const { actor, isFetching } = useActor();
  return useQuery<Match[]>({
    queryKey: ["matches"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMatches();
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

export function useGetLeaderboard() {
  return useQuery<Array<[number, string, bigint, bigint, bigint]>>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      const snap = await get(ref(db, "players"));
      if (!snap.exists()) return [];
      const players: Array<[number, string, bigint, bigint, bigint]> =
        Object.values(snap.val()).map((p: any) => [
          p.playerId as number,
          p.username ?? "",
          BigInt(Math.round(p.matchesPlayed ?? 0)),
          BigInt(Math.round(p.totalKills ?? 0)),
          BigInt(Math.round(p.wins ?? 0)),
        ]);
      players.sort((a, b) => {
        const winDiff = Number(b[4]) - Number(a[4]);
        if (winDiff !== 0) return winDiff;
        return Number(b[3]) - Number(a[3]);
      });
      return players;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useGetMatchRoomDetails(matchId: number | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<[string, string] | null>({
    queryKey: ["matchRoomDetails", matchId],
    queryFn: async () => {
      if (!actor || matchId === undefined) return null;
      return actor.getMatchRoomDetails(matchId);
    },
    enabled: !!actor && !isFetching && matchId !== undefined,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

export function useGetPlayerMatches(playerId: number | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Match[]>({
    queryKey: ["playerMatches", playerId],
    queryFn: async () => {
      if (!actor || playerId === undefined) return [];
      return actor.getPlayerMatches(playerId);
    },
    enabled: !!actor && !isFetching && playerId !== undefined,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}

// ─── Match mutations (Motoko actor) ──────────────────────────────

export function useCreateMatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      title: string;
      matchType: MatchType;
      matchSubType: MatchSubType;
      mapName: string;
      totalPlayers: bigint;
      entryFee: bigint;
      prizeAmount: bigint;
      scheduledAt: bigint;
      roomId: string;
      roomPassword: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createMatch(
        data.title,
        data.matchType,
        data.matchSubType as any,
        data.mapName,
        data.totalPlayers,
        data.entryFee,
        data.prizeAmount,
        data.scheduledAt,
        data.roomId,
        data.roomPassword,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
  });
}

export function useUpdateMatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      matchId: number;
      title: string;
      matchType: MatchType;
      matchSubType: MatchSubType;
      mapName: string;
      totalPlayers: bigint;
      entryFee: bigint;
      prizeAmount: bigint;
      scheduledAt: bigint;
      roomId: string;
      roomPassword: string;
      status: MatchStatus;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateMatch(
        data.matchId,
        data.title,
        data.matchType,
        data.matchSubType as any,
        data.mapName,
        data.totalPlayers,
        data.entryFee,
        data.prizeAmount,
        data.scheduledAt,
        data.roomId,
        data.roomPassword,
        data.status,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useDeleteMatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: number) => {
      if (!actor) throw new Error("Not connected");
      return actor.deleteMatch(matchId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
      qc.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
  });
}

export function useJoinMatch() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (matchId: number) => {
      if (!actor) throw new Error("Not connected");
      return actor.joinMatch(matchId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

export function useSetMatchResult() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      matchId,
      winnerName,
      resultKills,
    }: { matchId: number; winnerName: string; resultKills: bigint }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setMatchResult(matchId, winnerName, resultKills);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["matches"] });
    },
  });
}

// ─── Profile mutations (Firebase) ────────────────────────────────

export function useRegisterPlayer() {
  const { user } = useFirebaseAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      email,
    }: { username: string; email: string }) => {
      if (!user) throw new Error("Not logged in");
      // Import here to avoid circular deps; createPlayerProfile is used directly in LoginPage
      const { createPlayerProfile } = await import("./useFirebaseProfile");
      return createPlayerProfile(user.uid, username, email);
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: ["fbProfile", user.uid] });
    },
  });
}

export function useSaveCallerProfile() {
  const { user } = useFirebaseAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      email,
    }: { username: string; playerId?: number; email?: string }) => {
      if (!user) throw new Error("Not logged in");
      await updatePlayerProfile(user.uid, {
        username,
        ...(email ? { email } : {}),
      });
    },
    onSuccess: () => {
      if (user) qc.invalidateQueries({ queryKey: ["fbProfile", user.uid] });
    },
  });
}

// ─── Wallet mutations (Firebase) ─────────────────────────────────

export function useSubmitDepositRequest() {
  const { user } = useFirebaseAuth();
  const { profile } = useFirebaseProfile(user?.uid);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      transactionId,
    }: { amount: bigint; transactionId: string }) => {
      if (!user || !profile) throw new Error("Not logged in");
      const id = Date.now();
      await set(ref(db, `depositRequests/${id}`), {
        id,
        uid: user.uid,
        playerId: profile.playerId,
        amount: Number(amount),
        transactionId,
        status: "pending",
        timestamp: id,
        adminNote: "",
      });
      return id as RequestId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playerDepositRequests"] });
    },
  });
}

export function useSubmitWithdrawRequest() {
  const { user } = useFirebaseAuth();
  const { profile } = useFirebaseProfile(user?.uid);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      upiId,
    }: { amount: bigint; upiId: string }) => {
      if (!user || !profile) throw new Error("Not logged in");
      const id = Date.now();
      await set(ref(db, `withdrawRequests/${id}`), {
        id,
        uid: user.uid,
        playerId: profile.playerId,
        amount: Number(amount),
        upiId,
        status: "pending",
        timestamp: id,
        adminNote: "",
      });
      return id as RequestId;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playerWithdrawRequests"] });
    },
  });
}

export function useAdjustWallet() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      playerId,
      amount,
      description,
    }: {
      playerId: number;
      amount: bigint;
      description: string;
    }) => {
      const uidSnap = await get(ref(db, `playerById/${playerId}`));
      if (!uidSnap.exists()) throw new Error("Player not found");
      const uid = uidSnap.val();
      const numAmount = Number(amount);
      const playerRef = ref(db, `players/${uid}`);
      await runTransaction(playerRef, (player) => {
        if (player) {
          if (numAmount >= 0) {
            player.walletBalance = (player.walletBalance ?? 0) + numAmount;
          } else {
            player.walletBalance = Math.max(
              0,
              (player.walletBalance ?? 0) + numAmount,
            );
          }
        }
        return player;
      });
      const txId = Date.now();
      await set(ref(db, `transactions/${uid}/${txId}`), {
        id: txId,
        userId: playerId,
        description,
        timestamp: txId,
        txType: numAmount >= 0 ? "credit" : "debit",
        amount: Math.abs(numAmount),
      });
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["player", variables.playerId] });
      qc.invalidateQueries({ queryKey: ["allPlayers"] });
    },
  });
}

export function useApproveDepositRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: RequestId) => {
      const reqSnap = await get(ref(db, `depositRequests/${id}`));
      if (!reqSnap.exists()) throw new Error("Request not found");
      const req = reqSnap.val();
      const { uid, amount } = req;

      await update(ref(db, `depositRequests/${id}`), { status: "approved" });

      const playerRef = ref(db, `players/${uid}`);
      await runTransaction(playerRef, (player) => {
        if (player) {
          player.walletBalance = (player.walletBalance ?? 0) + amount;
        }
        return player;
      });

      const txId = Date.now();
      await set(ref(db, `transactions/${uid}/${txId}`), {
        id: txId,
        userId: req.playerId,
        description: `Deposit approved: \u20b9${amount}`,
        timestamp: txId,
        txType: "credit",
        amount,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["depositRequests"] });
      qc.invalidateQueries({ queryKey: ["allPlayers"] });
    },
  });
}

export function useRejectDepositRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: RequestId; note: string }) => {
      await update(ref(db, `depositRequests/${id}`), {
        status: "rejected",
        adminNote: note,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["depositRequests"] });
    },
  });
}

export function useApproveWithdrawRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: RequestId) => {
      const reqSnap = await get(ref(db, `withdrawRequests/${id}`));
      if (!reqSnap.exists()) throw new Error("Request not found");
      const req = reqSnap.val();
      const { uid, amount } = req;

      await update(ref(db, `withdrawRequests/${id}`), { status: "approved" });

      const playerRef = ref(db, `players/${uid}`);
      await runTransaction(playerRef, (player) => {
        if (player) {
          player.winningBalance = Math.max(
            0,
            (player.winningBalance ?? 0) - amount,
          );
        }
        return player;
      });

      const txId = Date.now();
      await set(ref(db, `transactions/${uid}/${txId}`), {
        id: txId,
        userId: req.playerId,
        description: `Withdrawal approved: \u20b9${amount} to ${req.upiId}`,
        timestamp: txId,
        txType: "debit",
        amount,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["withdrawRequests"] });
      qc.invalidateQueries({ queryKey: ["allPlayers"] });
    },
  });
}

export function useRejectWithdrawRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: RequestId; note: string }) => {
      await update(ref(db, `withdrawRequests/${id}`), {
        status: "rejected",
        adminNote: note,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["withdrawRequests"] });
    },
  });
}
