import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  getDocs, 
  getDoc,
  query, 
  where, 
  orderBy,
  increment,
  arrayUnion,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebase';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl: string;
  createdAt: Date;
  votes?: string[]; // IDs de votos emitidos
}

export interface Vote {
  id: string;
  title: string;
  description: string;
  shortDescription: string;
  status: 'active' | 'closed';
  startDate: Date;
  endDate: Date;
  category: string;
  options: VoteOption[];
  createdBy: string;
  createdAt: Date;
  totalVotes: number;
  userVotes?: { [userId: string]: string }; // userId -> optionId
}

export interface VoteOption {
  id: string;
  text: string;
  votes: number;
}

export interface UserVote {
  id?: string;
  userId: string;
  voteId: string;
  optionId: string;
  createdAt: Date;
}

// Collections
const USERS_COLLECTION = 'users';
const VOTES_COLLECTION = 'votes';
const USER_VOTES_COLLECTION = 'userVotes';

// User operations
export const createUser = async (user: Omit<User, 'id' | 'createdAt' | 'votes'>): Promise<User> => {
  try {
    const userDoc = {
      ...user,
      createdAt: Timestamp.fromDate(new Date()),
      votes: []
    };
    
    const docRef = await addDoc(collection(db, USERS_COLLECTION), userDoc);
    
    return {
      id: docRef.id,
      ...user,
      createdAt: new Date(),
      votes: []
    };
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  try {
    const q = query(collection(db, USERS_COLLECTION), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    const doc = querySnapshot.docs[0];
    const data = doc.data();
    
    return {
      id: doc.id,
      name: data.name,
      email: data.email,
      photoUrl: data.photoUrl,
      createdAt: data.createdAt.toDate(),
      votes: data.votes || []
    };
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

// Vote operations
export const createVote = async (vote: Omit<Vote, 'id' | 'createdAt' | 'totalVotes' | 'userVotes'>): Promise<Vote> => {
  try {
    const voteDoc = {
      ...vote,
      startDate: Timestamp.fromDate(vote.startDate),
      endDate: Timestamp.fromDate(vote.endDate),
      createdAt: Timestamp.fromDate(new Date()),
      totalVotes: 0,
      userVotes: {}
    };
    
    const docRef = await addDoc(collection(db, VOTES_COLLECTION), voteDoc);
    
    return {
      id: docRef.id,
      ...vote,
      createdAt: new Date(),
      totalVotes: 0,
      userVotes: {}
    };
  } catch (error) {
    console.error('Error creating vote:', error);
    throw error;
  }
};

export const getVotes = async (): Promise<Vote[]> => {
  try {
    const q = query(collection(db, VOTES_COLLECTION), orderBy('createdAt', 'desc'));
    const querySnapshot = await getDocs(q);
    
    const votes: Vote[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      votes.push({
        id: doc.id,
        title: data.title,
        description: data.description,
        shortDescription: data.shortDescription,
        status: data.status,
        startDate: data.startDate.toDate(),
        endDate: data.endDate.toDate(),
        category: data.category,
        options: data.options,
        createdBy: data.createdBy,
        createdAt: data.createdAt.toDate(),
        totalVotes: data.totalVotes || 0,
        userVotes: data.userVotes || {}
      });
    });
    
    return votes;
  } catch (error) {
    console.error('Error getting votes:', error);
    throw error;
  }
};

export const getVoteById = async (voteId: string): Promise<Vote | null> => {
  try {
    const docRef = doc(db, VOTES_COLLECTION, voteId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return null;
    }
    
    const data = docSnap.data();
    return {
      id: docSnap.id,
      title: data.title,
      description: data.description,
      shortDescription: data.shortDescription,
      status: data.status,
      startDate: data.startDate.toDate(),
      endDate: data.endDate.toDate(),
      category: data.category,
      options: data.options,
      createdBy: data.createdBy,
      createdAt: data.createdAt.toDate(),
      totalVotes: data.totalVotes || 0,
      userVotes: data.userVotes || {}
    };
  } catch (error) {
    console.error('Error getting vote by ID:', error);
    throw error;
  }
};

// Voting operations
export const submitVote = async (userId: string, voteId: string, optionId: string): Promise<void> => {
  try {
    // Verificar si el usuario ya votó en esta votación
    const existingVoteQuery = query(
      collection(db, USER_VOTES_COLLECTION),
      where('userId', '==', userId),
      where('voteId', '==', voteId)
    );
    const existingVotes = await getDocs(existingVoteQuery);
    
    if (!existingVotes.empty) {
      throw new Error('El usuario ya ha votado en esta votación');
    }
    
    // Crear registro de voto de usuario
    const userVoteDoc = {
      userId,
      voteId,
      optionId,
      createdAt: Timestamp.fromDate(new Date())
    };
    
    await addDoc(collection(db, USER_VOTES_COLLECTION), userVoteDoc);
    
    // Actualizar el conteo de votos en la votación
    const voteRef = doc(db, VOTES_COLLECTION, voteId);
    const voteDoc = await getDoc(voteRef);
    
    if (voteDoc.exists()) {
      const voteData = voteDoc.data();
      const options = voteData.options.map((option: VoteOption) => {
        if (option.id === optionId) {
          return { ...option, votes: option.votes + 1 };
        }
        return option;
      });
      
      const userVotes = { ...voteData.userVotes };
      userVotes[userId] = optionId;
      
      await updateDoc(voteRef, {
        options,
        userVotes,
        totalVotes: increment(1)
      });
      
      // Actualizar la lista de votos del usuario
      const userQuery = query(collection(db, USERS_COLLECTION), where('id', '==', userId));
      const userSnapshot = await getDocs(userQuery);
      
      if (!userSnapshot.empty) {
        const userDoc = userSnapshot.docs[0];
        await updateDoc(userDoc.ref, {
          votes: arrayUnion(voteId)
        });
      }
    }
  } catch (error) {
    console.error('Error submitting vote:', error);
    throw error;
  }
};

export const getUserVotes = async (userId: string): Promise<UserVote[]> => {
  try {
    const q = query(
      collection(db, USER_VOTES_COLLECTION),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    const userVotes: UserVote[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      userVotes.push({
        id: doc.id,
        userId: data.userId,
        voteId: data.voteId,
        optionId: data.optionId,
        createdAt: data.createdAt.toDate()
      });
    });
    
    return userVotes;
  } catch (error) {
    console.error('Error getting user votes:', error);
    throw error;
  }
};

// Utility functions
export const initializeSampleData = async (): Promise<void> => {
  try {
    // Verificar si ya existen datos
    const votesSnapshot = await getDocs(collection(db, VOTES_COLLECTION));
    if (!votesSnapshot.empty) {
      console.log('Los datos de ejemplo ya existen');
      return;
    }
    
    // Crear votaciones de ejemplo
    const sampleVotes = [
      {
        title: 'Presupuesto Municipal 2024',
        description: 'Votación para decidir la distribución del presupuesto municipal del próximo año. Se evaluarán propuestas para mejoras en infraestructura, educación, salud y servicios públicos.',
        shortDescription: 'Distribución del presupuesto municipal para el próximo año',
        status: 'active' as const,
        startDate: new Date('2024-01-15'),
        endDate: new Date('2024-02-15'),
        category: 'Gobierno',
        options: [
          { id: '1a', text: 'Priorizar infraestructura vial', votes: 45 },
          { id: '1b', text: 'Invertir en educación pública', votes: 62 },
          { id: '1c', text: 'Mejorar servicios de salud', votes: 38 },
          { id: '1d', text: 'Fortalecer seguridad ciudadana', votes: 29 }
        ],
        createdBy: 'system'
      },
      {
        title: 'Nuevo Parque Recreativo',
        description: 'Propuesta para la construcción de un nuevo parque recreativo en el sector norte de la ciudad. Se busca crear un espacio familiar con áreas verdes, zonas deportivas y recreación infantil.',
        shortDescription: 'Construcción de parque recreativo en sector norte',
        status: 'active' as const,
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-30'),
        category: 'Desarrollo',
        options: [
          { id: '2a', text: 'Aprobar construcción del parque', votes: 78 },
          { id: '2b', text: 'Rechazar la propuesta', votes: 22 }
        ],
        createdBy: 'system'
      },
      {
        title: 'Sistema de Educación Digital',
        description: 'Implementación de plataforma digital para la educación pública que incluya herramientas interactivas, contenido multimedia y seguimiento personalizado del progreso estudiantil.',
        shortDescription: 'Plataforma digital para educación pública',
        status: 'active' as const,
        startDate: new Date('2024-01-20'),
        endDate: new Date('2024-02-20'),
        category: 'Educación',
        options: [
          { id: '4a', text: 'Implementar plataforma completa', votes: 89 },
          { id: '4b', text: 'Fase piloto en 5 escuelas', votes: 112 },
          { id: '4c', text: 'Posponer implementación', votes: 34 }
        ],
        createdBy: 'system'
      }
    ];
    
    for (const vote of sampleVotes) {
      await createVote(vote);
    }
    
    console.log('Datos de ejemplo creados exitosamente');
  } catch (error) {
    console.error('Error inicializando datos de ejemplo:', error);
  }
};