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
import { friendlyDateTime, formatTime } from "@/utils/date";

type Props = NativeStackScreenProps<AppStackParamList, "Transactions">;

export const TransactionHistoryScreen = ({ navigation }: Props) => {
  const { authUser } = useAuth();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    const unsubscribe = subscribeTodayTransactions(
      authUser.uid,
      setTransactions,
    );
    return unsubscribe;
  }, [authUser]);

  const totalToday = transactions.reduce((sum, t) => sum + t.total, 0);

  return (
    <ScreenContainer>
      <AppHeader
        title="Riwayat Transaksi"
        subtitle="Daftar penjualan hari ini."
        actionLabel="Dashboard"
        onActionPress={() => navigation.navigate("Dashboard")}
      />

      <View className="mb-6 flex-row items-center justify-between rounded-[28px] bg-brand p-5 shadow-sm">
        <View>
          <Text className="text-xs font-poppins-semibold uppercase tracking-widest text-white/70">
            Total Hari Ini
          </Text>
          <Text className="mt-1 text-2xl font-poppins-bold text-white">
            {formatIDR(totalToday)}
          </Text>
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-full bg-white/20">
          <Text className="text-xl">💰</Text>
        </View>
      </View>

      {transactions.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi"
          description="Riwayat akan muncul otomatis setelah ada penjualan baru."
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {transactions.map((transaction) => (
            <View
              key={transaction.id}
              className="mb-4 overflow-hidden rounded-[30px] border border-brand/5 bg-white shadow-sm"
            >
              <View className="flex-row items-center justify-between bg-brand-soft/50 px-5 py-3">
                <View className="flex-row items-center">
                  <View className="mr-3 h-8 w-8 items-center justify-center rounded-full bg-brand/10">
                    <Text className="text-xs">🕒</Text>
                  </View>
                  <Text className="text-sm font-poppins-semibold text-brand-ink">
                    {formatTime(transaction.createdAt || "")}
                  </Text>
                </View>
                <View className="rounded-full bg-emerald-50 px-3 py-1">
                  <Text className="text-[10px] font-poppins-bold uppercase text-emerald-600">
                    {transaction.paymentStatus}
                  </Text>
                </View>
              </View>

              <View className="p-5">
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-4">
                    <View className="flex-row items-center">
                      <Text className="text-[10px] font-poppins-bold uppercase tracking-widest text-brand-muted">
                        ID: {transaction.id?.slice(-6).toUpperCase()}
                      </Text>
                      {transaction.tableNumber && (
                        <View className="ml-2 rounded-md bg-brand-soft px-2 py-0.5">
                          <Text className="text-[9px] font-poppins-bold text-brand">
                            MEJA {transaction.tableNumber}
                          </Text>
                        </View>
                      )}
                    </View>
                    
                    <Text className="mt-2 text-lg font-poppins-bold text-brand-ink" numberOfLines={1}>
                      {transaction.customerName || "Pelanggan Umum"}
                    </Text>
                    
                    <View className="mt-2 flex-row flex-wrap">
                      <View className="mr-2 mb-2 rounded-full border border-brand/10 px-3 py-1">
                        <Text className="text-[10px] font-poppins-semibold text-brand-muted">
                          💳 {transaction.paymentMethod.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View className="items-end">
                    <Text className="text-xl font-poppins-bold text-brand">
                      {formatIDR(transaction.total)}
                    </Text>
                    <Text className="mt-1 text-[10px] font-poppins text-brand-muted">
                      {transaction.items.length} Barang
                    </Text>
                  </View>
                </View>

                <View className="mt-4 border-t border-brand/5 pt-4">
                  {transaction.items.map((item, idx) => (
                    <View key={`${transaction.id}-${idx}`} className="mb-2 flex-row items-center justify-between">
                      <Text className="font-poppins flex-1 text-sm text-brand-ink">
                        {item.name}
                      </Text>
                      <Text className="font-poppins-semibold ml-4 text-sm text-brand-muted">
                        x{item.qty}
                      </Text>
                    </View>
                  ))}
                </View>

                {transaction.note && (
                  <View className="mt-2 rounded-xl bg-slate-50 p-3">
                    <Text className="text-[11px] font-poppins italic text-slate-500">
                      " {transaction.note} "
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))}
          <View className="h-10" />
        </ScrollView>
      )}
    </ScreenContainer>
  );
};
