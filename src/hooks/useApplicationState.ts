
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

  const { 
    saveCandle, 
    deleteCandle, 
    updateCandle,
    syncCandleData 
  } = useCandleOperations(
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

  // НОВАЯ ФУНКЦИЯ: Проверка синхронизации данных
  const checkDataSync = useCallback(() => {
    if (!currentSession) return null;
    
    const actualCandleCount = candles.length;
    const expectedMaxIndex = actualCandleCount > 0 
      ? Math.max(...candles.map(c => c.candle_index))
      : 0;
    
    const isSync = currentSession.current_candle_index === expectedMaxIndex;
    
    return {
      isSync,
      actualCandleCount,
      sessionIndex: currentSession.current_candle_index,
      expectedMaxIndex,
      diff: currentSession.current_candle_index - expectedMaxIndex
    };
  }, [currentSession, candles]);

  // НОВАЯ ФУНКЦИЯ: Автоматическая синхронизация при обнаружении проблем
  const autoSync = useCallback(async () => {
    const syncCheck = checkDataSync();
    if (!syncCheck) return false;
    
    if (!syncCheck.isSync) {
      console.log('🚨 Обнаружена рассинхронизация, выполняем автосинхронизацию...');
      console.log(`Свечей в интерфейсе: ${syncCheck.actualCandleCount}`);
      console.log(`Индекс в сессии: ${syncCheck.sessionIndex}`);
      console.log(`Ожидаемый индекс: ${syncCheck.expectedMaxIndex}`);
      
      await syncCandleData();
      return true;
    }
    
    return false;
  }, [checkDataSync, syncCandleData]);

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
    updateCandle,
    
    // НОВЫЕ ФУНКЦИИ: Синхронизация данных
    syncCandleData,
    checkDataSync,
    autoSync
  };
};
