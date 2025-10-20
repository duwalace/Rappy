import { SidebarProvider } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/AdminSidebar";
import { DashboardHeader } from "@/components/DashboardHeader";
import { LoadingScreen } from "@/components/LoadingScreen";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AdminOverview from "./admin/AdminOverview";
import StoresManagement from "./admin/StoresManagement";
import UsersManagement from "./admin/UsersManagement";
import FinancialManagement from "./admin/FinancialManagement";
import PlatformSettings from "./admin/PlatformSettings";
import OperationsSupport from "./admin/OperationsSupport";
import StoreTypesManagement from "./admin/StoreTypesManagement";
import DeliveryManagement from "./admin/DeliveryManagement";
import DeliveryPartnersManagement from "./admin/DeliveryPartnersManagement";
import BannersManagement from "./admin/BannersManagement";

const AdminDashboard = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user || user.role !== 'dono_do_site') {
    return <Navigate to="/login" replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        
        <main className="flex-1 flex flex-col">
          <DashboardHeader />
          
          <div className="flex-1 p-6">
            <Routes>
              <Route index element={<AdminOverview />} />
              <Route path="stores" element={<StoresManagement />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="delivery" element={<DeliveryManagement />} />
              <Route path="delivery-partners" element={<DeliveryPartnersManagement />} />
              <Route path="financial" element={<FinancialManagement />} />
              <Route path="store-types" element={<StoreTypesManagement />} />
              <Route path="banners" element={<BannersManagement />} />
              <Route path="settings" element={<PlatformSettings />} />
              <Route path="support" element={<OperationsSupport />} />
            </Routes>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default AdminDashboard;

