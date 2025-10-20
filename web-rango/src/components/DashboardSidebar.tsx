import { 
  BarChart3,
  ShoppingBag,
  History,
  DollarSign,
  Package,
  Users,
  UtensilsCrossed,
  Grid3X3,
  Plus,
  Archive,
  Tag,
  Ticket,
  Bell,
  Settings,
  MapPin,
  CreditCard,
  UserPlus,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { subscribeToActiveStoreOrders } from "@/services/orderService";
import { Badge } from "@/components/ui/badge";

interface MenuSection {
  title: string;
  items: {
    title: string;
    icon: any;
    url: string;
    badge?: string | null;
    isNew?: boolean;
  }[];
}

const getMenuSections = (pendingOrdersCount: number): MenuSection[] => [
  {
    title: "VISÃO GERAL",
    items: [
      { title: "Dashboard", icon: BarChart3, url: "/dashboard", badge: null },
      { 
        title: "Pedidos em Andamento", 
        icon: ShoppingBag, 
        url: "/dashboard/orders-active", 
        badge: pendingOrdersCount > 0 ? String(pendingOrdersCount) : null 
      },
      { title: "Histórico de Pedidos", icon: History, url: "/dashboard/orders-history", badge: null },
    ]
  },
  {
    title: "RELATÓRIOS",
    items: [
      { title: "Relatório Financeiro", icon: DollarSign, url: "/dashboard/reports/financial", badge: null },
      { title: "Análise de Itens", icon: Package, url: "/dashboard/reports/items", badge: null },
      { title: "Análise de Clientes", icon: Users, url: "/dashboard/reports/customers", badge: null },
    ]
  },
  {
    title: "CARDÁPIO",
    items: [
      { title: "Gerenciamento de Itens", icon: UtensilsCrossed, url: "/dashboard/products", badge: null },
      { title: "Categorias do Cardápio", icon: Grid3X3, url: "/dashboard/menu/categories", badge: null },
      { title: "Complementos e Variações", icon: Plus, url: "/dashboard/menu/complements", badge: null },
      { title: "Disponibilidade e Estoque", icon: Archive, url: "/dashboard/menu/inventory", badge: null },
    ]
  },
  {
    title: "MARKETING",
    items: [
      { title: "Promoções", icon: Tag, url: "/dashboard/promotions", badge: null },
      { title: "Cupons de Desconto", icon: Ticket, url: "/dashboard/marketing/coupons", badge: null },
      { title: "Notificações", icon: Bell, url: "/dashboard/marketing/notifications", badge: null },
    ]
  },
  {
    title: "CONFIGURAÇÕES",
    items: [
      { title: "Configurações da Loja", icon: Settings, url: "/dashboard/settings/store", badge: null },
      { title: "Área de Entrega", icon: MapPin, url: "/dashboard/settings/delivery-area", badge: null },
      { title: "Dados Bancários", icon: CreditCard, url: "/dashboard/settings/banking", badge: null },
      { title: "Gestão de Usuários", icon: UserPlus, url: "/dashboard/settings/users", badge: null },
    ]
  }
];

export function DashboardSidebar() {
  const { open } = useSidebar();
  const { user } = useAuth();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(["VISÃO GERAL", "CARDÁPIO"]) // Seções abertas por padrão
  );
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  // Subscrever a pedidos ativos para contar pendentes
  useEffect(() => {
    if (!user?.storeId) return;

    const unsubscribe = subscribeToActiveStoreOrders(user.storeId, (orders) => {
      const pending = orders.filter(o => o.status === 'pending').length;
      setPendingOrdersCount(pending);
    });

    return () => {
      unsubscribe();
    };
  }, [user?.storeId]);

  const menuSections = getMenuSections(pendingOrdersCount);

  const toggleSection = (sectionTitle: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionTitle)) {
      newExpanded.delete(sectionTitle);
    } else {
      newExpanded.add(sectionTitle);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent>
        {/* Logo */}
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <UtensilsCrossed className="h-4 w-4 text-primary-foreground" />
            </div>
            {open && (
              <div>
                <span className="text-lg font-bold text-foreground">Rappy Admin</span>
                <p className="text-xs text-muted-foreground">Painel Profissional</p>
              </div>
            )}
          </div>
        </div>

        {/* Menu Sections */}
        <div className="py-2">
          {menuSections.map((section) => {
            const isExpanded = expandedSections.has(section.title);
            
            return (
              <SidebarGroup key={section.title}>
                {open && (
                  <SidebarGroupLabel 
                    className="px-4 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-foreground transition-colors flex items-center justify-between"
                    onClick={() => toggleSection(section.title)}
                  >
                    <span>{section.title}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                  </SidebarGroupLabel>
                )}
                
                {(isExpanded || !open) && (
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {section.items.map((item) => (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton asChild>
                            <NavLink
                              to={item.url}
                              end={item.url === "/dashboard"}
                              className={({ isActive }) =>
                                cn(
                                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-smooth text-sm",
                                  isActive
                                    ? "bg-primary/10 text-primary font-medium"
                                    : "hover:bg-sidebar-accent text-sidebar-foreground"
                                )
                              }
                            >
                              <item.icon className="h-4 w-4 flex-shrink-0" />
                              {open && (
                                <>
                                  <span className="flex-1">{item.title}</span>
                                  {item.badge && (
                                    <Badge 
                                      variant={item.url.includes('orders-active') && Number(item.badge) > 0 ? "destructive" : item.isNew ? "default" : "secondary"}
                                      className={cn(
                                        "text-xs",
                                        item.url.includes('orders-active') && Number(item.badge) > 0 && "animate-pulse"
                                      )}
                                    >
                                      {item.badge}
                                    </Badge>
                                  )}
                                </>
                              )}
                            </NavLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroupContent>
                )}
              </SidebarGroup>
            );
          })}
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
