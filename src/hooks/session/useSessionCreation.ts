
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
  setCurrentSession: (session: TradingSession | null) => void,
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

    setIsLoading(true);
    
    try {
      const session = await handleAsyncError(
        () => sessionService.createSession(sessionData),
        'Ошибка создания сессии',
        { source: 'session-creation' }
      );
      
      if (session) {
        // Синхронное обновление состояния
        setCandles(() => []);
        setCurrentSession(session);
        
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
