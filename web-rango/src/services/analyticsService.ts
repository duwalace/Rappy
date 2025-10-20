import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  Timestamp,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getPlatformConfig } from './adminService';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface StorePerformance {
  revenue: number;
  totalOrders: number;
  averageTicket: number;
  newCustomers: number;
  dailyRevenue: { date: string; revenue: number; orders: number }[];
  ordersByStatus: { status: string; count: number; percentage: number }[];
}

export interface FinancialReport {
  orders: FinancialOrder[];
  summary: {
    grossRevenue: number;
    platformFee: number;
    deliveryFee: number;
    netRevenue: number;
  };
  totalCount: number;
}

export interface FinancialOrder {
  id: string;
  date: Date;
  customerName: string;
  itemsTotal: number;
  deliveryFee: number;
  platformFee: number;
  netAmount: number;
  status: string;
}

export interface ProductAnalytics {
  products: ProductStats[];
  topProducts: ProductStats[];
}

export interface ProductStats {
  productId: string;
  productName: string;
  category: string;
  quantitySold: number;
  revenue: number;
  ordersCount: number;
}

export interface CustomerAnalytics {
  customers: CustomerStats[];
  summary: {
    totalCustomers: number;
    newCustomers: number;
    recurringCustomers: number;
  };
}

export interface CustomerStats {
  customerId: string;
  customerName: string;
  customerEmail: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate: Date;
  firstOrderDate: Date;
}

/**
 * Busca performance geral da loja
 */
export async function getStorePerformance(
  storeId: string,
  dateRange: DateRange
): Promise<StorePerformance> {
  try {
    console.log('📊 Buscando performance da loja...', { storeId, dateRange });

    const ordersRef = collection(db, 'orders');
    
    // SOLUÇÃO TEMPORÁRIA: Removendo o segundo where para evitar erro de índice
    // Depois que o índice for deployado, você pode descomentar a linha com <=
    const q = query(
      ordersRef,
      where('storeId', '==', storeId),
      where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate))
      // where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate)) // Descomentar após deploy do índice
    );

    const snapshot = await getDocs(q);
    const allOrders: any[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      allOrders.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
      });
    });

    // Filtrar no JavaScript (solução temporária)
    const orders = allOrders.filter((order) => {
      const orderDate = order.createdAt;
      return orderDate && orderDate <= dateRange.endDate;
    });

    // Calcular métricas
    const revenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
    const totalOrders = orders.length;
    const averageTicket = totalOrders > 0 ? revenue / totalOrders : 0;

    // Clientes únicos
    const uniqueCustomers = new Set(orders.map((o) => o.customerId));
    const newCustomers = uniqueCustomers.size;

    // Agrupar por dia
    const dailyMap = new Map<string, { revenue: number; orders: number }>();
    orders.forEach((order) => {
      const dateKey = order.createdAt
        ? order.createdAt.toISOString().split('T')[0]
        : 'unknown';
      const current = dailyMap.get(dateKey) || { revenue: 0, orders: 0 };
      dailyMap.set(dateKey, {
        revenue: current.revenue + (order.total || 0),
        orders: current.orders + 1,
      });
    });

    const dailyRevenue = Array.from(dailyMap.entries())
      .map(([date, data]) => ({ date, ...data }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Agrupar por status
    const statusMap = new Map<string, number>();
    orders.forEach((order) => {
      const status = order.status || 'unknown';
      statusMap.set(status, (statusMap.get(status) || 0) + 1);
    });

    const ordersByStatus = Array.from(statusMap.entries()).map(
      ([status, count]) => ({
        status,
        count,
        percentage: (count / totalOrders) * 100,
      })
    );

    console.log('✅ Performance calculada:', {
      revenue,
      totalOrders,
      averageTicket,
    });

    return {
      revenue,
      totalOrders,
      averageTicket,
      newCustomers,
      dailyRevenue,
      ordersByStatus,
    };
  } catch (error) {
    console.error('❌ Erro ao buscar performance:', error);
    throw error;
  }
}

/**
 * Busca relatório financeiro detalhado
 */
export async function getFinancialReport(
  storeId: string,
  dateRange: DateRange,
  pageSize: number = 100
): Promise<FinancialReport> {
  try {
    console.log('💰 Buscando relatório financeiro...');

    const ordersRef = collection(db, 'orders');
    
    // SOLUÇÃO TEMPORÁRIA: Removendo where <= e orderBy para evitar erro de índice
    const q = query(
      ordersRef,
      where('storeId', '==', storeId),
      where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate))
    );

    const snapshot = await getDocs(q);
    const allOrders: any[] = [];

    snapshot.forEach((doc) => {
      allOrders.push({ id: doc.id, ...doc.data() });
    });

    // Filtrar, ordenar e limitar no JavaScript (solução temporária)
    const filteredOrders = allOrders
      .filter((data) => {
        const orderDate = data.createdAt?.toDate();
        return orderDate && orderDate <= dateRange.endDate;
      })
      .sort((a, b) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, pageSize);

    const orders: FinancialOrder[] = [];

    // Buscar configurações da plataforma
    const config = await getPlatformConfig();
    const commissionRate = config.commissionRate / 100; // Converter % para decimal

    let grossRevenue = 0;
    let platformFee = 0;
    let deliveryFee = 0;

    filteredOrders.forEach((doc) => {
      const data = doc;

      const itemsTotal = data.subtotal || data.total || 0;
      const delivery = data.deliveryFee || 0;
      const fee = (itemsTotal * commissionRate) + config.platformFee; // Taxa variável + taxa fixa
      const net = itemsTotal + delivery - fee;

      orders.push({
        id: doc.id,
        date: data.createdAt?.toDate() || new Date(),
        customerName: data.customerName || 'Cliente',
        itemsTotal,
        deliveryFee: delivery,
        platformFee: fee,
        netAmount: net,
        status: data.status || 'unknown',
      });

      grossRevenue += itemsTotal + delivery;
      platformFee += fee;
      deliveryFee += delivery;
    });

    const netRevenue = grossRevenue - platformFee;

    console.log('✅ Relatório financeiro gerado:', {
      orders: orders.length,
      grossRevenue,
    });

    return {
      orders,
      summary: {
        grossRevenue,
        platformFee,
        deliveryFee,
        netRevenue,
      },
      totalCount: snapshot.size,
    };
  } catch (error) {
    console.error('❌ Erro ao buscar relatório financeiro:', error);
    throw error;
  }
}

/**
 * Busca análise de produtos
 */
export async function getProductAnalytics(
  storeId: string,
  dateRange: DateRange
): Promise<ProductAnalytics> {
  try {
    console.log('📦 Buscando análise de produtos...');

    const ordersRef = collection(db, 'orders');
    
    // SOLUÇÃO TEMPORÁRIA: Removendo where <= para evitar erro de índice
    const q = query(
      ordersRef,
      where('storeId', '==', storeId),
      where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate))
    );

    const snapshot = await getDocs(q);

    // Filtrar por data no JavaScript (solução temporária)
    const allOrders: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const orderDate = data.createdAt?.toDate();
      if (orderDate && orderDate <= dateRange.endDate) {
        allOrders.push(data);
      }
    });

    // Agregar por produto
    const productMap = new Map<
      string,
      {
        name: string;
        category: string;
        quantity: number;
        revenue: number;
        orders: Set<string>;
      }
    >();

    allOrders.forEach((data) => {
      const items = data.items || [];

      items.forEach((item: any) => {
        const productId = item.productId || item.id || 'unknown';
        const current = productMap.get(productId) || {
          name: item.name || 'Produto',
          category: item.category || 'Sem categoria',
          quantity: 0,
          revenue: 0,
          orders: new Set<string>(),
        };

        current.quantity += item.quantity || 1;
        current.revenue += (item.price || 0) * (item.quantity || 1);
        current.orders.add(doc.id);

        productMap.set(productId, current);
      });
    });

    // Converter para array
    const products: ProductStats[] = Array.from(productMap.entries()).map(
      ([productId, data]) => ({
        productId,
        productName: data.name,
        category: data.category,
        quantitySold: data.quantity,
        revenue: data.revenue,
        ordersCount: data.orders.size,
      })
    );

    // Ordenar por faturamento
    products.sort((a, b) => b.revenue - a.revenue);

    // Top 10
    const topProducts = products.slice(0, 10);

    console.log('✅ Análise de produtos gerada:', { products: products.length });

    return {
      products,
      topProducts,
    };
  } catch (error) {
    console.error('❌ Erro ao buscar análise de produtos:', error);
    throw error;
  }
}

/**
 * Busca análise de clientes
 */
export async function getCustomerAnalytics(
  storeId: string,
  dateRange: DateRange
): Promise<CustomerAnalytics> {
  try {
    console.log('👥 Buscando análise de clientes...');

    const ordersRef = collection(db, 'orders');
    
    // SOLUÇÃO TEMPORÁRIA: Removendo where <= para evitar erro de índice
    const q = query(
      ordersRef,
      where('storeId', '==', storeId),
      where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate))
    );

    const snapshot = await getDocs(q);

    // Filtrar por data no JavaScript (solução temporária)
    const allOrders: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      const orderDate = data.createdAt?.toDate();
      if (orderDate && orderDate <= dateRange.endDate) {
        allOrders.push(data);
      }
    });

    // Agregar por cliente
    const customerMap = new Map<
      string,
      {
        name: string;
        email: string;
        orders: number;
        spent: number;
        lastOrder: Date;
        firstOrder: Date;
      }
    >();

    allOrders.forEach((data) => {
      const customerId = data.customerId || 'unknown';
      const orderDate = data.createdAt?.toDate() || new Date();

      const current = customerMap.get(customerId) || {
        name: data.customerName || 'Cliente',
        email: data.customerEmail || '',
        orders: 0,
        spent: 0,
        lastOrder: orderDate,
        firstOrder: orderDate,
      };

      current.orders += 1;
      current.spent += data.total || 0;

      if (orderDate > current.lastOrder) {
        current.lastOrder = orderDate;
      }
      if (orderDate < current.firstOrder) {
        current.firstOrder = orderDate;
      }

      customerMap.set(customerId, current);
    });

    // Converter para array
    const customers: CustomerStats[] = Array.from(customerMap.entries()).map(
      ([customerId, data]) => ({
        customerId,
        customerName: data.name,
        customerEmail: data.email,
        totalOrders: data.orders,
        totalSpent: data.spent,
        lastOrderDate: data.lastOrder,
        firstOrderDate: data.firstOrder,
      })
    );

    // Ordenar por valor gasto
    customers.sort((a, b) => b.totalSpent - a.totalSpent);

    // Calcular métricas
    const totalCustomers = customers.length;
    const recurringCustomers = customers.filter((c) => c.totalOrders > 1).length;
    const newCustomers = totalCustomers - recurringCustomers;

    console.log('✅ Análise de clientes gerada:', { customers: totalCustomers });

    return {
      customers,
      summary: {
        totalCustomers,
        newCustomers,
        recurringCustomers,
      },
    };
  } catch (error) {
    console.error('❌ Erro ao buscar análise de clientes:', error);
    throw error;
  }
}

/**
 * Exporta dados para CSV
 */
export function exportToCSV(data: any[], filename: string) {
  if (data.length === 0) return;

  // Pegar headers do primeiro objeto
  const headers = Object.keys(data[0]);

  // Criar linhas CSV
  const csvRows = [
    headers.join(','), // Header
    ...data.map((row) =>
      headers
        .map((header) => {
          let value = row[header];

          // Formatar datas
          if (value instanceof Date) {
            value = value.toLocaleDateString('pt-BR');
          }

          // Formatar números
          if (typeof value === 'number') {
            value = value.toFixed(2);
          }

          // Escapar vírgulas e aspas
          if (typeof value === 'string') {
            value = `"${value.replace(/"/g, '""')}"`;
          }

          return value;
        })
        .join(',')
    ),
  ];

  // Criar blob e download
  const csvContent = csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log('✅ CSV exportado:', filename);
}

/**
 * Gera ranges de datas pré-definidos
 */
export function getPresetDateRanges() {
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const todayEnd = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
    23,
    59,
    59
  );

  return {
    today: {
      startDate: todayStart,
      endDate: todayEnd,
    },
    yesterday: {
      startDate: new Date(todayStart.getTime() - 24 * 60 * 60 * 1000),
      endDate: new Date(todayStart.getTime() - 1),
    },
    last7Days: {
      startDate: new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000),
      endDate: todayEnd,
    },
    last30Days: {
      startDate: new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000),
      endDate: todayEnd,
    },
    thisMonth: {
      startDate: new Date(today.getFullYear(), today.getMonth(), 1),
      endDate: todayEnd,
    },
    lastMonth: {
      startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
      endDate: new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59),
    },
  };
}

