import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Alert, FlatList, Text, useWindowDimensions, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { CartSummaryBar } from "@/components/CartSummaryBar";
import { CategoryPill } from "@/components/CategoryPill";
import { EmptyState } from "@/components/EmptyState";
import { ProductCard } from "@/components/ProductCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SearchBar } from "@/components/SearchBar";
import { dummyProductsByType } from "@/data/dummy";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import {
  seedDummyProducts,
  subscribeProducts,
} from "@/services/firestoreService";
import { AppStackParamList, Product } from "@/types";

type Props = NativeStackScreenProps<AppStackParamList, "POS">;

export const POSScreen = ({ navigation, route }: Props) => {
  const { authUser, profile, signOutUser } = useAuth();
  const { addToCart, items, total, setActiveTable, updateQty } = useCart();
  const { width } = useWindowDimensions();
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");

  const categoryIcons: Record<string, string> = {
    Semua: "🌈",
    Makanan: "🍛",
    Minuman: "🥤",
    Lauk: "🍗",
    Sayur: "🥦",
    Nasi: "🍚",
    Paket: "🍱",
    Snack: "🍪",
    Sembako: "📦",
    "Kebutuhan Rumah": "🧼",
  };

  useEffect(() => {
    if (!profile?.businessType) {
      return;
    }

    setActiveTable(route.params?.tableNumber);

    if (!authUser) {
      setProducts(dummyProductsByType[profile.businessType]);
      return;
    }

    seedDummyProducts(authUser.uid, profile.businessType).catch(() => null);
    const unsubscribe = subscribeProducts(
      authUser.uid,
      profile.businessType,
      setProducts,
    );
    return unsubscribe;
  }, [
    authUser,
    profile?.businessType,
    route.params?.tableNumber,
    setActiveTable,
  ]);

  const categories = useMemo(
    () => ["Semua", ...new Set(products.map((product) => product.category))],
    [products],
  );

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const sameCategory =
          category === "Semua" || product.category === category;
        const sameKeyword = product.name
          .toLowerCase()
          .includes(search.toLowerCase());
        return sameCategory && sameKeyword;
      }),
    [category, products, search],
  );

  const cartQtyByProductId = useMemo(
    () =>
      items.reduce<Record<string, number>>((acc, item) => {
        acc[item.id] = item.qty;
        return acc;
      }, {}),
    [items],
  );

  const handleAdd = (product: Product) => {
    addToCart(product);
  };

  const handleDecrease = (product: Product) => {
    const currentQty = cartQtyByProductId[product.id] ?? 0;
    if (currentQty > 0) {
      updateQty(product.id, currentQty - 1);
    }
  };

  const handleOpenDetail = (product: Product) => {
    navigation.navigate("AddProduct", { product });
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      Alert.alert("Logout gagal", "Coba ulangi beberapa saat lagi.");
    }
  };

  const numColumns = width > 700 ? 3 : 2;

  return (
    <ScreenContainer>
      <AppHeader
        title={profile?.businessType === "toko" ? "Kasir Toko" : "Kasir Cepat"}
        subtitle={
          route.params?.tableNumber
            ? `Mode restoran untuk ${route.params.tableNumber}`
            : "Tambah produk ke cart cukup dengan satu tap."
        }
        actionLabel="Produk"
        actionIcon="📦"
        onActionPress={() => navigation.navigate("Products")}
      />

      <View className="mb-3 flex-row">
        <View className="mr-2 flex-1">
          <AppButton
            label="Dashboard"
            onPress={() => navigation.navigate("Dashboard")}
            variant="secondary"
          />
        </View>
        <View className="flex-1">
          <AppButton label="Logout" onPress={handleLogout} variant="ghost" />
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} />

      <View className="mb-1 h-11">
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <CategoryPill
              label={item}
              icon={categoryIcons[item]}
              active={item === category}
              onPress={() => setCategory(item)}
            />
          )}
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{ paddingRight: 4 }}
        />
      </View>

      {filteredProducts.length === 0 ? (
        <EmptyState
          title="Produk tidak ditemukan"
          description="Coba ubah kata kunci atau tambah produk baru."
        />
      ) : (
        <FlatList
          key={`list-${numColumns}`}
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          numColumns={numColumns}
          renderItem={({ item }) => (
            <View
              className="self-start px-1 pb-2"
              style={{ width: `${100 / numColumns}%` }}
            >
              <ProductCard
                product={item}
                onPress={handleOpenDetail}
                onIncrease={handleAdd}
                onDecrease={handleDecrease}
                quantity={cartQtyByProductId[item.id] ?? 0}
              />
            </View>
          )}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={<View className="h-4" />}
          contentContainerStyle={{ paddingTop: 2 }}
        />
      )}

      {items.length > 0 ? (
        <CartSummaryBar
          itemCount={items.length}
          total={total}
          onPress={() => navigation.navigate("Cart")}
        />
      ) : (
        <View className="pt-3">
          <Text className="font-poppins text-center text-sm text-brand-muted">
            Keranjang masih kosong.
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
};
