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
# warteg-app
