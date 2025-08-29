// frontend/lib/money.ts
export function formatMoney(
  cents: number,
  currency: string,
  locale?: string,
): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat(locale ?? "en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}
