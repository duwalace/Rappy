import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useCart } from '../contexts/CartContext';
import type { CompositeNavigationProp } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { HomeStackParamList } from '../types/navigation';

// Tipo de navegação que funciona tanto nas tabs quanto nos stacks
type TabNavigationProp = BottomTabNavigationProp<any>;
type StackNavigationProp = NativeStackNavigationProp<HomeStackParamList>;
type NavigationProp = CompositeNavigationProp<TabNavigationProp, StackNavigationProp>;

const FloatingCartButton: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { state, getItemCount } = useCart();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [showPreview, setShowPreview] = useState(false);
  
  const itemCount = getItemCount();
  const { total, items, store } = state;
  
  // Obter a rota atual de forma mais robusta
  const currentRouteName = useNavigationState(state => {
    if (!state) return '';
    
    // Navegar pelo estado para encontrar a rota ativa mais profunda
    let route = state.routes[state.index];
    
    while (route.state) {
      route = route.state.routes[route.state.index];
    }
    
    return route.name;
  });
  
  // Não mostrar se não houver itens
  if (itemCount === 0) {
    return null;
  }
  
  // Não mostrar na tela do carrinho, produto e telas de checkout
  const hiddenRoutes = [
    'Product',          // Tela de detalhes do produto
    'Cart',             // Tela do carrinho
    'CheckoutAddress',  // Escolha de endereço
    'CheckoutPayment',  // Forma de pagamento
    'CheckoutReview',   // Revisão do pedido
    'OrderConfirmation', // Confirmação do pedido
    'OrderDetails'      // Detalhes do pedido
  ];
  
  if (hiddenRoutes.includes(currentRouteName)) {
    return null;
  }
  
  const handlePress = () => {
    // @ts-ignore - navegação funciona mesmo com tipos diferentes
    navigation.navigate('Início', { 
      screen: 'Cart' 
    });
  };
  
  const handleLongPress = () => {
    setShowPreview(true);
  };
  
  // Calcular largura responsiva
  const maxAppWidth = Platform.OS === 'web' ? Math.min(windowWidth, 768) : windowWidth;
  const buttonWidth = maxAppWidth - 32; // 16px de margem de cada lado
  
  // Altura da tab bar (aproximadamente) + espaço adicional + safe area bottom
  const tabBarHeight = 60;
  const bottomOffset = tabBarHeight + 10 + insets.bottom; // 10px de espaço acima da tab bar
  
  return (
    <>
      <View 
        style={[
          styles.container,
          {
            bottom: bottomOffset,
          },
          Platform.OS === 'web' && {
            maxWidth: 768,
            alignSelf: 'center',
            width: '100%',
          }
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[
            styles.button,
            {
              width: buttonWidth,
            }
          ]}
          onPress={handlePress}
          onLongPress={handleLongPress}
          activeOpacity={0.8}
        >
        {/* Lado esquerdo: Ícone e quantidade */}
        <View style={styles.leftSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="cart" size={24} color="#FFFFFF" />
            {itemCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {itemCount > 99 ? '99+' : itemCount}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.infoContainer}>
            <Text style={styles.itemCountText}>
              {itemCount} {itemCount === 1 ? 'item' : 'itens'}
            </Text>
            {state.store && (
              <Text style={styles.storeName} numberOfLines={1}>
                {state.store.name}
              </Text>
            )}
          </View>
        </View>
        
        {/* Lado direito: Total e seta */}
        <View style={styles.rightSection}>
          <Text style={styles.totalText}>
            R$ {total.toFixed(2).replace('.', ',')}
          </Text>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </View>
      </TouchableOpacity>
    </View>
    
    {/* Modal de Preview Rápido */}
    <Modal
      visible={showPreview}
      transparent
      animationType="fade"
      onRequestClose={() => setShowPreview(false)}
    >
      <TouchableOpacity 
        style={[
          styles.modalOverlay,
          {
            paddingBottom: bottomOffset,
          }
        ]}
        activeOpacity={1}
        onPress={() => setShowPreview(false)}
      >
        <View 
          style={[
            styles.previewContainer,
            Platform.OS === 'web' && {
              maxWidth: 768,
              alignSelf: 'center',
              width: '100%',
            }
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header do Preview */}
          <View style={styles.previewHeader}>
            <View style={styles.previewHeaderLeft}>
              <Ionicons name="cart" size={20} color="#333" />
              <Text style={styles.previewTitle}>Sua Sacola</Text>
            </View>
            <TouchableOpacity onPress={() => setShowPreview(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>
          
          {/* Loja */}
          {store && (
            <View style={styles.storeInfo}>
              <Image 
                source={{ uri: store.logo }} 
                style={styles.storeLogo}
              />
              <View style={styles.storeDetails}>
                <Text style={styles.storeNameText}>{store.name}</Text>
                <Text style={styles.storeTimeText}>
                  {store.deliveryTime} • Taxa: R$ {store.deliveryFee.toFixed(2)}
                </Text>
              </View>
            </View>
          )}
          
          {/* Lista de Itens */}
          <ScrollView style={styles.itemsList}>
            {items.map((item, index) => (
              <View key={`${item.id}-${index}`} style={styles.previewItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemQuantity}>{item.quantity}x</Text>
                  <View style={styles.itemDetails}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.observations && (
                      <Text style={styles.itemObservations}>{item.observations}</Text>
                    )}
                  </View>
                </View>
                <Text style={styles.itemPrice}>
                  R$ {(item.price * item.quantity).toFixed(2)}
                </Text>
              </View>
            ))}
          </ScrollView>
          
          {/* Total e Botão */}
          <View style={styles.previewFooter}>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                R$ {total.toFixed(2).replace('.', ',')}
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.viewCartButton}
              onPress={() => {
                setShowPreview(false);
                handlePress();
              }}
            >
              <Text style={styles.viewCartButtonText}>Ver Sacola Completa</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  </> 
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    zIndex: 999,
    elevation: 999,
  },
  button: {
    backgroundColor: '#EA1D2C',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    position: 'relative',
    marginRight: 12,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    color: '#EA1D2C',
    fontSize: 11,
    fontWeight: '700',
  },
  infoContainer: {
    flex: 1,
  },
  itemCountText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  storeName: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.9,
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  totalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  // Estilos do Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  previewContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  previewHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  storeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F8F8F8',
    gap: 12,
  },
  storeLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#E5E5E5',
  },
  storeDetails: {
    flex: 1,
  },
  storeNameText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  storeTimeText: {
    fontSize: 13,
    color: '#666',
  },
  itemsList: {
    maxHeight: 250,
  },
  previewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  itemInfo: {
    flexDirection: 'row',
    flex: 1,
    gap: 8,
  },
  itemQuantity: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EA1D2C',
    minWidth: 30,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  itemObservations: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  previewFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EA1D2C',
  },
  viewCartButton: {
    backgroundColor: '#EA1D2C',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  viewCartButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default FloatingCartButton;

