
import { TradingSession, CandleData } from './useTradingSession';
import { useSessionLoading } from './session/useSessionLoading';
import { useSessionCreation } from './session/useSessionCreation';
import { useSessionNavigation } from './session/useSessionNavigation';
import { useSessionDeletion } from './session/useSessionDeletion';

export const useImprovedSessionOperations = (
  setIsLoading: (loading: boolean) => void,
  setSessions: (sessions: TradingSession[]) => void,
  setCurrentSession: (session: TradingSession | null) => void,
  setCandles: (updater: (prev: CandleData[]) => CandleData[]) => void
) => {
  const { loadSessions } = useSessionLoading(setIsLoading, setSessions);
  const { createSession } = useSessionCreation(setIsLoading, setCurrentSession, setCandles, loadSessions);
  const { loadSession } = useSessionNavigation(setIsLoading, setCurrentSession, setCandles);
  const { deleteSession } = useSessionDeletion(setIsLoading, setSessions, setCurrentSession, loadSessions);

  return {
    loadSessions,
    createSession,
    loadSession,
    deleteSession
  };
};
