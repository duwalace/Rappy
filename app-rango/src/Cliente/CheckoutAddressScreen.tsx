import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/AuthContext';
import { getAddresses } from '../services/addressService';
import { Address } from '../types/profile';
import AddressSelectionCard from '../components/AddressSelectionCard';

const CheckoutAddressScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const { usuarioLogado: user } = useAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Recarregar endereços quando a tela ganhar foco
  useFocusEffect(
    useCallback(() => {
      loadAddresses();
    }, [user?.uid])
  );

  const loadAddresses = async () => {
    if (!user?.uid) {
      console.log('❌ CheckoutAddress: Usuário não autenticado');
      Alert.alert('Erro', 'Usuário não autenticado');
      navigation.goBack();
      return;
    }

    try {
      setLoading(true);
      console.log('📍 CheckoutAddress: Carregando endereços para usuário:', user.uid);
      const data = await getAddresses(user.uid);
      console.log('✅ CheckoutAddress: Endereços carregados:', data.length);
      console.log('📋 Endereços:', data);
      setAddresses(data);

      // Selecionar endereço padrão automaticamente
      const defaultAddress = data.find((addr) => addr.isDefault);
      if (defaultAddress) {
        console.log('🎯 Endereço padrão selecionado:', defaultAddress.street);
        setSelectedAddress(defaultAddress);
      }
    } catch (error: any) {
      console.error('❌ CheckoutAddress: Erro ao carregar endereços:', error);
      Alert.alert('Erro', error.message || 'Não foi possível carregar os endereços');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAddress = (address: Address) => {
    setSelectedAddress(address);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAddresses();
    setRefreshing(false);
  };

  const handleAddNewAddress = () => {
    navigation.navigate('AddAddress', {
      returnTo: 'CheckoutAddress',
    });
  };

  const handleContinue = () => {
    if (!selectedAddress) {
      Alert.alert('Atenção', 'Por favor, selecione um endereço de entrega');
      return;
    }

    navigation.navigate('CheckoutPayment', {
      selectedAddress,
    });
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Endereço de Entrega</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA1D2C" />
          <Text style={styles.loadingText}>Carregando endereços...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Endereço de Entrega</Text>
      </View>

      {/* Instruction */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          Para onde devemos entregar seu pedido?
        </Text>
      </View>

      {/* Lista de Endereços */}
      <FlatList
        data={addresses}
        renderItem={({ item }) => (
          <AddressSelectionCard
            address={item}
            isSelected={selectedAddress?.id === item.id}
            onPress={() => handleSelectAddress(item)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#EA1D2C']}
            tintColor="#EA1D2C"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Nenhum endereço cadastrado</Text>
            <Text style={styles.emptySubtext}>
              Adicione um endereço para continuar
            </Text>
          </View>
        }
      />

      {/* Botão Adicionar Novo Endereço */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={handleAddNewAddress}
        activeOpacity={0.8}
      >
        <Ionicons name="add-circle-outline" size={20} color="#EA1D2C" />
        <Text style={styles.addButtonText}>Adicionar Novo Endereço</Text>
      </TouchableOpacity>

      {/* Footer Fixo com Botão Continuar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedAddress && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedAddress}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continuar para Pagamento</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
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
  instructionContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EA1D2C',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: '#EA1D2C',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
  continueButton: {
    backgroundColor: '#EA1D2C',
    borderRadius: 8,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  continueButtonDisabled: {
    backgroundColor: '#CCC',
  },
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default CheckoutAddressScreen;

