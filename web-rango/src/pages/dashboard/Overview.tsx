import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  DollarSign, 
  ShoppingBag, 
  TrendingUp, 
  Clock,
  Users,
  Star,
  Plus,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Package
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToStore } from "@/services/storeService";
import { getDailySummary, getRecentOrders } from "@/services/orderService";
import { Store, Order } from "@/types/shared";

export default function Overview() {
  const { user } = useAuth();
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [dailySummary, setDailySummary] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  // Carregar dados da loja em tempo real
  useEffect(() => {
    if (!user?.storeId) {
      setLoading(false);
      return;
    }

    console.log('🔵 Overview: Carregando dados da loja:', user.storeId);
    
    const unsubscribe = subscribeToStore(user.storeId, (storeData) => {
      console.log('✅ Overview: Dados da loja recebidos:', storeData);
      setStore(storeData);
      setLoading(false);
    });

    return () => {
      console.log('🔴 Overview: Cancelando inscrição da loja');
      unsubscribe();
    };
  }, [user?.storeId]);

  // Carregar resumo diário e pedidos recentes
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user?.storeId) return;

      try {
        console.log('🔵 Overview: Carregando dados do dashboard...');
        
        // Carregar resumo diário (KPIs)
        const summary = await getDailySummary(user.storeId);
        console.log('✅ Resumo diário carregado:', summary);
        setDailySummary(summary);
        
        // Carregar pedidos recentes
        const orders = await getRecentOrders(user.storeId, 4);
        console.log('✅ Pedidos recentes carregados:', orders);
        setRecentOrders(orders);
        
      } catch (error) {
        console.error('❌ Erro ao carregar dados do dashboard:', error);
      }
    };

    loadDashboardData();
    
    // Recarregar dados a cada 30 segundos
    const interval = setInterval(loadDashboardData, 30000);
    
    return () => clearInterval(interval);
  }, [user?.storeId]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getTimeAgo = (date: any) => {
    const now = new Date();
    const orderDate = date instanceof Date ? date : new Date(date);
    const diffMs = now.getTime() - orderDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `há ${diffMins} min`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `há ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `há ${diffDays}d`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "Pendente", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400", icon: Clock },
      confirmed: { label: "Confirmado", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: CheckCircle },
      preparing: { label: "Preparando", color: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400", icon: Clock },
      ready: { label: "Pronto", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
      in_delivery: { label: "Em Entrega", color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400", icon: Package },
      delivered: { label: "Entregue", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
      completed: { label: "Concluído", color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle },
      cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400", icon: AlertCircle },
    };
    
    const config = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    const StatusIcon = config.icon;
    
    return (
      <Badge className={config.color}>
        <StatusIcon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const quickActions = [
    { title: "Adicionar Produto", icon: Plus, href: "/dashboard/products/new/type", color: "bg-primary" },
    { title: "Ver Relatórios", icon: BarChart3, href: "/dashboard/reports/performance", color: "bg-blue-600" },
    { title: "Gerenciar Cupons", icon: Star, href: "/dashboard/marketing/coupons", color: "bg-yellow-600" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Preparar dados de estatísticas
  const todayStats = dailySummary ? [
    {
      title: "Vendas Hoje",
      value: formatCurrency(dailySummary.revenue.value),
      change: formatPercentage(dailySummary.revenue.change),
      isPositive: dailySummary.revenue.isPositive,
      icon: DollarSign,
    },
    {
      title: "Pedidos Hoje",
      value: dailySummary.orders.value.toString(),
      change: formatPercentage(dailySummary.orders.change),
      isPositive: dailySummary.orders.isPositive,
      icon: ShoppingBag,
    },
    {
      title: "Ticket Médio",
      value: formatCurrency(dailySummary.averageTicket.value),
      change: formatPercentage(dailySummary.averageTicket.change),
      isPositive: dailySummary.averageTicket.isPositive,
      icon: TrendingUp,
    },
    {
      title: "Tempo Médio",
      value: store?.delivery?.deliveryTime || dailySummary.deliveryTime.value,
      change: formatPercentage(dailySummary.deliveryTime.change),
      isPositive: dailySummary.deliveryTime.isPositive,
      icon: Clock,
    },
  ] : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-foreground">
              Bem-vindo{store?.name ? `, ${store.name}!` : '!'} 👋
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Aqui está um resumo do desempenho da sua loja hoje
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Hoje</p>
            <p className="text-lg font-semibold">{new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
        </div>
      </div>

      {/* Status da Loja */}
      <Card className={`shadow-card border-l-4 ${store?.isActive ? 'border-l-green-500' : 'border-l-red-500'}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-3 h-3 rounded-full ${store?.isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
              <div>
                <h3 className="font-semibold text-lg">{store?.name || 'Sua Loja'}</h3>
                <p className="text-sm text-muted-foreground">
                  {store?.isActive ? 'Loja funcionando normalmente' : 'Loja temporariamente fechada'}
                </p>
                {store?.description && (
                  <p className="text-xs text-muted-foreground mt-1">{store.description}</p>
                )}
              </div>
            </div>
            <div className="text-right">
              <Badge className={store?.isActive ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"}>
                <CheckCircle className="h-3 w-3 mr-1" />
                {store?.isActive ? 'Online' : 'Offline'}
              </Badge>
              {store?.category && (
                <p className="text-xs text-muted-foreground mt-1">{store.category}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Métricas do Dia */}
      <div>
        <h2 className="text-2xl font-bold text-foreground mb-6">Métricas de Hoje</h2>
        {dailySummary ? (
          <div className="grid md:grid-cols-4 gap-6">
            {todayStats.map((stat) => (
              <Card key={stat.title} className="shadow-card hover:shadow-card-hover transition-smooth">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendingUp className={`h-3 w-3 ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`} />
                        <span className={`text-xs font-medium ${stat.isPositive ? 'text-green-600' : 'text-red-600'}`}>{stat.change}</span>
                        <span className="text-xs text-muted-foreground">vs. ontem</span>
                      </div>
                    </div>
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <stat.icon className="h-8 w-8 text-primary" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Pedidos Recentes */}
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">Pedidos Recentes</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <a href="/dashboard/orders-active">Ver Todos</a>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-smooth">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-foreground">#{order.id.slice(0, 8)}</p>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{order.customerName || 'Cliente'}</p>
                      <p className="text-sm text-foreground">
                        {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'itens'}
                      </p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-lg text-primary">{formatCurrency(order.total)}</p>
                      <p className="text-xs text-muted-foreground">{getTimeAgo(order.createdAt)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Nenhum pedido recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Ações Rápidas */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-xl">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {quickActions.map((action) => (
                <Button
                  key={action.title}
                  variant="outline"
                  className="w-full justify-start h-auto p-4"
                  asChild
                >
                  <a href={action.href}>
                    <div className={`p-2 rounded-lg ${action.color} mr-3`}>
                      <action.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-medium">{action.title}</span>
                  </a>
                </Button>
              ))}
            </div>

            <div className="mt-6 p-4 bg-muted/30 rounded-lg">
              <h4 className="font-semibold mb-2">💡 Dica do Dia</h4>
              <p className="text-sm text-muted-foreground">
                Configure cupons de desconto para atrair novos clientes e aumentar suas vendas.
              </p>
              <Button variant="link" size="sm" className="p-0 h-auto mt-2">
                Saiba mais →
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Semanal */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="text-xl">Resumo da Semana</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg">
              <DollarSign className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <p className="text-2xl font-bold text-green-600">R$ 12,450</p>
              <p className="text-sm text-muted-foreground">Faturamento</p>
              <p className="text-xs text-green-600 mt-1">+15% vs. semana anterior</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg">
              <ShoppingBag className="h-12 w-12 text-blue-600 mx-auto mb-3" />
              <p className="text-2xl font-bold text-blue-600">287</p>
              <p className="text-sm text-muted-foreground">Pedidos</p>
              <p className="text-xs text-blue-600 mt-1">+8% vs. semana anterior</p>
            </div>
            
            <div className="text-center p-6 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-lg">
              <Star className="h-12 w-12 text-yellow-600 mx-auto mb-3" />
              <p className="text-2xl font-bold text-yellow-600">4.8</p>
              <p className="text-sm text-muted-foreground">Avaliação</p>
              <p className="text-xs text-yellow-600 mt-1">Baseado em 45 avaliações</p>
            </div>
          </div>
        </CardContent>
      </Card>

    </div>
  );
} 