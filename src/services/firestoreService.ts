import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  or,
  and,
  writeBatch,
  increment,
} from "firebase/firestore";

import { getDb } from "@/firebase/config";
import { dummyProductsByType } from "@/data/dummy";
import { isTableOrder } from "@/utils/order";
import {
  ClosingRecord,
  ClosingReports,
  DashboardMetrics,
  PaymentMethod,
  Product,
  RawMaterialStock,
  SalesReportSummary,
  TransactionRecord,
  UserProfile,
  PromoDefinition,
  OrderRecord,
  OrderStatus,
  PaymentStatus,
} from "@/types";
import { localDateKey } from "@/utils/date";

const deepCompactData = (val: any): any => {
  if (Array.isArray(val)) {
    return val.map(deepCompactData);
  }
  if (val !== null && typeof val === "object" && !(val instanceof Date)) {
    return Object.fromEntries(
      Object.entries(val)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, deepCompactData(v)])
    );
  }
  return val;
};

const usersCollection = () => collection(getDb(), "users");
const productsCollection = () => collection(getDb(), "menu");
const transactionsCollection = () => collection(getDb(), "transactions");
const closingsCollection = () => collection(getDb(), "closings");
const ordersCollection = () => collection(getDb(), "orders");
const tablesCollection = () => collection(getDb(), "tables");

export const subscribeTableStatus = (
  userId: string,
  tableId: string,
  callback: (status: { tableIsBooking?: boolean }) => void
) => {
  const tableRef = doc(tablesCollection(), `${userId}-${tableId}`);
  return onSnapshot(tableRef, (snapshot) => {
    callback(snapshot.exists() ? (snapshot.data() as any) : {});
  });
};

export const getTableStatus = async (userId: string, tableId: string) => {
  const tableRef = doc(tablesCollection(), `${userId}-${tableId}`);
  const snapshot = await getDoc(tableRef);
  return snapshot.exists() ? (snapshot.data() as { tableIsBooking?: boolean }) : {};
};

export const updateTableBookingStatus = async (
  userId: string,
  tableId: string,
  isBooking: boolean
) => {
  const tableRef = doc(tablesCollection(), `${userId}-${tableId}`);
  await setDoc(tableRef, { tableIsBooking: isBooking }, { merge: true });
};

export const CLOSING_HOUR = 21;

const closingDocRef = (userId: string, dateKey = localDateKey()) =>
  doc(closingsCollection(), `${userId}-${dateKey}`);

const startOfToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today.toISOString();
};

