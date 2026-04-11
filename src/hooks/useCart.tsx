import { ReactNode, createContext, useContext, useMemo, useState } from "react";

import { CartItem, Product, PromoDefinition } from "@/types";

interface CartContextValue {
  items: CartItem[];
  note: string;
  customerName: string;
  activeTable?: string;
  activeOrderId?: string;
  subtotal: number;
  manualDiscount: number;
  promoDiscount: number;
  discountAmount: number;
  total: number;
  activePromo: PromoDefinition | null;
  addToCart: (product: Product) => void;
  removeFromCart: (itemId: string) => void;
  updateQty: (itemId: string, qty: number) => void;
  clearCart: () => void;
  setNote: (note: string) => void;
  setCustomerName: (customerName: string) => void;
  setActiveTable: (tableNumber?: string) => void;
  setManualDiscount: (amount: number) => void;
  applyPromo: (promo: PromoDefinition) => { ok: boolean; message?: string };
  clearPromo: () => void;
  loadOrder: (order: any) => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [note, setNote] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [activeTable, setActiveTable] = useState<string | undefined>();
  const [activeOrderId, setActiveOrderId] = useState<string | undefined>();
  const [manualDiscount, setManualDiscountState] = useState(0);
  const [activePromo, setActivePromo] = useState<PromoDefinition | null>(null);

  const addToCart = (product: Product) => {
    setItems((currentItems) => {
      const existing = currentItems.find((item) => item.id === product.id);
      if (existing) {
        return currentItems.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }

      return [
        ...currentItems,
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

  const removeFromCart = (itemId: string) => {
    setItems((currentItems) =>
      currentItems.filter((item) => item.id !== itemId),
    );
  };

  const updateQty = (itemId: string, qty: number) => {
    setItems((currentItems) =>
      currentItems
        .map((item) => (item.id === itemId ? { ...item, qty } : item))
        .filter((item) => item.qty > 0),
    );
  };

  const clearCart = () => {
    setItems([]);
    setNote("");
    setCustomerName("");
    setActiveTable(undefined);
    setManualDiscountState(0);
    setActivePromo(null);
    setActiveOrderId(undefined);
  };

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.qty, 0),
    [items],
  );

  const normalizedManualDiscount = useMemo(
    () => Math.min(Math.max(manualDiscount, 0), subtotal),
    [manualDiscount, subtotal],
  );

  const promoDiscount = useMemo(() => {
    if (!activePromo) {
      return 0;
    }

    const discountedBase = Math.max(subtotal - normalizedManualDiscount, 0);
    if (activePromo.minSubtotal && subtotal < activePromo.minSubtotal) {
      return 0;
    }

    const rawDiscount =
      activePromo.type === "percentage"
        ? Math.round((discountedBase * activePromo.value) / 100)
        : activePromo.value;

    const limitedDiscount = activePromo.maxDiscount
      ? Math.min(rawDiscount, activePromo.maxDiscount)
      : rawDiscount;

    return Math.min(limitedDiscount, discountedBase);
  }, [activePromo, normalizedManualDiscount, subtotal]);

  const discountAmount = useMemo(
    () => Math.min(normalizedManualDiscount + promoDiscount, subtotal),
    [normalizedManualDiscount, promoDiscount, subtotal],
  );

  const total = useMemo(
    () => Math.max(subtotal - discountAmount, 0),
    [discountAmount, subtotal],
  );

  const setManualDiscount = (amount: number) => {
    setManualDiscountState(Math.max(amount, 0));
  };

  const applyPromo = (promo: PromoDefinition) => {
    if (promo.minSubtotal && subtotal < promo.minSubtotal) {
      return {
        ok: false,
        message: `Minimal belanja ${promo.minSubtotal.toLocaleString("id-ID")} untuk promo ${promo.code}.`,
      };
    }

    setActivePromo(promo);
    return { ok: true };
  };

  const clearPromo = () => {
    setActivePromo(null);
  };

  const loadOrder = (order: any) => {
    setItems(order.items || []);
    setNote(order.notes || "");
    setCustomerName(order.customerName || "");
    setActiveTable(order.tableNumber || order.tableId);
    setManualDiscountState(order.discountAmount || 0);
    setActiveOrderId(order.id);
  };

  const value = useMemo(
    () => ({
      items,
      note,
      customerName,
      activeTable,
      activeOrderId,
      subtotal,
      manualDiscount: normalizedManualDiscount,
      promoDiscount,
      discountAmount,
      total,
      activePromo,
      addToCart,
      removeFromCart,
      updateQty,
      clearCart,
      setNote,
      setCustomerName,
      setActiveTable,
      setManualDiscount,
      applyPromo,
      clearPromo,
      loadOrder,
    }),
    [
      activePromo,
      activeTable,
      activeOrderId,
      discountAmount,
      items,
      note,
      customerName,
      normalizedManualDiscount,
      promoDiscount,
      subtotal,
      total,
      loadOrder,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
};
