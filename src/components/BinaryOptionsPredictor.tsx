
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp } from 'lucide-react';
import SimpleSessionManager from './session/SimpleSessionManager';
import SimpleCandleInput from './session/SimpleCandleInput';
import PatternDetection from './patterns/PatternDetection';
import { useApplicationState } from '@/hooks/useApplicationState';
import { usePredictionGeneration } from '@/hooks/usePredictionGeneration';
import { usePredictorLogic } from './hooks/usePredictorLogic';
import { PredictionConfig } from '@/types/trading';

interface BinaryOptionsPredictorProps {
  pair: string;
  timeframe: string;
}

const BinaryOptionsPredictor = ({ pair, timeframe }: BinaryOptionsPredictorProps) => {
  const {
    currentSession,
    candles,
    isLoading,
    updateCandle
  } = useApplicationState();

  const [predictionConfig] = useState<PredictionConfig>({
    predictionInterval: 5,
    analysisMode: 'session'
  });

  const { generatePrediction } = usePredictionGeneration();

  const { handleCandleSaved } = usePredictorLogic({
    currentSession,
    generatePrediction,
    predictionConfig,
    updateCandle
  });

  console.log('BinaryOptionsPredictor: currentSession =', currentSession);
  console.log('BinaryOptionsPredictor: candles count =', candles.length);
  console.log('BinaryOptionsPredictor: isLoading =', isLoading);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-2 bg-blue-600 rounded-lg">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Предиктор бинарных опционов</h2>
            <p className="text-slate-400">
              Анализ и прогнозирование для {pair} • {timeframe}
            </p>
          </div>
        </div>

        <Tabs defaultValue="session" className="space-y-6">
          <TabsList className="bg-slate-700 border-slate-600">
            <TabsTrigger value="session" className="data-[state=active]:bg-blue-600">
              Управление сессией
            </TabsTrigger>
            <TabsTrigger value="input" className="data-[state=active]:bg-blue-600">
              Ввод данных
            </TabsTrigger>
            <TabsTrigger value="patterns" className="data-[state=active]:bg-blue-600">
              Паттерны
            </TabsTrigger>
          </TabsList>

          <TabsContent value="session">
            <SimpleSessionManager pair={pair} />
          </TabsContent>

          <TabsContent value="input">
            {currentSession ? (
              <SimpleCandleInput 
                onCandleSaved={handleCandleSaved}
              />
            ) : (
              <Card className="p-8 bg-slate-700/30 border-slate-600 text-center">
                <p className="text-slate-400">
                  Создайте или загрузите сессию для начала ввода данных
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="patterns">
            <PatternDetection candles={candles} />
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default BinaryOptionsPredictor;
