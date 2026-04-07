"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import MenuList from "@/components/MenuList";
import Cart from "@/components/Cart";
import CategoryChips from "@/components/CategoryChips";
import { CheckCircle2, ChevronLeft, Search, UtensilsCrossed, Sparkles } from "lucide-react";

/**
 * Main QR Menu Page with premium aesthetic.
 */
const MenuPageContent = () => {
  const searchParams = useSearchParams();
  const tableNumber = searchParams.get("table") || "Tanpa Meja";

  const [menus, setMenus] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [orderSuccess, setOrderSuccess] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSeeding, setIsSeeding] = useState(false);

  // Categories list
  const categories = useMemo(() => {
    return [...new Set(menus.map((item) => item.category).filter(Boolean))];
  }, [menus]);

  // Realtime menu fetch
  useEffect(() => {
    const q = query(collection(db, "menu"), orderBy("name", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMenus(data);
      setLoading(false);
      setError(null);
    }, (err) => {
      console.error("Firestore Listen Error:", err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAddToCart = (item) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.id === item.id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { 
          id: item.id, 
          name: item.name || item.nama, 
          price: item.price || item.harga, 
          qty: 1 
      }];
    });
  };

  const updateCartQty = (id, delta) => {
    setCart((prev) =>
      prev.map((i) => (i.id === id ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
    );
  };

  const removeFromCart = (id) => {
    setCart((prev) => prev.filter((i) => i.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    try {
      const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

      const orderData = {
        tableNumber,
        customerName: customerName || "Pelanggan",
        notes: notes || "",
        items: cart.map(({ id, name, price, qty }) => ({
          name,
          price,
          qty,
          subtotal: price * qty,
        })),
        total,
        status: "pending",
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, "orders"), orderData);
      setOrderSuccess(docRef.id);
      setCart([]); // Clear cart
    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Gagal membuat pesanan. Pastikan Firestore rules Anda sudah dikonfigurasi untuk akses publik.");
    }
  };
  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const { seedMenu } = await import("@/utils/seedData");
      await seedMenu();
      alert("Data menu berhasil ditambahkan!");
    } catch (err) {
      console.error("Seed Error:", err);
      alert("Gagal menambahkan data: " + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const filteredMenus = useMemo(() => {
    let result = menus;
    if (activeCategory) {
      result = result.filter(m => m.category === activeCategory);
    }
    if (searchTerm) {
      result = result.filter((item) =>
        (item.name || item.nama || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
    }
    return result;
  }, [menus, searchTerm, activeCategory]);

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
        <div className="bg-green-100 p-8 rounded-full text-green-600 mb-8 border-4 border-green-50 shadow-[0_0_50px_rgba(34,197,94,0.2)]">
          <CheckCircle2 size={64} className="stroke-[3px]" />
        </div>
        <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
          Pesanan Terkirim!
        </h1>
        <p className="text-gray-500 max-w-xs mb-10 font-medium">
          Duduk manis ya, tim kami sedang menyiapkan pesanan terbaik untukmu.
        </p>
        <div className="bg-gray-50 p-6 rounded-[32px] border border-gray-100 w-full max-w-sm space-y-4 shadow-sm relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 text-orange-200">
             <Sparkles size={40} />
           </div>
          <div className="flex justify-between items-center text-xs font-black text-gray-300 uppercase tracking-[0.2em] leading-none mb-2">
            <span>Order Reference</span>
          </div>
          <p className="text-gray-900 font-mono font-bold text-lg break-all bg-white p-4 rounded-2xl border border-gray-100 shadow-sm text-center">
            #{orderSuccess.slice(-8).toUpperCase()}
          </p>
          <div className="bg-orange-600 text-white rounded-2xl p-4 flex justify-between items-center shadow-lg shadow-orange-100 mt-4">
             <span className="font-bold opacity-80">Meja</span>
             <span className="font-black text-xl">#{tableNumber}</span>
          </div>
        </div>
        <button
          onClick={() => setOrderSuccess(null)}
          className="mt-12 text-orange-600 font-black hover:text-orange-700 underline underline-offset-8 decoration-2 flex items-center gap-2 group transition-all"
        >
          <ChevronLeft className="group-hover:-translate-x-2 transition-transform" /> Pesan Lagi
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white max-w-2xl mx-auto flex flex-col pb-20 selection:bg-orange-100 selection:text-orange-600 relative">
      {/* Sticky Premium Header */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md z-40 p-4 pb-2 border-b border-gray-50 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex flex-col">
            <h1 className="text-3xl font-black text-gray-900 leading-tight tracking-tight">
              Delicious <span className="text-orange-600 italic">Menu</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
               <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                 Meja #{tableNumber}
              </p>
            </div>
          </div>
          <div className="w-14 h-14 bg-orange-50 rounded-[20px] text-orange-600 flex items-center justify-center border border-orange-100 shadow-inner">
            <UtensilsCrossed size={28} className="stroke-[2.5px]" />
          </div>
        </div>

        {/* Search Bar with focus effects */}
        <div className="relative group mb-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-orange-600 transition-colors" size={20} />
          <input
            type="text"
            placeholder="Cari menu favoritmu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 border-2 border-transparent focus:border-orange-500/10 focus:bg-white p-4 pl-12 rounded-2xl outline-none transition-all font-bold text-gray-900 placeholder:text-gray-300 shadow-inner"
          />
        </div>
      </header>

      {/* Category Filter Chips */}
      <CategoryChips 
        categories={categories} 
        activeCategory={activeCategory} 
        onSelect={setActiveCategory} 
      />

      {/* Item List Area */}
      <main className="flex-1 mt-2">
        {error ? (
          <div className="p-10 text-center flex flex-col items-center">
            <div className="bg-red-50 text-red-500 p-6 rounded-[32px] border border-red-100 mb-6">
               <Sparkles size={48} className="rotate-45" />
            </div>
            <h2 className="text-xl font-black text-gray-900 mb-2">Akses Ditolak</h2>
            <p className="text-gray-500 text-sm mb-8 leading-relaxed">
              Firestore mengembalikan error: <br/>
              <span className="font-mono text-[10px] bg-red-50 text-red-600 p-1 rounded mt-2 inline-block">
                {error}
              </span>
            </p>
            <div className="bg-orange-50 p-6 rounded-3xl border border-orange-100 text-left w-full">
               <p className="text-xs font-black text-orange-600 uppercase tracking-widest mb-3">Cara Memperbaiki:</p>
               <ul className="text-xs text-orange-700 space-y-2 list-disc pl-4 font-medium">
                 <li>Periksa <b>Firestore Rules</b> di Firebase Console.</li>
                 <li>Pastikan rules mengizinkan <b>read</b> publik untuk koleksi 'menu'.</li>
                 <li>Lihat file <code>firestore.rules.recommendation</code> untuk contoh.</li>
               </ul>
            </div>
          </div>
        ) : (
          <>
            <MenuList
              menus={filteredMenus}
              onAddToCart={handleAddToCart}
              isLoading={loading}
              activeCategory={activeCategory}
            />
            {!loading && menus.length === 0 && (
              <div className="px-10 pb-20 -mt-20 flex flex-col items-center">
                 <button 
                  onClick={handleSeed}
                  disabled={isSeeding}
                  className="bg-orange-600 text-white px-8 py-4 rounded-2xl font-black shadow-lg shadow-orange-100 hover:bg-orange-700 active:scale-95 transition-all disabled:opacity-50"
                 >
                   {isSeeding ? "Sedang Menambah..." : "Isi Data Menu Contoh"}
                 </button>
                 <p className="text-[10px] text-gray-300 font-bold mt-4 uppercase tracking-widest">
                   Klik untuk mengisi database yang kosong
                 </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Simple Cart Control */}
      <Cart
        cart={cart}
        customerName={customerName}
        setCustomerName={setCustomerName}
        notes={notes}
        setNotes={setNotes}
        onUpdateQty={updateCartQty}
        onRemove={removeFromCart}
        onCheckout={handleCheckout}
        tableNumber={tableNumber}
      />
    </div>
  );
};

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="font-bold text-gray-400 text-sm tracking-widest uppercase">Memuat Menu...</p>
    </div>}>
      <MenuPageContent />
    </Suspense>
  );
}
