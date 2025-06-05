
import { useSessionState } from './session/useSessionState';
import { useSessionStats } from './session/useSessionStats';
import { useSessionInitialization } from './session/useSessionInitialization';
import { useSessionCreation } from './session/useSessionCreation';
import { useSessionNavigation } from './session/useSessionNavigation';
import { useSessionDeletion } from './session/useSessionDeletion';
import { useCandleSaving } from './candle/useCandleSaving';
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

  const { createSession } = useSessionCreation(
    setIsLoading,
    setCurrentSession,
    updateCandles,
    loadSessions
  );

  const { loadSession } = useSessionNavigation(
    setIsLoading,
    setCurrentSession,
    updateCandles
  );

  const { deleteSession } = useSessionDeletion(
    setIsLoading,
    setSessions,
    setCurrentSession,
    loadSessions
  );

  const { saveCandle } = useCandleSaving(
    currentSession,
    updateCandles,
    setCurrentSession
  );

  const { deleteCandle, updateCandle } = useCandleOperations(
    currentSession,
    updateCandles
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
