
import React from 'react';
import { Button } from '@/components/ui/button';
import { Save } from 'lucide-react';
import { CandleData } from '@/hooks/useTradingSession';

interface CandleInputFooterProps {
  currentSession: any;
  isValid: boolean;
  isSubmitting: boolean;
  onSave: () => void;
  candles: CandleData[];
}

const CandleInputFooter = ({ 
  currentSession, 
  isValid, 
  isSubmitting, 
  onSave, 
  candles 
}: CandleInputFooterProps) => {
  return (
    <>
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">
          {!currentSession ? (
            <span className="text-orange-400">Ожидание активной сессии</span>
          ) : isValid ? (
            <span className="text-green-400">✓ Данные корректны</span>
          ) : (
            <span className="text-orange-400">Заполните все поля корректно</span>
          )}
        </div>
        
        <Button 
          onClick={onSave}
          disabled={!currentSession || !isValid || isSubmitting}
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
    </>
  );
};

export default CandleInputFooter;
