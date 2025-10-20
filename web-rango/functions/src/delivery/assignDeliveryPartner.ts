/**
 * Cloud Function: Atribuir Entregador ao Pedido
 * 
 * Trigger: onUpdate em 'delivery_offers'
 * 
 * Quando uma oferta é aceita por um entregador:
 * 1. Atualiza o pedido com dados do entregador
 * 2. Atualiza status do entregador para 'on_delivery'
 * 3. Notifica loja e cliente
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const db = admin.firestore();

/**
 * Função principal
 */
export const assignDeliveryPartner = functions.firestore
  .document('delivery_offers/{offerId}')
  .onUpdate(async (change: functions.Change<functions.firestore.DocumentSnapshot>, context: functions.EventContext) => {
    const offerBefore = change.before.data();
    const offerAfter = change.after.data();
    const offerId = context.params.offerId;
    
    // Verificar se dados existem
    if (!offerBefore || !offerAfter) {
      console.log('⚠️ Dados da oferta incompletos');
      return null;
    }
    
    // Verificar se oferta foi aceita
    if (offerBefore.status === 'open' && offerAfter.status === 'accepted') {
      console.log(`✅ Oferta ${offerId} aceita por ${offerAfter.accepted_by}`);
      
      const partnerId = offerAfter.accepted_by;
      const orderId = offerAfter.order_id;
      
      try {
        // Buscar dados do entregador
        const partnerDoc = await db
          .collection('delivery_partners')
          .doc(partnerId)
          .get();
        
        if (!partnerDoc.exists) {
          throw new Error(`Entregador ${partnerId} não encontrado`);
        }
        
        const partner = partnerDoc.data();
        
        if (!partner) {
          throw new Error('Dados do entregador inválidos');
        }
        
        console.log(`👤 Entregador: ${partner.full_name}`);
        
        // Batch para atualização atômica
        const batch = db.batch();
        
        // 1. Atualizar pedido com dados do entregador
        const orderRef = db.collection('orders').doc(orderId);
        batch.update(orderRef, {
          'delivery.partner_id': partnerId,
          'delivery.partner_name': partner.full_name,
          'delivery.partner_phone': partner.phone,
          'delivery.partner_photo_url': partner.profile_photo_url || null,
          'delivery.partner_vehicle_type': partner.vehicle.type,
          'delivery.status': 'partner_assigned',
          'delivery.assigned_at': admin.firestore.FieldValue.serverTimestamp()
        });
        
        // 2. Atualizar entregador para 'on_delivery'
        const partnerRef = db.collection('delivery_partners').doc(partnerId);
        batch.update(partnerRef, {
          operational_status: 'on_delivery',
          current_order_id: orderId,
          last_location_update: admin.firestore.FieldValue.serverTimestamp(),
          updated_at: admin.firestore.FieldValue.serverTimestamp()
        });
        
        // 3. Fechar outras ofertas deste pedido (se houver)
        const otherOffersSnapshot = await db
          .collection('delivery_offers')
          .where('order_id', '==', orderId)
          .where('status', '==', 'open')
          .get();
        
        otherOffersSnapshot.forEach((doc: admin.firestore.QueryDocumentSnapshot) => {
          if (doc.id !== offerId) {
            batch.update(doc.ref, {
              status: 'cancelled'
            });
          }
        });
        
        // Commitar todas as mudanças
        await batch.commit();
        
        console.log(`✅ Entregador ${partner.full_name} atribuído ao pedido ${orderId}`);
        
        // TODO: Notificar loja
        // await notifyStore(orderId, partner);
        
        // TODO: Notificar cliente
        // await notifyCustomer(orderId, partner);
        
        return {
          success: true,
          partnerId,
          partnerName: partner.full_name,
          orderId
        };
        
      } catch (error) {
        console.error('❌ Erro ao atribuir entregador:', error);
        
        // Reverter oferta para open em caso de erro
        await change.after.ref.update({
          status: 'open',
          accepted_by: admin.firestore.FieldValue.delete(),
          accepted_at: admin.firestore.FieldValue.delete()
        });
        
        throw error;
      }
    }
    
    return null;
  });

