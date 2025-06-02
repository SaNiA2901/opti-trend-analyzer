
import { useEffect, useRef, useCallback } from 'react';
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

// Глобальный флаг для предотвращения множественных инициализаций
let globalInitializationState = {
  isInitialized: false,
  isInitializing: false
};

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

  // Мемоизированная функция инициализации
  const initializeSessions = useCallback(async () => {
    if (globalInitializationState.isInitialized || globalInitializationState.isInitializing) {
      return;
    }
    
    globalInitializationState.isInitializing = true;
    
    try {
      console.log('useTradingSession: Starting initialization...');
      await loadSessions();
      globalInitializationState.isInitialized = true;
      console.log('useTradingSession: Initialization completed successfully');
    } catch (error) {
      console.error('useTradingSession: Initialization failed:', error);
      globalInitializationState.isInitializing = false;
    } finally {
      globalInitializationState.isInitializing = false;
    }
  }, [loadSessions]);

  // Единственная инициализация с защитой от повторных вызовов
  useEffect(() => {
    initializeSessions();
  }, []); // Пустой массив зависимостей для единственного вызова

  // Очистка при размонтировании
  useEffect(() => {
    return () => {
      // Сброс состояния при размонтировании последнего экземпляра
      globalInitializationState.isInitialized = false;
      globalInitializationState.isInitializing = false;
    };
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
    loadSessions,
    sessionStats,
    nextCandleIndex,
    deleteCandle,
    updateCandle
  };
};
