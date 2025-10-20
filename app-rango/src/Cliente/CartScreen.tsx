import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../contexts/CartContext';
import CartHeader from '../components/CartHeader';
import CartItem from '../components/CartItem';
import { HomeStackParamList } from '../types/navigation';

const CartScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { state, updateQuantity, removeItem, clearCart, getItemCount } = useCart();
  
  const { items, store, subtotal, deliveryFee, serviceFee, total } = state;
  const itemCount = getItemCount();

  const handleDismiss = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const handleClear = useCallback(() => {
    if (itemCount === 0) return;
    
    Alert.alert(
      'Limpar sacola',
      'Tem certeza que deseja remover todos os itens da sacola?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: clearCart,
        },
      ]
    );
  }, [itemCount, clearCart]);

  const handleUpdateQuantity = useCallback((id: string, quantity: number) => {
    updateQuantity(id, quantity);
  }, [updateQuantity]);

  const handleRemoveItem = useCallback((id: string) => {
    Alert.alert(
      'Remover item',
      'Deseja remover este item da sacola?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Remover',
          style: 'destructive',
          onPress: () => removeItem(id),
        },
      ]
    );
  }, [removeItem]);

  const handleAddMoreItems = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }, [navigation]);

  const handleContinue = useCallback(() => {
    // Navegar para checkout
    navigation.navigate('CheckoutAddress');
  }, [navigation]);

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  // Se não há itens no carrinho
  if (itemCount === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <CartHeader
          onDismiss={handleDismiss}
          onClear={handleClear}
          itemCount={itemCount}
        />
        
        <View style={styles.emptyContainer}>
          <Ionicons name="bag-outline" size={80} color="#CCC" />
          <Text style={styles.emptyTitle}>Sua sacola está vazia</Text>
          <Text style={styles.emptySubtitle}>
            Adicione itens do cardápio para começar seu pedido
          </Text>
          
          <TouchableOpacity
            style={styles.addItemsButton}
            onPress={handleAddMoreItems}
          >
            <Text style={styles.addItemsButtonText}>Explorar cardápio</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <CartHeader
        onDismiss={handleDismiss}
        onClear={handleClear}
        itemCount={itemCount}
      />
      
      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Informações da Loja */}
        {store && (
          <View style={styles.storeSection}>
            <View style={styles.storeHeader}>
              <Image source={{ uri: store.logo }} style={styles.storeLogo} />
              <View style={styles.storeInfo}>
                <Text style={styles.storeName}>{store.name}</Text>
                <Text style={styles.storeDeliveryTime}>{store.deliveryTime}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Lista de Itens */}
        <View style={styles.itemsSection}>
          <Text style={styles.sectionTitle}>Itens adicionados</Text>
          
          {items.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              onUpdateQuantity={handleUpdateQuantity}
              onRemove={handleRemoveItem}
            />
          ))}
          
          {/* Link para adicionar mais itens */}
          <TouchableOpacity
            style={styles.addMoreButton}
            onPress={handleAddMoreItems}
          >
            <Ionicons name="add-circle-outline" size={20} color="#EA1D2C" />
            <Text style={styles.addMoreText}>Adicionar mais itens</Text>
          </TouchableOpacity>
        </View>

        {/* Resumo de Valores */}
        <View style={styles.summarySection}>
          <Text style={styles.sectionTitle}>Resumo do pedido</Text>
          
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>{formatPrice(subtotal)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxa de entrega</Text>
              <Text style={styles.summaryValue}>{formatPrice(deliveryFee)}</Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Taxa de serviço</Text>
              <Text style={styles.summaryValue}>{formatPrice(serviceFee)}</Text>
            </View>
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(total)}</Text>
            </View>
          </View>
        </View>

        {/* Espaço para o rodapé fixo */}
        <View style={styles.footerSpacer} />
      </ScrollView>

      {/* Rodapé de Checkout Fixo */}
      <View style={styles.stickyFooter}>
        <View style={styles.footerContent}>
          <View style={styles.totalInfo}>
            <Text style={styles.totalInfoLabel}>Total com a entrega</Text>
            <Text style={styles.totalInfoValue}>{formatPrice(total)}</Text>
          </View>
          
          <TouchableOpacity
            style={styles.continueButton}
            onPress={handleContinue}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  scrollContent: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addItemsButton: {
    backgroundColor: '#EA1D2C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addItemsButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  storeSection: {
    backgroundColor: 'white',
    marginBottom: 8,
  },
  storeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  storeLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  storeDeliveryTime: {
    fontSize: 14,
    color: '#666',
  },
  itemsSection: {
    backgroundColor: 'white',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    padding: 16,
    paddingBottom: 8,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  addMoreText: {
    fontSize: 16,
    color: '#EA1D2C',
    fontWeight: '600',
    marginLeft: 8,
  },
  summarySection: {
    backgroundColor: 'white',
    marginBottom: 8,
  },
  summaryCard: {
    padding: 16,
    paddingTop: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666',
  },
  summaryValue: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    marginTop: 8,
    paddingTop: 16,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#EA1D2C',
  },
  footerSpacer: {
    height: 100,
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  footerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingBottom: 20,
  },
  totalInfo: {
    flex: 1,
  },
  totalInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  totalInfoValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  continueButton: {
    backgroundColor: '#EA1D2C',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 8,
    marginLeft: 16,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CartScreen;