
import { useState } from "react";
import PredictionSettings from "./predictor/PredictionSettings";
import PredictionResults from "./predictor/PredictionResults";
import PredictionGenerator from "./predictor/PredictionGenerator";
import SessionInfo from "./predictor/SessionInfo";
import SessionStatus from "./predictor/SessionStatus";
import CandleHistory from "./predictor/CandleHistory";
import SimpleSessionManager from "./session/SimpleSessionManager";
import SimpleCandleInput from "./session/SimpleCandleInput";
import { useSessionState } from "@/hooks/useSessionState";
import { usePredictionGeneration } from "@/hooks/usePredictionGeneration";
import { usePredictorLogic } from "./hooks/usePredictorLogic";
import { PredictionConfig } from "@/types/trading";

interface BinaryOptionsPredictorProps {
  pair: string;
  timeframe: string;
}

const BinaryOptionsPredictor = ({ pair, timeframe }: BinaryOptionsPredictorProps) => {
  const { 
    currentSession, 
    candles, 
    setCandles,
    isLoading 
  } = useSessionState();
  
  const { predictionResult, isGenerating, generatePrediction } = usePredictionGeneration();
  const [predictionConfig, setPredictionConfig] = useState<PredictionConfig>({
    predictionInterval: 5,
    analysisMode: 'session'
  });

  const { handleCandleSaved } = usePredictorLogic({
    currentSession,
    generatePrediction,
    predictionConfig
  });

  console.log('BinaryOptionsPredictor: currentSession =', currentSession?.id || 'null');
  console.log('BinaryOptionsPredictor: candles count =', candles.length);
  console.log('BinaryOptionsPredictor: isLoading =', isLoading);

  return (
    <div className="space-y-6">
      <SessionInfo />

      <SimpleSessionManager pair={pair} />

      <SessionStatus currentSession={currentSession} />

      <SimpleCandleInput 
        currentSession={currentSession}
        candles={candles}
        setCandles={setCandles}
        pair={pair}
        onCandleSaved={handleCandleSaved}
      />

      <PredictionSettings 
        config={predictionConfig}
        onChange={setPredictionConfig}
      />

      <PredictionGenerator isGenerating={isGenerating} />

      {predictionResult && !isGenerating && (
        <PredictionResults 
          result={predictionResult}
          pair={pair}
        />
      )}

      <CandleHistory candles={candles} />
    </div>
  );
};

export default BinaryOptionsPredictor;
