import * as FileSystem from "expo-file-system/legacy";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { Alert } from "react-native";
import XLSX from "xlsx";

import { Product } from "@/types";
import { formatIDR } from "@/utils/currency";

export const exportStockToExcel = async (products: Product[]) => {
  try {
    const data = products.map((p, index) => ({
      No: index + 1,
      Nama: p.name,
      Kategori: p.category,
      Harga: p.price,
      Stok: p.stock ?? 0,
      Status: p.isActive ? "Aktif" : "Nonaktif",
      "Terakhir Diperbarui": p.createdAt ? new Date(p.createdAt).toLocaleString("id-ID") : "-",
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Stok Barang");

    const wbout = XLSX.write(wb, { type: "base64", bookType: "xlsx" });
    const uri = (FileSystem as any).documentDirectory + `Laporan_Stok_Barang_${new Date().getTime()}.xlsx`;

    await (FileSystem as any).writeAsStringAsync(uri, wbout, {
      encoding: "base64",
    });

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
    } else {
      Alert.alert("Error", "Fitur berbagi tidak tersedia di perangkat ini.");
    }
  } catch (error) {
    console.error("Export Stock Excel Error:", error);
    Alert.alert("Gagal Export", "Terjadi kesalahan saat membuat file Excel.");
  }
};

export const exportStockToPDF = async (products: Product[]) => {
  try {
    const totalItems = products.length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stock ?? 0)), 0);

    const htmlContent = `
      <html>
        <head>
          <style>
            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; color: #333; }
            h1 { text-align: center; color: #10B981; }
            h3 { text-align: center; color: #555; margin-bottom: 30px; }
            .summary { display: flex; justify-content: space-around; margin-bottom: 20px; padding: 15px; background: #ecfdf5; border-radius: 8px; }
            .summary div { text-align: center; }
            .summary div strong { display: block; font-size: 1.2em; color: #059669; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #10B981; color: white; }
            tr:nth-child(even) { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <h1>Laporan Stok Barang</h1>
          <h3>Tanggal Cetak: ${new Date().toLocaleString("id-ID")}</h3>
          
          <div class="summary">
            <div>Total Jenis Barang<strong>${totalItems}</strong></div>
            <div>Estimasi Nilai Stok<strong>${formatIDR(totalValue)}</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Nama Produk</th>
                <th>Kategori</th>
                <th>Harga</th>
                <th>Sisa Stok</th>
              </tr>
            </thead>
            <tbody>
              ${products.map((p, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${p.name}</td>
                  <td>${p.category}</td>
                  <td>${formatIDR(p.price)}</td>
                  <td>${p.stock ?? 0}</td>
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
    console.error("Export Stock PDF Error:", error);
    Alert.alert("Gagal Export", "Terjadi kesalahan saat membuat file PDF.");
  }
};
