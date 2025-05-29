
export const useCandleTime = () => {
  const calculateCandleTime = (startDate: string, startTime: string, timeframe: string, candleIndex: number): string => {
    if (!startDate || !startTime || !timeframe || candleIndex < 0) {
      throw new Error('Invalid parameters for candle time calculation');
    }

    const startDateTime = new Date(`${startDate}T${startTime}`);
    
    if (isNaN(startDateTime.getTime())) {
      throw new Error('Invalid start date/time format');
    }
    
    const timeframeMinutes: { [key: string]: number } = {
      '1m': 1,
      '5m': 5,
      '15m': 15,
      '30m': 30,
      '1h': 60,
      '4h': 240,
      '1d': 1440
    };

    const minutes = timeframeMinutes[timeframe];
    if (!minutes) {
      throw new Error(`Unsupported timeframe: ${timeframe}`);
    }

    const candleTime = new Date(startDateTime.getTime() + (candleIndex * minutes * 60 * 1000));
    return candleTime.toISOString();
  };

  const formatCandleTime = (isoString: string): string => {
    try {
      return new Date(isoString).toLocaleString('ru-RU');
    } catch (error) {
      console.error('Error formatting candle time:', error);
      return 'Invalid time';
    }
  };

  return {
    calculateCandleTime,
    formatCandleTime
  };
};
