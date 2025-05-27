
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, ArrowRight, Save } from 'lucide-react';
import { useTradingSession } from '@/hooks/useTradingSession';

interface CandleInputProps {
  pair: string;
  onCandleSaved: (candleData: any) => void;
}

const CandleInput = ({ pair, onCandleSaved }: CandleInputProps) => {
  const { currentSession, candles, saveCandle, getNextCandleTime } = useTradingSession();
  const [candleData, setCandleData] = useState({
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    volume: 0
  });

  const nextCandleIndex = currentSession ? Math.max(currentSession.current_candle_index + 1, candles.length) : 0;
  const nextCandleTime = currentSession ? getNextCandleTime(nextCandleIndex) : '';

  const updateField = (field: keyof typeof candleData, value: string) => {
    setCandleData(prev => ({
      ...prev,
      [field]: parseFloat(value) || 0
    }));
  };

  const validateData = () => {
    return candleData.open > 0 && 
           candleData.high > 0 && 
           candleData.low > 0 && 
           candleData.close > 0 && 
           candleData.volume > 0 &&
           candleData.high >= Math.max(candleData.open, candleData.close) &&
           candleData.low <= Math.min(candleData.open, candleData.close);
  };

  const handleSave = async () => {
    if (!currentSession || !validateData()) return;

    try {
      const savedCandle = await saveCandle({
        session_id: currentSession.id,
        candle_index: nextCandleIndex,
        ...candleData
      });

      onCandleSaved(savedCandle);
      
      // Очищаем форму для следующей свечи
      setCandleData({
        open: candleData.close, // Следующая свеча начинается с цены закрытия предыдущей
        high: 0,
        low: 0,
        close: 0,
        volume: 0
      });
    } catch (error) {
      console.error('Error saving candle:', error);
    }
  };

  const formatPlaceholder = (type: string) => {
    if (pair === "BTC/USD") {
      switch (type) {
        case "open": return "67500";
        case "high": return "68000";
        case "low": return "67000";
        case "close": return "67800";
        default: return "";
      }
    } else if (pair.includes("JPY")) {
      switch (type) {
        case "open": return "149.50";
        case "high": return "149.85";
        case "low": return "149.20";
        case "close": return "149.70";
        default: return "";
      }
    } else {
      switch (type) {
        case "open": return "1.0850";
        case "high": return "1.0875";
        case "low": return "1.0830";
        case "close": return "1.0860";
        default: return "";
      }
    }
  };

  useEffect(() => {
    // Если это первая свеча и у нас есть закрытые свечи, устанавливаем открытие как закрытие последней
    if (candles.length > 0 && candleData.open === 0) {
      const lastCandle = candles[candles.length - 1];
      setCandleData(prev => ({
        ...prev,
        open: lastCandle.close
      }));
    }
  }, [candles, candleData.open]);

  if (!currentSession) {
    return (
      <Card className="p-6 bg-slate-700/30 border-slate-600">
        <div className="text-center text-slate-400">
          <Clock className="h-16 w-16 mx-auto mb-4 text-slate-500" />
          <p>Выберите или создайте сессию для начала ввода данных свечей</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-slate-700/30 border-slate-600">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-white">
          Ввод свечи #{nextCandleIndex + 1}
        </h4>
        <div className="flex items-center space-x-2">
          <Badge className="bg-blue-600 text-white">{currentSession.timeframe}</Badge>
          <Badge className="bg-green-600 text-white">{pair}</Badge>
        </div>
      </div>

      {nextCandleTime && (
        <div className="mb-4 p-3 bg-blue-600/20 border border-blue-600/50 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-200">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">Время свечи:</span>
            <span>{new Date(nextCandleTime).toLocaleString('ru-RU')}</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div>
          <Label htmlFor="open" className="text-slate-300">Open (Открытие)</Label>
          <Input
            id="open"
            type="number"
            step="any"
            placeholder={formatPlaceholder("open")}
            value={candleData.open || ''}
            onChange={(e) => updateField('open', e.target.value)}
            className="bg-slate-800 border-slate-600 text-white"
          />
        </div>
        
        <div>
          <Label htmlFor="high" className="text-slate-300">High (Максимум)</Label>
          <Input
            id="high"
            type="number"
            step="any"
            placeholder={formatPlaceholder("high")}
            value={candleData.high || ''}
            onChange={(e) => updateField('high', e.target.value)}
            className="bg-slate-800 border-slate-600 text-white"
          />
        </div>
        
        <div>
          <Label htmlFor="low" className="text-slate-300">Low (Минимум)</Label>
          <Input
            id="low"
            type="number"
            step="any"
            placeholder={formatPlaceholder("low")}
            value={candleData.low || ''}
            onChange={(e) => updateField('low', e.target.value)}
            className="bg-slate-800 border-slate-600 text-white"
          />
        </div>
        
        <div>
          <Label htmlFor="close" className="text-slate-300">Close (Закрытие)</Label>
          <Input
            id="close"
            type="number"
            step="any"
            placeholder={formatPlaceholder("close")}
            value={candleData.close || ''}
            onChange={(e) => updateField('close', e.target.value)}
            className="bg-slate-800 border-slate-600 text-white"
          />
        </div>
      </div>

      <div className="mb-4">
        <Label htmlFor="volume" className="text-slate-300">Volume (Объем)</Label>
        <Input
          id="volume"
          type="number"
          placeholder={pair === "BTC/USD" ? "5000" : "1500"}
          value={candleData.volume || ''}
          onChange={(e) => updateField('volume', e.target.value)}
          className="bg-slate-800 border-slate-600 text-white"
        />
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {validateData() ? (
            <span className="text-green-400">✓ Данные корректны</span>
          ) : (
            <span className="text-orange-400">Заполните все поля корректно</span>
          )}
        </div>
        
        <Button 
          onClick={handleSave}
          disabled={!validateData()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Save className="h-4 w-4 mr-2" />
          Сохранить свечу
        </Button>
      </div>

      {candles.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-600">
          <div className="text-sm text-slate-400">
            Сохранено свечей: {candles.length} | Последняя: {candles[candles.length - 1]?.close}
          </div>
        </div>
      )}
    </Card>
  );
};

export default CandleInput;
