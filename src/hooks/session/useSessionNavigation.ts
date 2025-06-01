
import { useCallback } from 'react';
import { sessionService } from '@/services/sessionService';
import { TradingSession, CandleData } from '@/hooks/useTradingSession';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export const useSessionNavigation = (
  setIsLoading: (loading: boolean) => void,
  setCurrentSession: (updater: (prev: TradingSession | null) => TradingSession | null) => void,
  setCandles: (updater: (prev: CandleData[]) => CandleData[]) => void
) => {
  const { handleAsyncError } = useErrorHandler();

  const loadSession = useCallback(async (sessionId: string) => {
    if (!sessionId?.trim()) {
      throw new Error('ID сессии не может быть пустым');
    }

    console.log('useSessionNavigation: Loading session:', sessionId);
    setIsLoading(true);
    
    try {
      const result = await handleAsyncError(
        () => sessionService.loadSessionWithCandles(sessionId),
        'Ошибка загрузки сессии',
        { source: 'session-navigation' }
      );

      if (result) {
        console.log('useSessionNavigation: Session loaded successfully:', result.session.id);
        console.log('useSessionNavigation: Candles loaded:', result.candles.length);
        
        // Сначала обновляем свечи, затем сессию для правильной синхронизации
        setCandles(() => {
          console.log('useSessionNavigation: Setting candles:', result.candles.length);
          return result.candles;
        });
        
        // Используем setTimeout для обеспечения правильного порядка обновлений
        setTimeout(() => {
          setCurrentSession(() => {
            console.log('useSessionNavigation: Setting current session:', result.session.id);
            return result.session;
          });
        }, 0);
        
        return result.session;
      }
      throw new Error('Не удалось загрузить сессию');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setCurrentSession, setCandles, handleAsyncError]);

  return { loadSession };
};
