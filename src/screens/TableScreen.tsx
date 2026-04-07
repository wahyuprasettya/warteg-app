import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { FlatList, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { ScreenContainer } from "@/components/ScreenContainer";
import { TableCard } from "@/components/TableCard";
import { restaurantTables } from "@/data/dummy";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { subscribeTodayTransactions } from "@/services/firestoreService";
import { AppStackParamList, RestaurantTable } from "@/types";

type Props = NativeStackScreenProps<AppStackParamList, "Table">;

export const TableScreen = ({ navigation }: Props) => {
  const { authUser } = useAuth();
  const { setActiveTable, clearCart } = useCart();
  const [tables, setTables] = useState<RestaurantTable[]>(restaurantTables);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    const unsubscribe = subscribeTodayTransactions(
      authUser.uid,
      (transactions) => {
        const occupiedTables = new Set(
          transactions
            .filter(
              (transaction) =>
                transaction.paymentStatus === "pending" &&
                transaction.tableNumber,
            )
            .map((transaction) => transaction.tableNumber as string),
        );

        setTables(
          restaurantTables.map((table) => ({
            ...table,
            status: occupiedTables.has(table.number) ? "terisi" : "kosong",
          })),
        );
      },
    );

    return unsubscribe;
  }, [authUser]);

  const handleSelectTable = (tableNumber: string) => {
    clearCart();
    setActiveTable(tableNumber);
    navigation.navigate("POS", { tableNumber });
  };

  return (
    <ScreenContainer>
      <AppHeader
        title="Daftar Meja"
        subtitle="Pilih meja terlebih dahulu sebelum masuk ke menu restoran."
        actionLabel="Dashboard"
        onActionPress={() => navigation.navigate("Dashboard")}
      />

      <View className="mb-4 rounded-[28px] bg-white p-4">
        <Text className="font-poppins text-base text-brand-ink">
          Meja berstatus <Text className="font-poppins-bold">terisi</Text>{" "}
          menandakan ada transaksi dengan pembayaran pending.
        </Text>
      </View>

      <FlatList
        data={tables}
        keyExtractor={(item) => item.number}
        numColumns={2}
        renderItem={({ item }) => (
          <TableCard table={item} onPress={handleSelectTable} />
        )}
        showsVerticalScrollIndicator={false}
      />
    </ScreenContainer>
  );
};
