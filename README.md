
# VoteApp Mobile Design

Una aplicación móvil moderna para votaciones digitales construida con React, TypeScript, Vite y Firebase.

## Características

- ✅ **Autenticación con Google** usando Firebase Auth
- ✅ **Base de datos en tiempo real** con Firestore
- ✅ **Interfaz moderna** con Tailwind CSS y componentes personalizados
- ✅ **Votaciones en tiempo real** con actualizaciones automáticas
- ✅ **Diseño responsive** optimizado para móviles
- ✅ **Modo oscuro/claro** con persistencia
- ✅ **Filtrado y búsqueda** de votaciones
- ✅ **Perfil de usuario** con historial de votos
- ✅ **Seguridad** con reglas de Firestore

## Tecnologías utilizadas

- **Frontend**: React 18, TypeScript, Vite
- **Estilos**: Tailwind CSS, Radix UI
- **Backend**: Firebase (Auth + Firestore)
- **Iconos**: Lucide React
- **Animaciones**: Framer Motion

## Instalación

### 1. Clonar el repositorio
```bash
git clone <url-del-repo>
cd pagina-compu-movil
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Firebase
Sigue las instrucciones detalladas en [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) para:
- Crear un proyecto en Firebase
- Configurar Authentication con Google
- Configurar Firestore Database
- Obtener las credenciales de tu proyecto

### 4. Configurar variables de entorno
```bash
cp .env.example .env.local
```

Luego edita `.env.local` con tus credenciales de Firebase:
```env
VITE_FIREBASE_API_KEY=tu-api-key
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-project-id
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=tu-app-id
```

### 5. Ejecutar la aplicación
```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## Scripts disponibles

- `npm run dev` - Ejecuta la aplicación en modo desarrollo
- `npm run build` - Construye la aplicación para producción
- `npm run preview` - Vista previa de la build de producción

## Estructura del proyecto

```
src/
├── components/           # Componentes React
│   ├── ui/              # Componentes de UI reutilizables
│   ├── figma/           # Componentes específicos del diseño
│   ├── VoteAppContext.tsx    # Context principal de la app
│   ├── LoginScreen.tsx       # Pantalla de inicio de sesión
│   ├── VotingListScreen.tsx  # Lista de votaciones
│   ├── VotingDetailScreen.tsx # Detalle de votación
│   ├── UserProfileScreen.tsx  # Perfil de usuario
│   └── ...
├── hooks/               # Custom hooks
│   └── useFirebaseAuth.ts    # Hook para autenticación
├── lib/                 # Utilidades y configuración
│   ├── firebase.ts           # Configuración de Firebase
│   └── firestore.ts          # Operaciones de Firestore
├── styles/              # Archivos de estilos
│   └── globals.css           # Estilos globales
└── ...
```

## Funcionalidades principales

### 🔐 Autenticación
- Inicio de sesión con Google
- Gestión automática del estado de autenticación
- Protección de rutas

### 🗳️ Sistema de votaciones
- Crear y gestionar votaciones
- Votar en tiempo real
- Ver resultados actualizados
- Filtrar por categorías
- Buscar votaciones

### 👤 Perfil de usuario
- Ver historial de votos
- Estadísticas personales
- Gestión de configuraciones

### 📱 Diseño móvil
- Interfaz optimizada para dispositivos móviles
- Navegación intuitiva
- Componentes responsive

## Configuración de Firebase

Para configurar Firebase correctamente, consulta el archivo [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) que incluye:

1. Creación del proyecto Firebase
2. Configuración de Authentication
3. Configuración de Firestore
4. Reglas de seguridad
5. Variables de entorno

## Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## Diseño original

El diseño original está disponible en [Figma](https://www.figma.com/design/sBpjIJB4vl94s5MbEdw3ud/VoteApp-Mobile-Design).

## Soporte

Si tienes alguna pregunta o problema, abre un issue en el repositorio.  