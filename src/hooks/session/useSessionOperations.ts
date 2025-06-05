
import { useCallback } from 'react';
import { sessionService } from '@/services/sessionService';
import { TradingSession, CandleData } from '@/types/session';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface SessionCreationData {
  session_name: string;
  pair: string;
  timeframe: string;
  start_date: string;
  start_time: string;
}

export const useSessionOperations = (
  setIsLoading: (loading: boolean) => void,
  setSessions: (sessions: TradingSession[]) => void,
  setCurrentSession: (session: TradingSession | null) => void,
  updateCandles: (updater: (prev: CandleData[]) => CandleData[]) => void
) => {
  const { addError } = useErrorHandler();

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await sessionService.loadSessions();
      setSessions(data);
      console.log('Sessions loaded:', data.length);
    } catch (error) {
      console.error('Failed to load sessions:', error);
      addError('Ошибка загрузки сессий', error instanceof Error ? error.message : 'Unknown error');
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }, [setSessions, setIsLoading, addError]);

  const createSession = useCallback(async (sessionData: SessionCreationData) => {
    setIsLoading(true);
    try {
      const session = await sessionService.createSession(sessionData);
      setCurrentSession(session);
      updateCandles(() => []);
      await loadSessions();
      console.log('Session created:', session.id);
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      addError('Ошибка создания сессии', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setCurrentSession, updateCandles, loadSessions, addError]);

  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const result = await sessionService.loadSessionWithCandles(sessionId);
      updateCandles(() => result.candles);
      setCurrentSession(result.session);
      console.log('Session loaded:', sessionId, 'with', result.candles.length, 'candles');
      return result.session;
    } catch (error) {
      console.error('Failed to load session:', error);
      addError('Ошибка загрузки сессии', error instanceof Error ? error.message : 'Unknown error');
      setCurrentSession(null);
      updateCandles(() => []);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setCurrentSession, updateCandles, addError]);

  const deleteSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      await sessionService.deleteSession(sessionId);
      setCurrentSession(null);
      await loadSessions();
      console.log('Session deleted:', sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
      addError('Ошибка удаления сессии', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setCurrentSession, loadSessions, addError]);

  return {
    loadSessions,
    createSession,
    loadSession,
    deleteSession
  };
};
