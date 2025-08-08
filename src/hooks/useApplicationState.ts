
import { useMemo, useCallback, useEffect } from 'react';
import { useCandleOperations } from './candle/useCandleOperations';
import { useSessionManager } from './session/useSessionManager';

export const useApplicationState = () => {
  const {
    sessions,
    currentSession,
    candles,
    isLoading,
    sessionStats,
    nextCandleIndex,
    createSession,
    loadSession,
    deleteSession,
    resetSessionState,
    updateCandles,
    setCurrentSession,
    syncStateWithDB,
    validateDataIntegrity
  } = useSessionManager();

  const { 
    saveCandle, 
    deleteCandle, 
    updateCandle,
    syncCandleData,
    validateDataConsistency
  } = useCandleOperations(
    currentSession,
    updateCandles,
    setCurrentSession
  );

  // Мемоизируем вычисление последней свечи
  const lastCandle = useMemo(() => {
    if (candles.length === 0) return null;
    return candles.reduce((latest, current) => 
      current.candle_index > latest.candle_index ? current : latest
    );
  }, [candles]);

  const deleteLastCandle = useCallback(async () => {
    if (!lastCandle) return;
    await deleteCandle(lastCandle.candle_index);
  }, [lastCandle, deleteCandle]);

  // УЛУЧШЕННАЯ ФУНКЦИЯ: Полная проверка синхронизации данных
  const checkDataSync = useCallback(() => {
    if (!currentSession) {
      return null;
    }

    const actualCandleCount = candles.length;
    const sessionIndex = currentSession.current_candle_index;
    
    // Проверяем максимальный индекс среди свечей
    const maxCandleIndex = actualCandleCount > 0 
      ? Math.max(...candles.map(c => c.candle_index))
      : 0;

    // Проверяем непрерывность индексов
    const candleIndices = candles.map(c => c.candle_index).sort((a, b) => a - b);
    const hasGaps = candleIndices.some((index, i) => 
      i > 0 && index !== candleIndices[i - 1] + 1
    );

    // Определяем различные типы проблем
    const problems = {
      countMismatch: actualCandleCount !== sessionIndex,
      indexMismatch: sessionIndex !== maxCandleIndex,
      hasGaps,
      emptyCandles: actualCandleCount === 0 && sessionIndex > 0,
      negativeDiscrepancy: sessionIndex < maxCandleIndex
    };

    const hasAnyProblem = Object.values(problems).some(Boolean);

    return {
      isSync: !hasAnyProblem,
      actualCandleCount,
      sessionIndex,
      maxCandleIndex,
      problems,
      discrepancy: sessionIndex - actualCandleCount,
      indexDiscrepancy: sessionIndex - maxCandleIndex,
      diagnostics: {
        expectedNextIndex: maxCandleIndex + 1,
        candleIndices: candleIndices.slice(0, 5), // Показываем первые 5 для диагностики
        lastUpdateTime: currentSession.updated_at
      }
    };
  }, [currentSession, candles]);

  // НОВАЯ ФУНКЦИЯ: Детальная диагностика проблем
  const diagnoseProblem = useCallback(async () => {
    const syncCheck = checkDataSync();
    if (!syncCheck || syncCheck.isSync) {
      return { hasProblems: false, report: 'Все данные синхронизированы' };
    }

    const report = [];
    
    if (syncCheck.problems.emptyCandles) {
      report.push(`🚨 КРИТИЧНО: Нет свечей в интерфейсе (0), но индекс сессии ${syncCheck.sessionIndex}`);
    }
    
    if (syncCheck.problems.countMismatch) {
      report.push(`⚠️ Количество свечей (${syncCheck.actualCandleCount}) не совпадает с индексом сессии (${syncCheck.sessionIndex})`);
    }
    
    if (syncCheck.problems.indexMismatch) {
      report.push(`⚠️ Индекс сессии (${syncCheck.sessionIndex}) не совпадает с максимальным индексом свечи (${syncCheck.maxCandleIndex})`);
    }
    
    if (syncCheck.problems.hasGaps) {
      report.push(`⚠️ Обнаружены пропуски в индексах свечей`);
    }

    // Получаем данные из БД для сравнения
    const dbConsistency = await validateDataConsistency();
    if (dbConsistency) {
      report.push(`📊 В БД: ${dbConsistency.dbCandleCount} свечей, индекс сессии ${dbConsistency.dbSessionIndex}`);
    }

    return {
      hasProblems: true,
      syncCheck,
      dbConsistency,
      report: report.join('\n'),
      recommendedAction: determineRecommendedAction(syncCheck)
    };
  }, [checkDataSync, validateDataConsistency]);

  // Определяем рекомендуемые действия на основе проблем
  const determineRecommendedAction = (syncCheck: any) => {
    if (syncCheck.problems.emptyCandles) {
      return 'FORCE_RELOAD'; // Принудительная перезагрузка из БД
    }
    if (syncCheck.problems.negativeDiscrepancy) {
      return 'SYNC_DB'; // Синхронизация с БД
    }
    if (syncCheck.problems.hasGaps) {
      return 'VALIDATE_INDICES'; // Проверка и исправление индексов
    }
    return 'SOFT_SYNC'; // Мягкая синхронизация
  };

  // УЛУЧШЕННАЯ ФУНКЦИЯ: Автоматическая синхронизация с диагностикой
  const autoSync = useCallback(async () => {
    console.log('🔍 Запуск автоматической синхронизации...');
    
    const diagnosis = await diagnoseProblem();
    
    if (!diagnosis.hasProblems) {
      console.log('✅ Синхронизация не требуется');
      return { synced: false, reason: 'No problems detected' };
    }

    console.log('🚨 Обнаружены проблемы синхронизации:');
    console.log(diagnosis.report);

    try {
      let result;
      
      switch (diagnosis.recommendedAction) {
        case 'FORCE_RELOAD':
          console.log('🔄 Выполняем принудительную перезагрузку...');
          result = await syncCandleData();
          break;
          
        case 'SYNC_DB':
          console.log('🔄 Выполняем синхронизацию с БД...');
          result = await syncStateWithDB();
          break;
          
        default:
          console.log('🔄 Выполняем стандартную синхронизацию...');
          result = await syncCandleData();
      }

      // Проверяем результат после синхронизации
      const postSyncCheck = checkDataSync();
      const success = postSyncCheck?.isSync || false;

      console.log(success ? '✅ Автосинхронизация завершена успешно' : '⚠️ Проблемы остаются после синхронизации');

      return {
        synced: true,
        success,
        beforeSync: diagnosis.syncCheck,
        afterSync: postSyncCheck,
        action: diagnosis.recommendedAction,
        result
      };
      
    } catch (error) {
      console.error('❌ Ошибка автосинхронизации:', error);
      return {
        synced: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        diagnosis
      };
    }
  }, [diagnoseProblem, syncCandleData, syncStateWithDB, checkDataSync]);

  // Автоматическая проверка при изменении сессии
  useEffect(() => {
    if (currentSession) {
      const checkTimer = setTimeout(() => {
        const syncCheck = checkDataSync();
        if (syncCheck && !syncCheck.isSync) {
          console.log('👀 Обнаружена рассинхронизация при смене сессии');
          autoSync();
        }
      }, 1000); // Задержка для завершения загрузки

      return () => clearTimeout(checkTimer);
    }
  }, [currentSession?.id, checkDataSync, autoSync]);

  return {
    // Состояние сессий
    sessions,
    currentSession,
    candles,
    isLoading,
    sessionStats,
    nextCandleIndex,
    
    // Операции с сессиями
    loadSession,
    createSession,
    deleteSession,
    resetSessionState,
    
    // Операции со свечами
    saveCandle,
    deleteLastCandle,
    updateCandle,
    
    // УЛУЧШЕННЫЕ ФУНКЦИИ: Синхронизация и диагностика
    syncCandleData,
    checkDataSync,
    autoSync,
    diagnoseProblem,
    
    // Дополнительные утилиты
    lastCandle
  };
};
