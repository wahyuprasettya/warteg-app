import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { StatCard } from "@/components/StatCard";
import { useAuth } from "@/hooks/useAuth";
import {
  CLOSING_HOUR,
  closeTodaySales,
  dateRanges,
  generateAndSaveClosingReports,
  subscribeTodayClosing,
  subscribeTransactionsByRange,
  summarizeTransactions,
  getTransactionsByRange,
  subscribeProducts,
  archiveAndClearOrders,
  subscribeOrders,
  subscribeTables,
  updateStoreOpenStatus,
} from "@/services/firestoreService";
import { StockReportCard } from "@/components/Report/StockReportCard";
import {
  AppStackParamList,
  ClosingRecord,
  ClosingReports,
  OrderRecord,
  SalesReportSummary,
  TransactionRecord,
  Product,
} from "@/types";
import { formatIDR } from "@/utils/currency";
import { exportTransactionsToExcel, exportTransactionsToPDF } from "@/utils/exportTools";
import { formatLongDate, formatTime } from "@/utils/date";
import { isTableOrder } from "@/utils/order";
import { generateInsights } from "@/utils/insights";
import { resolveStoreUserId } from "@/utils/store";

type Props = NativeStackScreenProps<AppStackParamList, "Dashboard">;

const rangeLabels: Record<keyof typeof dateRanges, string> = {
  today: "Hari Ini",
  week: "Minggu Ini",
  month: "Bulan Ini",
  year: "Tahun Ini",
};

const rangeIcons: Record<keyof typeof dateRanges, string> = {
  today: "📅",
  week: "🗓️",
  month: "📆",
  year: "📊",
};

const reportLabels: Record<keyof ClosingReports, string> = {
  day: "Harian",
  month: "Bulanan",
  year: "Tahunan",
};


