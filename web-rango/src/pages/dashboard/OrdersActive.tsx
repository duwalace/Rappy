import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Clock, 
  Package, 
  User, 
  MapPin, 
  Phone,
  DollarSign,
  ChefHat,
  Bike,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Timer,
  AlertTriangle,
  Bell,
  CreditCard,
  Banknote,
  MessageSquare,
  Wallet
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToActiveStoreOrders, updateOrderStatus } from "@/services/orderService";
import { Order, OrderStatus } from "@/types/shared";
import { useToast } from "@/hooks/use-toast";
import { createDeliveryOffer } from "@/services/deliveryOfferService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const OrdersActive = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [updating, setUpdating] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [viewMode, setViewMode] = useState<'all' | 'kanban'>('all');
  const [requestingDelivery, setRequestingDelivery] = useState<string | null>(null);
  
  // Ref para rastrear contagem anterior de pedidos
  const previousOrderCount = useRef(0);

  // Solicitar permissão para notificações ao montar
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Função para tocar som de notificação
  const playNotificationSound = () => {
    try {
      const audio = new Audio('/sounds/new-order.mp3');
      audio.volume = 0.7;
      audio.play().catch((error) => {
        console.error('Erro ao tocar som:', error);
      });
    } catch (error) {
      console.error('Erro ao criar áudio:', error);
    }
  };

  // Função para mostrar notificação desktop
  const showDesktopNotification = (title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/logo.png',
        badge: '/favicon.ico',
        tag: 'new-order',
        requireInteraction: true,
        vibrate: [200, 100, 200],
      });

      // Focar na aba quando clicar na notificação
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  };

  // Atualizar título da página com contador
  useEffect(() => {
    const pendingCount = activeOrders.filter(o => o.status === 'pending').length;
    
    if (pendingCount > 0) {
      document.title = `(${pendingCount}) Novos Pedidos - Rappy`;
    } else if (activeOrders.length > 0) {
      document.title = `(${activeOrders.length}) Pedidos Ativos - Rappy`;
    } else {
      document.title = 'Pedidos Ativos - Rappy';
    }

    return () => {
      document.title = 'Rappy';
    };
  }, [activeOrders]);

  // Detectar novos pedidos e disparar notificações
  useEffect(() => {
    if (loading) return;

    const currentCount = activeOrders.length;
    
    // Se houver mais pedidos que antes (novo pedido)
    if (currentCount > previousOrderCount.current && previousOrderCount.current > 0) {
      const newOrdersCount = currentCount - previousOrderCount.current;
      
      // Tocar som
      playNotificationSound();
      
      // Mostrar notificação desktop
      showDesktopNotification(
        '🔔 Novo Pedido Recebido!',
        `Você recebeu ${newOrdersCount} ${newOrdersCount === 1 ? 'novo pedido' : 'novos pedidos'}`
      );
      
      // Toast visual
      toast({
        title: "🔔 Novo Pedido Recebido!",
        description: "Confirme o pedido para iniciar o preparo",
        duration: 5000,
      });
    }
    
    previousOrderCount.current = currentCount;
  }, [activeOrders.length, loading, toast]);

  // Subscrever a pedidos ativos em tempo real
  useEffect(() => {
    if (!user?.storeId) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToActiveStoreOrders(user.storeId, (orders) => {
      setActiveOrders(orders);
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.storeId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTimeAgo = (date: any) => {
    const now = new Date();
    const orderDate = date instanceof Date ? date : new Date(date);
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d`;
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200";
      case "confirmed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200";
      case "preparing":
        return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 border-orange-200";
      case "ready":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200";
      case "in_delivery":
        return "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400 border-cyan-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200";
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    const labels: Record<OrderStatus, string> = {
      pending: "Novo Pedido",
      confirmed: "Confirmado",
      preparing: "Preparando",
      ready: "Pronto",
      in_delivery: "Em Entrega",
      delivered: "Entregue",
      completed: "Concluído",
      cancelled: "Cancelado"
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      case "confirmed":
        return <CheckCircle2 className="h-4 w-4" />;
      case "preparing":
        return <ChefHat className="h-4 w-4" />;
      case "ready":
        return <Package className="h-4 w-4" />;
      case "in_delivery":
        return <Bike className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const handleOpenStatusDialog = (order: Order) => {
    setSelectedOrder(order);
    setNewStatus('');
    setShowStatusDialog(true);
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !newStatus) return;

    setUpdating(true);
    try {
      await updateOrderStatus(selectedOrder.id, newStatus);
      
      toast({
        title: "✅ Status atualizado!",
        description: `Pedido #${selectedOrder.id.slice(0, 8)} agora está ${getStatusLabel(newStatus)}`,
      });
      
      setShowStatusDialog(false);
      setSelectedOrder(null);
      setNewStatus('');
    } catch (error) {
      console.error('❌ Erro ao atualizar status:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o status do pedido",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getNextStatusOptions = (currentStatus: OrderStatus): OrderStatus[] => {
    const workflow: Record<OrderStatus, OrderStatus[]> = {
      pending: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['ready', 'cancelled'],
      ready: ['in_delivery', 'cancelled'],
      in_delivery: ['delivered', 'cancelled'],
      delivered: ['completed'],
      completed: [],
      cancelled: []
    };
    return workflow[currentStatus] || [];
  };

  // Solicitar entregador para pedido
  const handleRequestDelivery = async (order: Order) => {
    if (!order.id) return;
    
    setRequestingDelivery(order.id);
    try {
      await createDeliveryOffer(order);
      
      toast({
        title: "🚴 Entregador Solicitado!",
        description: "Procurando entregador disponível na região...",
        duration: 5000,
      });
    } catch (error: any) {
      console.error('❌ Erro ao solicitar entregador:', error);
      toast({
        title: "Erro",
        description: error.message || "Não foi possível solicitar entregador",
        variant: "destructive",
      });
    } finally {
      setRequestingDelivery(null);
    }
  };

  // Calcular estatísticas
  const stats = useMemo(() => {
    const totalOrders = activeOrders.length;
    const totalRevenue = activeOrders.reduce((sum, order) => sum + order.total, 0);
    const newOrders = activeOrders.filter(o => o.status === 'pending').length;
    const preparing = activeOrders.filter(o => o.status === 'preparing').length;
    const inDelivery = activeOrders.filter(o => o.status === 'in_delivery').length;
    
    // Pedidos urgentes (mais de 30 min)
    const urgent = activeOrders.filter(order => {
      const diffMs = new Date().getTime() - new Date(order.createdAt).getTime();
      return diffMs > 30 * 60 * 1000;
    }).length;

    return { totalOrders, totalRevenue, newOrders, preparing, inDelivery, urgent };
  }, [activeOrders]);

  // Agrupar pedidos por status
  const ordersByStatus = useMemo(() => {
    return {
      pending: activeOrders.filter(o => o.status === 'pending'),
      confirmed: activeOrders.filter(o => o.status === 'confirmed'),
      preparing: activeOrders.filter(o => o.status === 'preparing'),
      ready: activeOrders.filter(o => o.status === 'ready'),
      in_delivery: activeOrders.filter(o => o.status === 'in_delivery'),
    };
  }, [activeOrders]);

  const OrderCard = ({ order }: { order: Order }) => {
    const isUrgent = () => {
      const diffMs = new Date().getTime() - new Date(order.createdAt).getTime();
      return diffMs > 30 * 60 * 1000;
    };

    return (
      <Card className={`hover:shadow-lg transition-all ${isUrgent() ? 'border-2 border-red-500 shadow-red-100' : 'shadow-card'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">
                #{order.id.slice(0, 8)}
              </CardTitle>
              {isUrgent() && (
                <Badge variant="destructive" className="gap-1 text-xs">
                  <AlertTriangle className="h-3 w-3" />
                  Urgente
                </Badge>
              )}
            </div>
            <Badge className={`${getStatusColor(order.status)} gap-1 border`}>
              {getStatusIcon(order.status)}
              {getStatusLabel(order.status)}
            </Badge>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Há {getTimeAgo(order.createdAt)}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Cliente */}
          <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900/50 rounded-lg">
            <User className="h-4 w-4 text-primary mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{order.customerName || 'Cliente'}</p>
              <p className="text-xs text-muted-foreground truncate">{order.customerId}</p>
            </div>
          </div>

          {/* Itens */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Package className="h-3 w-3" />
              Itens ({order.items?.length || 0})
            </div>
            <div className="space-y-1">
              {order.items?.slice(0, 2).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-sm">
                  <span className="text-xs">
                    {item.quantity}x {item.name}
                  </span>
                  <span className="text-xs font-medium">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
              {order.items && order.items.length > 2 && (
                <p className="text-xs text-muted-foreground">
                  +{order.items.length - 2} {order.items.length - 2 === 1 ? 'item' : 'itens'}
                </p>
              )}
            </div>
          </div>

          {/* Endereço */}
          {order.deliveryAddress && (
            <div className="flex items-start gap-2 text-xs">
              <MapPin className="h-3 w-3 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="truncate">{order.deliveryAddress.street}, {order.deliveryAddress.number}</p>
                <p className="text-muted-foreground">{order.deliveryAddress.neighborhood}</p>
              </div>
            </div>
          )}

          {/* Instruções de Entrega */}
          {order.deliveryInstructions && (
            <div className="flex items-start gap-2 p-2 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900">
              <MessageSquare className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-blue-900 dark:text-blue-100 mb-1">Instruções do Cliente:</p>
                <p className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap">{order.deliveryInstructions}</p>
              </div>
            </div>
          )}

          {/* Pagamento */}
          <div className="flex items-start gap-2 p-2 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-900">
            {order.paymentMethod === 'cash' ? (
              <Banknote className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            ) : order.paymentMethod === 'pix' ? (
              <Wallet className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            ) : (
              <CreditCard className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-green-900 dark:text-green-100 mb-0.5">Pagamento:</p>
              <p className="text-xs text-green-800 dark:text-green-200">
                {order.paymentMethod === 'cash' && 'Dinheiro'}
                {order.paymentMethod === 'pix' && 'PIX'}
                {order.paymentMethod === 'credit_card' && 'Cartão de Crédito'}
                {order.paymentMethod === 'debit_card' && 'Cartão de Débito'}
              </p>
              {order.paymentMethod === 'cash' && order.changeFor && (
                <p className="text-xs font-bold text-green-700 dark:text-green-300 mt-1">
                  💵 Troco para: {formatCurrency(order.changeFor)}
                  <span className="ml-2 text-muted-foreground">
                    (Levar R$ {(order.changeFor - order.total).toFixed(2).replace('.', ',')} de troco)
                  </span>
                </p>
              )}
            </div>
          </div>

          {/* Total e Ações */}
          <div className="flex items-center justify-between pt-3 border-t">
            <div>
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(order.total)}</p>
            </div>
            <div className="flex gap-2">
              {/* Botão Solicitar Entregador (apenas quando pronto) */}
              {order.status === 'ready' && (
                <Button 
                  onClick={() => handleRequestDelivery(order)} 
                  size="sm"
                  variant="outline"
                  disabled={requestingDelivery === order.id}
                  className="bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-300"
                >
                  {requestingDelivery === order.id ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-700 mr-2"></div>
                      Procurando...
                    </>
                  ) : (
                    <>
                      <Bike className="h-4 w-4 mr-2" />
                      Solicitar Entregador
                    </>
                  )}
                </Button>
              )}
              
              <Button 
                onClick={() => handleOpenStatusDialog(order)} 
                size="sm"
                variant="default"
              >
                Atualizar Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold">Pedidos em Andamento</h1>
            {stats.newOrders > 0 && (
              <Badge variant="destructive" className="h-7 px-3 animate-pulse">
                <Bell className="h-3 w-3 mr-1" />
                {stats.newOrders} {stats.newOrders === 1 ? 'novo' : 'novos'}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Gerencie todos os pedidos ativos em tempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-950/30 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-medium text-green-700 dark:text-green-400">
              Tempo Real
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="shadow-lg border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total Ativo</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-2 border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-700 dark:text-red-400 mb-1">Novos</p>
                <p className="text-2xl font-bold text-red-600">{stats.newOrders}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-2 border-orange-200 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-700 dark:text-orange-400 mb-1">Preparando</p>
                <p className="text-2xl font-bold text-orange-600">{stats.preparing}</p>
              </div>
              <ChefHat className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-2 border-cyan-200 bg-cyan-50 dark:bg-cyan-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-cyan-700 dark:text-cyan-400 mb-1">Em Entrega</p>
                <p className="text-2xl font-bold text-cyan-600">{stats.inDelivery}</p>
              </div>
              <Bike className="h-8 w-8 text-cyan-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-lg border-2 border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-700 dark:text-green-400 mb-1">Receita</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Visualização */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2 h-11">
          <TabsTrigger value="all">Todos os Pedidos</TabsTrigger>
          <TabsTrigger value="kanban">Visão Kanban</TabsTrigger>
        </TabsList>

        {/* Visão de Todos os Pedidos */}
        <TabsContent value="all" className="space-y-4">
          {activeOrders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <Card className="shadow-lg border-2">
              <CardContent className="py-12 text-center">
                <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-semibold mb-2">Nenhum pedido ativo</h3>
                <p className="text-muted-foreground">
                  Quando houver novos pedidos, eles aparecerão aqui automaticamente
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Visão Kanban */}
        <TabsContent value="kanban" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {(['pending', 'confirmed', 'preparing', 'ready', 'in_delivery'] as const).map((status) => (
              <div key={status} className="space-y-3">
                <div className={`p-3 rounded-lg ${getStatusColor(status as OrderStatus)} border-2`}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status as OrderStatus)}
                    <h3 className="font-semibold text-sm">{getStatusLabel(status as OrderStatus)}</h3>
                  </div>
                  <Badge variant="secondary" className="mt-2">
                    {ordersByStatus[status].length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {ordersByStatus[status].map((order) => (
                    <OrderCard key={order.id} order={order} />
                  ))}
                  {ordersByStatus[status].length === 0 && (
                    <div className="p-4 border-2 border-dashed rounded-lg text-center text-xs text-muted-foreground">
                      Nenhum pedido
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Atualização de Status */}
      <Dialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Status do Pedido</DialogTitle>
            <DialogDescription>
              Pedido #{selectedOrder?.id.slice(0, 8)} • {selectedOrder?.customerName}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status Atual</label>
              <div className="flex items-center gap-2">
                <Badge className={`${getStatusColor(selectedOrder?.status || 'pending')} gap-1`}>
                  {getStatusIcon(selectedOrder?.status || 'pending')}
                  {getStatusLabel(selectedOrder?.status || 'pending')}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Novo Status</label>
              <Select value={newStatus} onValueChange={(value) => setNewStatus(value as OrderStatus)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo status" />
                </SelectTrigger>
                <SelectContent>
                  {selectedOrder && getNextStatusOptions(selectedOrder.status).map((status) => (
                    <SelectItem key={status} value={status}>
                      {getStatusLabel(status)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusDialog(false)} disabled={updating}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateStatus} disabled={!newStatus || updating}>
              {updating ? 'Atualizando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrdersActive; 