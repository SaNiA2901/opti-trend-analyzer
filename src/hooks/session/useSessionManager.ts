
import { useCallback } from 'react';
import { useTradingStore } from '@/store/TradingStore';
import { useSessionInitialization } from './useSessionInitialization';
import { useSessionOperations } from './useSessionOperations';

export const useSessionManager = () => {
  const { state, dispatch } = useTradingStore();

  // Функции для работы с локальным состоянием через TradingStore
  const setSessions = useCallback((sessions: any[]) => {
    dispatch({ type: 'SET_SESSIONS', payload: sessions });
  }, [dispatch]);

  const setCurrentSession = useCallback((session: any) => {
    dispatch({ type: 'SET_CURRENT_SESSION', payload: session });
  }, [dispatch]);

  const setIsLoading = useCallback((loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  }, [dispatch]);

  const updateCandles = useCallback((updater: (prev: any[]) => any[]) => {
    const newCandles = updater(state.candles);
    dispatch({ type: 'SET_CANDLES', payload: newCandles });
  }, [dispatch, state.candles]);

  const resetSessionState = useCallback(() => {
    dispatch({ type: 'SET_CURRENT_SESSION', payload: null });
    dispatch({ type: 'CLEAR_CANDLES' });
    dispatch({ type: 'CLEAR_PREDICTIONS' });
  }, [dispatch]);

  // Инициализация сессий
  const { loadSessions } = useSessionInitialization(setSessions, setIsLoading);

  // Операции с сессиями
  const {
    createSession,
    loadSession,
    deleteSession
  } = useSessionOperations(
    setIsLoading,
    setSessions,
    setCurrentSession,
    updateCandles
  );

  // Функция для обновления списка сессий после операций
  const refreshSessions = useCallback(async () => {
    await loadSessions();
  }, [loadSessions]);

  // Обновленные операции с автоматическим обновлением списка
  const handleCreateSession = useCallback(async (sessionData: any) => {
    const session = await createSession(sessionData);
    await refreshSessions();
    return session;
  }, [createSession, refreshSessions]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    await deleteSession(sessionId);
    await refreshSessions();
  }, [deleteSession, refreshSessions]);

  // НОВАЯ ФУНКЦИЯ: Синхронизация состояния с базой данных
  const syncStateWithDB = useCallback(async () => {
    if (!state.currentSession) return;

    try {
      console.log('🔄 Синхронизация состояния с БД...');
      setIsLoading(true);

      // Перезагружаем сессию с актуальными данными
      await loadSession(state.currentSession.id);
      
      console.log('✅ Синхронизация завершена');
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      dispatch({ type: 'ADD_ERROR', payload: 'Ошибка синхронизации с базой данных' });
    } finally {
      setIsLoading(false);
    }
  }, [state.currentSession, setIsLoading, loadSession, dispatch]);

  // НОВАЯ ФУНКЦИЯ: Проверка целостности данных
  const validateDataIntegrity = useCallback(() => {
    if (!state.currentSession) return null;

    const actualCandleCount = state.candles.length;
    const sessionIndex = state.currentSession.current_candle_index;
    const expectedMaxIndex = actualCandleCount > 0 
      ? Math.max(...state.candles.map((c: any) => c.candle_index))
      : 0;

    const isConsistent = sessionIndex >= expectedMaxIndex;

    return {
      isConsistent,
      actualCandleCount,
      sessionIndex,
      expectedMaxIndex,
      discrepancy: sessionIndex - expectedMaxIndex
    };
  }, [state.currentSession, state.candles]);

  return {
    // Состояние из TradingStore
    sessions: state.sessions,
    currentSession: state.currentSession,
    candles: state.candles,
    isLoading: state.isLoading,
    sessionStats: state.sessionStats,
    nextCandleIndex: state.nextCandleIndex,
    
    // Операции
    createSession: handleCreateSession,
    loadSession,
    deleteSession: handleDeleteSession,
    refreshSessions,
    resetSessionState,
    updateCandles,
    setCurrentSession,

    // НОВЫЕ ФУНКЦИИ для синхронизации
    syncStateWithDB,
    validateDataIntegrity
  };
};
