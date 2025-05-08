import { Currency, currencies } from '../../utils/currencyConverter';

interface CurrencySelectorProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currency: Currency) => void;
}

const CurrencySelector = ({ selectedCurrency, onCurrencyChange }: CurrencySelectorProps) => {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="currency" className="text-sm font-medium text-indigo-200">
        Currency:
      </label>
      <select
        id="currency"
        value={selectedCurrency}
        onChange={(e) => onCurrencyChange(e.target.value as Currency)}
        className="bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        {Object.entries(currencies).map(([code, { name }]) => (
          <option key={code} value={code}>
            {code} - {name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default CurrencySelector;