const startOfMonth = () => {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

const startOfWeek = () => {
  const date = new Date();
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

const startOfYear = () => {
  const date = new Date();
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

export const dateRanges = {
  today: startOfToday,
  week: startOfWeek,
  month: startOfMonth,
  year: startOfYear,
};

export const summarizeTransactions = (transactions: TransactionRecord[]): SalesReportSummary => {
  const validTransactions = transactions.filter(
    (transaction) => (transaction.transactionStatus ?? "completed") === "completed",
  );

  if (validTransactions.length === 0) {
    return {
      totalSales: 0,
      transactionCount: 0,
      bestSeller: "-",
      avgTransaction: 0,
      itemSold: 0,
    };
  }

  const itemCounts = validTransactions.flatMap((transaction) => transaction.items).reduce<Record<string, number>>((acc, item) => {
    acc[item.name] = (acc[item.name] ?? 0) + item.qty;
    return acc;
  }, {});

  const totalSales = validTransactions.reduce((sum, transaction) => sum + transaction.total, 0);
  const transactionCount = validTransactions.length;

  return {
    totalSales,
    transactionCount,
    bestSeller: Object.entries(itemCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "-",
    avgTransaction: transactionCount === 0 ? 0 : Math.round(totalSales / transactionCount),
    itemSold: validTransactions.reduce(
      (sum, transaction) => sum + transaction.items.reduce((itemSum, item) => itemSum + item.qty, 0),
      0,
    ),
  };
};

export const createUserProfile = async (userId: string, email: string, role: "owner" | "kasir" = "owner") => {
  const userRef = doc(usersCollection(), userId);
  const snapshot = await getDoc(userRef);
  const emailName = email.split("@")[0] || "Warteg";
  const storeName = emailName
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  if (!snapshot.exists()) {
    await setDoc(
      userRef,
      deepCompactData({
        email,
        role,
        isActive: true,
        createdAt: new Date().toISOString(),
        storeName: storeName ? `Warteg ${storeName}` : "Warteg POS",
        storeAddress: "",
        openHour: 8,
        closingHour: CLOSING_HOUR,
        taxPercent: 0,
        serviceChargePercent: 0,
        lowStockAlertThreshold: 5,
        estimatedProfitMarginPercent: 30,
        enabledPaymentMethods: ["cash", "qris", "transfer"] as PaymentMethod[],
        categories: ["Makanan", "Minuman", "Cemilan", "Paket"],
        rawMaterials: [],
        outlets: [
          {
            id: "utama",
            name: "Outlet Utama",
          },
        ],
      }),
    );
  }
};

export const getUserProfile = async (userId: string) => {
  const userRef = doc(usersCollection(), userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Omit<UserProfile, "id">),
  } as UserProfile;
};

export const subscribeUserProfile = (
  userId: string,
  callback: (profile: UserProfile | null) => void
) => {
  const userRef = doc(usersCollection(), userId);
  return onSnapshot(userRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({
        id: snapshot.id,
        ...(snapshot.data() as Omit<UserProfile, "id">),
      } as UserProfile);
    } else {
      callback(null);
    }
  });
};

export const createCashierProfile = async (
  userId: string,
  email: string,
  ownerProfile?: UserProfile | null,
) => {
  const userRef = doc(usersCollection(), userId);

  await setDoc(
    userRef,
    deepCompactData({
      email,
      role: "kasir",
      isActive: true,
      ownerId: ownerProfile?.id || undefined,
      createdAt: new Date().toISOString(),
      storeName: ownerProfile?.storeName || "Warteg POS",
      storeAddress: ownerProfile?.storeAddress || "",
      openHour: ownerProfile?.openHour ?? 8,
      closingHour: ownerProfile?.closingHour ?? CLOSING_HOUR,
      taxPercent: ownerProfile?.taxPercent ?? 0,
      serviceChargePercent: ownerProfile?.serviceChargePercent ?? 0,
      lowStockAlertThreshold: ownerProfile?.lowStockAlertThreshold ?? 5,
      estimatedProfitMarginPercent: ownerProfile?.estimatedProfitMarginPercent ?? 30,
      enabledPaymentMethods:
        ownerProfile?.enabledPaymentMethods ??
        (["cash", "qris", "transfer"] as PaymentMethod[]),
      promos: ownerProfile?.promos ?? [],
      categories: ownerProfile?.categories ?? ["Makanan", "Minuman", "Cemilan", "Paket"],
      rawMaterials: ownerProfile?.rawMaterials ?? [],
      outlets: ownerProfile?.outlets ?? [{ id: "utama", name: "Outlet Utama" }],
    }),
    { merge: true },
  );
};

export const subscribeCashiersByOwner = (
  ownerId: string,
  callback: (users: UserProfile[]) => void,
) => {
  const cashiersQuery = query(
    usersCollection(),
    where("ownerId", "==", ownerId),
  );

  return onSnapshot(
    cashiersQuery,
    (snapshot) => {
      const users = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...(item.data() as Omit<UserProfile, "id">),
        }))
        .filter((user) => user.role === "kasir")
        .sort((left, right) => {
          const leftActive = left.isActive === false ? 1 : 0;
          const rightActive = right.isActive === false ? 1 : 0;
          if (leftActive !== rightActive) {
            return leftActive - rightActive;
          }

          const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
          const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
          return rightTime - leftTime;
        });

      callback(users);
    },
    (error) => {
      console.warn("subscribeCashiersByOwner error:", error);
      import("react-native").then(({ Alert }) => {
        Alert.alert("Gagal load kasir", error.message);
      });
      callback([]);
    },
  );
};

