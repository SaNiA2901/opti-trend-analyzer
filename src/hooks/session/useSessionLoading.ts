
import { useCallback } from 'react';
import { sessionService } from '@/services/sessionService';
import { TradingSession } from '@/hooks/useTradingSession';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export const useSessionLoading = (
  setIsLoading: (loading: boolean) => void,
  setSessions: (sessions: TradingSession[]) => void
) => {
  const { handleAsyncError } = useErrorHandler();

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await handleAsyncError(
        () => sessionService.loadSessions(),
        'Ошибка загрузки сессий',
        { source: 'session-loading' }
      );
      if (data) {
        setSessions(data);
        console.log('Sessions loaded successfully:', data.length);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setSessions, handleAsyncError]);

  return { loadSessions };
};
