import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { backendInterface } from "../backend";
import { createActorWithConfig } from "../config";
import { getSecretParameter } from "../utils/urlParams";
import { useInternetIdentity } from "./useInternetIdentity";

const ACTOR_QUERY_KEY = "actor";
export function useActor() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const invalidatedRef = useRef(false);
  const prevIdentityRef = useRef(identity);

  const actorQuery = useQuery<backendInterface>({
    queryKey: [ACTOR_QUERY_KEY, identity?.getPrincipal().toString()],
    queryFn: async () => {
      const isAuthenticated = !!identity;

      if (!isAuthenticated) {
        return await createActorWithConfig();
      }

      const actorOptions = {
        agentOptions: {
          identity,
        },
      };

      const actor = await createActorWithConfig(actorOptions);

      // Only call admin initialization when an admin token is explicitly provided
      const adminToken = getSecretParameter("caffeineAdminToken");
      if (adminToken) {
        try {
          await actor._initializeAccessControlWithSecret(adminToken);
        } catch {
          // Ignore admin init errors for regular users
        }
      }

      return actor;
    },
    staleTime: Number.POSITIVE_INFINITY,
    enabled: true,
  });

  // Reset invalidation flag when identity changes so queries refresh on re-login
  if (prevIdentityRef.current !== identity) {
    prevIdentityRef.current = identity;
    invalidatedRef.current = false;
  }

  // Invalidate dependent queries only once when actor first becomes available
  useEffect(() => {
    if (actorQuery.data && !invalidatedRef.current) {
      invalidatedRef.current = true;
      queryClient.invalidateQueries({
        predicate: (query) => !query.queryKey.includes(ACTOR_QUERY_KEY),
      });
    }
  }, [actorQuery.data, queryClient]);

  return {
    actor: actorQuery.data || null,
    isFetching: actorQuery.isFetching,
  };
}
