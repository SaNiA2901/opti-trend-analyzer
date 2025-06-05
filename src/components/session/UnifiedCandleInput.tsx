
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, Trash2, Calendar } from 'lucide-react';
import { TradingSession, CandleData } from '@/types/session';
import { useApplicationState } from '@/hooks/useApplicationState';

interface UnifiedCandleInputProps {
  currentSession: TradingSession | null;
  candles: CandleData[];
  nextCandleIndex: number;
  pair: string;
  onCandleSaved?: (candle: CandleData) => void;
}

const UnifiedCandleInput = ({ 
  currentSession, 
  candles, 
  nextCandleIndex,
  pair,
  onCandleSaved 
}: UnifiedCandleInputProps) => {
  const [formData, setFormData] = useState({
    open: '',
    high: '',
    low: '',
    close: '',
    volume: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const { saveCandle, deleteLastCandle } = useApplicationState();

  const lastCandle = candles.length > 0 ? candles[candles.length - 1] : null;

  // Автозаполнение цены открытия
  useEffect(() => {
    if (lastCandle && !formData.open) {
      setFormData(prev => ({
        ...prev,
        open: lastCandle.close.toString()
      }));
    }
  }, [lastCandle, formData.open]);

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = () => {
    const newErrors: string[] = [];
    
    if (!formData.open || isNaN(Number(formData.open))) {
      newErrors.push('Цена открытия должна быть числом');
    }
    if (!formData.high || isNaN(Number(formData.high))) {
      newErrors.push('Максимальная цена должна быть числом');
    }
    if (!formData.low || isNaN(Number(formData.low))) {
      newErrors.push('Минимальная цена должна быть числом');
    }
    if (!formData.close || isNaN(Number(formData.close))) {
      newErrors.push('Цена закрытия должна быть числом');
    }
    if (!formData.volume || isNaN(Number(formData.volume))) {
      newErrors.push('Объем должен быть числом');
    }

    const open = Number(formData.open);
    const high = Number(formData.high);
    const low = Number(formData.low);
    const close = Number(formData.close);

    if (high < Math.max(open, close) || high < low) {
      newErrors.push('Максимальная цена должна быть выше или равна цене открытия, закрытия и минимуму');
    }
    if (low > Math.min(open, close) || low > high) {
      newErrors.push('Минимальная цена должна быть ниже или равна цене открытия, закрытия и максимуму');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSave = async () => {
    if (!currentSession || !validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const candleData = {
        session_id: currentSession.id,
        candle_index: nextCandleIndex,
        open: Number(formData.open),
        high: Number(formData.high),
        low: Number(formData.low),
        close: Number(formData.close),
        volume: Number(formData.volume)
      };

      const savedCandle = await saveCandle(candleData);
      
      // Очищаем форму, кроме цены открытия для следующей свечи
      setFormData({
        open: formData.close,
        high: '',
        low: '',
        close: '',
        volume: ''
      });

      if (onCandleSaved) {
        onCandleSaved(savedCandle);
      }
    } catch (error) {
      console.error('Failed to save candle:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLast = async () => {
    if (lastCandle && window.confirm('Удалить последнюю свечу?')) {
      try {
        await deleteLastCandle();
        setFormData({
          open: '',
          high: '',
          low: '',
          close: '',
          volume: ''
        });
      } catch (error) {
        console.error('Failed to delete last candle:', error);
      }
    }
  };

  if (!currentSession) {
    return (
      <Card className="p-6 bg-slate-700/30 border-slate-600">
        <div className="text-center text-slate-400">
          <p>Выберите сессию для ввода данных свечей</p>
        </div>
      </Card>
    );
  }

  const isFormValid = validateForm();

  return (
    <Card className="p-6 bg-slate-700/30 border-slate-600">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h4 className="text-lg font-medium text-white">
            Ввод свечи #{nextCandleIndex + 1}
          </h4>
          <Badge className="bg-blue-600 text-white">{currentSession.timeframe}</Badge>
          <Badge className="bg-green-600 text-white">{pair}</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <div>
          <Label htmlFor="open" className="text-slate-300">Открытие (Open)</Label>
          <Input
            id="open"
            type="number"
            step="any"
            value={formData.open}
            onChange={(e) => updateField('open', e.target.value)}
            placeholder="1.23456"
            className="bg-slate-700 border-slate-600 text-white"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="high" className="text-slate-300">Максимум (High)</Label>
          <Input
            id="high"
            type="number"
            step="any"
            value={formData.high}
            onChange={(e) => updateField('high', e.target.value)}
            placeholder="1.23500"
            className="bg-slate-700 border-slate-600 text-white"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="low" className="text-slate-300">Минимум (Low)</Label>
          <Input
            id="low"
            type="number"
            step="any"
            value={formData.low}
            onChange={(e) => updateField('low', e.target.value)}
            placeholder="1.23400"
            className="bg-slate-700 border-slate-600 text-white"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="close" className="text-slate-300">Закрытие (Close)</Label>
          <Input
            id="close"
            type="number"
            step="any"
            value={formData.close}
            onChange={(e) => updateField('close', e.target.value)}
            placeholder="1.23450"
            className="bg-slate-700 border-slate-600 text-white"
            disabled={isSubmitting}
          />
        </div>

        <div>
          <Label htmlFor="volume" className="text-slate-300">Объем (Volume)</Label>
          <Input
            id="volume"
            type="number"
            value={formData.volume}
            onChange={(e) => updateField('volume', e.target.value)}
            placeholder="1000000"
            className="bg-slate-700 border-slate-600 text-white"
            disabled={isSubmitting}
          />
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-4 p-3 bg-red-600/20 border border-red-600/50 rounded-lg">
          <div className="text-red-200 text-sm">
            {errors.map((error, index) => (
              <div key={index}>• {error}</div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {isFormValid ? (
            <span className="text-green-400">✓ Данные корректны</span>
          ) : (
            <span className="text-orange-400">Заполните все поля корректно</span>
          )}
        </div>
        
        <div className="flex space-x-2">
          {lastCandle && (
            <Button 
              onClick={handleDeleteLast}
              variant="destructive"
              size="sm"
              className="bg-red-600 hover:bg-red-700"
              disabled={isSubmitting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Удалить последнюю
            </Button>
          )}
          
          <Button 
            onClick={handleSave}
            disabled={!isFormValid || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSubmitting ? 'Сохранение...' : 'Сохранить свечу'}
          </Button>
        </div>
      </div>

      {candles.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-400">
            <div>
              <span className="text-slate-300">Сохранено свечей:</span> {candles.length}
            </div>
            <div>
              <span className="text-slate-300">Последняя цена:</span> {
                lastCandle ? lastCandle.close.toFixed(5) : 'N/A'
              }
            </div>
            <div>
              <span className="text-slate-300">Средний объем:</span> {
                candles.length > 0 
                  ? (candles.reduce((sum, c) => sum + c.volume, 0) / candles.length).toFixed(0)
                  : 'N/A'
              }
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default UnifiedCandleInput;
