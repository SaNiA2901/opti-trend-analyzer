
import { useMemo, useCallback } from 'react';
import { useCandleOperations } from './candle/useCandleOperations';
import { useSessionManager } from './session/useSessionManager';

export const useApplicationState = () => {
  const {
    sessions,
    currentSession,
    candles,
    isLoading,
    sessionStats,
    nextCandleIndex,
    createSession,
    loadSession,
    deleteSession,
    resetSessionState,
    updateCandles,
    setCurrentSession
  } = useSessionManager();

  const { saveCandle, deleteCandle, updateCandle } = useCandleOperations(
    currentSession,
    updateCandles,
    setCurrentSession
  );

  // Мемоизируем вычисление последней свечи
  const lastCandle = useMemo(() => {
    if (candles.length === 0) return null;
    return candles.reduce((latest, current) => 
      current.candle_index > latest.candle_index ? current : latest
    );
  }, [candles]);

  const deleteLastCandle = useCallback(async () => {
    if (!lastCandle) return;
    await deleteCandle(lastCandle.candle_index);
  }, [lastCandle, deleteCandle]);

  return {
    // Состояние сессий
    sessions,
    currentSession,
    candles,
    isLoading,
    sessionStats,
    nextCandleIndex,
    
    // Операции с сессиями
    loadSession,
    createSession,
    deleteSession,
    resetSessionState,
    
    // Операции со свечами
    saveCandle,
    deleteLastCandle,
    updateCandle
  };
};
