import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import XLSX from "xlsx";

import { TransactionRecord } from "@/types";
import { formatIDR } from "@/utils/currency";

export const exportTransactionsToExcel = async (transactions: TransactionRecord[], rangeLabel: string) => {
  try {
    const data = transactions.map((t, index) => ({
      No: index + 1,
      Tanggal: t.createdAt ? new Date(t.createdAt).toLocaleString("id-ID") : "-",
      Pembeli: t.customerName || "-",
      "Metode Pembayaran": t.paymentMethod.toUpperCase(),
      "Status Pembayaran": t.paymentStatus.toUpperCase(),
      Subtotal: t.subtotal || 0,
      "Diskon Promo": t.promoDiscountAmount || 0,
      "Diskon Manual": t.manualDiscountAmount || 0,
      Total: t.total,
      "Item Dibeli": t.items.map((i) => `${i.name} (${i.qty})`).join(", "),
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");

    const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const uri = FileSystem.documentDirectory + `Laporan_Transaksi_${rangeLabel}.xlsx`;

    await FileSystem.writeAsStringAsync(uri, wbout, {
      encoding: FileSystem.EncodingType.Base64,
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert("Error", "Fitur berbagi tidak tersedia di perangkat ini.");
    }
  } catch (error) {
    console.error("Export Excel Error:", error);
    Alert.alert("Gagal Export", "Terjadi kesalahan saat membuat file Excel.");
  }
};

export const exportTransactionsToPDF = async (transactions: TransactionRecord[], rangeLabel: string) => {
  try {
    const totalOmzet = transactions.reduce((sum, t) => sum + t.total, 0);
    const totalTransactions = transactions.length;

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; color: #333; }
            h1 { text-align: center; color: #A63D40; }
            h3 { text-align: center; color: #555; margin-bottom: 30px; }
            .summary { display: flex; justify-content: space-around; margin-bottom: 20px; padding: 15px; background: #fdf6f0; border-radius: 8px; }
            .summary div { text-align: center; }
            .summary div strong { display: block; font-size: 1.2em; color: #A63D40; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #A63D40; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Laporan Penjualan</h1>
          <h3>Periode: ${rangeLabel}</h3>
          
          <div class="summary">
            <div>Total Omzet<strong>${formatIDR(totalOmzet)}</strong></div>
            <div>Total Transaksi<strong>${totalTransactions}</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Pembeli</th>
                <th>Metode</th>
                <th>Item</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map((t) => `
                <tr>
                  <td>${t.createdAt ? new Date(t.createdAt).toLocaleString("id-ID") : "-"}</td>
                  <td>${t.customerName || "-"}</td>
                  <td>${t.paymentMethod.toUpperCase()}</td>
                  <td>${t.items.map((i) => `${i.name} (x${i.qty})`).join("<br/>")}</td>
                  <td>${formatIDR(t.total)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html: htmlContent });
    
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert("Error", "Fitur berbagi tidak tersedia di perangkat ini.");
    }
  } catch (error) {
    console.error("Export PDF Error:", error);
    Alert.alert("Gagal Export", "Terjadi kesalahan saat membuat file PDF.");
  }
};
