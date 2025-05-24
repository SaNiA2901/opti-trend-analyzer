
import { useState, useEffect } from "react";

interface MACDData {
  value: number;
  signal: number;
  histogram: number;
}

interface BollingerBands {
  upper: number;
  middle: number;
  lower: number;
}

interface Stochastic {
  k: number;
  d: number;
}

export interface IndicatorData {
  rsi: number;
  macd: MACDData;
  ma20: number;
  ma50: number;
  bollingerBands: BollingerBands;
  stochastic: Stochastic;
}

export interface ChartDataPoint {
  time: number;
  macd: number;
  signal: number;
  histogram: number;
}

export const useIndicatorData = (pair: string, timeframe: string) => {
  const [indicators, setIndicators] = useState<IndicatorData>({
    rsi: 0,
    macd: { value: 0, signal: 0, histogram: 0 },
    ma20: 0,
    ma50: 0,
    bollingerBands: { upper: 0, middle: 0, lower: 0 },
    stochastic: { k: 0, d: 0 }
  });

  const [indicatorData, setIndicatorData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
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

  return { indicators, indicatorData };
};
