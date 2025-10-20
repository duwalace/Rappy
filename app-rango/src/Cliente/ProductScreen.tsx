import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useCart } from '../contexts/CartContext';
import QuantityStepper from '../components/QuantityStepper';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.4;

const ProductScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { product, store } = route.params as any;
  const { addItem, setStore } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [observations, setObservations] = useState('');

  const maxObservations = 140;
  
  // Normalizar o preço (pode ser número ou string formatada)
  const unitPrice = typeof product.price === 'number' 
    ? product.price 
    : parseFloat(String(product.price).replace('R$ ', '').replace(',', '.')) || 0;
  
  const totalPrice = unitPrice * quantity;

  const handleIncreaseQuantity = useCallback(() => {
    setQuantity(prev => Math.min(prev + 1, 99));
  }, []);

  const handleDecreaseQuantity = useCallback(() => {
    setQuantity(prev => Math.max(prev - 1, 1));
  }, []);

  const handleAddToCart = useCallback(() => {
    try {
      // Normalizar deliveryFee (pode ser número ou string)
      let normalizedDeliveryFee = 0;
      if (typeof store.deliveryFee === 'number') {
        normalizedDeliveryFee = store.deliveryFee;
      } else if (typeof store.deliveryFee === 'string') {
        normalizedDeliveryFee = parseFloat(store.deliveryFee.replace('R$ ', '').replace(',', '.')) || 0;
      }

      // Configurar a loja no contexto se ainda não estiver definida
      setStore({
        id: store.id,
        name: store.name,
        logo: store.logo,
        deliveryTime: store.deliveryTime,
        deliveryFee: normalizedDeliveryFee,
      });

      // Adicionar item ao carrinho
      addItem({
        id: `${product.id}-${Date.now()}`,
        name: product.name,
        description: product.description,
        price: unitPrice,
        image: product.image,
        observations: observations.trim(),
        storeId: store.id,
        storeName: store.name,
        quantity,
      });

      // Navegar diretamente para o CartScreen
      console.log('Navegando para Cart...');
      navigation.navigate('Cart' as never);
    } catch (error) {
      console.error('Erro ao adicionar ao carrinho:', error);
      Alert.alert('Erro', 'Não foi possível adicionar o item ao carrinho.');
    }
  }, [product, store, quantity, observations, addItem, setStore, navigation]);

  const formatPrice = (price: number) => {
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Imagem Principal com Header Flutuante */}
      <View style={styles.imageSection}>
        <Image source={{ uri: product.image }} style={styles.productImage} />
        
        {/* Header Flutuante */}
        <View style={styles.floatingHeader}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            }}
          >
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {/* Implementar compartilhar */}}
          >
            <Ionicons name="share-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Conteúdo Rolável */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Informações do Produto */}
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDescription}>{product.description}</Text>
          <Text style={styles.productPrice}>{formatPrice(unitPrice)}</Text>
        </View>

        {/* Observações */}
        <View style={styles.observationsSection}>
          <Text style={styles.sectionTitle}>Observações</Text>
          <Text style={styles.observationsHint}>
            Alguma observação? Não se preocupe, o restaurante sempre pode entrar em contato.
          </Text>
          
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.observationsInput}
              placeholder="Ex: tirar cebola, maionese à parte, ponto da carne..."
              placeholderTextColor="#999"
              value={observations}
              onChangeText={setObservations}
              multiline
              maxLength={maxObservations}
              textAlignVertical="top"
            />
            <Text style={styles.characterCount}>
              {observations.length}/{maxObservations}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Footer Fixo */}
      <View style={styles.footer}>
        <View style={styles.quantitySection}>
          <QuantityStepper
            quantity={quantity}
            onIncrease={handleIncreaseQuantity}
            onDecrease={handleDecreaseQuantity}
          />
        </View>

        <View style={styles.addButtonSection}>
          {/* Botão de Adicionar */}
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.addButtonText}>
              Adicionar à Sacola • {formatPrice(totalPrice)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  imageSection: {
    height: IMAGE_HEIGHT,
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  floatingHeader: {
    position: 'absolute',
    top: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 12,
  },
  productPrice: {
    fontSize: 20,
    fontWeight: '700',
    color: '#EA1D2C',
  },
  observationsSection: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  observationsHint: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  textInputContainer: {
    position: 'relative',
  },
  observationsInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 80,
    maxHeight: 120,
  },
  characterCount: {
    position: 'absolute',
    bottom: 8,
    right: 12,
    fontSize: 12,
    color: '#999',
  },
  footer: {
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
    padding: 16,
    paddingBottom: 20,
  },
  quantitySection: {
    marginRight: 16,
  },
  addButtonSection: {
    flex: 1,
  },
  addButton: {
    backgroundColor: '#EA1D2C',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProductScreen;