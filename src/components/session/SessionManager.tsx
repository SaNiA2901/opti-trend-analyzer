
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Plus } from 'lucide-react';
import { TradingSession } from '@/types/session';
import { useApplicationState } from '@/hooks/useApplicationState';
import { useErrorHandler } from '@/hooks/useErrorHandler';
import SessionForm from './SessionForm';
import SessionCard from './SessionCard';

interface SessionCreationData {
  session_name: string;
  pair: string;
  timeframe: string;
  start_date: string;
  start_time: string;
}

interface SessionManagerProps {
  pair: string;
}

const SessionManager = ({ pair }: SessionManagerProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { sessions, currentSession, isLoading, createSession, loadSession, deleteSession } = useApplicationState();
  const { addError } = useErrorHandler();

  const handleCreateSession = async (sessionData: SessionCreationData) => {
    try {
      console.log('SessionManager: Creating session:', sessionData.session_name);
      const session = await createSession(sessionData);
      if (session) {
        setShowCreateForm(false);
        console.log('SessionManager: Session created and form closed');
      }
    } catch (error) {
      console.error('SessionManager: Failed to create session:', error);
      addError(
        'Ошибка создания сессии', 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      console.log('SessionManager: Loading session:', sessionId);
      const session = await loadSession(sessionId);
      if (session) {
        console.log('SessionManager: Session loaded successfully');
      }
    } catch (error) {
      console.error('SessionManager: Failed to load session:', error);
      addError(
        'Ошибка загрузки сессии', 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    try {
      console.log('SessionManager: Deleting session:', sessionId);
      await deleteSession(sessionId);
      console.log('SessionManager: Session deleted successfully');
    } catch (error) {
      console.error('SessionManager: Failed to delete session:', error);
      addError(
        'Ошибка удаления сессии', 
        error instanceof Error ? error.message : 'Unknown error'
      );
    }
  };

  const filteredSessions = sessions.filter(s => s.pair === pair);

  return (
    <Card className="p-6 bg-slate-800/50 border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Управление сессиями ({pair})</h3>
          {currentSession && (
            <Badge className="bg-green-600 text-white">
              Активна: {currentSession.session_name}
            </Badge>
          )}
        </div>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-green-600 hover:bg-green-700"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Новая сессия
        </Button>
      </div>

      {showCreateForm && (
        <SessionForm
          onSubmit={handleCreateSession}
          onCancel={() => setShowCreateForm(false)}
          isLoading={isLoading}
          pair={pair}
        />
      )}

      {filteredSessions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white font-medium">Доступные сессии</h4>
          
          {filteredSessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              isActive={currentSession?.id === session.id}
              isLoading={isLoading}
              onLoad={handleLoadSession}
              onDelete={handleDeleteSession}
            />
          ))}
        </div>
      )}

      {filteredSessions.length === 0 && !isLoading && (
        <div className="text-center py-8 text-slate-400">
          <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Нет сессий для {pair}</p>
          <p className="text-sm">Создайте новую сессию для начала работы</p>
        </div>
      )}
    </Card>
  );
};

export default SessionManager;
