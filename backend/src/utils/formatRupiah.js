/**
 * Formats a number to Indonesian Rupiah (IDR)
 * @param {number} amount
 * @returns {string} formatted rupiah string
 */
export const formatRupiah = (amount) => {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};
