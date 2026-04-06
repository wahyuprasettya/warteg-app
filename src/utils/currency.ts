export const formatIDR = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

export const parseFormattedNumber = (value: string) => Number(value.replace(/[^0-9]/g, "")) || 0;

export const formatNumberInput = (value: string | number) => {
  const digits = String(value).replace(/[^0-9]/g, "");

  if (!digits) {
    return "";
  }

  return new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
    useGrouping: true,
  }).format(Number(digits));
};
