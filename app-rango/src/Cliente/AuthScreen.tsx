import React from 'react';
import { 
  View, 
  ImageBackground, 
  TouchableOpacity, 
  Text, 
  StyleSheet,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { AuthStackParamList } from '../types/navigation';

import AuthButton from '../components/AuthButton';

const AuthScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<AuthStackParamList>>();

  const handleBack = () => {
    // Como agora é um modal, sempre podemos voltar para a tela principal
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleHelp = () => {
    console.log('Abrir ajuda');
    // Implementar navegação para tela de ajuda
  };

  const handleLogin = () => {
    navigation.navigate('Login' as never);
  };

  const handleRegister = () => {
    navigation.navigate('Signup' as never);
  };

  const handleDeliveryLogin = () => {
    navigation.navigate('DeliveryAuth' as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" />
      
      {/* Imagem de Fundo */}
      <ImageBackground
        source={{ 
          uri: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=800&fit=crop' 
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
          {/* Botões Principais */}
          <View style={styles.buttonsContainer}>
            <AuthButton
              title="Já tenho uma conta"
              variant="primary"
              onPress={handleLogin}
            />
            
            <AuthButton
              title="Criar nova conta"
              variant="secondary"
              onPress={handleRegister}
            />
            
            <AuthButton
              title="Seja entregador"
              variant="secondary"
              onPress={handleDeliveryLogin}
            />
          </View>
          
          {/* Informação */}
          <View style={styles.infoSection}>
            <Text style={styles.infoText}>
              Use seu e-mail e senha para acessar sua conta
            </Text>
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
  buttonsContainer: {
    gap: 16,
  },
  infoSection: {
    marginTop: 32,
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

export default AuthScreen;