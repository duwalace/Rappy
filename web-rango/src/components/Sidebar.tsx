import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  UtensilsCrossed,
  Users,
  DollarSign,
  BarChart3,
  Settings,
  Store,
  Megaphone,
  Receipt,
  Tag,
} from "lucide-react";

const menuItems = [
  { icon: Home, label: "Início", path: "/dashboard" },
  { icon: BarChart3, label: "Desempenho", path: "/dashboard" },
  { icon: UtensilsCrossed, label: "Pedidos", path: "/dashboard/orders" },
];

const storeSection = [
  { icon: Store, label: "Loja aberta", path: "/dashboard", badge: "Fechado" },
];

const marketingSection = [
  { icon: Users, label: "Seus clientes", path: "/dashboard" },
  { icon: Megaphone, label: "Promoções", path: "/dashboard/promotions" },
  { icon: Tag, label: "Anúncios", path: "/dashboard" },
  { icon: Receipt, label: "Feed", path: "/dashboard" },
];

const configSection = [
  { icon: UtensilsCrossed, label: "Cardápios", path: "/dashboard/products", active: true },
  { icon: DollarSign, label: "Financeiro", path: "/dashboard" },
  { icon: BarChart3, label: "Avaliações", path: "/dashboard/reviews" },
  { icon: Settings, label: "Super", path: "/dashboard" },
];

export const ProductSidebar = () => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <aside className="w-64 bg-card border-r border-border h-screen overflow-y-auto flex-shrink-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg text-foreground">Rappy</span>
        </div>
      </div>

      {/* Restaurant info */}
      <div className="p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Terraço Gourmet</h3>
        <button className="text-sm text-primary hover:underline mt-1">
          Editar loja
        </button>
      </div>

      {/* Menu sections */}
      <nav className="py-4">
        {/* Main menu */}
        <div className="px-3 mb-4">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-smooth",
                isActive(item.path)
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Store section */}
        <div className="px-3 mb-4 pt-4 border-t border-border">
          {storeSection.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center justify-between px-3 py-2 rounded-lg mb-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-smooth"
            >
              <div className="flex items-center gap-3">
                <item.icon className="h-4 w-4" />
                <span className="text-sm">{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-xs bg-muted px-2 py-0.5 rounded">
                  {item.badge}
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Marketing section */}
        <div className="px-3 mb-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Marketing
          </h4>
          {marketingSection.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className="flex items-center gap-3 px-3 py-2 rounded-lg mb-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-smooth"
            >
              <item.icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </div>

        {/* Configuration section */}
        <div className="px-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
            Configuração da loja
          </h4>
          {configSection.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition-smooth",
                isActive(item.path) || item.active
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-sm">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </aside>
  );
};
