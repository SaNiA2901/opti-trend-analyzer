
import { useCallback } from 'react';
import { useApplicationState } from '@/hooks/useApplicationState';
import { useErrorHandler } from '@/hooks/useErrorHandler';

interface SessionCreationData {
  session_name: string;
  pair: string;
  timeframe: string;
  start_date: string;
  start_time: string;
}

export const useSessionManager = (setShowCreateForm: (show: boolean) => void) => {
  const { createSession, loadSession, deleteSession } = useApplicationState();
  const { addError } = useErrorHandler();

  const handleCreateSession = useCallback(async (sessionData: SessionCreationData) => {
    try {
      console.log('useSessionManager: Creating session:', sessionData.session_name);
      const session = await createSession(sessionData);
      if (session) {
        setShowCreateForm(false);
        console.log('useSessionManager: Session created and form closed');
      }
    } catch (error) {
      console.error('useSessionManager: Failed to create session:', error);
      addError(
        'Ошибка создания сессии', 
        error instanceof Error ? error.message : 'Unknown error', 
        { source: 'session-manager' }
      );
    }
  }, [createSession, setShowCreateForm, addError]);

  const handleLoadSession = useCallback(async (sessionId: string) => {
    try {
      console.log('useSessionManager: Loading session:', sessionId);
      const session = await loadSession(sessionId);
      if (session) {
        console.log('useSessionManager: Session loaded successfully');
      }
    } catch (error) {
      console.error('useSessionManager: Failed to load session:', error);
      addError(
        'Ошибка загрузки сессии', 
        error instanceof Error ? error.message : 'Unknown error', 
        { source: 'session-manager' }
      );
    }
  }, [loadSession, addError]);

  const handleDeleteSession = useCallback(async (sessionId: string) => {
    try {
      console.log('useSessionManager: Deleting session:', sessionId);
      await deleteSession(sessionId);
      console.log('useSessionManager: Session deleted successfully');
    } catch (error) {
      console.error('useSessionManager: Failed to delete session:', error);
      addError(
        'Ошибка удаления сессии', 
        error instanceof Error ? error.message : 'Unknown error', 
        { source: 'session-manager' }
      );
    }
  }, [deleteSession, addError]);

  return { 
    handleCreateSession, 
    handleLoadSession, 
    handleDeleteSession 
  };
};
