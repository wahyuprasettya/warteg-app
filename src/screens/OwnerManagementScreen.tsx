import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Switch, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAuth } from "@/hooks/useAuth";
import { createOwnerWithEmail, resetPasswordEmail } from "@/services/authService";
import {
  createOwnerProfile,
  subscribeOwnersByOwner,
  updateOwnerProfile,
} from "@/services/firestoreService";
import { AppStackParamList, UserProfile } from "@/types";

type Props = NativeStackScreenProps<AppStackParamList, "OwnerManagement">;

const getDisplayName = (owner?: UserProfile | null) =>
  owner?.name?.trim() ||
  owner?.storeName?.trim() ||
  owner?.email?.split("@")[0] ||
  "Owner";

export const OwnerManagementScreen = ({ navigation }: Props) => {
  const { authUser, profile, refreshProfile, signOutUser } = useAuth();
  const isPrimaryOwner = profile?.role === "owner" && !profile?.ownerId?.trim();

  const [linkedOwners, setLinkedOwners] = useState<UserProfile[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<UserProfile | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [busyOwnerId, setBusyOwnerId] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser || !isPrimaryOwner) {
      return;
    }

    const unsubscribe = subscribeOwnersByOwner(authUser.uid, setLinkedOwners);
    return unsubscribe;
  }, [authUser, isPrimaryOwner]);

  const owners = useMemo(() => {
    if (!profile) {
      return linkedOwners;
    }

    const primaryOwner = {
      ...profile,
      id: authUser?.uid ?? profile.id,
    } as UserProfile;

    return [primaryOwner, ...linkedOwners.filter((item) => item.id !== primaryOwner.id)];
  }, [authUser?.uid, linkedOwners, profile]);

  const activeOwners = owners.filter((owner) => owner.isActive !== false);
  const inactiveOwners = owners.filter((owner) => owner.isActive === false);

  const resetForm = () => {
    setSelectedOwner(null);
    setName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setIsActive(true);
  };

  const beginEdit = (owner: UserProfile) => {
    setSelectedOwner(owner);
    setName(owner.name ?? getDisplayName(owner));
    setEmail(owner.email);
    setPassword("");
    setConfirmPassword("");
    setIsActive(owner.isActive !== false);
  };

  const handleSave = async () => {
    if (!authUser || !profile) {
      return;
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      Alert.alert("Nama belum diisi", "Nama owner wajib diisi.");
      return;
    }

    try {
      setIsSaving(true);

      if (selectedOwner) {
        await updateOwnerProfile(selectedOwner.id, {
          name: trimmedName,
          isActive,
          deletedAt: isActive ? undefined : new Date().toISOString(),
        });
        if (selectedOwner.id === authUser.uid) {
          if (isActive) {
            await refreshProfile(authUser.uid);
          } else {
            await signOutUser();
            return;
          }
        }
        Alert.alert("Berhasil", "Data owner berhasil diperbarui.");
      } else {
        if (!trimmedEmail || !password || !confirmPassword) {
          Alert.alert("Data belum lengkap", "Email, password, dan konfirmasi wajib diisi.");
          return;
        }

        if (password.length < 6) {
          Alert.alert("Password terlalu pendek", "Minimal 6 karakter.");
          return;
        }

        if (password !== confirmPassword) {
          Alert.alert("Password tidak cocok", "Password dan konfirmasi harus sama.");
          return;
        }

        const credential = await createOwnerWithEmail(trimmedEmail, password);
        await createOwnerProfile(
          credential.user.uid,
          credential.user.email ?? trimmedEmail,
          profile,
          trimmedName,
        );

        Alert.alert(
          "Owner berhasil ditambahkan",
          `${trimmedName} sekarang bisa login sebagai owner untuk toko yang sama.`,
        );
      }

      resetForm();
    } catch (error: any) {
      let message = "Owner belum bisa disimpan. Coba cek data lalu ulangi lagi.";
      if (error?.code === "auth/email-already-in-use") {
        message = "Email sudah terdaftar. Gunakan email lain.";
      } else if (error?.code === "auth/invalid-email") {
        message = "Format email tidak valid.";
      } else if (error?.code === "auth/weak-password") {
        message = "Password terlalu lemah.";
      } else if (error?.message) {
        message = error.message;
      }
      Alert.alert("Gagal menyimpan owner", message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleActive = async (owner: UserProfile) => {
    try {
      setBusyOwnerId(owner.id);
      const nextActive = owner.isActive === false;
      await updateOwnerProfile(owner.id, {
        isActive: nextActive,
        deletedAt: nextActive ? undefined : new Date().toISOString(),
      });

      if (owner.id === authUser?.uid && !nextActive) {
        await signOutUser();
        return;
      }

      Alert.alert(
        "Berhasil",
        nextActive ? "Owner berhasil diaktifkan kembali." : "Owner berhasil dinonaktifkan.",
      );
    } catch (error: any) {
      Alert.alert("Gagal", error?.message || "Status owner belum berhasil diubah.");
    } finally {
      setBusyOwnerId(null);
    }
  };

  const handleResetPassword = async (owner: UserProfile) => {
    if (!owner.email) {
      Alert.alert("Email kosong", "Owner ini belum punya email.");
      return;
    }

    try {
      setBusyOwnerId(owner.id);
      await resetPasswordEmail(owner.email);
      Alert.alert("Email terkirim", `Link reset password sudah dikirim ke ${owner.email}.`);
    } catch (error: any) {
      Alert.alert("Gagal", error?.message || "Reset password belum berhasil dikirim.");
    } finally {
      setBusyOwnerId(null);
    }
  };

  if (!isPrimaryOwner) {
    return (
      <ScreenContainer scroll maxWidth={720}>
        <AppHeader
          title="Manajemen Owner"
          subtitle="Hanya primary owner yang bisa mengelola akses owner tambahan."
          actionLabel="Kembali"
          onActionPress={() => navigation.goBack()}
        />
        <EmptyState
          title="Akses Terbatas"
          description="Halaman ini hanya bisa dibuka oleh owner utama yang pertama kali membuat toko."
        />
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll maxWidth={960}>
      <AppHeader
        title="Manajemen Owner"
        subtitle="Tambah owner baru, ubah nama atau status akses, lalu nonaktifkan kapan saja dari satu layar."
        actionLabel="Kembali"
        onActionPress={() => navigation.goBack()}
      />

      <View className="mb-4 flex-row">
        <View className="mr-2 flex-1 rounded-[26px] border border-brand/5 bg-white p-4">
          <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
            Owner Aktif
          </Text>
          <Text className="mt-2 text-2xl font-poppins-bold text-brand-ink">
            {activeOwners.length}
          </Text>
        </View>
        <View className="ml-2 flex-1 rounded-[26px] border border-brand/5 bg-white p-4">
          <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
            Nonaktif
          </Text>
          <Text className="mt-2 text-2xl font-poppins-bold text-brand-ink">
            {inactiveOwners.length}
          </Text>
        </View>
      </View>

      <View className="mb-4 rounded-[30px] bg-white p-5 shadow-sm">
        <Text className="text-lg font-poppins-bold text-brand-ink">
          {selectedOwner ? "Edit Owner" : "Tambah Owner"}
        </Text>
        <Text className="mt-1 text-sm font-poppins text-brand-muted">
          {selectedOwner
            ? "Ubah nama dan status akses owner yang dipilih."
            : "Buat akun owner baru dengan akses ke toko yang sama."}
        </Text>

        <Text className="mt-4 mb-2 text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
          Nama Owner
        </Text>
        <TextInput
          className="rounded-2xl border border-brand/15 px-4 py-4 font-poppins text-base text-brand-ink"
          value={name}
          onChangeText={setName}
          placeholder="Nama owner"
        />

        <Text className="mt-4 mb-2 text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
          Email Login
        </Text>
        <TextInput
          className={`rounded-2xl border border-brand/15 px-4 py-4 font-poppins text-base text-brand-ink ${selectedOwner ? "bg-brand-soft/20" : ""}`}
          value={email}
          onChangeText={setEmail}
          placeholder="owner@bisnis.com"
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!selectedOwner}
          placeholderTextColor="#8B7E74"
        />

        {!selectedOwner ? (
          <>
            <Text className="mt-4 mb-2 text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              Password
            </Text>
            <TextInput
              className="rounded-2xl border border-brand/15 px-4 py-4 font-poppins text-base text-brand-ink"
              value={password}
              onChangeText={setPassword}
              placeholder="Minimal 6 karakter"
              secureTextEntry
              placeholderTextColor="#8B7E74"
            />

            <Text className="mt-4 mb-2 text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              Konfirmasi Password
            </Text>
            <TextInput
              className="rounded-2xl border border-brand/15 px-4 py-4 font-poppins text-base text-brand-ink"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Ulangi password"
              secureTextEntry
              placeholderTextColor="#8B7E74"
            />
          </>
        ) : null}

        <View className="mt-4 flex-row items-center justify-between rounded-2xl border border-brand/10 bg-brand-soft/20 px-4 py-4">
          <View className="flex-1 pr-4">
            <Text className="text-sm font-poppins-bold text-brand-ink">
              Status Aktif
            </Text>
            <Text className="mt-1 text-xs font-poppins text-brand-muted">
              Owner yang nonaktif akan otomatis keluar dari aplikasi saat login.
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: "#e0e0e0", true: "#A63D40" }}
            thumbColor="#ffffff"
          />
        </View>

        <View className="mt-5">
          <AppButton
            label={selectedOwner ? "Simpan Perubahan" : "Tambah Owner"}
            onPress={handleSave}
            loading={isSaving}
          />
        </View>

        {selectedOwner ? (
          <View className="mt-3">
            <AppButton
              label="Batal Edit"
              onPress={resetForm}
              variant="ghost"
            />
          </View>
        ) : null}
      </View>

      <View className="mb-4 rounded-[30px] bg-white p-5 shadow-sm">
        <Text className="text-lg font-poppins-bold text-brand-ink">
          Daftar Owner
        </Text>
        <Text className="mt-1 text-sm font-poppins text-brand-muted">
          Tekan edit untuk mengubah nama atau status, dan reset password bila diperlukan.
        </Text>

        {owners.length === 0 ? (
          <View className="mt-4">
            <EmptyState
              title="Belum ada owner tambahan"
              description="Tambahkan owner baru dari form di atas untuk memberi akses login tambahan."
            />
          </View>
        ) : (
          <View className="mt-4">
            {owners.map((owner) => {
              const active = owner.isActive !== false;
              const isCurrent = owner.id === authUser?.uid;

              return (
                <View
                  key={owner.id}
                  className="mb-3 rounded-[26px] border border-brand/10 bg-brand-soft/20 p-4"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <View className="mb-2 flex-row flex-wrap items-center">
                        <View className={`mr-2 mb-2 rounded-full px-2.5 py-1 ${active ? "bg-emerald-100" : "bg-slate-200"}`}>
                          <Text className={`text-[10px] font-poppins-bold uppercase tracking-wide ${active ? "text-emerald-700" : "text-slate-600"}`}>
                            {active ? "Aktif" : "Nonaktif"}
                          </Text>
                        </View>
                        {isCurrent ? (
                          <View className="mr-2 mb-2 rounded-full bg-brand px-2.5 py-1">
                            <Text className="text-[10px] font-poppins-bold uppercase tracking-wide text-white">
                              Akun Ini
                            </Text>
                          </View>
                        ) : null}
                      </View>

                      <Text className="text-lg font-poppins-bold text-brand-ink">
                        {getDisplayName(owner)}
                      </Text>
                      <Text className="mt-1 font-poppins text-sm text-brand-muted">
                        {owner.email}
                      </Text>
                      <Text className="mt-1 font-poppins text-xs text-brand-muted">
                        {owner.ownerId ? `Terhubung ke owner utama: ${owner.ownerId}` : "Owner utama toko"}
                      </Text>
                    </View>

                    <View className="items-end">
                      <Pressable
                        onPress={() => beginEdit(owner)}
                        className="mb-2 rounded-full bg-white px-3 py-2"
                      >
                        <Text className="text-xs font-poppins-bold text-brand-ink">
                          Edit
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleResetPassword(owner)}
                        className="rounded-full bg-white px-3 py-2"
                        disabled={busyOwnerId === owner.id}
                      >
                        <Text className="text-xs font-poppins-bold text-brand">
                          Reset
                        </Text>
                      </Pressable>
                    </View>
                  </View>

                  <View className="mt-4 flex-row">
                    <View className="mr-2 flex-1">
                      <Pressable
                        onPress={() => handleToggleActive(owner)}
                        className={`rounded-[18px] px-4 py-3 ${active ? "bg-red-50 border border-red-200" : "bg-emerald-50 border border-emerald-200"}`}
                        disabled={busyOwnerId === owner.id}
                      >
                        <Text className={`text-center text-sm font-poppins-bold ${active ? "text-red-700" : "text-emerald-700"}`}>
                          {busyOwnerId === owner.id
                            ? "Memproses..."
                            : active
                              ? "Hapus"
                              : "Aktifkan"}
                        </Text>
                      </Pressable>
                    </View>
                    <View className="ml-2 flex-1">
                      <Pressable
                        onPress={() => beginEdit(owner)}
                        className="rounded-[18px] border border-brand/10 bg-white px-4 py-3"
                      >
                        <Text className="text-center text-sm font-poppins-bold text-brand-ink">
                          Ubah
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
};
