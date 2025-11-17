import React, { useState, useEffect } from 'react';
import { useVoteApp } from './VoteAppContext';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  source: string;
  message: string;
}

export const DebugPanel: React.FC = () => {
  const { state } = useVoteApp();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Interceptar console.log para capturar logs
  useEffect(() => {
    const originalLog = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    const addLog = (level: 'info' | 'warn' | 'error', args: any[]) => {
      const message = args.join(' ');
      if (message.includes('[') && message.includes(']')) {
        const source = message.match(/\[([^\]]+)\]/)?.[1] || 'UNKNOWN';
        setLogs(prev => [...prev.slice(-19), {
          timestamp: new Date().toLocaleTimeString(),
          level,
          source,
          message
        }]);
      }
    };

    console.log = (...args) => {
      originalLog(...args);
      addLog('info', args);
    };

    console.warn = (...args) => {
      originalWarn(...args);
      addLog('warn', args);
    };

    console.error = (...args) => {
      originalError(...args);
      addLog('error', args);
    };

    return () => {
      console.log = originalLog;
      console.warn = originalWarn;
      console.error = originalError;
    };
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'checking': return 'bg-yellow-500';
      case 'unavailable': return 'bg-red-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'FIREBASE HOOK': return 'text-orange-600';
      case 'FIREBASE AUTH': return 'text-orange-500';
      case 'FIREBASE LOGIN': return 'text-orange-400';
      case 'FIREBASE STATE': return 'text-orange-300';
      case 'API CHECK': return 'text-blue-600';
      case 'AUTH API': return 'text-blue-500';
      case 'JWT API': return 'text-blue-400';
      case 'VOTE API': return 'text-blue-300';
      case 'VOTE CONTEXT': return 'text-purple-600';
      default: return 'text-gray-600';
    }
  };

  if (!isVisible) {
    return (
      <Button 
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 z-50"
        variant="outline"
        size="sm"
      >
        🔧 Debug
      </Button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 z-50">
      <Card className="bg-white dark:bg-gray-900 border-2">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-sm">Panel de Debug</CardTitle>
            <Button 
              onClick={() => setIsVisible(false)}
              variant="ghost" 
              size="sm"
            >
              ✕
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Estado del sistema */}
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Usuario:</span>
              <span className="font-mono">{state.user?.name || 'No autenticado'}</span>
            </div>
            <div className="flex justify-between">
              <span>Fuente:</span>
              <Badge variant="outline" className="text-xs">
                {state.dataSource.toUpperCase()}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span>API:</span>
              <div className={`w-2 h-2 rounded-full ${getStatusColor(state.apiStatus)}`} />
            </div>
            <div className="flex justify-between">
              <span>Votaciones:</span>
              <span className="font-mono">{state.votes.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Cargando:</span>
              <span className="font-mono">{state.isLoading ? 'Sí' : 'No'}</span>
            </div>
          </div>

          {/* Logs */}
          <div className="border-t pt-2">
            <h4 className="text-xs font-semibold mb-1">Logs del Sistema</h4>
            <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
              {logs.slice(-10).map((log, index) => (
                <div key={index} className="flex text-[10px]">
                  <span className="text-gray-500 mr-1">{log.timestamp.split(':').slice(0,2).join(':')}</span>
                  <span className={`mr-1 font-semibold ${getSourceColor(log.source)}`}>
                    {log.source}:
                  </span>
                  <span className={`flex-1 ${
                    log.level === 'error' ? 'text-red-600' : 
                    log.level === 'warn' ? 'text-yellow-600' : 
                    'text-gray-700 dark:text-gray-300'
                  }`}>
                    {log.message.replace(/🚀|📊|🔥|🌐|✅|❌|⚠️|🔍|📡|🎯|💥|📝|📋|🔗|🔑|🔐|🔄|🎫|📄|🗳️|⏳|📊/g, '').trim()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Acciones rápidas */}
          <div className="border-t pt-2 flex gap-2">
            <Button 
              onClick={() => setLogs([])} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              Limpiar
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              variant="outline" 
              size="sm"
              className="text-xs"
            >
              Reload
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};