export const updateCashierProfile = async (
  cashierId: string,
  payload: Partial<Pick<UserProfile, "isActive" | "ownerId">>,
) =>
  updateDoc(
    doc(usersCollection(), cashierId),
    deepCompactData({
      ...payload,
      updatedAt: new Date().toISOString(),
    }),
  );

export const updateStoreOpenStatus = async (storeId: string, isStoreOpen: boolean) =>
  updateDoc(
    doc(usersCollection(), storeId),
    {
      isStoreOpen,
      updatedAt: new Date().toISOString(),
    }
  );

export const updateStoreSettings = async (
  userId: string,
  settings: {
    storeName?: string;
    storeAddress?: string;
    storeLogoUrl?: string;
    ownerId?: string;
    role?: "owner" | "kasir";
    openHour?: number;
    closingHour?: number;
    taxPercent?: number;
    serviceChargePercent?: number;
    lowStockAlertThreshold?: number;
    estimatedProfitMarginPercent?: number;
    isStoreOpen?: boolean;
    enabledPaymentMethods?: PaymentMethod[];
    outlets?: UserProfile["outlets"];
    promos?: PromoDefinition[];
    categories?: string[];
    rawMaterials?: RawMaterialStock[];
    webMenuBaseUrl?: string;
  },
) => {
  const userRef = doc(usersCollection(), userId);

  await setDoc(
    userRef,
    deepCompactData({
      ownerId: settings.ownerId?.trim() || undefined,
      role: settings.role,
      storeName: settings.storeName,
      storeAddress: settings.storeAddress,
      storeLogoUrl: settings.storeLogoUrl,
      openHour: settings.openHour,
      closingHour: settings.closingHour,
      taxPercent: settings.taxPercent,
      serviceChargePercent: settings.serviceChargePercent,
      lowStockAlertThreshold: settings.lowStockAlertThreshold,
      estimatedProfitMarginPercent: settings.estimatedProfitMarginPercent,
      isStoreOpen: settings.isStoreOpen,
      enabledPaymentMethods: settings.enabledPaymentMethods,
      outlets: settings.outlets,
      promos: settings.promos,
      categories: settings.categories,
      rawMaterials: settings.rawMaterials,
      webMenuBaseUrl: settings.webMenuBaseUrl,
      updatedAt: new Date().toISOString(),
    }),
    { merge: true },
  );
};

export const subscribeProducts = (
  userId: string,
  callback: (products: Product[]) => void,
) => {
  const productsQuery = query(
    productsCollection(),
    or(
      where("userId", "==", userId),
      where("uid", "==", userId)
    )
  );

  return onSnapshot(
    productsQuery,
    (snapshot) => {
      let items = snapshot.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<Product, "id">),
      }));

      // Default fallback jika data dibuat manual di firebase:
      items = items.map((i) => ({
        ...i,
        price: i.price || 0,
        name: i.name || "Menu",
        isActive: i.isActive !== false,
        uid: i.uid ?? i.userId,
      }));

      callback(items);
    },
    (error) => {
      console.warn("subscribeProducts error:", error);
      import("react-native").then(({ Alert }) => {
        Alert.alert("Gagal load menu", error.message);
      });
      callback([]);
    },
  );
};

export const seedDummyProducts = async (userId: string) => {
  const existingQuery = query(
    productsCollection(),
    or(
      where("userId", "==", userId),
      where("uid", "==", userId)
    ),
    limit(1),
  );

  const existing = await getDocs(existingQuery);
  if (!existing.empty) {
    return;
  }

  const batch = writeBatch(getDb());
  dummyProductsByType["warteg"].forEach((product) => {
    const productRef = doc(productsCollection());
    const { id: _productId, ...rest } = product;
    batch.set(productRef, {
      ...deepCompactData(rest),
      userId,
      uid: userId,
      createdAt: new Date().toISOString(),
    });
  });

  await batch.commit();
};

export const addProduct = async (payload: Omit<Product, "id">) =>
  addDoc(
    productsCollection(),
    deepCompactData({
      ...payload,
      uid: payload.uid ?? payload.userId,
      isActive: payload.isActive !== false,
      createdAt: new Date().toISOString(),
    }),
  );

