
import { useState, useCallback, useMemo, useEffect } from 'react';
import { TradingSession, CandleData, SessionStats } from '@/types/session';
import { sessionService } from '@/services/sessionService';
import { candleService } from '@/services/candleService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { calculateCandleDateTime } from '@/utils/dateTimeUtils';

// Централизованное состояние приложения
interface ApplicationState {
  sessions: TradingSession[];
  currentSession: TradingSession | null;
  candles: CandleData[];
  isLoading: boolean;
  isInitialized: boolean;
}

const initialState: ApplicationState = {
  sessions: [],
  currentSession: null,
  candles: [],
  isLoading: false,
  isInitialized: false
};

export const useApplicationState = () => {
  const [state, setState] = useState<ApplicationState>(initialState);
  const { addError } = useErrorHandler();

  // Атомарное обновление состояния
  const updateState = useCallback((updates: Partial<ApplicationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Мемоизированная статистика сессии
  const sessionStats = useMemo((): SessionStats => {
    if (!state.currentSession || state.candles.length === 0) {
      return { 
        totalCandles: 0, 
        lastPrice: null, 
        priceChange: 0,
        highestPrice: null,
        lowestPrice: null,
        averageVolume: 0
      };
    }

    const sortedCandles = [...state.candles].sort((a, b) => a.candle_index - b.candle_index);
    const firstCandle = sortedCandles[0];
    const lastCandle = sortedCandles[sortedCandles.length - 1];
    
    let highestPrice = -Infinity;
    let lowestPrice = Infinity;
    let totalVolume = 0;
    
    for (const candle of state.candles) {
      const prices = [candle.open, candle.high, candle.low, candle.close];
      for (const price of prices) {
        if (price > highestPrice) highestPrice = price;
        if (price < lowestPrice) lowestPrice = price;
      }
      totalVolume += candle.volume;
    }
    
    return {
      totalCandles: state.candles.length,
      lastPrice: lastCandle?.close || null,
      priceChange: lastCandle && firstCandle 
        ? ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100 
        : 0,
      highestPrice: highestPrice === -Infinity ? null : highestPrice,
      lowestPrice: lowestPrice === Infinity ? null : lowestPrice,
      averageVolume: state.candles.length > 0 ? totalVolume / state.candles.length : 0
    };
  }, [state.currentSession?.id, state.candles]);

  // Индекс следующей свечи
  const nextCandleIndex = useMemo(() => {
    if (!state.currentSession) return 0;
    return Math.max(state.currentSession.current_candle_index + 1, state.candles.length);
  }, [state.currentSession?.current_candle_index, state.candles.length]);

  // Инициализация приложения
  const initialize = useCallback(async () => {
    if (state.isInitialized || state.isLoading) return;
    
    updateState({ isLoading: true });
    
    try {
      const sessions = await sessionService.loadSessions();
      updateState({ 
        sessions, 
        isInitialized: true, 
        isLoading: false 
      });
      console.log('Application initialized with', sessions.length, 'sessions');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      addError('Ошибка инициализации приложения', error instanceof Error ? error.message : 'Unknown error');
      updateState({ isLoading: false });
    }
  }, [state.isInitialized, state.isLoading, updateState, addError]);

  // Загрузка сессии
  const loadSession = useCallback(async (sessionId: string) => {
    if (!sessionId?.trim()) {
      throw new Error('ID сессии не может быть пустым');
    }

    updateState({ isLoading: true });
    
    try {
      const result = await sessionService.loadSessionWithCandles(sessionId);
      updateState({
        currentSession: result.session,
        candles: result.candles,
        isLoading: false
      });
      console.log('Session loaded:', sessionId, 'with', result.candles.length, 'candles');
      return result.session;
    } catch (error) {
      console.error('Failed to load session:', error);
      addError('Ошибка загрузки сессии', error instanceof Error ? error.message : 'Unknown error');
      updateState({ 
        currentSession: null, 
        candles: [], 
        isLoading: false 
      });
      throw error;
    }
  }, [updateState, addError]);

  // Создание сессии
  const createSession = useCallback(async (sessionData: {
    session_name: string;
    pair: string;
    timeframe: string;
    start_date: string;
    start_time: string;
  }) => {
    updateState({ isLoading: true });
    
    try {
      const newSession = await sessionService.createSession(sessionData);
      const updatedSessions = await sessionService.loadSessions();
      
      updateState({
        currentSession: newSession,
        candles: [],
        sessions: updatedSessions,
        isLoading: false
      });
      
      console.log('Session created:', newSession.id);
      return newSession;
    } catch (error) {
      console.error('Failed to create session:', error);
      addError('Ошибка создания сессии', error instanceof Error ? error.message : 'Unknown error');
      updateState({ isLoading: false });
      throw error;
    }
  }, [updateState, addError]);

  // Удаление сессии
  const deleteSession = useCallback(async (sessionId: string) => {
    updateState({ isLoading: true });
    
    try {
      await sessionService.deleteSession(sessionId);
      const updatedSessions = await sessionService.loadSessions();
      
      const updates: Partial<ApplicationState> = {
        sessions: updatedSessions,
        isLoading: false
      };
      
      if (state.currentSession?.id === sessionId) {
        updates.currentSession = null;
        updates.candles = [];
      }
      
      updateState(updates);
      console.log('Session deleted:', sessionId);
    } catch (error) {
      console.error('Failed to delete session:', error);
      addError('Ошибка удаления сессии', error instanceof Error ? error.message : 'Unknown error');
      updateState({ isLoading: false });
      throw error;
    }
  }, [state.currentSession?.id, updateState, addError]);

  // Сохранение свечи
  const saveCandle = useCallback(async (candleData: Omit<CandleData, 'id' | 'candle_datetime'>) => {
    if (!state.currentSession) {
      throw new Error('Нет активной сессии для сохранения данных');
    }

    try {
      // Вычисляем время свечи
      const candleDateTime = calculateCandleDateTime(
        state.currentSession.start_date,
        state.currentSession.start_time,
        state.currentSession.timeframe,
        candleData.candle_index
      );

      const fullCandleData = {
        ...candleData,
        candle_datetime: candleDateTime
      };

      const savedCandle = await candleService.saveCandle(fullCandleData);
      
      // Обновляем индекс сессии
      const newCandleIndex = Math.max(state.currentSession.current_candle_index, candleData.candle_index);
      await sessionService.updateSessionCandleIndex(state.currentSession.id, newCandleIndex);
      
      // Атомарное обновление состояния
      const updatedCandles = state.candles.filter(c => c.candle_index !== candleData.candle_index);
      updatedCandles.push(savedCandle);
      updatedCandles.sort((a, b) => a.candle_index - b.candle_index);
      
      const updatedSession = {
        ...state.currentSession,
        current_candle_index: newCandleIndex,
        updated_at: new Date().toISOString()
      };

      updateState({
        candles: updatedCandles,
        currentSession: updatedSession
      });

      console.log('Candle saved:', savedCandle.id);
      return savedCandle;
    } catch (error) {
      console.error('Failed to save candle:', error);
      addError('Ошибка сохранения свечи', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [state.currentSession, state.candles, updateState, addError]);

  // Удаление последней свечи
  const deleteLastCandle = useCallback(async () => {
    if (!state.currentSession || state.candles.length === 0) {
      return;
    }

    const lastCandle = state.candles.reduce((latest, current) => 
      current.candle_index > latest.candle_index ? current : latest
    );
    
    try {
      await candleService.deleteCandle(state.currentSession.id, lastCandle.candle_index);
      
      updateState({
        candles: state.candles.filter(c => c.id !== lastCandle.id)
      });
      
      console.log('Last candle deleted:', lastCandle.id);
    } catch (error) {
      console.error('Failed to delete last candle:', error);
      addError('Ошибка удаления свечи', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [state.currentSession, state.candles, updateState, addError]);

  // Обновление свечи
  const updateCandle = useCallback(async (candleIndex: number, updatedData: Partial<CandleData>) => {
    if (!state.currentSession) {
      throw new Error('Нет активной сессии');
    }
    
    try {
      const updatedCandle = await candleService.updateCandle(state.currentSession.id, candleIndex, updatedData);

      if (updatedCandle) {
        updateState({
          candles: state.candles.map(c => 
            c.candle_index === candleIndex ? updatedCandle : c
          )
        });
        console.log('Candle updated successfully:', candleIndex);
        return updatedCandle;
      }
    } catch (error) {
      console.error('Error updating candle:', error);
      addError('Ошибка обновления свечи', error instanceof Error ? error.message : 'Unknown error');
      throw error;
    }
  }, [state.currentSession, state.candles, updateState, addError]);

  // Автоматическая инициализация
  useEffect(() => {
    initialize();
  }, [initialize]);

  return {
    // Состояние
    sessions: state.sessions,
    currentSession: state.currentSession,
    candles: state.candles,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    sessionStats,
    nextCandleIndex,
    
    // Действия
    loadSession,
    createSession,
    deleteSession,
    saveCandle,
    deleteLastCandle,
    updateCandle,
    initialize
  };
};
