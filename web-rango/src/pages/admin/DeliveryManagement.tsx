/**
 * DeliveryManagement.tsx
 * Painel Admin - Gestão completa de entregadores
 * Nova arquitetura com delivery_partners e Cloud Functions
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Bike,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Activity,
  Clock,
  Star,
  DollarSign,
  Package,
  Ban,
  Shield,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  User,
  CreditCard,
  Car,
  Building2,
  IdCard,
  AlertTriangle,
  Percent
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  DeliveryPartner, 
  DeliveryPartnerFilters,
  DeliveryPartnerStats
} from "@/types/delivery";
import {
  getDeliveryPartners,
  getDeliveryPartnerById,
  getDeliveryPartnerStats,
  approveDeliveryPartner,
  rejectDeliveryPartner,
  suspendDeliveryPartner,
  reactivateDeliveryPartner
} from "@/services/deliveryPartnerService";
import { collection, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface DeliveryPerson {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  cpf: string;
  vehicle: {
    type: 'bike' | 'motorcycle' | 'car';
    brand?: string;
    model?: string;
    plate?: string;
    year?: number;
  };
  documents: {
    cnh: {
      number: string;
      category: string;
      expirationDate?: Timestamp;
      imageUrl?: string;
    };
    rg: {
      number: string;
      imageUrl?: string;
    };
    proofOfAddress?: {
      imageUrl?: string;
    };
  };
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  };
  bankAccount?: {
    bankName: string;
    accountType: 'checking' | 'savings';
    agency: string;
    accountNumber: string;
    cpf: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'blocked' | 'suspended';
  availability: 'online' | 'offline' | 'busy';
  isActive: boolean;
  stats: {
    totalEarnings: number;
    completedDeliveries: number;
    totalDeliveries: number;
    canceledDeliveries: number;
    rating: number;
    reviewCount: number;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  approvedAt?: Timestamp;
  rejectedAt?: Timestamp;
  rejectionReason?: string;
}

interface Trip {
  id: string;
  deliveryPersonId: string | null;
  deliveryPersonName: string | null;
  orderId: string;
  storeId: string;
  storeName: string;
  deliveryFee: number;
  totalValue: number;
  status: 'pending' | 'assigned' | 'accepted' | 'picked_up' | 'delivered' | 'cancelled' | 'rejected';
  createdAt: Timestamp;
  deliveryTime: Timestamp | null;
}

export default function DeliveryManagement() {
  const [deliveryPersons, setDeliveryPersons] = useState<DeliveryPerson[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("pending");
  const [selectedDelivery, setSelectedDelivery] = useState<DeliveryPerson | null>(null);
  const [detailsDialog, setDetailsDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState<{
    open: boolean;
    action: "approve" | "reject" | "block" | "unblock" | null;
    delivery: DeliveryPerson | null;
  }>({ open: false, action: null, delivery: null });
  const [rejectionReason, setRejectionReason] = useState("");
  const [deliveryTrips, setDeliveryTrips] = useState<Trip[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    loadDeliveryPersons();
  }, []);

  const loadDeliveryPersons = async () => {
    setLoading(true);
    try {
      const deliveryCollection = collection(db, 'deliveryPersons');
      const querySnapshot = await getDocs(deliveryCollection);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DeliveryPerson[];
      
      setDeliveryPersons(data);
    } catch (error) {
      console.error('Erro ao carregar entregadores:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os entregadores',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (delivery: DeliveryPerson) => {
    setSelectedDelivery(delivery);
    
    // Carregar histórico de corridas do entregador
    try {
      const tripsQuery = query(
        collection(db, 'trips'),
        where('deliveryPersonId', '==', delivery.id)
      );
      const tripsSnapshot = await getDocs(tripsQuery);
      const trips = tripsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trip[];
      
      setDeliveryTrips(trips.sort((a, b) => 
        b.createdAt.toMillis() - a.createdAt.toMillis()
      ));
    } catch (error) {
      console.error('Erro ao carregar corridas:', error);
    }
    
    setDetailsDialog(true);
  };

  const handleApprove = async () => {
    if (!actionDialog.delivery) return;

    try {
      const deliveryRef = doc(db, 'deliveryPersons', actionDialog.delivery.id);
      await updateDoc(deliveryRef, {
        status: 'approved',
        updatedAt: Timestamp.now()
      });

      toast({
        title: 'Entregador Aprovado',
        description: `${actionDialog.delivery.name} foi aprovado com sucesso`,
      });

      setActionDialog({ open: false, action: null, delivery: null });
      loadDeliveryPersons();
    } catch (error) {
      console.error('Erro ao aprovar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível aprovar o entregador',
        variant: 'destructive',
      });
    }
  };

  const handleReject = async () => {
    if (!actionDialog.delivery || !rejectionReason.trim()) {
      toast({
        title: 'Atenção',
        description: 'Por favor, informe o motivo da rejeição',
        variant: 'destructive',
      });
      return;
    }

    try {
      const deliveryRef = doc(db, 'deliveryPersons', actionDialog.delivery.id);
      await updateDoc(deliveryRef, {
        status: 'rejected',
        rejectionReason: rejectionReason,
        updatedAt: Timestamp.now()
      });

      toast({
        title: 'Cadastro Rejeitado',
        description: `Cadastro de ${actionDialog.delivery.name} foi rejeitado`,
      });

      setActionDialog({ open: false, action: null, delivery: null });
      setRejectionReason("");
      loadDeliveryPersons();
    } catch (error) {
      console.error('Erro ao rejeitar:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível rejeitar o cadastro',
        variant: 'destructive',
      });
    }
  };

  const handleBlock = async () => {
    if (!actionDialog.delivery) return;

    try {
      const deliveryRef = doc(db, 'deliveryPersons', actionDialog.delivery.id);
      const newStatus = actionDialog.action === 'block' ? 'blocked' : 'approved';
      
      await updateDoc(deliveryRef, {
        status: newStatus,
        availability: 'offline', // Força offline ao bloquear
        updatedAt: Timestamp.now()
      });

      toast({
        title: actionDialog.action === 'block' ? 'Entregador Bloqueado' : 'Entregador Desbloqueado',
        description: `${actionDialog.delivery.name} foi ${actionDialog.action === 'block' ? 'bloqueado' : 'desbloqueado'}`,
      });

      setActionDialog({ open: false, action: null, delivery: null });
      loadDeliveryPersons();
    } catch (error) {
      console.error('Erro ao bloquear/desbloquear:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível executar a ação',
        variant: 'destructive',
      });
    }
  };

  const filterDeliveryPersons = (status: string) => {
    let filtered = deliveryPersons;
    
    if (status !== 'all') {
      filtered = filtered.filter(d => d.status === status);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(d =>
        d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.phone.includes(searchTerm)
      );
    }
    
    return filtered;
  };

  const formatDate = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return '-';
    return timestamp.toDate().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string; icon: any }> = {
      pending: { variant: 'default', label: 'Pendente', icon: Clock },
      approved: { variant: 'default', label: 'Aprovado', icon: CheckCircle },
      rejected: { variant: 'destructive', label: 'Rejeitado', icon: XCircle },
      blocked: { variant: 'destructive', label: 'Bloqueado', icon: Ban }
    };
    
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getAvailabilityBadge = (availability: string) => {
    if (availability === 'online') {
      return <Badge variant="default"><Activity className="h-3 w-3 mr-1" />Online</Badge>;
    }
    return <Badge variant="secondary">Offline</Badge>;
  };

  const getVehicleLabel = (type: string) => {
    const labels: Record<string, string> = {
      bike: 'Bicicleta',
      motorcycle: 'Moto',
      car: 'Carro'
    };
    return labels[type] || type;
  };

  const getTripStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: 'secondary', label: 'Pendente' },
      assigned: { variant: 'default', label: 'Atribuída' },
      accepted: { variant: 'default', label: 'Aceita' },
      picked_up: { variant: 'default', label: 'Coletada' },
      delivered: { variant: 'default', label: 'Entregue' },
      cancelled: { variant: 'destructive', label: 'Cancelada' },
      rejected: { variant: 'destructive', label: 'Rejeitada' }
    };
    
    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Estatísticas gerais
  const stats = {
    total: deliveryPersons.length,
    pending: deliveryPersons.filter(d => d.status === 'pending').length,
    approved: deliveryPersons.filter(d => d.status === 'approved').length,
    online: deliveryPersons.filter(d => d.availability === 'online').length,
    blocked: deliveryPersons.filter(d => d.status === 'blocked').length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando entregadores...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Entregadores</h1>
          <p className="text-muted-foreground">Aprove cadastros, monitore performance e gerencie a frota</p>
        </div>
        <Button onClick={loadDeliveryPersons} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Bike className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Entregadores cadastrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
            <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.approved}</div>
            <p className="text-xs text-muted-foreground">Ativos na plataforma</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.online}</div>
            <p className="text-xs text-muted-foreground">Disponíveis agora</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bloqueados</CardTitle>
            <Ban className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.blocked}</div>
            <p className="text-xs text-muted-foreground">Suspensos</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, email ou telefone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="pending">
            Pendentes
            {stats.pending > 0 && (
              <Badge variant="destructive" className="ml-2 animate-pulse">
                {stats.pending}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">Aprovados</TabsTrigger>
          <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
          <TabsTrigger value="blocked">Bloqueados</TabsTrigger>
          <TabsTrigger value="all">Todos</TabsTrigger>
        </TabsList>

        {["pending", "approved", "rejected", "blocked", "all"].map((status) => (
          <TabsContent key={status} value={status}>
            <Card>
              <CardHeader>
                <CardTitle>
                  {status === "all" ? "Todos os Entregadores" : 
                   status === "pending" ? "Aguardando Aprovação" :
                   status === "approved" ? "Entregadores Aprovados" :
                   status === "rejected" ? "Cadastros Rejeitados" :
                   "Entregadores Bloqueados"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Contato</TableHead>
                      <TableHead>Veículo</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Disponibilidade</TableHead>
                      <TableHead>Corridas</TableHead>
                      <TableHead>Avaliação</TableHead>
                      <TableHead>Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filterDeliveryPersons(status).length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Nenhum entregador encontrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      filterDeliveryPersons(status).map((delivery) => (
                        <TableRow key={delivery.id}>
                          <TableCell className="font-medium">{delivery.name}</TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {delivery.email}
                              </div>
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                {delivery.phone}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Bike className="h-4 w-4" />
                              {getVehicleLabel(delivery.vehicle.type)}
                            </div>
                          </TableCell>
                          <TableCell>{getStatusBadge(delivery.status)}</TableCell>
                          <TableCell>{getAvailabilityBadge(delivery.availability)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {delivery.stats?.completedDeliveries || 0}
                            </div>
                          </TableCell>
                          <TableCell>
                            {delivery.stats?.rating > 0 ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {delivery.stats.rating.toFixed(1)}
                                <span className="text-xs text-muted-foreground">
                                  ({delivery.stats.reviewCount})
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">Sem avaliações</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(delivery.createdAt)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(delivery)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {delivery.status === 'pending' && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActionDialog({ 
                                      open: true, 
                                      action: 'approve', 
                                      delivery 
                                    })}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActionDialog({ 
                                      open: true, 
                                      action: 'reject', 
                                      delivery 
                                    })}
                                  >
                                    <XCircle className="h-4 w-4 text-red-500" />
                                  </Button>
                                </>
                              )}
                              
                              {delivery.status === 'approved' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setActionDialog({ 
                                    open: true, 
                                    action: 'block', 
                                    delivery 
                                  })}
                                >
                                  <Ban className="h-4 w-4 text-red-500" />
                                </Button>
                              )}
                              
                              {delivery.status === 'blocked' && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setActionDialog({ 
                                    open: true, 
                                    action: 'unblock', 
                                    delivery 
                                  })}
                                >
                                  <Shield className="h-4 w-4 text-green-500" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Details Dialog - IMPROVED */}
      <Dialog open={detailsDialog} onOpenChange={setDetailsDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl">Análise de Cadastro - Entregador</DialogTitle>
                <DialogDescription>
                  Verifique todos os dados antes de aprovar ou rejeitar
                </DialogDescription>
              </div>
              {selectedDelivery && (
                <div className="flex gap-2">
                  {getStatusBadge(selectedDelivery.status)}
                  {getAvailabilityBadge(selectedDelivery.availability)}
                </div>
              )}
            </div>
          </DialogHeader>

          {selectedDelivery && (
            <div className="space-y-6">
              {/* Header com Info Rápida */}
              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 border-2">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <User className="h-8 w-8 text-primary" />
                        <div>
                          <h3 className="text-2xl font-bold">{selectedDelivery.name}</h3>
                          <p className="text-sm text-muted-foreground">ID: {selectedDelivery.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedDelivery.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedDelivery.phone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground mb-1">Data de Cadastro</p>
                      <p className="text-sm font-medium">{formatDate(selectedDelivery.createdAt)}</p>
                      {selectedDelivery.approvedAt && (
                        <>
                          <p className="text-xs text-muted-foreground mt-2 mb-1">Aprovado em</p>
                          <p className="text-sm font-medium text-green-600">{formatDate(selectedDelivery.approvedAt)}</p>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-6">
                {/* Coluna Esquerda */}
                <div className="space-y-6">
                  {/* Dados Pessoais */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <IdCard className="h-5 w-5 text-primary" />
                        Documentos Pessoais
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">CPF</p>
                          <p className="font-mono font-semibold text-lg">{selectedDelivery.cpf}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">RG</p>
                          <p className="font-mono font-semibold text-lg">{selectedDelivery.documents?.rg?.number || 'Não informado'}</p>
                        </div>
                      </div>
                      
                      {selectedDelivery.documents?.cnh && (
                        <div className="border-t pt-4">
                          <p className="text-sm font-semibold mb-3 flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            CNH (Habilitação)
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Número CNH</p>
                              <p className="font-mono font-medium">{selectedDelivery.documents.cnh.number}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Categoria</p>
                              <Badge variant="outline" className="font-bold text-base">
                                {selectedDelivery.documents.cnh.category}
                              </Badge>
                            </div>
                            {selectedDelivery.documents.cnh.expirationDate && (
                              <div className="col-span-2">
                                <p className="text-xs text-muted-foreground mb-1">Validade</p>
                                <p className="font-medium">{formatDate(selectedDelivery.documents.cnh.expirationDate)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Endereço */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        Endereço Residencial
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm">
                        <p className="font-medium">
                          {selectedDelivery.address.street}, {selectedDelivery.address.number}
                          {selectedDelivery.address.complement && ` - ${selectedDelivery.address.complement}`}
                        </p>
                        <p className="text-muted-foreground">{selectedDelivery.address.neighborhood}</p>
                        <p className="font-medium">{selectedDelivery.address.city}/{selectedDelivery.address.state}</p>
                        <p className="text-muted-foreground">CEP: {selectedDelivery.address.zipCode}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Dados Bancários */}
                  {selectedDelivery.bankAccount && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Building2 className="h-5 w-5 text-primary" />
                          Dados Bancários
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Banco</p>
                          <p className="font-semibold">{selectedDelivery.bankAccount.bankName}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Agência</p>
                            <p className="font-mono font-medium">{selectedDelivery.bankAccount.agency}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Conta</p>
                            <p className="font-mono font-medium">{selectedDelivery.bankAccount.accountNumber}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Tipo de Conta</p>
                          <Badge variant="secondary">
                            {selectedDelivery.bankAccount.accountType === 'checking' ? 'Conta Corrente' : 'Conta Poupança'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {/* Coluna Direita */}
                <div className="space-y-6">
                  {/* Veículo */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Car className="h-5 w-5 text-primary" />
                        Veículo de Entrega
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-2">Tipo de Veículo</p>
                        <Badge variant="default" className="text-base px-4 py-2">
                          {getVehicleLabel(selectedDelivery.vehicle.type)}
                        </Badge>
                      </div>
                      {selectedDelivery.vehicle.plate && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Placa</p>
                            <p className="font-mono font-bold text-lg">{selectedDelivery.vehicle.plate}</p>
                          </div>
                          {selectedDelivery.vehicle.brand && (
                            <div>
                              <p className="text-xs text-muted-foreground mb-1">Marca/Modelo</p>
                              <p className="font-medium">{selectedDelivery.vehicle.brand} {selectedDelivery.vehicle.model}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Performance Stats */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Performance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
                          <Package className="h-6 w-6 mx-auto mb-2 text-green-600" />
                          <div className="text-2xl font-bold">{selectedDelivery.stats?.completedDeliveries || 0}</div>
                          <p className="text-xs text-muted-foreground">Entregas Completas</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
                          <DollarSign className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                          <div className="text-2xl font-bold">R$ {selectedDelivery.stats?.totalEarnings?.toFixed(2) || '0.00'}</div>
                          <p className="text-xs text-muted-foreground">Total Ganhos</p>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-950/30 rounded-lg">
                          <Star className="h-6 w-6 mx-auto mb-2 text-yellow-500 fill-yellow-500" />
                          <div className="text-2xl font-bold">{selectedDelivery.stats?.rating?.toFixed(1) || '0.0'}</div>
                          <p className="text-xs text-muted-foreground">Avaliação Média</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg">
                          <Activity className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                          <div className="text-2xl font-bold">{selectedDelivery.stats?.reviewCount || 0}</div>
                          <p className="text-xs text-muted-foreground">Avaliações</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Histórico Resumido */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Histórico de Corridas ({deliveryTrips.length})</CardTitle>
                    </CardHeader>
                    <CardContent>
                      {deliveryTrips.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          Nenhuma corrida registrada ainda
                        </p>
                      ) : (
                        <div className="max-h-48 overflow-y-auto border rounded-md">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-xs">Data</TableHead>
                                <TableHead className="text-xs">Loja</TableHead>
                                <TableHead className="text-xs">Taxa</TableHead>
                                <TableHead className="text-xs">Status</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {deliveryTrips.slice(0, 10).map((trip) => (
                                <TableRow key={trip.id}>
                                  <TableCell className="text-xs">{formatDate(trip.createdAt).split(' ')[0]}</TableCell>
                                  <TableCell className="text-xs">{trip.storeName.slice(0, 20)}...</TableCell>
                                  <TableCell className="text-xs font-medium text-green-600">
                                    R$ {trip.deliveryFee.toFixed(2)}
                                  </TableCell>
                                  <TableCell>{getTripStatusBadge(trip.status)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Alert/Warning Messages */}
              {selectedDelivery.status === 'rejected' && selectedDelivery.rejectionReason && (
                <Card className="border-red-200 bg-red-50 dark:bg-red-950/30">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-red-800 dark:text-red-400 mb-1">Motivo da Rejeição</h4>
                        <p className="text-sm text-red-700 dark:text-red-300">{selectedDelivery.rejectionReason}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {selectedDelivery.status === 'pending' && (
                <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/30">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <Clock className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-1">Aguardando Aprovação</h4>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          Este cadastro precisa ser aprovado antes que o entregador possa começar a trabalhar.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              {selectedDelivery.status === 'pending' && (
                <div className="flex gap-3 pt-4 border-t">
                  <Button
                    className="flex-1"
                    variant="default"
                    size="lg"
                    onClick={() => {
                      setDetailsDialog(false);
                      setActionDialog({ open: true, action: 'approve', delivery: selectedDelivery });
                    }}
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Aprovar Cadastro
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    size="lg"
                    onClick={() => {
                      setDetailsDialog(false);
                      setActionDialog({ open: true, action: 'reject', delivery: selectedDelivery });
                    }}
                  >
                    <XCircle className="h-5 w-5 mr-2" />
                    Rejeitar Cadastro
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Action Dialogs */}
      <Dialog 
        open={actionDialog.open} 
        onOpenChange={(open) => {
          if (!open) {
            setActionDialog({ open: false, action: null, delivery: null });
            setRejectionReason("");
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'approve' && 'Aprovar Entregador'}
              {actionDialog.action === 'reject' && 'Rejeitar Cadastro'}
              {actionDialog.action === 'block' && 'Bloquear Entregador'}
              {actionDialog.action === 'unblock' && 'Desbloquear Entregador'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.action === 'approve' && 
                'Ao aprovar, o entregador poderá começar a receber corridas.'}
              {actionDialog.action === 'reject' && 
                'Informe o motivo da rejeição. O entregador será notificado.'}
              {actionDialog.action === 'block' && 
                'O entregador será bloqueado e não poderá receber novas corridas.'}
              {actionDialog.action === 'unblock' && 
                'O entregador voltará a ter acesso à plataforma.'}
            </DialogDescription>
          </DialogHeader>

          {actionDialog.action === 'reject' && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Motivo da rejeição</label>
              <Input
                placeholder="Ex: Documentos inválidos, veículo não aprovado..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setActionDialog({ open: false, action: null, delivery: null });
                setRejectionReason("");
              }}
            >
              Cancelar
            </Button>
            <Button
              variant={actionDialog.action === 'approve' || actionDialog.action === 'unblock' ? 'default' : 'destructive'}
              onClick={() => {
                if (actionDialog.action === 'approve') handleApprove();
                else if (actionDialog.action === 'reject') handleReject();
                else if (actionDialog.action === 'block' || actionDialog.action === 'unblock') handleBlock();
              }}
            >
              {actionDialog.action === 'approve' && 'Aprovar'}
              {actionDialog.action === 'reject' && 'Rejeitar'}
              {actionDialog.action === 'block' && 'Bloquear'}
              {actionDialog.action === 'unblock' && 'Desbloquear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