export const editProduct = async (productId: string, payload: Partial<Product>) =>
  updateDoc(
    doc(productsCollection(), productId),
    deepCompactData({
      ...payload,
      updatedAt: new Date().toISOString(),
    }),
  );

export const archiveProduct = async (productId: string) =>
  updateDoc(doc(productsCollection(), productId), {
    isActive: false,
    updatedAt: new Date().toISOString(),
  });

export const restoreProduct = async (productId: string) =>
  updateDoc(doc(productsCollection(), productId), {
    isActive: true,
    updatedAt: new Date().toISOString(),
  });

export const updateTransactionRecord = async (
  transactionId: string,
  payload: Partial<TransactionRecord>,
) =>
  updateDoc(
    doc(transactionsCollection(), transactionId),
    deepCompactData({
      ...payload,
      updatedAt: new Date().toISOString(),
    }),
  );

export const addTransaction = async (payload: Omit<TransactionRecord, "id" | "createdAt">) => {
  const batch = writeBatch(getDb());
  const transactionRef = doc(transactionsCollection());

  batch.set(
    transactionRef,
    deepCompactData({
      ...payload,
      createdAt: new Date().toISOString(),
      firestoreCreatedAt: serverTimestamp(),
    }),
  );

  await batch.commit();

  // Update stock separately so it doesn't block the transaction if a product doc is missing (e.g. dummy data)
  payload.items.forEach(async (item) => {
    if (item.stock !== undefined && item.stock !== null) {
      try {
        const productRef = doc(productsCollection(), item.id);
        await updateDoc(productRef, {
          stock: increment(-item.qty),
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        // Silently fail for stock updates (common with dummy/missing products)
        console.warn(`Could not update stock for product ${item.id}`);
      }
    }
  });

  return transactionRef;

};

export const subscribeTodayClosing = (userId: string, callback: (closing: ClosingRecord | null) => void) => {
  const q = query(
    closingsCollection(),
    and(
      or(
        where("userId", "==", userId),
        where("uid", "==", userId)
      ),
      where("dateKey", "==", localDateKey())
    ),
    limit(1)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      if (snapshot.empty) {
        callback(null);
        return;
      }

      const docObj = snapshot.docs[0];
      callback({
        id: docObj.id,
        ...(docObj.data() as Omit<ClosingRecord, "id">),
      });
    },
    (error) => {
      console.warn("subscribeTodayClosing error:", error);
      callback(null);
    },
  );
};

export const closeTodaySales = async (payload: {
  userId: string;
  cashierName: string;
  cashierEmail?: string;
  summary: SalesReportSummary;
}) =>
  setDoc(
    closingDocRef(payload.userId),
    deepCompactData({
      userId: payload.userId,
      dateKey: localDateKey(),
      cashierName: payload.cashierName,
      cashierEmail: payload.cashierEmail,
      ...payload.summary,
      closedAt: new Date().toISOString(),
    }),
    { merge: true },
  );

export const archiveAndClearOrders = async (userId: string) => {
  const q = query(
    ordersCollection(),
    or(
      where("userId", "==", userId),
      where("uid", "==", userId)
    )
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) return;

  const batch = writeBatch(getDb());

  for (const docObj of snapshot.docs) {
    const order = docObj.data() as OrderRecord;

    // Only move to transactions if it's not already marked as paid
    // (though in this app's current flow, paid orders stay in the collection until closing)
    if (order.paymentStatus !== "paid") {
      const transactionRef = doc(transactionsCollection());
      batch.set(transactionRef, deepCompactData({
        userId: userId,
        items: order.items || [],
        total: order.total || 0,
        subtotal: order.total || 0,
        discountAmount: 0,
        paymentMethod: "cash", // Default to cash for auto-closing
        paymentStatus: "paid",
        tableNumber: order.tableId,
        orderFromTable: isTableOrder(order),
        orderSource: order.orderSource || "web",
        note: "Auto-closed from Order List",
        createdAt: new Date().toISOString(),
        firestoreCreatedAt: serverTimestamp(),
      }));
    }

    // Reset table booking status
    if (order.tableId) {
      const tableRef = doc(tablesCollection(), `${userId}-${order.tableId}`);
      batch.set(tableRef, { tableIsBooking: false }, { merge: true });
    }

    // Always delete the order record from the active list
    batch.delete(docObj.ref);
  }

  await batch.commit();
};

export const getTransactionsByRange = async (
  userId: string,
  rangeStyle: keyof typeof dateRanges,
): Promise<TransactionRecord[]> => {
  const transactionsQuery = query(
    transactionsCollection(),
    or(
      where("userId", "==", userId),
      where("uid", "==", userId)
    )
  );

  const snapshot = await getDocs(transactionsQuery);
  const minDate = typeof dateRanges[rangeStyle] === 'function' ? dateRanges[rangeStyle]() : new Date(0).toISOString();
  
  return snapshot.docs
    .map((item) => item.data() as TransactionRecord)
    .filter((t) => t.createdAt && t.createdAt >= minDate)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
};

const getTransactionsSummaryByRange = async (
  userId: string,
  rangeStyle: keyof typeof dateRanges,
): Promise<SalesReportSummary> => {
  const transactions = await getTransactionsByRange(userId, rangeStyle);
  return summarizeTransactions(transactions);
};

const getAggregatedClosingsByRange = async (
  userId: string,
  rangeStyle: "month" | "year",
): Promise<SalesReportSummary> => {
  const closingsQuery = query(
    closingsCollection(),
    or(
      where("userId", "==", userId),
      where("uid", "==", userId)
    )
  );

  const snapshot = await getDocs(closingsQuery);
  const minDate = dateRanges[rangeStyle]();
  const minDateKey = minDate.split("T")[0];

  const closings = snapshot.docs
    .map((item) => item.data() as ClosingRecord)
    .filter((c) => c.dateKey && c.dateKey >= minDateKey);

  if (closings.length === 0) {
    return {
      totalSales: 0,
      transactionCount: 0,
      bestSeller: "-",
      avgTransaction: 0,
      itemSold: 0,
    };
  }

  let totalSales = 0;
  let transactionCount = 0;
  let itemSold = 0;
  const bestSellerCounts: Record<string, number> = {};

  for (const c of closings) {
    totalSales += c.totalSales || 0;
    transactionCount += c.transactionCount || 0;
    itemSold += c.itemSold || 0;
    
    if (c.bestSeller && c.bestSeller !== "-") {
      bestSellerCounts[c.bestSeller] = (bestSellerCounts[c.bestSeller] || 0) + 1;
    }
  }

  const bestSeller = Object.entries(bestSellerCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "-";
  const avgTransaction = transactionCount === 0 ? 0 : Math.round(totalSales / transactionCount);

  return {
    totalSales,
    transactionCount,
    itemSold,
    bestSeller,
    avgTransaction,
  };
};

export const generateAndSaveClosingReports = async (userId: string): Promise<ClosingReports> => {
  const reports: ClosingReports = {
    day: await getTransactionsSummaryByRange(userId, "today"),
    month: await getAggregatedClosingsByRange(userId, "month"),
    year: await getAggregatedClosingsByRange(userId, "year"),
  };

  await setDoc(
    closingDocRef(userId),
    {
      userId,
      reports,
      reportGeneratedAt: new Date().toISOString(),
    },
    { merge: true },
  );

  return reports;
};

export const subscribeTransactionsByRange = (
  userId: string,
  rangeStyle: keyof typeof dateRanges,
  callback: (transactions: TransactionRecord[]) => void,
) => {
  const transactionsQuery = query(
    transactionsCollection(),
    or(
      where("userId", "==", userId),
      where("uid", "==", userId)
    ),
  );

  return onSnapshot(
    transactionsQuery,
    (snapshot) => {
      const getStr = (val: any) =>
        typeof val === "string" ? val : val?.toDate ? val.toDate().toISOString() : "";

      const minDate = dateRanges[rangeStyle]();
      const docs = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...(item.data() as Omit<TransactionRecord, "id">),
          createdAt: getStr(item.data().createdAt),
        }))
        .filter((t) => t.createdAt && t.createdAt >= minDate)
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        
      callback(docs);
    },
    (error) => {
      console.warn("subscribeTransactionsByRange error:", error);
      import("react-native").then(({ Alert }) => {
        Alert.alert("Gagal load transaksi", error.message);
      });
      callback([]);
    },
  );
};

