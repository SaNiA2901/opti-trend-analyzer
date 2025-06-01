
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Plus } from 'lucide-react';
import { useTradingSession } from '@/hooks/useTradingSession';
import { useSessionManager } from './hooks/useSessionManager';
import SessionForm from './SessionForm';
import SessionList from './SessionList';

interface SessionManagerProps {
  pair: string;
}

const SessionManager = ({ pair }: SessionManagerProps) => {
  const { sessions, isLoading, currentSession } = useTradingSession();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { handleCreateSession, handleLoadSession } = useSessionManager(setShowCreateForm);
  
  // Debug logging для отслеживания состояния с более подробной информацией
  console.log('SessionManager: Rendering with currentSession =', currentSession?.id || 'null');
  console.log('SessionManager: Current session object =', currentSession);
  console.log('SessionManager: Sessions available =', sessions.length);
  console.log('SessionManager: Is loading =', isLoading);

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
          {!currentSession && sessions.length > 0 && (
            <Badge className="bg-yellow-600 text-white">
              Нет активной сессии
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

      {sessions.length > 0 && (
        <SessionList
          sessions={sessions}
          currentSession={currentSession}
          pair={pair}
          onLoadSession={handleLoadSession}
          isLoading={isLoading}
        />
      )}

      {sessions.length === 0 && !isLoading && (
        <div className="text-center py-8 text-slate-400">
          <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Нет доступных сессий</p>
          <p className="text-sm">Создайте новую сессию для начала работы</p>
        </div>
      )}
    </Card>
  );
};

export default SessionManager;
