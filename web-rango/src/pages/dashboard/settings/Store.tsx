import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Store, 
  Clock, 
  MapPin, 
  Phone, 
  Mail, 
  Save, 
  Globe,
  Info,
  Image as ImageIcon,
  Upload,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getStoreById, updateStore } from "@/services/storeService";
import { useToast } from "@/hooks/use-toast";
import { CategorySelector } from "@/components/dashboard/CategorySelector";
import { CloudinaryUploadService } from "@/services/cloudinaryUploadService";

const StoreSettings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Estados para upload
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  
  // Estados para os dados da loja
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [storeData, setStoreData] = useState({
    name: "",
    description: "",
    category: "",
    phone: "",
    email: "",
    website: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    zipCode: "",
    coverImage: "",
    logo: "",
  });

  const [operatingHours, setOperatingHours] = useState([
    { day: "Segunda-feira", key: "segunda-feira", open: "08:00", close: "22:00", isOpen: true },
    { day: "Terça-feira", key: "terça-feira", open: "08:00", close: "22:00", isOpen: true },
    { day: "Quarta-feira", key: "quarta-feira", open: "08:00", close: "22:00", isOpen: true },
    { day: "Quinta-feira", key: "quinta-feira", open: "08:00", close: "22:00", isOpen: true },
    { day: "Sexta-feira", key: "sexta-feira", open: "08:00", close: "23:00", isOpen: true },
    { day: "Sábado", key: "sábado", open: "10:00", close: "23:00", isOpen: true },
    { day: "Domingo", key: "domingo", open: "10:00", close: "21:00", isOpen: false },
  ]);

  const [isStoreActive, setIsStoreActive] = useState(true);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Carregar dados da loja
  useEffect(() => {
    const loadStoreData = async () => {
      if (!user?.storeId) {
        setLoading(false);
        return;
      }

      try {
        console.log('🔵 Carregando dados da loja:', user.storeId);
        const store = await getStoreById(user.storeId);
        
        if (store) {
          console.log('✅ Dados da loja carregados:', store);
          
          // Preencher formulário
          setStoreData({
            name: store.name || "",
            description: store.description || "",
            category: store.category || "",
            phone: store.contact?.phone || "",
            email: store.contact?.email || "",
            website: store.contact?.website || "",
            street: store.address?.street || "",
            number: store.address?.number || "",
            neighborhood: store.address?.neighborhood || "",
            city: store.address?.city || "",
            state: store.address?.state || "",
            zipCode: store.address?.zipCode || "",
            coverImage: store.coverImage || "",
            logo: store.logo || "",
          });

          // Preencher horários de funcionamento
          if (store.operatingHours) {
            const updatedHours = operatingHours.map(schedule => ({
              ...schedule,
              open: store.operatingHours[schedule.key]?.open || schedule.open,
              close: store.operatingHours[schedule.key]?.close || schedule.close,
              isOpen: store.operatingHours[schedule.key]?.isOpen ?? schedule.isOpen,
            }));
            setOperatingHours(updatedHours);
          }

          setIsStoreActive(store.isActive);
          
          // Carregar categorias selecionadas
          if (store.categories && Array.isArray(store.categories)) {
            setSelectedCategories(store.categories);
          }
        }
      } catch (error) {
        console.error('❌ Erro ao carregar dados da loja:', error);
        toast({
          title: "Erro",
          description: "Erro ao carregar dados da loja",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadStoreData();
  }, [user?.storeId, toast]);

  // Atualizar horário específico
  const updateSchedule = (index: number, field: string, value: any) => {
    const updatedHours = [...operatingHours];
    updatedHours[index] = { ...updatedHours[index], [field]: value };
    setOperatingHours(updatedHours);
  };

  // Upload de banner
  const handleBannerUpload = async (file: File) => {
    if (!file) return;
    
    setUploadingBanner(true);
    try {
      const result = await CloudinaryUploadService.uploadProductImage(
        file,
        'stores/banners',
        () => {} // Callback de progresso opcional
      );
      
      setStoreData(prev => ({ ...prev, coverImage: result.url }));
      toast({
        title: "✅ Banner carregado!",
        description: "Imagem carregada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao fazer upload do banner:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do banner",
        variant: "destructive",
      });
    } finally {
      setUploadingBanner(false);
    }
  };

  // Upload de logo
  const handleLogoUpload = async (file: File) => {
    if (!file) return;
    
    setUploadingLogo(true);
    try {
      const result = await CloudinaryUploadService.uploadProductImage(
        file,
        'stores/logos',
        () => {}
      );
      
      setStoreData(prev => ({ ...prev, logo: result.url }));
      toast({
        title: "✅ Logo carregado!",
        description: "Imagem carregada com sucesso",
      });
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do logo",
        variant: "destructive",
      });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Salvar alterações
  const handleSave = async () => {
    if (!user?.storeId) {
      toast({
        title: "Erro",
        description: "ID da loja não encontrado",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      console.log('🔵 Salvando alterações da loja...');

      // Converter horários para o formato do Firebase
      const operatingHoursForFirebase = operatingHours.reduce((acc, schedule) => {
        acc[schedule.key] = {
          open: schedule.open,
          close: schedule.close,
          isOpen: schedule.isOpen,
        };
        return acc;
      }, {} as any);

      // Construir objeto contact sem valores undefined
      const contactData: any = {
        phone: storeData.phone.trim(),
        email: storeData.email.trim(),
      };
      
      // Adicionar website apenas se tiver valor
      if (storeData.website.trim()) {
        contactData.website = storeData.website.trim();
      }

      const updateData: any = {
        name: storeData.name.trim(),
        description: storeData.description.trim(),
        category: storeData.category.trim(),
        categories: selectedCategories, // Array de IDs das categorias
        contact: contactData,
        address: {
          street: storeData.street.trim(),
          number: storeData.number.trim(),
          neighborhood: storeData.neighborhood.trim(),
          city: storeData.city.trim(),
          state: storeData.state.trim(),
          zipCode: storeData.zipCode.trim(),
        },
        operatingHours: operatingHoursForFirebase,
        isActive: isStoreActive,
      };

      // Adicionar imagens apenas se tiverem valor (Firebase não aceita undefined)
      if (storeData.coverImage) {
        updateData.coverImage = storeData.coverImage;
      }
      if (storeData.logo) {
        updateData.logo = storeData.logo;
      }

      await updateStore(user.storeId, updateData);
      
      console.log('✅ Loja atualizada com sucesso!');
      toast({
        title: "✅ Configurações salvas!",
        description: "As informações da sua loja foram atualizadas e já estão visíveis no app",
      });

    } catch (error) {
      console.error('❌ Erro ao salvar:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar configurações da loja",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">
            Configurações da Loja
          </h1>
          <p className="text-muted-foreground mt-2">
            Gerencie as informações e a identidade visual da sua loja
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Salvando..." : "Salvar Alterações"}
        </Button>
      </div>

      {/* Status da Loja - Destaque */}
      <Card className="border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                isStoreActive ? 'bg-green-100' : 'bg-red-100'
              }`}>
                <Store className={`h-6 w-6 ${
                  isStoreActive ? 'text-green-600' : 'text-red-600'
                }`} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Status da Loja
                </h3>
                <p className="text-sm text-muted-foreground">
                  {isStoreActive 
                    ? 'Sua loja está aberta e visível para clientes' 
                    : 'Sua loja está fechada e não receberá pedidos'
                  }
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={isStoreActive ? "default" : "secondary"}
                className={`text-sm px-4 py-1.5 ${
                  isStoreActive 
                    ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                    : 'bg-red-100 text-red-800 hover:bg-red-100'
                }`}
              >
                {isStoreActive ? "🟢 Aberta" : "🔴 Fechada"}
              </Badge>
              <Switch 
                checked={isStoreActive}
                onCheckedChange={setIsStoreActive}
                className="scale-110"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs para organizar conteúdo */}
      <Tabs defaultValue="visual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto">
          <TabsTrigger value="visual" className="gap-2">
            <ImageIcon className="h-4 w-4" />
            Identidade Visual
          </TabsTrigger>
          <TabsTrigger value="basic" className="gap-2">
            <Info className="h-4 w-4" />
            Informações
          </TabsTrigger>
          <TabsTrigger value="contact" className="gap-2">
            <Phone className="h-4 w-4" />
            Contato
          </TabsTrigger>
          <TabsTrigger value="hours" className="gap-2">
            <Clock className="h-4 w-4" />
            Horários
          </TabsTrigger>
        </TabsList>

        {/* TAB: Identidade Visual */}
        <TabsContent value="visual" className="space-y-6">
          {/* Layout em Grid de 2 Colunas - Desktop | 1 Coluna - Mobile */}
          <div className="grid lg:grid-cols-2 gap-6">
            
            {/* Coluna 1: Upload de Imagens - Layout Clean */}
            <Card className="lg:col-span-1 shadow-sm">
              <CardHeader className="pb-5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-primary rounded-full"></div>
                  <CardTitle className="text-lg">Imagens da Loja</CardTitle>
                </div>
                <CardDescription className="text-xs pt-1">
                  Faça upload das imagens. A visualização aparecerá no preview ao lado →
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 py-6">
                
                {/* Layout em Grid: Banner e Logo lado a lado */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Banner Upload - Clean */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20 flex items-center justify-center border border-orange-200/50 dark:border-orange-700/30">
                        <ImageIcon className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Banner</h3>
                        <p className="text-[10px] text-muted-foreground">Horizontal</p>
                      </div>
                    </div>
                    
                    {/* Upload Area sem preview da imagem */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleBannerUpload(file);
                        }}
                        className="hidden"
                        id="banner-upload"
                        disabled={uploadingBanner}
                      />
                      <label
                        htmlFor="banner-upload"
                        className={`flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-xl transition-all group ${
                          uploadingBanner 
                            ? 'border-primary bg-primary/10 cursor-wait' 
                            : 'border-gray-300 dark:border-gray-700 cursor-pointer hover:border-primary hover:bg-primary/5'
                        }`}
                      >
                        <div className="text-center space-y-2">
                          {uploadingBanner ? (
                            <>
                              <div className="w-12 h-12 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                              </div>
                              <p className="text-xs font-medium text-primary">Enviando...</p>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-foreground">Clique para fazer upload</p>
                                <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG • Max 5MB</p>
                              </div>
                              {storeData.coverImage && (
                                <div className="pt-2">
                                  <span className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-1 rounded-full">
                                    ✓ Imagem carregada
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Logo Upload - Clean */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/30 dark:to-blue-800/20 flex items-center justify-center border border-blue-200/50 dark:border-blue-700/30">
                        <Store className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Logo</h3>
                        <p className="text-[10px] text-muted-foreground">Quadrado</p>
                      </div>
                    </div>
                    
                    {/* Upload Area sem preview da imagem */}
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleLogoUpload(file);
                        }}
                        className="hidden"
                        id="logo-upload"
                        disabled={uploadingLogo}
                      />
                      <label
                        htmlFor="logo-upload"
                        className={`flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-xl transition-all group ${
                          uploadingLogo 
                            ? 'border-primary bg-primary/10 cursor-wait' 
                            : 'border-gray-300 dark:border-gray-700 cursor-pointer hover:border-primary hover:bg-primary/5'
                        }`}
                      >
                        <div className="text-center space-y-2">
                          {uploadingLogo ? (
                            <>
                              <div className="w-12 h-12 mx-auto rounded-full bg-primary/20 flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                              </div>
                              <p className="text-xs font-medium text-primary">Enviando...</p>
                            </>
                          ) : (
                            <>
                              <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Upload className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-foreground">Clique para fazer upload</p>
                                <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG • Max 2MB</p>
                              </div>
                              {storeData.logo && (
                                <div className="pt-2">
                                  <span className="text-[10px] font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 px-2 py-1 rounded-full">
                                    ✓ Imagem carregada
                                  </span>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                  </div>
                  
                </div>

                {/* Informações adicionais */}
                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                      <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-300 mb-1">
                        Visualização em tempo real
                      </h4>
                      <p className="text-[11px] text-blue-700 dark:text-blue-400 leading-relaxed">
                        As imagens que você carregar aparecerão instantaneamente no preview do celular ao lado, mostrando exatamente como ficarão no app.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coluna 2: Preview no App - SEMPRE VISÍVEL */}
            <Card className="lg:col-span-1 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-6 bg-green-500 rounded-full animate-pulse"></div>
                  <CardTitle className="text-lg">Preview no App</CardTitle>
            </div>
                <CardDescription className="text-xs pt-1">
                  Veja como aparece no aplicativo
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center pb-8 pt-2">
                {/* Mockup de Celular - Melhorado e Maior */}
                <div className="relative">
                  {/* Frame do iPhone */}
                  <div className="relative w-[300px] h-[600px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl border-[8px] border-gray-800">
                    {/* Notch */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-gray-900 rounded-b-3xl z-20"></div>
                    
                    {/* Tela */}
                    <div className="w-full h-full bg-white dark:bg-gray-950 rounded-[2.25rem] overflow-hidden relative shadow-inner">
                      {/* Status Bar */}
                      <div className="absolute top-0 left-0 right-0 h-11 bg-gradient-to-b from-black/30 to-transparent z-10 flex items-center justify-between px-6 pt-2">
                        <span className="text-[11px] font-semibold text-white drop-shadow">9:41</span>
                        <div className="flex items-center gap-1.5">
                          <div className="w-4 h-3 border-2 border-white rounded-sm">
                            <div className="w-2 h-1.5 bg-white rounded-sm m-0.5"></div>
                          </div>
                        </div>
                      </div>

                      {/* Conteúdo Scrollável */}
                      <div className="h-full overflow-y-auto">
                        {/* Banner Preview - Limpo */}
                        {storeData.coverImage ? (
                          <div className="relative h-32 bg-gradient-to-b from-gray-100 to-gray-50 dark:from-gray-900 dark:to-gray-800">
                            <img
                              src={storeData.coverImage}
                              alt="Banner"
                              className="w-full h-full object-cover"
                            />
                            {/* Overlay sutil */}
                            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/5"></div>
                          </div>
                        ) : (
                          <div className="h-32 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-50 dark:from-gray-800 dark:via-gray-850 dark:to-gray-900 flex items-center justify-center">
                            <div className="text-center">
                              <ImageIcon className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                              <p className="text-[10px] text-gray-500">Sem banner</p>
                            </div>
                          </div>
                        )}
                            
                        {/* Logo + Info Preview - Corrigido */}
                        <div className="px-4 pt-0 pb-3 bg-white dark:bg-gray-950">
                          <div className="flex items-start gap-3">
                            {storeData.logo ? (
                              <div className="w-16 h-16 rounded-xl overflow-hidden border-[3px] border-white dark:border-gray-900 shadow-xl bg-white flex-shrink-0 ring-1 ring-gray-200 dark:ring-gray-800 -mt-8">
                                <img
                                  src={storeData.logo}
                                  alt="Logo"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center flex-shrink-0 shadow-xl border-[3px] border-white dark:border-gray-900 -mt-8">
                                <ImageIcon className="h-7 w-7 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0 pt-0.5">
                                  <h3 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                    {storeData.name || 'Nome da Loja'}
                                  </h3>
                              <p className="text-[11px] text-gray-600 dark:text-gray-400 truncate mt-0.5">
                                    {storeData.category || 'Categoria'}
                                  </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                    <div className="flex items-center gap-0.5">
                                  <span className="text-yellow-500 text-[11px]">★</span>
                                  <span className="text-[11px] font-semibold text-gray-900 dark:text-white">4.8</span>
                                    </div>
                                <span className="text-gray-400 text-[11px]">•</span>
                                <span className="text-[11px] text-gray-600 dark:text-gray-400">30-40 min</span>
                                <span className="text-gray-400 text-[11px]">•</span>
                                <span className="text-[11px] text-gray-600 dark:text-gray-400">R$ 5,00</span>
                                  </div>
                                </div>
                              </div>
                              
                              {storeData.description && (
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-3 line-clamp-2 leading-relaxed">
                                  {storeData.description}
                                </p>
                              )}

                              {/* Badges de informação */}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <div className="flex items-center gap-1 px-2 py-1 bg-green-50 dark:bg-green-950 rounded-full">
                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                              <span className="text-[10px] font-semibold text-green-700 dark:text-green-400">Aberta Agora</span>
                                </div>
                            <div className="px-2 py-1 bg-blue-50 dark:bg-blue-950 rounded-full">
                              <span className="text-[10px] font-medium text-blue-700 dark:text-blue-400">Entrega Grátis</span>
                                </div>
                              </div>
                            </div>

                            {/* Tabs de Navegação */}
                        <div className="border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-10">
                          <div className="flex px-4 gap-4">
                            <button className="py-2.5 text-[11px] font-semibold text-primary border-b-2 border-primary">
                                  Cardápio
                                </button>
                            <button className="py-2.5 text-[11px] font-medium text-gray-500">
                                  Informações
                                </button>
                            <button className="py-2.5 text-[11px] font-medium text-gray-500">
                                  Avaliações
                                </button>
                              </div>
                            </div>

                        {/* Exemplo de item do cardápio - Melhorado */}
                        <div className="p-4 space-y-2.5 bg-white dark:bg-gray-950">
                          <h4 className="text-xs font-bold text-gray-900 dark:text-white">Pratos em Destaque</h4>
                          <div className="flex gap-2.5 p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                            <div className="w-20 h-20 bg-gradient-to-br from-orange-200 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm">
                              <span className="text-2xl">🍽️</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h5 className="text-[11px] font-bold text-gray-900 dark:text-white leading-tight">
                                Prato Especial da Casa
                              </h5>
                              <p className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-2 mt-1 leading-relaxed">
                                Delicioso prato preparado com ingredientes frescos e selecionados
                              </p>
                              <div className="flex items-center justify-between mt-1.5">
                                <p className="text-xs font-bold text-primary">R$ 29,90</p>
                                <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                  <span className="text-white text-xs font-bold">+</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Segundo item para dar contexto */}
                          <div className="flex gap-2.5 p-2.5 bg-gray-50 dark:bg-gray-900 rounded-xl opacity-60">
                            <div className="w-20 h-20 bg-gradient-to-br from-green-200 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg flex-shrink-0 flex items-center justify-center shadow-sm">
                              <span className="text-2xl">🥗</span>
                            </div>
                                <div className="flex-1 min-w-0">
                              <h5 className="text-[11px] font-bold text-gray-900 dark:text-white">Outro Item</h5>
                              <p className="text-[10px] text-gray-600 dark:text-gray-400 line-clamp-1 mt-1">
                                Mais opções do cardápio...
                              </p>
                              <p className="text-xs font-bold text-gray-900 dark:text-white mt-1.5">R$ 24,90</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                    {/* Indicador Home do iPhone */}
                    <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-gray-700 rounded-full"></div>
                    </div>

                  {/* Badge "Preview em Tempo Real" */}
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-gradient-to-r from-primary to-primary/90 rounded-full shadow-lg">
                    <span className="text-[10px] font-bold text-white">✨ Preview em Tempo Real</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
          </div>
        </TabsContent>

        {/* TAB: Informações Básicas */}
        <TabsContent value="basic" className="space-y-6">
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Informações Básicas
            </CardTitle>
              <CardDescription>
                Dados principais da sua loja
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
                  <Label htmlFor="storeName">Nome da Loja *</Label>
              <Input 
                id="storeName" 
                value={storeData.name}
                onChange={(e) => setStoreData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Terraço Gourmet"
              />
            </div>

            <div className="space-y-2">
                  <Label htmlFor="storeCategory">Categoria *</Label>
              <Input 
                id="storeCategory" 
                value={storeData.category}
                onChange={(e) => setStoreData(prev => ({ ...prev, category: e.target.value }))}
                placeholder="Ex: Restaurante • Comida Caseira"
              />
            </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="storeDescription">Descrição</Label>
                <Textarea 
                  id="storeDescription" 
                  value={storeData.description}
                  onChange={(e) => setStoreData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva sua loja, especialidades e diferenciais..."
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  Uma boa descrição ajuda clientes a conhecerem sua loja
                </p>
            </div>
          </CardContent>
        </Card>

          {/* Categorias */}
          <CategorySelector
            selectedCategories={selectedCategories}
            onChange={setSelectedCategories}
          />
        </TabsContent>

        {/* TAB: Contato e Endereço */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Informações de Contato
            </CardTitle>
              <CardDescription>
                Como os clientes podem entrar em contato
              </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Telefone *
                  </Label>
              <Input 
                id="phone" 
                value={storeData.phone}
                onChange={(e) => setStoreData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    E-mail *
                  </Label>
              <Input 
                id="email" 
                type="email" 
                value={storeData.email}
                onChange={(e) => setStoreData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contato@minhaloja.com"
              />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Site (opcional)
                </Label>
              <Input 
                id="website" 
                value={storeData.website}
                onChange={(e) => setStoreData(prev => ({ ...prev, website: e.target.value }))}
                  placeholder="www.minhaloja.com"
              />
            </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Endereço
              </CardTitle>
              <CardDescription>
                Localização da sua loja
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="street">Rua *</Label>
                <Input 
                      id="street"
                      placeholder="Av. Paulista"
                  value={storeData.street}
                  onChange={(e) => setStoreData(prev => ({ ...prev, street: e.target.value }))}
                />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="number">Número *</Label>
                <Input 
                      id="number"
                      placeholder="1000"
                  value={storeData.number}
                  onChange={(e) => setStoreData(prev => ({ ...prev, number: e.target.value }))}
                />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="neighborhood">Bairro *</Label>
                <Input 
                      id="neighborhood"
                      placeholder="Bela Vista"
                  value={storeData.neighborhood}
                  onChange={(e) => setStoreData(prev => ({ ...prev, neighborhood: e.target.value }))}
                />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">CEP *</Label>
                <Input 
                      id="zipCode"
                      placeholder="01310-100"
                  value={storeData.zipCode}
                  onChange={(e) => setStoreData(prev => ({ ...prev, zipCode: e.target.value }))}
                />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-2">
                    <Label htmlFor="city">Cidade *</Label>
                <Input 
                      id="city"
                      placeholder="São Paulo"
                  value={storeData.city}
                  onChange={(e) => setStoreData(prev => ({ ...prev, city: e.target.value }))}
                />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">Estado *</Label>
                <Input 
                      id="state"
                      placeholder="SP"
                  value={storeData.state}
                  onChange={(e) => setStoreData(prev => ({ ...prev, state: e.target.value }))}
                      maxLength={2}
                />
                  </div>
              </div>
            </div>
          </CardContent>
        </Card>
        </TabsContent>

        {/* TAB: Horários de Funcionamento */}
        <TabsContent value="hours" className="space-y-6">
          <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Horário de Funcionamento
            </CardTitle>
              <CardDescription>
                Defina quando sua loja aceita pedidos
              </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {operatingHours.map((schedule, index) => (
                  <div 
                    key={schedule.key} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border rounded-lg hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                    <Switch 
                      checked={schedule.isOpen}
                      onCheckedChange={(checked) => updateSchedule(index, 'isOpen', checked)}
                    />
                      <span className="font-medium text-sm sm:text-base min-w-[120px]">
                        {schedule.day}
                      </span>
                  </div>
                  
                  {schedule.isOpen ? (
                      <div className="flex items-center gap-2 ml-auto">
                      <Input 
                        type="time" 
                        value={schedule.open}
                        onChange={(e) => updateSchedule(index, 'open', e.target.value)}
                          className="w-24 sm:w-28"
                      />
                        <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <Input 
                        type="time" 
                        value={schedule.close}
                        onChange={(e) => updateSchedule(index, 'close', e.target.value)}
                          className="w-24 sm:w-28"
                      />
                    </div>
                  ) : (
                      <Badge variant="secondary" className="ml-auto">
                        Fechado
                      </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        </TabsContent>
      </Tabs>

      {/* Nota sobre sincronização */}
      <Card className="border-l-4 border-l-primary bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse mt-2"></div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                ✨ Sincronização em Tempo Real
              </h3>
          <p className="text-sm text-muted-foreground">
            Todas as alterações feitas aqui aparecerão <strong>instantaneamente</strong> no app mobile dos seus clientes. 
            Não é necessário republicar ou aguardar aprovação.
          </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StoreSettings; 