export const subscribeTodayTransactions = (
  userId: string,
  callback: (transactions: TransactionRecord[]) => void,
) => subscribeTransactionsByRange(userId, "today", callback);

export const getDashboardMetrics = async (userId: string): Promise<DashboardMetrics> => {
  const transactionsQuery = query(
    transactionsCollection(),
    or(
      where("userId", "==", userId),
      where("uid", "==", userId)
    )
  );

  const snapshot = await getDocs(transactionsQuery);
  const minDate = startOfToday();
  const transactions = snapshot.docs
    .map((item) => item.data() as TransactionRecord)
    .filter((t) => t.createdAt && t.createdAt >= minDate)
    .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));

  const summary = summarizeTransactions(transactions);

  return {
    totalSales: summary.totalSales,
    transactionCount: summary.transactionCount,
    bestSeller: summary.bestSeller,
  };
};

export const addOrder = async (payload: Omit<OrderRecord, "id" | "createdAt">) => {
  const batch = writeBatch(getDb());
  const orderRef = doc(ordersCollection());

  batch.set(
    orderRef,
    deepCompactData({
      ...payload,
      createdAt: new Date().toISOString(),
    })
  );

  // Mark table as booked
  const tableRef = doc(tablesCollection(), `${payload.userId}-${payload.tableId}`);
  batch.set(tableRef, { tableIsBooking: true }, { merge: true });

  await batch.commit();
  return orderRef;
};

