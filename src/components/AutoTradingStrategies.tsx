
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Play, Pause, Settings, TrendingUp, Zap, BarChart } from "lucide-react";

interface AutoTradingStrategiesProps {
  pair: string;
  timeframe: string;
}

interface Strategy {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  performance: number;
  winRate: number;
  profit: number;
  trades: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  signals: number;
}

const AutoTradingStrategies = ({ pair, timeframe }: AutoTradingStrategiesProps) => {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<string>('');
  const [autoTradingEnabled, setAutoTradingEnabled] = useState(false);

  useEffect(() => {
    const initStrategies = () => {
      const strategyData: Strategy[] = [
        {
          id: 'scalping',
          name: 'Скальпинг AI',
          description: 'Быстрые сделки на малых движениях с использованием ИИ',
          isActive: false,
          performance: 78 + Math.random() * 15,
          winRate: 65 + Math.random() * 20,
          profit: 1200 + Math.random() * 800,
          trades: 145,
          riskLevel: 'HIGH',
          signals: Math.floor(Math.random() * 10) + 5
        },
        {
          id: 'trend_following',
          name: 'Следование тренду',
          description: 'Алгоритм определения и следования основному тренду',
          isActive: false,
          performance: 72 + Math.random() * 12,
          winRate: 58 + Math.random() * 18,
          profit: 850 + Math.random() * 600,
          trades: 89,
          riskLevel: 'MEDIUM',
          signals: Math.floor(Math.random() * 8) + 3
        },
        {
          id: 'mean_reversion',
          name: 'Возврат к среднему',
          description: 'Торговля на отклонениях от средних значений',
          isActive: false,
          performance: 69 + Math.random() * 14,
          winRate: 62 + Math.random() * 16,
          profit: 650 + Math.random() * 500,
          trades: 67,
          riskLevel: 'MEDIUM',
          signals: Math.floor(Math.random() * 6) + 2
        },
        {
          id: 'arbitrage',
          name: 'Арбитражная торговля',
          description: 'Использование ценовых различий между рынками',
          isActive: false,
          performance: 85 + Math.random() * 10,
          winRate: 75 + Math.random() * 15,
          profit: 450 + Math.random() * 300,
          trades: 34,
          riskLevel: 'LOW',
          signals: Math.floor(Math.random() * 4) + 1
        },
        {
          id: 'neural_network',
          name: 'Нейронная сеть',
          description: 'Глубокое обучение для прогнозирования движений',
          isActive: false,
          performance: 82 + Math.random() * 12,
          winRate: 70 + Math.random() * 18,
          profit: 980 + Math.random() * 700,
          trades: 112,
          riskLevel: 'HIGH',
          signals: Math.floor(Math.random() * 12) + 7
        }
      ];

      setStrategies(strategyData);
    };

    initStrategies();
    const interval = setInterval(() => {
      setStrategies(prev => prev.map(strategy => ({
        ...strategy,
        performance: Math.max(30, Math.min(95, strategy.performance + (Math.random() - 0.5) * 5)),
        signals: Math.floor(Math.random() * 12) + 1
      })));
    }, 8000);

    return () => clearInterval(interval);
  }, [pair, timeframe]);

  const toggleStrategy = (strategyId: string) => {
    setStrategies(prev => prev.map(strategy => 
      strategy.id === strategyId 
        ? { ...strategy, isActive: !strategy.isActive }
        : strategy
    ));
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-600';
      case 'MEDIUM': return 'bg-yellow-600';
      case 'HIGH': return 'bg-red-600';
      default: return 'bg-blue-600';
    }
  };

  const getRiskText = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'Низкий';
      case 'MEDIUM': return 'Средний';
      case 'HIGH': return 'Высокий';
      default: return 'Средний';
    }
  };

  const activeStrategies = strategies.filter(s => s.isActive);
  const totalProfit = activeStrategies.reduce((sum, s) => sum + s.profit, 0);
  const avgWinRate = activeStrategies.length > 0 
    ? activeStrategies.reduce((sum, s) => sum + s.winRate, 0) / activeStrategies.length 
    : 0;

  return (
    <div className="space-y-6">
      {/* Auto Trading Control */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Zap className="h-6 w-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Автоматическая торговля</h3>
          </div>
          
          <div className="flex items-center space-x-4">
            <Switch
              checked={autoTradingEnabled}
              onCheckedChange={setAutoTradingEnabled}
              className="data-[state=checked]:bg-green-600"
            />
            <Badge className={autoTradingEnabled ? 'bg-green-600' : 'bg-gray-600'}>
              {autoTradingEnabled ? 'Активна' : 'Остановлена'}
            </Badge>
          </div>
        </div>

        {autoTradingEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-green-400 mb-1">
                +${totalProfit.toFixed(0)}
              </div>
              <p className="text-slate-400 text-sm">Общая прибыль</p>
            </div>
            
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-white mb-1">
                {avgWinRate.toFixed(1)}%
              </div>
              <p className="text-slate-400 text-sm">Средний винрейт</p>
            </div>
            
            <div className="text-center p-4 bg-slate-700/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-400 mb-1">
                {activeStrategies.length}
              </div>
              <p className="text-slate-400 text-sm">Активных стратегий</p>
            </div>
          </div>
        )}
      </Card>

      {/* Strategy Selection */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Выбор стратегии</h3>
        
        <div className="mb-4">
          <Select value={selectedStrategy} onValueChange={setSelectedStrategy}>
            <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
              <SelectValue placeholder="Выберите стратегию для настройки" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-600">
              {strategies.map(strategy => (
                <SelectItem key={strategy.id} value={strategy.id} className="text-white focus:bg-slate-700">
                  {strategy.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-4">
          {strategies.map((strategy) => (
            <div key={strategy.id} className="border border-slate-600 rounded-lg p-4 bg-slate-700/30">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {strategy.isActive ? (
                      <Play className="h-4 w-4 text-green-400" />
                    ) : (
                      <Pause className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-white font-medium">{strategy.name}</span>
                  </div>
                  
                  <Badge className={getRiskColor(strategy.riskLevel)}>
                    {getRiskText(strategy.riskLevel)}
                  </Badge>
                  
                  {strategy.signals > 0 && (
                    <Badge className="bg-blue-600 text-white">
                      {strategy.signals} сигналов
                    </Badge>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                  
                  <Switch
                    checked={strategy.isActive}
                    onCheckedChange={() => toggleStrategy(strategy.id)}
                    disabled={!autoTradingEnabled}
                  />
                </div>
              </div>

              <p className="text-slate-300 text-sm mb-4">{strategy.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-slate-400 text-sm">Производительность</p>
                  <div className="flex items-center space-x-2">
                    <Progress value={strategy.performance} className="flex-1 h-2" />
                    <span className="text-white text-sm">{strategy.performance.toFixed(1)}%</span>
                  </div>
                </div>
                
                <div>
                  <p className="text-slate-400 text-sm">Винрейт</p>
                  <div className="flex items-center space-x-2">
                    <Progress value={strategy.winRate} className="flex-1 h-2" />
                    <span className="text-white text-sm">{strategy.winRate.toFixed(1)}%</span>
                  </div>
                </div>
                
                <div className="text-center">
                  <p className="text-slate-400 text-sm">Прибыль</p>
                  <p className="text-green-400 font-medium">+${strategy.profit.toFixed(0)}</p>
                </div>
                
                <div className="text-center">
                  <p className="text-slate-400 text-sm">Сделок</p>
                  <p className="text-white font-medium">{strategy.trades}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Strategy Performance */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Производительность стратегий</h3>
        
        <div className="space-y-4">
          {strategies.map((strategy, index) => (
            <div key={strategy.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-bold text-white">#{index + 1}</div>
                <div>
                  <div className="text-white font-medium">{strategy.name}</div>
                  <div className="text-slate-400 text-sm">{strategy.trades} сделок</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-green-400 font-medium">+${strategy.profit.toFixed(0)}</div>
                <div className="text-slate-400 text-sm">{strategy.performance.toFixed(1)}%</div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Trading Tips */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Рекомендации по автоторговле</h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <BarChart className="h-4 w-4 text-blue-400 mt-1" />
            <p className="text-slate-300 text-sm">
              Не запускайте более 2-3 стратегий одновременно для лучшего контроля
            </p>
          </div>
          
          <div className="flex items-start space-x-3">
            <TrendingUp className="h-4 w-4 text-green-400 mt-1" />
            <p className="text-slate-300 text-sm">
              Регулярно мониторьте производительность и корректируйте параметры
            </p>
          </div>
          
          <div className="flex items-start space-x-3">
            <Settings className="h-4 w-4 text-yellow-400 mt-1" />
            <p className="text-slate-300 text-sm">
              Начинайте с консервативных настроек и постепенно увеличивайте риск
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AutoTradingStrategies;
