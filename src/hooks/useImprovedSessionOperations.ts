
import { useCallback } from 'react';
import { sessionService } from '@/services/sessionService';
import { TradingSession, CandleData } from './useTradingSession';
import { useErrorHandler } from './useErrorHandler';

export const useImprovedSessionOperations = (
  setIsLoading: (loading: boolean) => void,
  setSessions: (sessions: TradingSession[]) => void,
  setCurrentSession: (updater: (prev: TradingSession | null) => TradingSession | null) => void,
  setCandles: (updater: (prev: CandleData[]) => CandleData[]) => void
) => {
  const { handleAsyncError } = useErrorHandler();

  const loadSessions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await handleAsyncError(
        () => sessionService.loadSessions(),
        'Ошибка загрузки сессий'
      );
      if (data) {
        setSessions(data);
        console.log('Sessions loaded successfully:', data.length);
      }
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setSessions, handleAsyncError]);

  const createSession = useCallback(async (sessionData: {
    session_name: string;
    pair: string;
    timeframe: string;
    start_date: string;
    start_time: string;
  }) => {
    setIsLoading(true);
    try {
      const session = await handleAsyncError(
        () => sessionService.createSession(sessionData),
        'Ошибка создания сессии'
      );
      
      if (session) {
        console.log('Session created successfully:', session.id);
        setCurrentSession(() => session);
        setCandles(() => []);
        await loadSessions();
        return session;
      }
      throw new Error('Не удалось создать сессию');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setCurrentSession, setCandles, loadSessions, handleAsyncError]);

  const loadSession = useCallback(async (sessionId: string) => {
    if (!sessionId) {
      throw new Error('ID сессии не может быть пустым');
    }

    setIsLoading(true);
    try {
      const result = await handleAsyncError(
        () => sessionService.loadSessionWithCandles(sessionId),
        'Ошибка загрузки сессии'
      );

      if (result) {
        console.log('Session loaded successfully:', result.session.id);
        console.log('Candles loaded:', result.candles.length);
        
        setCurrentSession(() => result.session);
        setCandles(() => result.candles);
        return result.session;
      }
      throw new Error('Не удалось загрузить сессию');
    } finally {
      setIsLoading(false);
    }
  }, [setIsLoading, setCurrentSession, setCandles, handleAsyncError]);

  return {
    loadSessions,
    createSession,
    loadSession
  };
};
