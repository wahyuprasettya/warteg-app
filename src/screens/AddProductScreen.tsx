import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Alert, Switch, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAuth } from "@/hooks/useAuth";
import { addProduct, editProduct } from "@/services/firestoreService";
import { AppStackParamList } from "@/types";
import { formatNumberInput, parseFormattedNumber } from "@/utils/currency";

type Props = NativeStackScreenProps<AppStackParamList, "AddProduct">;

export const AddProductScreen = ({ navigation, route }: Props) => {
  const { authUser, profile } = useAuth();
  const currentProduct = route.params?.product;

  const [name, setName] = useState(currentProduct?.name ?? "");
  const [price, setPrice] = useState(
    currentProduct?.price ? formatNumberInput(currentProduct.price) : "",
  );
  const [category, setCategory] = useState(currentProduct?.category ?? "");
  const [stock, setStock] = useState(currentProduct?.stock ? String(currentProduct.stock) : "");
  const [isActive, setIsActive] = useState(currentProduct?.isActive ?? true);
  const [isSaving, setIsSaving] = useState(false);

  const title = useMemo(() => (currentProduct ? "Edit Produk" : "Tambah Produk"), [currentProduct]);

  const handleSave = async () => {
    if (!authUser || !profile?.businessType) {
      return;
    }

    try {
      setIsSaving(true);

      const payload = {
        userId: authUser.uid,
        businessType: profile.businessType,
        name,
        price: parseFormattedNumber(price),
        category,
        stock: stock ? Number(stock) : undefined,
        isActive,
      };

      if (currentProduct) {
        await editProduct(currentProduct.id, payload);
      } else {
        await addProduct(payload);
      }

      navigation.goBack();
    } catch (error) {
      Alert.alert("Gagal simpan", "Periksa data produk Anda lalu coba lagi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScreenContainer scroll>
      <AppHeader title={title} subtitle="Form dibuat singkat agar input produk tidak melelahkan." />

      <View className="rounded-[28px] bg-white p-5">
        <TextInput
          className="mb-3 rounded-2xl border border-brand/15 px-4 py-4 text-base"
          value={name}
          onChangeText={setName}
          placeholder="Nama produk"
        />
        <TextInput
          className="mb-3 rounded-2xl border border-brand/15 px-4 py-4 text-base"
          value={price}
          onChangeText={(value) => setPrice(formatNumberInput(value))}
          placeholder="Harga"
          keyboardType="number-pad"
        />
        <TextInput
          className="mb-3 rounded-2xl border border-brand/15 px-4 py-4 text-base"
          value={category}
          onChangeText={setCategory}
          placeholder="Kategori"
        />
        <TextInput
          className="rounded-2xl border border-brand/15 px-4 py-4 text-base"
          value={stock}
          onChangeText={setStock}
          placeholder="Stok (opsional)"
          keyboardType="number-pad"
        />

        <View className="mt-4 flex-row items-center justify-between rounded-2xl bg-brand-soft px-4 py-3">
          <Text className="text-base font-poppins-semibold text-brand-ink">Produk aktif</Text>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>
      </View>

      <View className="mt-4">
        <AppButton label="Simpan Produk" onPress={handleSave} loading={isSaving} />
      </View>
    </ScreenContainer>
  );
};
