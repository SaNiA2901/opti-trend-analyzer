
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
    console.log('useSessionLoading: Starting to load sessions...');
    setIsLoading(true);
    
    try {
      const data = await handleAsyncError(
        () => sessionService.loadSessions(),
        'Ошибка загрузки сессий',
        { source: 'session-loading' }
      );
      
      if (data) {
        // Атомарное обновление состояния
        setSessions(data);
        console.log('useSessionLoading: Sessions loaded successfully:', data.length);
      } else {
        console.warn('useSessionLoading: No session data received');
        setSessions([]);
      }
    } catch (error) {
      console.error('useSessionLoading: Failed to load sessions:', error);
      setSessions([]); // Сброс до пустого состояния при ошибке
      throw error; // Пробрасываем ошибку для обработки выше
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setSessions, handleAsyncError]);

  return { loadSessions };
};
