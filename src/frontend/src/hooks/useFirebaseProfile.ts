import { useQuery } from "@tanstack/react-query";
import { get, ref, runTransaction, set, update } from "firebase/database";
import { db } from "../lib/firebase";

export interface FirebasePlayerProfile {
  username: string;
  email: string;
  playerId: number;
  bio: string;
  walletBalance: number;
  winningBalance: number;
  totalEarnings: number;
  totalKills: number;
  matchesPlayed: number;
  wins: number;
  kycStatus: "none" | "pending" | "approved" | "rejected";
  referralCode: string;
  referredBy?: string;
}

export function useFirebaseProfile(uid: string | undefined) {
  const query = useQuery<FirebasePlayerProfile | null>({
    queryKey: ["fbProfile", uid],
    queryFn: async () => {
      if (!uid) return null;
      const snap = await get(ref(db, `players/${uid}`));
      if (!snap.exists()) return null;
      return snap.val() as FirebasePlayerProfile;
    },
    enabled: !!uid,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}

export async function createPlayerProfile(
  uid: string,
  username: string,
  email: string,
): Promise<number> {
  const countRef = ref(db, "playerCount");
  let newPlayerId = 1001;

  await runTransaction(countRef, (current) => {
    newPlayerId = (current ?? 1000) + 1;
    return newPlayerId;
  });

  const profile: FirebasePlayerProfile = {
    username,
    email,
    playerId: newPlayerId,
    bio: "",
    walletBalance: 0,
    winningBalance: 0,
    totalEarnings: 0,
    totalKills: 0,
    matchesPlayed: 0,
    wins: 0,
    kycStatus: "none",
    referralCode: `LB${newPlayerId}`,
  };

  await Promise.all([
    set(ref(db, `players/${uid}`), profile),
    set(ref(db, `playerById/${newPlayerId}`), uid),
  ]);

  return newPlayerId;
}

export async function updatePlayerProfile(
  uid: string,
  data: Partial<FirebasePlayerProfile>,
): Promise<void> {
  await update(ref(db, `players/${uid}`), data);
}
