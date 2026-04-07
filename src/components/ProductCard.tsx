import { memo } from "react";
import { Image, Pressable, Text, View } from "react-native";

import { Product } from "@/types";
import { formatIDR } from "@/utils/currency";

interface Props {
  product: Product;
  onPress: (product: Product) => void;
  onIncrease: (product: Product) => void;
  onDecrease: (product: Product) => void;
  quantity?: number;
}

export const ProductCard = memo(
  ({ product, onPress, onIncrease, onDecrease, quantity = 0 }: Props) => (
    <Pressable
      className="w-full overflow-hidden rounded-[32px] bg-white shadow-sm"
      onPress={() => onPress(product)}
      android_ripple={{ color: "#f2e4d1" }}
    >
      <View className="relative h-24 w-full bg-brand-soft/30">
        {product.image ? (
          <Image
            source={{ uri: product.image }}
            className="h-full w-full"
            resizeMode="cover"
          />
        ) : (
          <View className="h-full w-full items-center justify-center">
            <Text className="font-poppins text-3xl text-brand-soft">🥘</Text>
          </View>
        )}
      </View>
      <View className="p-3.5">
        <Text
          className="text-base font-poppins-bold text-brand-ink"
          numberOfLines={1}
        >
          {product.name}
        </Text>
        <Text className="text-xs font-poppins-semibold text-brand-muted">
          {product.category}
        </Text>

        <View className="mt-3">
          <Text className="text-lg font-poppins-bold text-brand">
            {formatIDR(product.price)}
          </Text>
          <View className="mt-2 flex-row items-center justify-between">
            <View className="mr-2 flex-1 flex-row flex-wrap items-center">
              {typeof product.stock === "number" ? (
                <View className="mt-1 mr-1 rounded-full bg-brand-soft px-2 py-0.5">
                  <Text className="text-[10px] font-poppins-bold text-brand">
                    Stok {product.stock}
                  </Text>
                </View>
              ) : null}
            </View>
            <View className="flex-row items-center rounded-full bg-brand-soft/80 px-1 py-1">
              <Pressable
                className={`h-8 w-8 items-center justify-center rounded-full ${quantity > 0 ? "bg-white" : "bg-white/60 opacity-60"}`}
                hitSlop={8}
                onPress={(event) => {
                  event.stopPropagation();
                  if (quantity > 0) {
                    onDecrease(product);
                  }
                }}
              >
                <Text
                  className={`text-lg font-poppins-bold ${quantity > 0 ? "text-brand-ink" : "text-brand-muted"}`}
                >
                  -
                </Text>
              </Pressable>
              <Text className="min-w-[24px] px-2 text-center text-sm font-poppins-bold text-brand-ink">
                {quantity}
              </Text>
              <Pressable
                className="h-8 w-8 items-center justify-center rounded-full bg-brand"
                hitSlop={8}
                onPress={(event) => {
                  event.stopPropagation();
                  onIncrease(product);
                }}
              >
                <Text className="text-lg font-poppins-bold text-white">+</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  ),
);

ProductCard.displayName = "ProductCard";
