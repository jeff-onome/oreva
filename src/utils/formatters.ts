export const formatNaira = (amount: number): string => {
  // Use Intl.NumberFormat for robust currency formatting.
  // 'en-NG' is the locale for English in Nigeria.
  // 'NGN' is the currency code for Nigerian Naira.
  // minimumFractionDigits: 0, as kobo are rarely shown this way.
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
  }).format(amount);
};