/**
 * ACTIVE DELIVERIES - PÁGINA DO LOJISTA
 * 
 * Acompanhamento de entregas ativas em tempo real
 * Mostra entregadores, localização e status
 */

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { 
  collection, 
  query, 
  where, 
  onSnapshot,
  orderBy,
  Timestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Package, 
  MapPin, 
  Clock, 
  Phone, 
  Navigation, 
  CheckCircle,
  Bike,
  Search,
  RefreshCw
} from "lucide-react";

interface ActiveDelivery {
  orderId: string;
  orderNumber: string;
  customerName: string;
  deliveryAddress: string;
  delivery: {
    partner_id: string;
    partner_name: string;
    partner_phone: string;
    partner_vehicle_type: string;
    status: string;
    partner_current_location?: {
      latitude: number;
      longitude: number;
    };
    assigned_at: Timestamp;
    picked_up_at?: Timestamp;
  };
  items: any[];
  total: number;
}

export default function ActiveDeliveries() {
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    if (!user?.storeId) {
      setLoading(false);
      return;
    }

    console.log("🔔 Escutando entregas ativas para loja:", user.storeId);

    // Query para pedidos com entrega ativa
    const q = query(
      collection(db, "orders"),
      where("storeId", "==", user.storeId),
      where("delivery.status", "in", ["assigned", "picked_up", "in_transit"]),
      orderBy("delivery.assigned_at", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const activeDeliveries: ActiveDelivery[] = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          activeDeliveries.push({
            orderId: doc.id,
            orderNumber: data.orderNumber || doc.id.slice(-6),
            customerName: data.customerName || "Cliente",
            deliveryAddress: data.deliveryAddress?.street || "Endereço não informado",
            delivery: data.delivery,
            items: data.items || [],
            total: data.total || 0,
          });
        });

        setDeliveries(activeDeliveries);
        setLoading(false);
        console.log("📦 Entregas ativas:", activeDeliveries.length);
      },
      (error) => {
        console.error("❌ Erro ao escutar entregas:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.storeId]);

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any }> = {
      assigned: { label: "Indo Buscar", variant: "secondary" },
      picked_up: { label: "Coletado", variant: "default" },
      in_transit: { label: "Em Trânsito", variant: "default" },
    };

    return statusMap[status] || { label: status, variant: "outline" };
  };

  const getVehicleIcon = (vehicleType: string) => {
    return <Bike className="h-4 w-4" />;
  };

  const formatTime = (timestamp: Timestamp | undefined) => {
    if (!timestamp) return "-";
    const date = timestamp.toDate();
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000 / 60); // minutos

    if (diff < 1) return "Agora";
    if (diff < 60) return `${diff} min atrás`;
    
    const hours = Math.floor(diff / 60);
    return `${hours}h ${diff % 60}min atrás`;
  };

  const handleOpenMaps = (latitude: number, longitude: number) => {
    // Usar OpenStreetMap ao invés de Google Maps (gratuito e sem API key)
    window.open(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}&zoom=15`, "_blank");
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const filteredDeliveries = deliveries.filter(
    (delivery) =>
      delivery.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      delivery.delivery.partner_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Entregas Ativas</h1>
          <p className="text-muted-foreground">
            Acompanhe suas entregas em tempo real
          </p>
        </div>
        <Badge variant="default" className="text-lg px-4 py-2">
          {deliveries.length} {deliveries.length === 1 ? "entrega" : "entregas"}
        </Badge>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por pedido, cliente ou entregador..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Deliveries List */}
      {filteredDeliveries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma entrega ativa</h3>
            <p className="text-muted-foreground text-center">
              {searchTerm
                ? "Nenhuma entrega encontrada com os critérios de busca"
                : "Quando houver pedidos sendo entregues, eles aparecerão aqui"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDeliveries.map((delivery) => {
            const statusInfo = getStatusBadge(delivery.delivery.status);

            return (
              <Card key={delivery.orderId} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        Pedido #{delivery.orderNumber}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {delivery.customerName}
                      </p>
                    </div>
                    <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Entregador */}
                  <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                    <div className="mt-0.5">
                      {getVehicleIcon(delivery.delivery.partner_vehicle_type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">
                        {delivery.delivery.partner_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {delivery.delivery.partner_phone}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCall(delivery.delivery.partner_phone)}
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Endereço */}
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {delivery.deliveryAddress}
                    </p>
                  </div>

                  {/* Tempo */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {delivery.delivery.picked_up_at
                        ? `Coletado ${formatTime(delivery.delivery.picked_up_at)}`
                        : `Atribuído ${formatTime(delivery.delivery.assigned_at)}`}
                    </span>
                  </div>

                  {/* Ações */}
                  <div className="flex gap-2 pt-2">
                    {delivery.delivery.partner_current_location && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() =>
                          handleOpenMaps(
                            delivery.delivery.partner_current_location!.latitude,
                            delivery.delivery.partner_current_location!.longitude
                          )
                        }
                      >
                        <Navigation className="h-4 w-4 mr-2" />
                        Ver no Mapa
                      </Button>
                    )}
                  </div>

                  {/* Itens */}
                  <div className="pt-2 border-t">
                    <p className="text-xs text-muted-foreground mb-1">
                      {delivery.items.length} {delivery.items.length === 1 ? "item" : "itens"}
                    </p>
                    <p className="text-sm font-medium">
                      R$ {delivery.total.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      {deliveries.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Bike className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {deliveries.filter((d) => d.delivery.status === "assigned").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Indo Buscar</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Package className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {deliveries.filter((d) => d.delivery.status === "picked_up").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Coletados</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Navigation className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {deliveries.filter((d) => d.delivery.status === "in_transit").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Em Trânsito</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

