
import { useMemo } from 'react';
import { CandleData } from '@/types/session';

export interface PatternResult {
  name: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  description: string;
  requiredCandles: number;
  candleRange: string;
}

const detectDoji = (candles: CandleData[], index: number): PatternResult | null => {
  const candle = candles[index];
  const bodySize = Math.abs(candle.close - candle.open);
  const totalRange = candle.high - candle.low;
  
  if (bodySize / totalRange < 0.1 && totalRange > 0) {
    return {
      name: 'Дожи',
      type: 'NEUTRAL',
      confidence: 75,
      description: 'Свеча с очень маленьким телом, указывает на неопределенность рынка',
      requiredCandles: 1,
      candleRange: `${index + 1}`
    };
  }
  return null;
};

const detectHammer = (candles: CandleData[], index: number): PatternResult | null => {
  const candle = candles[index];
  const bodySize = Math.abs(candle.close - candle.open);
  const lowerShadow = Math.min(candle.open, candle.close) - candle.low;
  const upperShadow = candle.high - Math.max(candle.open, candle.close);
  
  if (lowerShadow > bodySize * 2 && upperShadow < bodySize * 0.5 && bodySize > 0) {
    return {
      name: 'Молот',
      type: 'BULLISH',
      confidence: 80,
      description: 'Разворотный паттерн с длинной нижней тенью',
      requiredCandles: 1,
      candleRange: `${index + 1}`
    };
  }
  return null;
};

