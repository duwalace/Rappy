import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
// Remova CommonActions, não vamos mais precisar dele aqui
// import { CommonActions } from '@react-navigation/native';

import { signIn } from '../services/authService';

import AuthHeader from '../components/AuthHeader';
import FormInput from '../components/FormInput';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryLink from '../components/SecondaryLink';

const LoginScreen: React.FC = () => {
  const navigation = useNavigation();

  // Estados do formulário
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Estados para loading e erro
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isFormValid = email.trim() !== '' && password.trim() !== '';

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      const { user, role } = await signIn(email, password);
      console.log('Login bem-sucedido!', user.uid, 'Papel:', role);
      
      // O Firebase Auth vai disparar onAuthStateChanged automaticamente
      // e o AuthContext vai atualizar o estado, não precisa fazer login manual
      
      // A navegação será feita automaticamente quando o AuthContext atualizar
      console.log('✅ Login concluído, aguardando onAuthStateChanged...');
      
    } catch (err: any) {
      // Seu tratamento de erro (que já está ótimo)
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('E-mail ou senha inválidos.');
      } else {
        setError('Ocorreu um erro ao tentar fazer o login.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword' as never);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <AuthHeader />
          
          <View style={styles.content}>
            <Text style={styles.title}>Entrar na sua conta</Text>
            
            <View style={styles.form}>
              {/* Exibir erro se houver */}
              {error ? <Text style={styles.errorText}>{error}</Text> : null}
              
              <FormInput
                placeholder="E-mail"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
              />
              
              <FormInput
                placeholder="Senha"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={true}
              />
              
              <SecondaryLink
                text="Esqueci minha senha"
                onPress={handleForgotPassword}
                align="right"
              />
            </View>
            
            <View style={styles.buttonContainer}>
              <PrimaryButton
                title={loading ? "Entrando..." : "Entrar"}
                onPress={handleLogin}
                disabled={!isFormValid || loading}
              />
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 32,
  },
  form: {
    flex: 1,
  },
  buttonContainer: {
    paddingBottom: 20,
    marginBottom: 10,
  },
  errorText: {
    color: '#EA1D2C',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    backgroundColor: '#FFF5F5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
});

export default LoginScreen;