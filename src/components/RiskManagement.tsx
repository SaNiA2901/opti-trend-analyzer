
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, TrendingUp, DollarSign } from "lucide-react";

interface RiskManagementProps {
  pair: string;
}

interface RiskMetrics {
  accountBalance: number;
  riskPerTrade: number;
  maxDailyLoss: number;
  currentDrawdown: number;
  winRate: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
}

const RiskManagement = ({ pair }: RiskManagementProps) => {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    accountBalance: 10000,
    riskPerTrade: 2,
    maxDailyLoss: 5,
    currentDrawdown: 0,
    winRate: 0,
    profitFactor: 0,
    sharpeRatio: 0,
    maxDrawdown: 0
  });

  const [positionSize, setPositionSize] = useState(0);
  const [riskAlert, setRiskAlert] = useState<string | null>(null);

  useEffect(() => {
    // Симулируем обновление метрик риска
    const updateRiskMetrics = () => {
      setRiskMetrics(prev => ({
        ...prev,
        currentDrawdown: Math.random() * 8,
        winRate: 60 + Math.random() * 25,
        profitFactor: 1.2 + Math.random() * 0.8,
        sharpeRatio: 0.8 + Math.random() * 1.2,
        maxDrawdown: 12 + Math.random() * 8
      }));

      // Проверяем риски
      if (riskMetrics.currentDrawdown > riskMetrics.maxDailyLoss) {
        setRiskAlert("Превышен дневной лимит потерь!");
      } else if (riskMetrics.currentDrawdown > riskMetrics.maxDailyLoss * 0.8) {
        setRiskAlert("Приближение к дневному лимиту потерь");
      } else {
        setRiskAlert(null);
      }
    };

    updateRiskMetrics();
    const interval = setInterval(updateRiskMetrics, 5000);
    return () => clearInterval(interval);
  }, [riskMetrics.maxDailyLoss]);

  const calculatePositionSize = () => {
    const riskAmount = (riskMetrics.accountBalance * riskMetrics.riskPerTrade) / 100;
    const calculatedSize = Math.floor(riskAmount / 10); // Упрощенный расчет
    setPositionSize(calculatedSize);
  };

  const getRiskLevel = (drawdown: number) => {
    if (drawdown < 3) return { level: 'Низкий', color: 'bg-green-600' };
    if (drawdown < 6) return { level: 'Средний', color: 'bg-yellow-600' };
    return { level: 'Высокий', color: 'bg-red-600' };
  };

  const riskLevel = getRiskLevel(riskMetrics.currentDrawdown);

  return (
    <div className="space-y-6">
      {/* Risk Alert */}
      {riskAlert && (
        <Alert className="border-red-500 bg-red-500/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-red-400">
            {riskAlert}
          </AlertDescription>
        </Alert>
      )}

      {/* Risk Overview */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Управление рисками</h3>
          </div>
          <Badge className={`${riskLevel.color} text-white`}>
            Риск: {riskLevel.level}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-slate-700/50 rounded-lg">
            <DollarSign className="h-6 w-6 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white mb-1">
              ${riskMetrics.accountBalance.toLocaleString()}
            </div>
            <p className="text-slate-400 text-sm">Баланс счета</p>
          </div>
          
          <div className="text-center p-4 bg-slate-700/50 rounded-lg">
            <div className="text-2xl font-bold text-white mb-1">
              {riskMetrics.riskPerTrade}%
            </div>
            <p className="text-slate-400 text-sm">Риск на сделку</p>
          </div>
          
          <div className="text-center p-4 bg-slate-700/50 rounded-lg">
            <div className={`text-2xl font-bold mb-1 ${riskMetrics.currentDrawdown > 5 ? 'text-red-400' : 'text-white'}`}>
              {riskMetrics.currentDrawdown.toFixed(1)}%
            </div>
            <p className="text-slate-400 text-sm">Текущая просадка</p>
          </div>
          
          <div className="text-center p-4 bg-slate-700/50 rounded-lg">
            <div className="text-2xl font-bold text-white mb-1">
              {riskMetrics.winRate.toFixed(1)}%
            </div>
            <p className="text-slate-400 text-sm">Винрейт</p>
          </div>
        </div>
      </Card>

      {/* Position Size Calculator */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Калькулятор размера позиции</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="text-slate-400 text-sm block mb-2">Баланс счета ($)</label>
            <Input
              type="number"
              value={riskMetrics.accountBalance}
              onChange={(e) => setRiskMetrics(prev => ({...prev, accountBalance: Number(e.target.value)}))}
              className="bg-slate-700 border-slate-600 text-white"
            />
          </div>
          
          <div>
            <label className="text-slate-400 text-sm block mb-2">Риск на сделку (%)</label>
            <Input
              type="number"
              value={riskMetrics.riskPerTrade}
              onChange={(e) => setRiskMetrics(prev => ({...prev, riskPerTrade: Number(e.target.value)}))}
              className="bg-slate-700 border-slate-600 text-white"
              max="10"
              min="0.5"
              step="0.5"
            />
          </div>
          
          <div>
            <label className="text-slate-400 text-sm block mb-2">Макс. дневные потери (%)</label>
            <Input
              type="number"
              value={riskMetrics.maxDailyLoss}
              onChange={(e) => setRiskMetrics(prev => ({...prev, maxDailyLoss: Number(e.target.value)}))}
              className="bg-slate-700 border-slate-600 text-white"
              max="20"
              min="1"
            />
          </div>
        </div>

        <Button onClick={calculatePositionSize} className="w-full mb-4 bg-blue-600 hover:bg-blue-700">
          Рассчитать размер позиции
        </Button>

        {positionSize > 0 && (
          <div className="bg-slate-700/50 rounded-lg p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white mb-2">
                ${positionSize}
              </div>
              <p className="text-slate-400 text-sm">Рекомендуемый размер позиции для {pair}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Risk Metrics */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Метрики производительности</h3>
        
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Profit Factor</span>
              <span className="text-white">{riskMetrics.profitFactor.toFixed(2)}</span>
            </div>
            <Progress 
              value={Math.min(riskMetrics.profitFactor * 50, 100)} 
              className="h-2 bg-slate-700"
            />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Sharpe Ratio</span>
              <span className="text-white">{riskMetrics.sharpeRatio.toFixed(2)}</span>
            </div>
            <Progress 
              value={Math.min(riskMetrics.sharpeRatio * 50, 100)} 
              className="h-2 bg-slate-700"
            />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Макс. просадка</span>
              <span className="text-white">{riskMetrics.maxDrawdown.toFixed(1)}%</span>
            </div>
            <Progress 
              value={riskMetrics.maxDrawdown * 5} 
              className="h-2 bg-slate-700"
            />
          </div>
        </div>
      </Card>

      {/* Risk Rules */}
      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Правила риск-менеджмента</h3>
        
        <div className="space-y-3">
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
            <p className="text-slate-300 text-sm">
              Никогда не рискуйте более {riskMetrics.riskPerTrade}% на одну сделку
            </p>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
            <p className="text-slate-300 text-sm">
              Прекратите торговлю при достижении {riskMetrics.maxDailyLoss}% дневных потерь
            </p>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
            <p className="text-slate-300 text-sm">
              Используйте стоп-лоссы для всех позиций
            </p>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-2 h-2 bg-red-400 rounded-full mt-2"></div>
            <p className="text-slate-300 text-sm">
              Регулярно анализируйте и корректируйте стратегию
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default RiskManagement;
