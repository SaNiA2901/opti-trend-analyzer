
import { useCallback } from 'react';
import { useSessionState } from './useSessionState';
import { useSessionInitialization } from './useSessionInitialization';
import { useSessionOperations } from './useSessionOperations';
import { useSessionStats } from './useSessionStats';

export const useSessionManager = () => {
  const {
    sessions,
    setSessions,
    currentSession,
    setCurrentSession,
    candles,
    isLoading,
    setIsLoading,
    updateCandles,
    resetSessionState
  } = useSessionState();

  const { loadSessions } = useSessionInitialization(setSessions, setIsLoading);

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

  const { sessionStats, nextCandleIndex } = useSessionStats(currentSession, candles);

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

  return {
    // Состояние
    sessions,
    currentSession,
    candles,
    isLoading,
    sessionStats,
    nextCandleIndex,
    
    // Операции
    createSession: handleCreateSession,
    loadSession,
    deleteSession: handleDeleteSession,
    refreshSessions,
    resetSessionState,
    updateCandles,
    setCurrentSession // Экспортируем функцию для использования в других хуках
  };
};
