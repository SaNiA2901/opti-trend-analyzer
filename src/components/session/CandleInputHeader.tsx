
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { formatCandleDateTime } from '@/utils/dateTimeUtils';
import { TradingSession } from '@/hooks/useTradingSession';

interface CandleInputHeaderProps {
  nextCandleIndex: number;
  currentSession: TradingSession | null;
  nextCandleTime: string;
  pair: string;
}

const CandleInputHeader = ({ 
  nextCandleIndex, 
  currentSession, 
  nextCandleTime, 
  pair 
}: CandleInputHeaderProps) => {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-lg font-medium text-white">
          Ввод свечи #{nextCandleIndex + 1}
          {!currentSession && (
            <span className="text-orange-400 text-sm ml-2">(Ожидание сессии)</span>
          )}
        </h4>
        <div className="flex items-center space-x-2">
          {currentSession && (
            <>
              <Badge className="bg-blue-600 text-white">{currentSession.timeframe}</Badge>
              <Badge className="bg-green-600 text-white">{pair}</Badge>
            </>
          )}
        </div>
      </div>

      {nextCandleTime && currentSession && (
        <div className="mb-4 p-3 bg-blue-600/20 border border-blue-600/50 rounded-lg">
          <div className="flex items-center space-x-2 text-blue-200">
            <Calendar className="h-4 w-4" />
            <span className="font-medium">Время свечи:</span>
            <span>{formatCandleDateTime(nextCandleTime)}</span>
          </div>
        </div>
      )}

      {!currentSession && (
        <div className="mb-4 p-3 bg-yellow-600/20 border border-yellow-600/50 rounded-lg">
          <div className="text-yellow-200 text-sm">
            ⚠ Выберите или создайте сессию для активации полей ввода
          </div>
        </div>
      )}
    </>
  );
};

export default CandleInputHeader;
