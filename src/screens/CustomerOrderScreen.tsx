import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  FlatList,
  Text,
  View,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
} from "react-native";

import { ScreenContainer } from "@/components/ScreenContainer";
import { AppButton } from "@/components/AppButton";
import { getDb } from "@/firebase/config";
import { AppStackParamList, CartItem, OrderRecord, Product } from "@/types";
import { formatIDR } from "@/utils/currency";
import {
  collection,
  onSnapshot,
  or,
  query,
  where,
} from "firebase/firestore";
import { subscribeTableStatus, addOrder, subscribeTables } from "@/services/firestoreService";

type Props = NativeStackScreenProps<AppStackParamList, "CustomerOrder">;
export const CustomerOrderScreen = ({ navigation, route }: Props) => {
  const { tableId, ownerId: routeOwnerId } = route.params || { tableId: "1" };
  // Fallback to routeOwnerId or "public" if not provided
  const targetOwnerId = routeOwnerId || "public";
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [tableStatus, setTableStatus] = useState({ tableIsBooking: false });
  const [registeredTables, setRegisteredTables] = useState<string[] | null>(null);

  // Listen to table status (Booking check)
  useEffect(() => {
    if (!targetOwnerId || !tableId) return;
    const unsubStatus = subscribeTableStatus(targetOwnerId, tableId, (status) => {
       setTableStatus(status);
    });
    
    // Check if table is registered in Master Table List
    const unsubTables = subscribeTables(targetOwnerId, (list) => {
       setRegisteredTables(list);
    });

    return () => {
      unsubStatus();
      unsubTables();
    };
  }, [targetOwnerId, tableId]);

  // Load menu directly — no auth required for customers
  useEffect(() => {
    // Filter menu by ownerId so customers see the right restaurant's menu
    const productsQuery = targetOwnerId && targetOwnerId !== 'public'
      ? query(
          collection(getDb(), "menu"),
          or(
            where("userId", "==", targetOwnerId),
            where("uid", "==", targetOwnerId),
          ),
        )
      : query(collection(getDb(), "menu"));

    const unsubscribe = onSnapshot(
      productsQuery,
      (snapshot) => {
        const items = snapshot.docs
          .map((d) => ({
            id: d.id,
            ...(d.data() as Omit<Product, "id">),
            price: d.data().price || 0,
            name: d.data().name || "Menu",
          }))
          .filter((item) => item.isActive !== false) as Product[];
        setProducts(items);
        setIsLoadingProducts(false);
      },
      () => {
        setIsLoadingProducts(false);
      }
    );
    return unsubscribe;
  }, []);

  const addToCart = (product: Product) => {
    setCart((prev) => {
      const exist = prev.find((item) => item.id === product.id);
      if (exist) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          category: product.category,
          qty: 1,
          stock: product.stock,
        },
      ];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.id === productId ? { ...item, qty: item.qty - 1 } : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) {
      Alert.alert("Keranjang Kosong", "Silakan pilih menu terlebih dahulu.");
      return;
    }

    try {
      setIsSubmitting(true);

      // VALIDASI: Pastikan targetOwnerId ada (ID Restoran)
      if (!targetOwnerId || targetOwnerId === "public") {
        Alert.alert(
          "QR Code Tidak Valid",
          "Halaman ini tidak terhubung ke restoran manapun. Silakan scan ulang QR Code yang benar."
        );
        setIsSubmitting(false);
        return;
      }

      // Save order without requiring login
      const newOrder: Omit<OrderRecord, "id"> = {
        userId: targetOwnerId, // Link order to the restaurant owner so it shows in their app
        uid: targetOwnerId,    // Consistency with newer query versions
        tableId,
        tableNumber: tableId,
        items: cart,
        total: cartTotal,
        status: "pending",
        paymentStatus: "pending",
        customerName: customerName.trim() || "Tamu",
        notes: notes.trim(),
        orderFromTable: true,
        orderSource: "web",
        createdAt: new Date().toISOString(),
      };

      await addOrder(newOrder);

      // Reset and show success state
      setCart([]);
      setCustomerName("");
      setNotes("");
      setOrderSuccess(true);
    } catch (error) {
      console.error("Order Submit Error:", error);
      Alert.alert("Gagal", "Gagal membuat pesanan ke server. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (registeredTables !== null && !registeredTables.includes(tableId)) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-6xl mb-6">⚠️</Text>
          <Text className="text-2xl font-poppins-bold text-brand-ink text-center mb-3">
             Meja Belum Terdaftar
          </Text>
          <Text className="text-center font-poppins text-brand-muted mb-8">
             Nomor meja <Text className="font-poppins-bold text-brand">{tableId}</Text> belum didaftarkan oleh restoran ini. Silakan hubungi staf kami.
          </Text>
          {navigation.canGoBack() && (
            <AppButton label="Kembali" onPress={() => navigation.goBack()} />
          )}
        </View>
      </ScreenContainer>
    );
  }

  if (tableStatus.tableIsBooking) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-6xl mb-6">🗓️</Text>
          <Text className="text-2xl font-poppins-bold text-brand-ink text-center mb-3">
             Meja Sudah Terisi
          </Text>
          <Text className="text-center font-poppins text-brand-muted mb-8">
             Mohon maaf, meja ini sedang dalam status <Text className="text-brand-bold italic">Booking</Text> atau sudah digunakan oleh pelanggan lain.
          </Text>
          <Text className="text-center font-poppins text-xs text-brand-soft">
             Silakan hubungi kasir atau staf kami untuk informasi lebih lanjut.
          </Text>
        </View>
      </ScreenContainer>
    );
  }

  // Success screen after order placed
  if (orderSuccess) {
    return (
      <ScreenContainer>
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-6xl mb-6">🎉</Text>
          <Text className="text-2xl font-poppins-bold text-brand-ink text-center mb-3">
            Pesanan Berhasil!
          </Text>
          <Text className="text-center font-poppins text-brand-muted mb-2">
            Pesanan untuk <Text className="font-poppins-bold text-brand-ink">Meja {tableId}</Text> sudah kami terima.
          </Text>
          <Text className="text-center font-poppins text-brand-muted mb-8">
            Mohon tunggu, kasir akan segera memproses pesanan Anda.
          </Text>
          <View className="w-full rounded-[24px] bg-white border border-brand/10 p-5 mb-6">
            <Text className="font-poppins-bold text-brand-ink mb-3">Ringkasan Pesanan</Text>
            {cart.length === 0 && (
              // Show summary from last order stored in state before reset (already reset)
              <Text className="font-poppins text-brand-muted text-sm">Pesanan telah dikirim ke kasir.</Text>
            )}
            <View className="flex-row justify-between mt-2 pt-2 border-t border-brand/5">
              <Text className="font-poppins-bold text-brand-muted">Total</Text>
              <Text className="font-poppins-bold text-brand">{formatIDR(cartTotal)}</Text>
            </View>
          </View>
          <AppButton
            label="✅ Pesan Lagi"
            onPress={() => setOrderSuccess(false)}
          />
        </View>
      </ScreenContainer>
    );
  }

  const renderProduct = ({ item }: { item: Product }) => {
    const qty = cart.find((c) => c.id === item.id)?.qty || 0;

    return (
      <View className="mb-4 flex-row items-center justify-between rounded-[24px] border border-brand/5 bg-white p-4 shadow-sm">
        <View className="flex-1 pr-4">
          <Text className="text-base font-poppins-bold text-brand-ink">{item.name}</Text>
          <Text className="text-sm font-poppins-semibold text-brand">{formatIDR(item.price)}</Text>
          {item.category ? (
            <Text className="text-xs font-poppins text-brand-muted mt-0.5">{item.category}</Text>
          ) : null}
        </View>
        <View className="flex-row items-center">
          {qty > 0 && (
            <>
              <Pressable
                onPress={() => removeFromCart(item.id)}
                className="h-10 w-10 items-center justify-center rounded-full bg-brand-soft"
              >
                <Text className="font-poppins-bold text-lg text-brand">-</Text>
              </Pressable>
              <Text className="mx-4 font-poppins-bold text-lg text-brand-ink">{qty}</Text>
            </>
          )}
          <Pressable
            onPress={() => addToCart(item)}
            className="h-10 w-10 items-center justify-center rounded-full bg-brand"
          >
            <Text className="font-poppins-bold text-lg text-white">+</Text>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer maxWidth={860}>
      {/* Header */}
      <View className="flex-row items-center pb-4">
        {navigation.canGoBack() && (
          <Pressable
            onPress={() => navigation.goBack()}
            className="mr-4 rounded-full bg-brand-soft p-3"
          >
            <Text className="text-xl leading-none">←</Text>
          </Pressable>
        )}
        <View className="flex-1">
          <Text className="text-2xl font-poppins-bold text-brand-ink">
            🍽️ Meja {tableId}
          </Text>
          <Text className="text-sm font-poppins text-brand-muted">
            Pilih menu & buat pesanan langsung dari meja
          </Text>
        </View>
      </View>

      {isLoadingProducts ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#A63D40" />
          <Text className="mt-4 font-poppins text-brand-muted">Memuat menu...</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={{ paddingBottom: 200 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View className="mb-4">
              <View className="mb-3">
                <Text className="text-sm font-poppins-semibold text-brand-muted mb-1 ml-1">
                  Nama Anda (Opsional)
                </Text>
                <TextInput
                  className="bg-white border border-brand/10 rounded-[20px] px-5 py-4 font-poppins text-brand-ink"
                  placeholder="Contoh: Budi"
                  value={customerName}
                  onChangeText={setCustomerName}
                />
              </View>
              <View className="mb-4">
                <Text className="text-sm font-poppins-semibold text-brand-muted mb-1 ml-1">
                  Catatan Pesanan (Opsional)
                </Text>
                <TextInput
                  className="bg-white border border-brand/10 rounded-[20px] px-5 py-4 font-poppins text-brand-ink"
                  placeholder="Contoh: Sambal dipisah, no es batu..."
                  value={notes}
                  onChangeText={setNotes}
                  multiline
                />
              </View>
              <Text className="text-base font-poppins-bold text-brand-ink ml-1">
                Pilih Menu
              </Text>
            </View>
          }
          ListEmptyComponent={
            <View className="items-center py-10">
              <Text className="text-4xl mb-3">🍽️</Text>
              <Text className="font-poppins text-brand-muted">
                Menu belum tersedia saat ini.
              </Text>
            </View>
          }
        />
      )}

      {/* Floating cart bar */}
      {cart.length > 0 && (
        <View className="absolute bottom-6 left-6 right-6 rounded-[28px] bg-white p-4 shadow-xl border border-brand/10">
          <View className="mb-3 flex-row justify-between pl-2">
            <Text className="font-poppins text-brand-muted">
              {cart.reduce((sum, i) => sum + i.qty, 0)} item dipilih
            </Text>
            <Text className="font-poppins-bold text-lg text-brand-ink">
              {formatIDR(cartTotal)}
            </Text>
          </View>
          <AppButton
            label={isSubmitting ? "Memproses..." : "🛒 Pesan Sekarang"}
            onPress={handlePlaceOrder}
            loading={isSubmitting}
          />
        </View>
      )}
    </ScreenContainer>
  );
};
