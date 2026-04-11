import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { User } from "firebase/auth";

import { isFirebaseConfigured } from "@/firebase/config";
import {
  createUserProfile,
  getUserProfile,
  seedDummyProducts,
} from "@/services/firestoreService";
import {
  loginWithEmail,
  logout,
  registerWithEmail,
  subscribeAuth,
} from "@/services/authService";
import { UserProfile } from "@/types";

interface AuthContextValue {
  authUser: User | null;
  profile: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: "owner" | "kasir") => Promise<void>;
  signOutUser: () => Promise<void>;
  refreshProfile: (userId?: string) => Promise<UserProfile | null>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = async (userId?: string): Promise<UserProfile | null> => {
    const resolvedUserId = userId ?? authUser?.uid;
    if (!resolvedUserId) {
      setProfile(null);
      return null;
    }

    const nextProfile = await getUserProfile(resolvedUserId);
    setProfile(nextProfile);
    return nextProfile;
  };

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeAuth(async (user) => {
      setAuthUser(user);

      if (!user) {
        setProfile(null);
        setIsLoading(false);
        return;
      }

      await createUserProfile(user.uid, user.email ?? "");
      const nextProfile = await refreshProfile(user.uid);
      if (nextProfile?.role === "kasir" && nextProfile.isActive === false) {
        await logout();
        setProfile(null);
        setAuthUser(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = useMemo(
    () => ({
      authUser,
      profile,
      isLoading,
      login: async (email, password) => {
        if (!isFirebaseConfigured) {
          throw new Error("Firebase belum dikonfigurasi.");
        }

        setIsLoading(true);
        try {
          await loginWithEmail(email, password);
        } finally {
          setIsLoading(false);
        }
      },
      register: async (email, password, role = "owner") => {
        if (!isFirebaseConfigured) {
          throw new Error("Firebase belum dikonfigurasi.");
        }

        setIsLoading(true);
        try {
          const credential = await registerWithEmail(email, password);
          await createUserProfile(
            credential.user.uid,
            credential.user.email ?? email,
            role,
          );
        } finally {
          setIsLoading(false);
        }
      },
      signOutUser: async () => {
        await logout();
      },
      refreshProfile,
    }),
    [authUser, isLoading, profile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
};
