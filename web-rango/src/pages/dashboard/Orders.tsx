import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck,
  Eye,
  MoreHorizontal,
  Search,
  Filter,
  Calendar,
  DollarSign,
  User,
  MapPin,
  Phone,
  MessageSquare
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useOrders } from "@/hooks/useOrders";
import { useToast } from "@/hooks/use-toast";
import { Order, OrderStatus } from "@/types/shared";
import { createDeliveryOffer, retryDeliveryOffer } from "@/services/deliveryLogicService";

const Orders = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  
  const { 
    orders, 
    loading, 
    updateOrderStatus, 
    getOrdersByStatus, 
    getTodayOrders 
  } = useOrders(user?.storeId || '');

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'preparing':
        return <Clock className="h-4 w-4 text-orange-500" />;
      case 'ready':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'delivered':
        return <Truck className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'preparing':
        return 'bg-orange-100 text-orange-800';
      case 'ready':
        return 'bg-green-100 text-green-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: Order['status']) => {
    switch (status) {
      case 'pending':
        return 'Pendente';
      case 'confirmed':
        return 'Confirmado';
      case 'preparing':
        return 'Preparando';
      case 'ready':
        return 'Pronto';
      case 'delivered':
        return 'Entregue';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: Order['status']) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      
      // Se confirmando pedido, criar oferta de entrega (sem Cloud Functions)
      if (newStatus === 'confirmed' && user?.storeId) {
        console.log('📦 Criando oferta de entrega para pedido:', orderId);
        const result = await createDeliveryOffer(orderId, user.storeId);
        
        if (result.success) {
          toast({
            title: "Sucesso",
            description: `Pedido confirmado! Procurando entregadores disponíveis...`,
          });
        } else {
          toast({
            title: "Aviso",
            description: result.error || "Pedido confirmado, mas não foi possível criar oferta de entrega",
            variant: "default",
          });
        }
      } else {
        toast({
          title: "Sucesso",
          description: `Status do pedido atualizado para ${getStatusLabel(newStatus)}`,
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar status do pedido",
        variant: "destructive",
      });
    }
  };

  // Função para procurar mais entregadores
  const handleFindMoreDeliverers = async (orderId: string) => {
    try {
      const result = await retryDeliveryOffer(orderId);
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Procurando entregadores em área maior...",
        });
      } else {
        toast({
          title: "Erro",
          description: result.error || "Erro ao procurar entregadores",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao procurar entregadores",
        variant: "destructive",
      });
    }
  };

  // Função de busca
  const searchOrders = (orders: Order[], term: string) => {
    if (!term) return orders;
    return orders.filter(order => 
      order.customerName.toLowerCase().includes(term.toLowerCase()) ||
      order.customerPhone.includes(term) ||
      order.id.toLowerCase().includes(term.toLowerCase())
    );
  };

  // Filtrar pedidos
  const filteredOrders = (() => {
    let filtered = selectedStatus === 'all' 
      ? orders 
      : getOrdersByStatus(selectedStatus as Order['status']);
    
    return searchOrders(filtered, searchTerm);
  })();

  // Função para abrir detalhes do pedido
  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setShowOrderDetails(true);
  };

  const todayOrders = getTodayOrders();
  const pendingOrders = getOrdersByStatus('pending');
  const preparingOrders = getOrdersByStatus('preparing');

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold text-foreground">Pedidos</h1>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando pedidos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-foreground">Pedidos</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Buscar por cliente, telefone ou ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-80"
            />
          </div>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os pedidos</SelectItem>
              <SelectItem value="pending">Pendentes</SelectItem>
              <SelectItem value="confirmed">Confirmados</SelectItem>
              <SelectItem value="preparing">Preparando</SelectItem>
              <SelectItem value="ready">Prontos</SelectItem>
              <SelectItem value="delivered">Entregues</SelectItem>
              <SelectItem value="cancelled">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hoje</p>
                <p className="text-2xl font-bold">{todayOrders.length}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingOrders.length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Preparando</p>
                <p className="text-2xl font-bold text-orange-600">{preparingOrders.length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <ShoppingBag className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Pedidos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            Pedidos ({filteredOrders.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredOrders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum pedido encontrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono text-sm">
                      #{order.id.slice(-6)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{order.customerName}</p>
                        <p className="text-sm text-muted-foreground">{order.customerPhone}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {order.items.length} item(s)
                        <p className="text-muted-foreground">
                          {order.items.slice(0, 2).map(item => item.name).join(', ')}
                          {order.items.length > 2 && '...'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(order.total)}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(order.status)}
                          {getStatusLabel(order.status)}
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(order.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleViewOrder(order)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(order.id, 'confirmed')}
                          >
                            Confirmar
                          </Button>
                        )}
                        {order.status === 'confirmed' && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusChange(order.id, 'preparing')}
                            >
                              Preparar
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleFindMoreDeliverers(order.id)}
                              title="Procurar mais entregadores"
                            >
                              <Truck className="h-4 w-4 mr-1" />
                              Buscar +
                            </Button>
                          </>
                        )}
                        {order.status === 'preparing' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(order.id, 'ready')}
                          >
                            Pronto
                          </Button>
                        )}
                        {order.status === 'ready' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(order.id, 'delivered')}
                          >
                            Entregue
                          </Button>
                        )}
                        {order.status === 'pending' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusChange(order.id, 'cancelled')}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Pedido */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Detalhes do Pedido #{selectedOrder?.id.slice(-6)}
            </DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-6">
              {/* Informações do Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Informações do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Nome</p>
                      <p className="font-medium">{selectedOrder.customerName}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Telefone</p>
                      <p className="font-medium flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {selectedOrder.customerPhone}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Endereço de Entrega */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Endereço de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">
                      {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.number}
                    </p>
                    <p className="text-muted-foreground">
                      {selectedOrder.deliveryAddress.neighborhood} - {selectedOrder.deliveryAddress.city}/{selectedOrder.deliveryAddress.state}
                    </p>
                    <p className="text-muted-foreground">
                      CEP: {selectedOrder.deliveryAddress.zipCode}
                    </p>
                    {selectedOrder.deliveryAddress.complement && (
                      <p className="text-muted-foreground">
                        Complemento: {selectedOrder.deliveryAddress.complement}
                      </p>
                    )}
                    {selectedOrder.deliveryInstructions && (
                      <div className="mt-2 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          Instruções especiais:
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedOrder.deliveryInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Itens do Pedido */}
              <Card>
                <CardHeader>
                  <CardTitle>Itens do Pedido</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Quantidade: {item.quantity}
                          </p>
                          {item.observations && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Obs: {item.observations}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-medium">
                            {formatCurrency(item.subtotal)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatCurrency(item.price)} cada
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Resumo Financeiro */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Resumo Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>{formatCurrency(selectedOrder.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de entrega:</span>
                      <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxa de serviço:</span>
                      <span>{formatCurrency(selectedOrder.serviceFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span className="text-primary">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                    <div className="mt-3 p-3 bg-muted rounded-lg">
                      <p className="text-sm">
                        <strong>Forma de pagamento:</strong> {
                          selectedOrder.paymentMethod === 'credit_card' ? 'Cartão de Crédito' :
                          selectedOrder.paymentMethod === 'debit_card' ? 'Cartão de Débito' :
                          selectedOrder.paymentMethod === 'pix' ? 'PIX' :
                          selectedOrder.paymentMethod === 'cash' ? 'Dinheiro' :
                          selectedOrder.paymentMethod
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Informações do Pedido */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Informações do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Status</p>
                      <Badge className={getStatusColor(selectedOrder.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(selectedOrder.status)}
                          {getStatusLabel(selectedOrder.status)}
                        </div>
                      </Badge>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Data do pedido</p>
                      <p className="font-medium">{formatDate(selectedOrder.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Previsão de entrega</p>
                      <p className="font-medium">{formatDate(selectedOrder.estimatedDeliveryTime)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Última atualização</p>
                      <p className="font-medium">{formatDate(selectedOrder.updatedAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Ações do Pedido */}
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowOrderDetails(false)}
                >
                  Fechar
                </Button>
                {selectedOrder.status === 'pending' && (
                  <Button
                    onClick={() => {
                      handleStatusChange(selectedOrder.id, 'confirmed');
                      setShowOrderDetails(false);
                    }}
                  >
                    Confirmar Pedido
                  </Button>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <Button
                    onClick={() => {
                      handleStatusChange(selectedOrder.id, 'preparing');
                      setShowOrderDetails(false);
                    }}
                  >
                    Iniciar Preparo
                  </Button>
                )}
                {selectedOrder.status === 'preparing' && (
                  <Button
                    onClick={() => {
                      handleStatusChange(selectedOrder.id, 'ready');
                      setShowOrderDetails(false);
                    }}
                  >
                    Marcar como Pronto
                  </Button>
                )}
                {selectedOrder.status === 'ready' && (
                  <Button
                    onClick={() => {
                      handleStatusChange(selectedOrder.id, 'delivered');
                      setShowOrderDetails(false);
                    }}
                  >
                    Marcar como Entregue
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Orders;
