
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
    setCurrentSession // Передаем реальную функцию вместо пустой
  );

  const deleteLastCandle = async () => {
    if (candles.length === 0) return;
    const lastCandle = candles.reduce((latest, current) => 
      current.candle_index > latest.candle_index ? current : latest
    );
    await deleteCandle(lastCandle.candle_index);
  };

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
