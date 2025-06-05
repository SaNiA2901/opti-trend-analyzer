
import { useState, useEffect, useMemo } from 'react';
import { CandleData } from '@/types/session';

export interface PatternResult {
  name: string;
  type: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  description: string;
  candleRange: number;
  requiredCandles: number;
}

export const usePatternDetection = (candles: CandleData[]) => {
  const [detectedPatterns, setDetectedPatterns] = useState<PatternResult[]>([]);

  // Сортированные свечи по индексу
  const sortedCandles = useMemo(() => {
    return [...candles].sort((a, b) => a.candle_index - b.candle_index);
  }, [candles]);

  const detectPatterns = (candleData: CandleData[]) => {
    if (candleData.length < 5) return [];

    const patterns: PatternResult[] = [];
    const latest = candleData.slice(-20); // Берём последние 20 свечей

    // Паттерн "Восходящий треугольник" (10-15 свечей)
    if (latest.length >= 10) {
      const pattern = detectAscendingTriangle(latest.slice(-15));
      if (pattern) patterns.push(pattern);
    }

    // Паттерн "Нисходящий треугольник" (10-15 свечей)
    if (latest.length >= 10) {
      const pattern = detectDescendingTriangle(latest.slice(-15));
      if (pattern) patterns.push(pattern);
    }

    // Паттерн "Голова и плечи" (15-20 свечей)
    if (latest.length >= 15) {
      const pattern = detectHeadAndShoulders(latest.slice(-20));
      if (pattern) patterns.push(pattern);
    }

    // Паттерн "Обратная голова и плечи" (15-20 свечей)
    if (latest.length >= 15) {
      const pattern = detectInverseHeadAndShoulders(latest.slice(-20));
      if (pattern) patterns.push(pattern);
    }

    // Паттерн "Двойная вершина" (8-12 свечей)
    if (latest.length >= 8) {
      const pattern = detectDoubleTop(latest.slice(-12));
      if (pattern) patterns.push(pattern);
    }

    // Паттерн "Двойное дно" (8-12 свечей)
    if (latest.length >= 8) {
      const pattern = detectDoubleBottom(latest.slice(-12));
      if (pattern) patterns.push(pattern);
    }

    // Паттерн "Флаг" (5-10 свечей)
    if (latest.length >= 5) {
      const pattern = detectFlag(latest.slice(-10));
      if (pattern) patterns.push(pattern);
    }

    // Паттерн "Вымпел" (7-12 свечей)
    if (latest.length >= 7) {
      const pattern = detectPennant(latest.slice(-12));
      if (pattern) patterns.push(pattern);
    }

    // Паттерн "Клин" (8-15 свечей)
    if (latest.length >= 8) {
      const pattern = detectWedge(latest.slice(-15));
      if (pattern) patterns.push(pattern);
    }

    return patterns;
  };

  const detectAscendingTriangle = (candles: CandleData[]): PatternResult | null => {
    if (candles.length < 10) return null;

    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    
    // Проверяем горизонтальное сопротивление
    const resistance = Math.max(...highs.slice(-5));
    const resistanceCount = highs.filter(h => Math.abs(h - resistance) / resistance < 0.002).length;
    
    // Проверяем восходящую поддержку
    const earlyLows = lows.slice(0, 5);
    const lateLows = lows.slice(-5);
    const avgEarlyLow = earlyLows.reduce((a, b) => a + b, 0) / earlyLows.length;
    const avgLateLow = lateLows.reduce((a, b) => a + b, 0) / lateLows.length;
    
    if (resistanceCount >= 2 && avgLateLow > avgEarlyLow) {
      return {
        name: 'Восходящий треугольник',
        type: 'BULLISH',
        confidence: 75 + Math.min(20, resistanceCount * 5),
        description: 'Бычий паттерн продолжения тренда с горизонтальным сопротивлением и восходящей поддержкой',
        candleRange: candles.length,
        requiredCandles: 10
      };
    }

    return null;
  };

  const detectDescendingTriangle = (candles: CandleData[]): PatternResult | null => {
    if (candles.length < 10) return null;

    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    
    // Проверяем горизонтальную поддержку
    const support = Math.min(...lows.slice(-5));
    const supportCount = lows.filter(l => Math.abs(l - support) / support < 0.002).length;
    
    // Проверяем нисходящее сопротивление
    const earlyHighs = highs.slice(0, 5);
    const lateHighs = highs.slice(-5);
    const avgEarlyHigh = earlyHighs.reduce((a, b) => a + b, 0) / earlyHighs.length;
    const avgLateHigh = lateHighs.reduce((a, b) => a + b, 0) / lateHighs.length;
    
    if (supportCount >= 2 && avgLateHigh < avgEarlyHigh) {
      return {
        name: 'Нисходящий треугольник',
        type: 'BEARISH',
        confidence: 75 + Math.min(20, supportCount * 5),
        description: 'Медвежий паттерн продолжения тренда с горизонтальной поддержкой и нисходящим сопротивлением',
        candleRange: candles.length,
        requiredCandles: 10
      };
    }

    return null;
  };

  const detectHeadAndShoulders = (candles: CandleData[]): PatternResult | null => {
    if (candles.length < 15) return null;

    const highs = candles.map(c => c.high);
    const segment = Math.floor(candles.length / 3);
    
    const leftShoulder = Math.max(...highs.slice(0, segment));
    const head = Math.max(...highs.slice(segment, segment * 2));
    const rightShoulder = Math.max(...highs.slice(segment * 2));
    
    // Голова должна быть выше плеч
    if (head > leftShoulder && head > rightShoulder) {
      const shoulderSymmetry = Math.abs(leftShoulder - rightShoulder) / leftShoulder;
      const headProminence = (head - Math.max(leftShoulder, rightShoulder)) / head;
      
      if (shoulderSymmetry < 0.05 && headProminence > 0.02) {
        return {
          name: 'Голова и плечи',
          type: 'BEARISH',
          confidence: 80 + Math.min(15, (1 - shoulderSymmetry) * 100),
          description: 'Классический медвежий паттерн разворота тренда',
          candleRange: candles.length,
          requiredCandles: 15
        };
      }
    }

    return null;
  };

  const detectInverseHeadAndShoulders = (candles: CandleData[]): PatternResult | null => {
    if (candles.length < 15) return null;

    const lows = candles.map(c => c.low);
    const segment = Math.floor(candles.length / 3);
    
    const leftShoulder = Math.min(...lows.slice(0, segment));
    const head = Math.min(...lows.slice(segment, segment * 2));
    const rightShoulder = Math.min(...lows.slice(segment * 2));
    
    // Голова должна быть ниже плеч
    if (head < leftShoulder && head < rightShoulder) {
      const shoulderSymmetry = Math.abs(leftShoulder - rightShoulder) / leftShoulder;
      const headProminence = (Math.min(leftShoulder, rightShoulder) - head) / head;
      
      if (shoulderSymmetry < 0.05 && headProminence > 0.02) {
        return {
          name: 'Обратная голова и плечи',
          type: 'BULLISH',
          confidence: 80 + Math.min(15, (1 - shoulderSymmetry) * 100),
          description: 'Классический бычий паттерн разворота тренда',
          candleRange: candles.length,
          requiredCandles: 15
        };
      }
    }

    return null;
  };

  const detectDoubleTop = (candles: CandleData[]): PatternResult | null => {
    if (candles.length < 8) return null;

    const highs = candles.map(c => c.high);
    const mid = Math.floor(candles.length / 2);
    
    const firstPeak = Math.max(...highs.slice(0, mid));
    const secondPeak = Math.max(...highs.slice(mid));
    const valley = Math.min(...highs.slice(mid - 2, mid + 2));
    
    const peakSymmetry = Math.abs(firstPeak - secondPeak) / firstPeak;
    const valleyDepth = (Math.min(firstPeak, secondPeak) - valley) / Math.min(firstPeak, secondPeak);
    
    if (peakSymmetry < 0.03 && valleyDepth > 0.015) {
      return {
        name: 'Двойная вершина',
        type: 'BEARISH',
        confidence: 70 + Math.min(25, valleyDepth * 1000),
        description: 'Медвежий паттерн разворота с двумя равными пиками',
        candleRange: candles.length,
        requiredCandles: 8
      };
    }

    return null;
  };

  const detectDoubleBottom = (candles: CandleData[]): PatternResult | null => {
    if (candles.length < 8) return null;

    const lows = candles.map(c => c.low);
    const mid = Math.floor(candles.length / 2);
    
    const firstTrough = Math.min(...lows.slice(0, mid));
    const secondTrough = Math.min(...lows.slice(mid));
    const peak = Math.max(...lows.slice(mid - 2, mid + 2));
    
    const troughSymmetry = Math.abs(firstTrough - secondTrough) / firstTrough;
    const peakHeight = (peak - Math.max(firstTrough, secondTrough)) / Math.max(firstTrough, secondTrough);
    
    if (troughSymmetry < 0.03 && peakHeight > 0.015) {
      return {
        name: 'Двойное дно',
        type: 'BULLISH',
        confidence: 70 + Math.min(25, peakHeight * 1000),
        description: 'Бычий паттерн разворота с двумя равными впадинами',
        candleRange: candles.length,
        requiredCandles: 8
      };
    }

    return null;
  };

  const detectFlag = (candles: CandleData[]): PatternResult | null => {
    if (candles.length < 5) return null;

    const closes = candles.map(c => c.close);
    const volumes = candles.map(c => c.volume);
    
    // Проверяем убывающий объем
    const earlyVolume = volumes.slice(0, Math.floor(volumes.length / 2)).reduce((a, b) => a + b, 0);
    const lateVolume = volumes.slice(Math.floor(volumes.length / 2)).reduce((a, b) => a + b, 0);
    
    // Проверяем консолидацию цены
    const priceRange = Math.max(...closes) - Math.min(...closes);
    const avgPrice = closes.reduce((a, b) => a + b, 0) / closes.length;
    const consolidation = priceRange / avgPrice;
    
    if (lateVolume < earlyVolume * 0.8 && consolidation < 0.02) {
      return {
        name: 'Флаг',
        type: 'NEUTRAL',
        confidence: 65 + Math.min(20, (1 - consolidation * 50) * 20),
        description: 'Паттерн продолжения тренда с консолидацией на убывающем объеме',
        candleRange: candles.length,
        requiredCandles: 5
      };
    }

    return null;
  };

  const detectPennant = (candles: CandleData[]): PatternResult | null => {
    if (candles.length < 7) return null;

    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    
    // Проверяем сужающийся диапазон
    const earlyRange = Math.max(...highs.slice(0, 3)) - Math.min(...lows.slice(0, 3));
    const lateRange = Math.max(...highs.slice(-3)) - Math.min(...lows.slice(-3));
    
    const convergence = (earlyRange - lateRange) / earlyRange;
    
    if (convergence > 0.3) {
      return {
        name: 'Вымпел',
        type: 'NEUTRAL',
        confidence: 60 + Math.min(30, convergence * 100),
        description: 'Паттерн продолжения тренда с сужающимся диапазоном',
        candleRange: candles.length,
        requiredCandles: 7
      };
    }

    return null;
  };

  const detectWedge = (candles: CandleData[]): PatternResult | null => {
    if (candles.length < 8) return null;

    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    
    // Простая линейная регрессия для трендлиний
    const highTrend = calculateTrend(highs);
    const lowTrend = calculateTrend(lows);
    
    // Восходящий клин (медвежий)
    if (highTrend > 0 && lowTrend > 0 && highTrend < lowTrend) {
      return {
        name: 'Восходящий клин',
        type: 'BEARISH',
        confidence: 70,
        description: 'Медвежий паттерн с восходящими сходящимися трендлиниями',
        candleRange: candles.length,
        requiredCandles: 8
      };
    }
    
    // Нисходящий клин (бычий)
    if (highTrend < 0 && lowTrend < 0 && Math.abs(highTrend) < Math.abs(lowTrend)) {
      return {
        name: 'Нисходящий клин',
        type: 'BULLISH',
        confidence: 70,
        description: 'Бычий паттерн с нисходящими сходящимися трендлиниями',
        candleRange: candles.length,
        requiredCandles: 8
      };
    }

    return null;
  };

  const calculateTrend = (prices: number[]): number => {
    const n = prices.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = prices.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((acc, xi, i) => acc + xi * prices[i], 0);
    const sumXX = x.reduce((acc, xi) => acc + xi * xi, 0);
    
    return (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  };

  useEffect(() => {
    if (sortedCandles.length >= 5) {
      const patterns = detectPatterns(sortedCandles);
      setDetectedPatterns(patterns);
    } else {
      setDetectedPatterns([]);
    }
  }, [sortedCandles]);

  return {
    detectedPatterns,
    hasPatterns: detectedPatterns.length > 0
  };
};
