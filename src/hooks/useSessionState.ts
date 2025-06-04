
import { useState, useEffect, useCallback } from 'react';
import { sessionService } from '@/services/sessionService';
import { useErrorHandler } from '@/hooks/useErrorHandler';

export interface TradingSession {
  id: string;
  session_name: string;
  pair: string;
  timeframe: string;
  start_date: string;
  start_time: string;
  current_candle_index: number;
  created_at: string;
  updated_at: string;
}

export interface CandleData {
  id?: string;
  session_id: string;
  candle_index: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  candle_datetime: string;
  prediction_direction?: string;
  prediction_probability?: number;
  prediction_confidence?: number;
}

export const useSessionState = () => {
  const [sessions, setSessions] = useState<TradingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<TradingSession | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addError } = useErrorHandler();

  // Загрузка всех сессий
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
  }, [addError]);

  // Создание новой сессии
  const createSession = useCallback(async (sessionData: {
    session_name: string;
    pair: string;
    timeframe: string;
    start_date: string;
    start_time: string;
  }) => {
    setIsLoading(true);
    try {
      const newSession = await sessionService.createSession(sessionData);
      setCurrentSession(newSession);
      setCandles([]);
      await loadSessions();
      console.log('Session created:', newSession.id);
      return newSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      addError('Ошибка создания сессии', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [addError, loadSessions]);

  // Загрузка конкретной сессии с её свечами
  const loadSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      const result = await sessionService.loadSessionWithCandles(sessionId);
      setCurrentSession(result.session);
      setCandles(result.candles);
      console.log('Session loaded:', sessionId, 'with', result.candles.length, 'candles');
      return result.session;
    } catch (error) {
      console.error('Failed to load session:', error);
      addError('Ошибка загрузки сессии', error instanceof Error ? error.message : 'Unknown error');
      setCurrentSession(null);
      setCandles([]);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [addError]);

  // Удаление сессии
  const deleteSession = useCallback(async (sessionId: string) => {
    setIsLoading(true);
    try {
      await sessionService.deleteSession(sessionId);
      if (currentSession?.id === sessionId) {
        setCurrentSession(null);
        setCandles([]);
      }
      await loadSessions();
      console.log('Session deleted:', sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
      addError('Ошибка удаления сессии', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [addError, loadSessions, currentSession]);

  // Инициализация при первом рендере
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    sessions,
    currentSession,
    candles,
    isLoading,
    createSession,
    loadSession,
    deleteSession,
    loadSessions,
    setCandles
  };
};
