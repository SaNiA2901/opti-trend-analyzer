import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, TrendingUp } from 'lucide-react';
import { formatCandleDateTime } from '@/utils/dateTimeUtils';
import { TradingSession } from '@/types/session';

interface SessionStats {
  totalCandles: number;
  lastPrice: number | null;
  priceChange: number;
  highestPrice?: number | null;
  lowestPrice?: number | null;
  averageVolume?: number;
}

interface CandleInputHeaderProps {
  nextCandleIndex: number;
  currentSession: TradingSession | null;
  nextCandleTime: string;
  pair: string;
  sessionStats?: SessionStats;
}

const CandleInputHeader = ({ 
  nextCandleIndex, 
  currentSession, 
  nextCandleTime, 
  pair,
  sessionStats
}: CandleInputHeaderProps) => {
  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <h4 className="text-lg font-medium text-white">
            Ввод свечи #{nextCandleIndex + 1}
          </h4>
          {!currentSession && (
            <span className="text-orange-400 text-sm">(Ожидание сессии)</span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {currentSession && (
            <>
              <Badge className="bg-blue-600 text-white">{currentSession.timeframe}</Badge>
              <Badge className="bg-green-600 text-white">{pair}</Badge>
              {sessionStats && sessionStats.totalCandles > 0 && sessionStats.lastPrice !== null && (
                <Badge className={`${sessionStats.priceChange >= 0 ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {sessionStats.priceChange.toFixed(2)}%
                </Badge>
              )}
            </>
          )}
        </div>
      </div>

      {nextCandleTime && currentSession && (
        <div className="mb-4 p-3 bg-blue-600/20 border border-blue-600/50 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-blue-200">
              <Calendar className="h-4 w-4" />
              <span className="font-medium">Время свечи:</span>
              <span>{formatCandleDateTime(nextCandleTime)}</span>
            </div>
            
            {sessionStats && sessionStats.lastPrice !== null && (
              <div className="flex items-center space-x-2 text-blue-200">
                <Clock className="h-4 w-4" />
                <span>Последняя цена:</span>
                <span className="font-mono">{sessionStats.lastPrice}</span>
              </div>
            )}
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
