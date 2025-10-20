import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { PaymentMethod } from '../types/shared';
import PaymentMethodCard from '../components/PaymentMethodCard';

type PaymentMethodOption = {
  id: PaymentMethod;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
  available: boolean;
};

const CheckoutPaymentScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  
  const { selectedAddress } = route.params;

  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [changeFor, setChangeFor] = useState('');

  const paymentMethods: PaymentMethodOption[] = [
    {
      id: 'cash',
      name: 'Dinheiro',
      icon: 'cash-outline',
      description: 'Pague na entrega',
      available: true,
    },
    {
      id: 'pix',
      name: 'PIX',
      icon: 'qr-code-outline',
      description: 'Pagamento instantâneo',
      available: false, // Mock inicial
    },
    {
      id: 'credit_card',
      name: 'Cartão de Crédito',
      icon: 'card-outline',
      description: 'Visa, Master, Elo',
      available: false, // Mock inicial
    },
    {
      id: 'debit_card',
      name: 'Cartão de Débito',
      icon: 'card-outline',
      description: 'Débito na entrega',
      available: false, // Mock inicial
    },
  ];

  const handleSelectPayment = (paymentMethod: PaymentMethod, available: boolean) => {
    if (!available) {
      Alert.alert(
        'Em breve',
        'Esta forma de pagamento estará disponível em breve. Por enquanto, use Dinheiro.'
      );
      return;
    }
    setSelectedPayment(paymentMethod);
  };

  const handleContinue = () => {
    if (!selectedPayment) {
      Alert.alert('Atenção', 'Por favor, selecione uma forma de pagamento');
      return;
    }

    if (selectedPayment === 'cash' && changeFor && parseFloat(changeFor) === 0) {
      Alert.alert('Atenção', 'Por favor, informe o valor para troco');
      return;
    }

    navigation.navigate('CheckoutReview', {
      selectedAddress,
      selectedPayment,
      changeFor: selectedPayment === 'cash' ? changeFor : null,
    });
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
        <Text style={styles.headerTitle}>Forma de Pagamento</Text>
      </View>

      {/* Instruction */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          Como você vai pagar?
        </Text>
      </View>

      <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Lista de Formas de Pagamento */}
        <View style={styles.paymentList}>
          {paymentMethods.map((method) => (
            <PaymentMethodCard
              key={method.id}
              method={method}
              isSelected={selectedPayment === method.id}
              onPress={() => handleSelectPayment(method.id, method.available)}
            />
          ))}
        </View>

        {/* Campo de Troco (apenas se Dinheiro selecionado) */}
        {selectedPayment === 'cash' && (
          <View style={styles.changeContainer}>
            <Text style={styles.changeLabel}>Precisa de troco?</Text>
            <Text style={styles.changeSubtext}>
              Informe o valor para facilitar a entrega
            </Text>
            <View style={styles.changeInputContainer}>
              <Text style={styles.currencySymbol}>R$</Text>
              <TextInput
                style={styles.changeInput}
                placeholder="0,00"
                value={changeFor}
                onChangeText={setChangeFor}
                keyboardType="numeric"
              />
            </View>
            <Text style={styles.changeHint}>
              Deixe em branco se não precisar de troco
            </Text>
          </View>
        )}

        <View style={styles.spacer} />
      </ScrollView>

      {/* Footer Fixo com Botão Continuar */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !selectedPayment && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          disabled={!selectedPayment}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Revisar Pedido</Text>
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
  scrollContent: {
    flex: 1,
  },
  paymentList: {
    padding: 16,
    gap: 12,
  },
  changeContainer: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    borderRadius: 12,
  },
  changeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  changeSubtext: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  changeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F8F8',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  changeInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    paddingVertical: 12,
  },
  changeHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  spacer: {
    height: 100,
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

export default CheckoutPaymentScreen;

