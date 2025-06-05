
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Trash2 } from 'lucide-react';
import { TradingSession } from '@/types/session';

interface SessionCardProps {
  session: TradingSession;
  isActive: boolean;
  isLoading: boolean;
  onLoad: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

const SessionCard = ({ session, isActive, isLoading, onLoad, onDelete }: SessionCardProps) => {
  return (
    <Card className={`p-4 border-slate-600 hover:bg-slate-700/50 transition-colors ${
      isActive ? 'bg-slate-700/50 border-green-500' : 'bg-slate-700/30'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h5 className="text-white font-medium">{session.session_name}</h5>
            <Badge className="bg-blue-600 text-white">{session.timeframe}</Badge>
            {isActive && (
              <Badge className="bg-green-600 text-white">Активна</Badge>
            )}
          </div>
          
          <div className="text-sm text-slate-400">
            {session.start_date} в {session.start_time} • Свечей: {session.current_candle_index + 1}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            onClick={() => onLoad(session.id)}
            disabled={isLoading || isActive}
            className={isActive 
              ? "bg-green-700 hover:bg-green-800" 
              : "bg-green-600 hover:bg-green-700"}
            size="sm"
          >
            <Play className="h-4 w-4 mr-2" />
            {isActive ? 'Активна' : 'Загрузить'}
          </Button>
          
          <Button 
            onClick={() => onDelete(session.id)}
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
  );
};

export default SessionCard;
