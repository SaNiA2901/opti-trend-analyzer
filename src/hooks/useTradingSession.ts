
import { useState, useEffect } from 'react';
import { sessionService } from '@/services/sessionService';
import { candleService } from '@/services/candleService';
import { useCandleValidation } from './useCandleValidation';
import { useCandleTime } from './useCandleTime';

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

export const useTradingSession = () => {
  const [currentSession, setCurrentSession] = useState<TradingSession | null>(null);
  const [sessions, setSessions] = useState<TradingSession[]>([]);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { validateCandleData } = useCandleValidation();
  const { calculateCandleTime } = useCandleTime();

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const data = await sessionService.loadSessions();
      setSessions(data);
      console.log('Sessions loaded:', data.length);
    } catch (error) {
      console.error('Error loading sessions:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createSession = async (sessionData: {
    session_name: string;
    pair: string;
    timeframe: string;
    start_date: string;
    start_time: string;
  }) => {
    setIsLoading(true);
    try {
      const session = await sessionService.createSession(sessionData);
      
      console.log('Session created with ID:', session.id);
      setCurrentSession(session);
      setCandles([]);
      await loadSessions();
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    setIsLoading(true);
    try {
      console.log('Loading session data for ID:', sessionId);
      
      const { session, candles: sessionCandles } = await sessionService.loadSessionWithCandles(sessionId);

      console.log('Session data loaded:', session);
      console.log('Candles loaded:', sessionCandles.length);

      setCurrentSession(session);
      setCandles(sessionCandles);
      
      return session;
    } catch (error) {
      console.error('Error loading session:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const saveCandle = async (candleData: Omit<CandleData, 'id' | 'candle_datetime'>) => {
    if (!currentSession) {
      throw new Error('No active session');
    }

    const validation = validateCandleData(candleData);
    if (!validation.isValid) {
      throw new Error(`Validation errors: ${validation.errors.join(', ')}`);
    }

    try {
      console.log('Calculating candle time for index:', candleData.candle_index);
      const candleDateTime = calculateCandleTime(
        currentSession.start_date,
        currentSession.start_time,
        currentSession.timeframe,
        candleData.candle_index
      );

      const fullCandleData = {
        ...candleData,
        candle_datetime: candleDateTime
      };

      console.log('Saving candle data to database:', fullCandleData);
      const savedCandle = await candleService.saveCandle(fullCandleData);

      const newCandleIndex = Math.max(currentSession.current_candle_index, candleData.candle_index);
      
      console.log('Updating session current_candle_index to:', newCandleIndex);
      await sessionService.updateSessionCandleIndex(currentSession.id, newCandleIndex);

      // Обновляем локальное состояние
      setCandles(prev => {
        const filtered = prev.filter(c => c.candle_index !== candleData.candle_index);
        return [...filtered, savedCandle].sort((a, b) => a.candle_index - b.candle_index);
      });

      setCurrentSession(prev => prev ? {
        ...prev,
        current_candle_index: newCandleIndex
      } : null);

      return savedCandle;
    } catch (error) {
      console.error('Error saving candle:', error);
      throw error;
    }
  };

  const getNextCandleTime = (candleIndex: number): string => {
    if (!currentSession) return '';
    
    try {
      return calculateCandleTime(
        currentSession.start_date,
        currentSession.start_time,
        currentSession.timeframe,
        candleIndex
      );
    } catch (error) {
      console.error('Error calculating next candle time:', error);
      return '';
    }
  };

  // Загрузка сессий при инициализации
  useEffect(() => {
    loadSessions();
  }, []);

  return {
    currentSession,
    sessions,
    candles,
    isLoading,
    createSession,
    loadSession,
    saveCandle,
    getNextCandleTime,
    loadSessions
  };
};
