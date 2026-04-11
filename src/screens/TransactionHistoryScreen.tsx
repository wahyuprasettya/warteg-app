import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from "react-native";

import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAuth } from "@/hooks/useAuth";
import {
  dateRanges,
  subscribeTransactionsByRange,
  updateTransactionRecord,
} from "@/services/firestoreService";
import { AppStackParamList, TransactionLifecycleStatus, TransactionRecord } from "@/types";
import { formatIDR } from "@/utils/currency";
import { formatTime } from "@/utils/date";
import { resolveStoreUserId } from "@/utils/store";

type Props = NativeStackScreenProps<AppStackParamList, "Transactions">;

const rangeLabels: Record<keyof typeof dateRanges, string> = {
  today: "Hari Ini",
  week: "Minggu Ini",
  month: "Bulan Ini",
  year: "Tahun Ini",
};

const statusLabels: Record<TransactionLifecycleStatus, string> = {
  completed: "Selesai",
  refunded: "Refund",
  void: "Void",
};

const statusStyles: Record<TransactionLifecycleStatus, string> = {
  completed: "bg-emerald-50 text-emerald-700",
  refunded: "bg-amber-50 text-amber-700",
  void: "bg-rose-50 text-rose-700",
};

export const TransactionHistoryScreen = ({ navigation }: Props) => {
  const { authUser, profile } = useAuth();
  const [range, setRange] = useState<keyof typeof dateRanges>("today");
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const storeUserId = resolveStoreUserId(authUser?.uid, profile);

  useEffect(() => {
    if (!authUser) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const unsubscribe = subscribeTransactionsByRange(
      storeUserId,
      range,
      (data) => {
        setTransactions(data);
        setIsLoading(false);
      },
    );
    return unsubscribe;
  }, [authUser, range]);

  const totals = useMemo(() => {
    const completed = transactions.filter(
      (transaction) => (transaction.transactionStatus ?? "completed") === "completed",
    );
    const refunded = transactions.filter(
      (transaction) => transaction.transactionStatus === "refunded",
    );
    const voided = transactions.filter(
      (transaction) => transaction.transactionStatus === "void",
    );
    const flagged = transactions.filter((transaction) => transaction.auditedAt);

    return {
      sales: completed.reduce((sum, transaction) => sum + transaction.total, 0),
      refundedCount: refunded.length,
      voidCount: voided.length,
      flaggedCount: flagged.length,
    };
  }, [transactions]);

  const handleUpdateStatus = async (
    transaction: TransactionRecord,
    nextStatus: TransactionLifecycleStatus,
  ) => {
    if (!transaction.id) return;

    const reasonField =
      nextStatus === "refunded" ? { refundReason: "Refund oleh owner" } : {};
    const voidField =
      nextStatus === "void" ? { voidReason: "Void oleh owner" } : {};

    try {
      setIsSaving(transaction.id);
      await updateTransactionRecord(transaction.id, {
        transactionStatus: nextStatus,
        ...reasonField,
        ...voidField,
      });
    } catch (error) {
      Alert.alert("Gagal update transaksi", "Perubahan status belum tersimpan.");
    } finally {
      setIsSaving(null);
    }
  };

  const handleToggleAudit = async (transaction: TransactionRecord) => {
    if (!transaction.id) return;

    const isAudited = Boolean(transaction.auditedAt);
    try {
      setIsSaving(transaction.id);
      await updateTransactionRecord(transaction.id, {
        auditedAt: isAudited ? "" : new Date().toISOString(),
        auditedBy: isAudited ? "" : (profile?.email || authUser?.email || "owner"),
        auditNote: isAudited ? "" : "Ditandai owner untuk audit transaksi.",
      });
    } catch (error) {
      Alert.alert("Gagal memperbarui audit", "Status audit belum bisa diubah.");
    } finally {
      setIsSaving(null);
    }
  };

  return (
    <ScreenContainer>
      <AppHeader
        title="Kontrol Transaksi"
        subtitle="Owner bisa memantau, audit, refund, dan void transaksi dari satu layar."
        actionLabel="Dashboard"
        onActionPress={() => navigation.navigate("Dashboard")}
      />

      <View className="mb-4 rounded-[24px] border border-brand/5 bg-white p-1.5">
        <View className="flex-row">
          {(Object.keys(dateRanges) as Array<keyof typeof dateRanges>).map((item) => (
            <Pressable
              key={item}
              className={`flex-1 rounded-[18px] py-3 ${range === item ? "bg-brand" : ""}`}
              onPress={() => setRange(item)}
            >
              <Text
                className={`text-center text-sm font-poppins-bold ${range === item ? "text-white" : "text-brand-muted"}`}
              >
                {rangeLabels[item]}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mb-5 flex-row">
        <View className="mr-2 flex-1 rounded-[24px] bg-brand p-4">
          <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-white/70">
            Penjualan Bersih
          </Text>
          <Text className="mt-2 text-2xl font-poppins-bold text-white">
            {formatIDR(totals.sales)}
          </Text>
        </View>
        <View className="ml-2 flex-1 rounded-[24px] bg-white p-4">
          <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
            Audit / Risiko
          </Text>
          <Text className="mt-2 text-2xl font-poppins-bold text-brand-ink">
            {totals.flaggedCount}
          </Text>
          <Text className="mt-1 text-xs font-poppins text-brand-muted">
            {totals.refundedCount} refund • {totals.voidCount} void
          </Text>
        </View>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#A63D40" />
          <Text className="mt-4 font-poppins text-brand-muted">Memuat data transaksi...</Text>
        </View>
      ) : transactions.length === 0 ? (
        <EmptyState
          title="Belum ada transaksi"
          description="Riwayat akan muncul otomatis setelah ada penjualan pada rentang ini."
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
          {transactions.map((transaction) => {
            const status = transaction.transactionStatus ?? "completed";
            const isBusy = isSaving === transaction.id;

            return (
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
                  <View className={`rounded-full px-3 py-1 ${statusStyles[status].split(" ")[0]}`}>
                    <Text className={`text-[10px] font-poppins-bold uppercase ${statusStyles[status].split(" ")[1]}`}>
                      {statusLabels[status]}
                    </Text>
                  </View>
                </View>

                <View className="p-5">
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-4">
                      <Text className="text-[10px] font-poppins-bold uppercase tracking-widest text-brand-muted">
                        ID: {transaction.id?.slice(-6).toUpperCase()}
                      </Text>
                      <Text className="mt-2 text-lg font-poppins-bold text-brand-ink" numberOfLines={1}>
                        {transaction.customerName || "Pelanggan Umum"}
                      </Text>
                      <View className="mt-2 flex-row flex-wrap">
                        <View className="mr-2 mb-2 rounded-full border border-brand/10 px-3 py-1">
                          <Text className="text-[10px] font-poppins-semibold text-brand-muted">
                            💳 {transaction.paymentMethod.toUpperCase()}
                          </Text>
                        </View>
                        <View className="mr-2 mb-2 rounded-full bg-brand-soft px-3 py-1">
                          <Text className="text-[10px] font-poppins-semibold text-brand">
                            👤 {transaction.cashierName || "Kasir"}
                          </Text>
                        </View>
                        {transaction.auditedAt ? (
                          <View className="mr-2 mb-2 rounded-full bg-amber-50 px-3 py-1">
                            <Text className="text-[10px] font-poppins-semibold text-amber-700">
                              Audit aktif
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </View>

                    <View className="items-end">
                      <Text className="text-xl font-poppins-bold text-brand">
                        {formatIDR(transaction.total || 0)}
                      </Text>
                      <Text className="mt-1 text-[10px] font-poppins text-brand-muted">
                        {(transaction.items || []).length} barang
                      </Text>
                    </View>
                  </View>

                  <View className="mt-4 border-t border-brand/5 pt-4">
                    {(transaction.items || []).map((item, idx) => (
                      <View key={`${transaction.id}-${idx}`} className="mb-2 flex-row items-center justify-between">
                        <Text className="font-poppins flex-1 text-sm text-brand-ink">
                          {item.name}
                        </Text>
                        <Text className="ml-4 font-poppins-semibold text-sm text-brand-muted">
                          x{item.qty}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {transaction.auditNote ? (
                    <View className="mt-3 rounded-xl bg-amber-50 p-3">
                      <Text className="text-[11px] font-poppins text-amber-700">
                        {transaction.auditNote}
                      </Text>
                    </View>
                  ) : null}

                  <View className="mt-4 flex-row flex-wrap">
                    <Pressable
                      disabled={isBusy}
                      className="mr-2 mb-2 rounded-full bg-brand px-4 py-2"
                      onPress={() =>
                        Alert.alert(
                          "Audit transaksi",
                          "Tandai transaksi ini untuk audit owner?",
                          [
                            { text: "Batal", style: "cancel" },
                            {
                              text: transaction.auditedAt ? "Hapus Audit" : "Audit",
                              onPress: () => handleToggleAudit(transaction),
                            },
                          ],
                        )
                      }
                    >
                      <Text className="text-xs font-poppins-bold text-white">
                        {transaction.auditedAt ? "Hapus Audit" : "Audit"}
                      </Text>
                    </Pressable>
                    <Pressable
                      disabled={isBusy || status === "refunded"}
                      className="mr-2 mb-2 rounded-full bg-amber-100 px-4 py-2"
                      onPress={() =>
                        Alert.alert(
                          "Refund transaksi",
                          "Transaksi ini akan ditandai sebagai refund owner.",
                          [
                            { text: "Batal", style: "cancel" },
                            {
                              text: "Refund",
                              onPress: () => handleUpdateStatus(transaction, "refunded"),
                            },
                          ],
                        )
                      }
                    >
                      <Text className="text-xs font-poppins-bold text-amber-700">
                        Refund
                      </Text>
                    </Pressable>
                    <Pressable
                      disabled={isBusy || status === "void"}
                      className="mb-2 rounded-full bg-rose-100 px-4 py-2"
                      onPress={() =>
                        Alert.alert(
                          "Void transaksi",
                          "Transaksi ini akan ditandai sebagai void owner.",
                          [
                            { text: "Batal", style: "cancel" },
                            {
                              text: "Void",
                              style: "destructive",
                              onPress: () => handleUpdateStatus(transaction, "void"),
                            },
                          ],
                        )
                      }
                    >
                      <Text className="text-xs font-poppins-bold text-rose-700">
                        Void
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
          <View className="h-10" />
        </ScrollView>
      )}
    </ScreenContainer>
  );
};
