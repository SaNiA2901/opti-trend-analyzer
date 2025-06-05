
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, AlertTriangle } from "lucide-react";
import { usePatternDetection, PatternResult } from "@/hooks/usePatternDetection";
import { CandleData } from "@/types/session";

interface PatternDetectionProps {
  candles: CandleData[];
}

const PatternDetection = ({ candles }: PatternDetectionProps) => {
  const { detectedPatterns, hasPatterns } = usePatternDetection(candles);

  const getPatternIcon = (type: PatternResult['type']) => {
    switch (type) {
      case 'BULLISH':
        return <TrendingUp className="h-4 w-4" />;
      case 'BEARISH':
        return <TrendingDown className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const getPatternColor = (type: PatternResult['type']) => {
    switch (type) {
      case 'BULLISH':
        return 'bg-green-600';
      case 'BEARISH':
        return 'bg-red-600';
      default:
        return 'bg-blue-600';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 85) return 'text-green-400';
    if (confidence >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  if (!hasPatterns && candles.length < 5) {
    return (
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="h-6 w-6 text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Обнаружение паттернов</h3>
        </div>
        
        <div className="text-center py-8 text-slate-400">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Недостаточно данных для анализа</p>
          <p className="text-sm">Требуется минимум 5 свечей</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-slate-800/50 border-slate-700">
      <div className="flex items-center space-x-3 mb-4">
        <Activity className="h-6 w-6 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Обнаружение паттернов</h3>
        <Badge className="bg-blue-600 text-white">
          {candles.length} свечей
        </Badge>
      </div>

      {!hasPatterns ? (
        <div className="text-center py-8 text-slate-400">
          <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Паттерны не обнаружены</p>
          <p className="text-sm">Добавьте больше свечей для анализа</p>
        </div>
      ) : (
        <div className="space-y-4">
          {detectedPatterns.map((pattern, index) => (
            <Card 
              key={index}
              className="p-4 bg-slate-700/50 border-slate-600 hover:bg-slate-700/70 transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Badge className={`${getPatternColor(pattern.type)} text-white`}>
                    {getPatternIcon(pattern.type)}
                    <span className="ml-2">{pattern.name}</span>
                  </Badge>
                  
                  <Badge variant="outline" className="text-slate-300 border-slate-500">
                    {pattern.candleRange} свечей
                  </Badge>
                </div>

                <div className="text-right">
                  <div className={`font-semibold ${getConfidenceColor(pattern.confidence)}`}>
                    {pattern.confidence.toFixed(0)}%
                  </div>
                  <div className="text-xs text-slate-400">уверенность</div>
                </div>
              </div>

              <p className="text-slate-300 text-sm mb-2">
                {pattern.description}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Мин. свечей: {pattern.requiredCandles}</span>
                <span>
                  {pattern.type === 'BULLISH' ? 'Бычий сигнал' : 
                   pattern.type === 'BEARISH' ? 'Медвежий сигнал' : 
                   'Нейтральный сигнал'}
                </span>
              </div>
            </Card>
          ))}

          <div className="mt-6 p-4 bg-slate-700/30 rounded-lg border border-slate-600">
            <h4 className="text-white font-medium mb-2 flex items-center space-x-2">
              <AlertTriangle className="h-4 w-4 text-yellow-400" />
              <span>Рекомендации</span>
            </h4>
            
            <div className="text-sm text-slate-300 space-y-1">
              {detectedPatterns.some(p => p.type === 'BULLISH') && (
                <p className="text-green-400">• Обнаружены бычьи паттерны - рассмотрите CALL опционы</p>
              )}
              {detectedPatterns.some(p => p.type === 'BEARISH') && (
                <p className="text-red-400">• Обнаружены медвежьи паттерны - рассмотрите PUT опционы</p>
              )}
              {detectedPatterns.some(p => p.confidence >= 80) && (
                <p className="text-yellow-400">• Высокая уверенность в некоторых паттернах</p>
              )}
              <p className="text-slate-400">• Используйте паттерны в сочетании с другими индикаторами</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default PatternDetection;
