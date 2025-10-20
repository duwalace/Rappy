import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { createStore } from '@/services/storeService';
import { fetchAddressByCEP, formatCEP, isValidCEP } from '@/services/cepService';
import { geocodeAddress, areValidCoordinates } from '@/services/geocodingService';
import { getStoreTypes, StoreType } from '@/services/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
  Store, 
  User, 
  Mail, 
  Lock, 
  Phone, 
  MapPin, 
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  AlertCircle,
  Utensils,
  Home,
  FileText,
  Loader2,
  Navigation
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Progress } from '@/components/ui/progress';
import loginBg from '@/assets/login-bg.jpg';

export default function Register() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Estados para CEP e Geolocalização
  const [loadingCEP, setLoadingCEP] = useState(false);
  const [loadingGeocode, setLoadingGeocode] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  // Estado para categorias
  const [storeTypes, setStoreTypes] = useState<StoreType[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Dados da conta
  const [accountData, setAccountData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: ''
  });

  // Dados da loja
  const [storeData, setStoreData] = useState({
    storeName: '',
    description: '',
    category: '',
    phone: '',
    email: '',
    website: ''
  });

  // Endereço
  const [addressData, setAddressData] = useState({
    street: '',
    number: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: ''
  });

  // Delivery
  const [deliveryData, setDeliveryData] = useState({
    deliveryTime: '30-45 min',
    deliveryFee: '5.99',
    freeDeliveryMinValue: '30.00',
    deliveryRadius: '5'
  });

  // Horário de funcionamento
  const [operatingHours, setOperatingHours] = useState({
    monday: { open: '09:00', close: '18:00', isOpen: true },
    tuesday: { open: '09:00', close: '18:00', isOpen: true },
    wednesday: { open: '09:00', close: '18:00', isOpen: true },
    thursday: { open: '09:00', close: '18:00', isOpen: true },
    friday: { open: '09:00', close: '18:00', isOpen: true },
    saturday: { open: '09:00', close: '14:00', isOpen: true },
    sunday: { open: '09:00', close: '14:00', isOpen: false }
  });

  const steps = [
    { 
      title: 'Dados Pessoais', 
      description: 'Informações da sua conta',
      icon: User,
      color: 'text-red-600'
    },
    { 
      title: 'Sua Loja', 
      description: 'Informações do estabelecimento',
      icon: Store,
      color: 'text-orange-600'
    },
    { 
      title: 'Endereço', 
      description: 'Localização da loja',
      icon: MapPin,
      color: 'text-yellow-600'
    },
    { 
      title: 'Funcionamento', 
      description: 'Horários e delivery',
      icon: Clock,
      color: 'text-green-600'
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  // Carregar categorias do Firestore
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const types = await getStoreTypes();
        // Filtrar apenas categorias ativas
        const activeTypes = types.filter(type => type.isActive);
        setStoreTypes(activeTypes);
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        toast({
          title: 'Erro ao carregar categorias',
          description: 'Não foi possível carregar as categorias disponíveis',
          variant: 'destructive'
        });
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Funções de formatação
  const formatPhone = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 11 dígitos
    const limited = numbers.slice(0, 11);
    
    // Aplica a máscara
    if (limited.length <= 2) {
      return limited;
    } else if (limited.length <= 6) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
    } else if (limited.length <= 10) {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 6)}-${limited.slice(6)}`;
    } else {
      return `(${limited.slice(0, 2)}) ${limited.slice(2, 7)}-${limited.slice(7, 11)}`;
    }
  };

  const formatCEPInput = (value: string) => {
    // Remove tudo que não é número
    const numbers = value.replace(/\D/g, '');
    
    // Limita a 8 dígitos
    const limited = numbers.slice(0, 8);
    
    // Aplica a máscara (12345-678)
    if (limited.length <= 5) {
      return limited;
    } else {
      return `${limited.slice(0, 5)}-${limited.slice(5, 8)}`;
    }
  };

  // Validações em tempo real
  const validateEmail = (email: string) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePhone = (phone: string) => {
    // Remove caracteres não numéricos para validar
    const numbers = phone.replace(/\D/g, '');
    // Telefone deve ter 10 ou 11 dígitos (com DDD)
    return numbers.length === 10 || numbers.length === 11;
  };

  const validatePassword = (password: string) => {
    return password.length >= 6;
  };

  const handleFieldChange = (field: string, value: string, section: string) => {
    // Aplicar formatação automática para campos específicos
    let formattedValue = value;
    
    if (field === 'phone') {
      formattedValue = formatPhone(value);
    }
    
    if (field === 'zipCode') {
      formattedValue = formatCEPInput(value);
    }

    // Atualizar estado
    switch (section) {
      case 'account':
        setAccountData({ ...accountData, [field]: formattedValue });
        break;
      case 'store':
        setStoreData({ ...storeData, [field]: formattedValue });
        break;
      case 'address':
        setAddressData({ ...addressData, [field]: formattedValue });
        break;
    }

    // Validar em tempo real
    const newErrors = { ...errors };
    delete newErrors[field];

    if (field === 'email' && value && !validateEmail(value)) {
      newErrors[field] = 'Email inválido';
    }
    if (field === 'phone' && value && !validatePhone(formattedValue)) {
      newErrors[field] = 'Telefone deve ter 10 ou 11 dígitos';
    }
    if (field === 'password' && value && !validatePassword(value)) {
      newErrors[field] = 'Mínimo 6 caracteres';
    }
    if (field === 'confirmPassword' && value !== accountData.password) {
      newErrors[field] = 'Senhas não coincidem';
    }

    setErrors(newErrors);
  };

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 0:
        if (!accountData.name) newErrors.name = 'Nome obrigatório';
        if (!accountData.email) newErrors.email = 'Email obrigatório';
        if (!validateEmail(accountData.email)) newErrors.email = 'Email inválido';
        if (!accountData.password) newErrors.password = 'Senha obrigatória';
        if (!validatePassword(accountData.password)) newErrors.password = 'Mínimo 6 caracteres';
        if (accountData.password !== accountData.confirmPassword) {
          newErrors.confirmPassword = 'Senhas não coincidem';
        }
        break;
      case 1:
        if (!storeData.storeName) newErrors.storeName = 'Nome da loja obrigatório';
        if (!storeData.description) newErrors.description = 'Descrição obrigatória';
        if (!storeData.category) newErrors.category = 'Categoria obrigatória';
        break;
      case 2:
        if (!addressData.street) newErrors.street = 'Rua obrigatória';
        if (!addressData.number) newErrors.number = 'Número obrigatório';
        if (!addressData.city) newErrors.city = 'Cidade obrigatória';
        if (!addressData.state) newErrors.state = 'Estado obrigatório';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Função para buscar endereço por CEP
  const handleCEPBlur = async () => {
    const cep = addressData.zipCode.replace(/\D/g, '');
    
    if (!cep || cep.length !== 8) {
      return;
    }

    setLoadingCEP(true);

    try {
      const address = await fetchAddressByCEP(cep);
      
      if (address) {
        setAddressData({
          ...addressData,
          street: address.street || addressData.street,
          neighborhood: address.neighborhood || addressData.neighborhood,
          city: address.city || addressData.city,
          state: address.state || addressData.state,
          zipCode: address.zipCode
        });

        toast({
          title: '✅ CEP encontrado!',
          description: 'Endereço preenchido automaticamente'
        });

        // Auto-geocodificar após buscar CEP
        setTimeout(() => handleGeocode(), 500);
      }
    } catch (error: any) {
      toast({
        title: 'CEP não encontrado',
        description: error.message || 'Verifique o CEP digitado',
        variant: 'destructive'
      });
    } finally {
      setLoadingCEP(false);
    }
  };

  // Função para buscar coordenadas do endereço
  const handleGeocode = async () => {
    if (!addressData.street || !addressData.city || !addressData.state) {
      toast({
        title: 'Endereço incompleto',
        description: 'Preencha rua, cidade e estado primeiro',
        variant: 'destructive'
      });
      return;
    }

    setLoadingGeocode(true);

    try {
      const result = await geocodeAddress(
        addressData.street,
        addressData.number,
        addressData.neighborhood,
        addressData.city,
        addressData.state,
        addressData.zipCode
      );

      if (result && areValidCoordinates(result.coordinates.lat, result.coordinates.lng)) {
        setCoordinates(result.coordinates);
        
        toast({
          title: '📍 Localização encontrada!',
          description: `Lat: ${result.coordinates.lat.toFixed(6)}, Lng: ${result.coordinates.lng.toFixed(6)}`
        });
      } else {
        toast({
          title: 'Localização não encontrada',
          description: 'Não foi possível obter as coordenadas deste endereço',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao buscar localização',
        description: 'Tente novamente mais tarde',
        variant: 'destructive'
      });
    } finally {
      setLoadingGeocode(false);
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      // Se estiver no passo de endereço e não tiver coordenadas, tentar geocodificar
      if (currentStep === 2 && !coordinates) {
        handleGeocode();
      }
      
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos corretamente',
        variant: 'destructive'
      });
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRegister = async () => {
    if (!validateStep(currentStep)) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha todos os campos corretamente',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    let userCreated = false;
    let userId = '';

    try {
      console.log('🔵 Iniciando cadastro...');
      console.log('📧 Email:', accountData.email);
      
      // Passo 1: Criar usuário no Firebase Auth
      console.log('🔵 Passo 1/4: Criando usuário no Firebase Auth...');
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        accountData.email,
        accountData.password
      );
      const user = userCredential.user;
      userId = user.uid;
      userCreated = true;
      console.log('✅ Usuário criado no Auth:', user.uid);

      // Passo 2: Atualizar perfil
      console.log('🔵 Passo 2/4: Atualizando perfil...');
      await updateProfile(user, {
        displayName: accountData.name
      });
      console.log('✅ Perfil atualizado');

      // Passo 3: Criar documento do usuário PRIMEIRO (importante para as regras do Firestore)
      console.log('🔵 Passo 3/4: Criando documento do usuário no Firestore...');
      console.log('📄 Collection: users, Document:', user.uid);
      
      // Criar com storeId temporário
      await setDoc(doc(db, 'users', user.uid), {
        email: accountData.email,
        nome: accountData.name,
        role: 'dono_da_loja',
        storeId: 'pending', // Será atualizado após criar a loja
        storeName: storeData.storeName,
        phone: accountData.phone,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Documento do usuário criado');

      // Passo 4: Criar loja no Firestore
      console.log('🔵 Passo 4/4: Criando loja no Firestore...');
      console.log('📄 Collection: stores');
      
      // Se não tiver coordenadas, tentar obter antes de criar a loja
      let finalCoordinates = coordinates;
      if (!finalCoordinates) {
        console.log('⚠️ Coordenadas não encontradas, tentando geocodificar...');
        try {
          const geocodeResult = await geocodeAddress(
            addressData.street,
            addressData.number,
            addressData.neighborhood,
            addressData.city,
            addressData.state,
            addressData.zipCode
          );
          if (geocodeResult) {
            finalCoordinates = geocodeResult.coordinates;
            console.log('✅ Coordenadas obtidas:', finalCoordinates);
          }
        } catch (error) {
          console.warn('⚠️ Não foi possível obter coordenadas, continuando sem geolocalização');
        }
      }
      
      const storeData_: any = {
        name: storeData.storeName,
        description: storeData.description,
        logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&h=200&fit=crop',
        coverImage: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&h=400&fit=crop',
        address: {
          street: addressData.street,
          number: addressData.number,
          neighborhood: addressData.neighborhood,
          city: addressData.city,
          state: addressData.state,
          zipCode: addressData.zipCode
        },
        contact: {
          phone: storeData.phone || accountData.phone,
          email: storeData.email || accountData.email,
          website: storeData.website
        },
        delivery: {
          deliveryTime: deliveryData.deliveryTime,
          deliveryFee: parseFloat(deliveryData.deliveryFee),
          freeDeliveryMinValue: parseFloat(deliveryData.freeDeliveryMinValue),
          deliveryRadius: parseInt(deliveryData.deliveryRadius)
        },
        operatingHours: operatingHours,
        category: storeData.category,
        isActive: true,
        ownerId: user.uid
      };

      // Adicionar geolocalização se disponível
      if (finalCoordinates) {
        storeData_.location = {
          latitude: finalCoordinates.lat,
          longitude: finalCoordinates.lng,
          formattedAddress: `${addressData.street}, ${addressData.number} - ${addressData.city}, ${addressData.state}`
        };
        console.log('📍 Loja será criada com geolocalização:', storeData_.location);
      } else {
        console.warn('⚠️ Loja será criada SEM geolocalização');
      }
      
      const storeId = await createStore(storeData_);
      console.log('✅ Loja criada com ID:', storeId);

      // Passo 5: Atualizar documento do usuário com storeId real
      console.log('🔵 Atualizando documento do usuário com storeId...');
      await setDoc(doc(db, 'users', user.uid), {
        email: accountData.email,
        nome: accountData.name,
        role: 'dono_da_loja',
        storeId: storeId,
        storeName: storeData.storeName,
        phone: accountData.phone,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ Documento do usuário atualizado com storeId:', storeId);

      console.log('🎉 Cadastro completo!');
      toast({
        title: '✅ Cadastro realizado!',
        description: 'Bem-vindo ao Rappy! Redirecionando...'
      });

      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);

    } catch (error: any) {
      console.error('❌ ERRO COMPLETO:', error);
      console.error('❌ Código do erro:', error.code);
      console.error('❌ Mensagem:', error.message);
      console.error('❌ Stack:', error.stack);
      
      let errorMessage = 'Erro ao criar cadastro';
      let errorDescription = '';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está em uso';
        errorDescription = 'Tente fazer login ou use outro email';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido';
        errorDescription = 'Verifique o formato do email';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Senha muito fraca';
        errorDescription = 'Use pelo menos 6 caracteres';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Permissão negada';
        errorDescription = 'Erro nas regras de segurança do Firestore';
      } else if (error.message?.includes('BLOCKED_BY_CLIENT')) {
        errorMessage = 'Conexão bloqueada';
        errorDescription = 'Desative extensões de bloqueio (Ad Blocker) e tente novamente';
      } else if (error.code) {
        errorMessage = `Erro: ${error.code}`;
        errorDescription = error.message;
      } else {
        errorMessage = error.message || 'Erro desconhecido';
        errorDescription = 'Verifique sua conexão e tente novamente';
      }

      // Se criou o usuário mas falhou depois, avisar
      if (userCreated) {
        errorDescription += '. Usuário criado, mas houve erro ao salvar dados. Entre em contato com o suporte.';
      }

      toast({
        title: errorMessage,
        description: errorDescription,
        variant: 'destructive',
        duration: 10000
      });
    } finally {
      setLoading(false);
    }
  };

  const dayNames: Record<string, string> = {
    monday: 'Seg',
    tuesday: 'Ter',
    wednesday: 'Qua',
    thursday: 'Qui',
    friday: 'Sex',
    saturday: 'Sáb',
    sunday: 'Dom'
  };


  return (
    <div className="min-h-screen flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <img
          src={loginBg}
          alt="Food background"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-red-600/20 to-orange-600/20" />
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 bg-background overflow-y-auto">
        <div className="w-full max-w-2xl space-y-4">
          {/* Logo */}
          <div className="text-center">
            <div className="inline-flex items-center gap-1 mb-1">
              <span className="text-4xl font-bold text-primary italic">rappy</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">Cadastre sua Loja</h1>
            <p className="text-sm text-gray-600">Comece a vender hoje mesmo</p>
          </div>

          <Card className="p-4 sm:p-6">
            {/* Step Indicators */}
            <div className="mb-6">
              <div className="mb-3">
                <Progress value={progress} className="h-1.5" />
              </div>
              <div className="flex justify-between">
                {steps.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = index === currentStep;
                  const isCompleted = index < currentStep;
                  
                  return (
                    <div key={index} className="flex flex-col items-center flex-1">
                      <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center mb-1
                        transition-all duration-300 transform
                        ${isActive ? 'bg-red-600 text-white scale-110 shadow-lg' : ''}
                        ${isCompleted ? 'bg-green-500 text-white' : ''}
                        ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-400' : ''}
                      `}>
                        {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                      </div>
                      <span className={`
                        text-xs font-medium text-center hidden sm:block
                        ${isActive ? 'text-red-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
                      `}>
                        {step.title}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 0: Dados Pessoais */}
            {currentStep === 0 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Dados Pessoais</h2>
                  <p className="text-sm text-gray-600">Vamos começar com suas informações básicas</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="name" className="text-sm">Nome Completo *</Label>
                    <div className="relative mt-1">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        id="name"
                        placeholder="João Silva"
                        value={accountData.name}
                        onChange={(e) => handleFieldChange('name', e.target.value, 'account')}
                        className={`pl-9 h-10 ${errors.name ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-red-600 mt-1 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors.name}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="email" className="text-sm">Email *</Label>
                    <div className="relative mt-1">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="joao@exemplo.com"
                        value={accountData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value, 'account')}
                        className={`pl-9 h-10 ${errors.email ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm">Telefone</Label>
                    <div className="relative mt-1">
                      <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        id="phone"
                        placeholder="(11) 99999-9999"
                        value={accountData.phone}
                        onChange={(e) => handleFieldChange('phone', e.target.value, 'account')}
                        className={`pl-9 h-10 ${errors.phone ? 'border-red-500' : ''}`}
                        maxLength={15}
                      />
                    </div>
                    {errors.phone ? (
                      <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.phone}
                      </p>
                    ) : (
                      <p className="text-xs text-gray-500 mt-1">Formato: (11) 99999-9999 - Máx. 11 dígitos</p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="password" className="text-sm">Senha *</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        id="password"
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={accountData.password}
                        onChange={(e) => handleFieldChange('password', e.target.value, 'account')}
                        className={`pl-9 h-10 ${errors.password ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.password && (
                      <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.password}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="confirmPassword" className="text-sm">Confirmar Senha *</Label>
                    <div className="relative mt-1">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="Digite a senha novamente"
                        value={accountData.confirmPassword}
                        onChange={(e) => handleFieldChange('confirmPassword', e.target.value, 'account')}
                        className={`pl-9 h-10 ${errors.confirmPassword ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 1: Dados da Loja */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Sua Loja</h2>
                  <p className="text-sm text-gray-600">Conte-nos sobre seu estabelecimento</p>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="storeName" className="text-sm">Nome da Loja *</Label>
                    <div className="relative mt-1">
                      <Store className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        id="storeName"
                        placeholder="Pizzaria do João"
                        value={storeData.storeName}
                        onChange={(e) => handleFieldChange('storeName', e.target.value, 'store')}
                        className={`pl-9 h-10 ${errors.storeName ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.storeName && (
                      <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.storeName}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="category" className="text-sm">Categoria *</Label>
                    <div className="relative mt-1">
                      <Utensils className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <select
                        id="category"
                        value={storeData.category}
                        onChange={(e) => handleFieldChange('category', e.target.value, 'store')}
                        className={`w-full pl-9 h-10 border rounded-md bg-white ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                        disabled={loadingCategories}
                      >
                        <option value="">
                          {loadingCategories ? 'Carregando categorias...' : 'Selecione uma categoria'}
                        </option>
                        {storeTypes.map(type => (
                          <option key={type.id} value={type.name}>
                            {type.icon} {type.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    {errors.category && (
                      <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.category}
                      </p>
                    )}
                    {loadingCategories && (
                      <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Carregando categorias disponíveis...
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="description" className="text-sm">Descrição *</Label>
                    <div className="relative mt-1">
                      <FileText className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                      <Textarea
                        id="description"
                        placeholder="Descreva sua loja, especialidades, diferenciais..."
                        value={storeData.description}
                        onChange={(e) => handleFieldChange('description', e.target.value, 'store')}
                        className={`pl-9 min-h-[80px] resize-none ${errors.description ? 'border-red-500' : ''}`}
                      />
                    </div>
                    {errors.description && (
                      <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.description}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="storePhone" className="text-sm">Telefone da Loja</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          id="storePhone"
                          placeholder="(11) 3333-3333"
                          value={storeData.phone}
                          onChange={(e) => handleFieldChange('phone', e.target.value, 'store')}
                          className="pl-9 h-10"
                          maxLength={15}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Máx. 11 dígitos</p>
                    </div>

                    <div>
                      <Label htmlFor="storeEmail" className="text-sm">Email da Loja</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          id="storeEmail"
                          type="email"
                          placeholder="contato@loja.com"
                          value={storeData.email}
                          onChange={(e) => setStoreData({ ...storeData, email: e.target.value })}
                          className="pl-9 h-10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                    <h3 className="font-semibold text-sm text-orange-900 mb-2">Configurações de Delivery</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label className="text-sm text-orange-800">Tempo de Entrega</Label>
                        <Input
                          placeholder="30-45 min"
                          value={deliveryData.deliveryTime}
                          onChange={(e) => setDeliveryData({ ...deliveryData, deliveryTime: e.target.value })}
                          className="mt-1 h-10"
                          maxLength={20}
                        />
                        <p className="text-xs text-orange-600 mt-1">Ex: 30-45 min</p>
                      </div>
                      <div>
                        <Label className="text-sm text-orange-800">Taxa de Entrega (R$)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          max="999.99"
                          placeholder="5.99"
                          value={deliveryData.deliveryFee}
                          onChange={(e) => setDeliveryData({ ...deliveryData, deliveryFee: e.target.value })}
                          className="mt-1 h-10"
                        />
                        <p className="text-xs text-orange-600 mt-1">Valor da taxa</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Endereço */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Endereço</h2>
                  <p className="text-sm text-gray-600">Onde sua loja está localizada?</p>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor="street" className="text-sm">Rua *</Label>
                      <div className="relative mt-1">
                        <Home className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          id="street"
                          placeholder="Av. Paulista"
                          value={addressData.street}
                          onChange={(e) => handleFieldChange('street', e.target.value, 'address')}
                          className={`pl-9 h-10 ${errors.street ? 'border-red-500' : ''}`}
                        />
                      </div>
                      {errors.street && (
                        <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.street}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="number" className="text-sm">Número *</Label>
                      <Input
                        id="number"
                        placeholder="1000"
                        value={addressData.number}
                        onChange={(e) => handleFieldChange('number', e.target.value, 'address')}
                        className={`h-10 mt-1 ${errors.number ? 'border-red-500' : ''}`}
                        maxLength={10}
                      />
                      {errors.number && (
                        <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.number}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="zipCode" className="text-sm">CEP</Label>
                      <div className="flex gap-2 mt-1">
                        <div className="relative flex-1">
                          <Input
                            id="zipCode"
                            placeholder="01310-100"
                            value={addressData.zipCode}
                            onChange={(e) => handleFieldChange('zipCode', e.target.value, 'address')}
                            onBlur={handleCEPBlur}
                            maxLength={9}
                            className="h-10"
                          />
                          {loadingCEP && (
                            <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Digite o CEP e pressione Tab - Máx. 8 dígitos</p>
                    </div>

                    <div>
                      <Label htmlFor="neighborhood" className="text-sm">Bairro</Label>
                      <Input
                        id="neighborhood"
                        placeholder="Bela Vista"
                        value={addressData.neighborhood}
                        onChange={(e) => handleFieldChange('neighborhood', e.target.value, 'address')}
                        className="h-10 mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor="city" className="text-sm">Cidade *</Label>
                      <Input
                        id="city"
                        placeholder="São Paulo"
                        value={addressData.city}
                        onChange={(e) => handleFieldChange('city', e.target.value, 'address')}
                        className={`h-10 mt-1 ${errors.city ? 'border-red-500' : ''}`}
                      />
                      {errors.city && (
                        <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.city}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="state" className="text-sm">Estado *</Label>
                      <Input
                        id="state"
                        placeholder="SP"
                        maxLength={2}
                        value={addressData.state}
                        onChange={(e) => handleFieldChange('state', e.target.value.toUpperCase(), 'address')}
                        className={`h-10 mt-1 uppercase ${errors.state ? 'border-red-500' : ''}`}
                      />
                      {errors.state && (
                        <p className="text-xs text-red-600 mt-0.5 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.state}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Card de Geolocalização */}
                  <div className={`p-4 rounded-lg border ${coordinates ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <MapPin className={`h-5 w-5 ${coordinates ? 'text-green-600' : 'text-blue-600'}`} />
                          <h3 className={`font-semibold text-sm ${coordinates ? 'text-green-900' : 'text-blue-900'}`}>
                            {coordinates ? 'Localização Confirmada' : 'Geolocalização'}
                          </h3>
                        </div>
                        <p className={`text-xs ${coordinates ? 'text-green-700' : 'text-blue-700'}`}>
                          {coordinates 
                            ? `Coordenadas: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}` 
                            : 'Busque as coordenadas da sua loja para permitir que entregadores encontrem pedidos próximos'
                          }
                        </p>
                        {coordinates && (
                          <p className="text-xs text-green-600 mt-1">
                            ✓ Sua loja poderá ser encontrada por entregadores
                          </p>
                        )}
                      </div>
                      <Button
                        type="button"
                        onClick={handleGeocode}
                        disabled={loadingGeocode || !addressData.street || !addressData.city}
                        variant="outline"
                        size="sm"
                        className={coordinates ? 'border-green-300 text-green-700 hover:bg-green-100' : 'border-blue-300 text-blue-700 hover:bg-blue-100'}
                      >
                        {loadingGeocode ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            Buscando...
                          </>
                        ) : coordinates ? (
                          <>
                            <Navigation className="h-4 w-4 mr-1" />
                            Atualizar
                          </>
                        ) : (
                          <>
                            <Navigation className="h-4 w-4 mr-1" />
                            Buscar
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Horários */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Horários de Funcionamento</h2>
                  <p className="text-sm text-gray-600">Configure os horários da sua loja</p>
                </div>

                <div className="space-y-2">
                  {Object.entries(operatingHours).map(([day, hours]) => (
                    <div key={day} className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-2 w-20">
                        <Switch
                          checked={hours.isOpen}
                          onCheckedChange={(checked) => setOperatingHours({
                            ...operatingHours,
                            [day]: { ...hours, isOpen: checked }
                          })}
                        />
                        <Label className="font-medium text-sm text-gray-700">
                          {dayNames[day]}
                        </Label>
                      </div>

                      {hours.isOpen ? (
                        <div className="flex gap-2 items-center flex-1">
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => setOperatingHours({
                              ...operatingHours,
                              [day]: { ...hours, open: e.target.value }
                            })}
                            className="h-9 w-24 text-sm"
                          />
                          <span className="text-gray-400 text-xs">até</span>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => setOperatingHours({
                              ...operatingHours,
                              [day]: { ...hours, close: e.target.value }
                            })}
                            className="h-9 w-24 text-sm"
                          />
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Fechado</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6 pt-4 border-t">
              {currentStep > 0 && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 h-10"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Voltar
                </Button>
              )}
              
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={handleNext}
                  className="flex-1 h-10 bg-red-600 hover:bg-red-700"
                >
                  Próximo
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button
                  onClick={handleRegister}
                  disabled={loading}
                  className="flex-1 h-10 bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Criando conta...' : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Finalizar Cadastro
                    </>
                  )}
                </Button>
              )}
            </div>
          </Card>

          {/* Footer */}
          <div className="text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-red-600 hover:underline font-medium"
              >
                Fazer login
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 