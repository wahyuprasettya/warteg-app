# Aplikasi Menu Restoran QR Code (Next.js + Firebase)

Aplikasi ini memungkinkan pelanggan untuk memindai kode QR di meja, melihat menu secara real-time, dan melakukan pesanan langsung ke dapur melalui Firestore.

## 🚀 Fitur Utama
1. **Menu Real-time**: Menggunakan `onSnapshot` dari Firebase untuk pembaruan menu instan.
2. **Shopping Cart**: Kelola item pesanan dengan UI mobile-first yang intuitif.
3. **Dynamic Table Number**: Mendeteksi nomor meja dari parameter URL (misal: `/menu?table=10`).
4. **Checkout flow**: Pesanan disimpan ke koleksi `orders` dengan status `pending`.
5. **Modern UI**: Menggunakan Tailwind CSS, Lucide icons, dan animasi premium.

## 📂 Struktur Folder
- `src/app/menu/page.jsx`: Halaman utama menu & logika checkout.
- `src/components/MenuList.jsx`: Komponen daftar menu terbagi per kategori.
- `src/components/Cart.jsx`: Komponen keranjang (floating bar & slide-up tray).
- `src/lib/firebase.js`: Konfigurasi koneksi SDK Firebase.
- `src/utils/formatRupiah.js`: Utilitas format mata uang IDR.

## 🛠️ Langkah Menjalankan
1. **Buka folder backend**: `cd backend`
2. **Instal dependensi**: `npm install`
3. **Jalankan aplikasi**: `npm run dev`
4. **Buka di Browser**: `http://localhost:3000/menu?table=10`

## 📊 Firestore Setup
### Collections:
1. **`menu`**:
   - `name` (string)
   - `price` (number)
   - `category` (string)
   - `image` (string/url)
2. **`orders`**:
   - `tableNumber` (string)
   - `items` (array of objects context: `{name, price, qty, subtotal}`)
   - `total` (number)
   - `status` (string: "pending")
   - `createdAt` (timestamp)

> [!TIP]
> Anda bisa menggunakan fungsi di `src/utils/seedData.js` untuk mengisi data awal ke Firestore.

---
**Status:** Siap dijalankan (Built with Next.js App Router)
