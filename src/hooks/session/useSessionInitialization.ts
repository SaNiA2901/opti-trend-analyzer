
import { useEffect, useCallback } from 'react';
import { sessionService } from '@/services/sessionService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { TradingSession } from '@/types/session';

export const useSessionInitialization = (
  setSessions: (sessions: TradingSession[]) => void,
  setIsLoading: (loading: boolean) => void
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

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return { loadSessions };
};
