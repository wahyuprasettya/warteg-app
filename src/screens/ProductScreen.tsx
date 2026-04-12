import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAuth } from "@/hooks/useAuth";
import {
  archiveProduct,
  subscribeProducts,
  restoreProduct,
} from "@/services/firestoreService";
import { AppStackParamList, Product } from "@/types";
import { formatIDR } from "@/utils/currency";
import { resolveStoreUserId } from "@/utils/store";

type Props = NativeStackScreenProps<AppStackParamList, "Products">;

export const ProductScreen = ({ navigation }: Props) => {
  const { authUser, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [busyProductId, setBusyProductId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const { width } = useWindowDimensions();
  const isCashier = profile?.role === "kasir";
  const lowStockThreshold = profile?.lowStockAlertThreshold ?? 5;
  const storeUserId = resolveStoreUserId(authUser?.uid, profile);
  const isWideLayout = width >= 768;

  useEffect(() => {
    if (!authUser || !storeUserId) return;

    // Load all products from the 'menu' collection in Firebase
    const unsubscribe = subscribeProducts(
      storeUserId,
      setProducts,
    );
    return unsubscribe;
  }, [authUser, storeUserId]);

  const summary = useMemo(() => {
    const activeProducts = products.filter((product) => product.isActive !== false);
    const archivedProducts = products.filter((product) => product.isActive === false);
    const archivedCount = archivedProducts.length;
    const categoryCount = new Set(activeProducts.map((product) => product.category))
      .size;
    const lowStockCount = activeProducts.filter(
      (product) =>
        typeof product.stock === "number" && product.stock <= lowStockThreshold,
    ).length;
    const estimatedValue = activeProducts.reduce(
      (total, product) =>
        total +
        product.price * (typeof product.stock === "number" ? product.stock : 0),
      0,
    );

    return {
      activeProducts,
      archivedProducts,
      archivedCount,
      categoryCount,
      lowStockCount,
      estimatedValue,
    };
  }, [lowStockThreshold, products]);

  const handleArchive = (product: Product) => {
    Alert.alert(
      "Arsipkan produk?",
      `${product.name} akan disembunyikan dari daftar aktif.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Arsipkan",
          style: "destructive",
          onPress: async () => {
            try {
              setBusyProductId(product.id);
              await archiveProduct(product.id);
              Alert.alert("Berhasil", `${product.name} sudah dipindahkan ke arsip.`);
            } catch (error) {
              Alert.alert("Gagal arsip", "Produk belum bisa diarsipkan.");
            } finally {
              setBusyProductId(null);
            }
          },
        },
      ],
    );
  };

  const handleRestore = (product: Product) => {
    Alert.alert(
      "Pulihkan produk?",
      `${product.name} akan kembali tampil di daftar aktif.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Pulihkan",
          onPress: async () => {
            try {
              setBusyProductId(product.id);
              await restoreProduct(product.id);
              Alert.alert("Berhasil", `${product.name} sudah dipulihkan.`);
            } catch (error) {
              Alert.alert("Gagal pulihkan", "Produk belum bisa dipulihkan.");
            } finally {
              setBusyProductId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <ScreenContainer>
      <AppHeader
        title={isCashier ? "Daftar Produk" : "Manajemen Produk"}
        subtitle={
          isCashier
            ? "Kasir bisa melihat daftar produk, mengecek harga, dan menambahkan produk cepat bila diperlukan."
            : "Pantau katalog aktif, stok, dan nilai jual dalam satu tempat."
        }
        actionLabel={isCashier ? "Quick Add" : "Tambah"}
        actionIcon={isCashier ? "⚡" : "✦"}
        onActionPress={() => navigation.navigate("AddProduct")}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-4 overflow-hidden rounded-[34px] border border-brand/15 bg-brand p-5">
          <View className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/10" />
          <View className="absolute -left-6 bottom-0 h-20 w-20 rounded-full bg-white/10" />

          <Text className="text-sm font-poppins-semibold text-white/75">
            Katalog aktif
          </Text>
          <Text className="mt-2 text-4xl font-poppins-bold text-white">
            {summary.activeProducts.length}
          </Text>
          <Text className="font-poppins mt-2 text-sm leading-5 text-white/80">
            {summary.activeProducts.length === 0
              ? isCashier
                ? "Belum ada produk aktif. Gunakan quick add bila perlu menambahkan menu cepat dari kasir."
                : "Belum ada produk aktif. Tambahkan produk pertama untuk mulai mengelola katalog."
              : isCashier
                ? `${summary.categoryCount} kategori siap dicek harganya langsung dari daftar produk.`
                : `${summary.categoryCount} kategori aktif dengan tampilan yang siap dikelola lebih cepat.`}
          </Text>
          {!isCashier && summary.archivedCount > 0 ? (
            <View className="mt-3 rounded-[18px] bg-white/12 px-3 py-2">
              <Text className="text-xs font-poppins-semibold text-white/80">
                {summary.archivedCount} produk sedang diarsipkan
              </Text>
            </View>
          ) : null}

          <View className="mt-4 flex-row">
            <View className="mr-2 flex-1 rounded-[22px] bg-white/12 p-3">
              <Text className="text-[11px] font-poppins-semibold uppercase tracking-wide text-white/60">
                Stok Terbatas
              </Text>
              <Text className="mt-1 text-xl font-poppins-bold text-white">
                {summary.lowStockCount}
              </Text>
            </View>
            <View className="flex-1 rounded-[22px] bg-white/12 p-3">
              <Text className="text-[11px] font-poppins-semibold uppercase tracking-wide text-white/60">
                Nilai Estimasi
              </Text>
              <Text
                className="mt-1 text-base font-poppins-bold text-white"
                numberOfLines={1}
              >
                {formatIDR(summary.estimatedValue)}
              </Text>
            </View>
          </View>
        </View>

        <View className="mb-4 flex-row">
          <View className="mr-2 flex-1 rounded-[26px] border border-brand/5 bg-white p-4">
            <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              Kategori
            </Text>
            <Text className="mt-2 text-2xl font-poppins-bold text-brand-ink">
              {summary.categoryCount}
            </Text>
          </View>
          <View className="flex-1 rounded-[26px] border border-brand/5 bg-white p-4">
            <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              Produk Aktif
            </Text>
            <Text className="mt-2 text-2xl font-poppins-bold text-brand-ink">
              {summary.activeProducts.length}
            </Text>
          </View>
        </View>

        {!isCashier && summary.archivedCount > 0 ? (
          <Pressable
            className="mb-4 rounded-[24px] border border-brand/10 bg-white px-4 py-4"
            onPress={() => setShowArchived((current) => !current)}
          >
            <Text className="text-sm font-poppins-bold text-brand-ink">
              {showArchived ? "Sembunyikan Arsip" : `Lihat Arsip (${summary.archivedCount})`}
            </Text>
            <Text className="mt-1 text-xs font-poppins text-brand-muted">
              Produk yang diarsipkan masih tersimpan dan bisa dipulihkan kapan saja.
            </Text>
          </Pressable>
        ) : null}

        {summary.activeProducts.length === 0 ? (
          <EmptyState
            title="Belum ada produk"
            description={
              summary.archivedCount > 0
                ? "Semua produk sudah diarsipkan. Aktifkan kembali dari data lama atau tambah menu baru untuk tampil di daftar aktif."
                : isCashier
                  ? "Belum ada produk aktif. Gunakan quick add bila perlu menambahkan menu dari kasir."
                  : "Tambahkan produk pertama untuk mulai berjualan."
            }
          />
        ) : (
          <View className="pb-4">
            {summary.activeProducts.map((product, index) => {
              const isLowStock =
                typeof product.stock === "number" &&
                product.stock <= lowStockThreshold;

              return (
                <View
                  key={product.id}
                  className="mb-3 overflow-hidden rounded-[30px] border border-brand/5 bg-white shadow-sm"
                >
                  <View className={`p-4 ${isWideLayout ? "p-5" : ""}`}>
                    <View className={`${isWideLayout ? "flex-row items-start" : ""}`}>
                      <View className={`flex-1 ${isWideLayout ? "mr-4" : ""}`}>
                        <View className="mb-3 flex-row flex-wrap items-center">
                          <View className="mr-2 mb-2 rounded-full bg-brand-soft px-2.5 py-1">
                            <Text className="text-[10px] font-poppins-semibold uppercase tracking-wide text-brand">
                              #{index + 1}
                            </Text>
                          </View>
                          <View className="mr-2 mb-2 rounded-full bg-brand-soft/70 px-2.5 py-1">
                            <Text className="text-[10px] font-poppins-semibold text-brand-muted">
                              {product.category}
                            </Text>
                          </View>
                          <View
                            className={`mb-2 rounded-full px-2.5 py-1 ${
                              product.isActive ? "bg-emerald-50" : "bg-slate-100"
                            }`}
                          >
                            <Text
                              className={`text-[10px] font-poppins-semibold ${
                                product.isActive ? "text-emerald-700" : "text-slate-600"
                              }`}
                            >
                              {product.isActive ? "Aktif" : "Diarsipkan"}
                            </Text>
                          </View>
                        </View>

                        <View className="flex-row items-start">
                          {product.image ? (
                            <View className="mr-4 mt-1 h-16 w-16 overflow-hidden rounded-[16px] bg-brand-soft/30">
                              <Image
                                source={{ uri: product.image as string }}
                                className="h-16 w-16 rounded-[16px]"
                              />
                            </View>
                          ) : null}

                          <View className="flex-1">
                            <Text className="text-xl font-poppins-bold text-brand-ink">
                              {product.name}
                            </Text>
                            <Text className="font-poppins mt-1 text-sm leading-5 text-brand-muted">
                              {isCashier
                                ? "Cek harga dengan cepat. Detail lanjutan tetap dikelola owner."
                                : "Kelola harga dan stok dalam tampilan yang lebih ringkas."}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View
                        className={`mt-4 rounded-[24px] border border-brand/10 bg-brand-soft/30 p-4 ${
                          isWideLayout ? "mt-0 min-w-[180px]" : ""
                        }`}
                      >
                        <Text className="text-[10px] font-poppins-semibold uppercase tracking-wide text-brand-muted">
                          Harga Jual
                        </Text>
                        <Text
                          className={`mt-2 font-poppins-bold text-brand-ink ${
                            isWideLayout ? "text-2xl" : "text-[22px]"
                          }`}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {formatIDR(product.price)}
                        </Text>
                        <Text className="mt-1 text-xs font-poppins text-brand-muted">
                          per item
                        </Text>
                      </View>
                    </View>

                    <View className="mt-4 flex-row flex-wrap">
                      <View className="mr-2 mb-2 rounded-full bg-brand-soft px-3 py-1.5">
                        <Text className="text-[11px] font-poppins-semibold text-brand">
                          {typeof product.stock === "number"
                            ? `Stok ${product.stock}`
                            : "Stok fleksibel"}
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

                    {!isCashier ? (
                      <View className="mt-4 flex-row">
                        <Pressable
                          className="mr-2 flex-1 rounded-[22px] bg-brand px-4 py-3"
                          onPress={() =>
                            navigation.navigate("AddProduct", { product })
                          }
                        >
                          <Text className="text-center text-sm font-poppins-bold text-white">
                            Edit Produk
                          </Text>
                        </Pressable>
                        <Pressable
                          className={`rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 ${
                            busyProductId === product.id ? "opacity-50" : ""
                          }`}
                          disabled={busyProductId === product.id}
                          onPress={() => handleArchive(product)}
                        >
                          <Text className="text-sm font-poppins-bold text-red-700">
                            {busyProductId === product.id ? "Memindahkan..." : "Arsipkan"}
                          </Text>
                        </Pressable>
                      </View>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {!isCashier && showArchived && summary.archivedProducts.length > 0 ? (
          <View className="mb-4 rounded-[28px] border border-slate-200 bg-slate-50 p-4">
            <Text className="text-sm font-poppins-bold text-brand-ink">
              Arsip Produk
            </Text>
            <Text className="mt-1 text-xs font-poppins text-brand-muted">
              Menu di bawah ini tidak tampil di kasir atau web, tapi masih bisa dipulihkan.
            </Text>

            <View className="mt-4">
              {summary.archivedProducts.map((product, index) => (
                <View
                  key={product.id}
                  className="mb-3 rounded-[24px] border border-slate-200 bg-white p-4"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <View className="mb-2 flex-row flex-wrap items-center">
                        <View className="mr-2 mb-2 rounded-full bg-slate-100 px-2.5 py-1">
                          <Text className="text-[10px] font-poppins-semibold uppercase tracking-wide text-slate-500">
                            #{index + 1}
                          </Text>
                        </View>
                        <View className="mr-2 mb-2 rounded-full bg-slate-100 px-2.5 py-1">
                          <Text className="text-[10px] font-poppins-semibold text-slate-600">
                            {product.category}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-lg font-poppins-bold text-brand-ink">
                        {product.name}
                      </Text>
                      <Text className="mt-1 text-sm font-poppins text-brand-muted">
                        {typeof product.stock === "number"
                          ? `Stok ${product.stock}`
                          : "Stok fleksibel"}
                      </Text>
                    </View>

                    <View className="rounded-[18px] bg-slate-100 px-3 py-2">
                      <Text className="text-[10px] font-poppins-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </Text>
                      <Text className="mt-1 text-xs font-poppins-semibold text-slate-700">
                        Arsip
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4 flex-row">
                    <View className="mr-2 flex-1">
                      <Pressable
                        className={`rounded-[18px] bg-brand px-4 py-3 ${
                          busyProductId === product.id ? "opacity-50" : ""
                        }`}
                        disabled={busyProductId === product.id}
                        onPress={() => handleRestore(product)}
                      >
                        <Text className="text-center text-sm font-poppins-bold text-white">
                          {busyProductId === product.id ? "Memulihkan..." : "Pulihkan"}
                        </Text>
                      </Pressable>
                    </View>
                    <View className="ml-2 flex-1">
                      <Pressable
                        className="rounded-[18px] border border-brand/10 bg-white px-4 py-3"
                        onPress={() => navigation.navigate("AddProduct", { product })}
                      >
                        <Text className="text-center text-sm font-poppins-bold text-brand-ink">
                          Edit
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </ScreenContainer>
  );
};
