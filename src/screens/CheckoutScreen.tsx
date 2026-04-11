import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useMemo, useState } from "react";
import { Alert, Share, Text, TextInput, View, Pressable } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { addTransaction, addOrder, updateOrder, updateTableBookingStatus, subscribeUserProfile } from "@/services/firestoreService";
import { AppStackParamList, PaymentMethod } from "@/types";
import { formatIDR } from "@/utils/currency";
import { resolveStoreUserId } from "@/utils/store";

type Props = NativeStackScreenProps<AppStackParamList, "Checkout">;

const paymentOptions: PaymentMethod[] = ["cash", "qris", "transfer"];

interface CompletedOrder {
  cashierName?: string;
  customerName?: string;
  activeTable?: string;
  subtotal: number;
  discountAmount: number;
  manualDiscount: number;
  promoDiscount: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: "paid" | "pending";
  receiptText: string;
}

export const CheckoutScreen = ({ navigation }: Props) => {
  const { authUser, profile } = useAuth();
  const {
    activePromo,
    activeTable,
    clearCart,
    customerName,
    discountAmount,
    items,
    manualDiscount,
    note,
    promoDiscount,
    setCustomerName,
    subtotal,
    total,
    activeOrderId,
  } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(
    null,
  );
  const [isStoreOpen, setIsStoreOpen] = useState(profile?.isStoreOpen ?? true);
  const storeUserId = resolveStoreUserId(authUser?.uid, profile);
  const enabledPaymentMethods =
    profile?.enabledPaymentMethods?.length
      ? profile.enabledPaymentMethods
      : paymentOptions;

  useEffect(() => {
    if (!storeUserId) return;
    const unsubscribe = subscribeUserProfile(storeUserId, (p) => {
      if (p) setIsStoreOpen(p.isStoreOpen ?? true);
    });
    return unsubscribe;
  }, [storeUserId]);

  useEffect(() => {
    if (!enabledPaymentMethods.includes(paymentMethod)) {
      setPaymentMethod(enabledPaymentMethods[0] ?? "cash");
      setPaymentConfirmed(false);
    }
  }, [enabledPaymentMethods, paymentMethod]);

  const paymentStatus = useMemo(() => {
    if (paymentMethod === "cash") {
      return "paid";
    }

    return paymentConfirmed ? "paid" : "pending";
  }, [paymentConfirmed, paymentMethod]);

  const displaySubtotal = completedOrder?.subtotal ?? subtotal;
  const displayManualDiscount =
    completedOrder?.manualDiscount ?? manualDiscount;
  const displayPromoDiscount = completedOrder?.promoDiscount ?? promoDiscount;
  const displayDiscountAmount =
    completedOrder?.discountAmount ?? discountAmount;
  const displayTotal = completedOrder?.total ?? total;
  const displayPaymentStatus = completedOrder?.paymentStatus ?? paymentStatus;
  const displayCustomerName = completedOrder?.customerName ?? customerName;
  const displayTable = completedOrder?.activeTable ?? activeTable;

  const handlePrintReceipt = async () => {
    if (!completedOrder) {
      return;
    }

    try {
      await Share.share({
        title: "Nota Pembelian",
        message: completedOrder.receiptText,
      });
    } catch (error) {
      Alert.alert(
        "Print nota gagal",
        "Nota belum bisa dibagikan dari perangkat ini.",
      );
    }
  };

  const handleDone = () => {
    clearCart();
    navigation.navigate("OrderList");
  };

  const handleSaveAsOrder = async () => {
    if (!authUser || !storeUserId) return;
    if (items.length === 0) return;

    if (!isStoreOpen) {
      Alert.alert(
        "Warung Tutup",
        "Maaf, warung sedang ditutup oleh Owner. Selesaikan koordinasi dengan Owner untuk membuka kembali sistem sebelum menyimpan pesanan."
      );
      return;
    }

    try {
      setIsSubmitting(true);
      if (activeOrderId) {
        await updateOrder(activeOrderId, {
          items,
          total,
          customerName: customerName.trim() || undefined,
          notes: note,
        });
      } else {
        await addOrder({
          userId: storeUserId,
          tableId: activeTable || "manual",
          tableNumber: activeTable,
          items,
          total,
          status: "confirmed", // Manual orders are usually confirmed
          paymentStatus: "pending",
          customerName: customerName.trim() || undefined,
          notes: note,
          orderFromTable: false,
          orderSource: "manual",
          createdAt: new Date().toISOString(),
        });
      }

      Alert.alert(
        "Berhasil",
        "Pesanan berhasil disimpan di Daftar Pesanan (Status: Belum Bayar).",
        [{ text: "OK", onPress: handleDone }]
      );
    } catch (error: any) {
      Alert.alert("Gagal", `Gagal menyimpan pesanan: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckout = async () => {
    if (!authUser || !storeUserId) {
      Alert.alert("Error", "Sesi login tidak ditemukan. Silakan login kembali.");
      return;
    }

    if (!isStoreOpen) {
      Alert.alert(
        "Warung Tutup",
        "Sistem kasir sedang dijeda oleh Owner. Silakan minta Owner untuk membuka warung di menu Dashboard mereka agar transaksi bisa diproses."
      );
      return;
    }

    if (items.length === 0) {
      Alert.alert("Keranjang Kosong", "Pilih menu terlebih dahulu sebelum simpan transaksi.");
      return;
    }

    try {
      setIsSubmitting(true);
      await addTransaction({
        userId: storeUserId,
        items,
        cashierName: profile?.email?.split("@")[0] || "Kasir",
        cashierEmail: profile?.email || authUser.email || undefined,
        customerName: customerName.trim() || undefined,
        subtotal,
        discountAmount,
        promoCode: activePromo?.code,
        promoLabel: activePromo?.label,
        promoDiscountAmount: promoDiscount,
        manualDiscountAmount: manualDiscount,
        total,
        paymentMethod,
        paymentStatus,
        transactionStatus: "completed",
        tableNumber: activeTable,
        note,
        orderFromTable: false,
        orderSource: "manual",
      });

      // Clear table booking status if this was a table order
      if (storeUserId && activeTable) {
         await updateTableBookingStatus(storeUserId, activeTable, false);
      }

      // If this was an existing order being completed, we might want to mark it done or delete it.
      // In current flow, completion moves to transactions and they are cleared at closing.
      // But if we're completing an ACTIVE order, we should mark its order status to done.
      if (activeOrderId) {
        await updateOrder(activeOrderId, {
          status: "done",
          paymentStatus: "paid",
        });
      }


      const receiptLines = [
        "WARTEG POS",
        "------------------------------",
        `Kasir   : ${profile?.email?.split("@")[0] || "Kasir"}`,
        `Pembeli : ${customerName.trim() || "-"}`,
        activeTable ? `Meja    : ${activeTable}` : null,
        `Metode  : ${paymentMethod.toUpperCase()}`,
        "------------------------------",
        ...items.map(
          (item) =>
            `${item.name} x${item.qty}  ${formatIDR(item.price * item.qty)}`,
        ),
        "------------------------------",
        `Subtotal : ${formatIDR(subtotal)}`,
        `Diskon   : -${formatIDR(discountAmount)}`,
        `Total    : ${formatIDR(total)}`,
        paymentStatus === "paid" ? "Status   : LUNAS" : "Status   : PENDING",
        note ? `Catatan  : ${note}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      setCompletedOrder({
        cashierName: profile?.email?.split("@")[0] || "Kasir",
        customerName: customerName.trim() || undefined,
        activeTable,
        subtotal,
        discountAmount,
        manualDiscount,
        promoDiscount,
        total,
        paymentMethod,
        paymentStatus,
        receiptText: receiptLines,
      });

      Alert.alert(
        "Transaksi tersimpan",
        paymentStatus === "paid"
          ? "Pembayaran berhasil dicatat. Nota siap diprint."
          : "Pesanan disimpan sebagai pending. Nota siap diprint.",
      );
    } catch (error: any) {
      console.error("Checkout Error:", error);
      Alert.alert(
        "Checkout gagal",
        `Error: ${error?.message || "Transaksi belum bisa disimpan ke Firestore."}`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer scroll className="bg-[#FAF9F6]">
      <AppHeader
        title="Checkout"
        subtitle="Finalisasi pesanan & pilih metode pembayaran."
      />

      <View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* Buyer Info Card */}
        <View style={{ backgroundColor: '#fff', borderRadius: 32, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ width: 40, height: 40, backgroundColor: '#f2e4d1', borderRadius: 12, alignItems: 'center', justifyContent: "center", marginRight: 12 }}>
              <Text style={{ fontSize: 20 }}>👤</Text>
            </View>
            <View>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: '#2d2d2d' }}>Penerima</Text>
              <Text style={{ fontFamily: 'Poppins', fontSize: 12, color: '#888' }}>Pastikan nama sudah benar</Text>
            </View>
          </View>
          
          <TextInput
            style={{ 
              fontFamily: 'Poppins', 
              fontSize: 15, 
              backgroundColor: '#f9f9f9', 
              borderRadius: 18, 
              paddingHorizontal: 20, 
              paddingVertical: 15, 
              color: '#2d2d2d',
              borderWidth: 1,
              borderColor: '#f0f0f0'
            }}
            placeholder="Ketik nama pelanggan..."
            value={displayCustomerName}
            onChangeText={setCustomerName}
            editable={!completedOrder}
          />
        </View>

        {/* Total Amount Badge */}
        <View style={{ marginTop: 20, backgroundColor: '#c17d3c', borderRadius: 32, padding: 28, alignItems: 'center', shadowColor: '#c17d3c', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20, elevation: 8 }}>
          <Text style={{ fontFamily: 'Poppins', fontSize: 13, color: 'rgba(255,255,255,0.8)', letterSpacing: 2 }}>TOTAL BAYAR</Text>
          <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 42, color: '#fff', marginTop: 4 }}>
            {formatIDR(displayTotal)}
          </Text>
          {displayTable ? (
            <View style={{ marginTop: 12, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 100 }}>
              <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 12, color: '#fff' }}>
                {displayTable === "Bungkus" ? "🥡 BUNGKUS (TAKEAWAY)" : `🏠 MEJA ${displayTable}`}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Bill Summary Receipt Style */}
        <View style={{ marginTop: 24, backgroundColor: '#fff', borderRadius: 32, padding: 24, borderStyle: 'dashed', borderWidth: 1, borderColor: '#ddd' }}>
          <Text style={{ fontFamily: 'Poppins-Bold', fontSize: 16, color: '#2d2d2d', marginBottom: 20 }}>Ringkasan Tagihan</Text>
          
          <View style={{ gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Poppins', color: '#888', fontSize: 14 }}>Subtotal</Text>
              <Text style={{ fontFamily: 'Poppins-Bold', color: '#2d2d2d', fontSize: 14 }}>{formatIDR(displaySubtotal)}</Text>
            </View>
            
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontFamily: 'Poppins', color: '#888', fontSize: 14 }}>Diskon Manual</Text>
              <Text style={{ fontFamily: 'Poppins-Bold', color: '#e57373', fontSize: 14 }}>-{formatIDR(displayManualDiscount)}</Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontFamily: 'Poppins', color: '#888', fontSize: 14 }}>Promo {activePromo ? `(${activePromo.code})` : ''}</Text>
              </View>
              <Text style={{ fontFamily: 'Poppins-Bold', color: '#e57373', fontSize: 14 }}>-{formatIDR(displayPromoDiscount)}</Text>
            </View>

            <View style={{ height: 1, backgroundColor: '#f0f0f0', marginVertical: 8 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontFamily: 'Poppins-Bold', color: '#2d2d2d', fontSize: 16 }}>Total Akhir</Text>
              <Text style={{ fontFamily: 'Poppins-Bold', color: '#c17d3c', fontSize: 22 }}>{formatIDR(displayTotal)}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method Selector (Reverted to Original) */}
        {!completedOrder ? (
          <View className="mt-4 rounded-[28px] bg-white p-5">
            <Text className="text-lg font-poppins-bold text-brand-ink">
              Metode Pembayaran
            </Text>
            <View className="mt-3">
              {paymentOptions.map((option) => (
                <View className="mb-2" key={option}>
                  <AppButton
                    label={option.toUpperCase()}
                    onPress={() => setPaymentMethod(option)}
                    variant={paymentMethod === option ? "primary" : "ghost"}
                  />
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {paymentMethod === "qris" && !completedOrder ? (
          <View className="mt-4 rounded-[28px] bg-white p-5">
            <Text className="text-lg font-poppins-bold text-brand-ink">
              QRIS Manual
            </Text>
            <View className="mt-4 h-56 items-center justify-center rounded-[28px] border-2 border-dashed border-brand/25 bg-brand-soft">
              <Text className="text-2xl font-poppins-bold text-brand">
                QRIS STATIS
              </Text>
              <Text className="font-poppins mt-2 text-center text-brand-muted">
                Tempel QR merchant di area ini.
              </Text>
            </View>
            <View className="mt-4">
              <AppButton
                label={
                  paymentConfirmed
                    ? "Pembayaran Sudah Terkonfirmasi"
                    : "Sudah Dibayar"
                }
                onPress={() => setPaymentConfirmed(true)}
                variant={paymentConfirmed ? "secondary" : "ghost"}
              />
            </View>
          </View>
        ) : null}

        {paymentMethod === "transfer" && !completedOrder ? (
          <View className="mt-4 rounded-[28px] bg-white p-5">
            <Text className="text-lg font-poppins-bold text-brand-ink">
              Transfer Manual
            </Text>
            <Text className="font-poppins mt-2 text-base text-brand-muted">
              Tandai dibayar jika transfer sudah diverifikasi oleh kasir.
            </Text>
            <View className="mt-4">
              <AppButton
                label={
                  paymentConfirmed
                    ? "Transfer Sudah Dicek"
                    : "Tandai Sudah Dibayar"
                }
                onPress={() => setPaymentConfirmed(true)}
                variant={paymentConfirmed ? "secondary" : "ghost"}
              />
            </View>
          </View>
        ) : null}

        <View className="mt-4 rounded-[28px] bg-brand p-5">
          <Text className="text-sm font-poppins-semibold text-white/80">
            Status pembayaran
          </Text>
          <Text className="mt-2 text-2xl font-poppins-bold text-white">
            {displayPaymentStatus.toUpperCase()}
          </Text>
        </View>

        {!completedOrder ? (
          <View className="mt-4">
            <AppButton
              label={
                profile?.businessType === "restoran"
                  ? "Simpan Pesanan / Bayar"
                  : "Simpan Transaksi"
              }
              onPress={handleCheckout}
              loading={isSubmitting}
            />
          </View>
        ) : null}

        {completedOrder ? (
          <View className="mt-4 rounded-[28px] bg-white p-5">
            <Text className="text-lg font-poppins-bold text-brand-ink">
              Print Nota
            </Text>
            <Text className="font-poppins mt-1 text-sm text-brand-muted">
              Nota siap dicek atau dicetak dari perangkat kasir.
            </Text>

            <View className="mt-4 rounded-[24px] bg-brand-soft/30 p-4">
              <Text className="font-poppins font-mono text-xs leading-6 text-brand-ink">
                {completedOrder.receiptText}
              </Text>
            </View>

            <View className="mt-4">
              <AppButton
                label="Print Nota"
                onPress={handlePrintReceipt}
                variant="secondary"
              />
            </View>

            <View className="mt-3">
              <AppButton label="Selesai" onPress={handleDone} />
            </View>
          </View>
        ) : null}
      </View>
    </ScreenContainer>
  );
};
