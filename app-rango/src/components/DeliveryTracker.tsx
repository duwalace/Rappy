/**
 * DELIVERY TRACKER
 * 
 * Componente de rastreamento de entrega em tempo real
 * Mostra localização do entregador, status e tempo estimado
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';

interface DeliveryTrackerProps {
  orderId: string;
  onStatusChange?: (status: string) => void;
}

interface DeliveryInfo {
  partner_id?: string;
  partner_name?: string;
  partner_phone?: string;
  partner_photo_url?: string;
  partner_vehicle_type?: string;
  status: string;
  partner_current_location?: {
    latitude: number;
    longitude: number;
  };
  assigned_at?: any;
  picked_up_at?: any;
  delivered_at?: any;
  partner_earning?: number;
}

const DeliveryTracker: React.FC<DeliveryTrackerProps> = ({ orderId, onStatusChange }) => {
  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;

    console.log('🔔 Escutando entrega do pedido:', orderId);

    const unsubscribe = onSnapshot(
      doc(db, 'orders', orderId),
      (snapshot) => {
        if (snapshot.exists()) {
          const orderData = snapshot.data();
          const delivery = orderData.delivery as DeliveryInfo;

          if (delivery) {
            setDeliveryInfo(delivery);
            onStatusChange?.(delivery.status);
            console.log('📦 Status da entrega:', delivery.status);
          }
        }
        setLoading(false);
      },
      (error) => {
        console.error('❌ Erro ao escutar entrega:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [orderId]);

  const getStatusInfo = (status: string) => {
    const statusMap: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string; description: string }> = {
      pending: {
        label: 'Buscando Entregador',
        icon: 'search',
        color: '#FFA500',
        description: 'Estamos encontrando um entregador para você',
      },
      assigned: {
        label: 'Entregador a Caminho',
        icon: 'bicycle',
        color: '#2196F3',
        description: 'O entregador está indo buscar seu pedido',
      },
      picked_up: {
        label: 'Pedido Coletado',
        icon: 'checkmark-circle',
        color: '#4CAF50',
        description: 'O entregador coletou seu pedido',
      },
      in_transit: {
        label: 'Saiu para Entrega',
        icon: 'navigate',
        color: '#FF6B35',
        description: 'Seu pedido está a caminho',
      },
      delivered: {
        label: 'Entregue',
        icon: 'checkmark-done',
        color: '#4CAF50',
        description: 'Pedido entregue com sucesso!',
      },
      cancelled: {
        label: 'Cancelado',
        icon: 'close-circle',
        color: '#F44336',
        description: 'Entrega cancelada',
      },
    };

    return statusMap[status] || statusMap.pending;
  };

  const getVehicleIcon = (vehicleType?: string): keyof typeof Ionicons.glyphMap => {
    const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
      bicycle: 'bicycle',
      motorcycle: 'bicycle',
      car: 'car',
    };
    return icons[vehicleType || 'bicycle'] || 'bicycle';
  };

  const handleCallDeliveryPerson = () => {
    if (deliveryInfo?.partner_phone) {
      const phone = deliveryInfo.partner_phone.replace(/\D/g, '');
      Linking.openURL(`tel:${phone}`);
    }
  };

  const handleOpenMaps = () => {
    if (deliveryInfo?.partner_current_location) {
      const { latitude, longitude } = deliveryInfo.partner_current_location;
      
      // Usar esquema genérico que funciona no Android (Google Maps) e iOS (Apple Maps)
      // sem depender de API key do Google Cloud
      const url = Platform.select({
        ios: `maps://app?ll=${latitude},${longitude}`,
        android: `geo:${latitude},${longitude}`,
        default: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`
      });
      
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          // Fallback para OpenStreetMap (gratuito e sem API key)
          Linking.openURL(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`);
        }
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EA1D2C" />
        <Text style={styles.loadingText}>Carregando informações da entrega...</Text>
      </View>
    );
  }

  if (!deliveryInfo || !deliveryInfo.partner_id) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={48} color="#CCC" />
        <Text style={styles.emptyTitle}>Buscando Entregador</Text>
        <Text style={styles.emptyText}>
          Estamos encontrando o melhor entregador para você. Isso pode levar alguns instantes.
        </Text>
      </View>
    );
  }

  const statusInfo = getStatusInfo(deliveryInfo.status);

  return (
    <View style={styles.container}>
      {/* Status Badge */}
      <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
        <Ionicons name={statusInfo.icon} size={20} color="#FFF" />
        <Text style={styles.statusText}>{statusInfo.label}</Text>
      </View>

      {/* Delivery Person Info */}
      <View style={styles.deliveryPersonCard}>
        <View style={styles.deliveryPersonHeader}>
          <View style={styles.deliveryPersonAvatar}>
            {deliveryInfo.partner_photo_url ? (
              <Image
                source={{ uri: deliveryInfo.partner_photo_url }}
                style={styles.avatarImage}
              />
            ) : (
              <Ionicons name="person" size={32} color="#666" />
            )}
          </View>

          <View style={styles.deliveryPersonInfo}>
            <Text style={styles.deliveryPersonName}>
              {deliveryInfo.partner_name || 'Entregador'}
            </Text>
            <View style={styles.vehicleInfo}>
              <Ionicons
                name={getVehicleIcon(deliveryInfo.partner_vehicle_type)}
                size={16}
                color="#666"
              />
              <Text style={styles.vehicleText}>
                {deliveryInfo.partner_vehicle_type === 'bicycle' ? 'Bicicleta' :
                 deliveryInfo.partner_vehicle_type === 'motorcycle' ? 'Moto' : 'Carro'}
              </Text>
            </View>
          </View>

          {deliveryInfo.partner_phone && (
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCallDeliveryPerson}
            >
              <Ionicons name="call" size={20} color="#EA1D2C" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.statusDescription}>{statusInfo.description}</Text>

        {/* Location Button */}
        {deliveryInfo.partner_current_location && deliveryInfo.status !== 'delivered' && (
          <TouchableOpacity
            style={styles.locationButton}
            onPress={handleOpenMaps}
          >
            <Ionicons name="location" size={20} color="#FFF" />
            <Text style={styles.locationButtonText}>Ver no Mapa</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Timeline */}
      <View style={styles.timeline}>
        <TimelineItem
          icon="restaurant"
          label="Restaurante"
          completed={deliveryInfo.status !== 'pending' && deliveryInfo.status !== 'assigned'}
          active={deliveryInfo.status === 'assigned' || deliveryInfo.status === 'pending'}
        />
        <TimelineItem
          icon="bicycle"
          label="Em Trânsito"
          completed={deliveryInfo.status === 'in_transit' || deliveryInfo.status === 'delivered'}
          active={deliveryInfo.status === 'picked_up'}
        />
        <TimelineItem
          icon="home"
          label="Entregue"
          completed={deliveryInfo.status === 'delivered'}
          active={deliveryInfo.status === 'in_transit'}
          isLast
        />
      </View>
    </View>
  );
};

