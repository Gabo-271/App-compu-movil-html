# Configuración de Firebase para VoteApp

Este archivo contiene las instrucciones para configurar Firebase en tu proyecto VoteApp.

## Pasos para configurar Firebase:

### 1. Crear un proyecto en Firebase Console
1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Haz clic en "Crear proyecto" o "Add project"
3. Asigna un nombre a tu proyecto (ej: "voteapp-2024")
4. Sigue los pasos del asistente

### 2. Habilitar Authentication con Google
1. En tu proyecto de Firebase, ve a Authentication > Sign-in method
2. Habilita "Google" como proveedor de autenticación
3. Configura el nombre del proyecto y email de soporte

### 3. Configurar Firestore Database
1. Ve a Firestore Database
2. Haz clic en "Crear base de datos"
3. Comienza en modo de prueba (puedes cambiar las reglas después)
4. Selecciona una región cercana

### 4. Obtener la configuración de Firebase
1. Ve a Configuración del proyecto (ícono de engranaje)
2. En la sección "Tus apps", haz clic en el ícono web (</>) 
3. Registra tu app web con un nombre
4. Copia la configuración de Firebase

### 5. Configurar las variables de entorno
1. Crea un archivo `.env.local` en la raíz de tu proyecto
2. Agrega las siguientes variables con los valores de tu configuración:

```env
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-project-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=tu-app-id
```

### 6. Actualizar el archivo de configuración
Abre `src/lib/firebase.ts` y reemplaza los valores de placeholder con:

```typescript
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
```

### 7. Configurar reglas de seguridad de Firestore
En Firestore Database > Rules, reemplaza las reglas por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permitir lectura de votaciones a usuarios autenticados
    match /votes/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                      request.auth.uid == resource.data.createdBy;
    }
    
    // Permitir lectura y escritura de usuarios para el propio usuario
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Permitir lectura y escritura de votos de usuarios para el propio usuario
    match /userVotes/{document} {
      allow read, write: if request.auth != null && 
                            request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && 
                       request.auth.uid == request.resource.data.userId;
    }
  }
}
```

### 8. Instalar dependencias
```bash
npm install
```

### 9. Ejecutar la aplicación
```bash
npm run dev
```

## Estructura de datos en Firestore:

### Colección `users`
```typescript
{
  id: string (auto-generado),
  name: string,
  email: string,
  photoUrl: string,
  createdAt: Timestamp,
  votes: string[] // IDs de votos emitidos
}
```

### Colección `votes`
```typescript
{
  id: string (auto-generado),
  title: string,
  description: string,
  shortDescription: string,
  status: 'active' | 'closed',
  startDate: Timestamp,
  endDate: Timestamp,
  category: string,
  options: VoteOption[],
  createdBy: string,
  createdAt: Timestamp,
  totalVotes: number,
  userVotes: { [userId: string]: optionId }
}
```

### Colección `userVotes`
```typescript
{
  id: string (auto-generado),
  userId: string,
  voteId: string,
  optionId: string,
  createdAt: Timestamp
}
```

## Notas importantes:

- Las variables de entorno deben comenzar con `VITE_` para que Vite las pueda acceder
- Nunca subas el archivo `.env.local` a tu repositorio
- Las reglas de Firestore están configuradas para que solo usuarios autenticados puedan acceder a los datos
- Los datos de ejemplo se crearán automáticamente la primera vez que ejecutes la aplicación

## Solución de problemas:

1. **Error de configuración**: Verifica que todas las variables de entorno estén correctamente configuradas
2. **Error de autenticación**: Asegúrate de haber habilitado Google Authentication en Firebase Console
3. **Error de permisos**: Verifica las reglas de Firestore Database

Para más información, consulta la [documentación oficial de Firebase](https://firebase.google.com/docs).