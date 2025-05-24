
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TrendingUp, TrendingDown, AlertTriangle, Clock } from "lucide-react";

interface Signal {
  id: string;
  type: 'CALL' | 'PUT';
  strength: number;
  timeLeft: number;
  reason: string;
  probability: number;
  entry: number;
}

interface SignalCardProps {
  signal: Signal;
  pair: string;
}

const SignalCard = ({ signal, pair }: SignalCardProps) => {
  const formatPrice = (price: number) => {
    return pair.includes("JPY") ? price.toFixed(2) : price.toFixed(4);
  };

  return (
    <div className="border border-slate-600 rounded-lg p-4 bg-slate-700/30">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <Badge 
            className={`${signal.type === 'CALL' ? 'bg-green-600' : 'bg-red-600'} text-white flex items-center space-x-1`}
          >
            {signal.type === 'CALL' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            <span>{signal.type}</span>
          </Badge>
          
          <div className="text-white font-medium">
            {pair} @ {formatPrice(signal.entry)}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 text-slate-400">
          <Clock className="h-4 w-4" />
          <span className="text-sm">{signal.timeLeft} мин</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
        <div>
          <p className="text-slate-400 text-sm">Сила сигнала</p>
          <div className="flex items-center space-x-2">
            <Progress value={signal.strength} className="flex-1 h-2" />
            <span className="text-white text-sm">{signal.strength}%</span>
          </div>
        </div>
        
        <div>
          <p className="text-slate-400 text-sm">Вероятность успеха</p>
          <div className="flex items-center space-x-2">
            <Progress value={signal.probability} className="flex-1 h-2" />
            <span className="text-white text-sm">{signal.probability}%</span>
          </div>
        </div>
        
        <div>
          <p className="text-slate-400 text-sm">Рекомендация</p>
          <Button 
            size="sm" 
            className={`w-full ${signal.type === 'CALL' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}
          >
            {signal.type === 'CALL' ? 'ПОКУПАТЬ' : 'ПРОДАВАТЬ'}
          </Button>
        </div>
      </div>

      <div className="flex items-start space-x-2">
        <AlertTriangle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-slate-300 text-sm">{signal.reason}</p>
      </div>
    </div>
  );
};

export default SignalCard;
