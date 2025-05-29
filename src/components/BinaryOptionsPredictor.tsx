
import { useState } from "react";
import PredictionSettings from "./predictor/PredictionSettings";
import PredictionResults from "./predictor/PredictionResults";
import PredictionGenerator from "./predictor/PredictionGenerator";
import SessionInfo from "./predictor/SessionInfo";
import SessionStatus from "./predictor/SessionStatus";
import CandleHistory from "./predictor/CandleHistory";
import SessionManager from "./session/SessionManager";
import CandleInput from "./session/CandleInput";
import { useTradingSession } from "@/hooks/useTradingSession";
import { usePredictionGeneration } from "@/hooks/usePredictionGeneration";
import { PredictionConfig } from "@/types/trading";

interface BinaryOptionsPredictorProps {
  pair: string;
  timeframe: string;
}

const BinaryOptionsPredictor = ({ pair, timeframe }: BinaryOptionsPredictorProps) => {
  const { currentSession, candles, saveCandle } = useTradingSession();
  const { predictionResult, isGenerating, generatePrediction } = usePredictionGeneration();
  const [predictionConfig, setPredictionConfig] = useState<PredictionConfig>({
    predictionInterval: 5,
    analysisMode: 'session'
  });

  console.log('BinaryOptionsPredictor: currentSession =', currentSession?.id || 'null');
  console.log('BinaryOptionsPredictor: candles.length =', candles.length);

  const handleCandleSaved = async (candleData: any) => {
    console.log('BinaryOptionsPredictor: Candle saved, generating prediction...', candleData);
    if (candleData) {
      const prediction = await generatePrediction(candleData, predictionConfig);
      
      if (prediction && currentSession && typeof candleData.candle_index === 'number') {
        try {
          await saveCandle({
            session_id: currentSession.id,
            candle_index: candleData.candle_index,
            open: candleData.open,
            high: candleData.high,
            low: candleData.low,
            close: candleData.close,
            volume: candleData.volume,
            prediction_direction: prediction.direction,
            prediction_probability: prediction.probability,
            prediction_confidence: prediction.confidence
          });
        } catch (error) {
          console.error('Error saving prediction to candle:', error);
        }
      }
    }
  };

  return (
    <div className="space-y-6">
      <SessionInfo />

      <SessionManager pair={pair} />

      <SessionStatus currentSession={currentSession} />

      {currentSession && (
        <CandleInput 
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
