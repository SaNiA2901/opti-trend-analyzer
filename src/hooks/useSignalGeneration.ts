
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
                       pair === "USD/JPY" ? 149.50 : 1.0950;

      const signalCount = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < signalCount; i++) {
        const isCall = Math.random() > 0.5;
        const strength = Math.floor(Math.random() * 40) + 60;
        const probability = Math.floor(Math.random() * 30) + 65;
        
        newSignals.push({
          id: `signal-${i}`,
          type: isCall ? 'CALL' : 'PUT',
          strength,
          timeLeft: Math.floor(Math.random() * 25) + 5,
          reason: isCall ? 
            ['RSI показывает перепроданность', 'Пробой уровня сопротивления', 'MACD бычий кроссовер', 'Отскок от поддержки'][Math.floor(Math.random() * 4)] :
            ['RSI показывает перекупленность', 'Пробой уровня поддержки', 'MACD медвежий кроссовер', 'Отскок от сопротивления'][Math.floor(Math.random() * 4)],
          probability,
          entry: basePrice + (Math.random() - 0.5) * 0.01
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
