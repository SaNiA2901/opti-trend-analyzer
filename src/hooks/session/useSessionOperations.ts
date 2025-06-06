
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

  const createSession = useCallback(async (sessionData: SessionCreationData) => {
    setIsLoading(true);
    try {
      const session = await sessionService.createSession(sessionData);
      setCurrentSession(session);
      updateCandles(() => []);
      console.log('Session created:', session.id);
      return session;
    } catch (error) {
      console.error('Failed to create session:', error);
      addError('Ошибка создания сессии', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setCurrentSession, updateCandles, addError]);

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
      console.log('Session deleted:', sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
      addError('Ошибка удаления сессии', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setCurrentSession, addError]);

  return {
    createSession,
    loadSession,
    deleteSession
  };
};
