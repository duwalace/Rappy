import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, GripVertical } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface ComplementItem {
  id: string;
  name: string;
  image?: string;
  channel: string;
  price: number;
  code: string;
}

interface ComplementGroupCardDetailedProps {
  groupName: string;
  isEditing?: boolean;
  onDelete?: () => void;
}

export const ComplementGroupCardDetailed = ({
  groupName,
  isEditing = false,
  onDelete,
}: ComplementGroupCardDetailedProps) => {
  const [isOpen, setIsOpen] = useState(true);
  const [items] = useState<ComplementItem[]>([
    {
      id: "1",
      name: "Molho branco",
      image: "/placeholder.svg",
      channel: "Rappy",
      price: 2.0,
      code: "XIGANTO",
    },
    {
      id: "2",
      name: "Coca-Cola lt",
      image: "/placeholder.svg",
      channel: "Rappy",
      price: 2.0,
      code: "XIGANTO",
    },
    {
      id: "3",
      name: "Molho pomodoro",
      channel: "Rappy",
      price: 2.0,
      code: "XIGANTO",
    },
  ]);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="shadow-card overflow-hidden">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center gap-3 p-4 hover:bg-muted/50 transition-smooth">
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
            <span className="font-semibold text-foreground flex-1 text-left">
              {groupName}
            </span>
            {isEditing && (
              <button className="p-2 hover:bg-muted rounded-lg transition-smooth">
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
            {/* Configuration question */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground block mb-2">
                  Este grupo é obrigatório ou opcional?
                </label>
                <Select defaultValue="obrigatorio">
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="obrigatorio">Obrigatório</SelectItem>
                    <SelectItem value="opcional">Opcional</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Quantidade mínima
                  </label>
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded border border-border hover:bg-muted transition-smooth flex items-center justify-center">
                      −
                    </button>
                    <Input
                      type="number"
                      defaultValue="0"
                      className="text-center"
                    />
                    <button className="w-8 h-8 rounded border border-border hover:bg-muted transition-smooth flex items-center justify-center">
                      +
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">
                    Quantidade máxima
                  </label>
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded border border-border hover:bg-muted transition-smooth flex items-center justify-center">
                      −
                    </button>
                    <Input
                      type="number"
                      defaultValue="2"
                      className="text-center"
                    />
                    <button className="w-8 h-8 rounded border border-border hover:bg-muted transition-smooth flex items-center justify-center">
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Items table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground w-12"></th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                      Imagem
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                      Produto
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                      Canal de venda
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                      Preço
                    </th>
                    <th className="text-left p-3 text-xs font-medium text-muted-foreground">
                      Código PDV
                    </th>
                    <th className="text-center p-3 text-xs font-medium text-muted-foreground">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-smooth"
                    >
                      <td className="p-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                      </td>
                      <td className="p-3">
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              📷
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-foreground">
                          {item.name}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary text-primary-foreground rounded text-xs font-medium">
                          <span className="w-1.5 h-1.5 bg-primary-foreground rounded-full"></span>
                          Aplicativo {item.channel}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-foreground">
                          R$ {item.price.toFixed(2)}
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-sm text-muted-foreground">
                          {item.code}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button className="p-2 hover:bg-destructive/10 rounded-lg transition-smooth">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};
