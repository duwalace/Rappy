/**
 * categoryService.ts
 * Gerencia categorias de lojas (store_types) cadastradas pelo super admin
 */

import { collection, doc, getDoc, getDocs, query, where, orderBy, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface StoreType {
  id: string;
  name: string;
  icon: string;
  slug: string; // Para usar como filtro (ex: 'restaurantes', 'mercado')
  description?: string;
  imageUrl?: string; // URL da imagem da categoria
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

// Mantendo alias para compatibilidade
export type Category = StoreType;

const STORE_TYPES_COLLECTION = 'store_types';

/**
 * Buscar todas as categorias ativas (store_types)
 */
export const getActiveCategories = async (): Promise<Category[]> => {
  try {
    console.log('🔍 Buscando store_types ativos do Firestore...');
    
    const q = query(
      collection(db, STORE_TYPES_COLLECTION),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const categories: Category[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      categories.push({ 
        id: doc.id, 
        name: data.name,
        icon: data.icon || '🏪',
        slug: data.slug,
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        isActive: data.isActive,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as Category);
    });

    // Ordenar alfabeticamente por nome
    categories.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    console.log('✅ Store types carregados:', categories.length);
    return categories;
  } catch (error) {
    console.error('❌ Erro ao buscar store_types:', error);
    // Retornar categorias padrão se houver erro
    return getDefaultCategories();
  }
};

/**
 * Listener em tempo real para categorias ativas (store_types)
 * Atualiza automaticamente quando o super admin criar/editar categorias
 */
export const subscribeToActiveCategories = (
  callback: (categories: Category[]) => void
): Unsubscribe => {
  console.log('🔍 Inscrevendo-se em store_types ativos (tempo real)...');
  
  const q = query(
    collection(db, STORE_TYPES_COLLECTION),
    where('isActive', '==', true)
  );

  return onSnapshot(
    q,
    (querySnapshot) => {
      const categories: Category[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        categories.push({
          id: doc.id,
          name: data.name,
          icon: data.icon || '🏪',
          slug: data.slug,
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          isActive: data.isActive,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        } as Category);
      });

      // Ordenar alfabeticamente por nome
      categories.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

      console.log('✅ Store types atualizados em tempo real:', categories.length);
      callback(categories);
    },
    (error) => {
      console.error('❌ Erro no listener de store_types:', error);
      // Em caso de erro, retornar categorias padrão
      callback(getDefaultCategories());
    }
  );
};

/**
 * Buscar uma categoria por ID
 */
export const getCategoryById = async (id: string): Promise<Category | null> => {
  try {
    const docRef = doc(db, STORE_TYPES_COLLECTION, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return { 
        id: docSnap.id, 
        name: data.name,
        icon: data.icon || '🏪',
        slug: data.slug,
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        isActive: data.isActive,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as Category;
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar categoria:', error);
    return null;
  }
};

/**
 * Buscar categoria por slug
 */
export const getCategoryBySlug = async (slug: string): Promise<Category | null> => {
  try {
    const q = query(
      collection(db, STORE_TYPES_COLLECTION),
      where('slug', '==', slug.toLowerCase()),
      where('isActive', '==', true)
    );

    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const docData = querySnapshot.docs[0];
      const data = docData.data();
      return { 
        id: docData.id, 
        name: data.name,
        icon: data.icon || '🏪',
        slug: data.slug,
        description: data.description || '',
        imageUrl: data.imageUrl || '',
        isActive: data.isActive,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt
      } as Category;
    }

    return null;
  } catch (error) {
    console.error('Erro ao buscar categoria por slug:', error);
    return null;
  }
};

/**
 * Categorias padrão (fallback quando Firebase não está disponível)
 */
export const getDefaultCategories = (): Category[] => {
  return [
    {
      id: 'default-1',
      name: 'Restaurantes',
      icon: '🍽️',
      slug: 'restaurantes',
      description: 'Restaurantes e lanchonetes',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'default-2',
      name: 'Mercado',
      icon: '🛒',
      slug: 'mercado',
      description: 'Supermercados e hortifruti',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'default-3',
      name: 'Bebidas',
      icon: '🍺',
      slug: 'bebidas',
      description: 'Bebidas e distribuidoras',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'default-4',
      name: 'Farmácia',
      icon: '💊',
      slug: 'farmacia',
      description: 'Farmácias e drogarias',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'default-5',
      name: 'Pet Shop',
      icon: '🐾',
      slug: 'pet-shop',
      description: 'Produtos para pets',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'default-6',
      name: 'Shopping',
      icon: '🛍️',
      slug: 'shopping',
      description: 'Lojas e comércio',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
};

/**
 * Mapear ID ou nome de categoria para slug
 * Aceita tanto ID quanto nome e converte para slug
 */
export const mapCategoryIdToSlug = (categoryIdOrName: string): string => {
  // Se já é um slug (lowercase com hífen), retorna ele mesmo
  if (categoryIdOrName.includes('-') || categoryIdOrName === categoryIdOrName.toLowerCase()) {
    return categoryIdOrName.toLowerCase();
  }
  
  // Converter nome para slug
  return categoryIdOrName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
    .replace(/^-+|-+$/g, ''); // Remove hífens no início e fim
};

/**
 * Mapear slug para nome da categoria
 * Busca no banco ou retorna formatado
 */
export const getCategoryNameBySlug = async (slug: string): Promise<string> => {
  try {
    const category = await getCategoryBySlug(slug);
    return category?.name || slug.charAt(0).toUpperCase() + slug.slice(1);
  } catch (error) {
    return slug.charAt(0).toUpperCase() + slug.slice(1);
  }
};

