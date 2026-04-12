import React, { useMemo, useState } from "react";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { RawMaterialStock } from "@/types";

interface RawMaterialStockCardProps {
  materials: RawMaterialStock[];
  isSaving?: boolean;
  onChange: (materials: RawMaterialStock[]) => void;
  onSave: () => Promise<void> | void;
}

const presets: Array<Pick<RawMaterialStock, "name" | "unit"> & { stock: number; minStock: number }> = [
  { name: "Beras", unit: "kg", stock: 20, minStock: 5 },
  { name: "Minyak goreng", unit: "liter", stock: 10, minStock: 3 },
  { name: "Telur", unit: "pcs", stock: 30, minStock: 10 },
  { name: "Tempe", unit: "pcs", stock: 20, minStock: 5 },
  { name: "Cabai", unit: "kg", stock: 5, minStock: 2 },
  { name: "Gas LPG", unit: "tabung", stock: 4, minStock: 1 },
];

const emptyForm = {
  name: "",
  unit: "kg",
  stock: "",
  minStock: "",
};

const formatStockLabel = (stock: number, unit: string) => `${stock} ${unit}`;

export const RawMaterialStockCard: React.FC<RawMaterialStockCardProps> = ({
  materials,
  isSaving = false,
  onChange,
  onSave,
}) => {
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);

  const summary = useMemo(() => {
    const totalItems = materials.length;
    const lowStockItems = materials.filter((item) => item.stock <= item.minStock).length;
    const emptyItems = materials.filter((item) => item.stock <= 0).length;
    const totalStock = materials.reduce((sum, item) => sum + item.stock, 0);

    return { totalItems, lowStockItems, emptyItems, totalStock };
  }, [materials]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
  };

  const updateMaterialList = (nextMaterials: RawMaterialStock[]) => {
    onChange(
      [...nextMaterials].sort((left, right) => {
        if (left.stock !== right.stock) {
          return left.stock - right.stock;
        }

        return left.name.localeCompare(right.name);
      }),
    );
  };

  const handlePreset = (preset: Pick<RawMaterialStock, "name" | "unit"> & { stock: number; minStock: number }) => {
    setForm((current) => ({
      ...current,
      name: preset.name,
      unit: preset.unit,
      stock: String(preset.stock),
      minStock: String(preset.minStock),
    }));
    setEditingId(null);
  };

  const handleEdit = (item: RawMaterialStock) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      unit: item.unit,
      stock: String(item.stock),
      minStock: String(item.minStock),
    });
  };

  const handleRemove = (item: RawMaterialStock) => {
    Alert.alert(
      "Hapus bahan baku?",
      `${item.name} akan dihapus dari daftar stok.`,
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: () => {
            updateMaterialList(materials.filter((material) => material.id !== item.id));
            if (editingId === item.id) {
              resetForm();
            }
          },
        },
      ],
    );
  };

  const handleSubmit = () => {
    const name = form.name.trim();
    const unit = form.unit.trim() || "kg";
    const stock = Number.parseInt(form.stock || "0", 10);
    const minStock = Number.parseInt(form.minStock || "0", 10);

    if (!name) {
      Alert.alert("Nama belum diisi", "Nama bahan baku wajib diisi.");
      return;
    }

    if (
      Number.isNaN(stock) ||
      stock < 0 ||
      Number.isNaN(minStock) ||
      minStock < 0
    ) {
      Alert.alert(
        "Nilai tidak valid",
        "Stok dan batas minimum harus bernilai 0 atau lebih.",
      );
      return;
    }

    const nextItem: RawMaterialStock = {
      id: editingId ?? `raw-${Date.now()}`,
      name,
      unit,
      stock,
      minStock,
      updatedAt: new Date().toISOString(),
    };

    const exists = materials.some((item) => item.id === nextItem.id);
    const nextMaterials = exists
      ? materials.map((item) => (item.id === nextItem.id ? nextItem : item))
      : [nextItem, ...materials];

    updateMaterialList(nextMaterials);
    resetForm();
  };

  const handleSave = async () => {
    await onSave();
  };

  return (
    <View className="mb-5 rounded-[28px] border border-emerald-100 bg-white p-5 shadow-sm">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-emerald-600">
            Stok Bahan Baku
          </Text>
          <Text className="mt-1 text-xl font-poppins-bold text-brand-ink">
            Inventori Dapur
          </Text>
        </View>
        <View className="h-12 w-12 items-center justify-center rounded-[18px] bg-emerald-50">
          <Text className="text-2xl">🥬</Text>
        </View>
      </View>

      <View className="mb-4 flex-row flex-wrap justify-between">
        <View className="mb-2 w-[48%] rounded-[22px] bg-emerald-50/60 p-3">
          <Text className="text-[10px] font-poppins-semibold uppercase tracking-wider text-emerald-700/60">
            Item
          </Text>
          <Text className="text-lg font-poppins-bold text-emerald-900">
            {summary.totalItems}
          </Text>
        </View>
        <View className="mb-2 w-[48%] rounded-[22px] bg-amber-50/60 p-3">
          <Text className="text-[10px] font-poppins-semibold uppercase tracking-wider text-amber-700/60">
            Menipis
          </Text>
          <Text className="text-lg font-poppins-bold text-amber-900">
            {summary.lowStockItems}
          </Text>
        </View>
        <View className="mb-2 w-[48%] rounded-[22px] bg-red-50/60 p-3">
          <Text className="text-[10px] font-poppins-semibold uppercase tracking-wider text-red-700/60">
            Habis
          </Text>
          <Text className="text-lg font-poppins-bold text-red-900">
            {summary.emptyItems}
          </Text>
        </View>
        <View className="mb-2 w-[48%] rounded-[22px] bg-slate-50/60 p-3">
          <Text className="text-[10px] font-poppins-semibold uppercase tracking-wider text-slate-700/60">
            Total Satuan
          </Text>
          <Text className="text-lg font-poppins-bold text-slate-900">
            {summary.totalStock}
          </Text>
        </View>
      </View>

      <View className="mb-4 rounded-[22px] bg-brand-soft/25 p-4">
        <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
          Shortcut Cepat
        </Text>
        <View className="mt-3 flex-row flex-wrap">
          {presets.map((preset) => (
            <Pressable
              key={preset.name}
              className="mr-2 mb-2 rounded-full border border-brand/10 bg-white px-3 py-1.5"
              onPress={() => handlePreset(preset)}
            >
              <Text className="text-xs font-poppins-semibold text-brand-ink">
                {preset.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View className="mb-4 rounded-[24px] border border-brand/10 bg-brand-soft/20 p-4">
        <Text className="mb-3 text-sm font-poppins-bold text-brand-ink">
          {editingId ? "Ubah bahan baku" : "Tambah bahan baku"}
        </Text>

        <TextInput
          className="mb-3 rounded-2xl border border-brand/15 bg-white px-4 py-3 text-base font-poppins-medium text-brand-ink"
          placeholder="Nama bahan baku"
          placeholderTextColor="#A0A0A0"
          value={form.name}
          onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
        />

        <View className="mb-3 flex-row">
          <TextInput
            className="mr-2 flex-1 rounded-2xl border border-brand/15 bg-white px-4 py-3 text-base font-poppins-medium text-brand-ink"
            placeholder="Satuan"
            placeholderTextColor="#A0A0A0"
            value={form.unit}
            onChangeText={(value) => setForm((current) => ({ ...current, unit: value }))}
          />
          <TextInput
            className="ml-2 flex-1 rounded-2xl border border-brand/15 bg-white px-4 py-3 text-base font-poppins-medium text-brand-ink"
            placeholder="Stok"
            placeholderTextColor="#A0A0A0"
            keyboardType="number-pad"
            value={form.stock}
            onChangeText={(value) => setForm((current) => ({ ...current, stock: value }))}
          />
        </View>

        <TextInput
          className="mb-4 rounded-2xl border border-brand/15 bg-white px-4 py-3 text-base font-poppins-medium text-brand-ink"
          placeholder="Batas minimum"
          placeholderTextColor="#A0A0A0"
          keyboardType="number-pad"
          value={form.minStock}
          onChangeText={(value) => setForm((current) => ({ ...current, minStock: value }))}
        />

        <View className="flex-row">
          <View className="mr-2 flex-1">
            <AppButton
              label={editingId ? "Update Item" : "Tambah Item"}
              onPress={handleSubmit}
              variant="secondary"
            />
          </View>
          <View className="ml-2 flex-1">
            <AppButton
              label={isSaving ? "Menyimpan..." : "Simpan ke Owner"}
              onPress={handleSave}
              loading={isSaving}
            />
          </View>
        </View>
      </View>

      {materials.length === 0 ? (
        <View className="rounded-[22px] bg-slate-50 p-4">
          <Text className="font-poppins text-sm text-brand-muted">
            Belum ada bahan baku yang disimpan. Tambahkan item untuk mulai memantau stok dapur.
          </Text>
        </View>
      ) : (
        <View>
          {materials.map((item, index) => {
            const isLowStock = item.stock <= item.minStock;

            return (
              <View
                key={item.id}
                className="mb-3 rounded-[24px] border border-brand/5 bg-white p-4 shadow-sm"
              >
                <View className="mb-2 flex-row items-start justify-between">
                  <View className="flex-1 pr-3">
                    <View className="mb-2 flex-row flex-wrap items-center">
                      <View className="mr-2 mb-2 rounded-full bg-brand-soft px-2.5 py-1">
                        <Text className="text-[10px] font-poppins-semibold text-brand">
                          #{index + 1}
                        </Text>
                      </View>
                      <View
                        className={`mr-2 mb-2 rounded-full px-2.5 py-1 ${
                          isLowStock ? "bg-amber-50" : "bg-emerald-50"
                        }`}
                      >
                        <Text
                          className={`text-[10px] font-poppins-semibold ${
                            isLowStock ? "text-amber-700" : "text-emerald-700"
                          }`}
                        >
                          {isLowStock ? "Perlu restock" : "Stok aman"}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-lg font-poppins-bold text-brand-ink">
                      {item.name}
                    </Text>
                    <Text className="mt-1 text-sm font-poppins text-brand-muted">
                      {formatStockLabel(item.stock, item.unit)} • minimum {item.minStock} {item.unit}
                    </Text>
                  </View>

                  <View className="rounded-[18px] bg-brand-soft/30 px-3 py-2">
                    <Text className="text-[10px] font-poppins-semibold uppercase tracking-wide text-brand-muted">
                      Update
                    </Text>
                    <Text className="mt-1 text-xs font-poppins-semibold text-brand-ink">
                      {item.updatedAt
                        ? new Date(item.updatedAt).toLocaleDateString("id-ID")
                        : "Baru"}
                    </Text>
                  </View>
                </View>

                <View className="flex-row">
                  <View className="mr-2 flex-1">
                    <Pressable
                      className="rounded-[18px] bg-brand px-4 py-3"
                      onPress={() => handleEdit(item)}
                    >
                      <Text className="text-center text-sm font-poppins-bold text-white">
                        Ubah
                      </Text>
                    </Pressable>
                  </View>
                  <View className="ml-2 flex-1">
                    <Pressable
                      className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3"
                      onPress={() => handleRemove(item)}
                    >
                      <Text className="text-center text-sm font-poppins-bold text-red-700">
                        Hapus
                      </Text>
                    </Pressable>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};
