import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState } from "react";
import { Alert, Share, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { ScreenContainer } from "@/components/ScreenContainer";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { addTransaction } from "@/services/firestoreService";
import { AppStackParamList, PaymentMethod } from "@/types";
import { formatIDR } from "@/utils/currency";

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
  } = useCart();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState<CompletedOrder | null>(null);

  const paymentStatus = useMemo(() => {
    if (paymentMethod === "cash") {
      return "paid";
    }

    return paymentConfirmed ? "paid" : "pending";
  }, [paymentConfirmed, paymentMethod]);

  const displaySubtotal = completedOrder?.subtotal ?? subtotal;
  const displayManualDiscount = completedOrder?.manualDiscount ?? manualDiscount;
  const displayPromoDiscount = completedOrder?.promoDiscount ?? promoDiscount;
  const displayDiscountAmount = completedOrder?.discountAmount ?? discountAmount;
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
      Alert.alert("Print nota gagal", "Nota belum bisa dibagikan dari perangkat ini.");
    }
  };

  const handleDone = () => {
    clearCart();

    if (profile?.businessType === "restoran") {
      navigation.navigate("Table");
    } else if (profile?.businessType === "warteg") {
      navigation.navigate("Warteg");
    } else {
      navigation.navigate("POS");
    }
  };

  const handleCheckout = async () => {
    if (!authUser || !profile?.businessType || items.length === 0) {
      return;
    }

    try {
      setIsSubmitting(true);
      await addTransaction({
        userId: authUser.uid,
        items,
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
        businessType: profile.businessType,
        tableNumber: activeTable,
        note,
      });

      const receiptLines = [
        "WARTEG POS",
        "------------------------------",
        `Kasir   : ${profile.email?.split("@")[0] || "Kasir"}`,
        `Pembeli : ${customerName.trim() || "-"}`,
        activeTable ? `Meja    : ${activeTable}` : null,
        `Metode  : ${paymentMethod.toUpperCase()}`,
        "------------------------------",
        ...items.map((item) => `${item.name} x${item.qty}  ${formatIDR(item.price * item.qty)}`),
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
        cashierName: profile.email?.split("@")[0] || "Kasir",
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
    } catch (error) {
      Alert.alert("Checkout gagal", "Transaksi belum bisa disimpan ke Firestore.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenContainer scroll>
      <AppHeader
        title="Checkout"
        subtitle="Pilih metode pembayaran, lalu simpan transaksi."
      />

      <View className="rounded-[28px] bg-white p-5">
        <Text className="text-lg font-poppins-bold text-brand-ink">Data Pembeli</Text>
        <Text className="mt-1 text-sm text-brand-muted">
          Isi nama pembeli agar nota lebih rapi dan mudah dilacak.
        </Text>
        <TextInput
          className="mt-4 rounded-2xl border border-brand/15 px-4 py-4 text-base"
          placeholder="Nama pembeli"
          value={displayCustomerName}
          onChangeText={setCustomerName}
          editable={!completedOrder}
        />
        {completedOrder?.cashierName ? (
          <View className="mt-4 rounded-2xl bg-brand-soft/40 px-4 py-3">
            <Text className="text-xs uppercase tracking-[1px] text-brand-muted">Kasir</Text>
            <Text className="mt-1 text-base font-poppins-semibold text-brand-ink">
              {completedOrder.cashierName}
            </Text>
          </View>
        ) : null}
      </View>

      <View className="mt-4 rounded-[28px] bg-white p-5">
        <Text className="text-base text-brand-muted">Total bayar</Text>
        <Text className="mt-2 text-4xl font-poppins-bold text-brand">{formatIDR(displayTotal)}</Text>
        {displayTable ? <Text className="mt-2 text-base text-brand-muted">{displayTable}</Text> : null}
      </View>

      <View className="mt-4 rounded-[28px] bg-white p-5">
        <Text className="text-lg font-poppins-bold text-brand-ink">Ringkasan Tagihan</Text>
        <View className="mt-4">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm text-brand-muted">Subtotal</Text>
            <Text className="text-sm font-poppins-bold text-brand-ink">{formatIDR(displaySubtotal)}</Text>
          </View>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm text-brand-muted">Diskon manual</Text>
            <Text className="text-sm font-poppins-bold text-brand-ink">-{formatIDR(displayManualDiscount)}</Text>
          </View>
          <View className="mb-3 flex-row items-center justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-sm text-brand-muted">Promo</Text>
              {activePromo ? (
                <Text className="mt-1 text-xs text-brand-muted">{activePromo.code} • {activePromo.label}</Text>
              ) : null}
            </View>
            <Text className="text-sm font-poppins-bold text-brand-ink">-{formatIDR(displayPromoDiscount)}</Text>
          </View>
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm font-poppins-semibold text-brand-ink">Total diskon</Text>
            <Text className="text-sm font-poppins-bold text-brand">-{formatIDR(displayDiscountAmount)}</Text>
          </View>
          <View className="h-px bg-brand/10" />
          <View className="mt-3 flex-row items-center justify-between">
            <Text className="text-sm font-poppins-semibold text-brand-ink">Total akhir</Text>
            <Text className="text-xl font-poppins-bold text-brand">{formatIDR(displayTotal)}</Text>
          </View>
        </View>
      </View>

      {!completedOrder ? (
        <View className="mt-4 rounded-[28px] bg-white p-5">
          <Text className="text-lg font-poppins-bold text-brand-ink">Metode Pembayaran</Text>
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
          <Text className="text-lg font-poppins-bold text-brand-ink">QRIS Manual</Text>
          <View className="mt-4 h-56 items-center justify-center rounded-[28px] border-2 border-dashed border-brand/25 bg-brand-soft">
            <Text className="text-2xl font-poppins-bold text-brand">QRIS STATIS</Text>
            <Text className="mt-2 text-center text-brand-muted">Tempel QR merchant di area ini.</Text>
          </View>
          <View className="mt-4">
            <AppButton
              label={paymentConfirmed ? "Pembayaran Sudah Terkonfirmasi" : "Sudah Dibayar"}
              onPress={() => setPaymentConfirmed(true)}
              variant={paymentConfirmed ? "secondary" : "ghost"}
            />
          </View>
        </View>
      ) : null}

      {paymentMethod === "transfer" && !completedOrder ? (
        <View className="mt-4 rounded-[28px] bg-white p-5">
          <Text className="text-lg font-poppins-bold text-brand-ink">Transfer Manual</Text>
          <Text className="mt-2 text-base text-brand-muted">
            Tandai dibayar jika transfer sudah diverifikasi oleh kasir.
          </Text>
          <View className="mt-4">
            <AppButton
              label={paymentConfirmed ? "Transfer Sudah Dicek" : "Tandai Sudah Dibayar"}
              onPress={() => setPaymentConfirmed(true)}
              variant={paymentConfirmed ? "secondary" : "ghost"}
            />
          </View>
        </View>
      ) : null}

      <View className="mt-4 rounded-[28px] bg-brand p-5">
        <Text className="text-sm font-poppins-semibold text-white/80">Status pembayaran</Text>
        <Text className="mt-2 text-2xl font-poppins-bold text-white">{displayPaymentStatus.toUpperCase()}</Text>
      </View>

      {!completedOrder ? (
        <View className="mt-4">
          <AppButton
            label={profile?.businessType === "restoran" ? "Simpan Pesanan / Bayar" : "Simpan Transaksi"}
            onPress={handleCheckout}
            loading={isSubmitting}
          />
        </View>
      ) : null}

      {completedOrder ? (
        <View className="mt-4 rounded-[28px] bg-white p-5">
          <Text className="text-lg font-poppins-bold text-brand-ink">Print Nota</Text>
          <Text className="mt-1 text-sm text-brand-muted">
            Nota siap dicek atau dicetak dari perangkat kasir.
          </Text>

          <View className="mt-4 rounded-[24px] bg-brand-soft/30 p-4">
            <Text className="font-mono text-xs leading-6 text-brand-ink">{completedOrder.receiptText}</Text>
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
    </ScreenContainer>
  );
};
