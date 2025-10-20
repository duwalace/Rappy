import React from 'react';
import { 
  View, 
  ImageBackground, 
  TouchableOpacity, 
  Text, 
  StyleSheet,
  StatusBar 
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

  const handleGoogleLogin = () => {
    console.log('Login com Google - Entregador');
    // Implementar autenticação com Google para entregador
  };

  const handleFacebookLogin = () => {
    console.log('Login com Facebook - Entregador');
    // Implementar autenticação com Facebook para entregador
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      
      {/* Imagem de Fundo */}
      <ImageBackground
        source={{ 
          uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=800&fit=crop' 
        }}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* Botão de Voltar */}
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="chevron-back" size={28} color="white" />
        </TouchableOpacity>

        {/* Botão Flutuante de Ajuda */}
        <TouchableOpacity style={styles.helpButton} onPress={handleHelp}>
          <Ionicons name="help" size={24} color="white" />
        </TouchableOpacity>

        {/* Sheet de Ações */}
        <View style={styles.actionSheet}>
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
          
          {/* Seção de Login Social */}
          <View style={styles.socialSection}>
            <Text style={styles.socialText}>Acessar com</Text>
            
            <View style={styles.socialButtonsContainer}>
              <TouchableOpacity 
                style={styles.socialButton} 
                onPress={handleGoogleLogin}
              >
                <Ionicons name="logo-google" size={24} color="#DB4437" />
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.socialButton} 
                onPress={handleFacebookLogin}
              >
                <Ionicons name="logo-facebook" size={24} color="#4267B2" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  helpButton: {
    position: 'absolute',
    top: 60,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionSheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
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
  socialSection: {
    marginTop: 32,
    alignItems: 'center',
  },
  socialText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    textAlign: 'center',
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
  },
  socialButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
});

export default DeliveryAuthScreen;