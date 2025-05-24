
import { useState, useEffect } from "react";

interface Signal {
  id: string;
  type: 'CALL' | 'PUT';
  strength: number;
  timeLeft: number;
  reason: string;
  probability: number;
  entry: number;
}

export const useSignalGeneration = (pair: string, timeframe: string) => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [overallSentiment, setOverallSentiment] = useState<'BULLISH' | 'BEARISH' | 'NEUTRAL'>('NEUTRAL');
  const [confidence, setConfidence] = useState(75);

  useEffect(() => {
    const generateSignals = () => {
      const newSignals: Signal[] = [];
      const basePrice = pair === "EUR/USD" ? 1.0850 : 
                       pair === "GBP/USD" ? 1.2650 :
                       pair === "USD/JPY" ? 149.50 : 
                       pair === "BTC/USD" ? 67500 : 1.0950;

      const signalCount = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < signalCount; i++) {
        const isCall = Math.random() > 0.5;
        const strength = Math.floor(Math.random() * 40) + 60;
        const probability = Math.floor(Math.random() * 30) + 65;
        
        const reasons = pair === "BTC/USD" ? {
          call: ['RSI показывает перепроданность', 'Пробой важного уровня сопротивления', 'Институциональные покупки', 'Положительные новости о регулировании'],
          put: ['RSI показывает перекупленность', 'Отскок от уровня сопротивления', 'Фиксация прибыли крупными держателями', 'Негативные новости рынка']
        } : {
          call: ['RSI показывает перепроданность', 'Пробой уровня сопротивления', 'MACD бычий кроссовер', 'Отскок от поддержки'],
          put: ['RSI показывает перекупленность', 'Пробой уровня поддержки', 'MACD медвежий кроссовер', 'Отскок от сопротивления']
        };

        const priceVariation = pair === "BTC/USD" ? 2000 : 0.01;
        
        newSignals.push({
          id: `signal-${i}`,
          type: isCall ? 'CALL' : 'PUT',
          strength,
          timeLeft: Math.floor(Math.random() * 25) + 5,
          reason: isCall ? 
            reasons.call[Math.floor(Math.random() * reasons.call.length)] :
            reasons.put[Math.floor(Math.random() * reasons.put.length)],
          probability,
          entry: basePrice + (Math.random() - 0.5) * priceVariation
        });
      }

      setSignals(newSignals);
      
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
    const interval = setInterval(generateSignals, 10000);
    return () => clearInterval(interval);
  }, [pair, timeframe]);

  return { signals, overallSentiment, confidence };
};
