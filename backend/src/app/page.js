import Link from "next/link";
import { QrCode, Utensils, ArrowRight, Settings, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-orange-600 flex flex-col items-center justify-center p-6 text-white text-center selection:bg-white selection:text-orange-600">
      <div className="bg-white p-10 rounded-[48px] shadow-2xl mb-12 animate-in zoom-in duration-700 relative group transition-transform hover:scale-[1.02]">
        <div className="bg-orange-50 border-4 border-orange-100 p-8 rounded-[36px] mb-8 relative">
           <div className="absolute -top-4 -right-4 bg-orange-600 text-white p-3 rounded-2xl shadow-lg ring-4 ring-white animate-bounce-slow">
             <Sparkles size={24} />
           </div>
          <QrCode size={140} className="text-orange-600" />
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Warteg<span className="text-orange-600">Digital</span>
          </h1>
          <div className="flex items-center justify-center gap-1.5 bg-gray-50 py-1.5 px-4 rounded-full w-max mx-auto">
             <span className="h-1.5 w-1.5 bg-green-500 rounded-full" />
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest uppercase mt-0.5">Ready to Order</p>
          </div>
        </div>
      </div>

      <div className="max-w-sm w-full space-y-6">
        <div className="space-y-3">
          <h2 className="text-3xl font-black">Pesan Lebih Mudah</h2>
          <p className="opacity-80 text-sm leading-relaxed font-medium">
            Scan QR di meja, pilih menu favoritmu, dan pesan langsung tanpa perlu antre ke kasir.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <Link
            href="/menu?table=12"
            className="flex items-center justify-between bg-white text-orange-600 p-6 rounded-[28px] font-black text-xl shadow-[0_15px_40px_rgba(0,0,0,0.15)] hover:bg-orange-50 active:scale-95 transition-all w-full group"
          >
            <span>Buka Menu (Demo #12)</span>
            <div className="bg-orange-600 text-white p-2 rounded-xl group-hover:px-4 transition-all">
               <ArrowRight />
            </div>
          </Link>

          <Link
            href="/admin/tables"
            className="flex items-center justify-center gap-3 text-white/60 p-4 rounded-2xl font-black text-sm hover:text-white hover:bg-white/10 transition-all w-full group"
          >
            <Settings size={18} className="group-hover:rotate-90 transition-transform" />
            <span>Setup QR Meja (Admin Tool)</span>
          </Link>
        </div>

        <div className="pt-8 opacity-40">
           <p className="text-[9px] uppercase font-black tracking-[0.4em]">Made By Wahyu Adjie Prasetyo</p>
        </div>
      </div>
    </div>
  );
}
