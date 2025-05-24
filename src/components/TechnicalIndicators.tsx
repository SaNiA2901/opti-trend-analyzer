
import { useIndicatorData } from "@/hooks/useIndicatorData";
import RSIIndicator from "@/components/indicators/RSIIndicator";
import MACDIndicator from "@/components/indicators/MACDIndicator";
import MovingAveragesIndicator from "@/components/indicators/MovingAveragesIndicator";
import StochasticIndicator from "@/components/indicators/StochasticIndicator";

interface TechnicalIndicatorsProps {
  pair: string;
  timeframe: string;
}

const TechnicalIndicators = ({ pair, timeframe }: TechnicalIndicatorsProps) => {
  const { indicators, indicatorData } = useIndicatorData(pair, timeframe);

  return (
    <div className="space-y-6">
      <RSIIndicator rsi={indicators.rsi} />
      <MACDIndicator macd={indicators.macd} chartData={indicatorData} />
      <MovingAveragesIndicator ma20={indicators.ma20} ma50={indicators.ma50} />
      <StochasticIndicator stochastic={indicators.stochastic} />
    </div>
  );
};

export default TechnicalIndicators;
