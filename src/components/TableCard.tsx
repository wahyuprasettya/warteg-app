import { Pressable, Text, View } from "react-native";

import { RestaurantTable } from "@/types";

interface Props {
  table: RestaurantTable;
  onPress: (tableNumber: string) => void;
}

export const TableCard = ({ table, onPress }: Props) => (
  <Pressable
    className={`m-1 flex-1 rounded-3xl p-5 ${table.status === "terisi" ? "bg-brand" : "bg-white"}`}
    onPress={() => onPress(table.number)}
  >
    <Text className={`text-xl font-poppins-bold ${table.status === "terisi" ? "text-white" : "text-brand-ink"}`}>
      {table.number}
    </Text>
    <View className="mt-3 rounded-full bg-black/10 px-3 py-2 self-start">
      <Text className={`font-poppins-semibold ${table.status === "terisi" ? "text-white" : "text-brand-muted"}`}>
        {table.status}
      </Text>
    </View>
  </Pressable>
);
