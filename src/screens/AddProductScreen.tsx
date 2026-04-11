import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAuth } from "@/hooks/useAuth";
import { addProduct, editProduct } from "@/services/firestoreService";
import { AppStackParamList } from "@/types";
import { formatNumberInput, parseFormattedNumber } from "@/utils/currency";
import { resolveStoreUserId } from "@/utils/store";

type Props = NativeStackScreenProps<AppStackParamList, "AddProduct">;

export const AddProductScreen = ({ navigation, route }: Props) => {
  const { authUser, profile } = useAuth();
  const currentProduct = route.params?.product;
  const isCashier = profile?.role === "kasir";
  const storeUserId = resolveStoreUserId(authUser?.uid, profile);

  const [name, setName] = useState(currentProduct?.name ?? "");
  const [price, setPrice] = useState(
    currentProduct?.price ? formatNumberInput(currentProduct.price) : "",
  );
  const [category, setCategory] = useState(currentProduct?.category ?? "");
  const [stock, setStock] = useState(
    currentProduct?.stock ? String(currentProduct.stock) : "",
  );
  const [isActive, setIsActive] = useState(currentProduct?.isActive ?? true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isCashier || !currentProduct) {
      return;
    }

    Alert.alert(
      "Akses terbatas",
      "Kasir hanya bisa menambahkan produk cepat. Edit produk tetap dikelola owner.",
      [
        {
          text: "OK",
          onPress: () => {
            if (navigation.canGoBack()) {
              navigation.goBack();
              return;
            }

            navigation.navigate("OrderList");
          },
        },
      ],
    );
  }, [currentProduct, isCashier, navigation]);

  const handleSave = async () => {
    if (!authUser || !storeUserId) {
      Alert.alert("Error", "Anda harus login terlebih dahulu.");
      return;
    }
    if (isCashier && currentProduct) {
      Alert.alert(
        "Akses terbatas",
        "Kasir tidak bisa mengedit produk yang sudah ada.",
      );
      return;
    }
    if (!name.trim()) {
      Alert.alert("Validasi", "Nama produk wajib diisi.");
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        userId: storeUserId,
        name: name.trim(),
        price: parseFormattedNumber(price),
        category: category.trim() || "Umum",
        stock: isCashier ? undefined : stock ? Number(stock) : undefined,
        isActive: isCashier ? true : isActive,
      };

      if (currentProduct) {
        await editProduct(currentProduct.id, payload);
      } else {
        await addProduct(payload);
      }

      navigation.goBack();
    } catch (error: any) {
      console.error("Save product error:", error);
      Alert.alert("Gagal simpan", `Error: ${error?.message || "Kesalahan tak dikenal"}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer scroll>
      <View className="mb-6 mt-2 overflow-hidden rounded-[36px] border border-brand/15 bg-brand p-6 shadow-sm">
        <View className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
        <View className="absolute -bottom-10 -left-6 h-28 w-28 rounded-full bg-white/10" />

        <View className="flex-row items-center justify-between relative z-10">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-poppins-bold text-white">
              {isCashier
                ? "Quick Add Produk"
                : currentProduct
                  ? "Edit Produk"
                  : "Menu Baru"}
            </Text>
            <Text className="font-poppins mt-2 text-sm leading-5 text-white/80">
              {isCashier
                ? "Isi nama, harga, dan kategori saja. Produk baru akan langsung muncul di daftar kasir."
                : "Lengkapi detail di bawah untuk memperbarui katalog tokomu hingga tampil di layar kasir."}
            </Text>
          </View>
          <View className="h-16 w-16 items-center justify-center rounded-[22px] bg-white/20">
            <Text className="font-poppins text-3xl">
              {isCashier ? "⚡" : currentProduct ? "📝" : "✨"}
            </Text>
          </View>
        </View>
      </View>

      <View className="mb-4 rounded-[28px] border border-brand/5 bg-white p-5 shadow-sm">
        <Text className="mb-4 text-lg font-poppins-bold text-brand-ink">
          Info Dasar
        </Text>

        <Text className="mb-2 text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
          {isCashier ? "Nama Produk" : "Nama Menu"}
        </Text>
        <TextInput
          className="mb-4 rounded-2xl border border-brand/15 bg-brand-soft/20 px-4 py-4 text-base font-poppins-medium text-brand-ink"
          value={name}
          onChangeText={setName}
          placeholder="Cth: Nasi Goreng Spesial"
          placeholderTextColor="#A0A0A0"
        />

        <View className="mb-2 flex-row justify-between items-center">
          <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">Kategori</Text>
        </View>
        <TextInput
          className="font-poppins rounded-2xl border border-brand/15 bg-brand-soft/20 px-4 py-4 text-base font-medium text-brand-ink mb-3"
          value={category}
          onChangeText={setCategory}
          placeholder="Cth: Makanan, Minuman, Paket"
          placeholderTextColor="#A0A0A0"
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
          {(profile?.categories ?? ["Makanan", "Minuman", "Cemilan", "Paket"]).map((cat) => (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              className={`mr-2 rounded-full px-3 py-1.5 border items-center justify-center ${category === cat ? "bg-brand border-brand" : "bg-white border-brand/20"}`}
            >
              <Text className={`font-poppins text-xs ${category === cat ? "text-white font-bold" : "text-brand-ink"}`}>
                {cat}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      <View className="mb-4 rounded-[28px] border border-brand/5 bg-white p-5 shadow-sm">
        <Text className="mb-4 text-lg font-poppins-bold text-brand-ink">
          {isCashier ? "Harga Jual" : "Penetapan Harga & Stok"}
        </Text>

        <View className="flex-row items-start justify-between">
          <View className="mr-3 flex-1">
            <Text className="mb-2 text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              Harga Jual
            </Text>
            <View className="flex-row items-center rounded-2xl border border-brand/15 bg-brand-soft/20 px-4 py-1">
              <Text className="mr-2 text-base font-poppins-bold text-brand">
                Rp
              </Text>
              <TextInput
                className="flex-1 py-3 text-base font-poppins-bold text-brand"
                value={price}
                onChangeText={(value) => setPrice(formatNumberInput(value))}
                placeholder="0"
                keyboardType="number-pad"
                placeholderTextColor="#A0A0A0"
              />
            </View>
          </View>

          {!isCashier ? (
            <View className="flex-1">
              <Text className="mb-2 text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
                Stok (Opsional)
              </Text>
              <TextInput
                className="rounded-2xl border border-brand/15 bg-brand-soft/20 px-4 py-4 text-base font-poppins-medium text-brand-ink"
                value={stock}
                onChangeText={setStock}
                placeholder="Tanpa batas"
                keyboardType="number-pad"
                placeholderTextColor="#A0A0A0"
              />
            </View>
          ) : null}
        </View>
      </View>

      {!isCashier ? (
        <Pressable
          className={`mb-6 flex-row items-center justify-between rounded-[26px] border p-5 ${
            isActive
              ? "border-brand/40 bg-brand/5"
              : "border-brand/10 bg-brand-soft/30"
          }`}
          onPress={() => setIsActive(!isActive)}
        >
          <View className="flex-1 pr-4">
            <Text
              className={`text-base font-poppins-bold ${isActive ? "text-brand" : "text-brand-muted"}`}
            >
              Status: {isActive ? "Tersedia" : "Disembunyikan"}
            </Text>
            <Text
              className={`mt-1 text-xs leading-5 ${isActive ? "text-brand/80" : "text-brand-muted"}`}
            >
              {isActive
                ? "Menu ini akan langsung tampil dan bisa dibeli di layar kasir."
                : "Sembunyikan menu ini untuk sementara jika stok sedang habis."}
            </Text>
          </View>
          <Switch
            value={isActive}
            onValueChange={setIsActive}
            trackColor={{ false: "#e0e0e0", true: "#A63D40" }}
            thumbColor="#ffffff"
          />
        </Pressable>
      ) : (
        <View className="mb-6 rounded-[26px] border border-brand/10 bg-brand-soft/30 p-5">
          <Text className="text-base font-poppins-bold text-brand">
            Mode Quick Add
          </Text>
          <Text className="mt-1 text-xs leading-5 text-brand-muted">
            Produk yang ditambahkan kasir akan langsung aktif. Perubahan stok,
            edit detail, dan arsip produk tetap dikelola owner.
          </Text>
        </View>
      )}

      <View className="mb-6">
        <AppButton
          label={isCashier ? "Tambah Cepat" : "Simpan Produk"}
          onPress={handleSave}
          loading={isSaving}
        />
      </View>

      <View className="items-center pb-2 opacity-50">
        <Text
          className="text-xs font-poppins-semibold tracking-wide text-brand-muted"
          onPress={() => navigation.goBack()}
        >
          Batalkan & Kembali
        </Text>
      </View>
    </ScreenContainer>
  );
};
