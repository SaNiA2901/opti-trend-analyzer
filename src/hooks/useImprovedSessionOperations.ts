
import { TradingSession, CandleData } from './useTradingSession';
import { useSessionLoading } from './session/useSessionLoading';
import { useSessionCreation } from './session/useSessionCreation';
import { useSessionNavigation } from './session/useSessionNavigation';

export const useImprovedSessionOperations = (
  setIsLoading: (loading: boolean) => void,
  setSessions: (sessions: TradingSession[]) => void,
  setCurrentSession: (updater: (prev: TradingSession | null) => TradingSession | null) => void,
  setCandles: (updater: (prev: CandleData[]) => CandleData[]) => void
) => {
  const { loadSessions } = useSessionLoading(setIsLoading, setSessions);
  const { createSession } = useSessionCreation(setIsLoading, setCurrentSession, setCandles, loadSessions);
  const { loadSession } = useSessionNavigation(setIsLoading, setCurrentSession, setCandles);

  return {
    loadSessions,
    createSession,
    loadSession
  };
};