const getCashierName = (email?: string | null) => {
  if (!email) {
    return "Kasir";
  }

  return email
    .split("@")[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const emptySummary: SalesReportSummary = {
  totalSales: 0,
  transactionCount: 0,
  bestSeller: "-",
  avgTransaction: 0,
  itemSold: 0,
};

export const DashboardScreen = ({ navigation }: Props) => {
  const { authUser, profile, signOutUser } = useAuth();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [todayTransactions, setTodayTransactions] = useState<
    TransactionRecord[]
  >([]);
  const [todayClosing, setTodayClosing] = useState<ClosingRecord | null>(null);
  const [range, setRange] = useState<keyof typeof dateRanges>("today");
  const [reportRange, setReportRange] = useState<keyof ClosingReports>("day");
  const [isClosing, setIsClosing] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeOrders, setActiveOrders] = useState<OrderRecord[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const storeUserId = resolveStoreUserId(authUser?.uid, profile);

  const [isStoreOpen, setIsStoreOpen] = useState(profile?.isStoreOpen ?? true);

  useEffect(() => {
    if (profile?.isStoreOpen !== undefined) {
      setIsStoreOpen(profile.isStoreOpen);
    }
  }, [profile?.isStoreOpen]);

  const handleOpenStore = async () => {
    if (!storeUserId) return;
    try {
      setIsStoreOpen(true);
      await updateStoreOpenStatus(storeUserId, true);
      Alert.alert("Warung Dibuka", "Status warung telah diaktifkan.");
    } catch (error) {
      setIsStoreOpen(false);
      Alert.alert("Gagal", "Tidak dapat membuka warung saat ini.");
    }
  };

  useEffect(() => {
    if (!authUser) {
      return;
    }

    const unsubscribe = subscribeTransactionsByRange(
      storeUserId,
      range,
      setTransactions,
    );
    return unsubscribe;
  }, [authUser, range]);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    const unsubscribe = subscribeTransactionsByRange(
      storeUserId,
      "today",
      setTodayTransactions,
    );
    return unsubscribe;
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    const unsubscribe = subscribeTodayClosing(storeUserId, setTodayClosing);
    return unsubscribe;
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    const unsubscribe = subscribeProducts(
      storeUserId,
      setProducts,
    );
    return unsubscribe;
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    const unsubscribe = subscribeOrders(storeUserId, (orders) => {
      setActiveOrders(orders.filter((o) => o.status !== "done"));
    });
    return unsubscribe;
  }, [authUser]);

  useEffect(() => {
    if (!authUser) return;
    const unsubscribe = subscribeTables(storeUserId, setTables);
    return unsubscribe;
  }, [authUser]);

  // Meja yang sedang terisi dari pesanan meja (QR)
  const occupiedTables = useMemo(() => {
    const tableOrders = activeOrders.filter(
      (o) => isTableOrder(o) && o.status !== "done"
    );
    const tableNums = tableOrders
      .map((o) => o.tableNumber || o.tableId)
      .filter(Boolean) as string[];
    return [...new Set(tableNums)].sort();
  }, [activeOrders]);

  const manualOrderCount = useMemo(
    () => activeOrders.filter((o) => !isTableOrder(o)).length,
    [activeOrders]
  );

  const summary = useMemo(
    () => summarizeTransactions(transactions),
    [transactions],
  );
  const todaySummary = useMemo(
    () => summarizeTransactions(todayTransactions),
    [todayTransactions],
  );
  const insights = useMemo(
    () => generateInsights(transactions, summary),
    [summary, transactions],
  );

  const handleExportPDF = async () => {
    if (!authUser || !todayClosing) return;
    try {
      setIsExporting(true);
      const data = await getTransactionsByRange(storeUserId, reportRange === "day" ? "today" : reportRange);
      await exportTransactionsToPDF(data, reportLabels[reportRange]);
    } catch (error) {
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    if (!authUser || !todayClosing) return;
    try {
      setIsExporting(true);
      const data = await getTransactionsByRange(storeUserId, reportRange === "day" ? "today" : reportRange);
      await exportTransactionsToExcel(data, reportLabels[reportRange]);
    } catch (error) {
    } finally {
      setIsExporting(false);
    }
  };

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 11) return "Selamat Pagi";
    if (hour < 15) return "Selamat Siang";
    if (hour < 18) return "Selamat Sore";
    return "Selamat Malam";
  }, []);

  const businessLabel = profile?.storeName || "Warteg";
  const cashierName = useMemo(
    () => getCashierName(profile?.email ?? authUser?.email),
    [authUser?.email, profile?.email],
  );
  const todayLabel = useMemo(() => formatLongDate(), []);
  const closingHour = profile?.closingHour ?? CLOSING_HOUR;
  const canCloseNow = new Date().getHours() >= closingHour;
  const estimatedProfitMargin = profile?.estimatedProfitMarginPercent ?? 30;

  const estimatedProfit = useMemo(
    () => Math.round((summary.totalSales * estimatedProfitMargin) / 100),
    [estimatedProfitMargin, summary.totalSales],
  );

  const busiestHourLabel = useMemo(() => {
    if (transactions.length === 0) {
      return "-";
    }

    const hourlyMap = transactions.reduce<Record<string, number>>((acc, transaction) => {
      if (!transaction.createdAt) {
        return acc;
      }

      const hour = new Date(transaction.createdAt).getHours();
      const key = `${String(hour).padStart(2, "0")}:00`;
      acc[key] = (acc[key] ?? 0) + 1;
      return acc;
    }, {});

    return Object.entries(hourlyMap).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "-";
  }, [transactions]);

  const cashierPerformance = useMemo(() => {
    const grouped = transactions.reduce<
      Record<string, { name: string; totalSales: number; transactionCount: number }>
    >((acc, transaction) => {
      const name =
        transaction.cashierName ||
        getCashierName(transaction.cashierEmail) ||
        "Kasir";

      acc[name] = acc[name] ?? { name, totalSales: 0, transactionCount: 0 };
      acc[name].totalSales += transaction.total || 0;
      acc[name].transactionCount += 1;
      return acc;
    }, {});

    return Object.values(grouped).sort(
      (left, right) => right.totalSales - left.totalSales,
    );
  }, [transactions]);

  const topCashier = cashierPerformance[0];

  const actionCards = useMemo(
    () => [
      {
        label: "Daftar Pesanan",
        icon: "🍽️",
        hint: "Lihat order dari Meja & Order Kasir",
        accent: true,
        onPress: () => navigation.navigate("OrderList"),
      },
    ],
    [navigation],
  );

  const ownerModules = useMemo(
    () => [
      {
        label: "Laporan & Analitik",
        icon: "📈",
        hint: `Omzet ${rangeLabels[range].toLowerCase()}, jam ramai ${busiestHourLabel}, profit estimasi ${formatIDR(estimatedProfit)}.`,
        onPress: () => setRange("week"),
      },
      {
        label: "Kasir (Manual)",
        icon: "🛍️",
        hint: "Input pesanan manual langsung dari dashboard owner.",
        onPress: () => navigation.navigate("POS"),
      },
      {
        label: "Manajemen Produk",
        icon: "📦",
        hint: `${products.length} produk aktif siap dikelola dari dashboard owner.`,
        onPress: () => navigation.navigate("Products"),
      },
      {
        label: "Manajemen Kasir",
        icon: "👥",
        hint: topCashier
          ? `${cashierPerformance.length} kasir terdaftar, performa tertinggi ${topCashier.name}.`
          : "Buat akun kasir baru dan pantau performanya dari sini.",
        onPress: () => navigation.navigate("CashierManagement"),
      },
      {
        label: "Kontrol Transaksi",
        icon: "🧾",
        hint: "Monitor transaksi, audit, refund, dan void owner.",
        onPress: () => navigation.navigate("Transactions"),
      },
      {
        label: "Manajemen Meja",
        icon: "🪑",
        hint: `Kelola ${tables.length} meja restoran, atur penomoran, dan pantau status terisi.`,
        onPress: () => navigation.navigate("Settings"),
      },
      {
        label: "Promo & Diskon",
        icon: "🏷️",
        hint: `${profile?.promos?.length ?? 0} promo aktif siap dipakai kasir.`,
        onPress: () => navigation.navigate("Settings"),
      },
      {
        label: "Pengaturan Restoran",
        icon: "⚙️",
        hint: `Cek jam closing, pajak toko, dan profil outlet.`,
        onPress: () => navigation.navigate("Settings"),
      },
      {
        label: "Keamanan & Akses",
        icon: "🔐",
        hint: `${transactions.filter((transaction) => transaction.auditedAt).length} transaksi sedang ditandai audit.`,
        onPress: () => navigation.navigate("Transactions"),
      },
      {
        label: "Logout",
        icon: "🚪",
        hint: "Keluar dari akun sekarang.",
        onPress: signOutUser,
      },
    ],
    [
      busiestHourLabel,
      cashierPerformance.length,
      estimatedProfit,
      navigation,
      products.length,
      profile?.promos?.length,
      range,
      topCashier,
      signOutUser,
      transactions,
    ],
  );

  const visibleInsights =
    insights.length > 0
      ? insights.slice(0, 3)
      : [
          "Belum ada cukup data transaksi. Jalankan beberapa penjualan untuk melihat insight otomatis.",
        ];

  const reportSummary = todayClosing?.reports?.[reportRange] ?? emptySummary;

  const handleCloseDay = () => {
    if (!authUser) {
      return;
    }

    if (todayClosing) {
      Alert.alert(
        "Closing sudah dilakukan",
        "Hari ini sudah ditutup. Kamu bisa langsung generate laporan.",
      );
      return;
    }

    if (!canCloseNow) {
      Alert.alert(
        "Belum waktunya closing",
        `Closing harian baru bisa dilakukan mulai pukul ${closingHour}.00.`,
      );
      return;
    }

    Alert.alert(
      "Closing Hari Ini",
      `Kasir ${cashierName} akan menutup penjualan hari ini sebesar ${formatIDR(todaySummary.totalSales)}.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Closing Sekarang",
          onPress: async () => {
            try {
              setIsClosing(true);

              // Tutup warung saat closing hari
              await updateStoreOpenStatus(storeUserId, false);
              setIsStoreOpen(false);

              // 1. Move active orders to transactions and clear them
              await archiveAndClearOrders(storeUserId);

              // 2. Calculate summary again after archiving to include the newly moved orders
              const todayTransactions = await getTransactionsByRange(storeUserId, "today");
              const currentSummary = summarizeTransactions(todayTransactions);

              await closeTodaySales({
                userId: storeUserId,
                cashierName,
                cashierEmail: profile?.email || "",
                summary: currentSummary,
              });

              Alert.alert(
                "Closing Berhasil",
                "Penjualan hari ini sudah ditutup. Apakah Anda ingin mengunduh laporan sekarang?",
                [
                  { text: "Nanti Saja", style: "cancel" },
                  { 
                    text: "📄 PDF", 
                    onPress: () => handleExportPDF() 
                  },
                  { 
                    text: "📊 Excel", 
                    onPress: () => handleExportExcel() 
                  }
                ]
              );
            } catch (error) {
              Alert.alert("Closing gagal", "Coba ulangi beberapa saat lagi.");
            } finally {
              setIsClosing(false);
            }
          },
        },
      ],
    );
  };

  const handleGenerateReports = async () => {
    if (!authUser) {
      return;
    }

    if (!todayClosing) {
      Alert.alert(
        "Closing belum dilakukan",
        "Laporan harian, bulanan, dan tahunan baru tersedia setelah closing hari ini.",
      );
      return;
    }

    try {
      setIsGeneratingReport(true);
      await generateAndSaveClosingReports(storeUserId);
      Alert.alert(
        "Laporan siap",
        "Laporan harian, bulanan, dan tahunan berhasil dibuat.",
      );
    } catch (error: any) {
      Alert.alert(
        "Gagal generate laporan",
        error?.message || "Coba ulangi beberapa saat lagi.",
      );
      console.error("[Generate Report Error]: ", error);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  return (
    <ScreenContainer scroll>
      <View className="mb-5 overflow-hidden rounded-[36px] border border-brand/15 bg-brand p-6">
        <View className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-white/10" />
        <View className="absolute -bottom-10 -left-6 h-24 w-24 rounded-full bg-white/10" />

        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-sm font-poppins-semibold text-white/75">
              {greeting}
            </Text>
            <Text className="mt-1 text-4xl font-poppins-bold text-white">
              Dashboard
            </Text>
            <Text className="font-poppins mt-2 text-sm leading-5 text-white/80">
              {businessLabel} • owner view • {todayLabel}
            </Text>
          </View>
          <View className="h-14 w-14 items-center justify-center rounded-[20px] bg-white/15">
            <Text className="font-poppins text-2xl">📈</Text>
          </View>
        </View>

        <View className="mt-4 flex-row flex-wrap">
          <View className="mr-2 mb-2 rounded-full bg-white/12 px-3 py-2">
            <Text className="text-xs font-poppins-semibold text-white">
              Owner: {cashierName}
            </Text>
          </View>
          <View className="mr-2 mb-2 rounded-full bg-white/12 px-3 py-2">
            <Text className="text-xs font-poppins-semibold text-white">
              {todayLabel}
            </Text>
          </View>
          <View className="mb-2 rounded-full bg-white/12 px-3 py-2">
            <Text className="text-xs font-poppins-semibold text-white">
              {todayClosing
                ? `Closing ${formatTime(todayClosing.closedAt)}`
                : `Closing mulai ${closingHour}.00`}
            </Text>
          </View>
        </View>

        {!isStoreOpen && (
          <View className="mt-2 rounded-[22px] bg-red-500/20 p-4 border border-red-500/30 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-poppins-bold text-white">Status: TUTUP</Text>
              <Text className="text-xs font-poppins text-white/80 mt-1">Pembuatan pesanan baru ditahan.</Text>
            </View>
            <Pressable 
              onPress={handleOpenStore}
              className="bg-white px-4 py-2.5 rounded-full"
            >
              <Text className="text-xs font-poppins-bold text-brand">Buka Warung</Text>
            </Pressable>
          </View>
        )}

        {isStoreOpen && (
          <View className="mt-2 rounded-[22px] bg-emerald-500/20 p-4 border border-emerald-500/30 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-sm font-poppins-bold text-white">Status: BUKA</Text>
              <Text className="text-xs font-poppins text-white/80 mt-1">Siap menerima pesanan baru.</Text>
            </View>
          </View>
        )}

        <View className="mt-3 rounded-[26px] bg-white/12 p-4">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-white/60">
                Total Penjualan {rangeLabels[range]}
              </Text>
              <Text
                className="mt-2 text-4xl font-poppins-bold text-white"
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {formatIDR(summary.totalSales)}
              </Text>
            </View>
            <View className="rounded-full bg-white/15 px-3 py-2">
              <Text className="text-xs font-poppins-bold text-white/90">
                {summary.transactionCount} transaksi
              </Text>
            </View>
          </View>

          <View className="mt-4 flex-row">
            <View className="mr-2 flex-1 rounded-[22px] bg-white/10 p-3">
              <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-white/60">
                Rata-rata
              </Text>
              <Text className="mt-1 text-lg font-poppins-bold text-white">
                {formatIDR(summary.avgTransaction)}
              </Text>
            </View>
            <View className="flex-1 rounded-[22px] bg-white/10 p-3">
              <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-white/60">
                Terlaris
              </Text>
              <Text
                className="mt-1 text-lg font-poppins-bold text-white"
                numberOfLines={1}
              >
                {summary.bestSeller}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View className="mb-4 rounded-[24px] border border-brand/5 bg-white p-1.5">
        <View className="flex-row">
          {(Object.keys(dateRanges) as Array<keyof typeof dateRanges>).map(
            (item) => (
              <Pressable
                key={item}
                className={`flex-1 flex-row items-center justify-center rounded-[18px] py-3 ${
                  range === item ? "bg-brand" : ""
                }`}
                onPress={() => setRange(item)}
              >
                <Text className="font-poppins mr-1.5 text-sm">
                  {rangeIcons[item]}
                </Text>
                <Text
                  className={`text-sm font-poppins-bold ${range === item ? "text-white" : "text-brand-muted"}`}
                >
                  {rangeLabels[item]}
                </Text>
              </Pressable>
            ),
          )}
        </View>
      </View>

      <View className="mb-4 flex-row">
        <StatCard
          label="Transaksi"
          value={String(summary.transactionCount)}
          icon="🧾"
          accent
        />
        <StatCard
          label="Item Terjual"
          value={String(summary.itemSold)}
          icon="🛍️"
        />
      </View>

      <View className="mb-4 flex-row">
        <StatCard
          label="Profit Est."
          value={formatIDR(estimatedProfit)}
          icon="💹"
        />
        <StatCard
          label="Jam Ramai"
          value={busiestHourLabel}
          icon="⏰"
        />
      </View>

      <View className="mb-5 rounded-[28px] border border-brand/5 bg-white p-5">
        <View className="mb-3 flex-row items-center">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-[18px] bg-brand-soft/60">
            <Text className="font-poppins text-lg">👑</Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-poppins-bold text-brand-ink">
              Pusat Fungsi Owner
            </Text>
            <Text className="font-poppins text-xs text-brand-muted">
              Semua area utama owner dipetakan di satu dashboard.
            </Text>
          </View>
        </View>

        <View className="flex-row flex-wrap justify-between">
          {ownerModules.map((module) => (
            <Pressable
              key={module.label}
              className="mb-4 rounded-[24px] border border-brand/5 bg-brand-soft/15 p-4"
              style={{ width: "48%" }}
              onPress={module.onPress}
            >
              <View className="mb-3 h-11 w-11 items-center justify-center rounded-full bg-white">
                <Text className="font-poppins text-xl">{module.icon}</Text>
              </View>
              <Text className="text-sm font-poppins-bold text-brand-ink">
                {module.label}
              </Text>
              <Text className="mt-1 font-poppins text-xs leading-5 text-brand-muted">
                {module.hint}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* ── Live Order Status ── */}
      <View className="mb-5 rounded-[28px] border border-brand/5 bg-white p-5">
        <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted mb-3">
          Status Pesanan Aktif
        </Text>
        <View className="flex-row">
          <View className="flex-1 mr-3 rounded-[20px] bg-brand-soft/50 p-4">
            <Text className="text-3xl font-poppins-bold text-brand">
              {activeOrders.length}
            </Text>
            <Text className="text-xs font-poppins-semibold text-brand-muted mt-1">
              Total Pesanan Aktif
            </Text>
          </View>
          <View className="flex-1 rounded-[20px] bg-amber-50 p-4">
            <Text className="text-3xl font-poppins-bold text-amber-600">
              {occupiedTables.length}
            </Text>
            <Text className="text-xs font-poppins-semibold text-amber-500 mt-1">
              Meja Terisi (Pesan Meja)
            </Text>
          </View>
        </View>

        {occupiedTables.length > 0 && (
          <View className="mt-3">
            <Text className="text-xs font-poppins-semibold text-brand-muted mb-2">
              Meja yang sedang dipesan:
            </Text>
            <View className="flex-row flex-wrap">
              {occupiedTables.map((table) => (
                <View
                  key={table}
                  className="mr-2 mb-2 rounded-full bg-amber-100 px-3 py-1"
                >
                  <Text className="text-xs font-poppins-bold text-amber-700">
                    Meja {table}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {manualOrderCount > 0 && (
          <View className="mt-2 rounded-[16px] bg-brand-soft/30 px-4 py-3">
            <Text className="text-xs font-poppins text-brand-muted">
              <Text className="font-poppins-bold text-brand">{manualOrderCount}</Text>{" "}
              pesanan app/kasir sedang aktif
            </Text>
          </View>
        )}
      </View>

      <View className="mb-5 rounded-[28px] border border-brand/5 bg-white p-5">
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              Closing Hari Ini
            </Text>
            <Text className="mt-2 text-2xl font-poppins-bold text-brand-ink">
              {todayClosing
                ? "Sudah Closing"
                : canCloseNow
                  ? "Siap Closing"
                  : "Menunggu Closing"}
            </Text>
            <Text className="font-poppins mt-2 text-sm leading-5 text-brand-muted">
              {todayClosing
                ? `Kasir ${todayClosing.cashierName} menutup buku pada ${formatTime(todayClosing.closedAt)}.`
                : canCloseNow
                  ? "Waktu closing sudah tiba. Tutup penjualan hari ini agar laporan bisa dibuat."
                  : `Closing akan aktif mulai pukul ${closingHour}.00.`}
            </Text>
          </View>
          <View
            className={`rounded-full px-3 py-2 ${todayClosing ? "bg-emerald-50" : "bg-brand-soft"}`}
          >
            <Text
              className={`text-xs font-poppins-bold ${todayClosing ? "text-emerald-700" : "text-brand"}`}
            >
              {todayClosing ? "Closed" : "Open"}
            </Text>
          </View>
        </View>

        <View className="mt-4 flex-row">
          <View className="mr-2 flex-1 rounded-[22px] bg-brand-soft/50 p-3">
            <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              Omzet Hari Ini
            </Text>
            <Text className="mt-1 text-lg font-poppins-bold text-brand-ink">
              {formatIDR(todaySummary.totalSales)}
            </Text>
          </View>
          <View className="flex-1 rounded-[22px] bg-brand-soft/50 p-3">
            <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              Kasir
            </Text>
            <Text
              className="mt-1 text-lg font-poppins-bold text-brand-ink"
              numberOfLines={1}
            >
              {cashierName}
            </Text>
          </View>
        </View>

        <Pressable
          className={`mt-4 items-center rounded-[24px] px-4 py-4 ${
            todayClosing || !canCloseNow || isClosing
              ? "bg-brand-soft/70"
              : "bg-brand"
          }`}
          disabled={todayClosing !== null || !canCloseNow || isClosing}
          onPress={handleCloseDay}
        >
          <Text
            className={`text-base font-poppins-bold ${todayClosing || !canCloseNow ? "text-brand" : "text-white"}`}
          >
            {todayClosing
              ? "Closing Sudah Selesai"
              : isClosing
                ? "Memproses Closing..."
                : "Closing Hari Ini"}
          </Text>
        </Pressable>
      </View>

      <View className="mb-4 flex-row">
        <View className="mr-2 flex-1 rounded-[28px] border border-brand/5 bg-white p-5">
          <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
            Produk Favorit
          </Text>
          <Text
            className="mt-2 text-2xl font-poppins-bold text-brand-ink"
            numberOfLines={1}
          >
            {summary.bestSeller}
          </Text>
          <Text className="font-poppins mt-2 text-sm leading-5 text-brand-muted">
            {summary.transactionCount === 0
              ? "Belum ada transaksi yang bisa dibaca. Produk favorit akan muncul setelah penjualan masuk."
              : `Produk ini paling sering muncul pada transaksi ${rangeLabels[range].toLowerCase()}.`}
          </Text>
        </View>
        <View className="flex-1 rounded-[28px] border border-brand/5 bg-white p-5">
          <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
            Generate Laporan
          </Text>
          <Text className="mt-2 text-2xl font-poppins-bold text-brand-ink">
            {todayClosing?.reports ? "Siap" : "Menunggu"}
          </Text>
          <Text className="font-poppins mt-2 text-sm leading-5 text-brand-muted">
            {todayClosing
              ? todayClosing.reportGeneratedAt
                ? `Laporan terakhir dibuat ${formatTime(todayClosing.reportGeneratedAt)}.`
                : "Setelah closing, buat laporan harian, bulanan, dan tahunan dari sini."
              : "Fitur laporan aktif setelah closing harian selesai."}
          </Text>
          <Pressable
            className={`mt-4 items-center rounded-[22px] px-4 py-3 ${todayClosing ? "bg-brand" : "bg-brand-soft/70"}`}
            disabled={!todayClosing || isGeneratingReport}
            onPress={handleGenerateReports}
          >
            <Text
              className={`text-sm font-poppins-bold ${todayClosing ? "text-white" : "text-brand"}`}
            >
              {isGeneratingReport
                ? "Membuat Laporan..."
                : todayClosing?.reports
                  ? "Refresh Laporan"
                  : "Generate Laporan"}
            </Text>
          </Pressable>
        </View>
      </View>

      <StockReportCard products={products} />

      {todayClosing?.reports ? (
        <View className="mb-5 rounded-[28px] border border-brand/5 bg-white p-5">
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-lg font-poppins-bold text-brand-ink">
                Laporan Penjualan
              </Text>
              <Text className="font-poppins text-xs text-brand-muted">
                Setelah closing, laporan tersedia dalam ringkasan harian,
                bulanan, dan tahunan.
              </Text>
            </View>
            <View className="rounded-full bg-brand-soft px-3 py-1.5">
              <Text className="text-xs font-poppins-semibold text-brand">
                {todayClosing.reportGeneratedAt
                  ? `Update ${formatTime(todayClosing.reportGeneratedAt)}`
                  : "Siap"}
              </Text>
            </View>
          </View>

          <View className="mb-4 rounded-[22px] bg-brand-soft/30 p-1.5">
            <View className="flex-row">
              {(Object.keys(reportLabels) as Array<keyof ClosingReports>).map(
                (item) => (
                  <Pressable
                    key={item}
                    className={`flex-1 rounded-[18px] py-3 ${reportRange === item ? "bg-brand" : ""}`}
                    onPress={() => setReportRange(item)}
                  >
                    <Text
                      className={`text-center text-sm font-poppins-bold ${reportRange === item ? "text-white" : "text-brand-muted"}`}
                    >
                      {reportLabels[item]}
                    </Text>
                  </Pressable>
                ),
              )}
            </View>
          </View>

          <View className="mb-4 flex-row">
            <View className="mr-2 flex-1 rounded-[22px] bg-brand-soft/40 p-4">
              <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
                Omzet
              </Text>
              <Text className="mt-2 text-xl font-poppins-bold text-brand-ink">
                {formatIDR(reportSummary.totalSales)}
              </Text>
            </View>
            <View className="mr-2 flex-1 rounded-[22px] bg-brand-soft/40 p-4">
              <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
                Transaksi
              </Text>
              <Text className="mt-2 text-xl font-poppins-bold text-brand-ink">
                {reportSummary.transactionCount}
              </Text>
            </View>
            <View className="flex-1 rounded-[22px] bg-brand-soft/40 p-4">
              <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
                Item
              </Text>
              <Text className="mt-2 text-xl font-poppins-bold text-brand-ink">
                {reportSummary.itemSold}
              </Text>
            </View>
          </View>

          <View className="mb-4 flex-row">
            <AppButton
              label={isExporting ? "Proses..." : "📄 PDF"}
              onPress={handleExportPDF}
              variant="secondary"
              loading={isExporting}
              className="flex-1"
            />
            <View className="w-3" />
            <AppButton
              label={isExporting ? "Proses..." : "📊 Excel"}
              onPress={handleExportExcel}
              variant="secondary"
              loading={isExporting}
              className="flex-1"
            />
          </View>

          <View className="rounded-[24px] bg-brand-soft/20 p-4">
            <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              Ringkasan
            </Text>
            <Text className="mt-2 text-base font-poppins-bold text-brand-ink">
              Produk terlaris: {reportSummary.bestSeller}
            </Text>
            <Text className="font-poppins mt-1 text-sm leading-5 text-brand-muted">
              Rata-rata transaksi {formatIDR(reportSummary.avgTransaction)} pada
              laporan {reportLabels[reportRange].toLowerCase()}.
            </Text>
          </View>
        </View>
      ) : null}

      <View className="mb-5">
        <Text className="text-lg font-poppins-bold text-brand-ink">
          Aksi Cepat
        </Text>
        <Text className="font-poppins mt-1 text-sm text-brand-muted">
          Pindah ke layar penting tanpa muter-muter menu.
        </Text>

        <View className="mt-4">
          <Pressable
            key={actionCards[0].label}
            className="mb-4 overflow-hidden rounded-[28px] border border-brand/20 bg-brand p-5 shadow-sm active:opacity-80"
            onPress={actionCards[0].onPress}
          >
            <View className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10" />
            <View className="absolute -bottom-8 -left-4 h-20 w-20 rounded-full bg-white/10" />
            
            <View className="flex-row items-center">
              <View className="mr-4 h-16 w-16 items-center justify-center rounded-[20px] bg-white/20">
                <Text className="font-poppins text-3xl">{actionCards[0].icon}</Text>
              </View>
              <View className="flex-1 pr-2">
                <Text className="text-xl font-poppins-bold text-white">
                  {actionCards[0].label}
                </Text>
                <Text className="font-poppins mt-1 text-sm leading-5 text-white/80">
                  {actionCards[0].hint}
                </Text>
              </View>
              <View className="h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Text className="font-poppins-bold text-xl text-white">
                  →
                </Text>
              </View>
            </View>
          </Pressable>

          {actionCards.length > 1 ? (
            <View className="flex-row flex-wrap justify-between">
              {actionCards.slice(1).map((action) => (
                <Pressable
                  key={action.label}
                  className="mb-4 items-center rounded-[24px] border border-brand/5 bg-white p-5 shadow-sm active:opacity-80"
                  style={{ width: "48%" }}
                  onPress={action.onPress}
                >
                  <View className="mb-3 h-14 w-14 items-center justify-center rounded-full bg-brand-soft/60">
                    <Text className="font-poppins text-2xl">{action.icon}</Text>
                  </View>
                  <Text className="text-center text-sm font-poppins-bold text-brand-ink">
                    {action.label}
                  </Text>
                  <Text
                    className="font-poppins mt-1 text-center text-xs leading-4 text-brand-muted"
                    numberOfLines={2}
                  >
                    {action.hint}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <View className="mb-6 rounded-[28px] border border-brand/5 bg-white p-5">
        <View className="mb-3 flex-row items-center">
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-[18px] bg-brand-soft/60">
            <Text className="font-poppins text-lg">✨</Text>
          </View>
          <View className="flex-1">
            <Text className="text-lg font-poppins-bold text-brand-ink">
              Insight Penjualan
            </Text>
            <Text className="font-poppins text-xs text-brand-muted">
              Ringkasan cepat untuk membantu keputusan hari ini.
            </Text>
          </View>
        </View>

        {visibleInsights.map((insight, index) => (
          <View
            key={`insight-${index}`}
            className="mt-2.5 flex-row rounded-[22px] bg-brand-soft/30 p-4"
          >
            <View className="mr-3 h-7 w-7 items-center justify-center rounded-full bg-brand">
              <Text className="text-xs font-poppins-bold text-white">
                {index + 1}
              </Text>
            </View>
            <Text className="font-poppins flex-1 text-sm leading-6 text-brand-ink">
              {insight}
            </Text>
          </View>
        ))}

        <View className="mt-3 rounded-[22px] bg-brand-soft/20 p-4">
          <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
            Ringkasan Owner
          </Text>
          <Text className="mt-2 text-sm font-poppins-bold text-brand-ink">
            {topCashier
              ? `${topCashier.name} memimpin omzet ${formatIDR(topCashier.totalSales)}.`
              : "Belum ada performa kasir yang bisa dibandingkan."}
          </Text>
          <Text className="mt-1 font-poppins text-sm leading-5 text-brand-muted">
            Jam ramai saat ini berada di sekitar {busiestHourLabel} dengan estimasi profit {formatIDR(estimatedProfit)} pada rentang {rangeLabels[range].toLowerCase()}.
          </Text>
        </View>
      </View>

      <View className="items-center pb-4 opacity-40">
        <Text className="text-xs font-poppins-semibold tracking-wide text-brand-muted">
          WartegPOS Dashboard
        </Text>
      </View>
    </ScreenContainer>
  );
};
