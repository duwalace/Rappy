// src/services/bannerService.ts
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  Timestamp 
} from 'firebase/firestore';
import { db } from './firebaseConfig';

export interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  videoUrl?: string;
  link?: string;
  linkType?: 'store' | 'category' | 'product' | 'external' | 'none';
  linkTarget?: string; // storeId, categoryId, productId ou URL
  location?: 'home' | 'category' | 'both'; // Onde o banner aparece
  backgroundColor?: string;
  isActive: boolean;
  order: number;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const COLLECTION_NAME = 'banners';

/**
 * Buscar todos os banners ativos (query única, sem listener)
 */
export const getActiveBanners = async (): Promise<Banner[]> => {
  try {
    console.log('🎨 Buscando banners ativos...');
    
    const now = Timestamp.now();
    const bannersRef = collection(db, COLLECTION_NAME);
    
    // Query simples: apenas banners ativos (sem orderBy para não precisar de índice)
    const q = query(
      bannersRef,
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    const banners: Banner[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Validar datas manualmente (sem usar where com datas)
      const startDate = data.startDate?.toDate();
      const endDate = data.endDate?.toDate();
      const nowDate = now.toDate();
      
      // Se tem startDate, verificar se já começou
      if (startDate && startDate > nowDate) {
        return; // Ainda não começou
      }
      
      // Se tem endDate, verificar se não terminou
      if (endDate && endDate < nowDate) {
        return; // Já terminou
      }
      
      banners.push({
        id: doc.id,
        title: data.title || '',
        imageUrl: data.imageUrl || '',
        videoUrl: data.videoUrl,
        link: data.link,
        linkType: data.linkType || 'none',
        linkTarget: data.linkTarget,
        location: data.location || 'home',
        backgroundColor: data.backgroundColor,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
        startDate: startDate,
        endDate: endDate,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });
    
    // Ordenar no código (não no Firestore)
    banners.sort((a, b) => a.order - b.order);
    
    console.log(`✅ ${banners.length} banners ativos encontrados`);
    return banners;
    
  } catch (error) {
    console.error('❌ Erro ao buscar banners:', error);
    return [];
  }
};

/**
 * Listener em tempo real para banners ativos
 */
export const subscribeToActiveBanners = (
  callback: (banners: Banner[]) => void
): (() => void) => {
  try {
    console.log('🎨 Inscrevendo-se em banners ativos (tempo real)...');
    
    const bannersRef = collection(db, COLLECTION_NAME);
    
    // Query simples sem orderBy para não precisar de índice composto
    const q = query(
      bannersRef,
      where('isActive', '==', true)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const now = new Date();
        const banners: Banner[] = [];
        
        snapshot.forEach((doc) => {
          const data = doc.data();
          
          // Validar datas manualmente
          const startDate = data.startDate?.toDate();
          const endDate = data.endDate?.toDate();
          
          // Se tem startDate, verificar se já começou
          if (startDate && startDate > now) {
            return; // Ainda não começou
          }
          
          // Se tem endDate, verificar se não terminou
          if (endDate && endDate < now) {
            return; // Já terminou
          }
          
          banners.push({
            id: doc.id,
            title: data.title || '',
            imageUrl: data.imageUrl || '',
            videoUrl: data.videoUrl,
            link: data.link,
            linkType: data.linkType || 'none',
            linkTarget: data.linkTarget,
            location: data.location || 'home',
            backgroundColor: data.backgroundColor,
            isActive: data.isActive ?? true,
            order: data.order ?? 0,
            startDate: startDate,
            endDate: endDate,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          });
        });
        
        // Ordenar no código (não no Firestore) - evita necessidade de índice
        banners.sort((a, b) => a.order - b.order);
        
        console.log(`✅ Banners atualizados (tempo real): ${banners.length}`);
        callback(banners);
      },
      (error) => {
        console.error('❌ Erro no listener de banners:', error);
        callback([]);
      }
    );
    
    return unsubscribe;
    
  } catch (error) {
    console.error('❌ Erro ao criar listener de banners:', error);
    return () => {};
  }
};

/**
 * Buscar banners por localização (home, category, both)
 */
export const getBannersByLocation = async (location: 'home' | 'category'): Promise<Banner[]> => {
  try {
    console.log(`🎨 Buscando banners para: ${location}`);
    
    const now = Timestamp.now();
    const bannersRef = collection(db, COLLECTION_NAME);
    
    const q = query(
      bannersRef,
      where('isActive', '==', true)
    );
    
    const snapshot = await getDocs(q);
    
    const banners: Banner[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      
      // Validar datas
      const startDate = data.startDate?.toDate();
      const endDate = data.endDate?.toDate();
      const nowDate = now.toDate();
      
      if (startDate && startDate > nowDate) return;
      if (endDate && endDate < nowDate) return;
      
      // Filtrar por localização (home, category, ou both)
      const bannerLocation = data.location || 'home';
      if (bannerLocation !== location && bannerLocation !== 'both') {
        return; // Pular este banner
      }
      
      banners.push({
        id: doc.id,
        title: data.title || '',
        imageUrl: data.imageUrl || '',
        videoUrl: data.videoUrl,
        link: data.link,
        linkType: data.linkType || 'none',
        linkTarget: data.linkTarget,
        location: bannerLocation,
        backgroundColor: data.backgroundColor,
        isActive: data.isActive ?? true,
        order: data.order ?? 0,
        startDate: startDate,
        endDate: endDate,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      });
    });
    
    banners.sort((a, b) => a.order - b.order);
    
    console.log(`✅ ${banners.length} banners encontrados para ${location}`);
    return banners;
    
  } catch (error) {
    console.error('❌ Erro ao buscar banners por localização:', error);
    return [];
  }
};

