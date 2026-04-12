import { Pressable, Text, View, useWindowDimensions } from "react-native";
import { getResponsiveLayout } from "@/utils/responsive";

import { RestaurantTable } from "@/types";

interface Props {
  table: RestaurantTable;
  onPress: (tableNumber: string) => void;
}

export const TableCard = ({ table, onPress }: Props) => {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return (
    <Pressable
      className={`m-1 flex-1 rounded-3xl ${table.status === "terisi" ? "bg-brand" : "bg-white"}`}
      style={{ padding: layout.isTablet ? 22 : 18, minHeight: layout.isTablet ? 124 : 104 }}
      onPress={() => onPress(table.number)}
    >
      <Text
        className={`font-poppins-bold ${table.status === "terisi" ? "text-white" : "text-brand-ink"}`}
        style={{ fontSize: layout.isTablet ? 24 : 20 }}
      >
        {table.number}
      </Text>
      <View className="mt-3 rounded-full bg-black/10 px-3 py-2 self-start">
        <Text
          className={`font-poppins-semibold ${table.status === "terisi" ? "text-white" : "text-brand-muted"}`}
          style={{ fontSize: layout.isTablet ? 13 : 12 }}
        >
          {table.status}
        </Text>
      </View>
    </Pressable>
  );
};
