
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
      const pairs = ["EUR/USD", "GBP/USD", "USD/JPY", "USD/CHF", "AUD/USD", "USD/CAD", "BTC/USD"];
      const data = pairs.map(pair => {
        const basePrice = pair === "EUR/USD" ? 1.0850 : 
                         pair === "GBP/USD" ? 1.2650 :
                         pair === "USD/JPY" ? 149.50 :
                         pair === "USD/CHF" ? 0.8950 :
                         pair === "AUD/USD" ? 0.6550 : 
                         pair === "USD/CAD" ? 1.3450 :
                         pair === "BTC/USD" ? 67500 : 1.0950;

        const change = pair === "BTC/USD" ? 
          (Math.random() - 0.5) * 8 : // Bitcoin более волатилен
          (Math.random() - 0.5) * 2; // -1% to +1% для валют
        
        const price = basePrice * (1 + change / 100);
        
        return {
          pair,
          price,
          change,
          volume: pair === "BTC/USD" ? 
            (Math.random() * 20000 + 10000).toFixed(0) + 'M' : // Больший объем для BTC
            (Math.random() * 5000 + 1000).toFixed(0) + 'M',
          volatility: pair === "BTC/USD" ?
            (Math.random() > 0.5 ? 'HIGH' : 'MEDIUM') : // BTC чаще высокая волатильность
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
          {selectedPair === "BTC/USD" ? "Криптовалюты торгуются 24/7" : "Форекс торгуется 24/5"}
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
          </div>
        )}
      </Card>

      {/* All Pairs */}
      <Card className="p-4 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Все торговые пары</h3>
        
        <div className="space-y-3">
          {marketData.map((data) => (
            <div 
              key={data.pair}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                data.pair === selectedPair ? 'border-blue-500 bg-blue-500/10' : 'border-slate-600 bg-slate-700/30'
              }`}
            >
              <div>
                <div className="text-white font-medium flex items-center space-x-2">
                  <span>{data.pair}</span>
                  {data.pair === "BTC/USD" && (
                    <Badge className="bg-orange-600 text-white text-xs">КРИПТО</Badge>
                  )}
                </div>
                <div className="text-slate-400 text-sm">{formatPrice(data.pair, data.price)}</div>
              </div>
              
              <div className="text-right">
                <div className={`flex items-center space-x-1 ${data.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {data.change > 0 ? 
                    <TrendingUp className="h-3 w-3" /> : 
                    <TrendingDown className="h-3 w-3" />
                  }
                  <span className="text-sm font-medium">
                    {data.change > 0 ? '+' : ''}{data.change.toFixed(2)}%
                  </span>
                </div>
                <div className="text-slate-400 text-xs">{data.volume}</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Market News */}
      <Card className="p-4 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Новости рынка</h3>
        
        <div className="space-y-3">
          {selectedPair === "BTC/USD" ? (
            <>
              <div className="border-l-4 border-orange-500 pl-3">
                <p className="text-white text-sm font-medium">Bitcoin ETF показывает рекордные притоки</p>
                <p className="text-slate-400 text-xs">1 час назад</p>
              </div>
              
              <div className="border-l-4 border-green-500 pl-3">
                <p className="text-white text-sm font-medium">Институциональные инвесторы увеличивают позиции</p>
                <p className="text-slate-400 text-xs">3 часа назад</p>
              </div>
              
              <div className="border-l-4 border-blue-500 pl-3">
                <p className="text-white text-sm font-medium">Новые регулятивные решения по криптовалютам</p>
                <p className="text-slate-400 text-xs">6 часов назад</p>
              </div>
            </>
          ) : (
            <>
              <div className="border-l-4 border-blue-500 pl-3">
                <p className="text-white text-sm font-medium">ЕЦБ оставил ставки без изменений</p>
                <p className="text-slate-400 text-xs">2 часа назад</p>
              </div>
              
              <div className="border-l-4 border-yellow-500 pl-3">
                <p className="text-white text-sm font-medium">Данные по NFP превысили ожидания</p>
                <p className="text-slate-400 text-xs">5 часов назад</p>
              </div>
              
              <div className="border-l-4 border-red-500 pl-3">
                <p className="text-white text-sm font-medium">Напряженность в торговых отношениях</p>
                <p className="text-slate-400 text-xs">1 день назад</p>
              </div>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MarketOverview;
