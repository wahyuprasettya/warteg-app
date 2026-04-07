"use client";

import React, { useState, useMemo } from "react";
import { formatRupiah } from "@/utils/formatRupiah";
import { X, Plus, Minus, Send, ShoppingBag, UtensilsCrossed, User, MessageSquare } from "lucide-react";

/**
 * Premium Cart with Name, Table, and Notes input.
 */
const Cart = ({ 
  cart, 
  onUpdateQty, 
  onRemove, 
  onCheckout, 
  tableNumber, 
  customerName, 
  setCustomerName,
  notes,
  setNotes
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  }, [cart]);

  if (cart.length === 0) return null;

  return (
    <>
      {/* Floating Summary Bar */}
      {!isOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 z-40">
          <button
            onClick={() => setIsOpen(true)}
            className="w-full bg-slate-900 text-white p-5 rounded-[2.5rem] shadow-[0_20px_60px_rgba(15,23,42,0.4)] flex items-center justify-between hover:scale-[1.03] transition-all active:scale-95 group"
          >
            <div className="flex items-center gap-4">
              <div className="bg-orange-600 p-3 rounded-2xl relative">
                <ShoppingBag size={24} className="stroke-[2.5px]" />
                <span className="absolute -top-2 -right-2 bg-white text-orange-600 text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white">
                  {cart.length}
                </span>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 leading-none mb-1.5">
                  Total Bayar
                </p>
                <p className="text-xl font-black leading-none tracking-tight">{formatRupiah(total)}</p>
              </div>
            </div>
            <div className="bg-white/10 px-4 py-2.5 rounded-2xl font-black text-xs flex items-center gap-2 group-hover:bg-white/20 transition-all uppercase tracking-widest">
               <span>Liat Pesanan</span>
               <Send size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </button>
        </div>
      )}

      {/* Full Sheet Interior */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-50 animate-in fade-in duration-500"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white z-[60] p-8 pb-10 rounded-t-[4rem] shadow-[0_-20px_100px_rgba(0,0,0,0.3)] max-w-2xl mx-auto max-h-[92vh] overflow-y-auto animate-in slide-in-from-bottom duration-700 flex flex-col no-scrollbar">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-10 border-b border-slate-50 pb-6 sticky top-0 bg-white/95 backdrop-blur-md z-10 -mx-8 px-8 pt-2">
               <div className="flex flex-col">
                  <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Ringkasan <span className="text-orange-600">Order</span></h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-300 mt-1">Review your meal choices</p>
               </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-4 hover:bg-slate-50 rounded-[1.5rem] text-slate-300 transition-all hover:text-red-500 hover:rotate-90"
              >
                <X size={28} strokeWidth={3} />
              </button>
            </div>

            {/* Combined Input Section */}
            <div className="space-y-4 mb-12">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] flex items-center gap-4 shadow-2xl">
                     <div className="bg-white/10 p-3 rounded-2xl">
                        <UtensilsCrossed size={20} className="text-orange-500" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 mb-1 leading-none">Meja Anda</p>
                        <p className="font-black text-xl leading-none">NOMOR #{tableNumber || "?"}</p>
                     </div>
                  </div>

                  <div className="relative group">
                     <User className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-all" size={24} />
                     <input
                       type="text"
                       required
                       value={customerName}
                       onChange={(e) => setCustomerName(e.target.value)}
                       placeholder="Nama Siapa?*"
                       className="w-full bg-slate-50 border-3 border-transparent focus:border-orange-500/10 focus:bg-white p-6 pl-16 rounded-[2.5rem] outline-none transition-all font-black text-lg text-slate-900 placeholder:text-slate-200"
                     />
                  </div>
               </div>

               {/* New Notes Field */}
               <div className="relative group overflow-hidden bg-slate-50 rounded-[2.5rem] hover:bg-white transition-all border-3 border-transparent focus-within:border-orange-500/20 focus-within:bg-white">
                  <div className="bg-white/50 p-4 px-6 flex items-center gap-3 border-b border-white">
                     <MessageSquare size={18} className="text-orange-600 stroke-[3px]" />
                     <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Punya Catatan Tambahan?</span>
                  </div>
                  <textarea
                    rows="2"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Gak pedas ya, Kerupuknya dibungus..."
                    className="w-full p-6 pt-4 bg-transparent outline-none font-bold text-slate-700 placeholder:text-slate-200 placeholder:italic resize-none"
                  />
               </div>
            </div>

            {/* List Header */}
            <div className="px-2 mb-8 flex justify-between items-center">
              <h3 className="text-xs font-black uppercase tracking-[0.4em] text-slate-300">Daftar Pesanan</h3>
              <div className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1 rounded-lg italic">Ready to cook!</div>
            </div>

            {/* Item List */}
            <div className="space-y-10 mb-16 flex-1">
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center group px-2 animate-in fade-in transition-all">
                  <div className="flex-1 pr-6">
                    <h4 className="font-black text-slate-900 text-xl leading-tight mb-1 group-hover:text-orange-600 transition-colors">
                      {item.name}
                    </h4>
                    <p className="text-slate-400 text-sm font-black opacity-30">
                      {formatRupiah(item.price)}
                    </p>
                  </div>
                  <div className="flex bg-slate-50 p-2 rounded-[2rem] border border-slate-100 items-center gap-5">
                    <button
                      onClick={() => item.qty > 1 ? onUpdateQty(item.id, -1) : onRemove(item.id)}
                      className="w-12 h-12 rounded-[1.25rem] bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-100 active:scale-90 transition-all shadow-sm"
                    >
                      <Minus size={22} strokeWidth={3} />
                    </button>
                    <span className="font-black text-slate-900 text-xl w-6 text-center tracking-tighter">
                      {item.qty}
                    </span>
                    <button
                      onClick={() => onUpdateQty(item.id, 1)}
                      className="w-12 h-12 rounded-[1.25rem] bg-slate-900 flex items-center justify-center text-white hover:bg-orange-600 active:scale-95 transition-all shadow-xl shadow-slate-100"
                    >
                      <Plus size={22} strokeWidth={3} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Final Summary Card */}
            <div className="border-t-3 border-dashed border-slate-50 pt-12 mt-auto sticky bottom-0 bg-white -mx-8 px-12 flex flex-col gap-10">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                   <span className="text-slate-300 font-black text-[10px] uppercase tracking-[0.3em] mb-3">Estimasi Total</span>
                   <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none">
                    {formatRupiah(total)}
                  </span>
                </div>
                <div className="text-right">
                   <p className="text-[10px] font-black uppercase text-slate-300 tracking-widest mb-2 italic">Cashless only available</p>
                   <div className="inline-flex items-center gap-2 bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100">
                      <span className="text-sm font-black text-slate-900">{cart.reduce((s, i) => s + i.qty, 0)} Porsi</span>
                   </div>
                </div>
              </div>
              
              <button
                disabled={!customerName.trim()}
                onClick={onCheckout}
                className="w-full bg-orange-600 text-white font-black h-24 rounded-[2.5rem] shadow-[0_30px_70px_rgba(234,88,12,0.4)] flex items-center justify-center gap-6 hover:bg-orange-700 hover:-translate-y-2 transition-all active:scale-95 text-xl disabled:bg-slate-100 disabled:shadow-none disabled:translate-y-0 disabled:text-slate-300 group/btn"
              >
                {!customerName.trim() ? (
                   <span className="uppercase tracking-[0.3em] text-xs font-black">Isi Nama Pemesan untuk Check out</span>
                ) : (
                  <>
                    <div className="bg-white/20 p-3.5 rounded-2xl group-hover/btn:rotate-12 transition-transform">
                       <Send size={24} className="stroke-[3.5px]" />
                    </div>
                    Kirim Pesanan Sekarang
                  </>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Cart;
