
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Plus, Play, Trash2 } from 'lucide-react';
import { useSessionState } from '@/hooks/useSessionState';
import SessionForm from './SessionForm';

interface SimpleSessionManagerProps {
  pair: string;
}

const SimpleSessionManager = ({ pair }: SimpleSessionManagerProps) => {
  const {
    sessions,
    currentSession,
    isLoading,
    createSession,
    loadSession,
    deleteSession
  } = useSessionState();
  
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
      await createSession(sessionData);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      await loadSession(sessionId);
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить эту сессию?')) {
      try {
        await deleteSession(sessionId);
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
          <h3 className="text-xl font-semibold text-white">Сессии ({pair})</h3>
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
            <Card key={session.id} className={`p-4 border-slate-600 hover:bg-slate-700/50 transition-colors ${
              currentSession?.id === session.id ? 'bg-slate-700/50 border-green-500' : 'bg-slate-700/30'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h5 className="text-white font-medium">{session.session_name}</h5>
                    <Badge className="bg-blue-600 text-white">{session.timeframe}</Badge>
                    {currentSession?.id === session.id && (
                      <Badge className="bg-green-600 text-white">Активна</Badge>
                    )}
                  </div>
                  
                  <div className="text-sm text-slate-400">
                    {session.start_date} в {session.start_time} • Свечей: {session.current_candle_index + 1}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    onClick={() => handleLoadSession(session.id)}
                    disabled={isLoading || currentSession?.id === session.id}
                    className={currentSession?.id === session.id 
                      ? "bg-green-700 hover:bg-green-800" 
                      : "bg-green-600 hover:bg-green-700"}
                    size="sm"
                  >
                    <Play className="h-4 w-4 mr-2" />
                    {currentSession?.id === session.id ? 'Активна' : 'Загрузить'}
                  </Button>
                  
                  <Button 
                    onClick={() => handleDeleteSession(session.id)}
                    disabled={isLoading}
                    variant="destructive"
                    size="sm"
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </Card>
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

export default SimpleSessionManager;
