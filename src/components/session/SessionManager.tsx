
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Plus } from 'lucide-react';
import { useTradingSession } from '@/hooks/useTradingSession';
import SessionForm from './SessionForm';
import SessionList from './SessionList';

interface SessionManagerProps {
  pair: string;
}

const SessionManager = ({ pair }: SessionManagerProps) => {
  const { sessions, createSession, loadSession, isLoading, currentSession } = useTradingSession();
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  console.log('SessionManager: rendered, currentSession =', currentSession?.id || 'null');
  console.log('SessionManager: sessions =', sessions.length);

  const handleCreateSession = async (sessionData: {
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
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      console.log('Loading session:', sessionId);
      await loadSession(sessionId);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  return (
    <Card className="p-6 bg-slate-800/50 border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Управление сессиями</h3>
          {currentSession && (
            <Badge className="bg-green-600 text-white">
              Активна: {currentSession.session_name}
            </Badge>
          )}
        </div>
        <Button 
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-green-600 hover:bg-green-700"
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

      {sessions.length > 0 && (
        <SessionList
          sessions={sessions}
          currentSession={currentSession}
          pair={pair}
          onLoadSession={handleLoadSession}
          isLoading={isLoading}
        />
      )}
    </Card>
  );
};

export default SessionManager;
