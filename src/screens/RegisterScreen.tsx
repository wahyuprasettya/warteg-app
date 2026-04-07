import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAuth } from "@/hooks/useAuth";
import { AppStackParamList } from "@/types";

type Props = NativeStackScreenProps<AppStackParamList, "Register">;

export const RegisterScreen = ({ navigation }: Props) => {
  const { register, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    if (password.length < 6) {
      Alert.alert("Password terlalu pendek", "Minimal 6 karakter.");
      return;
    }

    try {
      await register(email, password);
    } catch (error: any) {
      console.error("Registration Error:", error);

      let errorMessage = "Coba gunakan email lain atau cek koneksi internet.";

      if (error.code === "auth/email-already-in-use") {
        errorMessage = "Email sudah terdaftar. Gunakan email lain.";
      } else if (error.code === "auth/invalid-email") {
        errorMessage = "Format email tidak valid.";
      } else if (error.code === "auth/weak-password") {
        errorMessage = "Password terlalu lemah.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      Alert.alert("Registrasi gagal", errorMessage);
    }
  };

  return (
    <ScreenContainer scroll>
      <View className="mb-10 items-center justify-center pt-10">
        <View className="h-20 w-20 items-center justify-center rounded-[28px] bg-brand/10">
          <Text className="font-poppins text-3xl">📝</Text>
        </View>
        <Text className="mt-5 text-3xl font-poppins-bold text-brand-ink">
          Daftar Akun
        </Text>
        <Text className="font-poppins mt-2 text-center text-base text-brand-muted px-10">
          Mulai langkah pertama untuk mendigitalkan kasir usaha Anda.
        </Text>
      </View>

      <View className="rounded-[40px] bg-white p-8 shadow-sm">
        <Text className="text-2xl font-poppins-bold text-brand-ink">
          Informasi Akun
        </Text>
        <Text className="mt-1 text-base text-brand-muted font-poppins-medium">
          Buat kredensial login baru.
        </Text>

        <View className="mt-6 space-y-4">
          <View>
            <Text className="mb-2 ml-1 text-sm font-poppins-semibold text-brand-ink">
              Alamat Email
            </Text>
            <TextInput
              className="font-poppins rounded-2xl bg-brand-soft/20 border border-brand/5 px-5 py-4 text-base text-brand-ink"
              value={email}
              onChangeText={setEmail}
              placeholder="nama@bisnis.com"
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#8B7E74"
            />
          </View>

          <View className="mt-4">
            <Text className="mb-2 ml-1 text-sm font-poppins-semibold text-brand-ink">
              Kata Sandi
            </Text>
            <TextInput
              className="font-poppins rounded-2xl bg-brand-soft/20 border border-brand/5 px-5 py-4 text-base text-brand-ink"
              value={password}
              onChangeText={setPassword}
              placeholder="Minimal 6 karakter"
              secureTextEntry
              placeholderTextColor="#8B7E74"
            />
          </View>
        </View>

        <View className="mt-10">
          <AppButton
            label="Daftar Sekarang"
            onPress={handleRegister}
            loading={isLoading}
          />
        </View>

        <View className="mt-6 flex-row items-center justify-center">
          <Text className="font-poppins text-base text-brand-muted">
            Sudah punya akun?{" "}
          </Text>
          <Pressable onPress={() => navigation.goBack()}>
            <Text className="text-base font-poppins-bold text-brand">
              Login Disini
            </Text>
          </Pressable>
        </View>
      </View>

      <View className="mt-10 p-5 rounded-3xl bg-brand-soft/20 mx-4 border border-brand/5">
        <Text className="font-poppins text-sm italic text-center text-brand-muted">
          "Pilihan jenis usaha dapat ditentukan setelah registrasi selesai."
        </Text>
      </View>
    </ScreenContainer>
  );
};
