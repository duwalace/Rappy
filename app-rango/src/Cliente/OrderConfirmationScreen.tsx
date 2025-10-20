import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { getOrderById } from '../services/orderService';
import { Order } from '../types/shared';

const OrderConfirmationScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [scaleAnim] = useState(new Animated.Value(0));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadOrder();
    playSuccessAnimation();
  }, []);

  const loadOrder = async () => {
    try {
      const orderData = await getOrderById(orderId);
      setOrder(orderData);
    } catch (error) {
      console.error('Erro ao carregar pedido:', error);
    }
  };

  const playSuccessAnimation = () => {
    // Animação de escala do ícone de sucesso
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 3,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleTrackOrder = () => {
    navigation.navigate('Pedidos');
  };

  const handleBackToHome = () => {
    navigation.navigate('Início');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        {/* Ícone de Sucesso Animado */}
        <Animated.View
          style={[
            styles.successIconContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark" size={60} color="#FFF" />
          </View>
        </Animated.View>

        {/* Mensagem de Sucesso */}
        <Animated.View style={[styles.messageContainer, { opacity: fadeAnim }]}>
          <Text style={styles.successTitle}>Pedido Confirmado! 🎉</Text>
          <Text style={styles.successSubtitle}>
            Seu pedido foi enviado para o restaurante
          </Text>

          {/* Informações do Pedido */}
          {order && (
            <View style={styles.orderInfoCard}>
              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Número do Pedido</Text>
                <Text style={styles.orderInfoValue}>#{order.id.slice(-6).toUpperCase()}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.orderInfoRow}>
                <Text style={styles.orderInfoLabel}>Restaurante</Text>
                <Text style={styles.orderInfoValue}>{order.storeName}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.orderInfoRow}>
                <Ionicons name="time-outline" size={18} color="#EA1D2C" />
                <Text style={styles.deliveryEstimate}>
                  Previsão de entrega: {formatTime(order.estimatedDeliveryTime)}
                </Text>
              </View>
            </View>
          )}

          {/* Ícones de Status */}
          <View style={styles.statusIcons}>
            <View style={styles.statusIcon}>
              <View style={[styles.statusIconCircle, styles.statusActive]}>
                <Ionicons name="restaurant" size={24} color="#EA1D2C" />
              </View>
              <Text style={styles.statusLabel}>Preparando</Text>
            </View>

            <View style={styles.statusLine} />

            <View style={styles.statusIcon}>
              <View style={styles.statusIconCircle}>
                <Ionicons name="bicycle" size={24} color="#CCC" />
              </View>
              <Text style={[styles.statusLabel, styles.statusInactive]}>A caminho</Text>
            </View>

            <View style={styles.statusLine} />

            <View style={styles.statusIcon}>
              <View style={styles.statusIconCircle}>
                <Ionicons name="home" size={24} color="#CCC" />
              </View>
              <Text style={[styles.statusLabel, styles.statusInactive]}>Entregue</Text>
            </View>
          </View>

          {/* Mensagem de Acompanhamento */}
          <View style={styles.trackingMessage}>
            <Ionicons name="notifications-outline" size={20} color="#666" />
            <Text style={styles.trackingText}>
              Você receberá notificações sobre o status do seu pedido
            </Text>
          </View>
        </Animated.View>
      </View>

      {/* Botões de Ação */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.trackButton}
          onPress={handleTrackOrder}
          activeOpacity={0.8}
        >
          <Ionicons name="location" size={20} color="#FFF" />
          <Text style={styles.trackButtonText}>Acompanhar Pedido</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.homeButton}
          onPress={handleBackToHome}
          activeOpacity={0.8}
        >
          <Text style={styles.homeButtonText}>Voltar para Início</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  successIconContainer: {
    marginBottom: 24,
  },
  successIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  messageContainer: {
    alignItems: 'center',
    width: '100%',
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  orderInfoCard: {
    width: '100%',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  orderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  orderInfoLabel: {
    fontSize: 14,
    color: '#666',
  },
  orderInfoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 4,
  },
  deliveryEstimate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EA1D2C',
    marginLeft: 8,
  },
  statusIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    marginBottom: 24,
  },
  statusIcon: {
    alignItems: 'center',
    flex: 1,
  },
  statusIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusActive: {
    backgroundColor: '#FFE5E5',
  },
  statusLabel: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  statusInactive: {
    color: '#999',
  },
  statusLine: {
    width: 30,
    height: 2,
    backgroundColor: '#E0E0E0',
    marginBottom: 30,
  },
  trackingMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F7FF',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  trackingText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  trackButton: {
    backgroundColor: '#EA1D2C',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  homeButton: {
    backgroundColor: 'transparent',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: '#EA1D2C',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OrderConfirmationScreen;

