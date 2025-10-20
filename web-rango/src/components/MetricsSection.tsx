import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle } from "lucide-react";

export function MetricsSection() {
  return (
    <div className="space-y-4">
      {/* Acompanhamento */}
      <Card className="p-6">
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-foreground">
            Acompanhamento <span className="text-sm font-normal text-muted-foreground">últimos 7 dias</span>
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pedidos do dia</p>
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">pedidos</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pedidos do dia Total</p>
              <p className="text-2xl font-bold text-foreground">R$ 0,00</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Pedidos de amanhã Guardados</p>
              <p className="text-2xl font-bold text-foreground">R$ 0,00</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Ticket médio do pedido</p>
              <p className="text-2xl font-bold text-foreground">-</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Avaliação do App</p>
              <p className="text-2xl font-bold text-foreground">0</p>
            </div>
          </div>

          <Progress value={0} className="h-1 bg-muted [&>div]:bg-primary" />
        </div>
      </Card>

      {/* Performance */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-foreground">Performance</h2>
            <span className="inline-flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
              Bom desempenho no Rappy!
            </span>
          </div>

          <div className="border-b border-border pb-4">
            <p className="text-sm text-foreground font-medium mb-3">Desempenho</p>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Vendas</p>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground">R$ 0,00</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Ofertas fiscais</p>
                <p className="text-2xl font-bold text-foreground">0</p>
                <p className="text-xs text-muted-foreground">de 5</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Item mais vendido</p>
                <p className="text-lg font-medium text-foreground">-</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Vendas e Operação */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Vendas <span className="text-sm font-normal text-muted-foreground">últimas 7 dias</span>
            </h2>
            <AlertCircle className="h-4 w-4 text-primary" />
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Total de pedidos</p>
                <p className="text-3xl font-bold text-foreground">0</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Média dos produtos</p>
                <p className="text-lg font-medium text-foreground">-</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Taxa de aceite</p>
                <p className="text-lg font-medium text-foreground">-</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Valor total</p>
              <p className="text-lg font-medium text-foreground">-</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">Taxa de entradas</p>
              <p className="text-lg font-medium text-foreground">-</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-foreground">
              Operação <span className="text-sm font-normal text-muted-foreground">últimas 7 dias</span>
            </h2>
            <AlertCircle className="h-4 w-4 text-primary" />
          </div>

          <div className="space-y-4">
            <Tabs defaultValue="online" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-8">
                <TabsTrigger value="online" className="text-xs">Tempo online</TabsTrigger>
                <TabsTrigger value="cancel" className="text-xs">Cancelamentos</TabsTrigger>
                <TabsTrigger value="delay" className="text-xs">Atrasos</TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">As entregas estão saindo antes de 20%</p>
                  <p className="text-lg font-medium text-foreground">-</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">As entregas estão saindo depois de 4,0%</p>
                  <p className="text-lg font-medium text-foreground">-</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Atrasos</p>
                  <p className="text-lg font-medium text-foreground">-</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">As entregas chegaram antes de 10%</p>
                  <p className="text-lg font-medium text-foreground">-</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">As entregas chegaram depois de 3,0%</p>
                  <p className="text-lg font-medium text-foreground">-</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
