import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  ScrollView,
  FlatList,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Importar MapView condicionalmente (não funciona na web)
let MapView: any = null;
let Marker: any = null;
let Circle: any = null;
let PROVIDER_DEFAULT: any = null;

if (Platform.OS !== 'web') {
  const RNMaps = require('react-native-maps');
  MapView = RNMaps.default;
  Marker = RNMaps.Marker;
  Circle = RNMaps.Circle;
  PROVIDER_DEFAULT = RNMaps.PROVIDER_DEFAULT;
}
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import { useAuth } from '../contexts/AuthContext';
import {
  subscribeToDeliveryPerson,
  updateAvailability,
  DeliveryPerson,
} from '../services/deliveryService';
import {
  subscribeToPendingTrips,
  Trip,
} from '../services/tripService';
import {
  subscribeToOffers,
  subscribeToActiveDelivery,
  updateOperationalStatus,
  DeliveryOffer,
} from '../services/deliveryOfferService';
import {
  initializeNotifications,
  notifyNewOffer,
} from '../services/notificationService';
import DeliveryAlertModal from './DeliveryAlertModal';
import DeliveryOfferCard from '../components/DeliveryOfferCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DeliveryHomeScreen: React.FC = () => {
  const { usuarioLogado } = useAuth();
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(true);
  const [deliveryPerson, setDeliveryPerson] = useState<DeliveryPerson | null>(null);
  const [isOnline, setIsOnline] = useState(false);
  const [showDeliveryAlert, setShowDeliveryAlert] = useState(false);
  const [pendingTrips, setPendingTrips] = useState<Trip[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  
  // Novos estados para integração Fase 1
  const [availableOffers, setAvailableOffers] = useState<DeliveryOffer[]>([]);
  const [activeDelivery, setActiveDelivery] = useState<any | null>(null);
  const [partnerIdFromFirebase, setPartnerIdFromFirebase] = useState<string | null>(null);
  const [showOffersMenu, setShowOffersMenu] = useState(true); // Controla visibilidade do menu de ofertas

  // Estados do Mapa
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);

  // Solicitar permissão de localização e obter posição atual
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        
        if (status === 'granted') {
          setLocationPermission(true);
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setCurrentLocation(location);
          console.log('📍 Localização obtida:', location.coords);

          // Observar mudanças de localização quando online
          if (isOnline) {
            Location.watchPositionAsync(
              {
                accuracy: Location.Accuracy.Balanced,
                timeInterval: 10000, // Atualizar a cada 10 segundos
                distanceInterval: 50, // Ou quando mover 50 metros
              },
              (newLocation) => {
                setCurrentLocation(newLocation);
                console.log('📍 Localização atualizada');
              }
            );
          }
        } else {
          console.warn('⚠️ Permissão de localização negada');
        }
      } catch (error) {
        console.error('❌ Erro ao obter localização:', error);
      }
    })();
  }, [isOnline]);

  // Carregar dados do entregador
  useEffect(() => {
    if (!usuarioLogado?.uid) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToDeliveryPerson(
      usuarioLogado.uid,
      (person) => {
        setDeliveryPerson(person);
        if (person) {
          setIsOnline(person.availability === 'online');
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [usuarioLogado]);

  // Buscar partnerId do delivery_partners collection
  useEffect(() => {
    if (!usuarioLogado?.uid) return;

    // Por enquanto usar o UID como partnerId
    // Em produção, buscar o documento delivery_partners pelo userId
    setPartnerIdFromFirebase(usuarioLogado.uid);
    
    // Inicializar notificações (silenciosamente, sem erros no Expo Go)
    initializeNotifications(usuarioLogado.uid).catch(() => {
      // Silenciar completamente qualquer erro de notificações
    });
  }, [usuarioLogado]);

  // Escutar ofertas disponíveis em tempo real (NOVO - Fase 1)
  useEffect(() => {
    if (!isOnline || !partnerIdFromFirebase) {
      setAvailableOffers([]);
      return;
    }

    console.log('🔔 Iniciando escuta de ofertas para:', partnerIdFromFirebase);
    
    const unsubscribe = subscribeToOffers(partnerIdFromFirebase, (offers) => {
      console.log('📦 Ofertas recebidas:', offers.length);
      console.log('🔍 Debug - Ofertas:', offers);
      console.log('🔍 Debug - isOnline:', isOnline);
      
      // Notificar se nova oferta chegou
      if (offers.length > availableOffers.length && offers.length > 0) {
        const newOffer = offers[0];
        // Silenciar erros de notificação no Expo Go
        notifyNewOffer({
          store_name: newOffer.store_name,
          partner_earning: newOffer.partner_earning,
          distance_km: newOffer.distance_km,
        }).catch(() => {
          // Silenciar completamente
        });
      }
      
      setAvailableOffers(offers);
    });

    return () => unsubscribe();
  }, [isOnline, partnerIdFromFirebase]);

  // Escutar entrega ativa (NOVO - Fase 1)
  useEffect(() => {
    if (!partnerIdFromFirebase) return;

    const unsubscribe = subscribeToActiveDelivery(partnerIdFromFirebase, (delivery) => {
      setActiveDelivery(delivery);
      
      if (delivery) {
        console.log('🚚 Entrega ativa:', delivery.orderId);
        // Navegar automaticamente para tela de entrega se necessário
      }
    });

    return () => unsubscribe();
  }, [partnerIdFromFirebase]);

  // Monitorar corridas pendentes quando online (ANTIGO - compatibilidade)
  useEffect(() => {
    if (!isOnline) {
      setPendingTrips([]);
      return;
    }

    const unsubscribe = subscribeToPendingTrips((trips) => {
      setPendingTrips(trips);
      
      if (trips.length > 0 && !showDeliveryAlert) {
        setCurrentTrip(trips[0]);
        setShowDeliveryAlert(true);
      }
    });

    return () => unsubscribe();
  }, [isOnline]);

  const handleStatusChange = async () => {
    if (!usuarioLogado?.uid || !partnerIdFromFirebase) return;

    try {
      const newAvailability = !isOnline ? 'online' : 'offline';
      
      // Atualizar no sistema antigo (deliveryPersons)
      await updateAvailability(usuarioLogado.uid, newAvailability);
      
      // Atualizar no sistema novo (delivery_partners)
      const newStatus = !isOnline ? 'online_idle' : 'offline';
      await updateOperationalStatus(partnerIdFromFirebase, newStatus);
      
      setIsOnline(!isOnline);
      
      console.log(`✅ Status alterado para: ${newStatus}`);
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleOfferAccepted = () => {
    console.log('🎉 Oferta aceita! Aguardando atribuição...');
    // A Cloud Function vai atualizar o pedido e disparar o listener de activeDelivery
  };

  const handleOfferDeclined = () => {
    console.log('❌ Oferta recusada');
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  const todayEarnings = deliveryPerson?.stats?.totalEarnings || 0;
  const completedToday = deliveryPerson?.stats?.completedDeliveries || 0;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header com Status */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <Ionicons name="person-circle-outline" size={24} color="#666" />
        </View>
        
        <TouchableOpacity 
          style={[styles.statusButton, isOnline && styles.statusButtonOnline]}
          onPress={handleStatusChange}
        >
          <Text style={[styles.statusButtonText, isOnline && styles.statusButtonTextActive]}>
            {isOnline ? 'Disponível' : 'Indisponível'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.notificationButton}>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Mapa - Área Principal (SEM GOOGLE CLOUD) */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          // Placeholder para Web (mapas não funcionam na web)
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={64} color="#FF6B35" />
            <Text style={styles.mapPlaceholderText}>Mapa disponível apenas no app mobile</Text>
            {currentLocation && (
              <Text style={styles.locationText}>
                Lat: {currentLocation.coords.latitude.toFixed(6)}, Lng: {currentLocation.coords.longitude.toFixed(6)}
              </Text>
            )}
          </View>
        ) : currentLocation && MapView ? (
          <MapView
            style={styles.map}
            provider={PROVIDER_DEFAULT} // Usa mapas nativos (Apple Maps iOS, OpenStreetMap Android)
            initialRegion={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
              latitudeDelta: 0.02,
              longitudeDelta: 0.02,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
            showsCompass={true}
            loadingEnabled={true}
            loadingIndicatorColor="#FF6B35"
            rotateEnabled={true}
            pitchEnabled={false}
          >
            {/* Marcador da posição atual do entregador */}
            <Marker
              coordinate={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
              }}
              title="Você está aqui"
              description="Entregador"
              pinColor="#FF6B35"
            />
            
            {/* Círculo de raio de busca (5km) */}
            {isOnline && (
              <Circle
                center={{
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                }}
                radius={5000} // 5km em metros
                fillColor="rgba(255, 107, 53, 0.1)"
                strokeColor="rgba(255, 107, 53, 0.3)"
                strokeWidth={2}
              />
            )}
          </MapView>
        ) : (
          <View style={styles.mapPlaceholder}>
            <ActivityIndicator size="large" color="#FF6B35" />
            <Text style={styles.mapPlaceholderText}>Obtendo sua localização...</Text>
          </View>
        )}
        
        {/* Mensagem de busca */}
        {isOnline && (
          <View style={styles.searchingBanner}>
            <View style={styles.searchIconContainer}>
              <Ionicons name="search" size={18} color="#FF6B35" />
            </View>
            <Text style={styles.searchingText}>
              Estamos procurando rotas pra você
            </Text>
          </View>
        )}

        {!isOnline && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>
              Fique disponível para receber entregas
            </Text>
          </View>
        )}

        {/* Botões de ação do mapa */}
        <View style={styles.mapActions}>
          <TouchableOpacity style={styles.mapActionButton}>
            <Ionicons name="locate" size={20} color="#666" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.mapActionButton}>
            <Ionicons name="alert-circle-outline" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>

        {/* Botão compacto de ofertas (quando menu está fechado) */}
        {availableOffers.length > 0 && !showOffersMenu && (
          <TouchableOpacity 
            style={styles.compactOffersButton}
            onPress={() => setShowOffersMenu(true)}
            activeOpacity={0.8}
          >
            <View style={styles.compactOffersContent}>
              <View style={styles.compactOffersBadge}>
                <Text style={styles.compactOffersBadgeText}>{availableOffers.length}</Text>
              </View>
              <Ionicons name="flash" size={20} color="#FFF" />
              <Text style={styles.compactOffersText}>Novas ofertas</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* Card Principal com ScrollView */}
      <View style={styles.bottomCard}>
        <ScrollView 
          style={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {/* OFERTAS DISPONÍVEIS - NOVO (com controle de visibilidade) */}
          {availableOffers.length > 0 && showOffersMenu && (
            <View style={styles.offersSection}>
              <TouchableOpacity 
                style={styles.offersSectionHeader}
                onPress={() => setShowOffersMenu(false)}
                activeOpacity={0.7}
              >
                <View style={styles.offersSectionHeaderLeft}>
                  <Ionicons name="flash" size={20} color="#FF6B35" />
                  <Text style={styles.offersSectionTitle}>
                    Ofertas Disponíveis ({availableOffers.length})
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
              
              {availableOffers.map((offer) => (
                <DeliveryOfferCard
                  key={offer.id}
                  offer={offer}
                  partnerId={partnerIdFromFirebase || ''}
                  onAccepted={handleOfferAccepted}
                  onDeclined={handleOfferDeclined}
                />
              ))}
            </View>
          )}

          {/* Mensagem quando online mas sem ofertas */}
          {isOnline && availableOffers.length === 0 && (
            <View style={styles.noOffersCard}>
              <Ionicons name="search-outline" size={48} color="#CCC" />
              <Text style={styles.noOffersTitle}>Procurando entregas...</Text>
              <Text style={styles.noOffersText}>
                Você receberá uma notificação quando houver uma entrega disponível na sua região
              </Text>
            </View>
          )}

          {/* Seus Ganhos */}
          <View style={styles.earningsSection}>
            <View style={styles.earningsHeader}>
              <View style={styles.earningsTitle}>
                <Ionicons name="wallet-outline" size={20} color="#000" />
                <Text style={styles.earningsTitleText}>Seus ganhos</Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('Extrato' as never)}>
                <Text style={styles.seeMore}>Ver mais</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.earningsContent}>
              <View style={styles.earningItem}>
                <Text style={styles.earningLabel}>Ganhos do dia</Text>
                <Text style={styles.earningValue}>{formatCurrency(todayEarnings)}</Text>
              </View>
              <View style={styles.earningItem}>
                <Text style={styles.earningLabel}>Rotas aceitas</Text>
                <Text style={styles.earningValue}>{completedToday}</Text>
              </View>
            </View>
          </View>
          
          {/* Espaçamento para SafeArea inferior */}
          <View style={{ height: 120 }} />
        </ScrollView>
      </View>

      {/* Modal de Alerta de Nova Entrega */}
      {currentTrip && (
        <DeliveryAlertModal
          visible={showDeliveryAlert}
          onClose={() => {
            setShowDeliveryAlert(false);
            setCurrentTrip(null);
          }}
          trip={currentTrip}
          deliveryPersonId={usuarioLogado?.uid || ''}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  userInfo: {
    width: 40,
  },
  statusButton: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusButtonOnline: {
    backgroundColor: '#FF6B35',
  },
  statusButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  statusButtonTextActive: {
    color: '#FFF',
  },
  notificationButton: {
    width: 40,
    alignItems: 'flex-end',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  mapLoading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#E8F4F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapLoadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  mapPlaceholder: {
    flex: 1,
    backgroundColor: '#E8F4F8',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPlaceholderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  mapGrid: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.1,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: '#2196F3',
  },
  gridLineHorizontal: {
    width: '100%',
    height: 1,
  },
  gridLineVertical: {
    height: '100%',
    width: 1,
  },
  mapCenter: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -24 }, { translateY: -60 }],
    alignItems: 'center',
  },
  customMarker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 8,
  },
  locationInfo: {
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  locationText: {
    fontSize: 10,
    color: '#666',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  searchingBanner: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  searchIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF5F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  searchingText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  offlineBanner: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    backgroundColor: '#FFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  offlineText: {
    fontSize: 14,
    color: '#666',
  },
  mapActions: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    gap: 12,
  },
  mapActionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  compactOffersButton: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    backgroundColor: '#FF6B35',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  compactOffersContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compactOffersBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactOffersBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  compactOffersText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomCard: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -30,
    paddingTop: 8,
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollContent: {
    flex: 1,
  },
  promotionCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  promotionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  seeMore: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '500',
  },
  promotionContent: {
    gap: 8,
  },
  promotionValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  promotionDescription: {
    fontSize: 14,
    color: '#666',
  },
  promotionDetails: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 16,
  },
  promotionDetailItem: {
    flex: 1,
  },
  promotionDetailLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  promotionDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  promotionDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  promotionLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  promotionLocationText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  earningsSection: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  earningsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  earningsTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  earningsTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  earningsContent: {
    flexDirection: 'row',
    gap: 24,
  },
  earningItem: {
    flex: 1,
  },
  earningLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  earningValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  // Novos estilos para ofertas
  offersSection: {
    marginTop: 16,
  },
  offersSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
    backgroundColor: '#F8F8F8',
    borderRadius: 8,
    marginHorizontal: 16,
  },
  offersSectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  offersSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  noOffersCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  noOffersTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  noOffersText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DeliveryHomeScreen;

