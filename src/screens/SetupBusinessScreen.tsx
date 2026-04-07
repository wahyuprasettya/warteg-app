import { useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { businessOptions } from "@/constants/theme";
import { useAuth } from "@/hooks/useAuth";
import { BusinessType } from "@/types";

const businessDecor: Record<
  BusinessType,
  { icon: string; badge: string; perks: [string, string] }
> = {
  warung: {
    icon: "🏪",
    badge: "Simple Fast Flow",
    perks: ["Grid produk praktis", "Checkout cepat harian"],
  },
  warteg: {
    icon: "🍽️",
    badge: "Best For Warteg",
    perks: ["Kategori prasmanan", "Mode paket hemat"],
  },
  restoran: {
    icon: "🍴",
    badge: "Table Service",
    perks: ["Pilih meja dulu", "Pantau pesanan aktif"],
  },
  toko: {
    icon: "🛍️",
    badge: "Retail Ready",
    perks: ["Pencarian produk cepat", "Manajemen stok rapi"],
  },
};

export const SetupBusinessScreen = () => {
  const { saveBusinessType } = useAuth();
  const [selectedType, setSelectedType] = useState<BusinessType>("warteg");
  const [isSaving, setIsSaving] = useState(false);

  const selectedOption = useMemo(
    () =>
      businessOptions.find((option) => option.value === selectedType) ??
      businessOptions[0],
    [selectedType],
  );

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await saveBusinessType(selectedType);
    } catch (error: any) {
      console.error("Setup Error:", error);
      Alert.alert(
        "Setup gagal",
        error.message || "Business type belum bisa disimpan ke Firestore.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer scroll>
      <View className="mb-5 overflow-hidden rounded-[36px] border border-brand/15 bg-brand p-6">
        <View className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-white/10" />
        <View className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10" />

        <View className="w-14 rounded-[20px] bg-white/15 px-3 py-3">
          <Text className="font-poppins text-center text-2xl">
            {businessDecor[selectedType].icon}
          </Text>
        </View>

        <Text className="mt-5 text-sm font-poppins-semibold uppercase tracking-[1.5px] text-white/70">
          Setup Tampilan Kasir
        </Text>
        <Text className="mt-2 text-4xl font-poppins-bold leading-tight text-white">
          Pilih Jenis Usaha
        </Text>
        <Text className="font-poppins mt-3 text-sm leading-6 text-white/80">
          Kami sesuaikan alur kasir, kategori, dan navigasi agar terasa paling
          cepat untuk model usaha kamu.
        </Text>

        <View className="mt-5 rounded-[26px] bg-white/12 p-4">
          <View className="flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-white/60">
                Tipe Terpilih
              </Text>
              <Text className="mt-1 text-2xl font-poppins-bold text-white">
                {selectedOption.label}
              </Text>
            </View>
            <View className="rounded-full bg-white/15 px-3 py-2">
              <Text className="text-xs font-poppins-semibold text-white">
                {businessDecor[selectedType].badge}
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row">
            <View className="mr-2 flex-1 rounded-[20px] bg-white/10 p-3">
              <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-white/60">
                Benefit 1
              </Text>
              <Text className="mt-1 text-sm font-poppins-bold text-white">
                {businessDecor[selectedType].perks[0]}
              </Text>
            </View>
            <View className="flex-1 rounded-[20px] bg-white/10 p-3">
              <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-white/60">
                Benefit 2
              </Text>
              <Text className="mt-1 text-sm font-poppins-bold text-white">
                {businessDecor[selectedType].perks[1]}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="mb-4">
        <Text className="text-lg font-poppins-bold text-brand-ink">
          Pilih yang paling cocok
        </Text>
        <Text className="font-poppins mt-1 text-sm text-brand-muted">
          Kamu bisa pilih mode yang paling sesuai dengan cara jualan
          sehari-hari.
        </Text>
      </View>

      <View className="mb-5">
        {businessOptions.map((option) => {
          const isActive = option.value === selectedType;
          const decor = businessDecor[option.value];

          return (
            <Pressable
              key={option.value}
              className={`mb-3 overflow-hidden rounded-[30px] border p-5 ${
                isActive
                  ? "border-brand bg-white"
                  : "border-brand/5 bg-white/80"
              }`}
              onPress={() => setSelectedType(option.value)}
            >
              <View className="flex-row items-start justify-between">
                <View className="mr-3 flex-1">
                  <View className="mb-3 flex-row items-center">
                    <View
                      className={`mr-3 h-12 w-12 items-center justify-center rounded-[18px] ${isActive ? "bg-brand" : "bg-brand-soft"}`}
                    >
                      <Text className="font-poppins text-2xl">
                        {decor.icon}
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xl font-poppins-bold text-brand-ink">
                        {option.label}
                      </Text>
                      <Text className="mt-1 text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
                        {decor.badge}
                      </Text>
                    </View>
                  </View>

                  <Text className="font-poppins text-sm leading-6 text-brand-muted">
                    {option.description}
                  </Text>

                  <View className="mt-4 flex-row flex-wrap">
                    {decor.perks.map((perk) => (
                      <View
                        key={perk}
                        className="mr-2 mb-2 rounded-full bg-brand-soft/70 px-3 py-1.5"
                      >
                        <Text className="text-[11px] font-poppins-semibold text-brand">
                          {perk}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View
                  className={`h-8 w-8 items-center justify-center rounded-full ${isActive ? "bg-brand" : "bg-brand-soft"}`}
                >
                  <Text
                    className={`text-sm font-poppins-bold ${isActive ? "text-white" : "text-brand-muted"}`}
                  >
                    {isActive ? "✓" : ""}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      <View className="rounded-[28px] border border-brand/5 bg-white p-4">
        <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
          Pilihan Sekarang
        </Text>
        <Text className="mt-2 text-xl font-poppins-bold text-brand-ink">
          {selectedOption.label}
        </Text>
        <Text className="font-poppins mt-1 text-sm leading-5 text-brand-muted">
          {selectedOption.description}
        </Text>

        <View className="mt-4">
          <AppButton
            label="Simpan & Mulai Jualan"
            onPress={handleSave}
            loading={isSaving}
          />
        </View>
      </View>
    </ScreenContainer>
  );
};
