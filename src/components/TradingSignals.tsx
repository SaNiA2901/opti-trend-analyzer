
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, Clock } from "lucide-react";

interface TradingSignalsProps {
  pair: string;
  timeframe: string;
}

interface Signal {
  id: string;
  type: 'CALL' | 'PUT';
  strength: number;
  timeLeft: number;
  reason: string;
  probability: number;
  entry: number;
}

const TradingSignals = ({ pair, timeframe }: TradingSignalsProps) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [overallSentiment, setOverallSentiment] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('NEUTRAL');
  const [confidence, setConfidence] = useState(75);

  useEffect(() => {
    const generateSignals = () => {
      const newSignals: Signal[] = [];
      const basePrice = pair === "EUR/USD" ? 1.0850 : 
                       pair === "GBP/USD" ? 1.2650 :
                       pair === "USD/JPY" ? 149.50 : 1.0950;

      // Генерируем 3-5 сигналов
      const signalCount = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < signalCount; i++) {
        const isCall = Math.random() > 0.5;
        const strength = Math.floor(Math.random() * 40) + 60; // 60-100
        const probability = Math.floor(Math.random() * 30) + 65; // 65-95
        
        newSignals.push({
          id: `signal-${i}`,
          type: isCall ? 'CALL' : 'PUT',
          strength,
          timeLeft: Math.floor(Math.random() * 25) + 5, // 5-30 минут
          reason: isCall ? 
            ['RSI показывает перепроданность', 'Пробой уровня сопротивления', 'MACD бычий кроссовер', 'Отскок от поддержки'][Math.floor(Math.random() * 4)] :
            ['RSI показывает перекупленность', 'Пробой уровня поддержки', 'MACD медвежий кроссовер', 'Отскок от сопротивления'][Math.floor(Math.random() * 4)],
          probability,
          entry: basePrice + (Math.random() - 0.5) * 0.01
        });
      }

      setSignals(newSignals);
      
      // Определяем общий сентимент
      const callSignals = newSignals.filter(s => s.type === 'CALL');
      const putSignals = newSignals.filter(s => s.type === 'PUT');
      
      if (callSignals.length > putSignals.length) {
        setOverallSentiment('BULLISH');
      } else if (putSignals.length > callSignals.length) {
        setOverallSentiment('BEARISH');
      } else {
        setOverallSentiment('NEUTRAL');
      }

      setConfidence(Math.floor(Math.random() * 25) + 70);
    };

    generateSignals();
    const interval = setInterval(generateSignals, 10000); // Обновляем каждые 10 секунд
    return () => clearInterval(interval);
  }, [pair, timeframe]);

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH': return 'bg-green-600';
      case 'BEARISH': return 'bg-red-600';
      default: return 'bg-blue-600';
    }
  };

  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH': return 'Бычий';
      case 'BEARISH': return 'Медвежий';
      default: return 'Нейтральный';
    }
  };

  const formatPrice = (price: number) => {
    return pair.includes("JPY") ? price.toFixed(2) : price.toFixed(4);
  };

  return (
    <div className="space-y-6">
      {/* Overall Market Sentiment */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Общий анализ рынка</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <Badge className={`${getSentimentColor(overallSentiment)} text-white mb-2`}>
              {getSentimentText(overallSentiment)}
            </Badge>
            <p className="text-slate-400 text-sm">Настроение рынка</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-white mb-1">{confidence}%</div>
            <Progress value={confidence} className="mb-2 h-2" />
            <p className="text-slate-400 text-sm">Уверенность</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400 mb-1">{signals.length}</div>
            <p className="text-slate-400 text-sm">Активных сигналов</p>
          </div>
        </div>
      </Card>

      {/* Trading Signals */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Торговые сигналы для бинарных опционов</h3>
        
        <div className="space-y-4">
          {signals.map((signal) => (
            <div 
              key={signal.id}
              className="border border-slate-600 rounded-lg p-4 bg-slate-700/30"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Badge 
                    className={`${signal.type === 'CALL' ? 'bg-green-600' : 'bg-red-600'} text-white flex items-center space-x-1`}
                  >
                    {signal.type === 'CALL' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    <span>{signal.type}</span>
                  </Badge>
                  
                  <div className="text-white font-medium">
                    {pair} @ {formatPrice(signal.entry)}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-slate-400">
                  <Clock className="h-4 w-4" />
                  <span className="text-sm">{signal.timeLeft} мин</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                <div>
                  <p className="text-slate-400 text-sm">Сила сигнала</p>
                  <div className="flex items-center space-x-2">
                    <Progress value={signal.strength} className="flex-1 h-2" />
                    <span className="text-white text-sm">{signal.strength}%</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-slate-400 text-sm">Вероятность успеха</p>
                  <div className="flex items-center space-x-2">
                    <Progress value={signal.probability} className="flex-1 h-2" />
                    <span className="text-white text-sm">{signal.probability}%</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-slate-400 text-sm">Рекомендация</p>
                  <Button 
                    size="sm" 
                    className={`w-full ${signal.type === 'CALL' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
                  >
                    {signal.type === 'CALL' ? 'ПОКУПАТЬ' : 'ПРОДАВАТЬ'}
                  </Button>
                </div>
              </div>

              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                <p className="text-slate-300 text-sm">{signal.reason}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Trading Tips */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Рекомендации по торговле</h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-slate-300 text-sm">
              Используйте несколько индикаторов для подтверждения сигналов
            </p>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-slate-300 text-sm">
              Учитывайте новости и экономические события
            </p>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-slate-300 text-sm">
              Не рискуйте более 2-5% от депозита на одну сделку
            </p>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
            <p className="text-slate-300 text-sm">
              Сигналы с вероятностью выше 75% имеют больший потенциал
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default TradingSignals;
