import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { FlatList, Text, View, Alert } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { ScreenContainer } from "@/components/ScreenContainer";
import { TableCard } from "@/components/TableCard";
import { restaurantTables } from "@/data/dummy";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { subscribeOrders, subscribeTables } from "@/services/firestoreService";
import { AppStackParamList, RestaurantTable } from "@/types";
import { isTableOrder } from "@/utils/order";
import { resolveStoreUserId } from "@/utils/store";
import { getGridColumns } from "@/utils/responsive";
import { useWindowDimensions } from "react-native";

type Props = NativeStackScreenProps<AppStackParamList, "Table">;

export const TableScreen = ({ navigation }: Props) => {
  const { authUser, profile } = useAuth();
  const { setActiveTable, clearCart } = useCart();
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const { width } = useWindowDimensions();
  const storeUserId = resolveStoreUserId(authUser?.uid, profile);

  useEffect(() => {
    if (!authUser || !storeUserId) {
      return;
    }

    // 1. Subscribe to the Master Table List (from Owner Settings)
    const unsubTables = subscribeTables(storeUserId, (tableList) => {
      // 2. Subscribe to Orders to determine which tables are occupied
      const unsubOrders = subscribeOrders(
        storeUserId,
        (orders) => {
          const occupiedTables = new Set(
            orders
              .filter(
                (order) =>
                  order.status !== "done" &&
                  isTableOrder(order) &&
                  (order.tableNumber || order.tableId),
              )
              .map((order) => (order.tableNumber || order.tableId) as string),
          );

          // Transform string list to RestaurantTable objects with live status
          const updated = tableList.map((num) => ({
            number: num,
            status: occupiedTables.has(num) ? "terisi" : "kosong",
          })) as RestaurantTable[];

          setTables(updated);
        },
      );

      return unsubOrders;
    });

    return unsubTables;
  }, [authUser, storeUserId]);

  const handleSelectTable = (tableNumber: string) => {
    const table = tables.find((t) => t.number === tableNumber);
    if (table?.status === "terisi") {
      Alert.alert(
        "Meja Terisi",
        "Meja ini sudah memiliki pesanan aktif. Silakan selesaikan pesanan di daftar order terlebih dahulu."
      );
      return;
    }
    clearCart();
    setActiveTable(tableNumber);
    navigation.navigate("POS", { tableNumber });
  };

  const numColumns = getGridColumns(width, { compact: 2, tablet: 3, wide: 4 });

  return (
    <ScreenContainer>
      <AppHeader
        title="Daftar Meja"
        subtitle="Pilih meja terlebih dahulu sebelum masuk ke menu restoran."
        actionLabel="Dashboard"
        onActionPress={() => navigation.navigate("Dashboard")}
      />

      {/* Table Statistics Summary */}
      <View style={{ marginBottom: 16, flexDirection: width < 420 ? "column" : "row" }}>
        <View className="rounded-[24px] bg-white p-4 items-center" style={{ flex: width < 420 ? undefined : 1, marginRight: width < 420 ? 0 : 8, marginBottom: width < 420 ? 8 : 0 }}>
          <Text className="text-2xl font-poppins-bold text-brand-ink">{tables.length}</Text>
          <Text className="text-[10px] font-poppins-semibold text-brand-muted uppercase">Total Meja</Text>
        </View>
        <View className="rounded-[24px] bg-white p-4 items-center" style={{ flex: width < 420 ? undefined : 1, marginHorizontal: width < 420 ? 0 : 8, marginBottom: width < 420 ? 8 : 0 }}>
          <Text className="text-2xl font-poppins-bold text-emerald-600">
            {tables.filter(t => t.status === 'kosong').length}
          </Text>
          <Text className="text-[10px] font-poppins-semibold text-brand-muted uppercase">Kosong</Text>
        </View>
        <View className="rounded-[24px] bg-white p-4 items-center" style={{ flex: width < 420 ? undefined : 1, marginLeft: width < 420 ? 0 : 8 }}>
          <Text className="text-2xl font-poppins-bold text-amber-600">
            {tables.filter(t => t.status === 'terisi').length}
          </Text>
          <Text className="text-[10px] font-poppins-semibold text-brand-muted uppercase">Terisi</Text>
        </View>
      </View>

      <View className="mb-4 rounded-[28px] bg-white p-4">
        <Text className="font-poppins text-sm text-brand-ink">
          {tables.length === 0 
            ? "Belum ada meja didaftarkan. Silakan ke Pengaturan untuk menambah meja."
            : "Ketuk nomor meja untuk mulai mencatat pesanan baru."
          }
        </Text>
        {tables.length === 0 && (
          <View className="mt-3">
            <AppButton 
              label="Ke Pengaturan Meja" 
              onPress={() => navigation.navigate("Settings")}
              variant="secondary"
            />
          </View>
        )}
      </View>

      <FlatList
        data={tables}
        keyExtractor={(item) => item.number}
        numColumns={numColumns}
        renderItem={({ item }) => (
          <TableCard table={item} onPress={handleSelectTable} />
        )}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="mt-10 items-center">
            <Text className="font-poppins text-brand-muted">Daftar meja kosong.</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
};
