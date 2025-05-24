
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TechnicalIndicatorsProps {
  pair: string;
  timeframe: string;
}

const TechnicalIndicators = ({ pair, timeframe }: TechnicalIndicatorsProps) => {
  const [indicators, setIndicators] = useState({
    rsi: 0,
    macd: { value: 0, signal: 0, histogram: 0 },
    ma20: 0,
    ma50: 0,
    bollingerBands: { upper: 0, middle: 0, lower: 0 },
    stochastic: { k: 0, d: 0 }
  });

  const [indicatorData, setIndicatorData] = useState<any[]>([]);

  useEffect(() => {
    // Генерируем данные индикаторов
    const generateIndicators = () => {
      const rsi = Math.random() * 100;
      const macdValue = (Math.random() - 0.5) * 0.01;
      const macdSignal = (Math.random() - 0.5) * 0.01;
      
      const basePrice = pair === "EUR/USD" ? 1.0850 : 
                       pair === "GBP/USD" ? 1.2650 :
                       pair === "USD/JPY" ? 149.50 : 1.0950;

      const ma20 = basePrice + (Math.random() - 0.5) * 0.02;
      const ma50 = basePrice + (Math.random() - 0.5) * 0.03;

      setIndicators({
        rsi,
        macd: {
          value: macdValue,
          signal: macdSignal,
          histogram: macdValue - macdSignal
        },
        ma20,
        ma50,
        bollingerBands: {
          upper: basePrice + 0.02,
          middle: basePrice,
          lower: basePrice - 0.02
        },
        stochastic: {
          k: Math.random() * 100,
          d: Math.random() * 100
        }
      });

      // Генерируем данные для графика MACD
      const data = [];
      for (let i = 0; i < 20; i++) {
        data.push({
          time: i,
          macd: (Math.random() - 0.5) * 0.02,
          signal: (Math.random() - 0.5) * 0.015,
          histogram: (Math.random() - 0.5) * 0.01
        });
      }
      setIndicatorData(data);
    };

    generateIndicators();
    const interval = setInterval(generateIndicators, 3000);
    return () => clearInterval(interval);
  }, [pair, timeframe]);

  const getRSIStatus = (rsi: number) => {
    if (rsi > 70) return { status: 'Перекуплен', color: 'bg-red-600', signal: 'SELL' };
    if (rsi < 30) return { status: 'Перепродан', color: 'bg-green-600', signal: 'BUY' };
    return { status: 'Нейтральный', color: 'bg-blue-600', signal: 'HOLD' };
  };

  const getMACDStatus = (macd: any) => {
    if (macd.value > macd.signal) return { signal: 'BUY', color: 'text-green-400' };
    return { signal: 'SELL', color: 'text-red-400' };
  };

  const getMAStatus = () => {
    if (indicators.ma20 > indicators.ma50) return { signal: 'BUY', color: 'text-green-400' };
    return { signal: 'SELL', color: 'text-red-400' };
  };

  const rsiStatus = getRSIStatus(indicators.rsi);
  const macdStatus = getMACDStatus(indicators.macd);
  const maStatus = getMAStatus();

  return (
    <div className="space-y-6">
      {/* RSI Indicator */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">RSI (Relative Strength Index)</h3>
          <Badge className={`${rsiStatus.color} text-white`}>
            {rsiStatus.signal}
          </Badge>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">RSI (14)</span>
            <span className="text-white font-medium">{indicators.rsi.toFixed(1)}</span>
          </div>
          <Progress 
            value={indicators.rsi} 
            className="h-3 bg-slate-700"
          />
          <div className="flex justify-between text-xs text-slate-400">
            <span>Перепродан (30)</span>
            <span>Нейтральный (50)</span>
            <span>Перекуплен (70)</span>
          </div>
          <p className="text-sm text-slate-300">Статус: <span className="text-white">{rsiStatus.status}</span></p>
        </div>
      </Card>

      {/* MACD Indicator */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">MACD</h3>
          <Badge className={`${macdStatus.signal === 'BUY' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            {macdStatus.signal}
          </Badge>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center">
            <p className="text-slate-400 text-sm">MACD</p>
            <p className={`font-medium ${macdStatus.color}`}>
              {indicators.macd.value.toFixed(4)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm">Signal</p>
            <p className="text-white font-medium">
              {indicators.macd.signal.toFixed(4)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-slate-400 text-sm">Histogram</p>
            <p className={`font-medium ${indicators.macd.histogram > 0 ? 'text-green-400' : 'text-red-400'}`}>
              {indicators.macd.histogram.toFixed(4)}
            </p>
          </div>
        </div>

        <div className="h-32">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={indicatorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="time" stroke="#9CA3AF" fontSize={10} />
              <YAxis stroke="#9CA3AF" fontSize={10} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Line type="monotone" dataKey="macd" stroke="#3B82F6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="signal" stroke="#EF4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Moving Averages */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Moving Averages</h3>
          <Badge className={`${maStatus.signal === 'BUY' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
            {maStatus.signal}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-slate-700/50 rounded-lg">
            <p className="text-slate-400 text-sm mb-1">MA 20</p>
            <p className="text-white font-semibold text-lg">
              {indicators.ma20.toFixed(4)}
            </p>
          </div>
          <div className="text-center p-4 bg-slate-700/50 rounded-lg">
            <p className="text-slate-400 text-sm mb-1">MA 50</p>
            <p className="text-white font-semibold text-lg">
              {indicators.ma50.toFixed(4)}
            </p>
          </div>
        </div>

        <div className="mt-4 text-sm text-slate-300">
          <p>
            Состояние: MA20 {indicators.ma20 > indicators.ma50 ? 'выше' : 'ниже'} MA50 - 
            <span className={maStatus.color}> {maStatus.signal === 'BUY' ? 'Бычий тренд' : 'Медвежий тренд'}</span>
          </p>
        </div>
      </Card>

      {/* Stochastic Oscillator */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Stochastic Oscillator</h3>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">%K</span>
              <span className="text-white">{indicators.stochastic.k.toFixed(1)}</span>
            </div>
            <Progress value={indicators.stochastic.k} className="h-2 bg-slate-700" />
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">%D</span>
              <span className="text-white">{indicators.stochastic.d.toFixed(1)}</span>
            </div>
            <Progress value={indicators.stochastic.d} className="h-2 bg-slate-700" />
          </div>
        </div>

        <div className="text-sm text-slate-300">
          <p>
            Состояние: {indicators.stochastic.k > 80 ? 'Перекуплен' : 
                       indicators.stochastic.k < 20 ? 'Перепродан' : 'Нейтральный'}
          </p>
        </div>
      </Card>
    </div>
  );
};

export default TechnicalIndicators;
