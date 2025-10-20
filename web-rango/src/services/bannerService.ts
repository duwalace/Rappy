import { 
  collection, 
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  deleteField,
  query, 
  where, 
  orderBy,
  Timestamp,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface Banner {
  id?: string;
  title: string;
  imageUrl: string;
  videoUrl?: string;
  location?: 'home' | 'category' | 'both'; // Onde o banner aparece
  link?: string;
  linkType: 'store' | 'category' | 'product' | 'external' | 'none';
  linkTarget?: string; // storeId, categoryId, productId ou URL
  backgroundColor?: string;
  isActive: boolean;
  order: number;
  startDate?: Date;
  endDate?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

const COLLECTION_NAME = 'banners';

/**
 * Criar novo banner
 */
export const createBanner = async (bannerData: Omit<Banner, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  try {
    console.log('📝 Criando banner:', bannerData.title);
    
    const bannersRef = collection(db, COLLECTION_NAME);
    
    // Construir dados apenas com campos definidos (sem undefined)
    const docData: any = {
      title: bannerData.title,
      imageUrl: bannerData.imageUrl,
      location: bannerData.location || 'home',
      linkType: bannerData.linkType,
      backgroundColor: bannerData.backgroundColor || '#EA1D2C',
      isActive: bannerData.isActive,
      order: bannerData.order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    // Adicionar campos opcionais apenas se tiverem valor
    if (bannerData.videoUrl) docData.videoUrl = bannerData.videoUrl;
    if (bannerData.link) docData.link = bannerData.link;
    if (bannerData.linkTarget) docData.linkTarget = bannerData.linkTarget;
    if (bannerData.startDate) docData.startDate = Timestamp.fromDate(bannerData.startDate);
    if (bannerData.endDate) docData.endDate = Timestamp.fromDate(bannerData.endDate);
    
    const docRef = await addDoc(bannersRef, docData);
    
    console.log('✅ Banner criado com ID:', docRef.id);
    return docRef.id;
    
  } catch (error) {
    console.error('❌ Erro ao criar banner:', error);
    throw error;
  }
};

/**
 * Buscar todos os banners (para gerenciamento)
 */
export const getAllBanners = async (): Promise<Banner[]> => {
  try {
    console.log('📋 Buscando todos os banners...');
    
    const bannersRef = collection(db, COLLECTION_NAME);
    const q = query(bannersRef, orderBy('order', 'asc'));
    
    const snapshot = await getDocs(q);
    
    const banners: Banner[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || '',
        imageUrl: data.imageUrl || '',
        videoUrl: data.videoUrl,
        link: data.link,
        linkType: data.linkType || 'none',
        linkTarget: data.linkTarget,
        backgroundColor: data.backgroundColor,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
        startDate: data.startDate?.toDate(),
        endDate: data.endDate?.toDate(),
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
      };
    });
    
    console.log(`✅ ${banners.length} banners encontrados`);
    return banners;
    
  } catch (error) {
    console.error('❌ Erro ao buscar banners:', error);
    throw error;
  }
};

/**
 * Buscar banner por ID
 */
export const getBannerById = async (bannerId: string): Promise<Banner | null> => {
  try {
    const bannerRef = doc(db, COLLECTION_NAME, bannerId);
    const bannerDoc = await getDoc(bannerRef);
    
    if (!bannerDoc.exists()) {
      return null;
    }
    
    const data = bannerDoc.data();
    return {
      id: bannerDoc.id,
      title: data.title || '',
      imageUrl: data.imageUrl || '',
      videoUrl: data.videoUrl,
      link: data.link,
      linkType: data.linkType || 'none',
      linkTarget: data.linkTarget,
      backgroundColor: data.backgroundColor,
      isActive: data.isActive ?? true,
      order: data.order ?? 0,
      startDate: data.startDate?.toDate(),
      endDate: data.endDate?.toDate(),
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate(),
    };
    
  } catch (error) {
    console.error('❌ Erro ao buscar banner:', error);
    throw error;
  }
};

/**
 * Atualizar banner
 */
export const updateBanner = async (
  bannerId: string, 
  updates: Partial<Banner>
): Promise<void> => {
  try {
    console.log('📝 Atualizando banner:', bannerId);
    
    const bannerRef = doc(db, COLLECTION_NAME, bannerId);
    
    // Construir objeto de atualização sem undefined
    const updateData: any = {
      updatedAt: serverTimestamp(),
    };
    
    // Adicionar apenas campos que têm valor (não undefined)
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.imageUrl !== undefined) updateData.imageUrl = updates.imageUrl;
    if (updates.videoUrl !== undefined) {
      updateData.videoUrl = updates.videoUrl || deleteField(); // Remove se vazio
    }
    if (updates.link !== undefined) {
      updateData.link = updates.link || deleteField(); // Remove se vazio
    }
    if (updates.linkType !== undefined) updateData.linkType = updates.linkType;
    if (updates.linkTarget !== undefined) {
      updateData.linkTarget = updates.linkTarget || deleteField(); // Remove se vazio
    }
    if (updates.backgroundColor !== undefined) updateData.backgroundColor = updates.backgroundColor;
    if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
    if (updates.order !== undefined) updateData.order = updates.order;
    
    // Converter datas se necessário
    if (updates.startDate !== undefined) {
      updateData.startDate = updates.startDate ? Timestamp.fromDate(updates.startDate) : deleteField();
    }
    if (updates.endDate !== undefined) {
      updateData.endDate = updates.endDate ? Timestamp.fromDate(updates.endDate) : deleteField();
    }
    
    await updateDoc(bannerRef, updateData);
    
    console.log('✅ Banner atualizado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao atualizar banner:', error);
    throw error;
  }
};

/**
 * Deletar banner
 */
export const deleteBanner = async (bannerId: string): Promise<void> => {
  try {
    console.log('🗑️ Deletando banner:', bannerId);
    
    const bannerRef = doc(db, COLLECTION_NAME, bannerId);
    await deleteDoc(bannerRef);
    
    console.log('✅ Banner deletado com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao deletar banner:', error);
    throw error;
  }
};

/**
 * Ativar/desativar banner
 */
export const toggleBannerStatus = async (bannerId: string, isActive: boolean): Promise<void> => {
  try {
    const bannerRef = doc(db, COLLECTION_NAME, bannerId);
    await updateDoc(bannerRef, {
      isActive,
      updatedAt: serverTimestamp(),
    });
    
    console.log(`✅ Banner ${isActive ? 'ativado' : 'desativado'} com sucesso`);
    
  } catch (error) {
    console.error('❌ Erro ao alterar status do banner:', error);
    throw error;
  }
};

/**
 * Reordenar banners
 */
export const reorderBanners = async (bannerIds: string[]): Promise<void> => {
  try {
    console.log('🔄 Reordenando banners...');
    
    const promises = bannerIds.map((id, index) => {
      const bannerRef = doc(db, COLLECTION_NAME, id);
      return updateDoc(bannerRef, {
        order: index,
        updatedAt: serverTimestamp(),
      });
    });
    
    await Promise.all(promises);
    
    console.log('✅ Banners reordenados com sucesso');
    
  } catch (error) {
    console.error('❌ Erro ao reordenar banners:', error);
    throw error;
  }
};

