import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAuth } from "@/hooks/useAuth";
import {
  createCashierProfile,
  subscribeCashiersByOwner,
  updateCashierProfile,
} from "@/services/firestoreService";
import { createCashierWithEmail, resetPasswordEmail } from "@/services/authService";
import { AppStackParamList, UserProfile } from "@/types";

type Props = NativeStackScreenProps<AppStackParamList, "CashierManagement">;

const formatDate = (value?: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const CashierManagementScreen = ({ navigation }: Props) => {
  const { authUser, profile } = useAuth();
  const { width } = useWindowDimensions();
  const isWideLayout = width >= 768;
  const isOwner = profile?.role === "owner";

  const [cashiers, setCashiers] = useState<UserProfile[]>([]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [busyCashierId, setBusyCashierId] = useState<string | null>(null);

  useEffect(() => {
    if (!authUser || !isOwner) {
      return;
    }

    const unsubscribe = subscribeCashiersByOwner(authUser.uid, setCashiers);
    return unsubscribe;
  }, [authUser, isOwner]);

  const summary = useMemo(() => {
    const total = cashiers.length;
    const active = cashiers.filter((cashier) => cashier.isActive !== false).length;
    const inactive = cashiers.filter((cashier) => cashier.isActive === false).length;

    return { total, active, inactive };
  }, [cashiers]);

  const handleCreateCashier = async () => {
    if (!authUser || !isOwner) {
      return;
    }

    const trimmedEmail = email.trim();

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

    try {
      setIsCreating(true);

      const credential = await createCashierWithEmail(trimmedEmail, password);
      await createCashierProfile(credential.user.uid, credential.user.email ?? trimmedEmail, profile);

      Alert.alert(
        "Kasir berhasil dibuat",
        `Akun kasir ${trimmedEmail} sudah aktif dan terhubung ke toko ini.`,
      );

      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      let message = "Kasir belum bisa dibuat. Coba periksa data lalu ulangi lagi.";

      if (error?.code === "auth/email-already-in-use") {
        message = "Email sudah terdaftar. Gunakan email lain.";
      } else if (error?.code === "auth/invalid-email") {
        message = "Format email tidak valid.";
      } else if (error?.code === "auth/weak-password") {
        message = "Password terlalu lemah.";
      } else if (error?.message) {
        message = error.message;
      }

      Alert.alert("Gagal membuat kasir", message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleCashierActive = async (cashier: UserProfile) => {
    try {
      setBusyCashierId(cashier.id);
      await updateCashierProfile(cashier.id, {
        isActive: cashier.isActive === false,
      });
      Alert.alert(
        "Berhasil",
        cashier.isActive === false
          ? "Akun kasir berhasil diaktifkan kembali."
          : "Akun kasir berhasil dinonaktifkan.",
      );
    } catch (error: any) {
      Alert.alert(
        "Gagal memperbarui",
        error?.message || "Status kasir belum berhasil diubah.",
      );
    } finally {
      setBusyCashierId(null);
    }
  };

  const handleResetPassword = async (cashier: UserProfile) => {
    if (!cashier.email) {
      Alert.alert("Email kosong", "Akun kasir ini belum punya email.");
      return;
    }

    try {
      setBusyCashierId(cashier.id);
      await resetPasswordEmail(cashier.email);
      Alert.alert(
        "Email terkirim",
        `Link reset password sudah dikirim ke ${cashier.email}.`,
      );
    } catch (error: any) {
      Alert.alert(
        "Gagal kirim reset",
        error?.message || "Reset password belum berhasil dikirim.",
      );
    } finally {
      setBusyCashierId(null);
    }
  };

  if (!isOwner) {
    return (
      <ScreenContainer scroll>
        <AppHeader
          title="Manajemen Kasir"
          subtitle="Fitur ini hanya bisa dibuka oleh owner."
          actionLabel="Kembali"
          onActionPress={() => navigation.goBack()}
        />

        <View className="rounded-[28px] bg-white p-5">
          <Text className="text-lg font-poppins-bold text-brand-ink">
            Akses Ditolak
          </Text>
          <Text className="mt-2 font-poppins text-sm leading-6 text-brand-muted">
            Akun kasir tidak bisa membuat akun kasir baru. Silakan login sebagai owner
            untuk menambah atau mengelola akun staf.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <AppHeader
        title="Manajemen Kasir"
        subtitle="Buat akun kasir baru dan lihat daftar akun yang terhubung ke owner ini."
        actionLabel="Kembali"
        onActionPress={() => navigation.goBack()}
      />

      <View className="mb-4 flex-row">
        <View className="mr-2 flex-1 rounded-[26px] border border-brand/5 bg-white p-4">
          <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
            Total Kasir
          </Text>
          <Text className="mt-2 text-2xl font-poppins-bold text-brand-ink">
            {summary.total}
          </Text>
        </View>
        <View className="ml-2 flex-1 rounded-[26px] border border-brand/5 bg-white p-4">
          <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
            Aktif
          </Text>
          <Text className="mt-2 text-2xl font-poppins-bold text-brand-ink">
            {summary.active}
          </Text>
        </View>
      </View>

      <View className="mb-4 flex-row">
        <View className="mr-2 flex-1 rounded-[26px] border border-brand/5 bg-white p-4">
          <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
            Nonaktif
          </Text>
          <Text className="mt-2 text-2xl font-poppins-bold text-brand-ink">
            {summary.inactive}
          </Text>
        </View>
        <View className="ml-2 flex-1 rounded-[26px] border border-brand/5 bg-white p-4">
          <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
            Terhubung
          </Text>
          <Text className="mt-2 text-2xl font-poppins-bold text-brand-ink">
            {summary.total}
          </Text>
        </View>
      </View>

      <View className={`mb-4 overflow-hidden rounded-[34px] border border-brand/15 bg-brand p-5 ${isWideLayout ? "p-6" : ""}`}>
        <Text className="text-sm font-poppins-semibold text-white/75">
          Buat Akun Kasir
        </Text>
        <Text className="mt-2 text-2xl font-poppins-bold text-white">
          Tambah staf baru
        </Text>
        <Text className="font-poppins mt-2 text-sm leading-5 text-white/80">
          Akun baru langsung tersambung ke owner ini tanpa mengambil alih sesi login yang sedang aktif.
        </Text>

        <View className={`mt-5 ${isWideLayout ? "flex-row" : ""}`}>
          <View className={isWideLayout ? "mr-2 flex-1" : ""}>
            <Text className="mb-2 text-xs font-poppins-semibold uppercase tracking-wide text-white/70">
              Email Kasir
            </Text>
            <TextInput
              className="mb-3 rounded-[22px] border border-white/15 bg-white/10 px-4 py-4 text-base font-poppins-medium text-white"
              placeholder="kasir@usaha.com"
              placeholderTextColor="rgba(255,255,255,0.55)"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          <View className={isWideLayout ? "ml-2 flex-1" : ""}>
            <Text className="mb-2 text-xs font-poppins-semibold uppercase tracking-wide text-white/70">
              Password
            </Text>
            <TextInput
              className="mb-3 rounded-[22px] border border-white/15 bg-white/10 px-4 py-4 text-base font-poppins-medium text-white"
              placeholder="Minimal 6 karakter"
              placeholderTextColor="rgba(255,255,255,0.55)"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </View>

        <View className="mt-1">
          <Text className="mb-2 text-xs font-poppins-semibold uppercase tracking-wide text-white/70">
            Konfirmasi Password
          </Text>
          <TextInput
            className="rounded-[22px] border border-white/15 bg-white/10 px-4 py-4 text-base font-poppins-medium text-white"
            placeholder="Ulangi password"
            placeholderTextColor="rgba(255,255,255,0.55)"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <View className="mt-5">
          <AppButton
            label={isCreating ? "Membuat Akun..." : "Buat Akun Kasir"}
            onPress={handleCreateCashier}
            loading={isCreating}
          />
        </View>
      </View>

      <View className="mb-5 rounded-[28px] border border-brand/5 bg-white p-5">
        <Text className="text-lg font-poppins-bold text-brand-ink">
          Daftar Kasir
        </Text>
        <Text className="font-poppins mt-1 text-sm text-brand-muted">
          Akun yang dibuat di sini akan muncul di daftar ini.
        </Text>

        {cashiers.length === 0 ? (
          <View className="mt-4">
            <EmptyState
              title="Belum ada kasir"
              description="Buat akun kasir pertama untuk mulai menambahkan staf."
            />
          </View>
        ) : (
          <View className="mt-4">
            {cashiers.map((cashier, index) => (
              <View
                key={cashier.id}
                className={`mb-3 rounded-[26px] border p-4 ${
                  cashier.isActive === false
                    ? "border-slate-200 bg-slate-50"
                    : "border-brand/5 bg-brand-soft/15"
                }`}
              >
                <View className={`flex-row ${isWideLayout ? "items-center justify-between" : "items-start"}`}>
                  <View className="flex-1 pr-3">
                    <View className="mb-2 flex-row flex-wrap items-center">
                      <View className="mr-2 mb-2 rounded-full bg-white px-2.5 py-1">
                        <Text className="text-[10px] font-poppins-semibold uppercase tracking-wide text-brand">
                          #{index + 1}
                        </Text>
                      </View>
                      <View className="mr-2 mb-2 rounded-full bg-brand-soft px-2.5 py-1">
                        <Text className="text-[10px] font-poppins-semibold text-brand-muted">
                          {cashier.isActive === false ? "Nonaktif" : "Aktif"}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-base font-poppins-bold text-brand-ink">
                      {cashier.email}
                    </Text>
                    {cashier.ownerId ? (
                      <Text className="mt-1 font-poppins text-xs text-brand-muted">
                        Terhubung ke owner: {cashier.ownerId}
                      </Text>
                    ) : null}
                    <Text className="mt-1 font-poppins text-xs leading-5 text-brand-muted">
                      Dibuat: {formatDate(cashier.createdAt)}
                    </Text>
                  </View>
                  <View className="mt-3 rounded-[18px] bg-white px-3 py-2">
                    <Text className="text-[10px] font-poppins-semibold uppercase tracking-wide text-brand-muted">
                      UID
                    </Text>
                    <Text className="mt-1 font-mono text-[10px] text-brand-ink">
                      {cashier.id}
                    </Text>
                  </View>
                </View>

                <View className="mt-4 flex-row flex-wrap">
                  <View className="mr-2 mb-2 flex-1">
                    <AppButton
                      label={cashier.isActive === false ? "Aktifkan" : "Nonaktifkan"}
                      onPress={() => handleToggleCashierActive(cashier)}
                      variant={cashier.isActive === false ? "secondary" : "danger"}
                      loading={busyCashierId === cashier.id}
                    />
                  </View>
                  <View className="mr-2 mb-2 flex-1">
                    <AppButton
                      label="Reset Password"
                      onPress={() => handleResetPassword(cashier)}
                      variant="secondary"
                      loading={busyCashierId === cashier.id}
                    />
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScreenContainer>
  );
};
