import { useState, useEffect } from "react";

const SOL_PRICE_CACHE_KEY = "noizlabs_sol_price";
const CACHE_DURATION_MS = 60_000; // 1 minute cache

interface CachedPrice {
  price: number;
  timestamp: number;
}

export function useSolPrice() {
  const [price, setPrice] = useState<number | null>(() => {
    const cached = localStorage.getItem(SOL_PRICE_CACHE_KEY);
    if (cached) {
      const { price, timestamp }: CachedPrice = JSON.parse(cached);
      if (Date.now() - timestamp < CACHE_DURATION_MS) {
        return price;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(!price);

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        // Using CoinGecko's free API
        const response = await fetch(
          "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd"
        );
        const data = await response.json();
        const solPrice = data.solana?.usd;
        
        if (solPrice) {
          setPrice(solPrice);
          localStorage.setItem(
            SOL_PRICE_CACHE_KEY,
            JSON.stringify({ price: solPrice, timestamp: Date.now() })
          );
        }
      } catch (error) {
        console.error("Failed to fetch SOL price:", error);
        // Fallback price if API fails
        if (!price) setPrice(200);
      } finally {
        setLoading(false);
      }
    };

    fetchPrice();
    
    // Refresh every minute
    const interval = setInterval(fetchPrice, CACHE_DURATION_MS);
    return () => clearInterval(interval);
  }, []);

  const formatUsd = (solAmount: number): string => {
    if (!price) return "...";
    const usdValue = solAmount * price;
    return usdValue < 1 
      ? `$${usdValue.toFixed(2)}` 
      : `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return { price, loading, formatUsd };
}
