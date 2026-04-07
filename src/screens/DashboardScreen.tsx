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
} from "@/services/firestoreService";
import {
  AppStackParamList,
  BusinessType,
  ClosingRecord,
  ClosingReports,
  SalesReportSummary,
  TransactionRecord,
} from "@/types";
import { formatIDR } from "@/utils/currency";
import { exportTransactionsToExcel, exportTransactionsToPDF } from "@/utils/exportTools";
import { formatLongDate, formatTime } from "@/utils/date";
import { generateInsights } from "@/utils/insights";

type Props = NativeStackScreenProps<AppStackParamList, "Dashboard">;

const rangeLabels: Record<keyof typeof dateRanges, string> = {
  today: "Hari Ini",
  month: "Bulan Ini",
  year: "Tahun Ini",
};

const rangeIcons: Record<keyof typeof dateRanges, string> = {
  today: "📅",
  month: "📆",
  year: "📊",
};

const reportLabels: Record<keyof ClosingReports, string> = {
  day: "Harian",
  month: "Bulanan",
  year: "Tahunan",
};

const businessLabels: Record<BusinessType, string> = {
  warung: "Warung Harian",
  warteg: "Warteg",
  restoran: "Restoran",
  toko: "Toko Retail",
};

type SalesRoute = "POS" | "Warteg" | "Table";

const salesEntryByBusinessType: Record<
  BusinessType,
  { label: string; route: SalesRoute; icon: string; hint: string }
> = {
  warung: {
    label: "Buka Kasir",
    route: "POS",
    icon: "🧾",
    hint: "Mulai transaksi cepat dari daftar produk.",
  },
  warteg: {
    label: "Buka Warteg",
    route: "Warteg",
    icon: "🍽️",
    hint: "Masuk ke mode prasmanan dan paket hemat.",
  },
  restoran: {
    label: "Pilih Meja",
    route: "Table",
    icon: "🍴",
    hint: "Lanjutkan pesanan berdasarkan nomor meja.",
  },
  toko: {
    label: "Buka Kasir",
    route: "POS",
    icon: "🏪",
    hint: "Masuk ke kasir retail dengan kategori produk.",
  },
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

  useEffect(() => {
    if (!authUser) {
      return;
    }

    const unsubscribe = subscribeTransactionsByRange(
      authUser.uid,
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
      authUser.uid,
      "today",
      setTodayTransactions,
    );
    return unsubscribe;
  }, [authUser]);

  useEffect(() => {
    if (!authUser) {
      return;
    }

    const unsubscribe = subscribeTodayClosing(authUser.uid, setTodayClosing);
    return unsubscribe;
  }, [authUser]);

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
      const data = await getTransactionsByRange(authUser.uid, reportRange === "day" ? "today" : reportRange);
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
      const data = await getTransactionsByRange(authUser.uid, reportRange === "day" ? "today" : reportRange);
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

  const businessType = profile?.businessType ?? "warung";
  const businessLabel = businessLabels[businessType];
  const mainEntry = salesEntryByBusinessType[businessType];
  const cashierName = useMemo(
    () => getCashierName(profile?.email ?? authUser?.email),
    [authUser?.email, profile?.email],
  );
  const todayLabel = useMemo(() => formatLongDate(), []);
  const closingHour = profile?.closingHour ?? CLOSING_HOUR;
  const canCloseNow = new Date().getHours() >= closingHour;

  const actionCards = useMemo(
    () => [
      {
        label: mainEntry.label,
        icon: mainEntry.icon,
        hint: mainEntry.hint,
        accent: true,
        onPress: () => navigation.navigate(mainEntry.route),
      },
      {
        label: "Produk",
        icon: "📦",
        hint: "Tambah atau edit stok dan harga jual.",
        accent: false,
        onPress: () => navigation.navigate("Products"),
      },
      {
        label: "Riwayat",
        icon: "📋",
        hint: "Lihat transaksi yang sudah berjalan.",
        accent: false,
        onPress: () => navigation.navigate("Transactions"),
      },
      {
        label: "Pengaturan Toko",
        icon: "⚙️",
        hint: "Atur jam operasional dan diskon promo.",
        accent: false,
        onPress: () => navigation.navigate("Settings"),
      },
      {
        label: "Logout",
        icon: "🚪",
        hint: "Keluar dari akun sekarang.",
        accent: false,
        onPress: signOutUser,
      },
    ],
    [mainEntry, navigation, signOutUser],
  );

  const visibleInsights =
    insights.length > 0
      ? insights.slice(0, 3)
      : [
          "Belum ada cukup data transaksi. Jalankan beberapa penjualan untuk melihat insight otomatis.",
        ];

  const reportSummary = todayClosing?.reports?.[reportRange] ?? emptySummary;

  const handleCloseDay = () => {
    if (!authUser || !profile?.businessType) {
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
              await closeTodaySales({
                userId: authUser.uid,
                businessType: profile.businessType,
                cashierName,
                cashierEmail: profile.email,
                summary: todaySummary,
              });
              Alert.alert(
                "Closing berhasil",
                "Penjualan hari ini sudah ditutup dan siap dibuatkan laporan.",
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
      await generateAndSaveClosingReports(authUser.uid);
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
              {businessLabel} • kasir {cashierName} • {todayLabel}
            </Text>
          </View>
          <View className="h-14 w-14 items-center justify-center rounded-[20px] bg-white/15">
            <Text className="font-poppins text-2xl">📈</Text>
          </View>
        </View>

        <View className="mt-4 flex-row flex-wrap">
          <View className="mr-2 mb-2 rounded-full bg-white/12 px-3 py-2">
            <Text className="text-xs font-poppins-semibold text-white">
              Kasir: {cashierName}
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

          <View className="mb-4 flex-row justify-between">
            <AppButton
              label={isExporting ? "Memproses..." : "📄 Export PDF"}
              onPress={handleExportPDF}
              variant="secondary"
              loading={isExporting}
            />
            <View className="w-2" />
            <AppButton
              label={isExporting ? "Memproses..." : "📊 Export Excel"}
              onPress={handleExportExcel}
              variant="secondary"
              loading={isExporting}
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

        <View className="mt-3 flex-row flex-wrap justify-between">
          {actionCards.map((action) => (
            <Pressable
              key={action.label}
              className={`mb-3 rounded-[26px] border p-4 ${
                action.accent
                  ? "border-brand/20 bg-brand-soft/70"
                  : "border-brand/5 bg-white"
              }`}
              style={{ width: "48.5%" }}
              onPress={action.onPress}
            >
              <View
                className={`h-12 w-12 items-center justify-center rounded-[18px] ${
                  action.accent ? "bg-brand" : "bg-brand-soft/60"
                }`}
              >
                <Text className="font-poppins text-xl">{action.icon}</Text>
              </View>
              <Text className="mt-4 text-base font-poppins-bold text-brand-ink">
                {action.label}
              </Text>
              <Text className="font-poppins mt-1 text-sm leading-5 text-brand-muted">
                {action.hint}
              </Text>
            </Pressable>
          ))}
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
      </View>

      <View className="items-center pb-4 opacity-40">
        <Text className="text-xs font-poppins-semibold tracking-wide text-brand-muted">
          WartegPOS Dashboard
        </Text>
      </View>
    </ScreenContainer>
  );
};
