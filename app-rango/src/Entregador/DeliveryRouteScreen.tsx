/**
 * DeliveryRouteScreen.tsx
 * Tela de navegação durante corrida ativa
 * Mostra rota, detalhes do pedido e ações de progresso
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { subscribeToTrip, updateTripStatus, Trip, TripStatus } from '../services/tripService';
import { getOrder } from '../services/orderService';
import { Order } from '../types/shared';

type DeliveryStackParamList = {
  DeliveryDashboard: undefined;
  DeliveryRouteScreen: { tripId: string };
  DeliveryHistory: undefined;
  DeliveryWallet: undefined;
  DeliveryProfile: undefined;
};

type RouteScreenRouteProp = RouteProp<DeliveryStackParamList, 'DeliveryRouteScreen'>;
type RouteScreenNavigationProp = StackNavigationProp<DeliveryStackParamList, 'DeliveryRouteScreen'>;

const DeliveryRouteScreen = () => {
  const route = useRoute<RouteScreenRouteProp>();
  const navigation = useNavigation<RouteScreenNavigationProp>();
  const { tripId } = route.params;

  const [trip, setTrip] = useState<Trip | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!tripId) {
      Alert.alert('Erro', 'ID da corrida não encontrado');
      navigation.goBack();
      return;
    }

    // Inscrever-se em atualizações da corrida
    const unsubscribe = subscribeToTrip(tripId, async (updatedTrip) => {
      if (updatedTrip) {
        setTrip(updatedTrip);

        // Se for a primeira carga, buscar dados do pedido
        if (loading && updatedTrip.orderId) {
          const orderData = await getOrder(updatedTrip.orderId);
          setOrder(orderData);
          setLoading(false);
        }

        // Se a corrida foi entregue ou cancelada, voltar ao dashboard
        if (updatedTrip.status === 'delivered' || updatedTrip.status === 'canceled') {
          setTimeout(() => {
            Alert.alert(
              'Corrida Finalizada',
              updatedTrip.status === 'delivered' 
                ? 'Entrega realizada com sucesso!' 
                : 'Corrida cancelada',
              [{ text: 'OK', onPress: () => navigation.navigate('DeliveryDashboard') }]
            );
          }, 1000);
        }
      } else {
        Alert.alert('Erro', 'Corrida não encontrada');
        navigation.goBack();
      }
    });

    return () => unsubscribe();
  }, [tripId, loading]);

  const handleStatusUpdate = async (newStatus: TripStatus) => {
    if (!trip) return;

    const messages: Record<TripStatus, { title: string; message: string }> = {
      picking_up: { title: 'Indo buscar', message: 'Confirma que está a caminho da loja?' },
      picked_up: { title: 'Pedido coletado', message: 'Confirma que coletou o pedido?' },
      delivering: { title: 'A caminho', message: 'Confirma que está indo para o cliente?' },
      delivered: { title: 'Entrega concluída', message: 'Confirma que entregou o pedido?' },
      canceled: { title: 'Cancelar', message: 'Deseja cancelar esta corrida?' },
      pending: { title: '', message: '' },
      assigned: { title: '', message: '' },
      accepted: { title: '', message: '' },
    };

    const config = messages[newStatus];

    Alert.alert(config.title, config.message, [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim',
        onPress: async () => {
          setUpdating(true);
          try {
            await updateTripStatus(tripId, newStatus);
            
            if (newStatus === 'delivered') {
              Alert.alert('Parabéns! 🎉', 'Entrega realizada com sucesso!');
            }
          } catch (error) {
            Alert.alert('Erro', 'Não foi possível atualizar o status');
          } finally {
            setUpdating(false);
          }
        },
      },
    ]);
  };

  const openMaps = (latitude?: number, longitude?: number, address?: string) => {
    // Usar esquema genérico geo: que funciona no Android e iOS sem API key
    // Android: abre Google Maps | iOS: abre Apple Maps
    const destination = latitude && longitude
      ? `${latitude},${longitude}`
      : encodeURIComponent(address || '');

    const url = Platform.select({
      ios: `maps://app?daddr=${destination}`,
      android: `geo:0,0?q=${destination}`,
      default: `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`
    });
    
    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback para OpenStreetMap no navegador (gratuito e sem API key)
        Linking.openURL(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=15/${latitude}/${longitude}`);
      }
    });
  };

  const callPhone = (phone: string) => {
    const phoneUrl = `tel:${phone}`;
    Linking.canOpenURL(phoneUrl).then((supported) => {
      if (supported) {
        Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Erro', 'Não foi possível fazer a ligação');
      }
    });
  };

  const getNextAction = () => {
    if (!trip) return null;

    const actions: Record<TripStatus, { label: string; status: TripStatus; icon: keyof typeof Icon.glyphMap } | null> = {
      accepted: { label: 'Indo buscar pedido', status: 'picking_up', icon: 'bicycle' },
      picking_up: { label: 'Coletei o pedido', status: 'picked_up', icon: 'cube' },
      picked_up: { label: 'Indo para o cliente', status: 'delivering', icon: 'car' },
      delivering: { label: 'Pedido entregue', status: 'delivered', icon: 'check-circle' },
      delivered: null,
      canceled: null,
      pending: null,
      assigned: null,
    };

    return actions[trip.status];
  };

  const getStatusInfo = () => {
    if (!trip) return { text: '', color: '#666', icon: 'information-circle' as keyof typeof Icon.glyphMap };

    const info: Record<TripStatus, { text: string; color: string; icon: keyof typeof Icon.glyphMap }> = {
      accepted: { text: 'Corrida aceita', color: '#4CAF50', icon: 'check-circle' },
      picking_up: { text: 'Indo buscar pedido', color: '#2196F3', icon: 'bicycle' },
      picked_up: { text: 'Pedido coletado', color: '#FF9800', icon: 'cube' },
      delivering: { text: 'A caminho do cliente', color: '#9C27B0', icon: 'car' },
      delivered: { text: 'Entregue', color: '#4CAF50', icon: 'check-circle' },
      canceled: { text: 'Cancelada', color: '#F44336', icon: 'close-circle' },
      pending: { text: 'Pendente', color: '#666', icon: 'timer-outline' },
      assigned: { text: 'Atribuída', color: '#666', icon: 'account-circle' },
    };

    return info[trip.status];
  };

  const formatAddress = (address: any) => {
    return `${address.street}, ${address.number}${address.complement ? ` - ${address.complement}` : ''} - ${address.neighborhood}, ${address.city}/${address.state}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Carregando corrida...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={64} color="#ccc" />
          <Text style={styles.errorText}>Corrida não encontrada</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo();
  const nextAction = getNextAction();
  const isPickupPhase = trip.status === 'accepted' || trip.status === 'picking_up';
  const currentAddress = isPickupPhase ? trip.pickupAddress : trip.deliveryAddress;
  const currentLabel = isPickupPhase ? 'Loja' : 'Cliente';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.innerContainer}>
      {/* Header com status */}
      <View style={[styles.statusHeader, { backgroundColor: statusInfo.color }]}>
        <Icon name={statusInfo.icon} size={28} color="#fff" />
        <Text style={styles.statusHeaderText}>{statusInfo.text}</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mapa simulado ou informações de localização */}
        <View style={styles.mapPlaceholder}>
          <Icon name="pin" size={48} color="#FF6B35" />
          <Text style={styles.mapPlaceholderText}>Mapa de navegação</Text>
          <TouchableOpacity
            style={styles.openMapsButton}
            onPress={() => openMaps(currentAddress.latitude, currentAddress.longitude, formatAddress(currentAddress))}
          >
            <Icon name="map" size={20} color="#fff" />
            <Text style={styles.openMapsButtonText}>Abrir no Mapa</Text>
          </TouchableOpacity>
        </View>

        {/* Endereços */}
        <View style={styles.section}>
          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={[styles.addressBadge, { backgroundColor: isPickupPhase ? '#FF6B35' : '#ccc' }]}>
                <Icon name="store" size={20} color="#fff" />
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>Buscar em:</Text>
                <Text style={styles.addressName}>{trip.storeName}</Text>
              </View>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => openMaps(trip.pickupAddress.latitude, trip.pickupAddress.longitude, formatAddress(trip.pickupAddress))}
              >
                <Icon name="navigation" size={20} color="#FF6B35" />
              </TouchableOpacity>
            </View>
            <Text style={styles.addressText}>{formatAddress(trip.pickupAddress)}</Text>
          </View>

          <View style={styles.routeConnector}>
            <View style={styles.routeLine} />
            <Icon name="arrow-down" size={24} color="#ccc" />
          </View>

          <View style={styles.addressCard}>
            <View style={styles.addressHeader}>
              <View style={[styles.addressBadge, { backgroundColor: !isPickupPhase ? '#FF6B35' : '#ccc' }]}>
                <Icon name="home" size={20} color="#fff" />
              </View>
              <View style={styles.addressInfo}>
                <Text style={styles.addressLabel}>Entregar em:</Text>
                <Text style={styles.addressName}>{trip.customerName}</Text>
              </View>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => openMaps(trip.deliveryAddress.latitude, trip.deliveryAddress.longitude, formatAddress(trip.deliveryAddress))}
              >
                <Icon name="navigation" size={20} color="#FF6B35" />
              </TouchableOpacity>
            </View>
            <Text style={styles.addressText}>{formatAddress(trip.deliveryAddress)}</Text>
          </View>
        </View>

        {/* Informações da corrida */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Informações da Entrega</Text>
          
          <View style={styles.infoGrid}>
            <View style={styles.infoCard}>
              <Icon name="cash" size={24} color="#4CAF50" />
              <Text style={styles.infoValue}>R$ {trip.deliveryFee.toFixed(2)}</Text>
              <Text style={styles.infoLabel}>Você receberá</Text>
            </View>

            {trip.distance && (
              <View style={styles.infoCard}>
                <Icon name="navigation" size={24} color="#2196F3" />
                <Text style={styles.infoValue}>{trip.distance.toFixed(1)} km</Text>
                <Text style={styles.infoLabel}>Distância</Text>
              </View>
            )}

            {trip.estimatedTime && (
              <View style={styles.infoCard}>
                <Icon name="clock-outline" size={24} color="#FF9800" />
                <Text style={styles.infoValue}>{trip.estimatedTime} min</Text>
                <Text style={styles.infoLabel}>Tempo estimado</Text>
              </View>
            )}
          </View>
        </View>

        {/* Detalhes do pedido */}
        {order && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Itens do Pedido</Text>
            <View style={styles.orderItems}>
              {order.items.map((item: any, index: number) => (
                <View key={index} style={styles.orderItem}>
                  <Text style={styles.orderItemQty}>{item.quantity}x</Text>
                  <Text style={styles.orderItemName}>{item.name}</Text>
                  <Text style={styles.orderItemPrice}>R$ {item.subtotal.toFixed(2)}</Text>
                </View>
              ))}
              <View style={styles.orderTotal}>
                <Text style={styles.orderTotalLabel}>Total do pedido:</Text>
                <Text style={styles.orderTotalValue}>R$ {order.total.toFixed(2)}</Text>
              </View>
              <View style={styles.paymentInfo}>
                <Icon name="credit-card" size={18} color="#666" />
                <Text style={styles.paymentText}>
                  {order.paymentMethod === 'cash' ? 'Dinheiro' : 
                   order.paymentMethod === 'pix' ? 'PIX' : 
                   order.paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 
                   'Cartão de Débito'}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Observações */}
        {trip.customerNotes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Observações do Cliente</Text>
            <View style={styles.notesBox}>
              <Icon name="clipboard-outline" size={20} color="#666" />
              <Text style={styles.notesText}>{trip.customerNotes}</Text>
            </View>
          </View>
        )}

        {/* Contato */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contato</Text>
          <View style={styles.contactButtons}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={() => callPhone(order?.customerPhone || trip.customerName)}
            >
              <Icon name="phone" size={24} color="#fff" />
              <Text style={styles.contactButtonText}>Ligar para cliente</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Ações fixas no rodapé */}
      <View style={styles.footer}>
        {nextAction && (
          <TouchableOpacity
            style={[styles.actionButton, updating && styles.actionButtonDisabled]}
            onPress={() => handleStatusUpdate(nextAction.status)}
            disabled={updating}
          >
            {updating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Icon name={nextAction.icon} size={24} color="#fff" />
                <Text style={styles.actionButtonText}>{nextAction.label}</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {trip.status !== 'delivered' && trip.status !== 'canceled' && (
          <TouchableOpacity
            style={[styles.cancelButton, updating && styles.actionButtonDisabled]}
            onPress={() => handleStatusUpdate('canceled')}
            disabled={updating}
          >
            <Icon name="close-circle" size={20} color="#F44336" />
            <Text style={styles.cancelButtonText}>Cancelar corrida</Text>
          </TouchableOpacity>
        )}
      </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  innerContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 10,
  },
  statusHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  mapPlaceholder: {
    backgroundColor: '#e3f2fd',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#2196F3',
  },
  mapPlaceholderText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  openMapsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4285F4',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 25,
    marginTop: 12,
    gap: 8,
  },
  openMapsButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  addressCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  addressBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addressInfo: {
    flex: 1,
  },
  addressLabel: {
    fontSize: 12,
    color: '#666',
  },
  addressName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addressText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 52,
  },
  iconButton: {
    padding: 8,
  },
  routeConnector: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: '#ccc',
  },
  infoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  infoCard: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  orderItems: {
    gap: 8,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  orderItemQty: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B35',
    width: 40,
  },
  orderItemName: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  orderItemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  orderTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    marginTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#e0e0e0',
  },
  orderTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  paymentText: {
    fontSize: 14,
    color: '#666',
  },
  notesBox: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderRadius: 8,
    padding: 12,
    gap: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  notesText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  contactButtons: {
    gap: 12,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 10,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  footer: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 10,
  },
  actionButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#F44336',
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F44336',
  },
});

export default DeliveryRouteScreen;
