'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from '@/store/authStore'; // Path to your auth state hook

interface RateDetails {
  rate: number;
  symbol: string;
  name: string;
}

interface CurrencyRates {
  [currencyCode: string]: RateDetails;
}

interface CurrencyRateContextType {
  rates: CurrencyRates;
  convert: (amount: number, from: string, to: string) => number;
}

const CurrencyRateContext = createContext<CurrencyRateContextType | undefined>(undefined);

export function CurrencyRateProvider({ children }: { children: React.ReactNode }) {
  const [rates, setRates] = useState<CurrencyRates>({});

  useEffect(() => {
    // Open live Daphne stream matching consumers.py routing keys
    const ws = new WebSocket('ws://127.0.0.1:8000/ws/currencies/');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === 'initial_rates') {
        setRates(data.rates);
      } else if (data.type === 'rate_update') {
        setRates((prev) => ({
          ...prev,
          [data.currency]: {
            rate: data.rate,
            symbol: data.symbol,
            name: prev[data.currency]?.name || data.currency,
          },
        }));
      }
    };

    return () => ws.close();
  }, []);

  // Fast frontend conversion wrapper calculation matching backend helpers.py
  const convert = (amount: number, from: string, to: string): number => {
    if (from === to || !rates[from] || !rates[to]) return amount;
    
    const amountInKES = amount * rates[from].rate;
    const targetsConvertedValue = amountInKES / rates[to].rate;
    
    return Math.round(targetsConvertedValue * 100) / 100;
  };

  return (
    <CurrencyRateContext.Provider value={{ rates, convert }}>
      {children}
    </CurrencyRateContext.Provider>
  );
}

export const useCurrencyRates = () => {
  const context = useContext(CurrencyRateContext);
  if (!context) throw new Error('useCurrencyRates must be nested inside CurrencyRateProvider');
  return context;
};