import { addDoc, collection, getDocs, query, updateDoc, where, doc } from "firebase/firestore";

import { db } from "@/firebase/config";

export const addProductExample = async (userId: string) => {
  return addDoc(collection(db, "products"), {
    userId,
    businessType: "warteg",
    name: "Nasi putih",
    price: 6000,
    category: "Nasi",
    stock: null,
    isActive: true,
    createdAt: new Date().toISOString(),
  });
};

export const getProductsExample = async (userId: string) => {
  const productsQuery = query(collection(db, "products"), where("userId", "==", userId));
  const snapshot = await getDocs(productsQuery);

  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data(),
  }));
};

export const updateProductExample = async (productId: string) => {
  return updateDoc(doc(db, "products", productId), {
    price: 7000,
    updatedAt: new Date().toISOString(),
  });
};
