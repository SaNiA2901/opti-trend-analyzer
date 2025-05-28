
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Save } from 'lucide-react';
import { useTradingSession } from '@/hooks/useTradingSession';

interface CandleInputProps {
  pair: string;
  onCandleSaved: (candleData: any) => void;
}

interface CandleFormData {
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
}

const CandleInput = ({ pair, onCandleSaved }: CandleInputProps) => {
  const { currentSession, candles, saveCandle, getNextCandleTime } = useTradingSession();
  const [candleData, setCandleData] = useState<CandleFormData>({
    open: '',
    high: '',
    low: '',
    close: '',
    volume: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const nextCandleIndex = currentSession ? Math.max(currentSession.current_candle_index + 1, candles.length) : 0;
  const nextCandleTime = currentSession ? getNextCandleTime(nextCandleIndex) : '';

  const parseNumber = (value: string): number => {
    const parsed = parseFloat(value);
    return isNaN(parsed) ? 0 : parsed;
  };

  const updateField = (field: keyof CandleFormData, value: string) => {
    setCandleData(prev => ({
      ...prev,
      [field]: value
    }));
    setValidationErrors([]);
  };

  const validateData = (): string[] => {
    const errors: string[] = [];
    const open = parseNumber(candleData.open);
    const high = parseNumber(candleData.high);
    const low = parseNumber(candleData.low);
    const close = parseNumber(candleData.close);
    const volume = parseNumber(candleData.volume);

    if (open <= 0) errors.push('Цена открытия должна быть больше 0');
    if (high <= 0) errors.push('Максимальная цена должна быть больше 0');
    if (low <= 0) errors.push('Минимальная цена должна быть больше 0');
    if (close <= 0) errors.push('Цена закрытия должна быть больше 0');
    if (volume < 0) errors.push('Объем не может быть отрицательным');

    if (high < Math.max(open, close)) {
      errors.push('Максимум должен быть >= max(открытие, закрытие)');
    }
    if (low > Math.min(open, close)) {
      errors.push('Минимум должен быть <= min(открытие, закрытие)');
    }

    return errors;
  };

  const handleSave = async () => {
    if (!currentSession) return;

    const errors = validateData();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      const savedCandle = await saveCandle({
        session_id: currentSession.id,
        candle_index: nextCandleIndex,
        open: parseNumber(candleData.open),
        high: parseNumber(candleData.high),
        low: parseNumber(candleData.low),
        close: parseNumber(candleData.close),
        volume: parseNumber(candleData.volume)
      });

      onCandleSaved(savedCandle);
      
      setCandleData({
        open: candleData.close,
        high: '',
        low: '',
        close: '',
        volume: ''
      });
      setValidationErrors([]);
    } catch (error) {
      console.error('Error saving candle:', error);
      setValidationErrors([error instanceof Error ? error.message : 'Ошибка сохранения']);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPlaceholder = (type: string): string => {
    if (pair === "BTC/USD") {
      const placeholders = { open: "67500", high: "68000", low: "67000", close: "67800" };
      return placeholders[type as keyof typeof placeholders] || "";
    }
    if (pair.includes("JPY")) {
      const placeholders = { open: "149.50", high: "149.85", low: "149.20", close: "149.70" };
      return placeholders[type as keyof typeof placeholders] || "";
    }
    const placeholders = { open: "1.0850", high: "1.0875", low: "1.0830", close: "1.0860" };
    return placeholders[type as keyof typeof placeholders] || "";
  };

  useEffect(() => {
    if (candles.length > 0 && !candleData.open) {
      const lastCandle = candles[candles.length - 1];
      setCandleData(prev => ({
        ...prev,
        open: lastCandle.close.toString()
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

  const isDataValid = validateData().length === 0;

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
            placeholder={getPlaceholder("open")}
            value={candleData.open}
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
            placeholder={getPlaceholder("high")}
            value={candleData.high}
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
            placeholder={getPlaceholder("low")}
            value={candleData.low}
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
            placeholder={getPlaceholder("close")}
            value={candleData.close}
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
          min="0"
          step="any"
          placeholder={pair === "BTC/USD" ? "5000" : "1500"}
          value={candleData.volume}
          onChange={(e) => updateField('volume', e.target.value)}
          className="bg-slate-800 border-slate-600 text-white"
        />
      </div>

      {validationErrors.length > 0 && (
        <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 rounded-lg">
          <ul className="text-red-200 text-sm space-y-1">
            {validationErrors.map((error, index) => (
              <li key={index}>• {error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {isDataValid ? (
            <span className="text-green-400">✓ Данные корректны</span>
          ) : (
            <span className="text-orange-400">Заполните все поля корректно</span>
          )}
        </div>
        
        <Button 
          onClick={handleSave}
          disabled={!isDataValid || isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
        >
          <Save className="h-4 w-4 mr-2" />
          {isSubmitting ? 'Сохранение...' : 'Сохранить свечу'}
        </Button>
      </div>

      {candles.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-600">
          <div className="text-sm text-slate-400">
            Сохранено свечей: {candles.length} | Последняя цена: {candles[candles.length - 1]?.close || 'N/A'}
          </div>
        </div>
      )}
    </Card>
  );
};

export default CandleInput;
