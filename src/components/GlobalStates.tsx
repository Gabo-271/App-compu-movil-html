import React from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { useVoteApp } from './VoteAppContext';
import { RefreshCw, Wifi, WifiOff, AlertTriangle, CheckCircle2, Search } from 'lucide-react';
import { motion } from 'motion/react';

export function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-purple-900/20 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <motion.div
          className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <RefreshCw className="w-8 h-8 text-white" />
        </motion.div>
        
        <div className="space-y-2">
          <h2>Cargando...</h2>
          <p className="text-muted-foreground">
            Estamos preparando las votaciones para ti
          </p>
        </div>
        
        <div className="flex justify-center">
          <div className="flex space-x-1">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 bg-primary rounded-full"
                animate={{ y: [0, -10, 0] }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyScreen() {
  const { navigateTo } = useVoteApp();
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-sm">
        <div className="w-24 h-24 mx-auto bg-muted rounded-full flex items-center justify-center">
          <Search className="w-12 h-12 text-muted-foreground" />
        </div>
        
        <div className="space-y-2">
          <h2>No hay votaciones disponibles</h2>
          <p className="text-muted-foreground">
            En este momento no hay votaciones activas. Te notificaremos cuando haya nuevas oportunidades para participar.
          </p>
        </div>
        
        <Button 
          onClick={() => navigateTo('voting-list')}
          className="w-full"
        >
          Actualizar
        </Button>
      </div>
    </div>
  );
}

export function SuccessScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-blue-50 dark:from-slate-900 dark:via-emerald-900/10 dark:to-teal-900/10 flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <motion.div
          className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/25"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 10 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <CheckCircle2 className="w-12 h-12 text-white" />
          </motion.div>
        </motion.div>
        
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-400">
            ¡Voto registrado exitosamente!
          </h2>
          <p className="text-muted-foreground max-w-sm mx-auto">
            Tu participación ha sido registrada correctamente. Gracias por contribuir a la democracia digital.
          </p>
        </motion.div>
        
        <motion.div
          className="flex justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex space-x-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1 h-1 bg-secondary rounded-full"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.1
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface ErrorScreenProps {
  type?: 'network' | 'server' | 'validation';
}

export function ErrorScreen({ type = 'network' }: ErrorScreenProps) {
  const { setError, navigateTo } = useVoteApp();
  
  const errorConfig = {
    network: {
      icon: <WifiOff className="w-12 h-12 text-destructive" />,
      title: 'Sin conexión a internet',
      description: 'Parece que no tienes conexión a internet. Verifica tu conectividad e intenta nuevamente.',
      action: 'Reintentar'
    },
    server: {
      icon: <AlertTriangle className="w-12 h-12 text-destructive" />,
      title: 'Error del servidor',
      description: 'Hay un problema temporal con nuestros servidores. Por favor, intenta nuevamente en unos momentos.',
      action: 'Reintentar'
    },
    validation: {
      icon: <AlertTriangle className="w-12 h-12 text-destructive" />,
      title: 'Error de validación',
      description: 'Los datos proporcionados no son válidos. Por favor, revisa la información e intenta nuevamente.',
      action: 'Corregir'
    }
  };
  
  const config = errorConfig[type];
  
  const handleRetry = () => {
    setError(null);
    navigateTo('voting-list');
  };
  
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardContent className="p-6 text-center space-y-6">
          <div className="w-24 h-24 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
            {config.icon}
          </div>
          
          <div className="space-y-2">
            <h2 className="text-destructive">{config.title}</h2>
            <p className="text-muted-foreground text-sm">
              {config.description}
            </p>
          </div>
          
          <div className="space-y-3">
            <Button 
              onClick={handleRetry}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {config.action}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigateTo('voting-list')}
              className="w-full"
            >
              Volver al inicio
            </Button>
          </div>
          
          {type === 'network' && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Wifi className="w-3 h-3" />
                <span>Verificando conexión...</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}