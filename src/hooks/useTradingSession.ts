
import { useEffect, useRef } from 'react';
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
    getNextCandleTime,
    deleteCandle,
    updateCandle
  } = useImprovedCandleOperations(currentSession, setCandles, setCurrentSession);

  // Используем ref для предотвращения множественных инициализаций
  const initializationRef = useRef({
    isInitialized: false,
    isInitializing: false
  });

  // Единственная инициализация сессий
  useEffect(() => {
    const { isInitialized, isInitializing } = initializationRef.current;
    
    if (isInitialized || isInitializing) {
      return;
    }
    
    initializationRef.current.isInitializing = true;
    
    const initializeSessions = async () => {
      try {
        console.log('useTradingSession: Initializing sessions...');
        await loadSessions();
        console.log('useTradingSession: Sessions initialized successfully');
        initializationRef.current.isInitialized = true;
      } catch (error) {
        console.error('useTradingSession: Failed to initialize sessions:', error);
      } finally {
        initializationRef.current.isInitializing = false;
      }
    };
    
    initializeSessions();
  }, []); // Убираем loadSessions из зависимостей

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
    nextCandleIndex,
    deleteCandle,
    updateCandle
  };
};
