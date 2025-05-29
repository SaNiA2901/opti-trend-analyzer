
import { useEffect } from 'react';
import { useSessionState } from './useSessionState';
import { useSessionOperations } from './useSessionOperations';
import { useCandleOperations } from './useCandleOperations';

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
  const {
    currentSession,
    setCurrentSession,
    sessions,
    setSessions,
    candles,
    setCandles,
    isLoading,
    setIsLoading
  } = useSessionState();

  const {
    loadSessions,
    createSession,
    loadSession
  } = useSessionOperations(setIsLoading, setSessions, setCurrentSession, setCandles);

  const {
    saveCandle,
    getNextCandleTime
  } = useCandleOperations(currentSession, setCandles, setCurrentSession);

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
