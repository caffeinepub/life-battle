import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { useActor } from "./useActor";

// ─── Player queries ─────────────────────────────────────────────

export function useGetMatches() {
  const { actor, isFetching } = useActor();
  return useQuery<Match[]>({
    queryKey: ["matches"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMatches();
    },
    enabled: !!actor && !isFetching,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useGetCallerProfile() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerProfile"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCallerRole() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["callerRole"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getCallerUserRole();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPlayerDetails(playerId: number | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Player>({
    queryKey: ["player", playerId],
    queryFn: async () => {
      if (!actor || playerId === undefined)
        throw new Error("No actor or playerId");
      return actor.getPlayerDetails(playerId);
    },
    enabled: !!actor && !isFetching && playerId !== undefined,
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
  });
}

export function useGetWalletTransactions(playerId: number | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<WalletTransaction[]>({
    queryKey: ["walletTx", playerId],
    queryFn: async () => {
      if (!actor || playerId === undefined) return [];
      return actor.getWalletTransactions(playerId);
    },
    enabled: !!actor && !isFetching && playerId !== undefined,
  });
}

export function useGetLeaderboard() {
  const { actor, isFetching } = useActor();
  // Returns [playerId, username, matchesPlayed, totalKills, wins]
  return useQuery<Array<[number, string, bigint, bigint, bigint]>>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard() as unknown as Promise<
        Array<[number, string, bigint, bigint, bigint]>
      >;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllPlayers() {
  const { actor, isFetching } = useActor();
  return useQuery<Player[]>({
    queryKey: ["allPlayers"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllPlayers();
    },
    enabled: !!actor && !isFetching,
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
  });
}

export function useGetAdminDashboard() {
  const { actor, isFetching } = useActor();
  return useQuery<[bigint, bigint, bigint]>({
    queryKey: ["adminDashboard"],
    queryFn: async () => {
      if (!actor) return [0n, 0n, 0n];
      return actor.getAdminDashboard();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Wallet / Deposit / Withdraw queries ─────────────────────────

export function useGetPlayerDepositRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<DepositRequest[]>({
    queryKey: ["playerDepositRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPlayerDepositRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetPlayerWithdrawRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<WithdrawRequest[]>({
    queryKey: ["playerWithdrawRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getPlayerWithdrawRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDepositRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<DepositRequest[]>({
    queryKey: ["depositRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getDepositRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetWithdrawRequests() {
  const { actor, isFetching } = useActor();
  return useQuery<WithdrawRequest[]>({
    queryKey: ["withdrawRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getWithdrawRequests();
    },
    enabled: !!actor && !isFetching,
  });
}

// ─── Mutations ────────────────────────────────────────────────────

export function useRegisterPlayer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      email,
    }: { username: string; email: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.registerPlayer(username, email);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerProfile"] });
    },
  });
}

export function useSaveCallerProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      username,
      playerId,
      email,
    }: { username: string; playerId?: number; email?: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile({
        username,
        playerId,
        email: email ?? "",
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["callerProfile"] });
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
      qc.invalidateQueries({ queryKey: ["player"] });
    },
  });
}

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

export function useAdjustWallet() {
  const { actor } = useActor();
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
      if (!actor) throw new Error("Not connected");
      return actor.adjustPlayerWallet(playerId, amount, description);
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["player", variables.playerId] });
      qc.invalidateQueries({ queryKey: ["walletTx", variables.playerId] });
    },
  });
}

export function useSubmitDepositRequest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      transactionId,
    }: { amount: bigint; transactionId: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.submitDepositRequest(amount, transactionId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playerDepositRequests"] });
      qc.invalidateQueries({ queryKey: ["walletTx"] });
    },
  });
}

export function useSubmitWithdrawRequest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      amount,
      upiId,
    }: { amount: bigint; upiId: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.submitWithdrawRequest(amount, upiId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["playerWithdrawRequests"] });
      qc.invalidateQueries({ queryKey: ["walletTx"] });
    },
  });
}

export function useApproveDepositRequest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: RequestId) => {
      if (!actor) throw new Error("Not connected");
      return actor.approveDepositRequest(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["depositRequests"] });
      qc.invalidateQueries({ queryKey: ["player"] });
    },
  });
}

export function useRejectDepositRequest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: RequestId; note: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.rejectDepositRequest(id, note);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["depositRequests"] });
    },
  });
}

export function useApproveWithdrawRequest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: RequestId) => {
      if (!actor) throw new Error("Not connected");
      return actor.approveWithdrawRequest(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["withdrawRequests"] });
      qc.invalidateQueries({ queryKey: ["player"] });
    },
  });
}

export function useRejectWithdrawRequest() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, note }: { id: RequestId; note: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.rejectWithdrawRequest(id, note);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["withdrawRequests"] });
    },
  });
}
