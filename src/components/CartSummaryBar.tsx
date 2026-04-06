import { Pressable, Text, View } from "react-native";

import { formatIDR } from "@/utils/currency";

interface Props {
  itemCount: number;
  total: number;
  onPress: () => void;
  label?: string;
}

export const CartSummaryBar = ({ itemCount, total, onPress, label = "Buka Keranjang" }: Props) => (
  <Pressable className="overflow-hidden rounded-[30px] border border-brand/20 bg-brand px-4 py-4 shadow-sm" onPress={onPress}>
    <View className="flex-row items-center justify-between">
      <View className="flex-1 pr-3">
        <View className="self-start rounded-full bg-white/12 px-2.5 py-1">
          <Text className="text-xs font-poppins-bold uppercase tracking-wide text-white/80">{itemCount} item</Text>
        </View>
        <Text className="text-2xl font-poppins-bold text-white">{formatIDR(total)}</Text>
      </View>
      <View className="flex-row items-center rounded-full bg-white/12 px-2 py-2">
        <View className="mr-2 h-9 w-9 items-center justify-center rounded-full bg-white/15">
          <Text className="text-base">🛒</Text>
        </View>
        <View>
          <Text className="text-[10px] font-poppins-bold uppercase tracking-wide text-white/60">Keranjang</Text>
          <Text className="text-base font-poppins-bold text-white">{label}</Text>
        </View>
        <View className="ml-3 h-8 w-8 items-center justify-center rounded-full bg-white">
          <Text className="text-xs font-poppins-bold text-brand">{">"}</Text>
        </View>
      </View>
    </View>
  </Pressable>
);
