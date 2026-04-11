import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState, useMemo } from "react";
import { FlatList, Text, View, Pressable, Alert, ActivityIndicator, Switch } from "react-native";

import { ScreenContainer } from "@/components/ScreenContainer";
import { SearchBar } from "@/components/SearchBar";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { getOrderChannelLabel, isTableOrder } from "@/utils/order";
import {
  subscribeOrders,
  updateOrderStatuses,
  updateOrder,
  archiveAndClearOrders,
  closeTodaySales,
  getTransactionsByRange,
  summarizeTransactions,
  updateStoreOpenStatus,
  subscribeUserProfile,
} from "@/services/firestoreService";
import { AppStackParamList, CartItem, OrderRecord, PaymentMethod, OrderStatus } from "@/types";
import { formatIDR } from "@/utils/currency";
import { formatTime } from "@/utils/date";
import { isCashierUnlinked, resolveStoreUserId } from "@/utils/store";

export const paymentOptions: PaymentMethod[] = ["cash", "qris", "transfer"];

type Props = NativeStackScreenProps<AppStackParamList, "OrderList">;
type OrderFilter = "all" | "table" | "cashier";

export const OrderListScreen = ({ navigation }: Props) => {
  const { authUser, profile } = useAuth();
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterSource, setFilterSource] = useState<OrderFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const { loadOrder } = useCart();
  const storeUserId = resolveStoreUserId(authUser?.uid, profile);
  const showLinkWarning = isCashierUnlinked(profile);
  
  const cashierName = profile?.name || authUser?.email?.split('@')[0] || "Kasir";
  const [isStoreOpen, setIsStoreOpen] = useState(profile?.isStoreOpen ?? true);

  useEffect(() => {
    if (!storeUserId) return;
    
    // Sinkronisasi status warung secara real-time
    const unsubscribe = subscribeUserProfile(storeUserId, (storeProfile) => {
      if (storeProfile && storeProfile.isStoreOpen !== undefined) {
        setIsStoreOpen(storeProfile.isStoreOpen);
      }
    });

    return unsubscribe;
  }, [storeUserId]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const toggleStoreStatus = async (value: boolean) => {
    setIsStoreOpen(value);
    if (storeUserId) {
      try {
        await updateStoreOpenStatus(storeUserId, value);
      } catch(e) {
        setIsStoreOpen(!value);
        Alert.alert("Error", "Gagal menyimpan status warung");
      }
    }
  };


  useEffect(() => {
    if (!authUser || !storeUserId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const unsubscribe = subscribeOrders(storeUserId, setOrders);
    return unsubscribe;
  }, [authUser, storeUserId]);

  const handleAction = async (order: OrderRecord) => {
    const currentStatus = order.status || "pending";
    const currentPaymentStatus = order.paymentStatus || "pending";
    
    if (currentStatus === "pending") {
      try {
        await updateOrderStatuses(order.id!, "confirmed", currentPaymentStatus);
      } catch (error: any) {
        Alert.alert("Error", `Gagal: ${error?.message}`);
      }
    } else if (currentStatus === "confirmed" && currentPaymentStatus === "pending") {
      try {
        await updateOrder(order.id!, { status: "ready" });
      } catch (error: any) {
        Alert.alert("Error", `Gagal: ${error?.message}`);
      }
    } else if (currentStatus === "ready" && currentPaymentStatus === "pending") {
      navigation.navigate("Payment", { order });
    } else if (currentPaymentStatus === "paid" && currentStatus !== "done") {
      try {
        await updateOrderStatuses(order.id!, "done", "paid");
      } catch (error: any) {
        Alert.alert("Error", `Gagal: ${error?.message}`);
      }
    }
  };

  const handleEdit = (order: OrderRecord) => {
    loadOrder(order);
    navigation.navigate("POS", { tableNumber: order.tableNumber || order.tableId });
  };

  const getActionLabel = (order: OrderRecord) => {
    const status = order.status || "pending";
    const payStatus = order.paymentStatus || "pending";
    if (status === "pending") return "Masak Pesanan";
    if (status === "confirmed" && payStatus === "pending") return "Siap Saji";
    if (status === "ready" && payStatus === "pending") return "Lanjut Bayar";
    if (payStatus === "paid" && status !== "done") return "Selesaikan";
    return null;
  };

  const filteredOrders = orders.filter(o => {
    const tableOrder = isTableOrder(o);
    const sourceMatch = filterSource === 'all' || 
                       (filterSource === 'table' && tableOrder) || 
                       (filterSource === 'cashier' && !tableOrder);
    const statusMatch = statusFilter === 'all' || (o.status || 'pending') === statusFilter;
    const query = searchQuery.toLowerCase();
    const searchMatch = !query || 
                        (o.customerName?.toLowerCase().includes(query)) ||
                        (o.tableNumber?.toLowerCase().includes(query)) ||
                        (o.tableId?.toLowerCase().includes(query));
    return sourceMatch && statusMatch && searchMatch;
  });

  const renderItem = ({ item }: { item: OrderRecord }) => {
    const status = item.status || "pending";
    const payStatus = item.paymentStatus || "pending";
    const actionLabel = getActionLabel(item);
    const safeItems: CartItem[] = Array.isArray(item.items) ? item.items : [];
    const isFromTable = isTableOrder(item);
    
    const statusColors = {
      pending: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'BARU' },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'DIMASAK' },
      ready: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'SIAP' },
      done: { bg: 'bg-brand-soft/50', text: 'text-brand-muted', label: 'SELESAI' },
    };

    const currentStatusStyle = statusColors[status as keyof typeof statusColors] || statusColors.pending;

    return (
      <View className="mb-6 rounded-[32px] bg-white p-6 shadow-sm border border-brand/5">
        <View className="flex-row justify-between mb-5">
          <View className="flex-1">
            <View className="flex-row items-center">
              <View className={`h-2 w-2 rounded-full mr-2 ${status === 'pending' ? 'bg-red-500 animate-pulse' : 'bg-brand'}`} />
              <Text className="text-xl font-poppins-bold text-brand-ink">
                {isFromTable ? `Meja ${item.tableNumber || item.tableId}` : item.customerName || "Take Away"}
              </Text>
            </View>
            <Text className="text-xs font-poppins text-brand-muted mt-1 uppercase tracking-wider">
              {item.createdAt ? formatTime(item.createdAt) : "Baru"} • {isFromTable ? 'QR ORDER' : 'INPUT KASIR'}
            </Text>
          </View>
          
          <View className="items-end">
            <View className={`${currentStatusStyle.bg} px-3 py-1.5 rounded-full mb-1`}>
              <Text className={`text-[10px] font-poppins-bold ${currentStatusStyle.text}`}>{currentStatusStyle.label}</Text>
            </View>
            <View className={`${payStatus === 'paid' ? 'bg-emerald-500' : 'bg-red-500'} px-2 py-1 rounded-lg`}>
              <Text className="text-[9px] font-poppins-bold text-white uppercase">{payStatus === 'paid' ? 'LUNAS' : 'BELUM BAYAR'}</Text>
            </View>
          </View>
        </View>

        <View className="bg-brand-soft/20 rounded-[24px] p-5 mb-5 border border-brand/5 border-dashed">
          {safeItems.slice(0, 3).map((prod, idx) => (
            <View key={idx} className="flex-row justify-between mb-2">
              <Text className="text-sm font-poppins text-brand-ink/80 flex-1">{prod.qty}x {prod.name}</Text>
              <Text className="text-sm font-poppins-semibold text-brand-ink">{formatIDR(prod.price * prod.qty)}</Text>
            </View>
          ))}
          {safeItems.length > 3 && (
            <Text className="text-[10px] font-poppins-medium text-brand/60 mt-1 italic">+{safeItems.length - 3} item lainnya...</Text>
          )}
          {item.notes && (
            <View className="mt-3 bg-white/60 p-3 rounded-xl">
              <Text className="text-xs font-poppins italic text-brand-muted">"{item.notes}"</Text>
            </View>
          )}
        </View>

        <View className="flex-row justify-between items-center mb-6 px-1">
          <Text className="text-xs font-poppins-bold text-brand-muted tracking-[2px] uppercase">Total Tagihan</Text>
          <Text className="text-2xl font-poppins-bold text-brand">{formatIDR(item.total)}</Text>
        </View>

        <View className="flex-row">
          {status !== 'done' && (
            <Pressable
              onPress={() => handleEdit(item)}
              className="mr-3 h-14 w-14 items-center justify-center rounded-2xl bg-brand-soft border border-brand/10"
            >
              <Text className="text-xl">✏️</Text>
            </Pressable>
          )}

          {actionLabel && (
            <Pressable
              onPress={() => handleAction(item)}
              className="flex-1 h-14 bg-brand rounded-2xl items-center justify-center shadow-md shadow-brand/20 active:bg-brand-ink"
            >
              <Text className="text-white font-poppins-bold text-sm uppercase tracking-wider">{actionLabel}</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  const StatusTab = ({ label, code }: { label: string, code: string }) => {
    const isActive = statusFilter === code;
    return (
      <Pressable
        onPress={() => setStatusFilter(code as any)}
        className={`mr-3 px-6 py-3 rounded-full border ${isActive ? 'bg-brand border-brand shadow-lg shadow-brand/30' : 'bg-white border-brand/10'}`}
      >
        <Text className={`text-xs font-poppins-bold ${isActive ? 'text-white' : 'text-brand-muted'}`}>
          {label}
        </Text>
      </Pressable>
    );
  };

  return (
    <ScreenContainer className="bg-brand-soft/30">
      {/* Decorative background shapes */}
      <View className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-brand/5" />
      <View className="absolute -right-10 top-1/3 h-40 w-40 rounded-full bg-accent/5" />

      {profile?.role === "owner" && (
        <Pressable 
          onPress={() => {
            if (navigation.canGoBack()) {
  navigation.goBack();
} else {
  navigation.navigate("Dashboard");
}
          }}
          className="mb-4 flex-row items-center self-start bg-white/80 px-4 py-2 rounded-full border border-brand/10 shadow-sm z-10"
        >
          <Text className="text-sm mr-2 text-brand">⬅️</Text>
          <Text className="font-poppins-bold text-brand">Kembali ke Dashboard Owner</Text>
        </Pressable>
      )}

      {/* Cashier Status Card */}
      <View className="mb-6 bg-white/90 p-5 rounded-3xl shadow-sm border border-brand/10">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-12 w-12 rounded-full bg-brand-soft items-center justify-center mr-3 border border-brand/20">
              <Text className="text-xl">👩‍🍳</Text>
            </View>
            <View>
              <Text className="text-sm font-poppins-bold text-brand-ink uppercase tracking-wider">{cashierName}</Text>
              <Text className="text-[10px] font-poppins-medium text-brand-muted">
                {currentDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })} • {currentDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
          </View>
          
          <Pressable 
            onPress={() => navigation.navigate("Settings")}
            className="h-10 w-10 rounded-2xl bg-white border border-brand/10 items-center justify-center shadow-sm"
          >
            <Text className="text-sm">⚙️</Text>
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between mt-5 bg-brand-soft/30 p-3 rounded-2xl border border-brand/5">
          <View className="flex-row items-center">
            <Text className="text-lg mr-2">{isStoreOpen ? '✅' : '⛔'}</Text>
            <View>
              <Text className="text-xs font-poppins-bold text-brand-ink">
                Status Warung: {isStoreOpen ? 'BUKA' : 'TUTUP'}
              </Text>
              <Text className="text-[9px] font-poppins text-brand-muted mt-0.5">
                {isStoreOpen 
                  ? 'Menerima pesanan baru' 
                  : profile?.role === 'owner' 
                    ? 'Ketuk saklar untuk membuka kembali' 
                    : 'Minta owner untuk membuka warung'}
              </Text>
            </View>
          </View>
          {profile?.role === 'owner' && (
            <Switch
              value={isStoreOpen}
              onValueChange={toggleStoreStatus}
              trackColor={{ false: "#ffe4e6", true: "#dcfce7" }}
              thumbColor={isStoreOpen ? "#22c55e" : "#e11d48"}
            />
          )}
        </View>
      </View>

      <View className="mb-6 flex-row items-center justify-between">
        <View>
          <Text className="text-2xl font-poppins-bold text-brand-ink">Aktivitas Dapur</Text>
          <Text className="text-xs font-poppins text-brand-muted mt-0.5">Kelola pesanan & pembayaran hari ini.</Text>
        </View>
      </View>

      <View className="mb-6">
        <SearchBar 
          value={searchQuery} 
          onChangeText={setSearchQuery} 
          placeholder="Cari Pesanan (Nama/Meja)..." 
        />
      </View>

      <View className="mb-4">
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { label: 'SEMUA', code: 'all' },
            { label: 'BARU', code: 'pending' },
            { label: 'MASAK', code: 'confirmed' },
            { label: 'SIAP', code: 'ready' },
            { label: 'LUNAS', code: 'paid' },
            { label: 'SELESAI', code: 'done' },
          ]}
          renderItem={({ item }) => <StatusTab label={item.label} code={item.code} />}
          contentContainerStyle={{ paddingBottom: 10 }}
        />
      </View>

      <View className="mb-8 flex-row">
        {['all', 'table', 'cashier'].map((s) => (
          <Pressable
            key={s}
            onPress={() => setFilterSource(s as any)}
            className={`flex-1 items-center py-3 rounded-2xl mr-2 last:mr-0 ${filterSource === s ? 'bg-brand-ink' : 'bg-white border border-brand/5'}`}
          >
            <Text className={`text-[10px] font-poppins-bold ${filterSource === s ? 'text-white' : 'text-brand-muted'}`}>
              {s === 'all' ? 'SEMUA' : s === 'table' ? 'MEJA' : 'KASIR'}
            </Text>
          </Pressable>
        ))}
      </View>

      {showLinkWarning && (
        <View className="bg-red-50 p-5 rounded-3xl mb-8 border border-red-100 flex-row items-center">
          <View className="h-10 w-10 rounded-full bg-red-100 items-center justify-center mr-4">
            <Text>⚠️</Text>
          </View>
          <View className="flex-1">
            <Text className="text-red-900 font-poppins-bold text-xs">Akun Terputus</Text>
            <Pressable onPress={() => navigation.navigate("Settings")}>
              <Text className="text-red-600 text-[10px] font-poppins-medium underline mt-1">Hubungkan ID Owner sekarang</Text>
            </Pressable>
          </View>
        </View>
      )}

      <FlatList
        data={filteredOrders}
        keyExtractor={(item) => item.id || Math.random().toString()}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 150 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="mt-20 items-center">
            <View className="h-24 w-24 bg-brand-soft/50 rounded-full items-center justify-center mb-4">
              <Text className="text-4xl">🥡</Text>
            </View>
            <Text className="font-poppins-bold text-brand-ink text-lg">{isLoading ? 'Memuat Data...' : 'Belum Ada Pesanan'}</Text>
            <Text className="font-poppins text-brand-muted text-sm text-center mt-2 px-10">
              {isLoading ? 'Sabar ya, data sedang kami ambil.' : 'Pesan baru akan muncul secara otomatis di sini.'}
            </Text>
          </View>
        }
      />
      
      <Pressable
        onPress={() => navigation.navigate("POS")}
        className="position-absolute bottom-8 right-8 h-18 w-18 rounded-full bg-brand items-center justify-center shadow-xl shadow-brand/40"
        style={{ width: 72, height: 72, position: 'absolute', borderRadius: 36 }}
      >
        <Text className="text-white text-3xl font-poppins-bold">+</Text>
      </Pressable>
    </ScreenContainer>
  );
};
