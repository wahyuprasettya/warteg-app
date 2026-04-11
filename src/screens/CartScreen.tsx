import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, Pressable, Text, TextInput, View } from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { EmptyState } from "@/components/EmptyState";
import { ScreenContainer } from "@/components/ScreenContainer";
import { promoOptions as defaultPromoOptions } from "@/constants/promos";
import { useAuth } from "@/hooks/useAuth";
import { useCart } from "@/hooks/useCart";
import { AppStackParamList } from "@/types";
import {
  formatIDR,
  formatNumberInput,
  parseFormattedNumber,
} from "@/utils/currency";

type Props = NativeStackScreenProps<AppStackParamList, "Cart">;

export const CartScreen = ({ navigation }: Props) => {
  const { profile } = useAuth();
  const {
    activePromo,
    applyPromo,
    clearPromo,
    discountAmount,
    items,
    manualDiscount,
    note,
    promoDiscount,
    removeFromCart,
    setManualDiscount,
    setNote,
    subtotal,
    total,
    updateQty,
  } = useCart();

  return (
    <ScreenContainer scroll>
      <AppHeader
        title="Keranjang"
        subtitle="Tambahkan catatan pesanan lalu simpan atau lanjut pembayaran."
      />

      {items.length === 0 ? (
        <EmptyState
          title="Keranjang kosong"
          description="Pilih produk dulu agar transaksi bisa diproses."
        />
      ) : (
        <>
          {items.map((item) => (
            <View key={item.id} className="mb-3 rounded-[28px] bg-white p-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-1 pr-3">
                  <Text className="text-lg font-poppins-bold text-brand-ink">
                    {item.name}
                  </Text>
                  <Text className="font-poppins mt-1 text-sm text-brand-muted">
                    {formatIDR(item.price)} / item
                  </Text>
                </View>
                <Text className="text-lg font-poppins-bold text-brand">
                  {formatIDR(item.price * item.qty)}
                </Text>
              </View>

              <View className="mt-4 flex-row items-center justify-between">
                <View className="flex-row items-center">
                  <Pressable
                    className="rounded-2xl bg-brand px-4 py-3"
                    onPress={() => updateQty(item.id, item.qty - 1)}
                  >
                    <Text className="text-lg font-poppins-bold text-white">
                      -
                    </Text>
                  </Pressable>
                  <Text className="px-4 text-xl font-poppins-bold text-brand-ink">
                    {item.qty}
                  </Text>
                  <Pressable
                    className="rounded-2xl bg-brand px-4 py-3"
                    onPress={() => updateQty(item.id, item.qty + 1)}
                  >
                    <Text className="text-lg font-poppins-bold text-white">
                      +
                    </Text>
                  </Pressable>
                </View>

                <Pressable onPress={() => removeFromCart(item.id)}>
                  <Text className="font-poppins-semibold text-red-700">
                    Hapus
                  </Text>
                </Pressable>
              </View>
            </View>
          ))}

          <View className="rounded-[28px] bg-white p-4">
            <Text className="text-lg font-poppins-bold text-brand-ink">
              Catatan Pesanan
            </Text>
            <TextInput
              className="font-poppins mt-3 rounded-2xl border border-brand/15 px-4 py-4 text-base"
              placeholder="Contoh: sambal terpisah, no es, meja dekat jendela"
              multiline
              value={note}
              onChangeText={setNote}
              textAlignVertical="top"
            />
          </View>

          <View className="mt-4 rounded-[28px] bg-white p-4">
            <Text className="text-lg font-poppins-bold text-brand-ink">
              Diskon & Promo
            </Text>
            <Text className="font-poppins mt-1 text-sm text-brand-muted">
              Tambahkan diskon manual atau pilih promo yang cocok untuk
              transaksi ini.
            </Text>

            <View className="mt-4 rounded-[24px] bg-brand-soft/35 p-4">
              <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
                Diskon Manual
              </Text>
              <TextInput
                className="font-poppins mt-3 rounded-2xl border border-brand/15 bg-white px-4 py-4 text-base"
                placeholder="Masukkan nominal diskon"
                keyboardType="number-pad"
                value={
                  manualDiscount > 0 ? formatNumberInput(manualDiscount) : ""
                }
                onChangeText={(value) => {
                  setManualDiscount(parseFormattedNumber(value));
                }}
              />
            </View>

            <View className="mt-4">
              <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
                Promo Tersedia
              </Text>
              <View className="mt-3 flex-row flex-wrap">
                {(profile?.promos && profile.promos.length > 0
                  ? profile.promos
                  : defaultPromoOptions
                ).map((promo) => {
                  const isActive = activePromo?.code === promo.code;

                  return (
                    <Pressable
                      key={promo.code}
                      className={`mr-2 mb-2 rounded-full border px-4 py-2 ${
                        isActive
                          ? "border-brand bg-brand"
                          : "border-brand/10 bg-brand-soft/45"
                      }`}
                      onPress={() => {
                        const result = applyPromo(promo);
                        if (!result.ok && result.message) {
                          Alert.alert(
                            "Promo belum bisa dipakai",
                            result.message,
                          );
                        }
                      }}
                    >
                      <Text
                        className={`text-xs font-poppins-bold ${isActive ? "text-white" : "text-brand"}`}
                      >
                        {promo.code}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {activePromo ? (
              <View className="mt-3 rounded-[22px] border border-brand/10 bg-brand-soft/30 p-4">
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-sm font-poppins-bold text-brand-ink">
                      {activePromo.label}
                    </Text>
                    <Text className="font-poppins mt-1 text-xs leading-5 text-brand-muted">
                      {activePromo.description}
                    </Text>
                  </View>
                  <Pressable onPress={clearPromo}>
                    <Text className="text-xs font-poppins-semibold text-red-700">
                      Hapus
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </View>

          <View className="mt-4 rounded-[28px] bg-brand p-5">
            <Text className="text-sm font-poppins-semibold text-white/80">
              Ringkasan pembayaran
            </Text>
            <View className="mt-3 rounded-[22px] bg-white/10 p-4">
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-poppins text-sm text-white/75">
                  Subtotal
                </Text>
                <Text className="text-sm font-poppins-bold text-white">
                  {formatIDR(subtotal)}
                </Text>
              </View>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-poppins text-sm text-white/75">
                  Diskon manual
                </Text>
                <Text className="text-sm font-poppins-bold text-white">
                  -{formatIDR(manualDiscount)}
                </Text>
              </View>
              <View className="mb-2 flex-row items-center justify-between">
                <Text className="font-poppins text-sm text-white/75">
                  Promo
                </Text>
                <Text className="text-sm font-poppins-bold text-white">
                  -{formatIDR(promoDiscount)}
                </Text>
              </View>
              <View className="mt-3 h-px bg-white/10" />
              <View className="mt-3 flex-row items-center justify-between">
                <Text className="text-sm font-poppins-semibold text-white/80">
                  Total pembayaran
                </Text>
                <Text className="text-3xl font-poppins-bold text-white">
                  {formatIDR(total)}
                </Text>
              </View>
            </View>
            {discountAmount > 0 ? (
              <Text className="mt-3 text-xs font-poppins-semibold text-white/70">
                Potongan aktif sebesar {formatIDR(discountAmount)}.
              </Text>
            ) : null}
          </View>

          <View className="mt-4">
            <AppButton
              label="Lanjut Checkout"
              onPress={() => navigation.navigate("Checkout")}
            />
          </View>
        </>
      )}
    </ScreenContainer>
  );
};
