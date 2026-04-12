import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { 
  Text, 
  View, 
  Pressable, 
  TextInput, 
  ScrollView, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  Share,
  ActivityIndicator,
  useWindowDimensions
} from "react-native";
import { CheckCircle2 } from "lucide-react-native";

import { ScreenContainer } from "@/components/ScreenContainer";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { updateOrderStatuses, addTransaction, updateTableBookingStatus } from "@/services/firestoreService";
import { AppStackParamList, PaymentMethod } from "@/types";
import { formatIDR } from "@/utils/currency";
import { resolveStoreUserId } from "@/utils/store";
import { getResponsiveLayout } from "@/utils/responsive";

type Props = NativeStackScreenProps<AppStackParamList, "Payment">;

export const PaymentScreen = ({ navigation, route }: Props) => {
  const { order } = route.params;
  const { clearCart } = useCart();
  const { authUser, profile } = useAuth();
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const storeUserId = resolveStoreUserId(authUser?.uid, profile);
  
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [receiptText, setReceiptText] = useState<string | null>(null);
  const [cashAmount, setCashAmount] = useState<string>("");
  const changeAmount = cashAmount ? (parseInt(cashAmount) || 0) - order.total : 0;

  const finalizePayment = async () => {
    if (!paymentMethod) {
      Alert.alert("Ops!", "Pilih metode pembayaran dulu ya.");
      return;
    }
    if (!authUser || !storeUserId) return;

    try {
      setIsProcessing(true);
      await updateOrderStatuses(order.id!, "done", "paid");

      if (storeUserId && (order.tableId || order.tableNumber)) {
        await updateTableBookingStatus(storeUserId, (order.tableId || order.tableNumber) as string, false);
      }
      
      await addTransaction({
        userId: storeUserId,
        items: order.items || [],
        cashierName: profile?.email?.split("@")[0] || "Kasir",
        total: order.total || 0,
        customerName: order.customerName || "Pelanggan",
        paymentMethod,
        paymentStatus: "paid",
        transactionStatus: "completed",
        tableNumber: order.tableNumber || order.tableId,
      });

      const receiptLines = [
        "WARTEG MODERN",
        "------------------------------",
        `Kasir   : ${profile?.email?.split("@")[0] || "Kasir"}`,
        `Meja    : ${order.tableNumber || order.tableId}`,
        `Metode  : ${paymentMethod.toUpperCase()}`,
        "------------------------------",
        ...(order.items || []).map(i => `${i.name} x${i.qty} ${formatIDR(i.price * i.qty)}`),
        "------------------------------",
        `TOTAL   : ${formatIDR(order.total)}`,
        "------------------------------",
        "Terima Kasih!",
      ].join("\n");

      setReceiptText(receiptLines);
    } catch (error: any) {
      Alert.alert("Error", `Gagal memproses: ${error?.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    clearCart();
    navigation.reset({
      index: 0,
      routes: [{ name: "Dashboard" }],
    });
  };

  if (receiptText) {
    return (
      <ScreenContainer scroll maxWidth={720} className="bg-brand-soft/20">
        <View style={{ minHeight: "100%", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <View className="w-full items-center rounded-[48px] border border-brand/5 bg-white" style={{ padding: layout.isTablet ? 32 : 24 }}>
            <View className="mb-5 h-20 w-20 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 size={40} color="#047857" strokeWidth={2.5} />
            </View>
            <Text
              className="mb-1 text-center font-poppins-bold text-emerald-800"
              style={{ fontSize: layout.isTablet ? 18 : 17, letterSpacing: 2.5 }}
            >
              LUNAS
            </Text>
            <Text
              className="mb-2 text-center font-poppins-bold text-emerald-800"
              style={{ fontSize: layout.isTablet ? 34 : 30 }}
            >
              Berhasil!
            </Text>
            <Text className="mb-8 text-center font-poppins text-brand-muted text-sm">
              Transaksi selesai dicatat.
            </Text>

            <View
              className="mb-8 w-full rounded-[32px] border border-dashed border-brand/10 bg-brand-soft/20"
              style={{ padding: layout.isTablet ? 24 : 18 }}
            >
              <Text className="text-center font-mono text-[10px] leading-5 text-brand-ink">
                {receiptText}
              </Text>
            </View>

            <View className="w-full">
              <Pressable
                onPress={async () => await Share.share({ message: receiptText })}
                className="mb-3 h-16 items-center justify-center rounded-3xl bg-brand-soft"
              >
                <Text className="font-poppins-bold text-brand">Bagikan Nota</Text>
              </Pressable>
              <Pressable
                onPress={handleFinish}
                className="h-16 items-center justify-center rounded-3xl bg-brand shadow-lg shadow-brand/20"
              >
                <Text className="font-poppins-bold text-white">Selesai</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll maxWidth={960} className="bg-[#FAF9F6]">
      <View style={{ width: "100%", minHeight: "100%" }}>
        <Pressable onPress={() => navigation.goBack()} className="h-12 w-12 bg-brand-soft/50 rounded-2xl items-center justify-center mb-6">
          <Text className="text-xl">←</Text>
        </Pressable>
        
        <Text className="text-4xl font-poppins-bold text-brand-ink mb-2" style={{ fontSize: layout.isTablet ? 44 : layout.isCompact ? 32 : 38 }}>Tagihan</Text>
        <Text className="text-sm font-poppins text-brand-muted mb-10">Selesaikan pembayaran.</Text>

        <View className="bg-brand-ink rounded-[40px] mb-10 shadow-xl overflow-hidden" style={{ padding: layout.isTablet ? 32 : 24 }}>
           <View className="absolute right-0 top-0 bottom-0 w-32 bg-brand opacity-10 rounded-l-full" />
           <Text className="text-white/60 text-xs font-poppins-bold uppercase tracking-widest mb-2">Total Tagihan</Text>
           <Text className="font-poppins-bold text-white mb-4" style={{ fontSize: layout.isTablet ? 48 : layout.isCompact ? 34 : 42 }}>{formatIDR(order.total)}</Text>
           <View className="flex-row items-center">
             <View className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-2" />
             <Text className="text-emerald-400 text-xs font-poppins-bold uppercase tracking-wider">
               Meja {order.tableNumber || order.tableId}
             </Text>
           </View>
        </View>

        <Text className="text-xs font-poppins-bold text-brand-muted uppercase tracking-[3px] mb-6 px-2">Metode Bayar</Text>
        <View className="mb-10" style={{ flexDirection: layout.isCompact ? "column" : "row" }}>
          {(['cash', 'qris', 'transfer'] as const).map(m => {
             const active = paymentMethod === m;
             const labels = { cash: "Tunai", qris: "QRIS", transfer: "Bank" };
             return (
               <Pressable 
                 key={m}
                 onPress={() => setPaymentMethod(m)}
                 style={{
                   flex: layout.isCompact ? undefined : 1,
                   height: 112,
                   borderRadius: 24,
                   alignItems: 'center',
                   justifyContent: 'center',
                   marginHorizontal: layout.isCompact ? 0 : 4,
                   marginBottom: layout.isCompact ? 10 : 0,
                   borderWidth: 1,
                   backgroundColor: active ? '#c17d3c' : 'rgba(242, 228, 209, 0.2)',
                   borderColor: active ? '#c17d3c' : 'rgba(193, 125, 60, 0.05)',
                   elevation: active ? 8 : 0,
                   shadowColor: active ? '#c17d3c' : 'transparent', shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }
                 }}
               >
                 <Text style={{ fontSize: 10, fontFamily: 'Poppins-Bold', textTransform: 'uppercase', letterSpacing: 1, color: active ? '#fff' : '#666' }}>{labels[m]}</Text>
               </Pressable>
             );
          })}
        </View>

        {paymentMethod === 'cash' && (
          <View className="mb-10 bg-brand-soft/10 rounded-[40px] border border-brand/5" style={{ padding: layout.isTablet ? 32 : 24 }}>
            <Text className="text-sm font-poppins-bold text-brand-ink mb-6">Input Tunai</Text>
            <TextInput
                 className="bg-white border border-brand/10 rounded-[24px] font-poppins-bold text-4xl text-brand text-center mb-6"
                 style={{ paddingHorizontal: 24, paddingVertical: layout.isTablet ? 22 : 18, fontSize: layout.isTablet ? 40 : 34 }}
                 placeholder="0"
                 keyboardType="number-pad"
                 value={cashAmount}
                 onChangeText={setCashAmount}
                 autoFocus
               />
               <View className="flex-row flex-wrap justify-between mb-8">
                 {[20000, 50000, 100000].map(val => (
                   <Pressable 
                     key={val} 
                     onPress={() => setCashAmount(String(val))}
                     className="bg-white border border-brand/10 rounded-2xl px-4 py-4 mb-2"
                     style={{ width: layout.isCompact ? '48%' : '31%' }}
                   >
                     <Text className="text-center font-poppins-bold text-brand-ink text-xs">${val/1000}K</Text>
                   </Pressable>
                 ))}
               </View>

               {parseInt(cashAmount) >= order.total && (
                 <View className="flex-row justify-between items-center bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                   <Text className="font-poppins-semibold text-emerald-800">Kembali:</Text>
                   <Text className="font-poppins-bold text-2xl text-emerald-800">{formatIDR(changeAmount)}</Text>
                 </View>
               )}
          </View>
        )}

        <View className="mb-12">
          <Pressable 
            onPress={finalizePayment}
            className={`h-20 rounded-[28px] items-center justify-center shadow-xl ${paymentMethod ? 'bg-brand' : 'bg-brand-muted/20 opacity-50'}`}
          >
            {isProcessing ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-poppins-bold text-lg uppercase tracking-widest">Bayar Sekarang</Text>
            )}
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
};
