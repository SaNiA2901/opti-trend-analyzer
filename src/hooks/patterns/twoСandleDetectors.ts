
import { CandleData } from '@/types/session';
import { PatternResult } from './types';

export const detectEngulfing = (candles: CandleData[], index: number): PatternResult | null => {
  if (index < 1) return null;
  
  const prev = candles[index - 1];
  const curr = candles[index];
  
  const prevBullish = prev.close > prev.open;
  const currBullish = curr.close > curr.open;
  
  if (!prevBullish && currBullish && 
      curr.open < prev.close && curr.close > prev.open) {
    return {
      name: 'Бычье поглощение',
      type: 'BULLISH',
      confidence: 85,
      description: 'Большая бычья свеча поглощает предыдущую медвежью',
      requiredCandles: 2,
      candleRange: `${index}-${index + 1}`
    };
  }
  
  if (prevBullish && !currBullish && 
      curr.open > prev.close && curr.close < prev.open) {
    return {
      name: 'Медвежье поглощение',
      type: 'BEARISH',
      confidence: 85,
      description: 'Большая медвежья свеча поглощает предыдущую бычью',
      requiredCandles: 2,
      candleRange: `${index}-${index + 1}`
    };
  }
  
  return null;
};
