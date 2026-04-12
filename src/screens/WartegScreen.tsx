import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { FlatList, Text, useWindowDimensions, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { CartSummaryBar } from "@/components/CartSummaryBar";
import { CategoryPill } from "@/components/CategoryPill";
import { ProductCard } from "@/components/ProductCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { dummyWartegProducts, wartegCategories } from "@/data/dummy";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import {
  seedDummyProducts,
  subscribeProducts,
} from "@/services/firestoreService";
import { AppStackParamList, Product } from "@/types";
import { resolveStoreUserId } from "@/utils/store";
import { getGridColumns } from "@/utils/responsive";

type Props = NativeStackScreenProps<AppStackParamList, "Warteg">;

export const WartegScreen = ({ navigation }: Props) => {
  const { authUser, profile } = useAuth();
  const { addToCart, items, total, updateQty } = useCart();
  const { width } = useWindowDimensions();
  const [products, setProducts] = useState<Product[]>(dummyWartegProducts);
  const [category, setCategory] = useState("Semua");
  const storeUserId = resolveStoreUserId(authUser?.uid, profile);

  const categoryIcons: Record<string, string> = {
    Semua: "🌈",
    Nasi: "🍚",
    Lauk: "🍗",
    Sayur: "🥦",
    Minuman: "🥤",
    Paket: "🍱",
  };

  useEffect(() => {
    if (!authUser || !storeUserId) {
      return;
    }

    seedDummyProducts(storeUserId).catch(() => null);
    const unsubscribe = subscribeProducts(storeUserId, setProducts);
    return unsubscribe;
  }, [authUser, storeUserId]);

  const activeProducts = useMemo(
    () => products.filter((item) => item.isActive !== false),
    [products],
  );

  const combos = useMemo(
    () => activeProducts.filter((item) => item.category === "Paket"),
    [activeProducts],
  );
  const visibleProducts = useMemo(
    () =>
      activeProducts.filter(
        (item) => category === "Semua" || item.category === category,
      ),
    [activeProducts, category],
  );

  const cartQtyByProductId = useMemo(
    () =>
      items.reduce<Record<string, number>>((acc, item) => {
        acc[item.id] = item.qty;
        return acc;
      }, {}),
    [items],
  );

  const numColumns = getGridColumns(width, { compact: 2, tablet: 3, wide: 4 });

  const handleDecrease = (product: Product) => {
    const currentQty = cartQtyByProductId[product.id] ?? 0;
    if (currentQty > 0) {
      updateQty(product.id, currentQty - 1);
    }
  };

  const handleOpenDetail = (product: Product) => {
    navigation.navigate("AddProduct", { product });
  };

  return (
    <ScreenContainer>
      <AppHeader
        title="Mode Warteg"
        subtitle="Pilih lauk dan menu prasmanan secepat mungkin. Target transaksi 2-3 klik."
        actionLabel="Riwayat"
        onActionPress={() => navigation.navigate("Transactions")}
      />

      <View className="mb-3 flex-row">
        <View className="mr-2 flex-1">
          <AppButton
            label="Dashboard"
            onPress={() => navigation.navigate("Dashboard")}
            variant="secondary"
          />
        </View>
      </View>

      {combos.length > 0 && category === "Semua" ? (
        <View className="mb-4 rounded-[32px] bg-white p-5 shadow-sm border border-brand/5">
          <Text className="text-xl font-poppins-bold text-brand-ink">
            Favorit Pelanggan 🌟
          </Text>
          <Text className="font-poppins mt-1 text-sm text-brand-muted">
            Tap paket untuk transaksi kilat.
          </Text>
          <View className="mt-4 flex-row">
            {combos.slice(0, 2).map((combo) => (
              <View className="mr-2 flex-1" key={combo.id}>
                <AppButton
                  label={combo.name.replace("Paket ", "")}
                  onPress={() => addToCart(combo)}
                  variant="secondary"
                />
              </View>
            ))}
          </View>
        </View>
      ) : null}

      <View className="mb-1 h-11">
        <FlatList
          horizontal
          data={wartegCategories}
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

      <FlatList
        key={`warteg-list-${numColumns}`}
        data={visibleProducts}
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
              onIncrease={addToCart}
              onDecrease={handleDecrease}
              quantity={cartQtyByProductId[item.id] ?? 0}
            />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={<View className="h-4" />}
        contentContainerStyle={{ paddingTop: 2 }}
      />

      {items.length > 0 ? (
        <CartSummaryBar
          itemCount={items.length}
          total={total}
          onPress={() => navigation.navigate("Cart")}
        />
      ) : (
        <View className="pt-3 items-center">
          <Text className="font-poppins text-center text-sm text-brand-muted">
            Pilih menu prasmanan diatas.
          </Text>
        </View>
      )}
    </ScreenContainer>
  );
};
