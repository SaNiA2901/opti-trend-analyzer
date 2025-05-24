
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface MarketSentimentProps {
  sentiment: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  signalCount: number;
}

const MarketSentiment = ({ sentiment, confidence, signalCount }: MarketSentimentProps) => {
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH': return 'bg-green-600';
      case 'BEARISH': return 'bg-red-600';
      default: return 'bg-blue-600';
    }
  };

  const getSentimentText = (sentiment: string) => {
    switch (sentiment) {
      case 'BULLISH': return 'Бычий';
      case 'BEARISH': return 'Медвежий';
      default: return 'Нейтральный';
    }
  };

  return (
    <Card className="p-6 bg-slate-800/50 border-slate-700">
      <h3 className="text-lg font-semibold text-white mb-4">Общий анализ рынка</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center">
          <Badge className={`${getSentimentColor(sentiment)} text-white mb-2`}>
            {getSentimentText(sentiment)}
          </Badge>
          <p className="text-slate-400 text-sm">Настроение рынка</p>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-white mb-1">{confidence}%</div>
          <Progress value={confidence} className="mb-2 h-2" />
          <p className="text-slate-400 text-sm">Уверенность</p>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400 mb-1">{signalCount}</div>
          <p className="text-slate-400 text-sm">Активных сигналов</p>
        </div>
      </div>
    </Card>
  );
};

export default MarketSentiment;
