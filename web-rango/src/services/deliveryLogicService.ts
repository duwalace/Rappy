/**
 * ⚡ ALTERNATIVA ÀS CLOUD FUNCTIONS (SEM PLANO BLAZE)
 * 
 * Este serviço replica a lógica das Cloud Functions no frontend.
 * Funciona 100% no plano GRATUITO do Firebase (Spark).
 * 
 * DIFERENÇAS:
 * - Cloud Functions: Rodam automaticamente no servidor
 * - Este serviço: Executado manualmente pelo dashboard/app
 * 
 * QUANDO USAR:
 * - Quando dono da loja confirma o pedido → createDeliveryOffer()
 * - Quando entregador aceita oferta → assignDeliveryPartner()
 * - Quando entrega é completada → completeDelivery()
 */

import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  getDocs,
  Timestamp,
  GeoPoint,
  getDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ==========================================
// TYPES
// ==========================================

interface Location {
  latitude: number;
  longitude: number;
}

interface DeliveryOffer {
  order_id: string;
  store_id: string;
  store_name: string;
  pickup_location: GeoPoint;
  delivery_location: GeoPoint;
  distance_km: number;
  earning_amount: number;
  status: 'open' | 'accepted' | 'expired' | 'cancelled';
  visible_to_partners: string[];
  created_at: Timestamp;
  expires_at: Timestamp;
  attempt_number: number;
  search_radius_km: number;
}

// ==========================================
// CÁLCULOS DE DISTÂNCIA (Haversine)
// ==========================================

/**
 * Calcula distância entre dois pontos em KM
 */
const calculateDistance = (point1: Location, point2: Location): number => {
  const R = 6371; // Raio da Terra em km
  const dLat = toRad(point2.latitude - point1.latitude);
  const dLon = toRad(point2.longitude - point1.longitude);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(point1.latitude)) *
    Math.cos(toRad(point2.latitude)) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const toRad = (degrees: number): number => {
  return (degrees * Math.PI) / 180;
};

// ==========================================
// CÁLCULOS DE VALORES
// ==========================================

/**
 * Calcula taxa de entrega baseada na distância
 */
const calculateDeliveryFee = (distanceKm: number): number => {
  const baseRate = 1.50; // R$ 1,50 por km
  const minFee = 5.00; // Fee mínimo
  
  const fee = distanceKm * baseRate;
  return Math.max(fee, minFee);
};

/**
 * Calcula ganho do entregador (80% da taxa)
 */
const calculatePartnerEarning = (deliveryFee: number): number => {
  return deliveryFee * 0.8; // 80% para o entregador
};

// ==========================================
// BUSCAR ENTREGADORES PRÓXIMOS
// ==========================================

/**
 * Busca entregadores disponíveis em raio específico
 */
const findNearbyPartners = async (
  storeLocation: Location,
  radiusKm: number
): Promise<string[]> => {
  try {
    console.log(`🔍 Buscando entregadores em raio de ${radiusKm}km...`);
    
    // Buscar entregadores online e disponíveis
    const partnersRef = collection(db, 'delivery_partners');
    const q = query(
      partnersRef,
      where('status', '==', 'active'),
      where('operational_status', '==', 'online_idle')
    );
    
    const snapshot = await getDocs(q);
    const nearbyPartners: string[] = [];
    
    // Filtrar por distância
    snapshot.forEach((docSnap) => {
      const partner = docSnap.data();
      
      if (partner.current_location) {
        const distance = calculateDistance(storeLocation, {
          latitude: partner.current_location.latitude,
          longitude: partner.current_location.longitude
        });
        
        console.log(`📍 Entregador ${docSnap.id}: ${distance.toFixed(2)}km`);
        
        if (distance <= radiusKm) {
          nearbyPartners.push(docSnap.id);
        }
      }
    });
    
    console.log(`✅ ${nearbyPartners.length} entregadores encontrados`);
    return nearbyPartners;
    
  } catch (error) {
    console.error('❌ Erro ao buscar entregadores:', error);
    return [];
  }
};

// ==========================================
// FUNÇÃO 1: CRIAR OFERTA DE ENTREGA
// ==========================================

/**
 * Cria oferta de entrega para um pedido
 * 
 * QUANDO CHAMAR:
 * - Quando dono da loja confirma o pedido no dashboard
 * - Substitui: functions/src/delivery/createDeliveryOffer.ts
 * 
 * EXEMPLO:
 * await createDeliveryOffer(orderId, storeId);
 */
