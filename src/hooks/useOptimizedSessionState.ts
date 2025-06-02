
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

export const useOptimizedSessionState = () => {
  const [currentSession, setCurrentSession] = useState<TradingSession | null>(null);
  const [sessions, setSessions] = useState<TradingSession[]>([]);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Оптимизированный сеттер сессии
  const updateCurrentSession = useCallback((session: TradingSession | null) => {
    setCurrentSession(prev => {
      if (prev?.id === session?.id) return prev; // Предотвращаем ненужные обновления
      return session;
    });
  }, []);

  // Мемоизированная статистика сессии
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

    const sortedCandles = [...candles].sort((a, b) => a.candle_index - b.candle_index);
    const firstCandle = sortedCandles[0];
    const lastCandle = sortedCandles[sortedCandles.length - 1];
    
    const prices = candles.flatMap(c => [c.open, c.high, c.low, c.close]);
    const highestPrice = Math.max(...prices);
    const lowestPrice = Math.min(...prices);
    const averageVolume = candles.reduce((sum, c) => sum + c.volume, 0) / candles.length;
    
    return {
      totalCandles: candles.length,
      lastPrice: lastCandle?.close || null,
      priceChange: lastCandle && firstCandle 
        ? ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100 
        : 0,
      highestPrice,
      lowestPrice,
      averageVolume
    };
  }, [currentSession, candles]);

  const nextCandleIndex = useMemo(() => {
    if (!currentSession) return 0;
    return Math.max(currentSession.current_candle_index + 1, candles.length);
  }, [currentSession, candles.length]);

  return {
    currentSession,
    setCurrentSession: updateCurrentSession,
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
