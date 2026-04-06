import { PromoDefinition } from "@/types";

export const promoOptions: PromoDefinition[] = [
  {
    code: "HEMAT5",
    label: "Hemat 5%",
    description: "Diskon 5% untuk belanja mulai 25 ribu.",
    type: "percentage",
    value: 5,
    minSubtotal: 25000,
    maxDiscount: 10000,
  },
  {
    code: "MAKAN10",
    label: "Promo Makan 10%",
    description: "Potongan 10% untuk transaksi mulai 50 ribu.",
    type: "percentage",
    value: 10,
    minSubtotal: 50000,
    maxDiscount: 20000,
  },
  {
    code: "SAVE7K",
    label: "Potong 7 Ribu",
    description: "Diskon nominal 7 ribu untuk total minimum 35 ribu.",
    type: "nominal",
    value: 7000,
    minSubtotal: 35000,
  },
];
