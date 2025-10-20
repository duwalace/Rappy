import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { 
  LayoutDashboard,
  Store,
  Users,
  DollarSign,
  Settings,
  Headphones,
  ChevronLeft,
  Crown,
  Tag,
  Bike,
  Image
} from "lucide-react";
import { Button } from "./ui/button";
import { useSidebar } from "./ui/sidebar";

const adminMenuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/admin",
  },
  {
    title: "Gestão de Lojas",
    icon: Store,
    href: "/admin/stores",
  },
  {
    title: "Gestão de Usuários",
    icon: Users,
    href: "/admin/users",
  },
  {
    title: "Gestão de Entregadores",
    icon: Bike,
    href: "/admin/delivery",
  },
  {
    title: "Banners Promocionais",
    icon: Image,
    href: "/admin/banners",
  },
  {
    title: "Financeiro Global",
    icon: DollarSign,
    href: "/admin/financial",
  },
  {
    title: "Tipos de Loja",
    icon: Tag,
    href: "/admin/store-types",
  },
  {
    title: "Configurações",
    icon: Settings,
    href: "/admin/settings",
  },
  {
    title: "Operações e Suporte",
    icon: Headphones,
    href: "/admin/support",
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const { open, setOpen } = useSidebar();

  return (
    <div
      className={cn(
        "relative h-screen border-r bg-background transition-all duration-300",
        open ? "w-64" : "w-16"
      )}
    >
      {/* Header */}
      <div className="flex h-16 items-center justify-between border-b px-4">
        {open && (
          <div className="flex items-center gap-2">
            <Crown className="h-6 w-6 text-primary" />
            <span className="font-bold text-lg">Admin Rappy</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(!open)}
          className={cn("ml-auto", !open && "mx-auto")}
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              !open && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <div className="space-y-1 p-2">
        {adminMenuItems.map((item) => {
          const isActive = location.pathname === item.href;
          const Icon = item.icon;

          return (
            <Link key={item.href} to={item.href}>
              <Button
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start",
                  !open && "justify-center px-2"
                )}
              >
                <Icon className={cn("h-5 w-5", open && "mr-2")} />
                {open && <span>{item.title}</span>}
              </Button>
            </Link>
          );
        })}
      </div>

      {/* Footer Badge */}
      {open && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="rounded-lg bg-primary/10 p-3 text-center">
            <Crown className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-xs font-medium">Super Admin</p>
          </div>
        </div>
      )}
    </div>
  );
}

