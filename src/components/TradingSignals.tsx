
import { Card } from "@/components/ui/card";
import { useSignalGeneration } from "@/hooks/useSignalGeneration";
import MarketSentiment from "@/components/signals/MarketSentiment";
import SignalCard from "@/components/signals/SignalCard";
import TradingTips from "@/components/signals/TradingTips";

interface TradingSignalsProps {
  pair: string;
  timeframe: string;
}

const TradingSignals = ({ pair, timeframe }: TradingSignalsProps) => {
  const { signals, overallSentiment, confidence } = useSignalGeneration(pair, timeframe);

  return (
    <div className="space-y-6">
      <MarketSentiment 
        sentiment={overallSentiment}
        confidence={confidence}
        signalCount={signals.length}
      />

      <Card className="p-6 bg-slate-800/50 border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Торговые сигналы для бинарных опционов</h3>
        
        <div className="space-y-4">
          {signals.map((signal) => (
            <SignalCard 
              key={signal.id}
              signal={signal}
              pair={pair}
            />
          ))}
        </div>
      </Card>

      <TradingTips />
    </div>
  );
};

export default TradingSignals;
