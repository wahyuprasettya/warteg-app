import { Product, RestaurantTable } from "@/types";

const createProduct = (
  id: string,
  name: string,
  price: number,
  category: string,
  image?: string,
  stock?: number,
): Product => ({
  id,
  userId: "demo-user",
  name,
  price,
  category,
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
    "https://images.unsplash.com/photo-1516684732162-798a0062be99?q=80&w=200&h=200&auto=format&fit=crop",
  ),
  createProduct(
    "warteg-2",
    "Ayam goreng",
    14000,
    "Lauk",
    "https://images.unsplash.com/photo-1562967914-608f82629710?q=80&w=200&h=200&auto=format&fit=crop",
  ),
  createProduct(
    "warteg-3",
    "Telur balado",
    7000,
    "Lauk",
    "https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=200&h=200&auto=format&fit=crop",
  ),
  createProduct(
    "warteg-4",
    "Tempe orek",
    5000,
    "Lauk",
    "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=200&h=200&auto=format&fit=crop",
  ),
  createProduct(
    "warteg-5",
    "Sayur lodeh",
    6000,
    "Sayur",
    "https://images.unsplash.com/photo-1547928576-a4a33237ecd3?q=80&w=200&h=200&auto=format&fit=crop",
  ),
  createProduct(
    "warteg-6",
    "Es teh",
    5000,
    "Minuman",
    "https://images.unsplash.com/photo-1556679343-c7306c1976bc?q=80&w=200&h=200&auto=format&fit=crop",
  ),
  createProduct(
    "warteg-7",
    "Paket Hemat Ayam",
    22000,
    "Paket",
    "https://images.unsplash.com/photo-1562607344-55cc2a79255a?q=80&w=200&h=200&auto=format&fit=crop",
  ),
];

export const allDummyProducts: Product[] = [
  ...dummyWartegProducts,
];

export const dummyProductsByType = {
  warteg: dummyWartegProducts,
};

export const wartegCategories = ["Semua", "Nasi", "Lauk", "Sayur", "Minuman", "Paket"];

export const retailCategories = ["Semua", "Makanan", "Minuman", "Snack", "Sembako", "Kebutuhan Rumah"];

export const restaurantTables: RestaurantTable[] = Array.from({ length: 12 }, (_, index) => ({
  number: `Meja ${index + 1}`,
  status: index < 3 ? "terisi" : "kosong",
}));
