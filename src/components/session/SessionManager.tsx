
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Database, Plus, Play } from 'lucide-react';
import { useTradingSession } from '@/hooks/useTradingSession';

interface SessionManagerProps {
  pair: string;
  onSessionSelected: (sessionId: string) => void;
}

const SessionManager = ({ pair, onSessionSelected }: SessionManagerProps) => {
  const { sessions, createSession, loadSession, isLoading, currentSession } = useTradingSession();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [timeframe, setTimeframe] = useState('1h');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(new Date().toTimeString().slice(0, 5));

  const timeframes = [
    { value: '1m', label: '1 минута' },
    { value: '5m', label: '5 минут' },
    { value: '15m', label: '15 минут' },
    { value: '30m', label: '30 минут' },
    { value: '1h', label: '1 час' },
    { value: '4h', label: '4 часа' },
    { value: '1d', label: '1 день' }
  ];
  
  console.log('SessionManager: rendered, currentSession =', currentSession?.id || 'null');
  console.log('SessionManager: sessions =', sessions.length);

  const handleCreateSession = async () => {
    if (!sessionName.trim()) return;

    try {
      console.log('Creating new session:', {
        session_name: sessionName,
        pair,
        timeframe,
        start_date: startDate,
        start_time: startTime
      });

      const session = await createSession({
        session_name: sessionName,
        pair,
        timeframe,
        start_date: startDate,
        start_time: startTime
      });
      
      console.log('Session created:', session);
      // Уведомляем родительский компонент с небольшой задержкой
      setTimeout(() => {
        onSessionSelected(session.id);
      }, 100);
      
      setShowCreateForm(false);
      setSessionName('');
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleLoadSession = async (sessionId: string) => {
    try {
      console.log('Loading session:', sessionId);
      await loadSession(sessionId);
      // Уведомляем родительский компонент с небольшой задержкой
      setTimeout(() => {
        onSessionSelected(sessionId);
      }, 100);
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

      {/* Отладочная информация */}
      <div className="mb-4 p-2 bg-gray-800/50 rounded text-xs text-gray-400">
        Отладка: Активная сессия = {currentSession ? currentSession.session_name : 'нет'} | 
        Всего сессий = {sessions.length}
      </div>

      {showCreateForm && (
        <Card className="p-4 mb-4 bg-slate-700/50 border-slate-600">
          <h4 className="text-white font-medium mb-4">Создать новую сессию</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sessionName" className="text-slate-300">Название сессии</Label>
              <Input
                id="sessionName"
                placeholder="Например: Утренняя торговля"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="timeframe" className="text-slate-300">Таймфрейм</Label>
              <Select value={timeframe} onValueChange={setTimeframe}>
                <SelectTrigger className="bg-slate-800 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-600">
                  {timeframes.map(tf => (
                    <SelectItem key={tf.value} value={tf.value} className="text-white focus:bg-slate-700">
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="startDate" className="text-slate-300">Дата начала</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
            
            <div>
              <Label htmlFor="startTime" className="text-slate-300">Время начала</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-slate-800 border-slate-600 text-white"
              />
            </div>
          </div>
          
          <div className="flex space-x-2 mt-4">
            <Button 
              onClick={handleCreateSession}
              disabled={!sessionName.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Создать сессию
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowCreateForm(false)}
              className="border-slate-600 text-slate-300"
            >
              Отмена
            </Button>
          </div>
        </Card>
      )}

      {sessions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-white font-medium">Существующие сессии для {pair}</h4>
          
          {sessions.filter(s => s.pair === pair).map(session => (
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
                
                <Button 
                  onClick={() => handleLoadSession(session.id)}
                  disabled={isLoading}
                  className={currentSession?.id === session.id 
                    ? "bg-green-700 hover:bg-green-800" 
                    : "bg-green-600 hover:bg-green-700"}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {currentSession?.id === session.id ? 'Активна' : 'Загрузить'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </Card>
  );
};

export default SessionManager;
