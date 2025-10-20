import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getStoreMenuItems, setItemAvailability, updateItemStock } from '@/services/menuService';
import { getStoreCategories } from '@/services/menuService';
import { MenuItem } from '@/types/menu-advanced';
import { MenuCategory } from '@/types/shared';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Eye, 
  EyeOff, 
  Filter, 
  AlertTriangle, 
  TrendingDown, 
  Package,
  RefreshCw,
  Save
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';

// ========================================
// AVAILABILITY TAB ITEM
// ========================================

interface AvailabilityItemProps {
  item: MenuItem;
  onToggle: (itemId: string, newStatus: boolean) => void;
  optimisticStatus?: boolean;
}

function AvailabilityItem({ item, onToggle, optimisticStatus }: AvailabilityItemProps) {
  const isAvailable = optimisticStatus !== undefined ? optimisticStatus : item.isAvailable;
  const hasStock = item.stockControl?.enabled
    ? item.stockControl.currentStock > 0
    : true;

  return (
    <div
      className={`
        group flex items-center justify-between p-4 
        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
        rounded-lg hover:shadow-sm transition-all
        ${!isAvailable ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Product Image */}
        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {item.images && item.images[0] ? (
            <img
              src={item.images[0].thumbnailUrl || item.images[0].url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-2xl">🍽️</div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-muted-foreground">
              {item.basePrice.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
            {item.stockControl?.enabled && (
              <Badge
                variant={hasStock ? 'secondary' : 'destructive'}
                className="text-xs"
              >
                {item.stockControl.currentStock > 0
                  ? `Estoque: ${item.stockControl.currentStock}`
                  : 'Sem estoque'}
              </Badge>
            )}
            {item.isPopular && (
              <Badge variant="default" className="text-xs">
                Popular
              </Badge>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="hidden sm:flex items-center gap-2">
          {isAvailable ? (
            <div className="flex items-center gap-1.5 text-green-600">
              <Eye className="h-4 w-4" />
              <span className="text-sm font-medium">Disponível</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-gray-400">
              <EyeOff className="h-4 w-4" />
              <span className="text-sm font-medium">Indisponível</span>
            </div>
          )}
        </div>
      </div>

      {/* Toggle Switch */}
      <div className="ml-4">
        <Switch
          checked={isAvailable}
          onCheckedChange={(checked) => onToggle(item.id, checked)}
          disabled={item.stockControl?.enabled && !hasStock}
        />
      </div>
    </div>
  );
}

// ========================================
// STOCK TAB ITEM
// ========================================

interface StockItemProps {
  item: MenuItem;
  onUpdate: (itemId: string, stock: number, autoDisable: boolean) => void;
  pendingChanges: Map<string, number>;
}

function StockItem({ item, onUpdate, pendingChanges }: StockItemProps) {
  const [stock, setStock] = useState(item.stockControl?.currentStock || 0);
  const [autoDisable, setAutoDisable] = useState(
    item.stockControl?.autoDisable || false
  );

  const debouncedStock = useDebounce(stock, 1500);

  useEffect(() => {
    if (debouncedStock !== item.stockControl?.currentStock) {
      onUpdate(item.id, debouncedStock, autoDisable);
    }
  }, [debouncedStock]);

  const isPending = pendingChanges.has(item.id);
  const hasChanged = stock !== item.stockControl?.currentStock;
  const stockLevel = stock === 0 ? 'empty' : stock <= (item.stockControl?.minStock || 10) ? 'low' : 'ok';

  return (
    <div
      className={`
        group flex items-center gap-4 p-4 
        bg-white dark:bg-gray-800 border-2
        ${stockLevel === 'empty' ? 'border-red-200 dark:border-red-900' : 
          stockLevel === 'low' ? 'border-orange-200 dark:border-orange-900' : 
          'border-gray-200 dark:border-gray-700'}
        rounded-lg transition-all
        ${!item.isAvailable ? 'opacity-60' : ''}
      `}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Product Image */}
        <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
          {item.images && item.images[0] ? (
            <img
              src={item.images[0].thumbnailUrl || item.images[0].url}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <Package className="h-6 w-6 text-gray-400" />
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          <div className="font-medium truncate">{item.name}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-sm text-muted-foreground">
              {item.basePrice.toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              })}
            </span>
            {stockLevel === 'low' && (
              <Badge variant="outline" className="text-orange-600 border-orange-600">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Estoque Baixo
              </Badge>
            )}
            {stockLevel === 'empty' && (
              <Badge variant="destructive">
                <TrendingDown className="h-3 w-3 mr-1" />
                Sem Estoque
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Stock Input */}
      <div className="flex items-center gap-3">
        <div className="relative w-28">
          <Input
            type="number"
            value={stock}
            onChange={(e) => setStock(parseInt(e.target.value) || 0)}
            min="0"
            className={`h-10 text-center font-semibold ${
              hasChanged ? 'border-blue-500 ring-1 ring-blue-500' : ''
            }`}
          />
          <div className="absolute right-3 top-2.5 text-xs text-muted-foreground">
            {item.stockControl?.unit || 'und'}
          </div>
          {isPending && (
            <div className="absolute -right-7 top-3">
              <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
            </div>
          )}
        </div>

        {/* Auto-disable Switch */}
        <div className="hidden sm:flex items-center gap-2">
          <Switch
            checked={autoDisable}
            onCheckedChange={setAutoDisable}
            id={`auto-${item.id}`}
            className="scale-75"
          />
          <label
            htmlFor={`auto-${item.id}`}
            className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap"
          >
            Auto-desativar
          </label>
        </div>
      </div>
    </div>
  );
}

// ========================================
// MAIN COMPONENT
// ========================================

export default function MenuInventory() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyUnavailable, setShowOnlyUnavailable] = useState(false);
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  const [optimisticUpdates, setOptimisticUpdates] = useState<Map<string, boolean>>(new Map());
  const [pendingChanges, setPendingChanges] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    loadData();
  }, [user?.storeId]);

  const loadData = async () => {
    if (!user?.storeId) return;

    try {
      setLoading(true);
      const [itemsData, categoriesData] = await Promise.all([
        getStoreMenuItems(user.storeId),
        getStoreCategories(user.storeId),
      ]);
      setItems(itemsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os itens',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAvailability = async (itemId: string, newStatus: boolean) => {
    setOptimisticUpdates((prev) => new Map(prev).set(itemId, newStatus));

    try {
      await setItemAvailability(itemId, newStatus);

      toast({
        title: `✅ Item ${newStatus ? 'disponibilizado' : 'indisponibilizado'}!`,
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId ? { ...item, isAvailable: newStatus } : item
        )
      );

      setOptimisticUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
    } catch (error) {
      console.error('Erro ao atualizar disponibilidade:', error);

      setOptimisticUpdates((prev) => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });

      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar a disponibilidade',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateStock = useCallback(async (
    itemId: string,
    newStock: number,
    autoDisable: boolean
  ) => {
    setPendingChanges((prev) => new Map(prev).set(itemId, newStock));

    try {
      await updateItemStock(itemId, {
        currentStock: newStock,
        autoDisable,
      });

      setItems((prev) =>
        prev.map((item) =>
          item.id === itemId
            ? {
                ...item,
                stockControl: {
                  ...item.stockControl,
                  currentStock: newStock,
                  autoDisable,
                  lastRestocked: new Date(),
                },
                isAvailable: autoDisable && newStock === 0 ? false : item.isAvailable,
              }
            : item
        )
      );

      setPendingChanges((prev) => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });

      toast({
        title: '✅ Estoque atualizado!',
        description: newStock === 0 && autoDisable
          ? 'Produto foi automaticamente desativado'
          : undefined,
      });
    } catch (error) {
      console.error('Erro ao atualizar estoque:', error);
      setPendingChanges((prev) => {
        const newMap = new Map(prev);
        newMap.delete(itemId);
        return newMap;
      });
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o estoque',
        variant: 'destructive',
      });
    }
  }, [toast]);

  // Stats
  const stats = useMemo(() => {
    const totalItems = items.length;
    const availableItems = items.filter((item) => item.isAvailable).length;
    const unavailableItems = totalItems - availableItems;
    const totalWithStock = items.filter((i) => i.stockControl?.enabled).length;
    const lowStockItems = items.filter(
      (i) =>
        i.stockControl?.enabled &&
        i.stockControl.currentStock <= (i.stockControl.minStock || 10) &&
        i.stockControl.currentStock > 0
    ).length;
    const outOfStockItems = items.filter(
      (i) => i.stockControl?.enabled && i.stockControl.currentStock === 0
    ).length;

    return {
      totalItems,
      availableItems,
      unavailableItems,
      totalWithStock,
      lowStockItems,
      outOfStockItems,
    };
  }, [items]);

  // Filtered items
  const filteredAvailabilityItems = useMemo(() => {
    let filtered = items;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.categoryId === selectedCategory);
    }

    if (showOnlyUnavailable) {
      filtered = filtered.filter((item) => !item.isAvailable);
    }

    const grouped = new Map<string, MenuItem[]>();
    filtered.forEach((item) => {
      const category = item.categoryId;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(item);
    });

    return { filtered, grouped };
  }, [items, searchQuery, selectedCategory, showOnlyUnavailable]);

  const filteredStockItems = useMemo(() => {
    let filtered = items.filter((item) => item.stockControl?.enabled);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((item) =>
        item.name.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      );
    }

    if (selectedCategory !== 'all') {
      filtered = filtered.filter((item) => item.categoryId === selectedCategory);
    }

    if (showLowStockOnly) {
      filtered = filtered.filter(
        (item) =>
          item.stockControl &&
          item.stockControl.currentStock <= (item.stockControl.minStock || 10)
      );
    }

    const grouped = new Map<string, MenuItem[]>();
    filtered.forEach((item) => {
      const category = item.categoryId;
      if (!grouped.has(category)) {
        grouped.set(category, []);
      }
      grouped.get(category)!.push(item);
    });

    return { filtered, grouped };
  }, [items, searchQuery, selectedCategory, showLowStockOnly]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando itens...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Disponibilidade e Estoque</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie a disponibilidade e o estoque dos seus produtos
        </p>
      </div>

      <Tabs defaultValue="availability" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="availability">
            <Eye className="h-4 w-4 mr-2" />
            Disponibilidade
          </TabsTrigger>
          <TabsTrigger value="stock">
            <Package className="h-4 w-4 mr-2" />
            Controle de Estoque
          </TabsTrigger>
        </TabsList>

        {/* AVAILABILITY TAB */}
        <TabsContent value="availability" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total de Itens</div>
              <div className="text-2xl font-bold mt-1">{stats.totalItems}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Disponíveis</div>
              <div className="text-2xl font-bold text-green-600 mt-1">
                {stats.availableItems}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Indisponíveis</div>
              <div className="text-2xl font-bold text-orange-600 mt-1">
                {stats.unavailableItems}
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 px-3 border rounded-lg bg-white dark:bg-gray-800">
                <Switch
                  checked={showOnlyUnavailable}
                  onCheckedChange={setShowOnlyUnavailable}
                  id="show-unavailable"
                />
                <label
                  htmlFor="show-unavailable"
                  className="text-sm cursor-pointer whitespace-nowrap"
                >
                  Apenas indisponíveis
                </label>
              </div>
            </div>
          </Card>

          {/* Items List */}
          {filteredAvailabilityItems.filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <Filter className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum item encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou criar novos produtos
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {Array.from(filteredAvailabilityItems.grouped.entries()).map(([categoryId, categoryItems]) => {
                const category = categories.find((c) => c.id === categoryId);
                return (
                  <div key={categoryId}>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      {category?.name || 'Sem Categoria'}
                      <Badge variant="secondary">{categoryItems.length}</Badge>
                    </h2>
                    <div className="space-y-2">
                      {categoryItems.map((item) => (
                        <AvailabilityItem
                          key={item.id}
                          item={item}
                          onToggle={handleToggleAvailability}
                          optimisticStatus={optimisticUpdates.get(item.id)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* STOCK TAB */}
        <TabsContent value="stock" className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Total com Controle</div>
              <div className="text-2xl font-bold mt-1">{stats.totalWithStock}</div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Estoque Baixo</div>
              <div className="text-2xl font-bold text-orange-600 mt-1">
                <AlertTriangle className="inline h-5 w-5 mr-1" />
                {stats.lowStockItems}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-sm text-muted-foreground">Sem Estoque</div>
              <div className="text-2xl font-bold text-red-600 mt-1">
                <TrendingDown className="inline h-5 w-5 mr-1" />
                {stats.outOfStockItems}
              </div>
            </Card>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar produto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 px-3 border rounded-lg bg-white dark:bg-gray-800">
                <Switch
                  checked={showLowStockOnly}
                  onCheckedChange={setShowLowStockOnly}
                  id="show-low-stock"
                />
                <label
                  htmlFor="show-low-stock"
                  className="text-sm cursor-pointer whitespace-nowrap"
                >
                  Apenas estoque baixo
                </label>
              </div>
            </div>
          </Card>

          {/* Info Card */}
          <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <Save className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  Salvamento Automático
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-0.5">
                  As alterações são salvas automaticamente 1,5 segundos após parar de digitar. 
                  Ative "Auto-desativar" para indisponibilizar produtos quando o estoque chegar a zero.
                </p>
              </div>
            </div>
          </Card>

          {/* Items List */}
          {filteredStockItems.filtered.length === 0 ? (
            <Card className="p-12 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {stats.totalWithStock === 0
                  ? 'Nenhum produto com controle de estoque'
                  : 'Nenhum item encontrado'}
              </h3>
              <p className="text-muted-foreground">
                {stats.totalWithStock === 0
                  ? 'Ative o controle de estoque ao criar ou editar produtos'
                  : 'Tente ajustar os filtros de busca'}
              </p>
            </Card>
          ) : (
            <div className="space-y-6">
              {Array.from(filteredStockItems.grouped.entries()).map(([categoryId, categoryItems]) => {
                const category = categories.find((c) => c.id === categoryId);
                return (
                  <div key={categoryId}>
                    <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      {category?.name || 'Sem Categoria'}
                      <Badge variant="secondary">{categoryItems.length}</Badge>
                    </h2>
                    <div className="space-y-2">
                      {categoryItems.map((item) => (
                        <StockItem
                          key={item.id}
                          item={item}
                          onUpdate={handleUpdateStock}
                          pendingChanges={pendingChanges}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

