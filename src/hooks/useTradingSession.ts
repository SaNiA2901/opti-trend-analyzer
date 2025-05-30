import { useEffect } from 'react';
import { useOptimizedSessionState } from './useOptimizedSessionState';
import { useImprovedSessionOperations } from './useImprovedSessionOperations';
import { useImprovedCandleOperations } from './useImprovedCandleOperations';

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
    setIsLoading,
    sessionStats,
    nextCandleIndex
  } = useOptimizedSessionState();

  const {
    loadSessions,
    createSession,
    loadSession
  } = useImprovedSessionOperations(setIsLoading, setSessions, setCurrentSession, setCandles);

  const {
    saveCandle,
    getNextCandleTime
  } = useImprovedCandleOperations(currentSession, setCandles, setCurrentSession);

  // Загрузка сессий при инициализации
  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  return {
    currentSession,
    sessions,
    candles,
    isLoading,
    createSession,
    loadSession,
    saveCandle,
    getNextCandleTime,
    loadSessions,
    sessionStats,
    nextCandleIndex
  };
};
