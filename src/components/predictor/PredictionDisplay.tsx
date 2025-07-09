
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, TrendingDown, BarChart3, Brain, Activity, TrendingUpDown } from 'lucide-react';
import { CandleData, TradingSession } from '@/types/session';
import { usePredictionGeneration } from '@/hooks/usePredictionGeneration';

interface PredictionDisplayProps {
  candles: CandleData[];
  currentSession: TradingSession | null;
}

const PredictionDisplay = ({ candles, currentSession }: PredictionDisplayProps) => {
  const { getModelStats } = usePredictionGeneration();
  const [modelStats, setModelStats] = useState<any>(null);

  const candlesWithPredictions = candles.filter(candle => 
    candle.prediction_direction && candle.prediction_probability
  );

  useEffect(() => {
    if (candlesWithPredictions.length > 0) {
      setModelStats(getModelStats());
    }
  }, [candlesWithPredictions.length, getModelStats]);

  if (!currentSession) {
    return (
      <Card className="p-8 bg-slate-700/30 border-slate-600 text-center">
        <p className="text-slate-400">
          Создайте или загрузите сессию для просмотра прогнозов
        </p>
      </Card>
    );
  }

  if (candlesWithPredictions.length === 0) {
    return (
      <Card className="p-8 bg-slate-700/30 border-slate-600 text-center">
        <BarChart3 className="h-12 w-12 mx-auto mb-4 text-slate-500" />
        <p className="text-slate-400">
          Нет доступных прогнозов для текущей сессии
        </p>
        <p className="text-sm text-slate-500 mt-2">
          Добавьте свечи, чтобы получить AI прогнозы
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">
          AI Прогнозы для {currentSession.session_name}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {candlesWithPredictions.slice(-6).map((candle) => (
            <Card key={candle.id} className="p-4 bg-slate-700/50 border-slate-600">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-slate-400">
                  Свеча #{candle.candle_index + 1}
                </span>
                <Badge 
                  className={
                    candle.prediction_direction === 'UP' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-red-600 text-white'
                  }
                >
                  <div className="flex items-center space-x-1">
                    {candle.prediction_direction === 'UP' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{candle.prediction_direction}</span>
                  </div>
                </Badge>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Цена закрытия:</span>
                  <span className="text-white">{candle.close}</span>
                </div>
                
                {candle.prediction_probability && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Вероятность:</span>
                    <span className="text-blue-300">
                      {candle.prediction_probability.toFixed(1)}%
                    </span>
                  </div>
                )}

                {candle.prediction_confidence && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Уверенность:</span>
                    <span className="text-green-300">
                      {candle.prediction_confidence.toFixed(1)}%
                    </span>
                  </div>
                )}

                <div className="mt-3 p-2 bg-slate-600/50 rounded text-xs">
                  <div className="text-slate-300">
                    O: {candle.open} | H: {candle.high}
                  </div>
                  <div className="text-slate-300">
                    L: {candle.low} | C: {candle.close}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Card>

      {candlesWithPredictions.length > 0 && (
        <>
          <Card className="p-6 bg-slate-800/50 border-slate-700">
            <h4 className="text-lg font-medium text-white mb-4">Статистика прогнозов</h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {candlesWithPredictions.length}
                </div>
                <div className="text-sm text-slate-400">Всего прогнозов</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {candlesWithPredictions.filter(c => c.prediction_direction === 'UP').length}
                </div>
                <div className="text-sm text-slate-400">CALL сигналов</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">
                  {candlesWithPredictions.filter(c => c.prediction_direction === 'DOWN').length}
                </div>
                <div className="text-sm text-slate-400">PUT сигналов</div>
              </div>

              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {(candlesWithPredictions.reduce((sum, c) => sum + (c.prediction_probability || 0), 0) / candlesWithPredictions.length).toFixed(1)}%
                </div>
                <div className="text-sm text-slate-400">Средняя вероятность</div>
              </div>
            </div>
          </Card>

          {modelStats && (
            <Card className="p-6 bg-slate-800/50 border-slate-700">
              <div className="flex items-center space-x-3 mb-4">
                <Brain className="h-5 w-5 text-purple-400" />
                <h4 className="text-lg font-medium text-white">Статистика модели ML</h4>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Общая точность */}
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-white mb-2">
                      {modelStats.overallAccuracy.toFixed(1)}%
                    </div>
                    <Progress value={modelStats.overallAccuracy} className="mb-2 h-2" />
                    <p className="text-sm text-slate-400">Общая точность</p>
                  </div>
                </div>

                {/* CALL точность */}
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-400 mb-2">
                      {modelStats.callAccuracy.toFixed(1)}%
                    </div>
                    <Progress value={modelStats.callAccuracy} className="mb-2 h-2" />
                    <p className="text-sm text-slate-400">Точность CALL</p>
                  </div>
                </div>

                {/* PUT точность */}
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-400 mb-2">
                      {modelStats.putAccuracy.toFixed(1)}%
                    </div>
                    <Progress value={modelStats.putAccuracy} className="mb-2 h-2" />
                    <p className="text-sm text-slate-400">Точность PUT</p>
                  </div>
                </div>
              </div>

              {/* Веса модели */}
              <div className="mt-6">
                <h5 className="text-white font-medium mb-3 flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-blue-400" />
                  <span>Адаптивные веса факторов</span>
                </h5>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(modelStats.currentWeights).map(([factor, weight]) => (
                    <div key={factor} className="bg-slate-700/50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm text-slate-300 capitalize">{factor}</span>
                        <span className="text-xs text-white">{((weight as number) * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={(weight as number) * 100} className="h-1" />
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default PredictionDisplay;
