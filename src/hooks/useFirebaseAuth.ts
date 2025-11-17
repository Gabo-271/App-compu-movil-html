import { useState, useEffect } from 'react';
import { 
  signInWithPopup, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../lib/firebase';
import { createUser, getUserByEmail, User } from '../lib/firestore';

export const useFirebaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('🔥 useFirebaseAuth - useEffect iniciado');
    console.log('🔥 Firebase configurado:', isFirebaseConfigured());
    console.log('🔥 Auth object:', !!auth);
    
    // Timeout de seguridad MUY agresivo - garantiza que termine
    const timeoutId = setTimeout(() => {
      console.warn('⏰ TIMEOUT FORZADO - Finalizando carga después de 1 segundo');
      setIsLoading(false);
      if (!user) {
        setUser(null);
      }
    }, 1000); // Muy agresivo - 1 segundo

    if (!isFirebaseConfigured() || !auth) {
      console.error('\u274c [FIREBASE HOOK] Firebase no configurado o auth no disponible');
      console.log('\ud83d\udcdd [FIREBASE HOOK] Verificar variables en .env.local:');
      console.log('\ud83d\udcdd [FIREBASE HOOK] - VITE_FIREBASE_API_KEY');
      console.log('\ud83d\udcdd [FIREBASE HOOK] - VITE_FIREBASE_AUTH_DOMAIN');
      console.log('\ud83d\udcdd [FIREBASE HOOK] - VITE_FIREBASE_PROJECT_ID');
      setIsLoading(false);
      clearTimeout(timeoutId);
      return;
    }

    console.log('\ud83d\udd0e [FIREBASE HOOK] Configurando listener de autenticaci\u00f3n...');
    
    // Verificar si hay un resultado de redirect pendiente
    const checkRedirectResult = async () => {
      console.log('\ud83d\udd04 [FIREBASE REDIRECT] Verificando resultado de redirect...');
      try {
        const { getRedirectResult } = await import('firebase/auth');
        const result = await getRedirectResult(auth);
        if (result?.user) {
          console.log('\u2705 [FIREBASE REDIRECT] Resultado encontrado:', result.user.email);
        } else {
          console.log('\ud83d\udcad [FIREBASE REDIRECT] Sin resultado de redirect');
        }
      } catch (error) {
        console.log('\u2139\ufe0f [FIREBASE REDIRECT] Error verificando redirect:', error);
      }
    };
    checkRedirectResult();
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      console.log('\ud83d\udd04 [FIREBASE STATE] onAuthStateChanged disparado');
      console.log('\ud83d\udc64 [FIREBASE STATE] Usuario Firebase:', firebaseUser ? firebaseUser.email : 'null');
      
      if (firebaseUser) {
        console.log('\u2705 [FIREBASE STATE] Datos del usuario:');
        console.log('  - UID:', firebaseUser.uid);
        console.log('  - Nombre:', firebaseUser.displayName);
        console.log('  - Email:', firebaseUser.email);
        console.log('  - Foto:', firebaseUser.photoURL);
        console.log('  - Verificado:', firebaseUser.emailVerified);
      }
      
      try {
        clearTimeout(timeoutId); // Cancelar timeout porque ya tuvimos respuesta
        
        if (firebaseUser) {
          console.log('✅ Usuario autenticado, buscando en Firestore...');
          
          // Timeout para operaciones de Firestore
          const firestoreTimeout = setTimeout(() => {
            console.warn('⏰ Timeout en Firestore - usando datos básicos del usuario');
            const basicUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Usuario',
              email: firebaseUser.email!,
              photoUrl: firebaseUser.photoURL || '',
              createdAt: new Date(),
              votes: []
            };
            setUser(basicUser);
            setIsLoading(false);
          }, 2000);
          
          try {
            // Usuario autenticado, buscar o crear en Firestore
            let userData = await getUserByEmail(firebaseUser.email!);
            
            if (!userData) {
              console.log('🆕 Usuario no existe, creando nuevo...');
              // Usuario no existe, crear nuevo
              userData = await createUser({
                name: firebaseUser.displayName || 'Usuario',
                email: firebaseUser.email!,
                photoUrl: firebaseUser.photoURL || ''
              });
            }
            
            clearTimeout(firestoreTimeout);
            console.log('👤 Usuario establecido:', userData);
            setUser(userData);
          } catch (firestoreError) {
            clearTimeout(firestoreTimeout);
            console.error('❌ Error en Firestore, usando datos básicos:', firestoreError);
            // Fallback: crear usuario básico si Firestore falla
            const basicUser = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Usuario',
              email: firebaseUser.email!,
              photoUrl: firebaseUser.photoURL || '',
              createdAt: new Date(),
              votes: []
            };
            setUser(basicUser);
          }
        } else {
          console.log('❌ No hay usuario autenticado - estableciendo null');
          // Usuario no autenticado
          setUser(null);
        }
      } catch (err) {
        console.error('❌ Error en el estado de autenticación:', err);
        setError('Error al obtener datos del usuario');
      } finally {
        console.log('🏁 Finalizando carga en useFirebaseAuth');
        setIsLoading(false);
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async (useRedirect: boolean = false): Promise<User> => {
    console.log('🚀 useFirebaseAuth - Iniciando signInWithGoogle...', useRedirect ? '(redirect)' : '(popup)');
    setIsLoading(true);
    setError(null);

    try {
      if (!isFirebaseConfigured() || !auth || !googleProvider) {
        // Modo demo sin Firebase
        console.log('🎭 useFirebaseAuth - Modo demo: creando usuario simulado...');
        
        // Simular delay de red
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockUser: User = {
          id: 'demo-user-' + Date.now(),
          name: 'Usuario Demo',
          email: 'demo@voteapp.com',
          photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
          createdAt: new Date(),
          votes: []
        };
        
        console.log('🎭 useFirebaseAuth - Usuario demo creado:', mockUser);
        setUser(mockUser);
        console.log('🎭 useFirebaseAuth - Estado actualizado con usuario demo');
        return mockUser;
      }

      // Firebase real - intentar popup primero, redirect como fallback
      let result;
      
      if (useRedirect) {
        // Usar redirect (para cuando el popup está bloqueado)
        const { signInWithRedirect } = await import('firebase/auth');
        console.log('🔄 Usando signInWithRedirect...');
        await signInWithRedirect(auth, googleProvider);
        
        // Para redirect, el resultado se maneja automáticamente por onAuthStateChanged
        // No necesitamos esperar aquí, simplemente returnar
        throw new Error('redirect-in-progress');
      } else {
        try {
          // Intentar popup
          console.log('🪟 Intentando popup...');
          result = await signInWithPopup(auth, googleProvider);
        } catch (popupError: any) {
          console.log('❌ Error en popup:', popupError.code, popupError.message);
          
          // Detectar errores de CORS/popup más ampliamente
          const isCorsError = popupError.message?.includes('Cross-Origin') ||
                             popupError.message?.includes('cross-origin') ||
                             popupError.message?.includes('policy would block');
          
          const isPopupBlocked = popupError.code === 'auth/popup-blocked' ||
                               popupError.code === 'auth/popup-closed-by-user' ||
                               popupError.code === 'auth/cancelled-popup-request';
          
          if (isCorsError || isPopupBlocked) {
            console.log('🔄 Popup falló (CORS o bloqueado), usando redirect automáticamente...');
            const { signInWithRedirect } = await import('firebase/auth');
            await signInWithRedirect(auth, googleProvider);
            throw new Error('redirect-in-progress');
          }
          
          throw popupError;
        }
      }
      
      const firebaseUser = result?.user;
      
      // Buscar o crear usuario en Firestore
      let userData = await getUserByEmail(firebaseUser.email!);
      
      if (!userData) {
        userData = await createUser({
          name: firebaseUser.displayName || 'Usuario',
          email: firebaseUser.email!,
          photoUrl: firebaseUser.photoURL || ''
        });
      }
      
      setUser(userData);
      return userData;
    } catch (err: any) {
      console.error('Error en signInWithGoogle:', err);
      
      // Manejar errores específicos
      if (err.message === 'redirect-in-progress') {
        console.log('📱 Redirect en progreso, el usuario será autenticado automáticamente');
        // No es realmente un error, el redirect está en progreso
        setError(null);
        setIsLoading(false);
        return Promise.resolve({} as User); // Retornar dummy, el real vendrá por onAuthStateChanged
      } else if (err.code === 'auth/popup-blocked') {
        setError('popup-blocked');
        throw new Error('popup-blocked');
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError('Ventana de autenticación cerrada por el usuario');
        throw new Error('Ventana de autenticación cerrada por el usuario');
      }
      
      const errorMessage = err?.message || 'Error al iniciar sesión';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setError(null);
    } catch (err: any) {
      const errorMessage = err?.message || 'Error al cerrar sesión';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  return {
    user,
    isLoading,
    error,
    signInWithGoogle,
    signOut
  };
};