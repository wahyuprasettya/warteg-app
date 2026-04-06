import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { isFirebaseConfigured } from "@/firebase/config";
import { useAuth } from "@/hooks/useAuth";
import { AppStackParamList } from "@/types";

type Props = NativeStackScreenProps<AppStackParamList, "Login">;

export const LoginScreen = ({ navigation }: Props) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Input Kosong", "Silakan masukkan email dan password.");
      return;
    }
    try {
      await login(email, password);
    } catch (error: any) {
      Alert.alert("Login gagal", error.message || "Periksa email dan password Anda.");
    }
  };

  return (
    <ScreenContainer scroll>
      <View className="mb-10 items-center justify-center pt-10">
        <View className="h-24 w-24 items-center justify-center rounded-[32px] bg-brand">
          <Text className="text-4xl">🥘</Text>
        </View>
        <Text className="mt-5 text-4xl font-poppins-bold text-brand-ink">WartegPOS</Text>
        <Text className="mt-2 text-center text-base text-brand-muted px-10">
          Kasir digital modern untuk usaha kuliner & toko retail Anda.
        </Text>
      </View>

      {!isFirebaseConfigured ? (
        <View className="mb-6 rounded-[28px] border-2 border-brand/10 bg-brand-soft/30 p-5">
          <Text className="text-lg font-poppins-bold text-brand">Konfigurasi Dibutuhkan</Text>
          <Text className="mt-1 text-sm text-brand-ink/70">
            Pastikan file .env sudah terisi dengan konfigurasi Firebase yang valid.
          </Text>
        </View>
      ) : null}

      <View className="rounded-[40px] bg-white p-8 shadow-sm">
        <Text className="text-3xl font-poppins-bold text-brand-ink">Selamat Datang</Text>
        <Text className="mt-1 text-base text-brand-muted">Masuk ke akun Anda untuk mulai jualan.</Text>

        <View className="mt-8 space-y-4">
          <View>
            <Text className="mb-2 ml-1 text-sm font-poppins-semibold text-brand-ink">Alamat Email</Text>
            <TextInput
              className="rounded-2xl bg-brand-soft/20 border border-brand/5 px-5 py-4 text-base text-brand-ink"
              value={email}
              onChangeText={setEmail}
              placeholder="nama@bisnis.com"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#8B7E74"
            />
          </View>

          <View className="mt-4">
            <View className="mb-2 flex-row justify-between px-1">
              <Text className="text-sm font-poppins-semibold text-brand-ink">Kata Sandi</Text>
              <Text className="text-sm font-poppins-semibold text-brand">Lupa?</Text>
            </View>
            <TextInput
              className="rounded-2xl bg-brand-soft/20 border border-brand/5 px-5 py-4 text-base text-brand-ink"
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry
              placeholderTextColor="#8B7E74"
            />
          </View>
        </View>

        <View className="mt-10">
          <AppButton label="Masuk ke Dashboard" onPress={handleLogin} loading={isLoading} />
        </View>

        <View className="mt-6 flex-row items-center justify-center">
          <Text className="text-base text-brand-muted">Belum punya akun? </Text>
          <Pressable onPress={() => navigation.navigate("Register")}>
            <Text className="text-base font-poppins-bold text-brand">Daftar Sekarang</Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-12 items-center opacity-40">
        <Text className="text-xs text-brand-muted">WartegPOS v1.0.0 • Made with ❤️</Text>
      </View>
    </ScreenContainer>
  );
};
