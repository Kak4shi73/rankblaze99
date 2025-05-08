export type Currency = 'INR' | 'NPR' | 'PKR' | 'BDT' | 'USD';

export interface CurrencyInfo {
  symbol: string;
  name: string;
  rate: number;
}

export const currencies: Record<Currency, CurrencyInfo> = {
  INR: {
    symbol: '₹',
    name: 'Indian Rupee',
    rate: 1, // Base currency
  },
  NPR: {
    symbol: 'रू',
    name: 'Nepalese Rupee',
    rate: 1.60,
  },
  PKR: {
    symbol: '₨',
    name: 'Pakistani Rupee',
    rate: 3.22,
  },
  BDT: {
    symbol: '৳',
    name: 'Bangladeshi Taka',
    rate: 1.45,
  },
  USD: {
    symbol: '$',
    name: 'US Dollar',
    rate: 1/95, // 1 USD = 95 INR
  },
};

export const convertCurrency = (amount: number, from: Currency, to: Currency): number => {
  const fromRate = currencies[from].rate;
  const toRate = currencies[to].rate;
  return (amount / fromRate) * toRate;
};

export const formatCurrency = (amount: number, currency: Currency): string => {
  const { symbol } = currencies[currency];
  return `${symbol}${amount.toFixed(2)}`;
};