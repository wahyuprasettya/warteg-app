# Firebase Setup

## 1. Aktifkan layanan

- Firebase Authentication
  - Enable `Email/Password`
- Cloud Firestore
  - Buat database mode production atau test sesuai kebutuhan

## 2. Isi environment

Copy `.env.example` menjadi `.env`, lalu isi:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
EXPO_PUBLIC_FIREBASE_APP_ID=1:1234567890:web:abcdef123456
```

## 3. Contoh config Firebase

File: `src/firebase/config.ts`

```ts
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? "",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
```

## 4. Contoh query Firestore

### Add

```ts
await addDoc(collection(db, "products"), {
  userId,
  businessType: "warteg",
  name: "Nasi putih",
  price: 6000,
  category: "Nasi",
  isActive: true,
  createdAt: new Date().toISOString(),
});
```

### Get

```ts
const productsQuery = query(
  collection(db, "products"),
  where("userId", "==", userId),
);

const snapshot = await getDocs(productsQuery);
const products = snapshot.docs.map((item) => ({
  id: item.id,
  ...item.data(),
}));
```

### Update

```ts
await updateDoc(doc(db, "products", productId), {
  price: 7000,
  updatedAt: new Date().toISOString(),
});
```

## 5. File referensi

- `src/services/firestoreService.ts`
- `src/services/firestoreExamples.ts`
- `firestore.rules`

## 6. Firestore Rules

Jika muncul error seperti:

```txt
FirebaseError: [code=permission-denied]: Missing or insufficient permissions.
```

berarti rules Firestore di project Firebase belum mengizinkan koleksi yang dipakai aplikasi, termasuk koleksi baru `closings`.

Gunakan rules dari file [firestore.rules](./firestore.rules) ini di Firebase Console atau deploy dengan Firebase CLI.

Intinya, rules tersebut mengizinkan:

- user hanya membaca dan mengubah dokumennya sendiri di `users`
- user hanya membaca dan mengubah data miliknya sendiri di `products`
- user hanya membaca dan mengubah data miliknya sendiri di `transactions`
- user hanya membaca dan mengubah data miliknya sendiri di `closings`
