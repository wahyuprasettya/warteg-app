# Warteg POS

Starter kit aplikasi kasir serbaguna untuk:

- Warung
- Warteg
- Restoran
- Toko retail

Tech stack:

- Expo + React Native
- TypeScript
- Firebase Authentication + Firestore
- NativeWind

## Jalankan aplikasi

1. Install dependency:

```bash
npm install
```

2. Copy env:

```bash
cp .env.example .env
```

3. Isi Firebase config pada `.env`

4. Jalankan Expo:

```bash
npm run start
```

Kalau mode `LAN` sulit tersambung ke Expo Go, pakai:

```bash
npm run start:lan
```

Kalau tetap gagal, coba:

```bash
npm run start:tunnel
```

Kalau bundle lama masih nyangkut, bersihkan cache dulu:

```bash
npm run start:clear
```

5. Untuk perangkat:

```bash
npm run android
npm run ios
```

## Flow aplikasi

1. Login atau register
2. Jika `businessType` belum ada, user masuk ke `SetupBusinessScreen`
3. App akan menampilkan UI berdasarkan `businessType`
4. Semua transaksi, produk, dan profil user tersimpan di Firestore

## Struktur folder

```text
src
  components
  constants
  data
  firebase
  hooks
  navigation
  screens
  services
  types
  utils
```

## Firestore schema

```text
users/{userId}
  email
  businessType
  createdAt

products/{productId}
  userId
  businessType
  name
  price
  category
  stock
  isActive
  createdAt

transactions/{transactionId}
  userId
  items
  total
  paymentMethod
  paymentStatus
  businessType
  tableNumber
  note
  createdAt
```

## Catatan

- `FIREBASE_SETUP.md` berisi langkah setup Firebase dan contoh query
- `src/firebase/config.ts` berisi contoh config Firebase
- `src/services/firestoreExamples.ts` berisi contoh query `get/add/update`
- `src/data/dummy.ts` berisi dummy data Warteg dan Warung

## Troubleshooting Expo Go

Kalau `LAN` tidak bisa dibuka di Expo Go tetapi `tunnel` bisa, biasanya masalahnya ada di jaringan lokal, bukan di kode. Coba:

1. Pastikan HP dan laptop benar-benar satu Wi-Fi
2. Matikan VPN di HP dan laptop
3. Izinkan Node/Expo di firewall
4. Restart Expo dengan cache bersih
5. Pakai `tunnel` kalau sedang pindah-pindah jaringan
# warteg-app
