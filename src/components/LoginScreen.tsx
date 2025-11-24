import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { useVoteApp } from './VoteAppContext';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { isFirebaseConfigured } from '../lib/firebase';

export function LoginScreen() {
  const { login, setError, state } = useVoteApp();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [showPopupError, setShowPopupError] = useState(false);
  const isDemo = !isFirebaseConfigured();

  const handleGoogleLogin = async (useRedirect = false) => {
    console.log('🔐 LoginScreen - Iniciando login...', useRedirect ? '(redirect)' : '(popup)');
    setIsSigningIn(true);
    setShowPopupError(false);
    
    try {
      console.log('🔐 LoginScreen - Llamando a login()...');
      await login(useRedirect);
      console.log('🔐 LoginScreen - Login exitoso!');
    } catch (error: any) {
      console.log('❌ LoginScreen - Error en login:', error);
      
      if (error.message === 'popup-blocked') {
        setShowPopupError(true);
        setError(null); // Limpiar error general
      } else if (error.message === 'redirect-in-progress') {
        // El redirect está en progreso, mostrar mensaje informativo
        setError('Abriendo página de Google para autenticación...');
        // No finalizar el loading porque el usuario estará en otra página
        setTimeout(() => {
          setIsSigningIn(false);
          setError(null);
        }, 3000);
        return; // No ejecutar finally
      } else {
        setError('Error al iniciar sesión. Intenta nuevamente.');
      }
      console.error('Error en login:', error);
    } finally {
      console.log('🔐 LoginScreen - Login terminado');
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-teal-50 dark:from-slate-900 dark:via-blue-900/20 dark:to-teal-900/20 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        
        {/* Logo y título */}
        <div className="text-center space-y-4">
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-lg shadow-blue-500/25">
            <svg 
              width="48" 
              height="48" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="text-white"
            >
              <path d="M9 12l2 2 4-4"/>
              <path d="M21 12c.552 0 1-.448 1-1V8c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v3c0 .552.448 1 1 1h18zM21 16c.552 0 1-.448 1-1v-1c0-.552-.448-1-1-1H3c-.552 0-1 .448-1 1v1c0 .552.448 1 1 1h18z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-3xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400">
              VoteApp
            </h1>
            <p className="text-muted-foreground mt-2">
              Tu voz cuenta en cada decisión
            </p>
            {isDemo && (
              <Badge variant="secondary" className="mt-2">
                🚧 Modo Demo - Firebase no configurado
              </Badge>
            )}
          </div>
        </div>

        {/* Ilustración */}
        <div className="flex justify-center">
          <ImageWithFallback
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSRphst0fq0WSwzi3QIoau8XcLiXsMFRNg5Bw&s?w=300&h=200&fit="
            alt="Ilustración de votación"
            className="w-72 h-48 object-cover rounded-2xl opacity-80"
          />
        </div>

        {/* Formulario de login */}
        <Card className="border-0 shadow-xl bg-card/80 backdrop-blur-sm ring-1 ring-blue-500/10">
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2 text-center">
              <h2 className="bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent dark:from-slate-200 dark:to-slate-100">
                {isDemo ? 'Demo - Sin Firebase' : 'Iniciar Sesión'}
              </h2>
              <p className="text-sm text-muted-foreground">
                {isDemo 
                  ? 'Explora la app con datos de ejemplo. Configura Firebase para funcionalidad completa.'
                  : 'Accede con tu cuenta de Google para participar en las votaciones'
                }
              </p>
            </div>

            <Button 
              onClick={() => handleGoogleLogin(false)}
              disabled={isSigningIn}
              className="w-full h-12 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02]"
              variant="outline"
            >
              <div className="flex items-center gap-3">
                {isDemo ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {isSigningIn ? 'Iniciando...' : isDemo ? 'Explorar Demo' : 'Continuar con Google'}
              </div>
            </Button>

            {/* Mostrar botón alternativo si hay error de popup */}
            {showPopupError && !isDemo && (
              <div className="space-y-3">
                <div className="text-center">
                  <p className="text-sm text-blue-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
                    💡 <strong>Tip:</strong> La próxima vez que hagas clic, se usará automáticamente el método alternativo (redirect) que es más compatible.
                  </p>
                </div>
                <Button 
                  onClick={() => handleGoogleLogin(true)}
                  disabled={isSigningIn}
                  className="w-full h-12"
                  variant="default"
                >
                  🔄 Iniciar sesión (Método redirect)
                </Button>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-muted-foreground leading-relaxed">
                {isDemo 
                  ? 'Modo demo con datos de ejemplo. Para autenticación real, configura Firebase según FIREBASE_SETUP.md'
                  : 'Al continuar, aceptas nuestros términos de servicio y política de privacidad'
                }
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            VoteApp v1.0 - Participación ciudadana digital
          </p>
        </div>
      </div>
    </div>
  );
}