import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Match,
  MatchStatus,
  MatchType,
  Player,
  WalletTransaction,
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
  return useQuery<Array<[string, bigint | null]>>({
    queryKey: ["leaderboard"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getLeaderboard();
    },
    enabled: !!actor && !isFetching,
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

// ─── Mutations ────────────────────────────────────────────────────

export function useRegisterPlayer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ username }: { username: string }) => {
      if (!actor) throw new Error("Not connected");
      return actor.registerPlayer(username);
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
    }: { username: string; playerId?: number }) => {
      if (!actor) throw new Error("Not connected");
      return actor.saveCallerUserProfile({ username, playerId });
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
      entryFee: bigint;
      prizeAmount: bigint;
      scheduledAt: bigint;
      roomId: string;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.createMatch(
        data.title,
        data.matchType,
        data.entryFee,
        data.prizeAmount,
        data.scheduledAt,
        data.roomId,
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
      entryFee: bigint;
      prizeAmount: bigint;
      scheduledAt: bigint;
      roomId: string;
      status: MatchStatus;
    }) => {
      if (!actor) throw new Error("Not connected");
      return actor.updateMatch(
        data.matchId,
        data.title,
        data.matchType,
        data.entryFee,
        data.prizeAmount,
        data.scheduledAt,
        data.roomId,
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
      winnerId,
    }: { matchId: number; winnerId: number }) => {
      if (!actor) throw new Error("Not connected");
      return actor.setMatchResult(matchId, winnerId);
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
