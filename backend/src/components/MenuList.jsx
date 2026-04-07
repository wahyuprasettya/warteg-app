"use client";

import React from "react";
import { formatRupiah } from "@/utils/formatRupiah";
import { Plus, ShoppingCart, Image as ImageIcon, Star } from "lucide-react";

/**
 * Enhanced MenuList with premium item cards and better categorization.
 */
const MenuList = ({ menus, onAddToCart, isLoading, activeCategory }) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 animate-pulse px-4 mt-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-28 h-28 bg-gray-100 rounded-[24px]" />
            <div className="flex-1 space-y-3 py-2">
              <div className="h-4 bg-gray-100 rounded w-3/4" />
              <div className="h-4 bg-gray-100 rounded w-1/2" />
              <div className="h-8 bg-gray-100 rounded w-1/4 mt-4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const filteredMenus = activeCategory 
    ? menus.filter(item => item.category === activeCategory)
    : menus;

  if (filteredMenus.length === 0) {
    return (
      <div className="text-center py-24 px-8 flex flex-col items-center">
        <div className="bg-orange-50 rounded-full w-24 h-24 flex items-center justify-center mb-6 text-orange-200">
          <ShoppingCart size={48} />
        </div>
        <p className="text-gray-900 font-black text-xl mb-2">Menu tidak ditemukan</p>
        <p className="text-gray-400 text-sm font-medium">Coba cari kategori atau menu lainnya ya!</p>
      </div>
    );
  }

  // Grupping logic for sticky headers
  const categories = [...new Set(filteredMenus.map((item) => item.category || "Favorit Kami"))];

  return (
    <div className="space-y-12 pb-40 mt-6 animate-in fade-in duration-700">
      {categories.map((category) => (
        <section key={category} className="px-5">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-8 w-1.5 bg-orange-600 rounded-full" />
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
              {category}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {filteredMenus
              .filter((item) => (item.category || "Favorit Kami") === category)
              .map((item) => (
                <div
                  key={item.id}
                  className="group relative flex flex-col bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 overflow-hidden active:scale-[0.98]"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
                    {item.image || item.gambar ? (
                      <img
                        src={item.image || item.gambar}
                        alt={item.name || item.nama}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-slate-200">
                        <ImageIcon size={40} />
                      </div>
                    )}
                    
                    {/* Floating category badge on image */}
                    <div className="absolute top-4 left-4">
                       <span className="bg-white/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-900 border border-white/50">
                          {item.category || "General"}
                       </span>
                    </div>

                    {item.isBestSeller && (
                      <div className="absolute top-4 right-4 bg-orange-600 text-white p-2 rounded-2xl shadow-lg">
                        <Star size={14} fill="white" className="stroke-[3px]" />
                      </div>
                    )}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Content */}
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex justify-between items-start mb-2">
                       <h3 className="font-black text-slate-900 text-xl leading-snug truncate pr-2">
                        {item.name || item.nama}
                      </h3>
                      <p className="text-orange-600 font-black text-lg whitespace-nowrap">
                        {formatRupiah(item.price || item.harga || 0)}
                      </p>
                    </div>
                    
                    <p className="text-slate-400 text-xs font-medium mb-6 line-clamp-2">
                       Nikmati kelezatan {item.name || item.nama} yang diolah dengan resep autentik dan bumbu pilihan.
                    </p>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(item);
                      }}
                      className="mt-auto w-full py-4 rounded-[1.25rem] bg-slate-900 text-white font-black text-sm flex items-center justify-center gap-3 hover:bg-orange-600 transition-all shadow-lg active:scale-95"
                    >
                      <Plus size={18} className="stroke-[3px]" />
                      Tambah Pesanan
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </section>
      ))}
    </div>
  );
};

export default MenuList;
