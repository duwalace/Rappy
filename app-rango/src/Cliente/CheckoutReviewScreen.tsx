import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../contexts/CartContext';
import { useAuth } from '../contexts/AuthContext';
import { createOrder } from '../services/orderService';
import { CreateOrderData, OrderItem } from '../types/shared';
import OrderSummaryCard from '../components/OrderSummaryCard';

const CheckoutReviewScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { state: cart, clearCart } = useCart();
  const { usuarioLogado: user } = useAuth();

  const { selectedAddress, selectedPayment, changeFor } = route.params;

  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  const formatPaymentMethod = (method: string) => {
    const methods: Record<string, string> = {
      cash: 'Dinheiro',
      pix: 'PIX',
      credit_card: 'Cartão de Crédito',
      debit_card: 'Cartão de Débito',
    };
    return methods[method] || method;
  };

  const calculateEstimatedTime = (): Date => {
    const now = new Date();
    // Adicionar 30-45 minutos ao horário atual (mock)
    const minutes = 30 + Math.floor(Math.random() * 15);
    now.setMinutes(now.getMinutes() + minutes);
    return now;
  };

  const handleConfirmOrder = async () => {
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    if (!cart.store) {
      Alert.alert('Erro', 'Loja não identificada');
      return;
    }

    if (cart.items.length === 0) {
      Alert.alert('Erro', 'Carrinho vazio');
      return;
    }

    try {
      setLoading(true);

      // Mapear itens do carrinho para OrderItem
      const orderItems: OrderItem[] = cart.items.map((item) => ({
        id: item.id,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        observations: item.observations,
        subtotal: item.price * item.quantity,
      }));

      const orderData: CreateOrderData = {
        storeId: cart.store.id,
        storeName: cart.store.name,
        customerId: user.uid,
        customerName: user.nome || 'Cliente',
        customerPhone: user.phone || '',
        customerEmail: user.email || undefined,
        items: orderItems,
        subtotal: cart.subtotal,
        deliveryFee: cart.deliveryFee,
        serviceFee: cart.serviceFee,
        total: cart.total,
        status: 'pending',
        paymentMethod: selectedPayment,
        deliveryAddress: {
          street: selectedAddress.street,
          number: selectedAddress.number,
          neighborhood: selectedAddress.neighborhood,
          city: selectedAddress.city,
          state: selectedAddress.state,
          zipCode: selectedAddress.zipCode,
          complement: selectedAddress.complement,
        },
        deliveryInstructions: deliveryInstructions || undefined,
        estimatedDeliveryTime: calculateEstimatedTime(),
      };

      console.log('📦 Criando pedido:', orderData);

      const orderId = await createOrder(orderData);

      console.log('✅ Pedido criado com sucesso:', orderId);

      // Limpar carrinho
      clearCart();

      // Navegar para confirmação
      navigation.navigate('OrderConfirmation', { orderId });
    } catch (error: any) {
      console.error('❌ Erro ao criar pedido:', error);
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível criar o pedido. Tente novamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Revisar Pedido</Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Endereço de Entrega */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="location" size={20} color="#EA1D2C" />
            <Text style={styles.sectionTitle}>Endereço de Entrega</Text>
          </View>
          <View style={styles.addressCard}>
            <Text style={styles.addressLabel}>{selectedAddress.label}</Text>
            <Text style={styles.addressText}>
              {selectedAddress.street}, {selectedAddress.number}
              {selectedAddress.complement ? ` - ${selectedAddress.complement}` : ''}
            </Text>
            <Text style={styles.addressText}>
              {selectedAddress.neighborhood} - {selectedAddress.city}/{selectedAddress.state}
            </Text>
            <Text style={styles.addressCEP}>CEP: {selectedAddress.zipCode}</Text>
          </View>
        </View>

        {/* Forma de Pagamento */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card" size={20} color="#EA1D2C" />
            <Text style={styles.sectionTitle}>Forma de Pagamento</Text>
          </View>
          <View style={styles.paymentCard}>
            <Text style={styles.paymentMethod}>
              {formatPaymentMethod(selectedPayment)}
            </Text>
            {selectedPayment === 'cash' && changeFor && (
              <Text style={styles.paymentDetail}>Troco para: R$ {changeFor}</Text>
            )}
          </View>
        </View>

        {/* Instruções de Entrega */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="chatbubble-outline" size={20} color="#EA1D2C" />
            <Text style={styles.sectionTitle}>Instruções de Entrega (Opcional)</Text>
          </View>
          <TextInput
            style={styles.instructionsInput}
            placeholder="Ex: Tocar a campainha, Deixar na portaria..."
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
          <Text style={styles.characterCount}>
            {deliveryInstructions.length}/200
          </Text>
        </View>

        {/* Resumo do Pedido */}
        <OrderSummaryCard
          items={cart.items}
          storeName={cart.store?.name || ''}
          subtotal={cart.subtotal}
          deliveryFee={cart.deliveryFee}
          serviceFee={cart.serviceFee}
          total={cart.total}
        />

        <View style={styles.spacer} />
      </ScrollView>

      {/* Footer Fixo com Botão Confirmar */}
      <View style={styles.footer}>
        <View style={styles.footerContent}>
          <View style={styles.totalInfo}>
            <Text style={styles.totalLabel}>Total do Pedido</Text>
            <Text style={styles.totalValue}>{formatPrice(cart.total)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.confirmButton, loading && styles.confirmButtonDisabled]}
            onPress={handleConfirmOrder}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.confirmButtonText}>Confirmar Pedido</Text>
                <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  backButton: {
    padding: 4,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  scrollContent: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  addressCard: {
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  addressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EA1D2C',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  addressCEP: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  paymentCard: {
    backgroundColor: '#F8F8F8',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  paymentMethod: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
  },
  paymentDetail: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  instructionsInput: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  spacer: {
    height: 120,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  footerContent: {
    gap: 12,
  },
  totalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EA1D2C',
  },
  confirmButton: {
    backgroundColor: '#EA1D2C',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmButtonDisabled: {
    backgroundColor: '#CCC',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CheckoutReviewScreen;

