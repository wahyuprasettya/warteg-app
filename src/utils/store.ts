import { UserProfile } from "@/types";

type StoreProfile = Pick<UserProfile, "ownerId" | "role">;

export const resolveStoreUserId = (
  authUserId?: string | null,
  profile?: StoreProfile | null,
) => {
  if (!authUserId) {
    return "";
  }

  if (profile?.ownerId?.trim()) {
    return profile.ownerId.trim();
  }

  return authUserId;
};

export const isCashierUnlinked = (profile?: StoreProfile | null) =>
  profile?.role === "kasir" && !profile.ownerId?.trim();
