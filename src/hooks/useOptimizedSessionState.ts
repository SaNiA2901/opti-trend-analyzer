
import { useState, useCallback, useMemo } from 'react';
import { TradingSession, CandleData } from './useTradingSession';

interface SessionStats {
  totalCandles: number;
  lastPrice: number | null;
  priceChange: number;
  highestPrice: number | null;
  lowestPrice: number | null;
  averageVolume: number;
}

// Типизированные функции состояния
type SetCurrentSessionFn = (session: TradingSession | null) => void;
type SetSessionsFn = (sessions: TradingSession[]) => void;
type SetCandlesFn = (updater: (prev: CandleData[]) => CandleData[]) => void;
type SetIsLoadingFn = (loading: boolean) => void;

export const useOptimizedSessionState = () => {
  const [currentSession, setCurrentSessionState] = useState<TradingSession | null>(null);
  const [sessions, setSessionsState] = useState<TradingSession[]>([]);
  const [candles, setCandlesState] = useState<CandleData[]>([]);
  const [isLoading, setIsLoadingState] = useState(false);

  // Исправленные мемоизированные сеттеры
  const setCurrentSession: SetCurrentSessionFn = useCallback((session) => {
    setCurrentSessionState(prev => {
      // Простое сравнение по ID без дополнительных проверок
      if (prev?.id === session?.id) {
        return prev;
      }
      console.log('Session state updated:', session?.id || 'null');
      return session;
    });
  }, []);

  const setSessions: SetSessionsFn = useCallback((sessions) => {
    setSessionsState(prev => {
      if (prev.length === sessions.length && 
          prev.every((session, index) => session.id === sessions[index]?.id)) {
        return prev;
      }
      console.log('Sessions state updated:', sessions.length);
      return sessions;
    });
  }, []);

  const setCandles: SetCandlesFn = useCallback((updater) => {
    setCandlesState(prev => {
      const newCandles = updater(prev);
      if (newCandles.length !== prev.length || 
          newCandles.some((candle, index) => candle.id !== prev[index]?.id)) {
        console.log('Candles state updated:', newCandles.length);
        return newCandles;
      }
      return prev;
    });
  }, []);

  const setIsLoading: SetIsLoadingFn = useCallback((loading) => {
    setIsLoadingState(prev => {
      if (prev !== loading) {
        console.log('Loading state updated:', loading);
        return loading;
      }
      return prev;
    });
  }, []);

  // Оптимизированная статистика с глубокой мемоизацией
  const sessionStats = useMemo((): SessionStats => {
    if (!currentSession || candles.length === 0) {
      return { 
        totalCandles: 0, 
        lastPrice: null, 
        priceChange: 0,
        highestPrice: null,
        lowestPrice: null,
        averageVolume: 0
      };
    }

    // Сортировка только один раз
    const sortedCandles = [...candles].sort((a, b) => a.candle_index - b.candle_index);
    const firstCandle = sortedCandles[0];
    const lastCandle = sortedCandles[sortedCandles.length - 1];
    
    // Эффективный расчет статистики
    let highestPrice = -Infinity;
    let lowestPrice = Infinity;
    let totalVolume = 0;
    
    for (const candle of candles) {
      const prices = [candle.open, candle.high, candle.low, candle.close];
      for (const price of prices) {
        if (price > highestPrice) highestPrice = price;
        if (price < lowestPrice) lowestPrice = price;
      }
      totalVolume += candle.volume;
    }
    
    return {
      totalCandles: candles.length,
      lastPrice: lastCandle?.close || null,
      priceChange: lastCandle && firstCandle 
        ? ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100 
        : 0,
      highestPrice: highestPrice === -Infinity ? null : highestPrice,
      lowestPrice: lowestPrice === Infinity ? null : lowestPrice,
      averageVolume: candles.length > 0 ? totalVolume / candles.length : 0
    };
  }, [currentSession?.id, candles]);

  // Мемоизированный индекс следующей свечи
  const nextCandleIndex = useMemo(() => {
    if (!currentSession) return 0;
    return Math.max(currentSession.current_candle_index + 1, candles.length);
  }, [currentSession?.current_candle_index, candles.length]);

  return {
    currentSession,
    setCurrentSession,
    sessions,
    setSessions,
    candles,
    setCandles,
    isLoading,
    setIsLoading,
    sessionStats,
    nextCandleIndex
  };
};
