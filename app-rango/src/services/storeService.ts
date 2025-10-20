import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebaseConfig';
import { Store, CreateStoreData, UpdateStoreData } from '../types/shared';

// Coleção de lojas
const STORES_COLLECTION = 'stores';

/**
 * Buscar uma loja por ID
 */
export const getStoreById = async (storeId: string): Promise<Store | null> => {
  try {
    const storeDoc = await getDoc(doc(db, STORES_COLLECTION, storeId));
    
    if (storeDoc.exists()) {
      return { id: storeDoc.id, ...storeDoc.data() } as Store;
    }
    
    return null;
  } catch (error) {
    console.error('Erro ao buscar loja:', error);
    throw error;
  }
};

/**
 * Buscar todas as lojas ativas
 */
export const getActiveStores = async (): Promise<Store[]> => {
  try {
    const q = query(
      collection(db, STORES_COLLECTION),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const stores: Store[] = [];
    
    querySnapshot.forEach((doc) => {
      stores.push({ id: doc.id, ...doc.data() } as Store);
    });
    
    return stores;
  } catch (error) {
    console.error('Erro ao buscar lojas ativas:', error);
    throw error;
  }
};

/**
 * Buscar lojas por categoria
 * Aceita tanto o nome da categoria quanto o slug
 */
export const getStoresByCategory = async (category: string): Promise<Store[]> => {
  try {
    const q = query(
      collection(db, STORES_COLLECTION),
      where('category', '==', category),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const stores: Store[] = [];
    
    querySnapshot.forEach((doc) => {
      stores.push({ id: doc.id, ...doc.data() } as Store);
    });
    
    return stores;
  } catch (error) {
    console.error('Erro ao buscar lojas por categoria:', error);
    throw error;
  }
};

/**
 * Buscar lojas por slug de categoria (ex: 'restaurantes', 'mercado')
 * Suporta busca case-insensitive e parcial
 */
export const getStoresByCategorySlug = async (categorySlug: string): Promise<Store[]> => {
  try {
    console.log('🔍 Buscando lojas por categoria slug:', categorySlug);
    
    // Buscar todas as lojas ativas
    const q = query(
      collection(db, STORES_COLLECTION),
      where('isActive', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const stores: Store[] = [];
    
    // Normalizar slug de busca (remover acentos e converter para minúsculas)
    const normalizeString = (str: string) => {
      return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, ''); // Remove acentos
    };
    
    const normalizedSearchSlug = normalizeString(categorySlug);
    
    // Filtrar no cliente para suportar busca case-insensitive e sem acentos
    querySnapshot.forEach((doc) => {
      const storeData = doc.data();
      const storeCategory = normalizeString(storeData.category || '');
      
      // Aceitar correspondência exata ou parcial
      // Ex: 'restaurantes' encontra 'Restaurante', 'Restaurantes', etc.
      // 'farmacia' encontra 'Farmácia' (sem acento)
      if (
        storeCategory === normalizedSearchSlug ||
        storeCategory.includes(normalizedSearchSlug) ||
        normalizedSearchSlug.includes(storeCategory)
      ) {
        console.log(`  ✓ Loja encontrada: ${storeData.name} (categoria: ${storeData.category})`);
        stores.push({ id: doc.id, ...storeData } as Store);
      }
    });
    
    console.log(`✅ Total de lojas encontradas para "${categorySlug}":`, stores.length);
    return stores;
  } catch (error) {
    console.error('❌ Erro ao buscar lojas por slug de categoria:', error);
    return [];
  }
};

/**
 * Criar uma nova loja
 */
export const createStore = async (storeData: CreateStoreData): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, STORES_COLLECTION), {
      ...storeData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    return docRef.id;
  } catch (error) {
    console.error('Erro ao criar loja:', error);
    throw error;
  }
};

/**
 * Atualizar dados de uma loja
 */
export const updateStore = async (
  storeId: string, 
  updates: UpdateStoreData
): Promise<void> => {
  try {
    const storeRef = doc(db, STORES_COLLECTION, storeId);
    
    await updateDoc(storeRef, {
      ...updates,
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao atualizar loja:', error);
    throw error;
  }
};

/**
 * Deletar uma loja
 */
export const deleteStore = async (storeId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, STORES_COLLECTION, storeId));
  } catch (error) {
    console.error('Erro ao deletar loja:', error);
    throw error;
  }
};

/**
 * Ativar/Desativar loja
 */
export const toggleStoreStatus = async (
  storeId: string, 
  isActive: boolean
): Promise<void> => {
  try {
    await updateStore(storeId, { isActive });
  } catch (error) {
    console.error('Erro ao alterar status da loja:', error);
    throw error;
  }
};

/**
 * Verificar se a loja está aberta agora
 */
export const isStoreOpen = (store: Store): boolean => {
  const now = new Date();
  const dayOfWeek = now.toLocaleDateString('pt-BR', { weekday: 'long' }).toLowerCase();
  
  const schedule = store.operatingHours[dayOfWeek];
  
  if (!schedule || !schedule.isOpen) {
    return false;
  }
  
  const currentTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  
  return currentTime >= schedule.open && currentTime <= schedule.close;
};

/**
 * Listener em tempo real para uma loja específica
 */
export const subscribeToStore = (
  storeId: string,
  callback: (store: Store | null) => void
): Unsubscribe => {
  const storeRef = doc(db, STORES_COLLECTION, storeId);
  
  return onSnapshot(storeRef, (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as Store);
    } else {
      callback(null);
    }
  }, (error) => {
    console.error('Erro no listener da loja:', error);
    callback(null);
  });
};

/**
 * Listener em tempo real para lojas ativas
 */
export const subscribeToActiveStores = (
  callback: (stores: Store[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, STORES_COLLECTION),
    where('isActive', '==', true)
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const stores: Store[] = [];
    querySnapshot.forEach((doc) => {
      stores.push({ id: doc.id, ...doc.data() } as Store);
    });
    callback(stores);
  }, (error) => {
    console.error('Erro no listener de lojas:', error);
    callback([]);
  });
}; 