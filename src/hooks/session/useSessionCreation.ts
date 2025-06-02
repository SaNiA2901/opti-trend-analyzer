
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
    // Расширенная валидация входных данных
    const requiredFields = ['session_name', 'pair', 'timeframe', 'start_date', 'start_time'];
    const missingFields = requiredFields.filter(
      field => !sessionData[field as keyof SessionCreationData]?.trim()
    );
    
    if (missingFields.length > 0) {
      throw new Error(`Обязательные поля не заполнены: ${missingFields.join(', ')}`);
    }

    console.log('useSessionCreation: Creating session:', sessionData.session_name);
    setIsLoading(true);
    
    try {
      const session = await handleAsyncError(
        () => sessionService.createSession(sessionData),
        'Ошибка создания сессии',
        { source: 'session-creation' }
      );
      
      if (session) {
        // Атомарное обновление состояния
        setCandles(() => []);
        setCurrentSession(session);
        
        // Асинхронная перезагрузка списка сессий в фоне
        loadSessions().catch(error => {
          console.warn('useSessionCreation: Failed to reload sessions list:', error);
        });
        
        console.log('useSessionCreation: Session created successfully:', {
          id: session.id,
          name: session.session_name
        });
        return session;
      }
      throw new Error('Не удалось создать сессию');
    } catch (error) {
      console.error('useSessionCreation: Failed to create session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setCurrentSession, setCandles, loadSessions, handleAsyncError]);

  return { createSession };
};
