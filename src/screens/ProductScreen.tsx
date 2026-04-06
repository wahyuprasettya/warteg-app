import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAuth } from "@/hooks/useAuth";
import { archiveProduct, seedDummyProducts, subscribeProducts } from "@/services/firestoreService";
import { AppStackParamList, Product } from "@/types";
import { formatIDR } from "@/utils/currency";

type Props = NativeStackScreenProps<AppStackParamList, "Products">;

export const ProductScreen = ({ navigation }: Props) => {
  const { authUser, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!authUser || !profile?.businessType) {
      return;
    }

    seedDummyProducts(authUser.uid, profile.businessType).catch(() => null);
    const unsubscribe = subscribeProducts(authUser.uid, profile.businessType, setProducts);
    return unsubscribe;
  }, [authUser, profile?.businessType]);

  const summary = useMemo(() => {
    const categoryCount = new Set(products.map((product) => product.category)).size;
    const lowStockCount = products.filter(
      (product) => typeof product.stock === "number" && product.stock <= 5,
    ).length;
    const estimatedValue = products.reduce(
      (total, product) => total + product.price * (typeof product.stock === "number" ? product.stock : 0),
      0,
    );

    return {
      categoryCount,
      lowStockCount,
      estimatedValue,
    };
  }, [products]);

  const handleDelete = async (productId: string) => {
    try {
      await archiveProduct(productId);
    } catch (error) {
      Alert.alert("Gagal hapus produk", "Produk belum bisa diarsipkan.");
    }
  };

  return (
    <ScreenContainer>
      <AppHeader
        title="Manajemen Produk"
        subtitle="Pantau katalog aktif, stok, dan nilai jual dalam satu tempat."
        actionLabel="Tambah"
        actionIcon="✦"
        onActionPress={() => navigation.navigate("AddProduct")}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-4 overflow-hidden rounded-[34px] border border-brand/15 bg-brand p-5">
          <View className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10" />
          <View className="absolute -left-6 bottom-0 h-20 w-20 rounded-full bg-white/10" />

          <Text className="text-sm font-poppins-semibold text-white/75">Katalog aktif</Text>
          <Text className="mt-2 text-4xl font-poppins-bold text-white">{products.length}</Text>
          <Text className="mt-2 text-sm leading-5 text-white/80">
            {products.length === 0
              ? "Belum ada produk aktif. Tambahkan produk pertama untuk mulai mengelola katalog."
              : `${summary.categoryCount} kategori aktif dengan tampilan yang siap dikelola lebih cepat.`}
          </Text>

          <View className="mt-4 flex-row">
            <View className="mr-2 flex-1 rounded-[22px] bg-white/12 p-3">
              <Text className="text-[11px] font-poppins-semibold uppercase tracking-wide text-white/60">
                Stok Terbatas
              </Text>
              <Text className="mt-1 text-xl font-poppins-bold text-white">{summary.lowStockCount}</Text>
            </View>
            <View className="flex-1 rounded-[22px] bg-white/12 p-3">
              <Text className="text-[11px] font-poppins-semibold uppercase tracking-wide text-white/60">
                Nilai Estimasi
              </Text>
              <Text className="mt-1 text-base font-poppins-bold text-white" numberOfLines={1}>
                {formatIDR(summary.estimatedValue)}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-4 flex-row">
          <View className="mr-2 flex-1 rounded-[26px] border border-brand/5 bg-white p-4">
            <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">Kategori</Text>
            <Text className="mt-2 text-2xl font-poppins-bold text-brand-ink">{summary.categoryCount}</Text>
          </View>
          <View className="flex-1 rounded-[26px] border border-brand/5 bg-white p-4">
            <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">Produk Aktif</Text>
            <Text className="mt-2 text-2xl font-poppins-bold text-brand-ink">{products.length}</Text>
          </View>
        </View>

        {products.length === 0 ? (
          <EmptyState title="Belum ada produk" description="Tambahkan produk pertama untuk mulai berjualan." />
        ) : (
          <View className="pb-4">
            {products.map((product, index) => {
              const isLowStock = typeof product.stock === "number" && product.stock <= 5;

              return (
                <View
                  key={product.id}
                  className="mb-3 overflow-hidden rounded-[30px] border border-brand/5 bg-white p-4 shadow-sm"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="mr-3 flex-1">
                      <View className="mb-2 flex-row items-center">
                        <View className="mr-2 rounded-full bg-brand-soft px-2.5 py-1">
                          <Text className="text-[10px] font-poppins-semibold uppercase tracking-wide text-brand">
                            #{index + 1}
                          </Text>
                        </View>
                        <View className="rounded-full bg-brand-soft/70 px-2.5 py-1">
                          <Text className="text-[10px] font-poppins-semibold text-brand-muted">
                            {product.category}
                          </Text>
                        </View>
                      </View>

                      <Text className="text-xl font-poppins-bold text-brand-ink">{product.name}</Text>
                      <Text className="mt-1 text-sm leading-5 text-brand-muted">
                        Produk aktif untuk {profile?.businessType}. Kelola harga dan stok dengan cepat.
                      </Text>
                    </View>

                    <View className="rounded-[22px] bg-brand px-3 py-3">
                      <Text className="text-[10px] font-poppins-semibold uppercase tracking-wide text-white/70">
                        Harga
                      </Text>
                      <Text className="mt-1 text-base font-poppins-bold text-white">
                        {formatIDR(product.price)}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4 flex-row flex-wrap">
                    <View className="mr-2 mb-2 rounded-full bg-brand-soft px-3 py-1.5">
                      <Text className="text-[11px] font-poppins-semibold text-brand">
                        {typeof product.stock === "number" ? `Stok ${product.stock}` : "Stok fleksibel"}
                      </Text>
                    </View>
                    <View
                      className={`mb-2 rounded-full px-3 py-1.5 ${
                        isLowStock ? "bg-red-50" : "bg-emerald-50"
                      }`}
                    >
                      <Text
                        className={`text-[11px] font-poppins-semibold ${
                          isLowStock ? "text-red-700" : "text-emerald-700"
                        }`}
                      >
                        {isLowStock ? "Perlu restock" : "Stok aman"}
                      </Text>
                    </View>
                  </View>

                  <View className="mt-2 flex-row">
                    <Pressable
                      className="mr-2 flex-1 rounded-[22px] bg-brand px-4 py-3"
                      onPress={() => navigation.navigate("AddProduct", { product })}
                    >
                      <Text className="text-center text-sm font-poppins-bold text-white">Edit Produk</Text>
                    </Pressable>
                    <Pressable
                      className="rounded-[22px] border border-red-200 bg-red-50 px-4 py-3"
                      onPress={() => handleDelete(product.id)}
                    >
                      <Text className="text-sm font-poppins-bold text-red-700">Arsipkan</Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>
    </ScreenContainer>
  );
};
