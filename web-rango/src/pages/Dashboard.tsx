import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Overview from "./dashboard/Overview";
import Delivery from "./dashboard/Delivery";
import Orders from "./dashboard/Orders";
import OrdersActive from "./dashboard/OrdersActive";
import OrdersHistory from "./dashboard/OrdersHistory";
import Menu from "./dashboard/Menu";
import Catalog from "./dashboard/Catalog";
import Logistics from "./dashboard/Logistics";
import DeliveryTime from "./dashboard/DeliveryTime";
import DeliveryArea from "./dashboard/DeliveryArea";
import PaymentTime from "./dashboard/PaymentTime";
import Promotions from "./dashboard/Promotions";
import Services from "./dashboard/Services";
import Profile from "./dashboard/Profile";
import Financial from "./dashboard/reports/Financial";
import ItemsReport from "./dashboard/reports/Items";
import CustomersReport from "./dashboard/reports/Customers";
import Coupons from "./dashboard/marketing/Coupons";
import NotificationsPush from "./dashboard/marketing/Notifications";
import StoreSettings from "./dashboard/settings/Store";
import ProductsList from "./ProductsList";
import ProductTypeSelection from "./ProductTypeSelection";
import ProductCategoryConfig from "./ProductCategoryConfig";
import ProductComplementsConfig from "./ProductComplementsConfig";
import ProductComplementsConfigDetailed from "./ProductComplementsConfigDetailed";
import CreateProduct from "./products/CreateProduct";
import EditProduct from "./products/EditProduct";
import MenuCategories from "./dashboard/MenuCategories";
import MenuComplements from "./dashboard/MenuComplements";
import MenuInventory from "./dashboard/MenuInventory";
import DeliveryAreaSettings from "./dashboard/settings/DeliveryArea";
import BankingSettings from "./dashboard/settings/Banking";
import UsersSettings from "./dashboard/settings/Users";
import ActiveDeliveries from "./ActiveDeliveries";

const Dashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        
        <main className="flex-1 flex flex-col">
          <DashboardHeader />
          
          <div className="flex-1 p-6">
            <Routes>
              {/* VISÃO GERAL */}
              <Route index element={<Overview />} />
              <Route path="orders-active" element={<OrdersActive />} />
              <Route path="orders-history" element={<OrdersHistory />} />
              
              {/* RELATÓRIOS */}
              <Route path="reports/financial" element={<Financial />} />
              <Route path="reports/items" element={<ItemsReport />} />
              <Route path="reports/customers" element={<CustomersReport />} />
              
              {/* CARDÁPIO */}
              <Route path="products" element={<ProductsList />} />
              <Route path="products/create" element={<CreateProduct />} />
              <Route path="products/edit/:id" element={<EditProduct />} />
              <Route path="products/new/type" element={<ProductTypeSelection />} />
              <Route path="products/new/category" element={<ProductCategoryConfig />} />
              <Route path="products/new/complements" element={<ProductComplementsConfig />} />
              <Route path="products/new/preparado" element={<ProductComplementsConfigDetailed />} />
              <Route path="menu/categories" element={<MenuCategories />} />
              <Route path="menu/complements" element={<MenuComplements />} />
              <Route path="menu/inventory" element={<MenuInventory />} />
              
              {/* MARKETING */}
              <Route path="promotions" element={<Promotions />} />
              <Route path="marketing/coupons" element={<Coupons />} />
              <Route path="marketing/notifications" element={<NotificationsPush />} />
              
              {/* CONFIGURAÇÕES */}
              <Route path="settings/store" element={<StoreSettings />} />
              <Route path="settings/delivery-area" element={<DeliveryAreaSettings />} />
              <Route path="settings/banking" element={<BankingSettings />} />
              <Route path="settings/users" element={<UsersSettings />} />
              
              {/* ENTREGAS */}
              <Route path="active-deliveries" element={<ActiveDeliveries />} />
              
              {/* ROTAS LEGACY */}
              <Route path="delivery" element={<Delivery />} />
              <Route path="orders" element={<Orders />} />
              <Route path="menu" element={<Menu />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="logistics" element={<Logistics />} />
              <Route path="delivery-time" element={<DeliveryTime />} />
              <Route path="delivery-area" element={<DeliveryArea />} />
              <Route path="payment-time" element={<PaymentTime />} />
              <Route path="services" element={<Services />} />
              <Route path="profile" element={<Profile />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
