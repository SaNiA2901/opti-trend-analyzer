
import { useCallback } from 'react';
import { sessionService } from '@/services/sessionService';
import { TradingSession } from '@/hooks/useTradingSession';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export const useSessionDeletion = (
  setIsLoading: (loading: boolean) => void,
  setSessions: (sessions: TradingSession[]) => void,
  setCurrentSession: (session: TradingSession | null) => void,
  loadSessions: () => Promise<void>
) => {
  const { handleAsyncError } = useErrorHandler();

  const deleteSession = useCallback(async (sessionId: string) => {
    if (!sessionId?.trim()) {
      throw new Error('ID сессии не может быть пустым');
    }

    console.log('useSessionDeletion: Deleting session:', sessionId);
    setIsLoading(true);
    
    try {
      await handleAsyncError(
        () => sessionService.deleteSession(sessionId),
        'Ошибка удаления сессии',
        { source: 'session-deletion' }
      );

      // Очищаем текущую сессию если удаляем активную
      setCurrentSession(null);
      
      // Перезагружаем список сессий
      await loadSessions();
      
      console.log('useSessionDeletion: Session deleted successfully:', sessionId);
    } catch (error) {
      console.error('useSessionDeletion: Failed to delete session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setSessions, setCurrentSession, loadSessions, handleAsyncError]);

  return { deleteSession };
};