interface TimelineItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  completed: boolean;
  active: boolean;
  isLast?: boolean;
}

const TimelineItem: React.FC<TimelineItemProps> = ({ icon, label, completed, active, isLast }) => {
  return (
    <View style={styles.timelineItem}>
      <View style={styles.timelineIconContainer}>
        <View
          style={[
            styles.timelineIcon,
            completed && styles.timelineIconCompleted,
            active && styles.timelineIconActive,
          ]}
        >
          <Ionicons
            name={icon}
            size={20}
            color={completed || active ? '#FFF' : '#999'}
          />
        </View>
        {!isLast && (
          <View
            style={[
              styles.timelineLine,
              completed && styles.timelineLineCompleted,
            ]}
          />
        )}
      </View>
      <Text
        style={[
          styles.timelineLabel,
          (completed || active) && styles.timelineLabelActive,
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 16,
    gap: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  deliveryPersonCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deliveryPersonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  deliveryPersonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  deliveryPersonInfo: {
    flex: 1,
  },
  deliveryPersonName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  vehicleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  vehicleText: {
    fontSize: 14,
    color: '#666',
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EA1D2C',
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EA1D2C',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  locationButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
  },
  timeline: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timelineIconContainer: {
    alignItems: 'center',
    marginRight: 12,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineIconActive: {
    backgroundColor: '#FFA500',
  },
  timelineIconCompleted: {
    backgroundColor: '#4CAF50',
  },
  timelineLine: {
    width: 2,
    height: 24,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
  timelineLineCompleted: {
    backgroundColor: '#4CAF50',
  },
  timelineLabel: {
    fontSize: 14,
    color: '#999',
    marginTop: 10,
  },
  timelineLabelActive: {
    color: '#333',
    fontWeight: '500',
  },
});

export default DeliveryTracker;

