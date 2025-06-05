
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Plus } from 'lucide-react';
import { TradingSession } from '@/types/session';
import SessionForm from './SessionForm';
import SessionCard from './SessionCard';

interface OptimizedSessionManagerProps {
  pair: string;
  sessions: TradingSession[];
  currentSession: TradingSession | null;
  isLoading: boolean;
  onCreateSession: (sessionData: {
    session_name: string;
    pair: string;
    timeframe: string;
    start_date: string;
    start_time: string;
  }) => Promise<TradingSession>;
  onLoadSession: (sessionId: string) => Promise<TradingSession>;
  onDeleteSession: (sessionId: string) => Promise<void>;
}

const OptimizedSessionManager = ({ 
  pair,
  sessions,
  currentSession,
  isLoading,
  onCreateSession,
  onLoadSession,
  onDeleteSession
}: OptimizedSessionManagerProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);

  const filteredSessions = sessions.filter(s => s.pair === pair);

  const handleCreateSession = async (sessionData: {
    session_name: string;
    pair: string;
    timeframe: string;
    start_date: string;
    start_time: string;
  }) => {
    try {
      await onCreateSession(sessionData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      await onLoadSession(sessionId);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту сессию?')) {
      try {
        await onDeleteSession(sessionId);
      } catch (error) {
        console.error('Failed to delete session:', error);
      }
    }
  };

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

export default OptimizedSessionManager;
