
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { TradingSession, CandleData } from '@/types/session';
import { useCandleManagement } from '@/hooks/useCandleManagement';
import CandleInputHeader from './candle-input/CandleInputHeader';
import CandleInputForm from './candle-input/CandleInputForm';
import CandleInputValidation from './candle-input/CandleInputValidation';
import CandleInputActions from './candle-input/CandleInputActions';
import CandleInputStats from './candle-input/CandleInputStats';

interface CandleInputProps {
  currentSession: TradingSession | null;
  candles: CandleData[];
  updateCandles: (updater: (prev: CandleData[]) => CandleData[]) => void;
  setCurrentSession: (session: TradingSession | null) => void;
  nextCandleIndex: number;
  pair: string;
  onCandleSaved?: (candle: CandleData) => void;
}

const CandleInput = ({ 
  currentSession, 
  candles, 
  updateCandles,
  setCurrentSession,
  nextCandleIndex,
  pair,
  onCandleSaved 
}: CandleInputProps) => {
  const [formData, setFormData] = useState({
    open: '',
    high: '',
    low: '',
    close: '',
    volume: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const { saveCandle, deleteLastCandle, calculateCandleTime } = useCandleManagement(
    currentSession,
    updateCandles,
    setCurrentSession
  );

  const nextCandleTime = currentSession ? calculateCandleTime(nextCandleIndex) : '';
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
        await deleteLastCandle(candles);
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
      <CandleInputHeader
        currentSession={currentSession}
        nextCandleIndex={nextCandleIndex}
        pair={pair}
        nextCandleTime={nextCandleTime}
      />

      <CandleInputForm
        formData={formData}
        onFieldChange={updateField}
        disabled={isSubmitting}
      />

      <CandleInputValidation
        errors={errors}
        isFormValid={isFormValid}
      />

      <CandleInputActions
        isFormValid={isFormValid}
        isSubmitting={isSubmitting}
        lastCandle={lastCandle}
        onSave={handleSave}
        onDeleteLast={handleDeleteLast}
      />

      <CandleInputStats candles={candles} />
    </Card>
  );
};

export default CandleInput;
