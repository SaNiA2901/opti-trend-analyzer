
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity } from "lucide-react";

interface MarketOverviewProps {
  selectedPair: string;
}

interface MarketData {
  pair: string;
  price: number;
  change: number;
  volume: string;
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
}

const MarketOverview = ({ selectedPair }: MarketOverviewProps) => {
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [marketStatus, setMarketStatus] = useState('OPEN');

  useEffect(() => {
    const generateMarketData = () => {
      const pairs = [
        "EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", 
        "NZD/USD", "EUR/GBP", "EUR/JPY", "GBP/JPY", "AUD/JPY", "CAD/JPY",
        "CHF/JPY", "NZD/JPY", "EUR/CHF", "GBP/CHF", "AUD/CHF", "CAD/CHF",
        "EUR/AUD", "GBP/AUD", "USD/NOK", "USD/SEK", "USD/DKK", "USD/PLN",
        "USD/CZK", "USD/HUF", "USD/RUB", "USD/TRY", "USD/ZAR", "USD/MXN",
        "USD/SGD", "USD/HKD", "EUR/NOK", "EUR/SEK", "EUR/DKK", "EUR/PLN",
        "GBP/NOK", "GBP/SEK", "AUD/CAD", "NZD/CAD", "BTC/USD", "ETH/USD",
        "LTC/USD", "XRP/USD", "ADA/USD", "DOT/USD", "LINK/USD", "BCH/USD"
      ];
      
      const data = pairs.map(pair => {
        const basePrice = pair === "EUR/USD" ? 1.0850 : 
                         pair === "GBP/USD" ? 1.2650 :
                         pair === "USD/JPY" ? 149.50 :
                         pair === "USD/CHF" ? 0.8950 :
                         pair === "AUD/USD" ? 0.6550 : 
                         pair === "USD/CAD" ? 1.3450 :
                         pair === "BTC/USD" ? 67500 :
                         pair === "ETH/USD" ? 3200 :
                         pair === "LTC/USD" ? 85 :
                         pair.includes("BTC") || pair.includes("ETH") || pair.includes("LTC") || 
                         pair.includes("XRP") || pair.includes("ADA") || pair.includes("DOT") || 
                         pair.includes("LINK") || pair.includes("BCH") ? 0.5 : 1.0950;

        const change = pair.includes("/USD") && (pair.includes("BTC") || pair.includes("ETH")) ? 
          (Math.random() - 0.5) * 8 : // Крипто более волатильна
          (Math.random() - 0.5) * 2; // -1% to +1% для валют
        
        const price = basePrice * (1 + change / 100);
        
        return {
          pair,
          price,
          change,
          volume: pair.includes("BTC") || pair.includes("ETH") ? 
            (Math.random() * 20000 + 10000).toFixed(0) + 'M' : // Больший объем для крипто
            (Math.random() * 5000 + 1000).toFixed(0) + 'M',
          volatility: (pair.includes("BTC") || pair.includes("ETH")) ?
            (Math.random() > 0.5 ? 'HIGH' : 'MEDIUM') : // Крипто чаще высокая волатильность
            (Math.random() > 0.7 ? 'HIGH' : Math.random() > 0.4 ? 'MEDIUM' : 'LOW') as 'LOW' | 'MEDIUM' | 'HIGH'
        };
      });
      
      setMarketData(data);
    };

    generateMarketData();
    const interval = setInterval(generateMarketData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (pair: string, price: number) => {
    if (pair === "BTC/USD") return `$${price.toFixed(0)}`;
    if (pair === "ETH/USD") return `$${price.toFixed(0)}`;
    if (pair.includes("USD") && (pair.includes("BTC") || pair.includes("ETH") || pair.includes("LTC"))) return `$${price.toFixed(2)}`;
    return pair.includes("JPY") ? price.toFixed(2) : price.toFixed(4);
  };

  const getVolatilityColor = (volatility: string) => {
    switch (volatility) {
      case 'HIGH': return 'bg-red-600';
      case 'MEDIUM': return 'bg-yellow-600';
      default: return 'bg-green-600';
    }
  };

  const getVolatilityText = (volatility: string) => {
    switch (volatility) {
      case 'HIGH': return 'Высокая';
      case 'MEDIUM': return 'Средняя';
      default: return 'Низкая';
    }
  };

  const isCrypto = (pair: string) => {
    return pair.includes("BTC") || pair.includes("ETH") || pair.includes("LTC") || 
           pair.includes("XRP") || pair.includes("ADA") || pair.includes("DOT") || 
           pair.includes("LINK") || pair.includes("BCH");
  };

  return (
    <div className="space-y-6">
      {/* Market Status */}
      <Card className="p-4 bg-slate-800/50 border-slate-700">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-white">Статус рынка</h3>
          <Badge className="bg-green-600 text-white">
            <Activity className="h-3 w-3 mr-1" />
            ОТКРЫТ
          </Badge>
        </div>
        <p className="text-slate-400 text-sm">
          {isCrypto(selectedPair) ? "Криптовалюты торгуются 24/7" : "Форекс торгуется 24/5"}
        </p>
      </Card>

      {/* Current Pair Details */}
      <Card className="p-4 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Детали {selectedPair}</h3>
        
        {marketData.find(d => d.pair === selectedPair) && (
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-400">Текущая цена</span>
              <span className="text-white font-medium">
                {formatPrice(selectedPair, marketData.find(d => d.pair === selectedPair)!.price)}
              </span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-400">Изменение</span>
              <div className="flex items-center space-x-1">
                {marketData.find(d => d.pair === selectedPair)!.change > 0 ? 
                  <TrendingUp className="h-3 w-3 text-green-400" /> : 
                  <TrendingDown className="h-3 w-3 text-red-400" />
                }
                <span className={marketData.find(d => d.pair === selectedPair)!.change > 0 ? 'text-green-400' : 'text-red-400'}>
                  {marketData.find(d => d.pair === selectedPair)!.change.toFixed(2)}%
                </span>
              </div>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-400">Объем</span>
              <span className="text-white">{marketData.find(d => d.pair === selectedPair)!.volume}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-slate-400">Волатильность</span>
              <Badge className={`${getVolatilityColor(marketData.find(d => d.pair === selectedPair)!.volatility)} text-white`}>
                {getVolatilityText(marketData.find(d => d.pair === selectedPair)!.volatility)}
              </Badge>
            </div>

            {isCrypto(selectedPair) && (
              <div className="flex justify-between">
                <span className="text-slate-400">Тип актива</span>
                <Badge className="bg-orange-600 text-white">КРИПТО</Badge>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default MarketOverview;
