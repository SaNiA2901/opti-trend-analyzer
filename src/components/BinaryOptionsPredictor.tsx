
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, Target, Database } from "lucide-react";
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
  analysisMode: 'manual';
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
    analysisMode: 'manual'
  });
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const validateManualData = () => {
    return manualData.open > 0 && 
           manualData.high > 0 && 
           manualData.low > 0 && 
           manualData.close > 0 && 
           manualData.volume > 0 &&
           manualData.high >= Math.max(manualData.open, manualData.close) &&
           manualData.low <= Math.min(manualData.open, manualData.close);
  };

  const generatePrediction = async () => {
    if (!validateManualData()) {
      return;
    }

    setIsGenerating(true);
    
    // Анализ пользовательских данных
    setTimeout(() => {
      const { open, high, low, close, volume } = manualData;
      
      // Технический анализ на основе введенных данных
      const priceRange = high - low;
      const bodySize = Math.abs(close - open);
      const upperShadow = high - Math.max(open, close);
      const lowerShadow = Math.min(open, close) - low;
      
      // Анализ паттернов
      const isBullish = close > open;
      const isHammer = bodySize < priceRange * 0.3 && lowerShadow > bodySize * 2;
      const isDoji = bodySize < priceRange * 0.1;
      
      // Анализ объема
      const volumeFactor = Math.min(100, (volume / 1000) * 20); // Нормализация объема
      
      // Технические факторы
      const technicalFactor = isBullish ? 
        (isHammer ? 85 : (isDoji ? 50 : 65)) : 
        (isHammer ? 15 : (isDoji ? 50 : 35));
      
      // Анализ моментума
      const momentumFactor = isBullish ? 
        Math.min(90, 50 + (bodySize / priceRange) * 40) :
        Math.max(10, 50 - (bodySize / priceRange) * 40);
      
      // Анализ волатильности
      const volatilityFactor = Math.min(90, Math.max(10, (priceRange / open) * 1000));
      
      // Взвешенная оценка
      const weightedScore = (
        technicalFactor * 0.4 +
        volumeFactor * 0.2 +
        momentumFactor * 0.25 +
        volatilityFactor * 0.15
      );

      const direction = weightedScore > 50 ? 'UP' : 'DOWN';
      const probability = Math.min(95, Math.max(55, weightedScore));
      const confidence = Math.min(90, Math.max(60, probability - 5));

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
          `Рекомендуем CALL опцион на ${predictionConfig.predictionInterval} мин. ${isHammer ? 'Обнаружен паттерн "Молот"' : ''}` :
          `Рекомендуем PUT опцион на ${predictionConfig.predictionInterval} мин. ${isHammer ? 'Обнаружен медвежий паттерн' : ''}`
      };

      setPredictionResult(result);
      setIsGenerating(false);
    }, 1500);
  };

  // Автоматическая генерация прогноза при изменении данных
  useEffect(() => {
    if (validateManualData() && !isGenerating) {
      generatePrediction();
    } else if (!validateManualData()) {
      setPredictionResult(null);
    }
  }, [manualData, predictionConfig.predictionInterval]);

  return (
    <div className="space-y-6">
      {/* Информация о режиме */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <div className="flex items-center space-x-3 mb-4">
          <Database className="h-6 w-6 text-blue-400" />
          <h3 className="text-xl font-semibold text-white">Автоматический анализ данных</h3>
          <Badge className="bg-green-600 text-white">Авто-прогнозы</Badge>
        </div>
        
        <div className="bg-slate-700/50 rounded-lg p-4">
          <ul className="text-slate-300 text-sm space-y-2">
            <li>• Прогноз генерируется автоматически при вводе всех данных OHLC</li>
            <li>• Анализ основан исключительно на ваших данных свечи</li>
            <li>• Техническое определение паттернов свечного анализа</li>
            <li>• Мгновенные рекомендации для бинарных опционов</li>
          </ul>
        </div>
      </Card>

      {/* Ввод данных */}
      <ManualDataInput 
        data={manualData}
        onChange={setManualData}
        pair={pair}
      />

      {/* Настройки прогноза */}
      <PredictionSettings 
        config={predictionConfig}
        onChange={setPredictionConfig}
      />

      {/* Индикатор обработки */}
      {isGenerating && (
        <Card className="p-6 bg-slate-800/50 border-slate-700">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Clock className="h-5 w-5 text-blue-400 animate-spin" />
              <span className="text-white">Автоматический анализ данных...</span>
            </div>
            <Progress value={75} className="mb-2" />
            <p className="text-slate-400 text-sm">Генерация прогноза на основе введенных данных</p>
          </div>
        </Card>
      )}

      {/* Статус валидации */}
      {!validateManualData() && !isGenerating && (
        <Card className="p-4 bg-orange-600/20 border-orange-600/50">
          <div className="flex items-center space-x-2">
            <Target className="h-4 w-4 text-orange-400" />
            <p className="text-orange-200 text-sm">
              Заполните все поля OHLC и объем для автоматического анализа
            </p>
          </div>
        </Card>
      )}

      {/* Результаты прогноза */}
      {predictionResult && !isGenerating && (
        <PredictionResults 
          result={predictionResult}
          pair={pair}
        />
      )}
    </div>
  );
};

export default BinaryOptionsPredictor;
