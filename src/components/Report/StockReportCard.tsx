import React, { useMemo } from "react";
import { View, Text, Pressable, ScrollView } from "react-native";
import { formatIDR } from "@/utils/currency";
import { Product } from "@/types";
import { AppButton } from "@/components/AppButton";
import { exportStockToExcel, exportStockToPDF } from "@/utils/stockExportTools";

interface StockReportCardProps {
  products: Product[];
}

export const StockReportCard: React.FC<StockReportCardProps> = ({ products }) => {
  const stockSummary = useMemo(() => {
    const totalItems = products.length;
    const itemsLow = products.filter(p => (p.stock ?? 0) <= 5 && p.isActive).length;
    const itemsOut = products.filter(p => (p.stock ?? 0) === 0 && p.isActive).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * (p.stock ?? 0)), 0);

    return { totalItems, itemsLow, itemsOut, totalValue };
  }, [products]);

  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportPDF = async () => {
    setIsExporting(true);
    await exportStockToPDF(products);
    setIsExporting(false);
  };

  const handleExportExcel = async () => {
    setIsExporting(true);
    await exportStockToExcel(products);
    setIsExporting(false);
  };

  return (
    <View className="mb-5 rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-emerald-600">
            Laporan Stok Barang
          </Text>
          <Text className="mt-1 text-xl font-poppins-bold text-brand-ink">
            Status Inventori
          </Text>
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-[18px] bg-emerald-50">
          <Text className="text-2xl">📦</Text>
        </View>
      </View>

      <View className="mb-4 flex-row flex-wrap justify-between">
        <View className="mb-2 w-[48%] rounded-[22px] bg-emerald-50/50 p-3">
          <Text className="text-[10px] font-poppins-semibold uppercase tracking-wider text-emerald-700/60">
            Jenis Barang
          </Text>
          <Text className="text-lg font-poppins-bold text-emerald-900">
            {stockSummary.totalItems}
          </Text>
        </View>
        <View className="mb-2 w-[48%] rounded-[22px] bg-amber-50/50 p-3">
          <Text className="text-[10px] font-poppins-semibold uppercase tracking-wider text-amber-700/60">
            Stok Menipis
          </Text>
          <Text className="text-lg font-poppins-bold text-amber-900">
            {stockSummary.itemsLow}
          </Text>
        </View>
        <View className="mb-2 w-[48%] rounded-[22px] bg-red-50/50 p-3">
          <Text className="text-[10px] font-poppins-semibold uppercase tracking-wider text-red-700/60">
            Stok Habis
          </Text>
          <Text className="text-lg font-poppins-bold text-red-900">
            {stockSummary.itemsOut}
          </Text>
        </View>
        <View className="mb-2 w-[48%] rounded-[22px] bg-slate-50/50 p-3">
          <Text className="text-[10px] font-poppins-semibold uppercase tracking-wider text-slate-700/60">
            Nilai Inventori
          </Text>
          <Text className="text-sm font-poppins-bold text-slate-900 leading-6" numberOfLines={1}>
            {formatIDR(stockSummary.totalValue)}
          </Text>
        </View>
      </View>

      {stockSummary.itemsLow > 0 && (
        <View className="mb-4 rounded-[20px] bg-amber-50 p-3">
          <Text className="text-xs font-poppins text-amber-800">
            ⚠️ Ada {stockSummary.itemsLow} barang yang stoknya di bawah 5. Disarankan untuk segera melakukan stok ulang.
          </Text>
        </View>
      )}

      <View className="flex-row items-center justify-between">
        <Pressable 
          className="flex-1 mr-2 flex-row items-center justify-center rounded-[20px] bg-brand py-3"
          onPress={handleExportPDF}
          disabled={isExporting}
        >
          <Text className="mr-2 text-xs">📄</Text>
          <Text className="text-xs font-poppins-bold text-white">Stok (PDF)</Text>
        </Pressable>
        <Pressable 
          className="flex-1 ml-2 flex-row items-center justify-center rounded-[20px] bg-emerald-600 py-3"
          onPress={handleExportExcel}
          disabled={isExporting}
        >
          <Text className="mr-2 text-xs">📊</Text>
          <Text className="text-xs font-poppins-bold text-white">Stok (Excel)</Text>
        </Pressable>
      </View>
    </View>
  );
};
