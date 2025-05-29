
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SessionFormProps {
  onSubmit: (sessionData: {
    session_name: string;
    pair: string;
    timeframe: string;
    start_date: string;
    start_time: string;
  }) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
  pair: string;
}

const SessionForm = ({ onSubmit, onCancel, isLoading, pair }: SessionFormProps) => {
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

  const handleSubmit = async () => {
    if (!sessionName.trim()) return;

    await onSubmit({
      session_name: sessionName,
      pair,
      timeframe,
      start_date: startDate,
      start_time: startTime
    });
  };

  return (
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
          onClick={handleSubmit}
          disabled={!sessionName.trim() || isLoading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Создать сессию
        </Button>
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="border-slate-600 text-slate-300"
        >
          Отмена
        </Button>
      </div>
    </Card>
  );
};

export default SessionForm;
