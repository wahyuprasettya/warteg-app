export type BusinessType = "warung" | "warteg" | "restoran" | "toko";
export type PaymentMethod = "cash" | "qris" | "transfer";
export type PaymentStatus = "pending" | "paid";

export interface UserProfile {
  id: string;
  email: string;
  businessType?: BusinessType;
  createdAt?: string;
}

export interface Product {
  id: string;
  userId: string;
  businessType: BusinessType;
  name: string;
  price: number;
  category: string;
  image?: string;
  stock?: number;
  isActive: boolean;
  createdAt?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  category: string;
  qty: number;
}

export type PromoType = "percentage" | "nominal";

export interface PromoDefinition {
  code: string;
  label: string;
  description: string;
  type: PromoType;
  value: number;
  minSubtotal?: number;
  maxDiscount?: number;
}

export interface TransactionRecord {
  id?: string;
  userId: string;
  items: CartItem[];
  customerName?: string;
  subtotal?: number;
  discountAmount?: number;
  promoCode?: string;
  promoLabel?: string;
  promoDiscountAmount?: number;
  manualDiscountAmount?: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  businessType: BusinessType;
  tableNumber?: string;
  note?: string;
  createdAt?: string;
}

export interface RestaurantTable {
  number: string;
  status: "kosong" | "terisi";
}

export interface DashboardMetrics {
  totalSales: number;
  transactionCount: number;
  bestSeller: string;
}

export interface SalesReportSummary extends DashboardMetrics {
  avgTransaction: number;
  itemSold: number;
}

export interface ClosingReports {
  day: SalesReportSummary;
  month: SalesReportSummary;
  year: SalesReportSummary;
}

export interface ClosingRecord {
  id?: string;
  userId: string;
  businessType: BusinessType;
  dateKey: string;
  cashierName: string;
  cashierEmail?: string;
  totalSales: number;
  transactionCount: number;
  bestSeller: string;
  avgTransaction: number;
  itemSold: number;
  closedAt: string;
  reportGeneratedAt?: string;
  reports?: ClosingReports;
}

export type AppStackParamList = {
  Login: undefined;
  Register: undefined;
  SetupBusiness: undefined;
  POS:
    | {
        tableNumber?: string;
      }
    | undefined;
  Warteg: undefined;
  Table: undefined;
  Cart: undefined;
  Checkout: undefined;
  Products: undefined;
  AddProduct:
    | {
        product?: Product;
      }
    | undefined;
  Transactions: undefined;
  Dashboard: undefined;
};