export const updateOrder = async (orderId: string, payload: Partial<OrderRecord>) => {
  const orderRef = doc(ordersCollection(), orderId);
  await updateDoc(orderRef, deepCompactData({
    ...payload,
    updatedAt: new Date().toISOString(),
  }));
};

export const subscribeOrders = (
  userId: string,
  callback: (orders: OrderRecord[]) => void
) => {
  // We use a query that at least filters for the current user.
  // To keep it simple and avoid complex 'or' query indexing issues,
  // we primarily fetch the store's orders.
  const ordersQuery = query(
    ordersCollection(),
    or(
      where("userId", "in", [userId, "public", ""]),
      where("uid", "==", userId)
    )
  );

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const getStr = (val: any) =>
        typeof val === "string"
          ? val
          : val?.toDate
            ? val.toDate().toISOString()
            : "";

      const orders = snapshot.docs.map((docObj) => {
        const data = docObj.data();
        return {
          id: docObj.id,
          ...data,
          createdAt: getStr(data.createdAt),
        } as OrderRecord;
      });
      // Sort client-side safely
      orders.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      callback(orders);
    },
    (error) => {
      console.warn("subscribeOrders error:", error);
      import("react-native").then(({ Alert }) => {
        Alert.alert("Gagal load pesanan aktif", error.message);
      });
      callback([]);
    }
  );
};

export const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
  await updateDoc(doc(ordersCollection(), orderId), { status });
};

export const updateOrderStatuses = async (orderId: string, status: OrderStatus, paymentStatus?: PaymentStatus) => {
  const data: Record<string, any> = { status };
  if (paymentStatus !== undefined) {
    data.paymentStatus = paymentStatus;
  }
  await updateDoc(doc(ordersCollection(), orderId), data);
};

export const subscribeTables = (userId: string, callback: (tables: string[]) => void) => {
  const tablesRef = doc(getDb(), "users", userId, "settings", "tables");
  return onSnapshot(
    tablesRef,
    (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data().list || []);
      } else {
        callback([]);
      }
    },
    (error) => {
      console.warn("subscribeTables error:", error);
      callback([]);
    }
  );
};

export const updateStoreTables = async (userId: string, tables: string[]) => {
  const tablesRef = doc(getDb(), "users", userId, "settings", "tables");
  await setDoc(tablesRef, { list: tables, updatedAt: new Date().toISOString() });
};
