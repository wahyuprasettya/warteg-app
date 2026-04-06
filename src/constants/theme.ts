import { BusinessType } from "@/types";

export const colors = {
  background: "#F6F1E8",
  surface: "#FFF9F1",
  primary: "#A63D40",
  secondary: "#E1A948",
  success: "#127A56",
  danger: "#B42318",
  text: "#2F2522",
  muted: "#8B7E74",
  border: "#E7D9C7",
};

export const businessOptions: Array<{
  label: string;
  value: BusinessType;
  description: string;
}> = [
  {
    label: "Warung",
    value: "warung",
    description: "Kasir cepat dengan grid produk sederhana.",
  },
  {
    label: "Warteg",
    value: "warteg",
    description: "Kategori prasmanan, multi select, dan paket hemat.",
  },
  {
    label: "Restoran",
    value: "restoran",
    description: "Pilih meja dulu, lalu simpan pesanan per meja.",
  },
  {
    label: "Toko Retail",
    value: "toko",
    description: "Cocok untuk retail cepat dengan kategori dan pencarian.",
  },
];
