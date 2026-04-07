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
  writeBatch,
  increment,
} from "firebase/firestore";

import { getDb } from "@/firebase/config";
import { dummyProductsByType } from "@/data/dummy";
import {
  BusinessType,
  ClosingRecord,
  ClosingReports,
  DashboardMetrics,
  Product,
  SalesReportSummary,
  TransactionRecord,
  UserProfile,
  PromoDefinition,
} from "@/types";
import { localDateKey } from "@/utils/date";

const compactData = <T extends Record<string, unknown>>(payload: T) =>
  Object.fromEntries(Object.entries(payload).filter(([, value]) => value !== undefined)) as T;

const usersCollection = () => collection(getDb(), "users");
const productsCollection = () => collection(getDb(), "products");
const transactionsCollection = () => collection(getDb(), "transactions");
const closingsCollection = () => collection(getDb(), "closings");

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

const startOfYear = () => {
  const date = new Date();
  date.setMonth(0, 1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
};

export const dateRanges = {
  today: startOfToday,
  month: startOfMonth,
  year: startOfYear,
};

export const summarizeTransactions = (transactions: TransactionRecord[]): SalesReportSummary => {
  if (transactions.length === 0) {
    return {
      totalSales: 0,
      transactionCount: 0,
      bestSeller: "-",
      avgTransaction: 0,
      itemSold: 0,
    };
  }

  const itemCounts = transactions.flatMap((transaction) => transaction.items).reduce<Record<string, number>>((acc, item) => {
    acc[item.name] = (acc[item.name] ?? 0) + item.qty;
    return acc;
  }, {});

  const totalSales = transactions.reduce((sum, transaction) => sum + transaction.total, 0);
  const transactionCount = transactions.length;

  return {
    totalSales,
    transactionCount,
    bestSeller: Object.entries(itemCounts).sort((left, right) => right[1] - left[1])[0]?.[0] ?? "-",
    avgTransaction: transactionCount === 0 ? 0 : Math.round(totalSales / transactionCount),
    itemSold: transactions.reduce(
      (sum, transaction) => sum + transaction.items.reduce((itemSum, item) => itemSum + item.qty, 0),
      0,
    ),
  };
};

export const createUserProfile = async (userId: string, email: string) => {
  const userRef = doc(usersCollection(), userId);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    await setDoc(
      userRef,
      compactData({
        email,
        createdAt: new Date().toISOString(),
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

export const updateBusinessType = async (userId: string, businessType: BusinessType) => {
  const userRef = doc(usersCollection(), userId);

  await setDoc(
    userRef,
    compactData({
      businessType,
      updatedAt: new Date().toISOString(),
    }),
    { merge: true },
  );
};

export const updateStoreSettings = async (
  userId: string,
  settings: { closingHour: number; promos: PromoDefinition[]; categories?: string[] },
) => {
  const userRef = doc(usersCollection(), userId);

  await setDoc(
    userRef,
    compactData({
      closingHour: settings.closingHour,
      promos: settings.promos,
      categories: settings.categories,
      updatedAt: new Date().toISOString(),
    }),
    { merge: true },
  );
};

export const subscribeProducts = (
  userId: string,
  businessType: BusinessType,
  callback: (products: Product[]) => void,
) => {
  const productsQuery = query(
    productsCollection(),
    where("userId", "==", userId),
    where("businessType", "==", businessType),
    where("isActive", "==", true),
    orderBy("createdAt", "desc"),
  );

  return onSnapshot(
    productsQuery,
    (snapshot) => {
      callback(
        snapshot.docs.map((item) => ({
          id: item.id,
          ...(item.data() as Omit<Product, "id">),
        })),
      );
    },
    (error) => {
      console.warn("subscribeProducts error:", error);
      callback([]);
    },
  );
};

export const seedDummyProducts = async (userId: string, businessType: BusinessType) => {
  const existingQuery = query(
    productsCollection(),
    where("userId", "==", userId),
    where("businessType", "==", businessType),
    limit(1),
  );

  const existing = await getDocs(existingQuery);
  if (!existing.empty) {
    return;
  }

  const batch = writeBatch(getDb());
  dummyProductsByType[businessType].forEach((product) => {
    const productRef = doc(productsCollection());
    const { id: _productId, ...rest } = product;
    batch.set(productRef, {
      ...compactData(rest),
      userId,
      createdAt: new Date().toISOString(),
    });
  });

  await batch.commit();
};

export const addProduct = async (payload: Omit<Product, "id">) =>
  addDoc(
    productsCollection(),
    compactData({
      ...payload,
      createdAt: new Date().toISOString(),
    }),
  );

export const editProduct = async (productId: string, payload: Partial<Product>) =>
  updateDoc(
    doc(productsCollection(), productId),
    compactData({
      ...payload,
      updatedAt: new Date().toISOString(),
    }),
  );

export const archiveProduct = async (productId: string) =>
  updateDoc(doc(productsCollection(), productId), {
    isActive: false,
    updatedAt: new Date().toISOString(),
  });

export const addTransaction = async (payload: Omit<TransactionRecord, "id" | "createdAt">) => {
  const batch = writeBatch(getDb());
  const transactionRef = doc(transactionsCollection());

  batch.set(
    transactionRef,
    compactData({
      ...payload,
      createdAt: new Date().toISOString(),
      firestoreCreatedAt: serverTimestamp(),
    }),
  );

  for (const item of payload.items) {
    if (item.stock !== undefined && item.stock !== null) {
      const productRef = doc(productsCollection(), item.id);
      batch.update(productRef, {
        stock: increment(-item.qty),
        updatedAt: new Date().toISOString(),
      });
    }
  }

  await batch.commit();
  return transactionRef;
};

export const subscribeTodayClosing = (userId: string, callback: (closing: ClosingRecord | null) => void) => {
  const q = query(
    closingsCollection(),
    where("userId", "==", userId),
    where("dateKey", "==", localDateKey()),
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
  businessType: BusinessType;
  cashierName: string;
  cashierEmail?: string;
  summary: SalesReportSummary;
}) =>
  setDoc(
    closingDocRef(payload.userId),
    compactData({
      userId: payload.userId,
      businessType: payload.businessType,
      dateKey: localDateKey(),
      cashierName: payload.cashierName,
      cashierEmail: payload.cashierEmail,
      ...payload.summary,
      closedAt: new Date().toISOString(),
    }),
    { merge: true },
  );

export const getTransactionsByRange = async (
  userId: string,
  rangeStyle: keyof typeof dateRanges,
): Promise<TransactionRecord[]> => {
  const transactionsQuery = query(
    transactionsCollection(),
    where("userId", "==", userId)
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
    where("userId", "==", userId)
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
    where("userId", "==", userId)
  );

  return onSnapshot(
    transactionsQuery,
    (snapshot) => {
      const minDate = dateRanges[rangeStyle]();
      const docs = snapshot.docs
        .map((item) => ({
          id: item.id,
          ...(item.data() as Omit<TransactionRecord, "id">),
        }))
        .filter((t) => t.createdAt && t.createdAt >= minDate)
        .sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
        
      callback(docs);
    },
    (error) => {
      console.warn("subscribeTransactionsByRange error:", error);
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
    where("userId", "==", userId)
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
