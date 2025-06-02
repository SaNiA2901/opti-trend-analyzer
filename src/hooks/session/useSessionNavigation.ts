
import { useCallback } from 'react';
import { sessionService } from '@/services/sessionService';
import { TradingSession, CandleData } from '@/hooks/useTradingSession';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export const useSessionNavigation = (
  setIsLoading: (loading: boolean) => void,
  setCurrentSession: (session: TradingSession | null) => void,
  setCandles: (updater: (prev: CandleData[]) => CandleData[]) => void
) => {
  const { handleAsyncError } = useErrorHandler();

  const loadSession = useCallback(async (sessionId: string) => {
    if (!sessionId?.trim()) {
      throw new Error('ID сессии не может быть пустым');
    }

    setIsLoading(true);
    
    try {
      const result = await handleAsyncError(
        () => sessionService.loadSessionWithCandles(sessionId),
        'Ошибка загрузки сессии',
        { source: 'session-navigation' }
      );

      if (result) {
        // Атомарное обновление состояния для предотвращения race conditions
        setCandles(() => result.candles);
        setCurrentSession(result.session);
        
        console.log('Session loaded successfully:', result.session.id);
        return result.session;
      }
      throw new Error('Не удалось загрузить сессию');
    } catch (error) {
      console.error('Failed to load session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setCurrentSession, setCandles, handleAsyncError]);

  return { loadSession };
};
