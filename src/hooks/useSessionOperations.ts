
import { sessionService } from '@/services/sessionService';
import { TradingSession } from './useTradingSession';

export const useSessionOperations = (
  setIsLoading: (loading: boolean) => void,
  setSessions: (sessions: TradingSession[]) => void,
  setCurrentSession: (session: TradingSession | null) => void,
  setCandles: (candles: any[]) => void
) => {
  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await sessionService.loadSessions();
      setSessions(data);
      console.log('Sessions loaded:', data.length);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async (sessionData: {
    session_name: string;
    pair: string;
    timeframe: string;
    start_date: string;
    start_time: string;
  }) => {
    setIsLoading(true);
    try {
      const session = await sessionService.createSession(sessionData);
      
      console.log('Session created with ID:', session.id);
      setCurrentSession(session);
      setCandles([]);
      await loadSessions();
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    setIsLoading(true);
    try {
      console.log('Loading session data for ID:', sessionId);
      
      const { session, candles: sessionCandles } = await sessionService.loadSessionWithCandles(sessionId);

      console.log('Session data loaded:', session);
      console.log('Candles loaded:', sessionCandles.length);

      setCurrentSession(session);
      setCandles(sessionCandles);
      
      return session;
    } catch (error) {
      console.error('Error loading session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    loadSessions,
    createSession,
    loadSession
  };
};
