import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { ScreenContainer } from "@/components/ScreenContainer";
import { promoOptions as defaultPromos } from "@/constants/promos";
import { useAuth } from "@/hooks/useAuth";
import { CLOSING_HOUR, updateStoreSettings } from "@/services/firestoreService";
import { AppStackParamList, PromoDefinition, PromoType } from "@/types";
import { formatNumberInput, parseFormattedNumber } from "@/utils/currency";

type Props = NativeStackScreenProps<AppStackParamList, "Settings">;

export const SettingsScreen = ({ navigation }: Props) => {
  const { authUser, profile, refreshProfile } = useAuth();

  const [closingHour, setClosingHour] = useState(
    String(profile?.closingHour ?? CLOSING_HOUR),
  );
  const [promos, setPromos] = useState<PromoDefinition[]>(
    profile?.promos ?? defaultPromos,
  );
  const [isSaving, setIsSaving] = useState(false);

  const [categories, setCategories] = useState<string[]>(
    profile?.categories ?? ["Makanan", "Minuman", "Cemilan", "Paket"]
  );

  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoLabel, setNewPromoLabel] = useState("");
  const [newPromoType, setNewPromoType] = useState<PromoType>("percentage");
  const [newPromoValue, setNewPromoValue] = useState("");
  const [newPromoMinSubtotal, setNewPromoMinSubtotal] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const handleAddPromo = () => {
    if (!newPromoCode || !newPromoLabel || !newPromoValue) {
      Alert.alert(
        "Data belum lengkap",
        "Kode, Label, dan Nilai promo wajib diisi.",
      );
      return;
    }

    const valueNum = parseFormattedNumber(newPromoValue);
    if (valueNum <= 0) {
      Alert.alert("Nilai tidak valid", "Nilai potongan harus lebih dari 0.");
      return;
    }

    const newPromo: PromoDefinition = {
      code: newPromoCode.toUpperCase(),
      label: newPromoLabel,
      description: `Diskon ${newPromoType === "percentage" ? valueNum + "%" : "Rp" + valueNum}`,
      type: newPromoType,
      value: valueNum,
      minSubtotal: parseFormattedNumber(newPromoMinSubtotal) || undefined,
    };

    setPromos((prev) => [...prev, newPromo]);
    setNewPromoCode("");
    setNewPromoLabel("");
    setNewPromoValue("");
    setNewPromoMinSubtotal("");
  };

  const handleRemovePromo = (index: number) => {
    setPromos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      Alert.alert("Gagal", "Kategori sudah ada.");
      return;
    }
    setCategories((prev) => [...prev, trimmed]);
    setNewCategory("");
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setCategories((prev) => prev.filter((cat) => cat !== catToRemove));
  };

  const handleSave = async () => {
    if (!authUser) return;

    const hour = parseInt(closingHour, 10);
    if (isNaN(hour) || hour < 0 || hour > 23) {
      Alert.alert(
        "Jam tidak valid",
        "Masukkan jam closing antara 0 sampai 23.",
      );
      return;
    }

    try {
      setIsSaving(true);
      await updateStoreSettings(authUser.uid, {
        closingHour: hour,
        promos,
        categories,
      });
      await refreshProfile();
      Alert.alert("Berhasil", "Pengaturan toko berhasil disimpan.");
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        "Gagal menyimpan",
        "Terjadi kesalahan saat menyimpan pengaturan.",
      );
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer scroll>
      <AppHeader
        title="Pengaturan Toko"
        subtitle="Atur jam operasional dan diskon promo untuk bisnismu."
      />

      <View className="mb-4 rounded-[28px] bg-white p-5">
        <Text className="text-lg font-poppins-bold text-brand-ink">
          Jam Closing
        </Text>
        <Text className="font-poppins mt-1 text-sm text-brand-muted">
          Waktu ketika kamu mulai bisa menutup kasir hari tersebut (default:{" "}
          {CLOSING_HOUR}.00). Format 24 jam (0-23).
        </Text>
        <View className="mt-4 rounded-2xl bg-brand-soft/35 p-4">
          <TextInput
            className="font-poppins rounded-2xl border border-brand/15 bg-white px-4 py-3 text-base"
            placeholder="Contoh: 21"
            keyboardType="number-pad"
            value={closingHour}
            onChangeText={setClosingHour}
            maxLength={2}
          />
        </View>
      </View>

      <View className="mb-4 rounded-[28px] bg-white p-5">
        <Text className="text-lg font-poppins-bold text-brand-ink">
          Daftar Promo & Diskon
        </Text>
        <Text className="font-poppins mt-1 mb-4 text-sm text-brand-muted">
          Promo ini akan muncul sebagai opsi di layar Keranjang Kasir.
        </Text>

        {promos.length === 0 ? (
          <Text className="font-poppins text-sm italic text-brand-muted mb-4">
            Belum ada promo. Tambahkan di bawah.
          </Text>
        ) : (
          promos.map((promo, index) => (
            <View
              key={index}
              className="mb-3 flex-row items-center justify-between rounded-2xl border border-brand/10 bg-brand-soft/30 p-4"
            >
              <View className="flex-1 pr-3">
                <Text className="text-base font-poppins-bold text-brand-ink">
                  {promo.label} ({promo.code})
                </Text>
                <Text className="font-poppins text-xs text-brand-muted mt-1">
                  {promo.description}
                </Text>
              </View>
              <Pressable
                onPress={() => handleRemovePromo(index)}
                className="rounded-full bg-red-100 px-3 py-2"
              >
                <Text className="text-xs font-poppins-semibold text-red-700">
                  Hapus
                </Text>
              </Pressable>
            </View>
          ))
        )}

        <View className="mt-2 rounded-2xl border border-brand/20 p-4">
          <Text className="text-sm font-poppins-bold text-brand-ink mb-3">
            Tambah Promo Baru
          </Text>

          <TextInput
            className="font-poppins mb-3 rounded-xl border border-brand/15 px-3 py-2 text-sm"
            placeholder="Kode Promo (cth: DISKON20)"
            value={newPromoCode}
            onChangeText={setNewPromoCode}
            autoCapitalize="characters"
          />
          <TextInput
            className="font-poppins mb-3 rounded-xl border border-brand/15 px-3 py-2 text-sm"
            placeholder="Label Promo (cth: Diskon Merdeka)"
            value={newPromoLabel}
            onChangeText={setNewPromoLabel}
          />

          <View className="mb-3 flex-row">
            <Pressable
              className={`flex-1 items-center rounded-l-xl border py-2 ${newPromoType === "percentage" ? "bg-brand border-brand" : "bg-white border-brand/15"}`}
              onPress={() => setNewPromoType("percentage")}
            >
              <Text
                className={`text-sm font-poppins-bold ${newPromoType === "percentage" ? "text-white" : "text-brand-muted"}`}
              >
                Persen (%)
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 items-center rounded-r-xl border-t border-b border-r py-2 ${newPromoType === "nominal" ? "bg-brand border-brand" : "bg-white border-brand/15"}`}
              onPress={() => setNewPromoType("nominal")}
            >
              <Text
                className={`text-sm font-poppins-bold ${newPromoType === "nominal" ? "text-white" : "text-brand-muted"}`}
              >
                Nominal (Rp)
              </Text>
            </Pressable>
          </View>

          <TextInput
            className="font-poppins mb-3 rounded-xl border border-brand/15 px-3 py-2 text-sm"
            placeholder={
              newPromoType === "percentage"
                ? "Nilai Persen (cth: 10)"
                : "Nilai Rupiah (cth: 15000)"
            }
            keyboardType="number-pad"
            value={
              newPromoValue > ""
                ? formatNumberInput(parseFormattedNumber(newPromoValue))
                : ""
            }
            onChangeText={setNewPromoValue}
          />
          <TextInput
            className="font-poppins mb-3 rounded-xl border border-brand/15 px-3 py-2 text-sm"
            placeholder="Minimal Belanja (Opsional)"
            keyboardType="number-pad"
            value={
              newPromoMinSubtotal > ""
                ? formatNumberInput(parseFormattedNumber(newPromoMinSubtotal))
                : ""
            }
            onChangeText={setNewPromoMinSubtotal}
          />

          <AppButton
            label="Tambah Promo"
            onPress={handleAddPromo}
            variant="secondary"
          />
        </View>
      </View>

      <View className="mb-4 rounded-[28px] bg-white p-5">
        <Text className="text-lg font-poppins-bold text-brand-ink">
          Kategori Produk & Paket
        </Text>
        <Text className="font-poppins mt-1 mb-4 text-sm text-brand-muted">
          Kategori ini akan muncul sebagai opsi untuk mengelompokkan menu, termasuk kategori khusus "Paket".
        </Text>

        <View className="mb-4 flex-row flex-wrap">
          {categories.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => handleRemoveCategory(cat)}
              className="mr-2 mb-2 flex-row items-center rounded-full bg-brand-soft/50 px-3 py-1.5 border border-brand/10"
            >
              <Text className="font-poppins text-sm text-brand-ink mr-2">{cat}</Text>
              <Text className="font-poppins text-xs font-bold text-red-500">×</Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row items-center">
          <TextInput
            className="flex-1 font-poppins rounded-xl border border-brand/15 px-4 py-3 text-sm mr-2"
            placeholder="Tambah kategori..."
            value={newCategory}
            onChangeText={setNewCategory}
            onSubmitEditing={handleAddCategory}
          />
          <Pressable onPress={handleAddCategory} className="rounded-xl bg-brand px-4 py-3">
            <Text className="font-poppins font-bold text-white text-sm">Tambah</Text>
          </Pressable>
        </View>
      </View>

      <View className="mb-6 mt-2">
        <AppButton
          label="Simpan Pengaturan"
          onPress={handleSave}
          loading={isSaving}
        />
      </View>
    </ScreenContainer>
  );
};
