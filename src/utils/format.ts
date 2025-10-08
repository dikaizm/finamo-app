// Currency / number formatting helpers
// Centralized so we can adjust formatting rules (e.g., hide decimals) in one place.

export function formatRupiah(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount as number)) return 'Rp0';
  // Indonesian Rupiah usually displayed without decimal fractions.
  const formatted = Intl.NumberFormat('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount as number);
  return `Rp${formatted}`;
}

export function formatRupiahWithSymbol(amount: number | undefined | null): string {
  // Alternate version using currency style (results in e.g. "Rp500.000")
  if (amount === undefined || amount === null || isNaN(amount as number)) return 'Rp0';
  return Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount as number);
}