export const createDeliveryOffer = async (
  orderId: string,
  storeId: string
): Promise<{ success: boolean; offerId?: string; error?: string }> => {
  
  try {
    console.log(`📦 Criando oferta de entrega para pedido: ${orderId}`);
    
    // 1. Buscar dados do pedido
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Pedido não encontrado');
    }
    
    const order = orderSnap.data();
    
    // 2. Verificar se pedido precisa de entrega
    if (!order.delivery || order.delivery.status !== 'waiting_partner') {
      console.log('⚠️ Pedido não precisa de entregador no momento');
      return { success: false, error: 'Pedido não precisa de entregador' };
    }
    
    // 3. Extrair localizações
    const storeLocation: Location = {
      latitude: order.delivery.pickup_location.latitude,
      longitude: order.delivery.pickup_location.longitude
    };
    
    const customerLocation: Location = {
      latitude: order.delivery.delivery_location.latitude,
      longitude: order.delivery.delivery_location.longitude
    };
    
    // 4. Calcular distância e valores
    const distanceKm = calculateDistance(storeLocation, customerLocation);
    const deliveryFee = calculateDeliveryFee(distanceKm);
    const partnerEarning = calculatePartnerEarning(deliveryFee);
    
    console.log(`📏 Distância: ${distanceKm.toFixed(1)}km`);
    console.log(`💰 Taxa: R$ ${deliveryFee.toFixed(2)}`);
    console.log(`💵 Ganho entregador: R$ ${partnerEarning.toFixed(2)}`);
    
    // 5. Buscar entregadores disponíveis (raio inicial: 5km)
    const initialRadius = 5;
    const nearbyPartners = await findNearbyPartners(storeLocation, initialRadius);
    
    if (nearbyPartners.length === 0) {
      console.log('⚠️ Nenhum entregador disponível em 5km');
      // Você pode expandir o raio aqui se quiser
    }
    
    // 6. Criar oferta de entrega
    const now = Timestamp.now();
    const expiresAt = Timestamp.fromMillis(
      now.toMillis() + 120000 // Expira em 2 minutos (120s)
    );
    
    const offerData: any = {
      order_id: orderId,
      store_id: storeId,
      store_name: order.storeName || 'Loja',
      
      pickup_location: new GeoPoint(
        storeLocation.latitude,
        storeLocation.longitude
      ),
      delivery_location: new GeoPoint(
        customerLocation.latitude,
        customerLocation.longitude
      ),
      
      distance_km: Math.round(distanceKm * 10) / 10,
      earning_amount: Math.round(partnerEarning * 100) / 100,
      
      status: 'open',
      visible_to_partners: nearbyPartners,
      
      created_at: now,
      expires_at: expiresAt,
      
      attempt_number: 1,
      search_radius_km: initialRadius
    };
    
    const offerRef = await addDoc(collection(db, 'delivery_offers'), offerData);
    
    console.log(`✅ Oferta criada: ${offerRef.id}`);
    console.log(`👥 ${nearbyPartners.length} entregadores notificados`);
    
    // 7. Atualizar pedido
    await updateDoc(orderRef, {
      'delivery.offer_id': offerRef.id,
      'delivery.delivery_fee': deliveryFee,
      'delivery.partner_earning': partnerEarning,
      'delivery.platform_commission': deliveryFee - partnerEarning,
      'delivery.distance_km': distanceKm,
      'delivery.pickup_eta_minutes': Math.ceil(distanceKm * 3)
    });
    
    return { 
      success: true, 
      offerId: offerRef.id 
    };
    
  } catch (error: any) {
    console.error('❌ Erro ao criar oferta:', error);
    return { 
      success: false, 
      error: error.message || 'Erro desconhecido' 
    };
  }
};

// ==========================================
// FUNÇÃO 2: ATRIBUIR ENTREGADOR
// ==========================================

/**
 * Atribui entregador ao pedido quando ele aceita a oferta
 * 
 * QUANDO CHAMAR:
 * - Quando entregador clica em "Aceitar" no app
 * - Substitui: functions/src/delivery/assignDeliveryPartner.ts
 * 
 * EXEMPLO:
 * await assignDeliveryPartner(offerId, partnerId);
 */
export const assignDeliveryPartner = async (
  offerId: string,
  partnerId: string
): Promise<{ success: boolean; error?: string }> => {
  
  try {
    console.log(`🚚 Atribuindo entregador ${partnerId} à oferta ${offerId}`);
    
    // 1. Buscar oferta
    const offerRef = doc(db, 'delivery_offers', offerId);
    const offerSnap = await getDoc(offerRef);
    
    if (!offerSnap.exists()) {
      throw new Error('Oferta não encontrada');
    }
    
    const offer = offerSnap.data();
    
    // 2. Verificar se oferta ainda está aberta
    if (offer.status !== 'open') {
      return { success: false, error: 'Oferta já foi aceita ou expirou' };
    }
    
    // 3. Atualizar oferta
    await updateDoc(offerRef, {
      status: 'accepted',
      assigned_partner_id: partnerId,
      accepted_at: Timestamp.now()
    });
    
    // 4. Atualizar pedido
    const orderRef = doc(db, 'orders', offer.order_id);
    await updateDoc(orderRef, {
      'delivery.status': 'partner_assigned',
      'delivery.partner_id': partnerId,
      'delivery.assigned_at': Timestamp.now()
    });
    
    // 5. Atualizar status do entregador
    const partnerRef = doc(db, 'delivery_partners', partnerId);
    await updateDoc(partnerRef, {
      operational_status: 'on_delivery',
      current_order_id: offer.order_id
    });
    
    console.log('✅ Entregador atribuído com sucesso');
    
    return { success: true };
    
  } catch (error: any) {
    console.error('❌ Erro ao atribuir entregador:', error);
    return { 
      success: false, 
      error: error.message || 'Erro desconhecido' 
    };
  }
};

