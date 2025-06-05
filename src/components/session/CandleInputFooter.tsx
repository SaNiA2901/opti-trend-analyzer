import React from 'react';
import { Button } from '@/components/ui/button';
import { Save, Trash2 } from 'lucide-react';
import { CandleData } from '@/types/session';

interface CandleInputFooterProps {
  currentSession: any;
  isValid: boolean;
  isSubmitting: boolean;
  onSave: () => void;
  candles: CandleData[];
  onDeleteLastCandle?: () => void;
  lastCandle?: CandleData | null;
}

const CandleInputFooter = ({ 
  currentSession, 
  isValid, 
  isSubmitting, 
  onSave, 
  candles,
  onDeleteLastCandle,
  lastCandle 
}: CandleInputFooterProps) => {
  const averageVolume = candles.length > 0 
    ? candles.reduce((sum, c) => sum + c.volume, 0) / candles.length
    : 0;

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
        
        <div className="flex space-x-2">
          {lastCandle && onDeleteLastCandle && (
            <Button 
              onClick={onDeleteLastCandle}
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
            onClick={onSave}
            disabled={!currentSession || !isValid || isSubmitting}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
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
                averageVolume > 0 ? averageVolume.toFixed(0) : 'N/A'
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CandleInputFooter;
