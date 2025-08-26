// frontend/lib/client-utils.ts
// Client-safe utilities that can be imported by islands

/**
 * Format money display (client-safe version)
 * @param cents Amount in cents
 * @param currency Currency code (e.g., 'usd')
 * @returns Formatted money string
 */
export function formatMoney(cents: number, currency: string): string {
  const amount = cents / 100;
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount);
  } catch {
    // Fallback for invalid currency codes
    return `${amount.toFixed(2)} ${currency.toUpperCase()}`;
  }
}
