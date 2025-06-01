
import { useCallback } from 'react';
import { useTradingSession } from '@/hooks/useTradingSession';

export const useSessionManager = (setShowCreateForm: (show: boolean) => void) => {
  const { createSession, loadSession } = useTradingSession();

  const handleCreateSession = useCallback(async (sessionData: {
    session_name: string;
    pair: string;
    timeframe: string;
    start_date: string;
    start_time: string;
  }) => {
    try {
      console.log('Creating new session:', sessionData);
      const session = await createSession(sessionData);
      console.log('Session created:', session);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  }, [createSession, setShowCreateForm]);

  const handleLoadSession = useCallback(async (sessionId: string) => {
    try {
      console.log('Loading session:', sessionId);
      await loadSession(sessionId);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }, [loadSession]);

  return {
    handleCreateSession,
    handleLoadSession
  };
};
