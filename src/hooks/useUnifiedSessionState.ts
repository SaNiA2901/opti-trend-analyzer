
import { useState, useEffect, useCallback, useMemo } from 'react';
import { sessionService } from '@/services/sessionService';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import { TradingSession, CandleData, SessionStats } from '@/types/session';

export const useUnifiedSessionState = () => {
  const [sessions, setSessions] = useState<TradingSession[]>([]);
  const [currentSession, setCurrentSession] = useState<TradingSession | null>(null);
  const [candles, setCandles] = useState<CandleData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { addError } = useErrorHandler();

  // Мемоизированная статистика сессии
  const sessionStats = useMemo((): SessionStats => {
    if (!currentSession || candles.length === 0) {
      return { 
        totalCandles: 0, 
        lastPrice: null, 
        priceChange: 0,
        highestPrice: null,
        lowestPrice: null,
        averageVolume: 0
      };
    }

    const sortedCandles = [...candles].sort((a, b) => a.candle_index - b.candle_index);
    const firstCandle = sortedCandles[0];
    const lastCandle = sortedCandles[sortedCandles.length - 1];
    
    let highestPrice = -Infinity;
    let lowestPrice = Infinity;
    let totalVolume = 0;
    
    for (const candle of candles) {
      const prices = [candle.open, candle.high, candle.low, candle.close];
      for (const price of prices) {
        if (price > highestPrice) highestPrice = price;
        if (price < lowestPrice) lowestPrice = price;
      }
      totalVolume += candle.volume;
    }
    
    return {
      totalCandles: candles.length,
      lastPrice: lastCandle?.close || null,
      priceChange: lastCandle && firstCandle 
        ? ((lastCandle.close - firstCandle.open) / firstCandle.open) * 100 
        : 0,
      highestPrice: highestPrice === -Infinity ? null : highestPrice,
      lowestPrice: lowestPrice === Infinity ? null : lowestPrice,
      averageVolume: candles.length > 0 ? totalVolume / candles.length : 0
    };
  }, [currentSession?.id, candles]);

  // Индекс следующей свечи
  const nextCandleIndex = useMemo(() => {
    if (!currentSession) return 0;
    return Math.max(currentSession.current_candle_index + 1, candles.length);
  }, [currentSession?.current_candle_index, candles.length]);

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
    sessionStats,
    nextCandleIndex,
    createSession,
    loadSession,
    deleteSession,
    loadSessions,
    setCandles,
    setCurrentSession
  };
};
