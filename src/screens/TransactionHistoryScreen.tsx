import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAuth } from "@/hooks/useAuth";
import { subscribeTodayTransactions } from "@/services/firestoreService";
import { AppStackParamList, TransactionRecord } from "@/types";
import { formatIDR } from "@/utils/currency";
import { friendlyDateTime } from "@/utils/date";

type Props = NativeStackScreenProps<AppStackParamList, "Transactions">;

export const TransactionHistoryScreen = ({ navigation }: Props) => {
  const { authUser } = useAuth();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    const unsubscribe = subscribeTodayTransactions(authUser.uid, setTransactions);
    return unsubscribe;
  }, [authUser]);

  return (
    <ScreenContainer>
      <AppHeader title="Transaksi Hari Ini" subtitle="Pantau transaksi yang baru masuk." actionLabel="Dashboard" onActionPress={() => navigation.navigate("Dashboard")} />

      {transactions.length === 0 ? (
        <EmptyState title="Belum ada transaksi" description="Riwayat akan muncul otomatis setelah checkout." />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {transactions.map((transaction) => (
            <View key={transaction.id} className="mb-3 rounded-[28px] bg-white p-4">
              <View className="flex-row items-start justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-lg font-poppins-bold text-brand-ink">{friendlyDateTime(transaction.createdAt)}</Text>
                  <Text className="mt-1 text-sm text-brand-muted">
                    {transaction.paymentMethod.toUpperCase()} • {transaction.paymentStatus.toUpperCase()}
                  </Text>
                  {transaction.customerName ? (
                    <Text className="mt-1 text-sm text-brand-muted">Pembeli: {transaction.customerName}</Text>
                  ) : null}
                  {transaction.tableNumber ? (
                    <Text className="mt-1 text-sm text-brand-muted">{transaction.tableNumber}</Text>
                  ) : null}
                </View>
                <Text className="text-xl font-poppins-bold text-brand">{formatIDR(transaction.total)}</Text>
              </View>

              <View className="mt-3">
                {transaction.items.map((item) => (
                  <Text className="mb-1 text-base text-brand-ink" key={`${transaction.id}-${item.id}`}>
                    {item.qty}x {item.name}
                  </Text>
                ))}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </ScreenContainer>
  );
};
