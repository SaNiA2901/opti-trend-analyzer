
import { useCallback } from 'react';
import { sessionService } from '@/services/sessionService';
import { TradingSession, CandleData } from '@/hooks/useTradingSession';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface SessionCreationData {
  session_name: string;
  pair: string;
  timeframe: string;
  start_date: string;
  start_time: string;
}

export const useSessionCreation = (
  setIsLoading: (loading: boolean) => void,
  setCurrentSession: (updater: (prev: TradingSession | null) => TradingSession | null) => void,
  setCandles: (updater: (prev: CandleData[]) => CandleData[]) => void,
  loadSessions: () => Promise<void>
) => {
  const { handleAsyncError } = useErrorHandler();

  const createSession = useCallback(async (sessionData: SessionCreationData) => {
    // Валидация входных данных
    const requiredFields = ['session_name', 'pair', 'timeframe', 'start_date', 'start_time'];
    for (const field of requiredFields) {
      if (!sessionData[field as keyof SessionCreationData]?.trim()) {
        throw new Error(`Поле "${field}" обязательно для заполнения`);
      }
    }

    console.log('useSessionCreation: Creating session with data:', sessionData);
    setIsLoading(true);
    
    try {
      const session = await handleAsyncError(
        () => sessionService.createSession(sessionData),
        'Ошибка создания сессии',
        { source: 'session-creation' }
      );
      
      if (session) {
        console.log('useSessionCreation: Session created successfully:', session.id);
        console.log('useSessionCreation: Setting as current session:', session);
        
        // Устанавливаем созданную сессию как текущую
        setCurrentSession(() => {
          console.log('useSessionCreation: Current session setter called with:', session);
          return session;
        });
        
        // Очищаем свечи для новой сессии
        setCandles(() => {
          console.log('useSessionCreation: Clearing candles for new session');
          return [];
        });
        
        // Перезагружаем список сессий
        await loadSessions();
        return session;
      }
      throw new Error('Не удалось создать сессию');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setCurrentSession, setCandles, loadSessions, handleAsyncError]);

  return { createSession };
};
