"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ArrowLeft, Download, Printer, Plus, Trash2, Lock, User, LogOut, ShieldCheck, Mail, Key } from "lucide-react";
import Link from "next/link";
import { auth, db } from "@/lib/firebase";
import { 
  signInWithEmailAndPassword, 
  onAuthStateChanged, 
  signOut,
  createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

export default function TableManager() {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Login states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  
  // Table states
  const [tables, setTables] = useState(["1", "2", "3", "4", "5"]);
  const [newTable, setNewTable] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Fetch role from Firestore
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role); // 'owner' or 'kasir'
          } else {
            // Default to kasir if no role found
            setUserRole("kasir");
          }
        } catch (error) {
          console.error("Error fetching role:", error);
          setUserRole("kasir");
        }
      } else {
        setUser(null);
        setUserRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setBaseUrl(window.location.origin);
    }
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setLoginError("Email atau password salah.");
      console.error(error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
  };

  const addTable = () => {
    if (userRole !== "owner") {
      alert("Hanya Owner yang boleh menambah meja!");
      return;
    }
    if (newTable && !tables.includes(newTable)) {
      setTables([...tables, newTable].sort((a,b) => parseInt(a) - parseInt(b)));
      setNewTable("");
    }
  };

  const removeTable = (table) => {
    if (userRole !== "owner") {
      alert("Hanya Owner yang boleh menghapus meja!");
      return;
    }
    setTables(tables.filter((t) => t !== table));
  };

  const downloadQR = (tableId) => {
    const svg = document.getElementById(`qr-${tableId}`);
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR-Meja-${tableId}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  // LOGIN VIEW
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 p-10 border border-slate-100 animate-in zoom-in duration-500">
          <div className="flex flex-col items-center mb-10">
             <div className="bg-orange-600 p-4 rounded-3xl text-white shadow-xl shadow-orange-200 mb-6">
                <Lock size={32} strokeWidth={2.5} />
             </div>
             <h2 className="text-3xl font-black text-slate-900 tracking-tight">Admin Login</h2>
             <p className="text-slate-400 font-bold text-sm tracking-widest uppercase mt-2">Warteg Digital Setup</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="relative group">
               <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-colors" size={20} />
               <input 
                type="email" 
                placeholder="Email Address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border-3 border-transparent focus:border-orange-500/10 p-5 pl-16 rounded-2xl outline-none transition-all font-bold text-slate-900"
                required
               />
            </div>

            <div className="relative group">
               <Key className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-orange-600 transition-colors" size={20} />
               <input 
                type="password" 
                placeholder="Password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 border-3 border-transparent focus:border-orange-500/10 p-5 pl-16 rounded-2xl outline-none transition-all font-bold text-slate-900"
                required
               />
            </div>

            {loginError && <p className="text-red-500 text-sm font-bold text-center">{loginError}</p>}

            <button 
              type="submit"
              className="w-full bg-slate-900 text-white p-5 rounded-2xl font-black text-lg shadow-xl shadow-slate-200 hover:bg-orange-600 hover:-translate-y-1 transition-all active:scale-95"
            >
              Login Sekarang
            </button>
          </form>

          {/* Setup Helper (Demo Data) */}
          <div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-3">
             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Setup Meja Baru? (Demo Data)</p>
             <button 
               onClick={async () => {
                 try {
                   // Create Owner
                   const owner = await createUserWithEmailAndPassword(auth, "owner@warteg.id", "password123");
                   await setDoc(doc(db, "users", owner.user.uid), { role: "owner", email: "owner@warteg.id" });
                   
                   // Create Kasir
                   const kasir = await createUserWithEmailAndPassword(auth, "kasir@warteg.id", "password123");
                   await setDoc(doc(db, "users", kasir.user.uid), { role: "kasir", email: "kasir@warteg.id" });
                   
                   alert("Demo Users Berhasil Dibuat!\nOwner: owner@warteg.id\nKasir: kasir@warteg.id\nPassword: password123");
                 } catch (e) {
                   alert("Users mungkin sudah terdaftar atau terjadi error: " + e.message);
                 }
               }}
               className="text-xs font-black text-orange-600 bg-white border border-orange-100 p-3 rounded-xl hover:bg-orange-600 hover:text-white transition-all"
             >
                Buat Akun Demo (Owner & Kasir)
             </button>
          </div>
          
          <div className="mt-10 pt-6 border-t border-slate-50 text-center">
             <Link href="/" className="text-slate-400 hover:text-orange-600 font-bold text-sm transition-colors flex items-center justify-center gap-2">
                <ArrowLeft size={16} /> Kembali ke Menu Utama
             </Link>
          </div>
        </div>
      </div>
    );
  }

  // UNAUTHORIZED ROLE VIEW
  if (userRole === "kasir") {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 text-center">
             <div className="max-w-md">
                 <div className="bg-red-50 text-red-500 p-6 rounded-[3rem] border border-red-100 shadow-xl mb-8">
                    <User size={64} className="mx-auto mb-4 opacity-50" />
                    <h2 className="text-2xl font-black">Akses Terbatas</h2>
                    <p className="mt-2 font-bold opacity-70">Akun Anda adalah Kasir. Fitur Generate Meja hanya untuk Owner.</p>
                 </div>
                 <div className="flex gap-4">
                    <Link href="/" className="flex-1 bg-white border-2 border-slate-100 p-5 rounded-2xl font-black text-slate-600 hover:bg-slate-50 transition-all">Back Home</Link>
                    <button onClick={handleLogout} className="flex-1 bg-slate-900 text-white p-5 rounded-2xl font-black">Logout</button>
                 </div>
             </div>
        </div>
    );
  }

  // AUTHORIZED OWNER VIEW
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12 mb-20 selection:bg-orange-100">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-12">
            <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-orange-600 transition-colors font-bold text-sm">
            <ArrowLeft size={18} /> BACK HOME
            </Link>

            <div className="flex items-center gap-4 bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
                <div className="bg-green-50 text-green-600 p-2 rounded-xl">
                   <ShieldCheck size={20} />
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black uppercase text-slate-400 leading-none mb-1">Owner Access</p>
                    <p className="text-sm font-black text-slate-900 leading-none">{user.email}</p>
                </div>
                <button onClick={handleLogout} className="ml-4 p-2 text-slate-300 hover:text-red-500 transition-colors">
                    <LogOut size={20} />
                </button>
            </div>
        </div>
        
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16 bg-white p-10 rounded-[3rem] border border-slate-50 shadow-xl shadow-slate-200/40 relative overflow-hidden">
          <div className="relative z-10">
            <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none mb-4">Table <span className="text-orange-600">Setup</span></h1>
            <p className="text-slate-400 font-bold max-w-sm">Siapkan barcode unik untuk setiap meja pelanggan Anda secara instan.</p>
          </div>
          
          <div className="flex gap-4 relative z-10 w-full md:w-auto">
            <div className="relative flex-1 md:flex-none">
                <input 
                    type="number" 
                    placeholder="No. Meja"
                    value={newTable}
                    onChange={(e) => setNewTable(e.target.value)}
                    className="bg-slate-50 border-3 border-transparent focus:border-orange-500/10 rounded-2xl px-6 py-5 w-full md:w-36 focus:bg-white outline-none transition-all font-black text-xl text-slate-900"
                />
            </div>
            <button 
              onClick={addTable}
              className="bg-slate-900 text-white px-8 py-5 rounded-2xl font-black text-lg hover:bg-orange-600 hover:-translate-y-1 transition-all shadow-xl shadow-slate-200 active:scale-95 flex items-center gap-3"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          </div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2 -z-0"></div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {tables.map((table) => {
            const qrUrl = `${baseUrl}/menu?table=${table}`;
            return (
              <div key={table} className="bg-white p-8 rounded-[3.5rem] border border-slate-50 shadow-sm hover:shadow-2xl hover:shadow-slate-200 transition-all group overflow-hidden relative">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Meja #{table}</h3>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        <p className="text-slate-300 text-[10px] font-black uppercase tracking-widest">Active QR CODE</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeTable(table)}
                    className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                  >
                    <Trash2 size={20} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2.5rem] flex items-center justify-center mb-8 border-2 border-dashed border-slate-100 group-hover:border-orange-200 group-hover:bg-white transition-all duration-500">
                  <QRCodeSVG 
                    id={`qr-${table}`}
                    value={qrUrl}
                    size={180}
                    level="H"
                    includeMargin={true}
                    fgColor="#0f172a"
                  />
                </div>

                <div className="flex gap-3">
                   <button 
                    onClick={() => downloadQR(table)}
                    className="flex-1 bg-white border-3 border-slate-50 text-slate-900 py-4 rounded-2xl font-black text-sm hover:border-orange-600 hover:text-orange-600 hover:-translate-y-1 shadow-sm transition-all flex items-center justify-center gap-3"
                   >
                     <Download size={20} className="stroke-[2.5px]" /> Get Link
                   </button>
                   <button 
                    onClick={() => window.print()}
                    className="p-4 bg-slate-50 text-slate-300 rounded-2xl hover:bg-slate-900 hover:text-white transition-all"
                   >
                     <Printer size={20} />
                   </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-20 p-10 bg-orange-600 rounded-[3rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-orange-200">
             <div className="text-center md:text-left">
                <h3 className="text-3xl font-black">Butuh Bantuan?</h3>
                <p className="font-bold opacity-80 max-w-sm mt-2">Hubungi Tim IT Warteg Digital jika Anda mengalami kendala pada sistem barcode.</p>
             </div>
             <button className="bg-white text-orange-600 px-10 py-5 rounded-2xl font-black text-lg shadow-xl hover:scale-105 transition-transform active:scale-95">Hubungi Support</button>
        </div>
      </div>
    </div>
  );
}
