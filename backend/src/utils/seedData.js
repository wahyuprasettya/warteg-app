import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, deleteDoc, doc } from "firebase/firestore";

const sampleMenus = [
  {
    name: "Nasi Rames Spesial",
    price: 25000,
    category: "Makanan Berat",
    image: "https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Ayam Goreng Lengkuas",
    price: 18000,
    category: "Lauk Pauk",
    image: "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Sate Ayam Madura",
    price: 22000,
    category: "Lauk Pauk",
    image: "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Es Teh Manis",
    price: 5000,
    category: "Minuman",
    image: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Es Jeruk Peras",
    price: 8000,
    category: "Minuman",
    image: "https://images.unsplash.com/photo-1557800636-894a64c1696f?auto=format&fit=crop&q=80&w=400",
  },
  {
    name: "Kerupuk Udang",
    price: 3000,
    category: "Pelengkap",
    image: "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?auto=format&fit=crop&q=80&w=400",
  }
];

export const seedMenu = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, "menu"));
    if (querySnapshot.size > 0) {
      console.log("Menu already has data");
      return;
    }

    console.log("Seeding menu data...");
    for (const item of sampleMenus) {
      await addDoc(collection(db, "menu"), item);
    }
    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error seeding data:", error);
  }
};
