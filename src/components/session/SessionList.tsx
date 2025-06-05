import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Play, Trash2 } from 'lucide-react';
import { TradingSession } from '@/types/session';

interface SessionListProps {
  sessions: TradingSession[];
  currentSession: TradingSession | null;
  pair: string;
  onLoadSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  isLoading: boolean;
}

const SessionList = ({ 
  sessions, 
  currentSession, 
  pair, 
  onLoadSession, 
  onDeleteSession, 
  isLoading 
}: SessionListProps) => {
  const filteredSessions = sessions.filter(s => s.pair === pair);

  if (filteredSessions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <h4 className="text-white font-medium">Существующие сессии для {pair}</h4>
      
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
              
              <div className="flex items-center space-x-4 text-sm text-slate-400">
                <div className="flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>{session.start_date}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-4 w-4" />
                  <span>{session.start_time}</span>
                </div>
                <span>Свечей: {session.current_candle_index + 1}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                onClick={() => onLoadSession(session.id)}
                disabled={isLoading}
                className={currentSession?.id === session.id 
                  ? "bg-green-700 hover:bg-green-800" 
                  : "bg-green-600 hover:bg-green-700"}
              >
                <Play className="h-4 w-4 mr-2" />
                {currentSession?.id === session.id ? 'Активна' : 'Загрузить'}
              </Button>
              
              <Button 
                onClick={() => onDeleteSession(session.id)}
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
  );
};

export default SessionList;
