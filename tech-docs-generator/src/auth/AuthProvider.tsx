import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { isAppAdmin } from "../lib/authRoles";
import { getAuthSupabaseClient } from "../lib/supabaseClient";

export type DocsSessionUser = {
  id: string;
  email: string;
  isAdmin: boolean;
};

export type DocsSessionState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | { status: "authenticated"; user: DocsSessionUser };

const SessionContext = createContext<DocsSessionState>({ status: "loading" });

function toSessionUser(user: User): DocsSessionUser {
  return {
    id: user.id,
    email: user.email ?? "",
    isAdmin: isAppAdmin(user),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DocsSessionState>({ status: "loading" });

  useEffect(() => {
    let mounted = true;
    let subscriptionFired = false;
    const supabase = getAuthSupabaseClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }
      subscriptionFired = true;
      setState(
        session?.user
          ? { status: "authenticated", user: toSessionUser(session.user) }
          : { status: "unauthenticated" },
      );
    });

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted || subscriptionFired) {
          return;
        }
        setState(
          data.session?.user
            ? {
                status: "authenticated",
                user: toSessionUser(data.session.user),
              }
            : { status: "unauthenticated" },
        );
      })
      .catch(() => {
        if (!mounted || subscriptionFired) {
          return;
        }
        setState({ status: "unauthenticated" });
      });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SessionContext.Provider value={state}>{children}</SessionContext.Provider>
  );
}

export function useSession(): DocsSessionState {
  return useContext(SessionContext);
}

export async function signOutDocsSession(): Promise<void> {
  await getAuthSupabaseClient().auth.signOut();
}
