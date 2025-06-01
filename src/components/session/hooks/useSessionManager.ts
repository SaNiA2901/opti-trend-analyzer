
import { useCallback } from 'react';
import { useTradingSession } from '@/hooks/useTradingSession';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface SessionCreationData {
  session_name: string;
  pair: string;
  timeframe: string;
  start_date: string;
  start_time: string;
}

export const useSessionManager = (setShowCreateForm: (show: boolean) => void) => {
  const { createSession, loadSession } = useTradingSession();
  const { addError } = useErrorHandler();

  const handleCreateSession = useCallback(async (sessionData: SessionCreationData) => {
    try {
      console.log('useSessionManager: Creating session with data:', sessionData);
      const session = await createSession(sessionData);
      if (session) {
        console.log('useSessionManager: Session created successfully:', session.id);
        setShowCreateForm(false);
      }
    } catch (error) {
      console.error('useSessionManager: Error creating session:', error);
      addError('Ошибка создания сессии', undefined, { source: 'session-manager' });
    }
  }, [createSession, setShowCreateForm, addError]);

  const handleLoadSession = useCallback(async (sessionId: string) => {
    try {
      console.log('useSessionManager: Loading session:', sessionId);
      await loadSession(sessionId);
      console.log('useSessionManager: Session loaded successfully');
    } catch (error) {
      console.error('useSessionManager: Error loading session:', error);
      addError('Ошибка загрузки сессии', undefined, { source: 'session-manager' });
    }
  }, [loadSession, addError]);

  return {
    handleCreateSession,
    handleLoadSession
  };
};
