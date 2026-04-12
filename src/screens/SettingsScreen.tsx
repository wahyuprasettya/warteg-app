import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useMemo, useState, useEffect } from "react";
import {
  Alert,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";

import { AppButton } from "@/components/AppButton";
import { AppHeader } from "@/components/AppHeader";
import { ScreenContainer } from "@/components/ScreenContainer";
import { promoOptions as defaultPromos } from "@/constants/promos";
import { useAuth } from "@/hooks/useAuth";
import { logout } from "@/services/authService";
import { CLOSING_HOUR, updateStoreSettings, updateStoreTables, subscribeTables } from "@/services/firestoreService";
import {
  AppStackParamList,
  OutletProfile,
  PaymentMethod,
  PromoDefinition,
  PromoType,
} from "@/types";
import { formatNumberInput, parseFormattedNumber } from "@/utils/currency";

type Props = NativeStackScreenProps<AppStackParamList, "Settings">;

const allPaymentMethods: PaymentMethod[] = ["cash", "qris", "transfer"];

const paymentLabels: Record<PaymentMethod, string> = {
  cash: "Tunai",
  qris: "QRIS",
  transfer: "Transfer",
};

export const SettingsScreen = ({ navigation }: Props) => {
  const { authUser, profile, refreshProfile } = useAuth();
  const isOwner = profile?.role === "owner";
  const isPrimaryOwner = isOwner && !profile?.ownerId?.trim();

  const [storeName, setStoreName] = useState(profile?.storeName ?? "Warteg POS");
  const [storeAddress, setStoreAddress] = useState(profile?.storeAddress ?? "");
  const [storeLogoUrl, setStoreLogoUrl] = useState(profile?.storeLogoUrl ?? "");
  const [openHour, setOpenHour] = useState(String(profile?.openHour ?? 8));
  const [closingHour, setClosingHour] = useState(
    String(profile?.closingHour ?? CLOSING_HOUR),
  );
  const [taxPercent, setTaxPercent] = useState(
    String(profile?.taxPercent ?? 0),
  );
  const [serviceChargePercent, setServiceChargePercent] = useState(
    String(profile?.serviceChargePercent ?? 0),
  );
  const [lowStockAlertThreshold, setLowStockAlertThreshold] = useState(
    String(profile?.lowStockAlertThreshold ?? 5),
  );
  const [estimatedProfitMarginPercent, setEstimatedProfitMarginPercent] =
    useState(String(profile?.estimatedProfitMarginPercent ?? 30));
  const [enabledPaymentMethods, setEnabledPaymentMethods] = useState<
    PaymentMethod[]
  >(profile?.enabledPaymentMethods ?? allPaymentMethods);
  const [promos, setPromos] = useState<PromoDefinition[]>(
    profile?.promos ?? defaultPromos,
  );
  const [categories, setCategories] = useState<string[]>(
    profile?.categories ?? ["Makanan", "Minuman", "Cemilan", "Paket"],
  );
  const [outlets, setOutlets] = useState<OutletProfile[]>(
    profile?.outlets?.length
      ? profile.outlets
      : [{ id: "utama", name: "Outlet Utama" }],
  );
  const [ownerId, setOwnerId] = useState(profile?.ownerId ?? "");
  const [tables, setTables] = useState<string[]>([]);
  const [newTableNumber, setNewTableNumber] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoLabel, setNewPromoLabel] = useState("");
  const [newPromoType, setNewPromoType] = useState<PromoType>("percentage");
  const [newPromoValue, setNewPromoValue] = useState("");
  const [newPromoMinSubtotal, setNewPromoMinSubtotal] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newOutletName, setNewOutletName] = useState("");
  const [newOutletAddress, setNewOutletAddress] = useState("");

  useEffect(() => {
    if (authUser?.uid) {
      const unsub = subscribeTables(authUser.uid, (list) => {
        setTables(list);
      });
      return unsub;
    }
  }, [authUser]);

  const handleLogout = () => {
    Alert.alert(
      "Konfirmasi Logout",
      "Apakah Anda yakin ingin keluar?",
      [
        { text: "Batal", style: "cancel" },
        { 
          text: "Keluar", 
          style: "destructive", 
          onPress: async () => {
            try {
              await logout();
            } catch (error) {
              Alert.alert("Error", "Gagal logout.");
            }
          } 
        }
      ]
    );
  };

  const outletSummary = useMemo(() => {
    if (outlets.length <= 1) {
      return "1 outlet aktif";
    }

    return `${outlets.length} outlet terdaftar`;
  }, [outlets]);

  const handleAddPromo = () => {
    if (!newPromoCode || !newPromoLabel || !newPromoValue) {
      Alert.alert(
        "Data belum lengkap",
        "Kode, Label, dan Nilai promo wajib diisi.",
      );
      return;
    }

    const valueNum = parseFormattedNumber(newPromoValue);
    if (valueNum <= 0) {
      Alert.alert("Nilai tidak valid", "Nilai potongan harus lebih dari 0.");
      return;
    }

    const newPromo: PromoDefinition = {
      code: newPromoCode.toUpperCase(),
      label: newPromoLabel.trim(),
      description: `Diskon ${
        newPromoType === "percentage" ? `${valueNum}%` : `Rp${valueNum}`
      }`,
      type: newPromoType,
      value: valueNum,
      minSubtotal: parseFormattedNumber(newPromoMinSubtotal) || undefined,
    };

    setPromos((prev) => [...prev, newPromo]);
    setNewPromoCode("");
    setNewPromoLabel("");
    setNewPromoValue("");
    setNewPromoMinSubtotal("");
  };

  const handleRemovePromo = (index: number) => {
    setPromos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      Alert.alert("Gagal", "Kategori sudah ada.");
      return;
    }
    setCategories((prev) => [...prev, trimmed]);
    setNewCategory("");
  };

  const handleRemoveCategory = (catToRemove: string) => {
    setCategories((prev) => prev.filter((cat) => cat !== catToRemove));
  };

  const handleTogglePaymentMethod = (method: PaymentMethod) => {
    setEnabledPaymentMethods((prev) =>
      prev.includes(method)
        ? prev.filter((item) => item !== method)
        : [...prev, method],
    );
  };

  const handleAddOutlet = () => {
    const name = newOutletName.trim();
    const address = newOutletAddress.trim();

    if (!name) {
      Alert.alert("Outlet belum lengkap", "Nama outlet wajib diisi.");
      return;
    }

    setOutlets((prev) => [
      ...prev,
      {
        id: `${name.toLowerCase().replace(/\s+/g, "-")}-${prev.length + 1}`,
        name,
        address: address || undefined,
      },
    ]);
    setNewOutletName("");
    setNewOutletAddress("");
  };

  const handleRemoveOutlet = (outletId: string) => {
    if (outlets.length === 1) {
      Alert.alert("Minimal satu outlet", "Owner harus punya minimal satu outlet aktif.");
      return;
    }

    setOutlets((prev) => prev.filter((outlet) => outlet.id !== outletId));
  };

  const handleAddTable = () => {
    const trimmed = newTableNumber.trim();
    if (!trimmed) return;
    if (tables.includes(trimmed)) {
      Alert.alert("Gagal", "Nomor meja sudah ada.");
      return;
    }
    setTables((prev) => [...prev, trimmed].sort((a, b) => {
        const numA = parseInt(a, 10);
        const numB = parseInt(b, 10);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
    }));
    setNewTableNumber("");
  };

  const handleRemoveTable = (tableToRemove: string) => {
    setTables((prev) => prev.filter((t) => t !== tableToRemove));
  };

  const handleAutoGenerateTables = () => {
    Alert.prompt(
      "Generate Meja Otomatis",
      "Masukkan jumlah meja yang ingin dibuat (1 - 50):",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Generate",
          onPress: (value) => {
            const count = parseInt(value || "0", 10);
            if (isNaN(count) || count <= 0 || count > 50) {
              Alert.alert("Gagal", "Jumlah meja tidak valid (maksimal 50).");
              return;
            }
            const newTableList = Array.from({ length: count }, (_, i) => String(i + 1));
            setTables(newTableList);
          },
        },
      ],
      "plain-text",
      "",
      "number-pad"
    );
  };

  const handleSave = async () => {
    if (!authUser || !isOwner) return;

    const open = parseInt(openHour, 10);
    const close = parseInt(closingHour, 10);
    const tax = parseInt(taxPercent || "0", 10);
    const service = parseInt(serviceChargePercent || "0", 10);
    const lowStock = parseInt(lowStockAlertThreshold || "0", 10);
    const margin = parseInt(estimatedProfitMarginPercent || "0", 10);

    if (!storeName.trim()) {
      Alert.alert("Nama toko belum diisi", "Nama toko wajib diisi untuk identitas owner.");
      return;
    }

    if ([open, close].some((hour) => Number.isNaN(hour) || hour < 0 || hour > 23)) {
      Alert.alert(
        "Jam tidak valid",
        "Masukkan jam operasional dan closing antara 0 sampai 23.",
      );
      return;
    }

    if ([tax, service, lowStock, margin].some((value) => Number.isNaN(value) || value < 0)) {
      Alert.alert("Nilai tidak valid", "Pajak, service, stok minimum, dan margin harus bernilai 0 atau lebih.");
      return;
    }

    if (enabledPaymentMethods.length === 0) {
      Alert.alert("Metode pembayaran kosong", "Pilih minimal satu metode pembayaran.");
      return;
    }

    try {
      setIsSaving(true);
      await updateStoreSettings(authUser.uid, {
        storeName: storeName.trim(),
        storeAddress: storeAddress.trim(),
        storeLogoUrl: storeLogoUrl.trim(),
        openHour: open,
        closingHour: close,
        taxPercent: tax,
        serviceChargePercent: service,
        lowStockAlertThreshold: lowStock,
        estimatedProfitMarginPercent: margin,
        enabledPaymentMethods,
        outlets,
        promos,
        categories,
      });

      // Save tables separately
      await updateStoreTables(authUser.uid, tables);

      await refreshProfile();
      Alert.alert("Berhasil", "Pengaturan owner berhasil disimpan.");
      navigation.goBack();
    } catch (error) {
      Alert.alert(
        "Gagal menyimpan",
        "Terjadi kesalahan saat menyimpan pengaturan owner.",
      );
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOwner) {
    return (
      <ScreenContainer scroll>
        <AppHeader
          title="Pengaturan"
          subtitle="Akses kasir dibatasi. Pengaturan inti toko hanya bisa diubah owner."
        />

        <View className="rounded-[28px] bg-white p-5">
          <Text className="text-lg font-poppins-bold text-brand-ink">
            Akses Terbatas
          </Text>
          <Text className="mt-2 font-poppins text-sm leading-6 text-brand-muted">
            Owner mengelola nama toko, metode pembayaran, promo, kategori, outlet,
            stok minimum, dan pengaturan laporan dari layar ini. Akun kasir tetap
            bisa melanjutkan penjualan tanpa mengubah konfigurasi inti bisnis.
          </Text>

          <View className="mt-4 rounded-[22px] bg-brand-soft/35 p-4">
            <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              Ringkasan Toko
            </Text>
            <Text className="mt-2 text-base font-poppins-bold text-brand-ink">
              {profile?.storeName || "Warteg POS"}
            </Text>
            <Text className="mt-1 font-poppins text-sm text-brand-muted">
              Jam operasional {profile?.openHour ?? 8}.00 - {profile?.closingHour ?? CLOSING_HOUR}.00
            </Text>
          </View>

          <View className="mt-4 rounded-[22px] border border-brand/10 bg-white p-4">
            <Text className="text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              ID Owner Toko
            </Text>
            <Text className="mt-2 font-poppins text-sm leading-6 text-brand-muted">
              Hubungkan akun kasir ke UID owner agar menu, pesanan, dan transaksi terbaca dari toko yang sama.
            </Text>
            <TextInput
              className="font-poppins mt-4 rounded-2xl border border-brand/15 px-4 py-4 text-base"
              placeholder="Masukkan UID owner toko"
              value={ownerId}
              onChangeText={setOwnerId}
              autoCapitalize="none"
            />
            <Text className="mt-3 font-mono text-[11px] text-brand-muted">
              UID akun kasir ini: {authUser?.uid || "-"}
            </Text>
            <Pressable
              className={`mt-4 rounded-2xl px-4 py-4 ${isSaving ? "bg-brand/50" : "bg-brand"}`}
              disabled={isSaving || !authUser}
              onPress={async () => {
                if (!authUser) {
                  return;
                }

                try {
                  setIsSaving(true);
                  await updateStoreSettings(authUser.uid, {
                    ownerId,
                    role: "kasir",
                  });
                  await refreshProfile();
                  Alert.alert("Berhasil", "ID owner toko berhasil disimpan.");
                } catch (error) {
                  Alert.alert("Gagal menyimpan", "ID owner toko belum berhasil disimpan.");
                } finally {
                  setIsSaving(false);
                }
              }}
            >
              <Text className="text-center font-poppins-bold text-white">
                {isSaving ? "Menyimpan..." : "Simpan ID Owner"}
              </Text>
            </Pressable>
          </View>
          
          <View className="mt-8 mb-4">
            <Pressable
              onPress={handleLogout}
              className="rounded-2xl border border-red-200 bg-red-50 p-4"
            >
              <Text className="text-center font-poppins-bold text-red-600">
                Logout Akun
              </Text>
            </Pressable>
          </View>

        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer scroll>
      <AppHeader
        title="Pengaturan Owner"
        subtitle="Kelola profil toko, operasional, pembayaran, promo, kategori, dan outlet."
      />

      {isPrimaryOwner ? (
        <View className="mb-4 rounded-[28px] border border-brand/10 bg-white p-5">
          <Text className="text-lg font-poppins-bold text-brand-ink">
            Akses Owner
          </Text>
          <Text className="mt-1 text-sm font-poppins text-brand-muted">
            Tambah owner tambahan, ubah nama login, dan nonaktifkan akses dari sini.
          </Text>
          <View className="mt-4">
            <AppButton
              label="Kelola Owner"
              onPress={() => navigation.navigate("OwnerManagement")}
              variant="secondary"
            />
          </View>
        </View>
      ) : null}

      <View className="mb-4 rounded-[28px] bg-white p-5">
        <Text className="text-lg font-poppins-bold text-brand-ink">
          Profil Toko
        </Text>
        <Text className="font-poppins mt-1 text-sm text-brand-muted">
          Informasi ini membantu owner menjaga identitas toko dan outlet tetap konsisten.
        </Text>

        <TextInput
          className="font-poppins mt-4 rounded-2xl border border-brand/15 px-4 py-4 text-base"
          placeholder="Nama toko"
          value={storeName}
          onChangeText={setStoreName}
        />
        <TextInput
          className="font-poppins mt-3 rounded-2xl border border-brand/15 px-4 py-4 text-base"
          placeholder="Alamat toko"
          value={storeAddress}
          onChangeText={setStoreAddress}
          multiline
        />
        <TextInput
          className="font-poppins mt-3 rounded-2xl border border-brand/15 px-4 py-4 text-base"
          placeholder="URL logo toko (opsional)"
          value={storeLogoUrl}
          onChangeText={setStoreLogoUrl}
          autoCapitalize="none"
        />
      </View>

      <View className="mb-4 rounded-[28px] bg-white p-5">
        <Text className="text-lg font-poppins-bold text-brand-ink">
          Operasional & Biaya
        </Text>

        <View className="mt-4 flex-row">
          <View className="mr-2 flex-1">
            <Text className="mb-2 text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              Buka
            </Text>
            <TextInput
              className="font-poppins rounded-2xl border border-brand/15 px-4 py-4 text-base"
              placeholder="08"
              keyboardType="number-pad"
              value={openHour}
              onChangeText={setOpenHour}
              maxLength={2}
            />
          </View>
          <View className="ml-2 flex-1">
            <Text className="mb-2 text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              Closing
            </Text>
            <TextInput
              className="font-poppins rounded-2xl border border-brand/15 px-4 py-4 text-base"
              placeholder="21"
              keyboardType="number-pad"
              value={closingHour}
              onChangeText={setClosingHour}
              maxLength={2}
            />
          </View>
        </View>

        <View className="mt-3 flex-row">
          <View className="mr-2 flex-1">
            <Text className="mb-2 text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              Pajak %
            </Text>
            <TextInput
              className="font-poppins rounded-2xl border border-brand/15 px-4 py-4 text-base"
              placeholder="0"
              keyboardType="number-pad"
              value={taxPercent}
              onChangeText={setTaxPercent}
            />
          </View>
          <View className="ml-2 flex-1">
            <Text className="mb-2 text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              Service %
            </Text>
            <TextInput
              className="font-poppins rounded-2xl border border-brand/15 px-4 py-4 text-base"
              placeholder="0"
              keyboardType="number-pad"
              value={serviceChargePercent}
              onChangeText={setServiceChargePercent}
            />
          </View>
        </View>

        <View className="mt-3 flex-row">
          <View className="mr-2 flex-1">
            <Text className="mb-2 text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              Alert Stok Minimum
            </Text>
            <TextInput
              className="font-poppins rounded-2xl border border-brand/15 px-4 py-4 text-base"
              placeholder="5"
              keyboardType="number-pad"
              value={lowStockAlertThreshold}
              onChangeText={setLowStockAlertThreshold}
            />
          </View>
          <View className="ml-2 flex-1">
            <Text className="mb-2 text-xs font-poppins-semibold uppercase tracking-wide text-brand-muted">
              Margin Profit %
            </Text>
            <TextInput
              className="font-poppins rounded-2xl border border-brand/15 px-4 py-4 text-base"
              placeholder="30"
              keyboardType="number-pad"
              value={estimatedProfitMarginPercent}
              onChangeText={setEstimatedProfitMarginPercent}
            />
          </View>
        </View>
      </View>

      <View className="mb-4 rounded-[28px] bg-white p-5">
        <Text className="text-lg font-poppins-bold text-brand-ink">
          Metode Pembayaran
        </Text>
        <Text className="font-poppins mt-1 mb-4 text-sm text-brand-muted">
          Hanya metode yang aktif di sini yang akan muncul di checkout kasir dan pembayaran order.
        </Text>

        {allPaymentMethods.map((method) => {
          const active = enabledPaymentMethods.includes(method);
          return (
            <View
              key={method}
              className="mb-3 flex-row items-center justify-between rounded-[22px] border border-brand/10 p-4"
            >
              <View className="flex-1 pr-3">
                <Text className="text-base font-poppins-bold text-brand-ink">
                  {paymentLabels[method]}
                </Text>
                <Text className="mt-1 font-poppins text-xs text-brand-muted">
                  {active ? "Aktif untuk transaksi." : "Disembunyikan dari kasir."}
                </Text>
              </View>
              <Switch
                value={active}
                onValueChange={() => handleTogglePaymentMethod(method)}
                trackColor={{ false: "#e0e0e0", true: "#A63D40" }}
                thumbColor="#ffffff"
              />
            </View>
          );
        })}
      </View>

      <View className="mb-4 rounded-[28px] bg-white p-5">
        <Text className="text-lg font-poppins-bold text-brand-ink">
          Daftar Promo & Diskon
        </Text>
        <Text className="font-poppins mt-1 mb-4 text-sm text-brand-muted">
          Owner bisa menentukan promo aktif beserta syarat minimal belanja.
        </Text>

        {promos.length === 0 ? (
          <Text className="font-poppins text-sm italic text-brand-muted mb-4">
            Belum ada promo. Tambahkan di bawah.
          </Text>
        ) : (
          promos.map((promo, index) => (
            <View
              key={`${promo.code}-${index}`}
              className="mb-3 flex-row items-center justify-between rounded-2xl border border-brand/10 bg-brand-soft/30 p-4"
            >
              <View className="flex-1 pr-3">
                <Text className="text-base font-poppins-bold text-brand-ink">
                  {promo.label} ({promo.code})
                </Text>
                <Text className="font-poppins text-xs text-brand-muted mt-1">
                  {promo.description}
                </Text>
              </View>
              <Pressable
                onPress={() => handleRemovePromo(index)}
                className="rounded-full bg-red-100 px-3 py-2"
              >
                <Text className="text-xs font-poppins-semibold text-red-700">
                  Hapus
                </Text>
              </Pressable>
            </View>
          ))
        )}

        <View className="mt-2 rounded-2xl border border-brand/20 p-4">
          <Text className="text-sm font-poppins-bold text-brand-ink mb-3">
            Tambah Promo Baru
          </Text>

          <TextInput
            className="font-poppins mb-3 rounded-xl border border-brand/15 px-3 py-2 text-sm"
            placeholder="Kode Promo"
            value={newPromoCode}
            onChangeText={setNewPromoCode}
            autoCapitalize="characters"
          />
          <TextInput
            className="font-poppins mb-3 rounded-xl border border-brand/15 px-3 py-2 text-sm"
            placeholder="Label Promo"
            value={newPromoLabel}
            onChangeText={setNewPromoLabel}
          />

          <View className="mb-3 flex-row">
            <Pressable
              className={`flex-1 items-center rounded-l-xl border py-2 ${newPromoType === "percentage" ? "bg-brand border-brand" : "bg-white border-brand/15"}`}
              onPress={() => setNewPromoType("percentage")}
            >
              <Text
                className={`text-sm font-poppins-bold ${newPromoType === "percentage" ? "text-white" : "text-brand-muted"}`}
              >
                Persen (%)
              </Text>
            </Pressable>
            <Pressable
              className={`flex-1 items-center rounded-r-xl border-t border-b border-r py-2 ${newPromoType === "nominal" ? "bg-brand border-brand" : "bg-white border-brand/15"}`}
              onPress={() => setNewPromoType("nominal")}
            >
              <Text
                className={`text-sm font-poppins-bold ${newPromoType === "nominal" ? "text-white" : "text-brand-muted"}`}
              >
                Nominal (Rp)
              </Text>
            </Pressable>
          </View>

          <TextInput
            className="font-poppins mb-3 rounded-xl border border-brand/15 px-3 py-2 text-sm"
            placeholder={newPromoType === "percentage" ? "Nilai Persen" : "Nilai Rupiah"}
            keyboardType="number-pad"
            value={
              newPromoValue > ""
                ? formatNumberInput(parseFormattedNumber(newPromoValue))
                : ""
            }
            onChangeText={setNewPromoValue}
          />
          <TextInput
            className="font-poppins mb-3 rounded-xl border border-brand/15 px-3 py-2 text-sm"
            placeholder="Minimal Belanja (Opsional)"
            keyboardType="number-pad"
            value={
              newPromoMinSubtotal > ""
                ? formatNumberInput(parseFormattedNumber(newPromoMinSubtotal))
                : ""
            }
            onChangeText={setNewPromoMinSubtotal}
          />

          <AppButton
            label="Tambah Promo"
            onPress={handleAddPromo}
            variant="secondary"
          />
        </View>
      </View>

      <View className="mb-4 rounded-[28px] bg-white p-5">
        <Text className="text-lg font-poppins-bold text-brand-ink">
          Kategori Produk
        </Text>
        <Text className="font-poppins mt-1 mb-4 text-sm text-brand-muted">
          Kategori ini dipakai owner untuk menjaga katalog tetap rapi.
        </Text>

        <View className="mb-4 flex-row flex-wrap">
          {categories.map((cat) => (
            <Pressable
              key={cat}
              onPress={() => handleRemoveCategory(cat)}
              className="mr-2 mb-2 flex-row items-center rounded-full border border-brand/10 bg-brand-soft/50 px-3 py-1.5"
            >
              <Text className="mr-2 font-poppins text-sm text-brand-ink">{cat}</Text>
              <Text className="font-poppins text-xs font-bold text-red-500">x</Text>
            </Pressable>
          ))}
        </View>

        <View className="flex-row items-center">
          <TextInput
            className="mr-2 flex-1 font-poppins rounded-xl border border-brand/15 px-4 py-3 text-sm"
            placeholder="Tambah kategori..."
            value={newCategory}
            onChangeText={setNewCategory}
            onSubmitEditing={handleAddCategory}
          />
          <Pressable onPress={handleAddCategory} className="rounded-xl bg-brand px-4 py-3">
            <Text className="font-poppins text-sm font-bold text-white">Tambah</Text>
          </Pressable>
        </View>
      </View>

      <View className="mb-4 rounded-[28px] bg-white p-5">
        <View className="flex-row items-center justify-between mb-2">
           <Text className="text-lg font-poppins-bold text-brand-ink">
             Daftar Meja Restoran
           </Text>
           <View className="rounded-full bg-emerald-50 px-2 py-1">
             <Text className="text-[10px] font-poppins-bold text-emerald-600 uppercase">Live Sync ⚡</Text>
           </View>
        </View>
        
        <Text className="font-poppins text-sm text-brand-muted mb-4">
          Data meja saat ini dikelola melalui <Text className="font-poppins-bold text-brand">Dashboard Web Admin</Text>. Perubahan yang Anda buat di web akan otomatis muncul di sini.
        </Text>

        <View className="flex-row flex-wrap">
          {tables.length === 0 ? (
            <Text className="font-poppins text-xs italic text-brand-muted">
              Belum ada meja yang terdaftar di Web.
            </Text>
          ) : (
            tables.map((table) => (
              <View
                key={table}
                className="mr-2 mb-2 rounded-full border border-brand/10 bg-brand-soft/30 px-3 py-1.5"
              >
                <Text className="font-poppins-bold text-xs text-brand">Meja {table}</Text>
              </View>
            ))
          )}
        </View>
      </View>


      {/*
        Multi outlet sementara dimatikan dulu.
        Blok ini tetap disimpan agar mudah diaktifkan lagi nanti.
      */}
      {false && (
        <View className="mb-4 rounded-[28px] bg-white p-5">
          <Text className="text-lg font-poppins-bold text-brand-ink">
            Multi Outlet
          </Text>
          <Text className="font-poppins mt-1 text-sm text-brand-muted">
            {outletSummary}. Owner bisa menyiapkan daftar cabang dari satu layar.
          </Text>

          <View className="mt-4">
            {outlets.map((outlet) => (
              <View
                key={outlet.id}
                className="mb-3 rounded-[22px] border border-brand/10 bg-brand-soft/25 p-4"
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-1 pr-3">
                    <Text className="text-base font-poppins-bold text-brand-ink">
                      {outlet.name}
                    </Text>
                    <Text className="mt-1 font-poppins text-xs text-brand-muted">
                      {outlet.address || "Alamat outlet belum diisi."}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleRemoveOutlet(outlet.id)}
                    className="rounded-full bg-red-100 px-3 py-2"
                  >
                    <Text className="text-xs font-poppins-semibold text-red-700">
                      Hapus
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>

          <View className="rounded-[22px] border border-brand/15 p-4">
            <Text className="mb-3 text-sm font-poppins-bold text-brand-ink">
              Tambah Outlet
            </Text>
            <TextInput
              className="font-poppins mb-3 rounded-xl border border-brand/15 px-3 py-2 text-sm"
              placeholder="Nama outlet"
              value={newOutletName}
              onChangeText={setNewOutletName}
            />
            <TextInput
              className="font-poppins mb-3 rounded-xl border border-brand/15 px-3 py-2 text-sm"
              placeholder="Alamat outlet (opsional)"
              value={newOutletAddress}
              onChangeText={setNewOutletAddress}
            />
            <AppButton
              label="Tambah Outlet"
              onPress={handleAddOutlet}
              variant="secondary"
            />
          </View>
        </View>
      )}

      <View className="mb-6 mt-2">
        <AppButton
          label="Simpan Pengaturan Owner"
          onPress={handleSave}
          loading={isSaving}
        />
        
        <View className="mt-6">
          <Pressable
            onPress={handleLogout}
            className="rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm"
          >
            <Text className="text-center font-poppins-bold text-red-600">
              Logout Akun
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenContainer>
  );
};
