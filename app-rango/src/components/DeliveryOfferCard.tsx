/**
 * CARD DE OFERTA DE ENTREGA
 * 
 * Exibe uma oferta de entrega para o entregador aceitar/recusar
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DeliveryOffer, declineOffer, getOfferTimeRemaining, formatCurrency } from '../services/deliveryOfferService';
import { assignDeliveryPartner } from '../services/deliveryLogicService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface DeliveryOfferCardProps {
  offer: DeliveryOffer;
  partnerId: string;
  onAccepted?: () => void;
  onDeclined?: () => void;
}

const DeliveryOfferCard: React.FC<DeliveryOfferCardProps> = ({
  offer,
  partnerId,
  onAccepted,
  onDeclined,
}) => {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  // Atualizar contador de tempo
  useEffect(() => {
    const updateTimer = () => {
      const remaining = getOfferTimeRemaining(offer.expires_at);
      setTimeRemaining(remaining);
      
      if (remaining <= 0) {
        // Oferta expirada
        onDeclined?.();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [offer.expires_at]);

  const handleAccept = async () => {
    if (accepting) return;
    
    setAccepting(true);
    try {
      // Usar deliveryLogicService ao invés de Cloud Function
      const result = await assignDeliveryPartner(offer.id, partnerId);
      
      if (result.success) {
        console.log('✅ Oferta aceita com deliveryLogicService!');
        onAccepted?.();
      } else {
        alert(result.error || 'Não foi possível aceitar a oferta');
        setAccepting(false);
      }
    } catch (error: any) {
      console.error('Erro ao aceitar:', error);
      alert('Erro ao aceitar oferta');
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (declining) return;
    
    setDeclining(true);
    try {
      await declineOffer(offer.id, partnerId);
      onDeclined?.();
    } catch (error) {
      console.error('Erro ao recusar:', error);
    }
    setDeclining(false);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDistance = (km: number): string => {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  };

  // Cores baseadas no tempo restante
  const getTimerColor = (): string => {
    if (timeRemaining <= 10) return '#F44336'; // Vermelho
    if (timeRemaining <= 30) return '#FFC107'; // Amarelo
    return '#4CAF50'; // Verde
  };

  return (
    <View style={styles.container}>
      {/* Timer de Expiração */}
      <View style={[styles.timerBar, { backgroundColor: getTimerColor() }]}>
        <View style={styles.timerContent}>
          <Ionicons name="time-outline" size={16} color="#FFF" />
          <Text style={styles.timerText}>
            Expira em {formatTime(timeRemaining)}
          </Text>
        </View>
      </View>

      {/* Ganhos - Destaque Principal */}
      <View style={styles.earningsSection}>
        <Text style={styles.earningsLabel}>Você ganha</Text>
        <Text style={styles.earningsValue}>
          {formatCurrency(offer.partner_earning)}
        </Text>
        <View style={styles.earningsDetails}>
          <Ionicons name="bicycle" size={14} color="#666" />
          <Text style={styles.earningsSubtext}>
            {formatDistance(offer.distance_km)} • Taxa total: {formatCurrency(offer.delivery_fee)}
          </Text>
        </View>
      </View>

      {/* Informações da Coleta */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="restaurant" size={20} color="#FF6B35" />
          <Text style={styles.sectionTitle}>Coletar em</Text>
        </View>
        <Text style={styles.storeName}>{offer.store_name}</Text>
        <Text style={styles.address} numberOfLines={2}>
          {offer.pickup_address}
        </Text>
      </View>

      {/* Informações da Entrega */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="location" size={20} color="#FF6B35" />
          <Text style={styles.sectionTitle}>Entregar em</Text>
        </View>
        <Text style={styles.address} numberOfLines={2}>
          {offer.delivery_address}
        </Text>
      </View>

      {/* Botões de Ação */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.button, styles.declineButton]}
          onPress={handleDecline}
          disabled={declining || accepting}
        >
          {declining ? (
            <ActivityIndicator color="#666" />
          ) : (
            <>
              <Ionicons name="close-circle" size={20} color="#666" />
              <Text style={styles.declineButtonText}>Recusar</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.acceptButton]}
          onPress={handleAccept}
          disabled={accepting || declining}
        >
          {accepting ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.acceptButtonText}>Aceitar</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Tentativa (se retry) */}
      {offer.attempt_number > 1 && (
        <View style={styles.retryBadge}>
          <Ionicons name="repeat" size={12} color="#FFF" />
          <Text style={styles.retryText}>
            Tentativa #{offer.attempt_number}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    overflow: 'hidden',
  },
  timerBar: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  timerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  timerText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  earningsSection: {
    backgroundColor: '#FFF5F0',
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFE0CC',
  },
  earningsLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  earningsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 4,
  },
  earningsDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earningsSubtext: {
    fontSize: 12,
    color: '#666',
  },
  section: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  declineButton: {
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  acceptButton: {
    backgroundColor: '#FF6B35',
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  retryBadge: {
    position: 'absolute',
    top: 40,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  retryText: {
    fontSize: 10,
    color: '#FFF',
    fontWeight: '600',
  },
});

export default DeliveryOfferCard;

