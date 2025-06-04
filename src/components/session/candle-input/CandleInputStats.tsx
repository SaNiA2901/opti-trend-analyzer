
import { CandleData } from '@/types/session';

interface CandleInputStatsProps {
  candles: CandleData[];
}

const CandleInputStats = ({ candles }: CandleInputStatsProps) => {
  if (candles.length === 0) return null;

  const lastCandle = candles[candles.length - 1];
  const averageVolume = candles.length > 0 
    ? candles.reduce((sum, c) => sum + c.volume, 0) / candles.length
    : 0;

  return (
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
          <span className="text-slate-300">Средний объем:</span> {averageVolume.toFixed(0)}
        </div>
      </div>
    </div>
  );
};

export default CandleInputStats;
