
import { useState, useCallback, useMemo } from 'react';
import { TradingSession, CandleData } from './useTradingSession';

export const useOptimizedSessionState = () => {
  const [currentSession, setCurrentSession] = useState<TradingSession | null>(null);
  const [sessions, setSessions] = useState<TradingSession[]>([]);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Мемоизированные селекторы для предотвращения лишних re-renders
  const sessionStats = useMemo(() => {
    if (!currentSession || candles.length === 0) {
      return { totalCandles: 0, lastPrice: null, priceChange: 0 };
    }

    const sortedCandles = [...candles].sort((a, b) => a.candle_index - b.candle_index);
    const firstCandle = sortedCandles[0];
    const lastCandle = sortedCandles[sortedCandles.length - 1];
    
    return {
      totalCandles: candles.length,
      lastPrice: lastCandle?.close || null,
      priceChange: lastCandle && firstCandle 
        ? ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100 
        : 0
    };
  }, [currentSession, candles]);

  const nextCandleIndex = useMemo(() => {
    if (!currentSession) return 0;
    return Math.max(currentSession.current_candle_index + 1, candles.length);
  }, [currentSession, candles.length]);

  // Оптимизированные сеттеры с правильными типами
  const updateCandles = useCallback((updater: (prev: CandleData[]) => CandleData[]) => {
    setCandles(updater);
  }, []);

  const updateCurrentSession = useCallback((updater: (prev: TradingSession | null) => TradingSession | null) => {
    setCurrentSession(updater);
  }, []);

  return {
    currentSession,
    setCurrentSession: updateCurrentSession,
    sessions,
    setSessions,
    candles,
    setCandles: updateCandles,
    isLoading,
    setIsLoading,
    sessionStats,
    nextCandleIndex
  };
};
