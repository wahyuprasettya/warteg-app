import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { Alert, FlatList, Pressable, Text, useWindowDimensions, View, TextInput, KeyboardAvoidingView, Platform, ScrollView, Modal } from "react-native";
import { Armchair } from "lucide-react-native";

import { CategoryPill } from "@/components/CategoryPill";
import { ProductCard } from "@/components/ProductCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SearchBar } from "@/components/SearchBar";
import { allDummyProducts } from "@/data/dummy";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import {
  seedDummyProducts,
  subscribeProducts,
  subscribeOrders,
  subscribeTables,
  getTableStatus,
} from "@/services/firestoreService";
import { AppStackParamList, OrderRecord, Product } from "@/types";
import { formatIDR } from "@/utils/currency";
import { resolveStoreUserId } from "@/utils/store";

type Props = NativeStackScreenProps<AppStackParamList, "POS">;

export const POSScreen = ({ navigation, route }: Props) => {
  const { authUser, profile } = useAuth();
  const { addToCart, items, total, setActiveTable, updateQty } = useCart();
  const { width } = useWindowDimensions();
  const [products, setProducts] = useState<Product[]>([]);
  const [activeOrders, setActiveOrders] = useState<OrderRecord[]>([]);
  const [registeredTables, setRegisteredTables] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Semua");
  const [isSelectingTable, setIsSelectingTable] = useState(!route.params?.tableNumber);
  const [manualTable, setManualTable] = useState("");
  const storeUserId = resolveStoreUserId(authUser?.uid, profile);

  const categoryIcons: Record<string, string> = {
    Semua: "🌈",
    Makanan: "🍛",
    Minuman: "🥤",
    Lauk: "🍗",
    Sayur: "🥦",
    Nasi: "🍚",
    Paket: "🍱",
    Snack: "🍪",
    Sembako: "📦",
    "Kebutuhan Rumah": "🧼",
  };

  useEffect(() => {
    setActiveTable(route.params?.tableNumber);

    if (!authUser || !storeUserId) {
      setProducts(allDummyProducts);
      return;
    }

    seedDummyProducts(storeUserId).catch(() => null);

    const unsubscribeProducts = subscribeProducts(storeUserId, setProducts);
    const unsubscribeOrders = subscribeOrders(storeUserId, (orders) => {
      setActiveOrders(orders.filter(o => o.status !== 'done'));
    });
    const unsubscribeTables = subscribeTables(storeUserId, setRegisteredTables);

    return () => {
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeTables();
    };
  }, [authUser, route.params?.tableNumber, storeUserId, setActiveTable]);

  const activeProducts = products.filter((product) => product.isActive !== false);

  const categories = ["Semua", ...new Set(activeProducts.map((p) => p.category))];

  const filteredProducts = activeProducts.filter((p) => {
    const sameCategory = category === "Semua" || p.category === category;
    const sameKeyword = p.name.toLowerCase().includes(search.toLowerCase());
    return sameCategory && sameKeyword;
  });

  const cartQtyByProductId = items.reduce<Record<string, number>>((acc, item) => {
    acc[item.id] = item.qty;
    return acc;
  }, {});

  const handleConfirmTable = () => {
    if (!authUser || !storeUserId) return;
    if (!manualTable.trim()) {
      Alert.alert("Error", "Pilih meja.");
      return;
    }

    const isRegistered = registeredTables.includes(manualTable);
    const isBusy = activeOrders.some(o => (o.tableId === manualTable || o.tableNumber === manualTable));

    if (!isRegistered) {
      Alert.alert("Meja Tidak Terdaftar", `Meja ${manualTable} belum ada di sistem.`);
      return;
    }

    if (isBusy) {
      Alert.alert("Meja Terisi", `Meja ${manualTable} sedang ada transaksi aktif.`);
      return;
    }

    getTableStatus(storeUserId, manualTable).then(status => {
      if (status.tableIsBooking) {
        Alert.alert("Meja Booking", `Meja ${manualTable} sedang di-booking.`);
        return;
      }
      setActiveTable(manualTable);
      setIsSelectingTable(false);
    });
  };

  const handleTakeaway = () => {
    setManualTable("Bungkus");
    setActiveTable("Bungkus");
    setIsSelectingTable(false);
  };

  const handleAdd = (product: Product) => {
    addToCart(product);
  };

  const handleDecrease = (product: Product) => {
    const item = items.find((i) => i.id === product.id);
    if (item) {
      updateQty(product.id, item.qty - 1);
    }
  };

  const numColumns = width > 700 ? 3 : 2;

  return (
    <ScreenContainer>
      {/* Table Selector Modal Overlay */}
      <Modal
        visible={isSelectingTable}
        transparent
        animationType="fade"
        onRequestClose={() => setIsSelectingTable(false)}
      >
        <View 
          style={{ 
            flex: 1, 
            backgroundColor: "rgba(0,0,0,0.85)", 
            justifyContent: "center",
            paddingHorizontal: 25
          }}
        >
          <View 
            style={{ 
              backgroundColor: "#FFFFFF", 
              borderRadius: 30, 
              padding: 25,
              width: '100%',
              elevation: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 15,
            }}
          >
            <View style={{ alignItems: "center", marginBottom: 20 }}>
              <View style={{ height: 60, width: 60, backgroundColor: "#f2e4d1", borderRadius: 22, alignItems: "center", justifyContent: "center", marginBottom: 15 }}>
                <Armchair size={32} color="#c17d3c" strokeWidth={2.5} />
              </View>
              <Text style={{ fontFamily: "Poppins-Bold", fontSize: 24, color: "#1a1a1a" }}>Pilih Meja</Text>
            </View>

            <Text style={{ fontFamily: "Poppins-Bold", fontSize: 11, color: "#c17d3c", letterSpacing: 1.5, textAlign: "center", marginBottom: 10 }}>NOMOR MEJA</Text>
            
            <TextInput
              style={{
                backgroundColor: "#FAF7F2",
                borderRadius: 20,
                height: 75,
                fontSize: 38,
                fontFamily: "Poppins-Bold",
                textAlign: "center",
                color: "#c17d3c",
                borderWidth: 2,
                borderColor: "#f2e4d1",
                marginBottom: 25
              }}
              placeholder="0"
              placeholderTextColor="#f2e4d1"
              value={manualTable}
              onChangeText={setManualTable}
              keyboardType="number-pad"
              onSubmitEditing={handleConfirmTable}
              returnKeyType="done"
              autoFocus
            />

            <View style={{ flexDirection: "row", width: '100%', justifyContent: 'space-between' }}>
              {/* Tombol Batal - Background Krem Lembut */}
              <View 
                style={{ 
                  width: '40%', 
                  backgroundColor: '#f5ede0', 
                  borderRadius: 15,
                  borderWidth: 1.5,
                  borderColor: 'rgba(193,125,60,0.1)' 
                }}
              >
                <Pressable
                  onPress={() => setIsSelectingTable(false)}
                  style={{
                    height: 55,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontFamily: "Poppins-Bold", color: "#c17d3c", fontSize: 13 }}>BATAL</Text>
                </Pressable>
              </View>

              {/* Tombol Pilih Meja - Background Cokelat Brand Solid */}
              <View 
                style={{ 
                  width: '55%', 
                  backgroundColor: '#c17d3c', 
                  borderRadius: 15, 
                  elevation: 5,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 5,
                }}
              >
                <Pressable
                  onPress={handleConfirmTable}
                  android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
                  style={{
                    height: 55,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ fontFamily: "Poppins-Bold", color: "#fff", fontSize: 13 }}>PILIH MEJA</Text>
                </Pressable>
              </View>
            </View>

            <View style={{ marginTop: 15, width: '100%', backgroundColor: '#f9f9f9', borderRadius: 15, borderStyle: 'dashed', borderWidth: 1.5, borderColor: '#ccc' }}>
              <Pressable
                onPress={handleTakeaway}
                style={{
                  height: 55,
                  alignItems: "center",
                  justifyContent: "center",
                  flexDirection: 'row'
                }}
              >
                <Text style={{ fontSize: 18, marginRight: 8 }}>🥡</Text>
                <Text style={{ fontFamily: "Poppins-Bold", color: "#666", fontSize: 13 }}>PESANAN BUNGKUS (TAKEAWAY)</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Header Area */}
      <View className="mb-6 flex-row items-center justify-between">
        <View className="flex-1">
          <Text style={{ fontFamily: "Poppins-Bold", fontSize: 10, color: "#c17d3c", letterSpacing: 3, marginBottom: 8, textTransform: 'uppercase' }}>Kasir Digital</Text>
          <View className="flex-row">
            <View className="bg-brand rounded-2xl px-5 py-2 shadow-sm shadow-brand/20">
              <Text style={{ fontFamily: "Poppins-Bold", fontSize: 18, color: "#fff" }}>
                🏠 Meja {route.params?.tableNumber || manualTable || '...'}
              </Text>
            </View>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
        <View style={{ flexDirection: 'row', gap: 12 }}>
          {/* Soft Modern Table Button */}
          <Pressable 
            onPress={() => setIsSelectingTable(true)}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: pressed ? "#fafafa" : "#fff",
              paddingHorizontal: 16,
              paddingVertical: 10,
              borderRadius: 100,
              borderWidth: 1.5,
              borderColor: "rgba(193,125,60,0.2)",
              shadowColor: "#c17d3c",
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 4,
            })}
          >
            <Armchair size={18} color="#c17d3c" strokeWidth={2.5} />
            <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 11, color: '#c17d3c', marginLeft: 8 }}>MEJA</Text>
          </Pressable>

        </View>
        </View>
      </View>

      <View className="mb-6">
        <SearchBar value={search} onChangeText={setSearch} placeholder="Cari sajian lezat..." />
      </View>

      <FlatList
        horizontal
        data={categories}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4, paddingBottom: 16 }}
        style={{ flexGrow: 0, marginBottom: 8 }}
        renderItem={({ item }) => (
          <CategoryPill
            label={item}
            icon={categoryIcons[item]}
            active={item === category}
            onPress={() => setCategory(item)}
          />
        )}
      />

      <FlatList
        key={`list-${numColumns}`}
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="mt-20 items-center">
             <Text className="text-4xl mb-4">🍽️</Text>
             <Text className="font-poppins-bold text-brand-ink opacity-50 text-center px-10">Pesanan belum ditemukan di kategori ini.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View className="p-2" style={{ width: `${100 / numColumns}%` }}>
            <ProductCard
              product={item}
              onPress={handleAdd}
              onIncrease={handleAdd}
              onDecrease={handleDecrease}
              quantity={cartQtyByProductId[item.id] ?? 0}
            />
          </View>
        )}
        contentContainerStyle={{ paddingBottom: 160 }}
      />

      <View className="absolute bottom-0 left-0 right-0 p-6">
        {items.length > 0 ? (
          <Pressable 
            onPress={() => navigation.navigate("Cart")}
            className="flex-row items-center justify-between bg-brand-ink rounded-[32px] p-6 shadow-2xl overflow-hidden"
          >
            {/* Background Accent */}
            <View className="absolute right-0 top-0 bottom-0 w-24 bg-brand rounded-l-[40px] opacity-20" />
            
            <View className="flex-row items-center">
              <View className="h-14 w-14 bg-brand rounded-2xl items-center justify-center mr-4">
                <Text className="text-white font-poppins-bold text-lg">{items.length}</Text>
              </View>
              <View>
                <Text className="text-white/60 text-[10px] font-poppins-bold uppercase tracking-wider">Total Pesanan</Text>
                <Text className="text-white text-xl font-poppins-bold">{formatIDR(total)}</Text>
              </View>
            </View>
            <View className="h-14 w-14 bg-white/10 rounded-2xl items-center justify-center">
              <Text className="text-white text-xl">→</Text>
            </View>
          </Pressable>
        ) : (
          <View className="bg-white/80 rounded-full py-4 items-center">
            <Text className="text-brand-muted text-[10px] uppercase font-poppins-bold tracking-widest">Pilih menu untuk memulai</Text>
          </View>
        )}
      </View>
    </ScreenContainer>
  );
};
