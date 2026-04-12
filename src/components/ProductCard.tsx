import { memo } from "react";
import { Image, Pressable, Text, View, useWindowDimensions } from "react-native";

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
  ({ product, onPress, onIncrease, onDecrease, quantity = 0 }: Props) => {
    const { width } = useWindowDimensions();
    const isTablet = width >= 768;

    return (
      <Pressable
        className="w-full overflow-hidden rounded-[32px] bg-white shadow-sm"
        onPress={() => onPress(product)}
        android_ripple={{ color: "#f2e4d1" }}
      >
        <View className="relative w-full bg-brand-soft/30" style={{ height: isTablet ? 112 : 96 }}>
          {product.image ? (
            <Image
              source={{ uri: product.image }}
              className="h-full w-full"
              resizeMode="cover"
            />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Text style={{ fontFamily: "Poppins-Bold", fontSize: isTablet ? 26 : 24, color: "#c17d3c" }}>🥘</Text>
            </View>
          )}
        </View>
        <View className="p-3.5">
          <Text
            style={{ fontFamily: "Poppins-Bold", fontSize: isTablet ? 17 : 16, color: "#2d2d2d" }}
            numberOfLines={1}
          >
            {product.name}
          </Text>
          <Text style={{ fontFamily: "Poppins", fontSize: 12, color: "#888" }}>
            {product.category}
          </Text>

          <View className="mt-3">
            <Text style={{ fontFamily: "Poppins-Bold", fontSize: isTablet ? 19 : 18, color: "#c17d3c" }}>
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
                    style={{ fontFamily: "Poppins-Bold", fontSize: 18, color: quantity > 0 ? "#2d2d2d" : "#888" }}
                  >
                    -
                  </Text>
                </Pressable>
                <Text style={{ fontFamily: "Poppins-Bold", minWidth: 24, textAlign: "center", fontSize: 14, color: "#2d2d2d" }}>
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
                  <Text style={{ fontFamily: "Poppins-Bold", fontSize: 18, color: "#fff" }}>+</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </Pressable>
    );
  },
);

ProductCard.displayName = "ProductCard";
