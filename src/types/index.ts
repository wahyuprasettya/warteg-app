export type PaymentMethod = "cash" | "qris" | "transfer";
export type PaymentStatus = "pending" | "paid";
export type TransactionLifecycleStatus = "completed" | "refunded" | "void";

export interface OutletProfile {
  id: string;
  name: string;
  address?: string;
}

export interface UserProfile {
  id: string;
  email: string;
  role?: "owner" | "kasir";
  isActive?: boolean;
  ownerId?: string;
  createdAt?: string;
  storeName?: string;
  storeAddress?: string;
  storeLogoUrl?: string;
  openHour?: number;
  closingHour?: number;
  isStoreOpen?: boolean;
  taxPercent?: number;
  serviceChargePercent?: number;
  lowStockAlertThreshold?: number;
  estimatedProfitMarginPercent?: number;
  enabledPaymentMethods?: PaymentMethod[];
  promos?: PromoDefinition[];
  categories?: string[];
  outlets?: OutletProfile[];
  webMenuBaseUrl?: string;
}

export interface Product {
  id: string;
  userId: string;
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
  stock?: number;
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

export type OrderStatus = "pending" | "confirmed" | "ready" | "done";

export interface OrderRecord {
  id?: string;
  userId: string;
  tableId: string;
  items: CartItem[];
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  customerName?: string;
  tableNumber?: string;
  notes?: string;
  orderFromTable?: boolean;
  orderSource?: "web" | "manual";
  createdAt?: string;
}

export interface TransactionRecord {
  id?: string;
  userId: string;
  items: CartItem[];
  cashierName?: string;
  cashierEmail?: string;
  customerName?: string;
  subtotal?: number;
  discountAmount?: number;
  promoCode?: string;
  promoLabel?: string;
  promoDiscountAmount?: number;
  manualDiscountAmount?: number;
  taxAmount?: number;
  serviceChargeAmount?: number;
  profitAmount?: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  transactionStatus?: TransactionLifecycleStatus;
  refundReason?: string;
  voidReason?: string;
  auditedAt?: string;
  auditedBy?: string;
  auditNote?: string;
  tableNumber?: string;
  note?: string;
  orderFromTable?: boolean;
  orderSource?: "web" | "manual";
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
  Settings: undefined;
  CashierManagement: undefined;
  OrderList: undefined;
  CustomerOrder: { tableId: string; ownerId?: string };
  Payment: { order: OrderRecord };
};
