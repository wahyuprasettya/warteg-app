import { DashboardMetrics, TransactionRecord } from "@/types";

export const generateInsights = (transactions: TransactionRecord[], metrics: DashboardMetrics) => {
  if (transactions.length === 0) {
    return [
      "Belum ada transaksi hari ini. Coba mulai dari menu favorit.",
      "Produk terlaris akan muncul setelah ada penjualan.",
    ];
  }

  const highVolumeItem = transactions
    .flatMap((transaction) => transaction.items)
    .reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.name] = (accumulator[item.name] ?? 0) + item.qty;
      return accumulator;
    }, {});

  const topEntry = Object.entries(highVolumeItem).sort((left, right) => right[1] - left[1])[0];

  return [
    `Produk ${metrics.bestSeller || topEntry?.[0] || "-"} paling laku hari ini.`,
    topEntry && topEntry[1] >= 8
      ? "Pengeluaran stok tinggi, pertimbangkan restock item terlaris."
      : "Laju stok masih aman untuk transaksi hari ini.",
  ];
};
