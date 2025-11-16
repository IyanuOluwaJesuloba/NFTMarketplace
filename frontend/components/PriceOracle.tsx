"use client";

import { useState, useEffect } from 'react';
import { TrendingUp } from 'lucide-react';
import { fetchETHPriceFromRedStone } from '@/lib/redstone';

export default function PriceOracle() {
  const [ethPrice, setEthPrice] = useState<string>('0');
  const [loading, setLoading] = useState(true);

  const fetchPrice = async () => {
    try {
      const price = await fetchETHPriceFromRedStone();
      setEthPrice(price.toFixed(2));
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ETH price:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrice();
    const interval = setInterval(fetchPrice, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-gradient-to-r from-army-green-700 via-army-green-600 to-army-green-800 text-white rounded-lg p-6 shadow-lg border-l-4 border-army-green-400">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-army-green-100" />
            <h3 className="text-lg font-semibold">Live ETH/USD Price</h3>
          </div>
          <p className="text-sm opacity-90">Powered by RedStone Oracle</p>
        </div>
        <div className="text-right">
          {loading ? (
            <div className="animate-pulse">
              <div className="h-8 w-24 bg-white/20 rounded"></div>
            </div>
          ) : (
            <div>
              <p className="text-4xl font-bold">${ethPrice}</p>
              <p className="text-sm opacity-75">per ETH</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
