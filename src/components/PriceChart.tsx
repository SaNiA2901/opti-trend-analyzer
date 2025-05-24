
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";

interface PriceChartProps {
  pair: string;
  timeframe: string;
}

const PriceChart = ({ pair, timeframe }: PriceChartProps) => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange, setPriceChange] = useState(0);
  const [trend, setTrend] = useState<'up' | 'down'>('up');

  // Генерируем реалистичные данные для демонстрации
  useEffect(() => {
    const generatePriceData = () => {
      const basePrice = pair === "EUR/USD" ? 1.0850 : 
                       pair === "GBP/USD" ? 1.2650 :
                       pair === "USD/JPY" ? 149.50 : 1.0950;
      
      const data = [];
      let price = basePrice;
      
      for (let i = 0; i < 50; i++) {
        const change = (Math.random() - 0.5) * 0.01;
        price += change;
        data.push({
          time: new Date(Date.now() - (49 - i) * 60000).toLocaleTimeString(),
          price: Number(price.toFixed(4)),
          volume: Math.floor(Math.random() * 1000) + 500
        });
      }
      
      setChartData(data);
      setCurrentPrice(price);
      setPriceChange(((price - basePrice) / basePrice) * 100);
      setTrend(price > basePrice ? 'up' : 'down');
    };

    generatePriceData();
    
    // Обновляем данные каждые 5 секунд для имитации real-time
    const interval = setInterval(() => {
      generatePriceData();
    }, 5000);

    return () => clearInterval(interval);
  }, [pair, timeframe]);

  const formatPrice = (price: number) => {
    return pair.includes("JPY") ? price.toFixed(2) : price.toFixed(4);
  };

  return (
    <Card className="p-6 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white mb-2">{pair}</h3>
          <div className="flex items-center space-x-4">
            <span className="text-2xl font-bold text-white">
              {formatPrice(currentPrice)}
            </span>
            <Badge 
              variant={trend === 'up' ? 'default' : 'destructive'}
              className={`flex items-center space-x-1 ${
                trend === 'up' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              <span>{priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%</span>
            </Badge>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-slate-400 text-sm">Временной интервал</p>
          <p className="text-white font-medium">{timeframe}</p>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="time" 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              domain={['dataMin - 0.01', 'dataMax + 0.01']}
              tickFormatter={(value) => formatPrice(value)}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1F2937',
                border: '1px solid #374151',
                borderRadius: '8px',
                color: '#F9FAFB'
              }}
              formatter={(value: any) => [formatPrice(value), 'Цена']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#3B82F6"
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
        <div className="text-center">
          <p className="text-slate-400 text-sm">Максимум</p>
          <p className="text-white font-medium">
            {formatPrice(Math.max(...chartData.map(d => d.price)))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-sm">Минимум</p>
          <p className="text-white font-medium">
            {formatPrice(Math.min(...chartData.map(d => d.price)))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-slate-400 text-sm">Объем</p>
          <p className="text-white font-medium">
            {chartData.length > 0 ? chartData[chartData.length - 1].volume : 0}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default PriceChart;
