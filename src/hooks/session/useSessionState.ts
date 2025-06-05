
import { useState, useCallback } from 'react';
import { TradingSession, CandleData } from '@/types/session';

export const useSessionState = () => {
  const [sessions, setSessions] = useState<TradingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<TradingSession | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const updateCandles = useCallback((updater: (prev: CandleData[]) => CandleData[]) => {
    setCandles(prev => {
      const newCandles = updater(prev);
      if (newCandles.length !== prev.length || 
          newCandles.some((candle, index) => candle.id !== prev[index]?.id)) {
        console.log('Candles updated:', newCandles.length);
        return newCandles;
      }
      return prev;
    });
  }, []);

  const resetSessionState = useCallback(() => {
    setCurrentSession(null);
    setCandles([]);
  }, []);

  return {
    sessions,
    setSessions,
    currentSession,
    setCurrentSession,
    candles,
    setCandles,
    isLoading,
    setIsLoading,
    updateCandles,
    resetSessionState
  };
};
