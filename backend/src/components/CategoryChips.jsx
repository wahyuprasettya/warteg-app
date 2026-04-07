"use client";

import React, { useRef, useEffect } from "react";
import { Utensils, Coffee, Pizza, Soup, Star, Sparkles } from "lucide-react";

const CategoryIcon = ({ name }) => {
  const n = name.toLowerCase();
  if (n.includes("minuman") || n.includes("haus") || n.includes("drink")) return <Coffee size={16} />;
  if (n.includes("nasi") || n.includes("makan") || n.includes("food")) return <Utensils size={16} />;
  if (n.includes("snack") || n.includes("cemilan") || n.includes("goreng")) return <Pizza size={16} />;
  return <Soup size={16} />;
};

const CategoryChips = ({ categories, activeCategory, onSelect }) => {
  const scrollRef = useRef(null);

  useEffect(() => {
    const activeEl = scrollRef.current?.querySelector(`[data-active="true"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [activeCategory]);

  return (
    <div className="sticky top-[96px] bg-white/80 backdrop-blur-xl z-30 py-6 px-4 -mx-4 border-b border-slate-50 overflow-hidden shadow-[0_15px_30px_rgba(0,0,0,0.02)]">
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth px-4"
      >
        <button
          onClick={() => onSelect(null)}
          data-active={!activeCategory}
          className={`flex-shrink-0 px-8 py-3.5 rounded-[1.25rem] text-sm font-black transition-all flex items-center gap-3 border-2 ${
            !activeCategory 
              ? "bg-slate-900 border-slate-900 text-white shadow-[0_10px_30px_rgba(15,23,42,0.3)] scale-105" 
              : "bg-slate-50 border-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          <Sparkles size={16} />
          Semua
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            data-active={activeCategory === cat}
            onClick={() => onSelect(cat)}
            className={`flex-shrink-0 px-8 py-3.5 rounded-[1.25rem] text-sm font-black transition-all flex items-center gap-3 border-2 ${
              activeCategory === cat
                ? "bg-orange-600 border-orange-600 text-white shadow-[0_10px_30px_rgba(234,88,12,0.3)] scale-105"
                : "bg-slate-50 border-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <CategoryIcon name={cat} />
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryChips;
