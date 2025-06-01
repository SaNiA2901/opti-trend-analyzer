
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

type SessionUpdater = (prev: TradingSession | null) => TradingSession | null;
type CandlesUpdater = (prev: CandleData[]) => CandleData[];

export const useOptimizedSessionState = () => {
  const [currentSession, setCurrentSession] = useState<TradingSession | null>(null);
  const [sessions, setSessions] = useState<TradingSession[]>([]);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Debug logging для отслеживания состояния
  const debugSetCurrentSession = useCallback((updater: TradingSession | null | SessionUpdater) => {
    console.log('useOptimizedSessionState: setCurrentSession called with:', typeof updater === 'function' ? 'function' : updater);
    
    if (typeof updater === 'function') {
      setCurrentSession(prev => {
        const newSession = updater(prev);
        console.log('useOptimizedSessionState: Session updated from', prev?.id || 'null', 'to', newSession?.id || 'null');
        return newSession;
      });
    } else {
      console.log('useOptimizedSessionState: Setting session directly to:', updater?.id || 'null');
      setCurrentSession(updater);
    }
  }, []);

  // Мемоизированные селекторы для предотвращения лишних re-renders
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

  // Типизированные сеттеры
  const updateCandles = useCallback((updater: CandleData[] | CandlesUpdater) => {
    if (typeof updater === 'function') {
      setCandles(updater);
    } else {
      setCandles(updater);
    }
  }, []);

  const resetState = useCallback(() => {
    setCurrentSession(null);
    setCandles([]);
    setIsLoading(false);
  }, []);

  return {
    currentSession,
    setCurrentSession: debugSetCurrentSession,
    sessions,
    setSessions,
    candles,
    setCandles: updateCandles,
    isLoading,
    setIsLoading,
    sessionStats,
    nextCandleIndex,
    resetState
  };
};
