
import { useState, useMemo } from "react";
import PredictionSettings from "./predictor/PredictionSettings";
import PredictionResults from "./predictor/PredictionResults";
import PredictionGenerator from "./predictor/PredictionGenerator";
import SessionInfo from "./predictor/SessionInfo";
import SessionStatus from "./predictor/SessionStatus";
import CandleHistory from "./predictor/CandleHistory";
import OptimizedSessionManager from "./session/OptimizedSessionManager";
import OptimizedCandleInput from "./session/OptimizedCandleInput";
import { useApplicationState } from "@/hooks/useApplicationState";
import { usePredictionGeneration } from "@/hooks/usePredictionGeneration";
import { usePredictorLogic } from "./hooks/usePredictorLogic";
import { PredictionConfig } from "@/types/trading";
import { calculateCandleDateTime } from "@/utils/dateTimeUtils";

interface BinaryOptionsPredictorProps {
  pair: string;
  timeframe: string;
}

const BinaryOptionsPredictor = ({ pair, timeframe }: BinaryOptionsPredictorProps) => {
  const {
    sessions,
    currentSession,
    candles,
    isLoading,
    sessionStats,
    nextCandleIndex,
    loadSession,
    createSession,
    deleteSession,
    saveCandle,
    deleteLastCandle,
    updateCandle
  } = useApplicationState();
  
  const { predictionResult, isGenerating, generatePrediction } = usePredictionGeneration();
  const [predictionConfig, setPredictionConfig] = useState<PredictionConfig>({
    predictionInterval: 5,
    analysisMode: 'session'
  });

  const { handleCandleSaved } = usePredictorLogic({
    currentSession,
    generatePrediction,
    predictionConfig,
    updateCandle
  });

  // Мемоизированное время следующей свечи
  const nextCandleTime = useMemo(() => {
    if (!currentSession) return '';
    try {
      return calculateCandleDateTime(
        currentSession.start_date,
        currentSession.start_time,
        currentSession.timeframe,
        nextCandleIndex
      );
    } catch (error) {
      console.error('Error calculating next candle time:', error);
      return '';
    }
  }, [currentSession, nextCandleIndex]);

  const handleSaveCandle = async (candleData: any) => {
    const savedCandle = await saveCandle(candleData);
    if (savedCandle) {
      handleCandleSaved(savedCandle);
    }
    return savedCandle;
  };

  console.log('BinaryOptionsPredictor: currentSession =', currentSession?.id || 'null');
  console.log('BinaryOptionsPredictor: candles count =', candles.length);
  console.log('BinaryOptionsPredictor: isLoading =', isLoading);

  return (
    <div className="space-y-6">
      <SessionInfo />

      <OptimizedSessionManager 
        pair={pair}
        sessions={sessions}
        currentSession={currentSession}
        isLoading={isLoading}
        onCreateSession={createSession}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
      />

      <SessionStatus currentSession={currentSession} />

      {currentSession && (
        <OptimizedCandleInput 
          currentSession={currentSession}
          candles={candles}
          nextCandleIndex={nextCandleIndex}
          pair={pair}
          nextCandleTime={nextCandleTime}
          onSave={handleSaveCandle}
          onDeleteLast={deleteLastCandle}
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
