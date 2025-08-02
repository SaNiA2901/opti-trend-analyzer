import { useState, memo, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Database, Plus, RefreshCw, Upload, Download, Trash2 } from 'lucide-react';
import { useNewApplicationState } from '@/hooks/useNewApplicationState';
import SessionForm from './SessionForm';
import SessionCard from './SessionCard';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

interface SessionCreationData {
  session_name: string;
  pair: string;
  timeframe: string;
  start_date: string;
  start_time: string;
}

interface NewSessionManagerProps {
  pair: string;
}

const NewSessionManager = memo(({ pair }: NewSessionManagerProps) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const {
    sessions,
    currentSession,
    isLoading,
    errors,
    isConnected,
    loadSessions,
    createSession,
    loadSession,
    deleteSession,
    duplicateSession
  } = useNewApplicationState();

  // Фильтруем сессии по текущей паре
  const filteredSessions = sessions.filter(s => s.pair === pair);

  // Обработка создания сессии
  const handleCreateSession = useCallback(async (sessionData: SessionCreationData) => {
    try {
      const session = await createSession(sessionData);
      setShowCreateForm(false);
      toast.success(`Сессия "${session.session_name}" создана успешно`);
    } catch (error) {
      console.error('Failed to create session:', error);
      toast.error('Не удалось создать сессию');
    }
  }, [createSession]);

  // Обработка загрузки сессии
  const handleLoadSession = useCallback(async (sessionId: string) => {
    try {
      await loadSession(sessionId);
      toast.success('Сессия загружена успешно');
    } catch (error) {
      console.error('Failed to load session:', error);
      toast.error('Не удалось загрузить сессию');
    }
  }, [loadSession]);

  // Обработка удаления сессии
  const handleDeleteSession = useCallback(async (sessionId: string) => {
    try {
      await deleteSession(sessionId);
      toast.success('Сессия удалена успешно');
    } catch (error) {
      console.error('Failed to delete session:', error);
      toast.error('Не удалось удалить сессию');
    }
  }, [deleteSession]);

  // Обработка дублирования сессии
  const handleDuplicateSession = useCallback(async (sessionId: string) => {
    const originalSession = sessions.find(s => s.id === sessionId);
    if (!originalSession) return;

    const newName = `${originalSession.session_name} (копия)`;
    
    try {
      await duplicateSession(sessionId, newName);
      toast.success('Сессия дублирована успешно');
    } catch (error) {
      console.error('Failed to duplicate session:', error);
      toast.error('Не удалось дублировать сессию');
    }
  }, [sessions, duplicateSession]);

  // Обновление списка сессий
  const handleRefreshSessions = useCallback(async () => {
    try {
      await loadSessions();
      toast.success('Список сессий обновлен');
    } catch (error) {
      console.error('Failed to refresh sessions:', error);
      toast.error('Не удалось обновить список сессий');
    }
  }, [loadSessions]);

  return (
    <Card className="p-6 bg-card/80 border-border/50 backdrop-blur-sm">
      {/* Заголовок и статус */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Database className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-semibold">Управление сессиями ({pair})</h3>
          
          {/* Статус подключения */}
          <Badge variant={isConnected ? "default" : "destructive"}>
            {isConnected ? "Подключено" : "Не подключено"}
          </Badge>
          
          {/* Активная сессия */}
          {currentSession && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Активна: {currentSession.session_name}
            </Badge>
          )}
        </div>

        {/* Действия */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefreshSessions}
            disabled={isLoading}
            className="bg-background/50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Обновить
          </Button>

          <Button 
            onClick={() => setShowCreateForm(!showCreateForm)}
            disabled={isLoading}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            Новая сессия
          </Button>
        </div>
      </div>

      {/* Ошибки */}
      {errors.length > 0 && (
        <Alert className="mb-4 border-destructive/50 bg-destructive/10">
          <AlertDescription>
            <ul className="list-disc list-inside space-y-1">
              {errors.slice(0, 3).map((error, index) => (
                <li key={index} className="text-destructive">{error}</li>
              ))}
              {errors.length > 3 && (
                <li className="text-muted-foreground">и еще {errors.length - 3} ошибок...</li>
              )}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Форма создания сессии */}
      {showCreateForm && (
        <div className="mb-6">
          <SessionForm
            onSubmit={handleCreateSession}
            onCancel={() => setShowCreateForm(false)}
            isLoading={isLoading}
            pair={pair}
          />
        </div>
      )}

      {/* Список сессий */}
      {filteredSessions.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">
              Доступные сессии ({filteredSessions.length})
            </h4>
            
            {isLoading && (
              <div className="text-sm text-muted-foreground">
                Загрузка...
              </div>
            )}
          </div>
          
          {filteredSessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              isActive={currentSession?.id === session.id}
              isLoading={isLoading}
              onLoad={handleLoadSession}
              onDelete={handleDeleteSession}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <Database className="h-16 w-16 mx-auto mb-4 opacity-50" />
          <h4 className="text-lg font-medium mb-2">Нет сессий для {pair}</h4>
          <p className="text-sm">
            Создайте новую сессию для начала работы с торговыми данными
          </p>
          {!showCreateForm && (
            <Button 
              onClick={() => setShowCreateForm(true)}
              className="mt-4"
              disabled={isLoading}
            >
              <Plus className="h-4 w-4 mr-2" />
              Создать первую сессию
            </Button>
          )}
        </div>
      )}
    </Card>
  );
});

NewSessionManager.displayName = 'NewSessionManager';

export default NewSessionManager;