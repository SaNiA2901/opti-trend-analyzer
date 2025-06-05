
import { useSessionState } from './session/useSessionState';
import { useSessionStats } from './session/useSessionStats';
import { useSessionInitialization } from './session/useSessionInitialization';
import { useSessionOperations } from './session/useSessionOperations';
import { useCandleOperations } from './candle/useCandleOperations';

export const useApplicationState = () => {
  const {
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
  } = useSessionState();

  const { sessionStats, nextCandleIndex } = useSessionStats(currentSession, candles);

  const { loadSessions } = useSessionInitialization(setSessions, setIsLoading);

  const {
    createSession,
    loadSession,
    deleteSession
  } = useSessionOperations(
    setIsLoading,
    setSessions,
    setCurrentSession,
    updateCandles
  );

  const { saveCandle, deleteCandle, updateCandle } = useCandleOperations(
    currentSession,
    updateCandles,
    setCurrentSession
  );

  const deleteLastCandle = async () => {
    if (candles.length === 0) return;
    const lastCandle = candles.reduce((latest, current) => 
      current.candle_index > latest.candle_index ? current : latest
    );
    await deleteCandle(lastCandle.candle_index);
  };

  return {
    sessions,
    currentSession,
    candles,
    isLoading,
    sessionStats,
    nextCandleIndex,
    loadSession,
    createSession,
    deleteSession,
    saveCandle,
    deleteLastCandle,
    updateCandle,
    resetSessionState
  };
};
