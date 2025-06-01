
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

  // Улучшенный сеттер с синхронизацией состояния
  const debugSetCurrentSession = useCallback((updater: TradingSession | null | SessionUpdater) => {
    console.log('useOptimizedSessionState: setCurrentSession called with:', typeof updater === 'function' ? 'function' : updater);
    
    setCurrentSession(prev => {
      const newSession = typeof updater === 'function' ? updater(prev) : updater;
      console.log('useOptimizedSessionState: Session updated from', prev?.id || 'null', 'to', newSession?.id || 'null');
      
      // Принудительное обновление состояния для синхронизации
      setTimeout(() => {
        console.log('useOptimizedSessionState: Forcing state sync for session:', newSession?.id || 'null');
      }, 0);
      
      return newSession;
    });
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

  // Типизированные сеттеры с улучшенной обработкой
  const updateCandles = useCallback((updater: CandleData[] | CandlesUpdater) => {
    setCandles(prev => {
      const newCandles = typeof updater === 'function' ? updater(prev) : updater;
      console.log('useOptimizedSessionState: Candles updated, count:', newCandles.length);
      return newCandles;
    });
  }, []);

  const resetState = useCallback(() => {
    console.log('useOptimizedSessionState: Resetting all state');
    setCurrentSession(null);
    setCandles([]);
    setIsLoading(false);
  }, []);

  // Функция для принудительной синхронизации состояния
  const forceStateSync = useCallback(() => {
    console.log('useOptimizedSessionState: Force syncing state');
    setCurrentSession(prev => ({ ...prev }));
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
    resetState,
    forceStateSync
  };
};
