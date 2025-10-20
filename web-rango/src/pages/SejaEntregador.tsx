/**
 * SejaEntregador.tsx
 * Landing Page para cadastro de novos entregadores
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Bike, 
  User, 
  MapPin, 
  FileText, 
  Car, 
  Building2,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Mail,
  Phone,
  IdCard,
  CreditCard,
  Rocket,
  DollarSign,
  Clock,
  Star
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp, GeoPoint } from "firebase/firestore";
import { validateCPF, formatCPF, formatPhone, cleanCPF, hashCPF } from "@/utils/security";

type VehicleType = 'bicycle' | 'motorcycle' | 'car';

interface FormData {
  // Etapa 1: Dados Pessoais
  full_name: string;
  email: string;
  password: string;
  phone: string;
  cpf: string;
  
  // Etapa 2: Endereço
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  
  // Etapa 3: Documentos
  cnh_number: string;
  cnh_category: string;
  rg_number: string;
  
  // Etapa 4: Veículo
  vehicle_type: VehicleType | '';
  vehicle_brand: string;
  vehicle_model: string;
  vehicle_plate: string;
  
  // Etapa 5: Dados Bancários (opcional)
  bank_name: string;
  account_type: 'checking' | 'savings' | '';
  agency: string;
  account_number: string;
  pix_key: string;
}

export default function SejaEntregador() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    cpf: '',
    zipCode: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    cnh_number: '',
    cnh_category: '',
    rg_number: '',
    vehicle_type: '',
    vehicle_brand: '',
    vehicle_model: '',
    vehicle_plate: '',
    bank_name: '',
    account_type: '',
    agency: '',
    account_number: '',
    pix_key: ''
  });

  const { toast } = useToast();
  const navigate = useNavigate();

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const updateField = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep1 = () => {
    if (!formData.full_name.trim()) {
      toast({ title: 'Atenção', description: 'Nome completo é obrigatório', variant: 'destructive' });
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      toast({ title: 'Atenção', description: 'Email válido é obrigatório', variant: 'destructive' });
      return false;
    }
    if (formData.password.length < 6) {
      toast({ title: 'Atenção', description: 'Senha deve ter no mínimo 6 caracteres', variant: 'destructive' });
      return false;
    }
    if (!formData.phone.trim() || formData.phone.replace(/\D/g, '').length < 10) {
      toast({ title: 'Atenção', description: 'Telefone válido é obrigatório', variant: 'destructive' });
      return false;
    }
    if (!validateCPF(formData.cpf)) {
      toast({ title: 'Atenção', description: 'CPF inválido', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.zipCode.trim() || !formData.street.trim() || !formData.number.trim() || 
        !formData.neighborhood.trim() || !formData.city.trim() || !formData.state.trim()) {
      toast({ title: 'Atenção', description: 'Preencha todos os campos do endereço', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep3 = () => {
    if (!formData.cnh_number.trim() || formData.cnh_number.length !== 11) {
      toast({ title: 'Atenção', description: 'CNH deve ter 11 dígitos', variant: 'destructive' });
      return false;
    }
    if (!formData.cnh_category.trim()) {
      toast({ title: 'Atenção', description: 'Categoria da CNH é obrigatória', variant: 'destructive' });
      return false;
    }
    if (!formData.rg_number.trim()) {
      toast({ title: 'Atenção', description: 'RG é obrigatório', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const validateStep4 = () => {
    if (!formData.vehicle_type) {
      toast({ title: 'Atenção', description: 'Selecione o tipo de veículo', variant: 'destructive' });
      return false;
    }
    if (formData.vehicle_type !== 'bicycle' && !formData.vehicle_plate.trim()) {
      toast({ title: 'Atenção', description: 'Placa é obrigatória para moto/carro', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleNext = () => {
    let isValid = true;

    if (currentStep === 1) isValid = validateStep1();
    if (currentStep === 2) isValid = validateStep2();
    if (currentStep === 3) isValid = validateStep3();
    if (currentStep === 4) isValid = validateStep4();

    if (isValid && currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      // 1. Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      
      const userId = userCredential.user.uid;

      // 2. Hash do CPF para segurança
      const cpfHash = await hashCPF(cleanCPF(formData.cpf));

      // 3. Criar documento na collection 'users'
      await setDoc(doc(db, 'users', userId), {
        email: formData.email,
        name: formData.full_name,
        role: 'entregador',
        createdAt: serverTimestamp()
      });

      // 4. Criar documento na collection 'delivery_partners'
      const deliveryPartnerData = {
        userId: userId,
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        cpf_hash: cpfHash,
        profile_photo_url: null,
        
        documents: {
          cnh: {
            number: formData.cnh_number,
            category: formData.cnh_category,
            expiration_date: null,
            photo_url: ''
          },
          rg: {
            number: formData.rg_number,
            photo_url: ''
          },
          selfie_photo_url: ''
        },
        
        vehicle: {
          type: formData.vehicle_type,
          brand: formData.vehicle_brand || null,
          model: formData.vehicle_model || null,
          license_plate: formData.vehicle_plate || null,
          year: null,
          color: null,
          photo_url: null
        },
        
        status: 'pending_approval',
        approval_status: {
          status: 'pending',
          reviewed_by: null,
          reviewed_at: null,
          rejection_reason: null
        },
        
        operational_status: 'offline',
        current_location: null,
        last_location_update: null,
        current_order_id: null,
        
        operating_zones: [], // Admin definirá depois
        preferred_zones: [],
        
        banking_info: formData.bank_name ? {
          bank_code: '',
          bank_name: formData.bank_name,
          account_type: formData.account_type,
          account_number: formData.account_number,
          agency: formData.agency,
          holder_name: formData.full_name,
          holder_cpf: cleanCPF(formData.cpf),
          pix_key: formData.pix_key || null
        } : null,
        
        metrics: {
          total_deliveries: 0,
          completed_deliveries: 0,
          cancelled_deliveries: 0,
          acceptance_rate: 0,
          average_rating: 0,
          total_ratings: 0,
          on_time_rate: 0,
          total_earnings: 0,
          current_balance: 0
        },
        
        availability: {
          is_available_now: false,
          schedule: null
        },
        
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
        last_login: null,
        metadata: null
      };

      await setDoc(doc(db, 'delivery_partners', userId), deliveryPartnerData);

      toast({
        title: 'Cadastro Realizado!',
        description: 'Seu cadastro foi enviado para análise. Você será notificado em breve.',
      });

      // Redirecionar para página de sucesso
      navigate('/cadastro-sucesso');
      
    } catch (error: any) {
      console.error('Erro ao cadastrar:', error);
      
      let errorMessage = 'Não foi possível completar o cadastro';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email já está cadastrado';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Senha muito fraca';
      }
      
      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Rocket className="h-8 w-8 text-orange-500" />
            <span className="text-2xl font-bold">Rappy Delivery</span>
          </div>
          <Button variant="outline" onClick={() => navigate('/login')}>
            Já sou entregador
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Hero Section */}
        {currentStep === 1 && (
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Seja um Entregador Rappy</h1>
            <p className="text-xl text-muted-foreground mb-6">
              Ganhe dinheiro entregando com flexibilidade e autonomia
            </p>
            <div className="grid grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="font-semibold">Ganhos Atrativos</p>
                <p className="text-sm text-muted-foreground">80% do valor da entrega</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <Clock className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                <p className="font-semibold">Horários Flexíveis</p>
                <p className="text-sm text-muted-foreground">Trabalhe quando quiser</p>
              </div>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
                <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                <p className="font-semibold">Suporte Dedicado</p>
                <p className="text-sm text-muted-foreground">Sempre à disposição</p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>Etapa {currentStep} de {totalSteps}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Dados Pessoais</span>
                <span>Endereço</span>
                <span>Documentos</span>
                <span>Veículo</span>
                <span>Bancário</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Form Steps */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {currentStep === 1 && <><User className="h-5 w-5" /> Dados Pessoais</>}
              {currentStep === 2 && <><MapPin className="h-5 w-5" /> Endereço</>}
              {currentStep === 3 && <><FileText className="h-5 w-5" /> Documentos</>}
              {currentStep === 4 && <><Car className="h-5 w-5" /> Veículo</>}
              {currentStep === 5 && <><Building2 className="h-5 w-5" /> Dados Bancários</>}
            </CardTitle>
            <CardDescription>
              {currentStep === 1 && 'Preencha seus dados pessoais e crie sua senha'}
              {currentStep === 2 && 'Informe seu endereço residencial'}
              {currentStep === 3 && 'Dados dos seus documentos (CNH e RG)'}
              {currentStep === 4 && 'Informações do veículo que usará para entregas'}
              {currentStep === 5 && 'Dados para recebimento (opcional, pode preencher depois)'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Step 1: Dados Pessoais */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="full_name">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => updateField('full_name', e.target.value)}
                    placeholder="João Silva Santos"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      placeholder="joao@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="password">Senha *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => updateField('phone', formatPhone(e.target.value))}
                      placeholder="(11) 98765-4321"
                      maxLength={15}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input
                      id="cpf"
                      value={formData.cpf}
                      onChange={(e) => updateField('cpf', formatCPF(e.target.value))}
                      placeholder="123.456.789-00"
                      maxLength={14}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Endereço */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="zipCode">CEP *</Label>
                    <Input
                      id="zipCode"
                      value={formData.zipCode}
                      onChange={(e) => updateField('zipCode', e.target.value)}
                      placeholder="12345-678"
                      maxLength={9}
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="street">Rua *</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => updateField('street', e.target.value)}
                      placeholder="Rua das Flores"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="number">Número *</Label>
                    <Input
                      id="number"
                      value={formData.number}
                      onChange={(e) => updateField('number', e.target.value)}
                      placeholder="123"
                    />
                  </div>
                  <div className="col-span-2">
                    <Label htmlFor="complement">Complemento</Label>
                    <Input
                      id="complement"
                      value={formData.complement}
                      onChange={(e) => updateField('complement', e.target.value)}
                      placeholder="Apto 45"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="neighborhood">Bairro *</Label>
                    <Input
                      id="neighborhood"
                      value={formData.neighborhood}
                      onChange={(e) => updateField('neighborhood', e.target.value)}
                      placeholder="Centro"
                    />
                  </div>
                  <div>
                    <Label htmlFor="city">Cidade *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => updateField('city', e.target.value)}
                      placeholder="São Paulo"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="state">Estado (UF) *</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => updateField('state', e.target.value.toUpperCase())}
                    placeholder="SP"
                    maxLength={2}
                  />
                </div>
              </div>
            )}

            {/* Step 3: Documentos */}
            {currentStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cnh_number">Número da CNH *</Label>
                    <Input
                      id="cnh_number"
                      value={formData.cnh_number}
                      onChange={(e) => updateField('cnh_number', e.target.value.replace(/\D/g, ''))}
                      placeholder="12345678901"
                      maxLength={11}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cnh_category">Categoria CNH *</Label>
                    <Select value={formData.cnh_category} onValueChange={(val) => updateField('cnh_category', val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="A">A (Moto)</SelectItem>
                        <SelectItem value="B">B (Carro)</SelectItem>
                        <SelectItem value="AB">AB (Moto e Carro)</SelectItem>
                        <SelectItem value="C">C</SelectItem>
                        <SelectItem value="D">D</SelectItem>
                        <SelectItem value="E">E</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="rg_number">Número do RG *</Label>
                  <Input
                    id="rg_number"
                    value={formData.rg_number}
                    onChange={(e) => updateField('rg_number', e.target.value)}
                    placeholder="12.345.678-9"
                  />
                </div>
                <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Nota:</strong> Após aprovação do cadastro, você precisará enviar fotos dos documentos pelo aplicativo.
                  </p>
                </div>
              </div>
            )}

            {/* Step 4: Veículo */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div>
                  <Label>Tipo de Veículo *</Label>
                  <Select value={formData.vehicle_type} onValueChange={(val) => updateField('vehicle_type', val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bicycle">🚴 Bicicleta</SelectItem>
                      <SelectItem value="motorcycle">🏍️ Moto</SelectItem>
                      <SelectItem value="car">🚗 Carro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {formData.vehicle_type !== 'bicycle' && formData.vehicle_type !== '' && (
                  <>
                    <div>
                      <Label htmlFor="vehicle_plate">Placa do Veículo *</Label>
                      <Input
                        id="vehicle_plate"
                        value={formData.vehicle_plate}
                        onChange={(e) => updateField('vehicle_plate', e.target.value.toUpperCase())}
                        placeholder="ABC-1234"
                        maxLength={8}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="vehicle_brand">Marca (opcional)</Label>
                        <Input
                          id="vehicle_brand"
                          value={formData.vehicle_brand}
                          onChange={(e) => updateField('vehicle_brand', e.target.value)}
                          placeholder="Honda"
                        />
                      </div>
                      <div>
                        <Label htmlFor="vehicle_model">Modelo (opcional)</Label>
                        <Input
                          id="vehicle_model"
                          value={formData.vehicle_model}
                          onChange={(e) => updateField('vehicle_model', e.target.value)}
                          placeholder="CG 160"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 5: Dados Bancários */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg mb-4">
                  <p className="text-sm text-yellow-800 dark:text-yellow-300">
                    <strong>Opcional:</strong> Você pode preencher os dados bancários agora ou depois, pelo aplicativo.
                  </p>
                </div>
                <div>
                  <Label htmlFor="bank_name">Nome do Banco</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name}
                    onChange={(e) => updateField('bank_name', e.target.value)}
                    placeholder="Banco do Brasil, Nubank, etc"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="account_type">Tipo de Conta</Label>
                    <Select value={formData.account_type} onValueChange={(val) => updateField('account_type', val)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="checking">Conta Corrente</SelectItem>
                        <SelectItem value="savings">Conta Poupança</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="agency">Agência</Label>
                    <Input
                      id="agency"
                      value={formData.agency}
                      onChange={(e) => updateField('agency', e.target.value)}
                      placeholder="1234"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="account_number">Número da Conta</Label>
                    <Input
                      id="account_number"
                      value={formData.account_number}
                      onChange={(e) => updateField('account_number', e.target.value)}
                      placeholder="12345-6"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pix_key">Chave PIX (opcional)</Label>
                    <Input
                      id="pix_key"
                      value={formData.pix_key}
                      onChange={(e) => updateField('pix_key', e.target.value)}
                      placeholder="email, CPF, telefone"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-6 pt-6 border-t">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>

              {currentStep < totalSteps ? (
                <Button onClick={handleNext}>
                  Próximo
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                      Cadastrando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Finalizar Cadastro
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

