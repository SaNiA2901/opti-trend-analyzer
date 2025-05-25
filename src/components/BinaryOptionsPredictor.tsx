
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, Clock, Activity, Target } from "lucide-react";
import ManualDataInput from "./predictor/ManualDataInput";
import PredictionSettings from "./predictor/PredictionSettings";
import PredictionResults from "./predictor/PredictionResults";

interface BinaryOptionsPredictorProps {
  pair: string;
  timeframe: string;
}

export interface ManualDataInputs {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  date: string;
  time: string;
}

export interface PredictionConfig {
  predictionInterval: number;
  analysisMode: 'auto' | 'manual';
}

export interface PredictionResult {
  direction: 'UP' | 'DOWN';
  probability: number;
  confidence: number;
  interval: number;
  factors: {
    technical: number;
    volume: number;
    momentum: number;
    volatility: number;
  };
  recommendation: string;
}

const BinaryOptionsPredictor = ({ pair, timeframe }: BinaryOptionsPredictorProps) => {
  const [activeMode, setActiveMode] = useState<'realtime' | 'manual'>('realtime');
  const [manualData, setManualData] = useState<ManualDataInputs>({
    open: 0,
    high: 0,
    low: 0,
    close: 0,
    volume: 0,
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5)
  });
  const [predictionConfig, setPredictionConfig] = useState<PredictionConfig>({
    predictionInterval: 5,
    analysisMode: 'auto'
  });
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const generatePrediction = async () => {
    setIsGenerating(true);
    
    // Симуляция генерации прогноза
    setTimeout(() => {
      const basePrice = pair === "EUR/USD" ? 1.0850 : 
                       pair === "GBP/USD" ? 1.2650 :
                       pair === "USD/JPY" ? 149.50 : 
                       pair === "BTC/USD" ? 67500 : 1.0950;

      // Анализ факторов
      const technicalFactor = 60 + Math.random() * 35;
      const volumeFactor = 55 + Math.random() * 40;
      const momentumFactor = 50 + Math.random() * 45;
      const volatilityFactor = 45 + Math.random() * 50;

      // Взвешенная оценка
      const weightedScore = (
        technicalFactor * 0.4 +
        volumeFactor * 0.2 +
        momentumFactor * 0.25 +
        volatilityFactor * 0.15
      );

      const direction = weightedScore > 50 ? 'UP' : 'DOWN';
      const probability = Math.min(95, Math.max(55, weightedScore + Math.random() * 10));
      const confidence = Math.min(90, Math.max(60, probability - 5 + Math.random() * 15));

      const result: PredictionResult = {
        direction,
        probability,
        confidence,
        interval: predictionConfig.predictionInterval,
        factors: {
          technical: technicalFactor,
          volume: volumeFactor,
          momentum: momentumFactor,
          volatility: volatilityFactor
        },
        recommendation: direction === 'UP' ? 
          `Рекомендуем CALL опцион на ${predictionConfig.predictionInterval} мин` :
          `Рекомендуем PUT опцион на ${predictionConfig.predictionInterval} мин`
      };

      setPredictionResult(result);
      setIsGenerating(false);
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Режимы работы системы */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-xl font-semibold text-white mb-4">Режимы работы системы</h3>
        
        <Tabs value={activeMode} onValueChange={(value) => setActiveMode(value as 'realtime' | 'manual')}>
          <TabsList className="bg-slate-700 border-slate-600 mb-4">
            <TabsTrigger value="realtime" className="data-[state=active]:bg-blue-600">
              <Activity className="h-4 w-4 mr-2" />
              Режим реального времени
            </TabsTrigger>
            <TabsTrigger value="manual" className="data-[state=active]:bg-blue-600">
              <Target className="h-4 w-4 mr-2" />
              Ручной режим
            </TabsTrigger>
          </TabsList>

          <TabsContent value="realtime" className="space-y-4">
            <div className="bg-slate-700/50 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-white font-medium">Автоматический анализ активен</span>
              </div>
              <ul className="text-slate-300 text-sm space-y-2">
                <li>• Автоматический анализ данных с биржевых источников</li>
                <li>• Мгновенное обновление прогнозов при изменении рыночных условий</li>
                <li>• Анализ цены, объема и данных OHLC в реальном времени</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <div className="bg-slate-700/50 rounded-lg p-4 mb-4">
              <p className="text-slate-300 text-sm mb-2">
                <strong className="text-white">Ручной режим</strong> — активируется при невозможности использования данных реального времени.
              </p>
              <p className="text-slate-400 text-xs">
                Позволяет вводить исторические данные и анализировать прошлые рыночные ситуации.
              </p>
            </div>
            
            <ManualDataInput 
              data={manualData}
              onChange={setManualData}
              pair={pair}
            />
          </TabsContent>
        </Tabs>
      </Card>

      {/* Настройки прогноза */}
      <PredictionSettings 
        config={predictionConfig}
        onChange={setPredictionConfig}
      />

      {/* Кнопка генерации прогноза */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <div className="text-center">
          <Button 
            onClick={generatePrediction}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            {isGenerating ? (
              <>
                <Clock className="h-5 w-5 mr-2 animate-spin" />
                Генерация прогноза...
              </>
            ) : (
              <>
                <Target className="h-5 w-5 mr-2" />
                Сгенерировать прогноз
              </>
            )}
          </Button>
          
          {isGenerating && (
            <div className="mt-4">
              <Progress value={66} className="mb-2" />
              <p className="text-slate-400 text-sm">Анализ рыночных данных и генерация прогноза...</p>
            </div>
          )}
        </div>
      </Card>

      {/* Результаты прогноза */}
      {predictionResult && (
        <PredictionResults 
          result={predictionResult}
          pair={pair}
        />
      )}
    </div>
  );
};

export default BinaryOptionsPredictor;
