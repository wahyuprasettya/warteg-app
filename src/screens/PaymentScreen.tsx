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
  ActivityIndicator
} from "react-native";

import { ScreenContainer } from "@/components/ScreenContainer";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { updateOrderStatuses, addTransaction, updateTableBookingStatus } from "@/services/firestoreService";
import { AppStackParamList, PaymentMethod } from "@/types";
import { formatIDR } from "@/utils/currency";
import { resolveStoreUserId } from "@/utils/store";

type Props = NativeStackScreenProps<AppStackParamList, "Payment">;

export const PaymentScreen = ({ navigation, route }: Props) => {
  const { order } = route.params;
  const { clearCart } = useCart();
  const { authUser, profile } = useAuth();
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
    navigation.navigate("OrderList");
  };

  if (receiptText) {
    return (
      <ScreenContainer scroll>
        <View style={{ minHeight: '100%', backgroundColor: 'rgba(242, 228, 209, 0.3)', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <View className="w-full bg-white rounded-[48px] p-8 shadow-2xl items-center border border-brand/5">
          <View className="h-20 w-20 bg-emerald-100 rounded-full items-center justify-center mb-6">
            <Text className="text-3xl">Lunas</Text>
          </View>
          <Text className="text-3xl font-poppins-bold text-emerald-800 mb-2">Berhasil!</Text>
          <Text className="text-sm font-poppins text-brand-muted text-center mb-8">Transaksi selesai dicatat.</Text>
          
          <View className="w-full bg-brand-soft/20 p-6 rounded-[32px] border border-brand/10 border-dashed mb-8">
            <Text className="font-mono text-[10px] text-brand-ink leading-5 text-center">{receiptText}</Text>
          </View>

          <View className="w-full">
            <Pressable 
              onPress={async () => await Share.share({ message: receiptText })} 
              className="bg-brand-soft h-16 rounded-3xl items-center justify-center mb-3"
            >
              <Text className="text-brand font-poppins-bold">Bagikan Nota</Text>
            </Pressable>
            <Pressable onPress={handleFinish} className="bg-brand h-16 rounded-3xl items-center justify-center shadow-lg shadow-brand/20">
              <Text className="text-white font-poppins-bold">Selesai</Text>
            </Pressable>
          </View>
        </View>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <View style={{ padding: 32, backgroundColor: '#fff', minHeight: '100%' }}>
        <Pressable onPress={() => navigation.goBack()} className="h-12 w-12 bg-brand-soft/50 rounded-2xl items-center justify-center mb-6">
          <Text className="text-xl">←</Text>
        </Pressable>
        
        <Text className="text-4xl font-poppins-bold text-brand-ink mb-2">Tagihan</Text>
        <Text className="text-sm font-poppins text-brand-muted mb-10">Selesaikan pembayaran.</Text>

        <View className="bg-brand-ink rounded-[40px] p-8 mb-10 shadow-xl overflow-hidden">
           <View className="absolute right-0 top-0 bottom-0 w-32 bg-brand opacity-10 rounded-l-full" />
           <Text className="text-white/60 text-xs font-poppins-bold uppercase tracking-widest mb-2">Total Tagihan</Text>
           <Text className="text-5xl font-poppins-bold text-white mb-4">{formatIDR(order.total)}</Text>
           <View className="flex-row items-center">
             <View className="h-1.5 w-1.5 rounded-full bg-emerald-400 mr-2" />
             <Text className="text-emerald-400 text-xs font-poppins-bold uppercase tracking-wider">
               Meja {order.tableNumber || order.tableId}
             </Text>
           </View>
        </View>

        <Text className="text-xs font-poppins-bold text-brand-muted uppercase tracking-[3px] mb-6 px-2">Metode Bayar</Text>
        <View className="flex-row mb-10">
          {(['cash', 'qris', 'transfer'] as const).map(m => {
             const active = paymentMethod === m;
             const labels = { cash: "Tunai", qris: "QRIS", transfer: "Bank" };
             return (
               <Pressable 
                 key={m}
                 onPress={() => setPaymentMethod(m)}
                 style={{
                   flex: 1, height: 112, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4, borderWidth: 1,
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
          <View className="mb-10 bg-brand-soft/10 p-8 rounded-[40px] border border-brand/5">
            <Text className="text-sm font-poppins-bold text-brand-ink mb-6">Input Tunai</Text>
            <TextInput
                 className="bg-white border border-brand/10 rounded-[24px] px-8 py-6 font-poppins-bold text-4xl text-brand text-center mb-6"
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
                     style={{ width: '31%' }}
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
