
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Brain, Target, Activity } from "lucide-react";

interface MLPredictionsProps {
  pair: string;
  timeframe: string;
}

interface Prediction {
  direction: 'UP' | 'DOWN';
  confidence: number;
  probability: number;
  targetPrice: number;
  timeHorizon: number;
  model: string;
  accuracy: number;
}

const MLPredictions = ({ pair, timeframe }: MLPredictionsProps) => {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [modelPerformance, setModelPerformance] = useState<any[]>([]);
  const [isTraining, setIsTraining] = useState(false);

  useEffect(() => {
    const generateMLPredictions = () => {
      const models = [
        { name: 'LSTM Neural Network', accuracy: 78 + Math.random() * 15 },
        { name: 'Random Forest', accuracy: 72 + Math.random() * 12 },
        { name: 'Support Vector Machine', accuracy: 70 + Math.random() * 18 },
        { name: 'Gradient Boosting', accuracy: 75 + Math.random() * 14 }
      ];

      const basePrice = pair === "EUR/USD" ? 1.0850 : 
                       pair === "GBP/USD" ? 1.2650 :
                       pair === "USD/JPY" ? 149.50 : 1.0950;

      const newPredictions: Prediction[] = models.map((model, index) => {
        const direction = Math.random() > 0.5 ? 'UP' : 'DOWN';
        const confidence = 60 + Math.random() * 35;
        const probability = 55 + Math.random() * 40;
        const priceChange = (Math.random() - 0.5) * 0.02;
        
        return {
          direction,
          confidence,
          probability,
          targetPrice: basePrice + priceChange,
          timeHorizon: [5, 15, 30, 60][index],
          model: model.name,
          accuracy: model.accuracy
        };
      });

      setPredictions(newPredictions);

      // Генерируем данные производительности моделей
      const performance = [];
      for (let i = 0; i < 30; i++) {
        performance.push({
          day: i + 1,
          lstm: 75 + Math.sin(i * 0.2) * 8 + Math.random() * 5,
          randomForest: 70 + Math.cos(i * 0.15) * 6 + Math.random() * 4,
          svm: 68 + Math.sin(i * 0.1) * 7 + Math.random() * 5,
          gradientBoosting: 73 + Math.cos(i * 0.25) * 5 + Math.random() * 4
        });
      }
      setModelPerformance(performance);
    };

    generateMLPredictions();
    const interval = setInterval(generateMLPredictions, 15000);
    return () => clearInterval(interval);
  }, [pair, timeframe]);

  const formatPrice = (price: number) => {
    return pair.includes("JPY") ? price.toFixed(2) : price.toFixed(4);
  };

  const getBestPrediction = () => {
    return predictions.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  };

  const bestPrediction = predictions.length > 0 ? getBestPrediction() : null;

  return (
    <div className="space-y-6">
      {/* ML Overview */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Brain className="h-6 w-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">AI Прогнозы</h3>
          </div>
          {isTraining && (
            <Badge className="bg-yellow-600 text-white animate-pulse">
              Обучение моделей...
            </Badge>
          )}
        </div>

        {bestPrediction && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className={`text-2xl font-bold mb-1 ${bestPrediction.direction === 'UP' ? 'text-green-400' : 'text-red-400'}`}>
                {bestPrediction.direction}
              </div>
              <p className="text-slate-400 text-sm">Направление</p>
            </div>
            
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-white mb-1">
                {bestPrediction.confidence.toFixed(1)}%
              </div>
              <p className="text-slate-400 text-sm">Уверенность</p>
            </div>
            
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-white mb-1">
                {formatPrice(bestPrediction.targetPrice)}
              </div>
              <p className="text-slate-400 text-sm">Целевая цена</p>
            </div>
            
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {bestPrediction.timeHorizon}м
              </div>
              <p className="text-slate-400 text-sm">Горизонт</p>
            </div>
          </div>
        )}

        <div className="text-center">
          <Badge className="bg-green-600 text-white">
            Лучшая модель: {bestPrediction?.model}
          </Badge>
        </div>
      </Card>

      {/* Model Predictions */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Прогнозы моделей</h3>
        
        <div className="space-y-4">
          {predictions.map((prediction, index) => (
            <div key={index} className="border border-slate-600 rounded-lg p-4 bg-slate-700/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <Target className="h-4 w-4 text-blue-400" />
                  <span className="text-white font-medium">{prediction.model}</span>
                  <Badge className={`${prediction.direction === 'UP' ? 'bg-green-600' : 'bg-red-600'} text-white`}>
                    {prediction.direction}
                  </Badge>
                </div>
                
                <div className="text-right">
                  <div className="text-white text-sm">
                    {formatPrice(prediction.targetPrice)}
                  </div>
                  <div className="text-slate-400 text-xs">
                    {prediction.timeHorizon} мин
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Уверенность</p>
                  <div className="flex items-center space-x-2">
                    <Progress value={prediction.confidence} className="flex-1 h-2" />
                    <span className="text-white text-sm">{prediction.confidence.toFixed(1)}%</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-slate-400 text-sm">Вероятность</p>
                  <div className="flex items-center space-x-2">
                    <Progress value={prediction.probability} className="flex-1 h-2" />
                    <span className="text-white text-sm">{prediction.probability.toFixed(1)}%</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-slate-400 text-sm">Точность модели</p>
                  <div className="flex items-center space-x-2">
                    <Progress value={prediction.accuracy} className="flex-1 h-2" />
                    <span className="text-white text-sm">{prediction.accuracy.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Model Performance Chart */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Производительность моделей (30 дней)</h3>
        
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={modelPerformance}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} />
              <YAxis stroke="#9CA3AF" fontSize={12} domain={[60, 90]} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1F2937',
                  border: '1px solid #374151',
                  borderRadius: '8px',
                  color: '#F9FAFB'
                }}
              />
              <Line type="monotone" dataKey="lstm" stroke="#3B82F6" strokeWidth={2} name="LSTM" />
              <Line type="monotone" dataKey="randomForest" stroke="#10B981" strokeWidth={2} name="Random Forest" />
              <Line type="monotone" dataKey="svm" stroke="#F59E0B" strokeWidth={2} name="SVM" />
              <Line type="monotone" dataKey="gradientBoosting" stroke="#EF4444" strokeWidth={2} name="Gradient Boosting" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* AI Insights */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">AI Инсайты</h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <Activity className="h-4 w-4 text-blue-400 mt-1" />
            <p className="text-slate-300 text-sm">
              Модель LSTM показывает высокую точность в краткосрочных прогнозах
            </p>
          </div>
          
          <div className="flex items-start space-x-3">
            <Activity className="h-4 w-4 text-green-400 mt-1" />
            <p className="text-slate-300 text-sm">
              Обнаружены паттерны консолидации, возможен пробой в ближайшие 30 минут
            </p>
          </div>
          
          <div className="flex items-start space-x-3">
            <Activity className="h-4 w-4 text-yellow-400 mt-1" />
            <p className="text-slate-300 text-sm">
              Рекомендуется дождаться подтверждения сигнала от 2+ моделей
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default MLPredictions;