const detectEngulfing = (candles: CandleData[], index: number): PatternResult | null => {
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

const detectThreeWhiteSoldiers = (candles: CandleData[], index: number): PatternResult | null => {
  if (index < 2) return null;
  
  const candle1 = candles[index - 2];
  const candle2 = candles[index - 1];
  const candle3 = candles[index];
  
  if (candle1.close > candle1.open && 
      candle2.close > candle2.open && 
      candle3.close > candle3.open &&
      candle2.close > candle1.close &&
      candle3.close > candle2.close) {
    return {
      name: 'Три белых солдата',
      type: 'BULLISH',
      confidence: 90,
      description: 'Три подряд идущие бычьи свечи с возрастающими максимумами',
      requiredCandles: 3,
      candleRange: `${index - 1}-${index + 1}`
    };
  }
  
  return null;
};

const detectThreeBlackCrows = (candles: CandleData[], index: number): PatternResult | null => {
  if (index < 2) return null;
  
  const candle1 = candles[index - 2];
  const candle2 = candles[index - 1];
  const candle3 = candles[index];
  
  if (candle1.close < candle1.open && 
      candle2.close < candle2.open && 
      candle3.close < candle3.open &&
      candle2.close < candle1.close &&
      candle3.close < candle2.close) {
    return {
      name: 'Три черные вороны',
      type: 'BEARISH',
      confidence: 90,
      description: 'Три подряд идущие медвежьи свечи с убывающими минимумами',
      requiredCandles: 3,
      candleRange: `${index - 1}-${index + 1}`
    };
  }
  
  return null;
};

const detectMorningStar = (candles: CandleData[], index: number): PatternResult | null => {
  if (index < 2) return null;
  
  const candle1 = candles[index - 2];
  const candle2 = candles[index - 1];
  const candle3 = candles[index];
  
  const body1 = Math.abs(candle1.close - candle1.open);
  const body2 = Math.abs(candle2.close - candle2.open);
  const body3 = Math.abs(candle3.close - candle3.open);
  
  if (candle1.close < candle1.open && // Первая свеча медвежья
      body2 < body1 * 0.3 && // Вторая свеча маленькая
      candle3.close > candle3.open && // Третья свеча бычья
      candle3.close > (candle1.open + candle1.close) / 2) { // Закрытие выше середины первой свечи
    return {
      name: 'Утренняя звезда',
      type: 'BULLISH',
      confidence: 85,
      description: 'Трёхсвечной разворотный паттерн снизу вверх',
      requiredCandles: 3,
      candleRange: `${index - 1}-${index + 1}`
    };
  }
  
  return null;
};

const detectEveningStar = (candles: CandleData[], index: number): PatternResult | null => {
  if (index < 2) return null;
  
  const candle1 = candles[index - 2];
  const candle2 = candles[index - 1];
  const candle3 = candles[index];
  
  const body1 = Math.abs(candle1.close - candle1.open);
  const body2 = Math.abs(candle2.close - candle2.open);
  const body3 = Math.abs(candle3.close - candle3.open);
  
  if (candle1.close > candle1.open && // Первая свеча бычья
      body2 < body1 * 0.3 && // Вторая свеча маленькая
      candle3.close < candle3.open && // Третья свеча медвежья
      candle3.close < (candle1.open + candle1.close) / 2) { // Закрытие ниже середины первой свечи
    return {
      name: 'Вечерняя звезда',
      type: 'BEARISH',
      confidence: 85,
      description: 'Трёхсвечной разворотный паттерн сверху вниз',
      requiredCandles: 3,
      candleRange: `${index - 1}-${index + 1}`
    };
  }
  
  return null;
};

const detectDoubleTop = (candles: CandleData[], index: number): PatternResult | null => {
  if (index < 10) return null;
  
  const recent = candles.slice(index - 10, index + 1);
  const highs = recent.map(c => c.high);
  const maxHigh = Math.max(...highs);
  
  let peaks = [];
  for (let i = 1; i < recent.length - 1; i++) {
    if (recent[i].high > recent[i-1].high && recent[i].high > recent[i+1].high) {
      peaks.push({ index: i, high: recent[i].high });
    }
  }
  
  if (peaks.length >= 2) {
    const lastTwoPeaks = peaks.slice(-2);
    const [peak1, peak2] = lastTwoPeaks;
    
    if (Math.abs(peak1.high - peak2.high) / peak1.high < 0.02) {
      return {
        name: 'Двойная вершина',
        type: 'BEARISH',
        confidence: 75,
        description: 'Формирование двух примерно равных максимумов',
        requiredCandles: 10,
        candleRange: `${index - 9}-${index + 1}`
      };
    }
  }
  
  return null;
};

const detectHeadAndShoulders = (candles: CandleData[], index: number): PatternResult | null => {
  if (index < 15) return null;
  
  const recent = candles.slice(index - 15, index + 1);
  let peaks = [];
  
  for (let i = 2; i < recent.length - 2; i++) {
    if (recent[i].high > recent[i-1].high && 
        recent[i].high > recent[i+1].high &&
        recent[i].high > recent[i-2].high && 
        recent[i].high > recent[i+2].high) {
      peaks.push({ index: i, high: recent[i].high });
    }
  }
  
  if (peaks.length >= 3) {
    const lastThreePeaks = peaks.slice(-3);
    const [left, head, right] = lastThreePeaks;
    
    if (head.high > left.high && head.high > right.high &&
        Math.abs(left.high - right.high) / left.high < 0.05) {
      return {
        name: 'Голова и плечи',
        type: 'BEARISH',
        confidence: 80,
        description: 'Классический разворотный паттерн с тремя пиками',
        requiredCandles: 15,
        candleRange: `${index - 14}-${index + 1}`
      };
    }
  }
  
  return null;
};

const detectFlagPattern = (candles: CandleData[], index: number): PatternResult | null => {
  if (index < 8) return null;
  
  const recent = candles.slice(index - 8, index + 1);
  
  // Ищем сильное движение в начале
  const firstThree = recent.slice(0, 3);
  const strongMove = firstThree.every(c => c.close > c.open) || 
                    firstThree.every(c => c.close < c.open);
  
  if (!strongMove) return null;
  
  // Проверяем консолидацию после
  const consolidation = recent.slice(3);
  const priceRange = Math.max(...consolidation.map(c => c.high)) - 
                     Math.min(...consolidation.map(c => c.low));
  const avgPrice = consolidation.reduce((sum, c) => sum + (c.high + c.low) / 2, 0) / consolidation.length;
  
  if (priceRange / avgPrice < 0.03) { // Узкий диапазон
    const isBullish = firstThree[0].close < firstThree[2].close;
    return {
      name: isBullish ? 'Бычий флаг' : 'Медвежий флаг',
      type: isBullish ? 'BULLISH' : 'BEARISH',
      confidence: 70,
      description: 'Паттерн продолжения тренда после сильного движения',
      requiredCandles: 8,
      candleRange: `${index - 7}-${index + 1}`
    };
  }
  
  return null;
};

export const usePatternDetection = (candles: CandleData[]) => {
  const detectedPatterns = useMemo(() => {
    if (candles.length < 5) return [];
    
    const patterns: PatternResult[] = [];
    const detectors = [
      detectDoji,
      detectHammer,
      detectEngulfing,
      detectThreeWhiteSoldiers,
      detectThreeBlackCrows,
      detectMorningStar,
      detectEveningStar,
      detectDoubleTop,
      detectHeadAndShoulders,
      detectFlagPattern
    ];
    
    // Проходим по свечам и ищем паттерны
    for (let i = 0; i < candles.length; i++) {
      for (const detector of detectors) {
        try {
          const pattern = detector(candles, i);
          if (pattern) {
            // Избегаем дублирования паттернов
            const isDuplicate = patterns.some(p => 
              p.name === pattern.name && 
              Math.abs(i - parseInt(pattern.candleRange.split('-')[0] || '0')) < pattern.requiredCandles
            );
            
            if (!isDuplicate) {
              patterns.push(pattern);
            }
          }
        } catch (error) {
          console.warn(`Error detecting pattern with ${detector.name}:`, error);
        }
      }
    }
    
    // Сортируем по уверенности
    return patterns.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }, [candles]);

  const hasPatterns = detectedPatterns.length > 0;

  return {
    detectedPatterns,
    hasPatterns
  };
};
