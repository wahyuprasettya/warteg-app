import { BusinessType, Product, RestaurantTable } from "@/types";

const createProduct = (
  id: string,
  name: string,
  price: number,
  category: string,
  businessType: BusinessType,
  image?: string,
  stock?: number,
): Product => ({
  id,
  userId: "demo-user",
  name,
  price,
  category,
  businessType,
  image,
  stock,
  isActive: true,
});

export const dummyWartegProducts: Product[] = [
  createProduct(
    "warteg-1",
    "Nasi putih",
    6000,
    "Nasi",
    "warteg",
    "https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=200&h=200&auto=format&fit=crop",
  ),
  createProduct(
    "warteg-2",
    "Ayam goreng",
    14000,
    "Lauk",
    "warteg",
    "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=200&h=200&auto=format&fit=crop",
  ),
  createProduct(
    "warteg-3",
    "Telur balado",
    7000,
    "Lauk",
    "warteg",
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=200&h=200&auto=format&fit=crop",
  ),
  createProduct(
    "warteg-4",
    "Tempe orek",
    5000,
    "Lauk",
    "warteg",
    "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=200&h=200&auto=format&fit=crop",
  ),
  createProduct(
    "warteg-5",
    "Sayur lodeh",
    6000,
    "Sayur",
    "warteg",
    "https://images.unsplash.com/photo-1547928576-a4a33237ecd3?q=80&w=200&h=200&auto=format&fit=crop",
  ),
  createProduct(
    "warteg-6",
    "Es teh",
    5000,
    "Minuman",
    "warteg",
    "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=200&h=200&auto=format&fit=crop",
  ),
  createProduct(
    "warteg-7",
    "Paket Hemat Ayam",
    22000,
    "Paket",
    "warteg",
    "https://images.unsplash.com/photo-1562607344-55cc2a79255a?q=80&w=200&h=200&auto=format&fit=crop",
  ),
];

export const dummyWarungProducts: Product[] = [
  createProduct(
    "warung-1",
    "Indomie",
    4000,
    "Makanan",
    "warung",
    "https://images.unsplash.com/photo-1612927601601-6638404737ce?q=80&w=200&h=200&auto=format&fit=crop",
    40,
  ),
  createProduct(
    "warung-2",
    "Aqua",
    3000,
    "Minuman",
    "warung",
    "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=200&h=200&auto=format&fit=crop",
    30,
  ),
  createProduct(
    "warung-3",
    "Snack",
    2500,
    "Snack",
    "warung",
    "https://images.unsplash.com/photo-1600492523910-bc2973167b5e?q=80&w=200&h=200&auto=format&fit=crop",
    50,
  ),
];

export const dummyRetailProducts: Product[] = [
  createProduct(
    "toko-1",
    "Sabun Mandi",
    6500,
    "Kebutuhan Rumah",
    "toko",
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=200&h=200&auto=format&fit=crop",
    25,
  ),
  createProduct(
    "toko-2",
    "Kopi Sachet",
    2500,
    "Minuman",
    "toko",
    "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?q=80&w=200&h=200&auto=format&fit=crop",
    60,
  ),
  createProduct(
    "toko-3",
    "Beras 5kg",
    76000,
    "Sembako",
    "toko",
    "https://images.unsplash.com/photo-1586201327693-86317b3eb277?q=80&w=200&h=200&auto=format&fit=crop",
    10,
  ),
];

export const dummyRestaurantProducts: Product[] = [
  createProduct(
    "resto-1",
    "Nasi Goreng",
    22000,
    "Makanan",
    "restoran",
    "https://images.unsplash.com/photo-1603133872878-684f208fb84b?q=80&w=200&h=200&auto=format&fit=crop",
  ),
  createProduct(
    "resto-2",
    "Mie Ayam",
    18000,
    "Makanan",
    "restoran",
    "https://images.unsplash.com/photo-1552611052-33e04de081de?q=80&w=200&h=200&auto=format&fit=crop",
  ),
  createProduct(
    "resto-3",
    "Es Jeruk",
    8000,
    "Minuman",
    "restoran",
    "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=200&h=200&auto=format&fit=crop",
  ),
  createProduct(
    "resto-4",
    "Teh Panas",
    5000,
    "Minuman",
    "restoran",
    "https://images.unsplash.com/photo-1544787210-2213d2426511?q=80&w=200&h=200&auto=format&fit=crop",
  ),
];

export const dummyProductsByType: Record<BusinessType, Product[]> = {
  warung: dummyWarungProducts,
  warteg: dummyWartegProducts,
  restoran: dummyRestaurantProducts,
  toko: dummyRetailProducts,
};

export const wartegCategories = ["Semua", "Nasi", "Lauk", "Sayur", "Minuman", "Paket"];

export const retailCategories = ["Semua", "Makanan", "Minuman", "Snack", "Sembako", "Kebutuhan Rumah"];

export const restaurantTables: RestaurantTable[] = Array.from({ length: 12 }, (_, index) => ({
  number: `Meja ${index + 1}`,
  status: index < 3 ? "terisi" : "kosong",
}));
