
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { CandleData } from '@/types/session';

interface PatternDetectionProps {
  candles: CandleData[];
}

const PatternDetection = ({ candles }: PatternDetectionProps) => {
  const detectPatterns = (candleData: CandleData[]) => {
    if (candleData.length < 3) return [];

    const patterns = [];
    const lastCandles = candleData.slice(-3);

    // Простые паттерны для демонстрации
    lastCandles.forEach((candle, index) => {
      const bodySize = Math.abs(candle.close - candle.open);
      const priceRange = candle.high - candle.low;
      const upperShadow = candle.high - Math.max(candle.open, candle.close);
      const lowerShadow = Math.min(candle.open, candle.close) - candle.low;

      // Дожи
      if (bodySize < priceRange * 0.1) {
        patterns.push({
          name: 'Дожи',
          type: 'neutral',
          candle: candle.candle_index,
          strength: 'medium'
        });
      }

      // Молот
      if (bodySize < priceRange * 0.3 && lowerShadow > bodySize * 2) {
        patterns.push({
          name: 'Молот',
          type: candle.close > candle.open ? 'bullish' : 'bearish',
          candle: candle.candle_index,
          strength: 'high'
        });
      }

      // Падающая звезда
      if (bodySize < priceRange * 0.3 && upperShadow > bodySize * 2) {
        patterns.push({
          name: 'Падающая звезда',
          type: 'bearish',
          candle: candle.candle_index,
          strength: 'high'
        });
      }
    });

    return patterns;
  };

  const patterns = detectPatterns(candles);

  if (candles.length === 0) {
    return (
      <Card className="p-8 bg-slate-700/30 border-slate-600 text-center">
        <Activity className="h-12 w-12 mx-auto mb-4 text-slate-500" />
        <p className="text-slate-400">
          Нет данных для анализа паттернов
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Добавьте свечи для обнаружения торговых паттернов
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Обнаружение паттернов
        </h3>
        
        {patterns.length > 0 ? (
          <div className="space-y-3">
            {patterns.map((pattern, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {pattern.type === 'bullish' && <TrendingUp className="h-4 w-4 text-green-400" />}
                  {pattern.type === 'bearish' && <TrendingDown className="h-4 w-4 text-red-400" />}
                  {pattern.type === 'neutral' && <Activity className="h-4 w-4 text-yellow-400" />}
                  
                  <div>
                    <span className="text-white font-medium">{pattern.name}</span>
                    <p className="text-sm text-slate-400">Свеча #{pattern.candle + 1}</p>
                  </div>
                </div>
                
                <Badge className={
                  pattern.type === 'bullish' ? 'bg-green-600' :
                  pattern.type === 'bearish' ? 'bg-red-600' : 'bg-yellow-600'
                }>
                  {pattern.strength === 'high' ? 'Сильный' : 'Средний'}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <p className="text-slate-400">Паттерны не обнаружены</p>
            <p className="text-sm text-slate-500 mt-1">
              Добавьте больше свечей для анализа
            </p>
          </div>
        )}
      </Card>

      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h4 className="text-lg font-medium text-white mb-4">Статистика анализа</h4>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">{candles.length}</div>
            <div className="text-sm text-slate-400">Проанализировано свечей</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{patterns.length}</div>
            <div className="text-sm text-slate-400">Найдено паттернов</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">
              {patterns.filter(p => p.type === 'bullish').length}
            </div>
            <div className="text-sm text-slate-400">Бычьих сигналов</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">
              {patterns.filter(p => p.type === 'bearish').length}
            </div>
            <div className="text-sm text-slate-400">Медвежьих сигналов</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default PatternDetection;