// ==========================================
// FUNÇÃO 3: COMPLETAR ENTREGA
// ==========================================

/**
 * Completa entrega e processa pagamento
 * 
 * QUANDO CHAMAR:
 * - Quando entregador marca como "Entrega concluída" no app
 * - Substitui: functions/src/delivery/completeDelivery.ts
 * 
 * EXEMPLO:
 * await completeDelivery(orderId, partnerId);
 */
export const completeDelivery = async (
  orderId: string,
  partnerId: string
): Promise<{ success: boolean; error?: string }> => {
  
  try {
    console.log(`✅ Completando entrega do pedido ${orderId}`);
    
    // 1. Buscar pedido
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Pedido não encontrado');
    }
    
    const order = orderSnap.data();
    const partnerEarning = order.delivery.partner_earning || 0;
    
    // 2. Atualizar pedido
    await updateDoc(orderRef, {
      'delivery.status': 'delivered',
      'delivery.completed_at': Timestamp.now(),
      status: 'delivered'
    });
    
    // 3. Atualizar entregador
    const partnerRef = doc(db, 'delivery_partners', partnerId);
    const partnerSnap = await getDoc(partnerRef);
    
    if (partnerSnap.exists()) {
      const partner = partnerSnap.data();
      
      await updateDoc(partnerRef, {
        operational_status: 'online_idle',
        current_order_id: null,
        'earnings.available_balance': (partner.earnings?.available_balance || 0) + partnerEarning,
        'earnings.total_earned': (partner.earnings?.total_earned || 0) + partnerEarning,
        'stats.total_deliveries': (partner.stats?.total_deliveries || 0) + 1
      });
    }
    
    // 4. Registrar transação
    await addDoc(collection(db, 'delivery_transactions'), {
      partner_id: partnerId,
      order_id: orderId,
      type: 'delivery_earning',
      amount: partnerEarning,
      status: 'completed',
      created_at: Timestamp.now()
    });
    
    console.log(`💰 R$ ${partnerEarning.toFixed(2)} creditado ao entregador`);
    
    return { success: true };
    
  } catch (error: any) {
    console.error('❌ Erro ao completar entrega:', error);
    return { 
      success: false, 
      error: error.message || 'Erro desconhecido' 
    };
  }
};

// ==========================================
// FUNÇÃO 4: RETRY DE OFERTAS (EXPANDIR RAIO)
// ==========================================

/**
 * Expande raio de busca quando nenhum entregador aceita
 * 
 * QUANDO CHAMAR:
 * - Manualmente pelo dashboard quando oferta expira
 * - Ou criar um botão "Procurar mais entregadores"
 * - Substitui: functions/src/delivery/retryDeliveryOffer.ts
 */
export const retryDeliveryOffer = async (
  orderId: string
): Promise<{ success: boolean; error?: string }> => {
  
  try {
    console.log(`🔄 Retry de oferta para pedido ${orderId}`);
    
    // 1. Buscar pedido
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      throw new Error('Pedido não encontrado');
    }
    
    const order = orderSnap.data();
    
    // 2. Buscar oferta atual
    const offersRef = collection(db, 'delivery_offers');
    const q = query(
      offersRef,
      where('order_id', '==', orderId),
      where('status', '==', 'open')
    );
    
    const offersSnap = await getDocs(q);
    
    if (offersSnap.empty) {
      // Criar nova oferta se não existe
      return await createDeliveryOffer(orderId, order.storeId);
    }
    
    // 3. Expandir raio da oferta existente
    const offerDoc = offersSnap.docs[0];
    const currentOffer = offerDoc.data();
    const newRadius = currentOffer.search_radius_km + 3; // +3km
    
    console.log(`📍 Expandindo raio de ${currentOffer.search_radius_km}km para ${newRadius}km`);
    
    // 4. Buscar mais entregadores
    const storeLocation: Location = {
      latitude: currentOffer.pickup_location.latitude,
      longitude: currentOffer.pickup_location.longitude
    };
    
    const morePartners = await findNearbyPartners(storeLocation, newRadius);
    
    // 5. Atualizar oferta
    await updateDoc(doc(db, 'delivery_offers', offerDoc.id), {
      search_radius_km: newRadius,
      visible_to_partners: morePartners,
      attempt_number: currentOffer.attempt_number + 1,
      expires_at: Timestamp.fromMillis(Date.now() + 120000) // +2 minutos
    });
    
    console.log(`✅ ${morePartners.length} entregadores agora podem ver a oferta`);
    
    return { success: true };
    
  } catch (error: any) {
    console.error('❌ Erro no retry:', error);
    return { 
      success: false, 
      error: error.message || 'Erro desconhecido' 
    };
  }
};

// ==========================================
// EXPORTS
// ==========================================

export default {
  createDeliveryOffer,
  assignDeliveryPartner,
  completeDelivery,
  retryDeliveryOffer
};

