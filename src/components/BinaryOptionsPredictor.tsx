
import { useState } from "react";
import PredictionSettings from "./predictor/PredictionSettings";
import PredictionResults from "./predictor/PredictionResults";
import PredictionGenerator from "./predictor/PredictionGenerator";
import SessionInfo from "./predictor/SessionInfo";
import SessionStatus from "./predictor/SessionStatus";
import CandleHistory from "./predictor/CandleHistory";
import UnifiedSessionManager from "./session/UnifiedSessionManager";
import UnifiedCandleInput from "./session/UnifiedCandleInput";
import { useUnifiedSessionState } from "@/hooks/useUnifiedSessionState";
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
    setCurrentSession,
    nextCandleIndex,
    isLoading 
  } = useUnifiedSessionState();
  
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

      <UnifiedSessionManager pair={pair} />

      <SessionStatus currentSession={currentSession} />

      {/* Всегда показываем поля ввода, если есть активная сессия */}
      {currentSession && (
        <UnifiedCandleInput 
          currentSession={currentSession}
          candles={candles}
          setCandles={setCandles}
          setCurrentSession={setCurrentSession}
          nextCandleIndex={nextCandleIndex}
          pair={pair}
          onCandleSaved={handleCandleSaved}
        />
      )}

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
