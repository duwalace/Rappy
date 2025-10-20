import React from 'react';
import { 
  View, 
  ImageBackground, 
  TouchableOpacity, 
  Text, 
  StyleSheet,
  StatusBar,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import AuthButton from '../components/AuthButton';

const DeliveryAuthScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleHelp = () => {
    console.log('Abrir ajuda');
    // Implementar navegação para tela de ajuda
  };

  const handleLogin = () => {
    navigation.navigate('DeliveryLogin' as never);
  };

  const handleRegister = () => {
    navigation.navigate('DeliverySignup' as never);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Área Superior com Imagem */}
      <View style={styles.topSection}>
        <ImageBackground
          source={require('../../assets/delivery-bg.png')}
          style={styles.imageContainer}
          resizeMode="cover"
        >
          {/* Botões no topo */}
          <SafeAreaView style={styles.safeArea}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="chevron-back" size={28} color="white" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.helpButton} onPress={handleHelp}>
              <Ionicons name="help" size={24} color="white" />
            </TouchableOpacity>
          </SafeAreaView>
        </ImageBackground>
      </View>

      {/* Sheet de Ações */}
      <SafeAreaView style={styles.bottomSafeArea} edges={['bottom']}>
        <View style={styles.actionSheet}>
          <ScrollView 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Título da seção */}
            <View style={styles.headerSection}>
              <Ionicons name="bicycle" size={32} color="#EA1D2C" />
              <Text style={styles.headerTitle}>Área do Entregador</Text>
              <Text style={styles.headerSubtitle}>
                Faça parte da nossa equipe de entregadores e ganhe dinheiro no seu tempo livre
              </Text>
            </View>

            {/* Botões Principais */}
            <View style={styles.buttonsContainer}>
              <AuthButton
                title="Já sou entregador"
                variant="primary"
                onPress={handleLogin}
              />
              
              <AuthButton
                title="Quero ser entregador"
                variant="secondary"
                onPress={handleRegister}
              />
            </View>
            
            {/* Informação */}
            <View style={styles.infoSection}>
              <Text style={styles.infoText}>
                Use seu e-mail e senha para acessar sua conta de entregador
              </Text>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  topSection: {
    flex: 0.5, // 50% da tela para a imagem
    minHeight: 300, // Altura mínima para web
  },
  imageContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#EA1D2C', // Fallback caso a imagem não carregue
  },
  safeArea: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSafeArea: {
    flex: 0.5, // 50% da tela para o card
  },
  actionSheet: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32, // Espaço extra na parte inferior
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonsContainer: {
    gap: 16,
  },
  infoSection: {
    marginTop: 32,
    marginBottom: 16, // Espaço extra antes dos botões do celular
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default DeliveryAuthScreen;