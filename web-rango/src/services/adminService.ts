/**
 * adminService.ts
 * Serviço centralizado para operações de super administrador
 * Todas as consultas globais da plataforma passam por aqui
 */

import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  updateDoc,
  addDoc,
  setDoc,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp,
  DocumentData,
  QueryConstraint,
  startAfter,
  endBefore,
  limitToLast
} from "firebase/firestore";
import { db } from "@/lib/firebase";

// ==================== TIPOS ====================

export interface PlatformStats {
  totalStores: number;
  activeStores: number;
  pendingStores: number;
  suspendedStores: number;
  totalCustomers: number;
  newCustomersThisMonth: number;
  totalDeliveryPersons: number;
  activeDeliveryPersons: number;
  ordersToday: number;
  ordersLast24h: number;
  ordersThisMonth: number;
  gmvToday: number;
  gmvLast7Days: number;
  gmvLast30Days: number;
  gmvThisMonth: number;
  platformRevenueToday: number;
  platformRevenueLast7Days: number;
  platformRevenueLast30Days: number;
  platformRevenueThisMonth: number;
  avgOrderValue: number;
  conversionRate: number;
}

export interface RevenueDataPoint {
  date: string;
  gmv: number;
  revenue: number;
  orders: number;
}

export interface ActivityEvent {
  id: string;
  type: 'store_approved' | 'store_created' | 'order_milestone' | 'user_milestone' | 'alert';
  title: string;
  description: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export interface UserData {
  id: string;
  email: string;
  nome?: string;
  role: string;
  createdAt: any;
  isActive?: boolean;
  isOnline?: boolean;
  totalOrders?: number;
  lastOrderDate?: any;
  phone?: string;
}

export interface FinancialTransaction {
  id: string;
  orderId: string;
  storeId: string;
  storeName: string;
  total: number;
  platformFee: number;
  platformCommission: number;
  storeAmount: number;
  paymentMethod: string;
  status: string;
  createdAt: any;
}

export interface PlatformConfig {
  commissionRate: number; // Percentual de comissão (ex: 10 = 10%)
  platformFee: number; // Taxa fixa por pedido
  minimumOrderValue: number;
  deliveryFeeBase: number;
  termsOfService: string;
  privacyPolicy: string;
}

// ==================== ESTATÍSTICAS DA PLATAFORMA ====================

/**
 * Busca todas as estatísticas da plataforma
 * ATENÇÃO: Esta função é custosa, considere usar cache ou Cloud Functions
 */
export async function getPlatformStats(): Promise<PlatformStats> {
  try {
    console.log('📊 Iniciando carregamento de estatísticas...');
    
    // Buscar lojas
    const storesSnapshot = await getDocs(collection(db, 'stores'));
    const stores = storesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const totalStores = stores.length;
    const activeStores = stores.filter(s => s.isActive === true).length;
    const pendingStores = stores.filter(s => s.status === 'pending').length;
    const suspendedStores = stores.filter(s => s.isActive === false && s.status !== 'pending').length;

    // Buscar usuários
    const usersSnapshot = await getDocs(collection(db, 'users'));
    const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const totalCustomers = users.filter(u => u.role === 'cliente').length;
    const totalDeliveryPersons = users.filter(u => u.role === 'entregador').length;
    const activeDeliveryPersons = users.filter(u => u.role === 'entregador' && u.isOnline === true).length;
    
    // Clientes novos este mês
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const newCustomersThisMonth = users.filter(u => {
      if (u.role !== 'cliente') return false;
      const createdAt = u.createdAt?.toDate?.() || new Date(0);
      return createdAt >= monthStart;
    }).length;

    // Buscar pedidos
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Calcular métricas temporais
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filtrar pedidos por período
    const ordersToday = orders.filter(o => {
      const orderDate = o.createdAt?.toDate?.() || new Date(0);
      return orderDate >= todayStart;
    });

    const ordersLast24h = orders.filter(o => {
      const orderDate = o.createdAt?.toDate?.() || new Date(0);
      return orderDate >= yesterday;
    });

    const ordersLast7Days = orders.filter(o => {
      const orderDate = o.createdAt?.toDate?.() || new Date(0);
      return orderDate >= last7Days;
    });

    const ordersLast30Days = orders.filter(o => {
      const orderDate = o.createdAt?.toDate?.() || new Date(0);
      return orderDate >= last30Days;
    });

    const ordersThisMonth = orders.filter(o => {
      const orderDate = o.createdAt?.toDate?.() || new Date(0);
      return orderDate >= monthStart;
    });

    // Calcular GMV (Gross Merchandise Value)
    const calculateGMV = (ordersList: any[]) => 
      ordersList.reduce((sum, order) => sum + (order.total || 0), 0);

    const gmvToday = calculateGMV(ordersToday);
    const gmvLast7Days = calculateGMV(ordersLast7Days);
    const gmvLast30Days = calculateGMV(ordersLast30Days);
    const gmvThisMonth = calculateGMV(ordersThisMonth);

    // Calcular receita da plataforma (comissão + taxa)
    const calculateRevenue = (ordersList: any[]) => {
      const commissionRate = 0.10; // 10% padrão
      const platformFee = 2; // R$ 2 por pedido
      const gmv = calculateGMV(ordersList);
      return gmv * commissionRate + ordersList.length * platformFee;
    };

    const platformRevenueToday = calculateRevenue(ordersToday);
    const platformRevenueLast7Days = calculateRevenue(ordersLast7Days);
    const platformRevenueLast30Days = calculateRevenue(ordersLast30Days);
    const platformRevenueThisMonth = calculateRevenue(ordersThisMonth);

    // Métricas adicionais
    const avgOrderValue = orders.length > 0 ? orders.reduce((sum, o) => sum + (o.total || 0), 0) / orders.length : 0;
    const conversionRate = totalCustomers > 0 ? (orders.length / totalCustomers) * 100 : 0;

    const stats: PlatformStats = {
      totalStores,
      activeStores,
      pendingStores,
      suspendedStores,
      totalCustomers,
      newCustomersThisMonth,
      totalDeliveryPersons,
      activeDeliveryPersons,
      ordersToday: ordersToday.length,
      ordersLast24h: ordersLast24h.length,
      ordersThisMonth: ordersThisMonth.length,
      gmvToday,
      gmvLast7Days,
      gmvLast30Days,
      gmvThisMonth,
      platformRevenueToday,
      platformRevenueLast7Days,
      platformRevenueLast30Days,
      platformRevenueThisMonth,
      avgOrderValue,
      conversionRate,
    };

    console.log('✅ Estatísticas carregadas:', stats);
    return stats;
  } catch (error) {
    console.error('❌ Erro ao buscar estatísticas:', error);
    throw error;
  }
}

/**
 * Busca dados de receita dos últimos N dias para gráficos
 */
export async function getRevenueChartData(days: number = 30): Promise<RevenueDataPoint[]> {
  try {
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const now = new Date();
    const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // Agrupar por dia
    const dataByDay = new Map<string, { gmv: number; orders: number }>();

    orders.forEach(order => {
      const orderDate = order.createdAt?.toDate?.() || new Date(0);
      if (orderDate >= startDate) {
        const dateKey = orderDate.toISOString().split('T')[0];
        const existing = dataByDay.get(dateKey) || { gmv: 0, orders: 0 };
        dataByDay.set(dateKey, {
          gmv: existing.gmv + (order.total || 0),
          orders: existing.orders + 1
        });
      }
    });

    // Converter para array e calcular receita
    const commissionRate = 0.10;
    const platformFee = 2;

    const chartData: RevenueDataPoint[] = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0];
      const data = dataByDay.get(dateKey) || { gmv: 0, orders: 0 };
      
      chartData.push({
        date: dateKey,
        gmv: data.gmv,
        revenue: data.gmv * commissionRate + data.orders * platformFee,
        orders: data.orders
      });
    }

    return chartData;
  } catch (error) {
    console.error('❌ Erro ao buscar dados de gráfico:', error);
    throw error;
  }
}

/**
 * Busca atividades recentes da plataforma
 */
export async function getRecentActivities(limitCount: number = 20): Promise<ActivityEvent[]> {
  const activities: ActivityEvent[] = [];

  try {
    // Buscar lojas recentemente aprovadas
    const storesQuery = query(
      collection(db, 'stores'),
      orderBy('updatedAt', 'desc'),
      limit(10)
    );
    const storesSnapshot = await getDocs(storesQuery);
    
    storesSnapshot.docs.forEach(doc => {
      const store = doc.data();
      if (store.status === 'approved' || store.isActive) {
        activities.push({
          id: `store-${doc.id}`,
          type: 'store_approved',
          title: 'Nova Loja Aprovada',
          description: `${store.name} foi aprovada e está ativa`,
          timestamp: store.updatedAt?.toDate?.() || new Date(),
          metadata: { storeId: doc.id, storeName: store.name }
        });
      }
    });

    // Buscar pedidos milestones (a cada 100 pedidos)
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    const totalOrders = ordersSnapshot.size;
    
    if (totalOrders % 100 === 0 && totalOrders > 0) {
      activities.push({
        id: `milestone-orders-${totalOrders}`,
        type: 'order_milestone',
        title: 'Marco de Pedidos Alcançado',
        description: `A plataforma atingiu ${totalOrders} pedidos!`,
        timestamp: new Date(),
        metadata: { totalOrders }
      });
    }

    // Ordenar por timestamp
    activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return activities.slice(0, limitCount);
  } catch (error) {
    console.error('❌ Erro ao buscar atividades:', error);
    return [];
  }
}

// ==================== GESTÃO DE LOJAS ====================

export async function getAllStores() {
  const storesSnapshot = await getDocs(collection(db, 'stores'));
  return storesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function updateStoreStatus(storeId: string, newStatus: 'approved' | 'rejected' | 'suspended', isActive: boolean) {
  const storeRef = doc(db, 'stores', storeId);
  await updateDoc(storeRef, {
    status: newStatus,
    isActive,
    updatedAt: Timestamp.now()
  });
}

// ==================== GESTÃO DE USUÁRIOS ====================

export async function getAllUsers(role?: 'cliente' | 'entregador') {
  let usersQuery;
  
  if (role) {
    usersQuery = query(collection(db, 'users'), where('role', '==', role));
  } else {
    usersQuery = collection(db, 'users');
  }
  
  const usersSnapshot = await getDocs(usersQuery);
  return usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as UserData[];
}

export async function getUserWithOrders(userId: string) {
  const userDoc = await getDoc(doc(db, 'users', userId));
  if (!userDoc.exists()) throw new Error('Usuário não encontrado');

  const ordersQuery = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const ordersSnapshot = await getDocs(ordersQuery);
  
  return {
    user: { id: userDoc.id, ...userDoc.data() },
    orders: ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
  };
}

export async function updateUserStatus(userId: string, isActive: boolean) {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    isActive,
    updatedAt: Timestamp.now()
  });
}

// ==================== FINANCEIRO GLOBAL ====================

export async function getFinancialTransactions(
  startDate?: Date,
  endDate?: Date,
  storeId?: string
): Promise<FinancialTransaction[]> {
  try {
    let constraints: QueryConstraint[] = [];
    
    if (startDate) {
      constraints.push(where('createdAt', '>=', Timestamp.fromDate(startDate)));
    }
    if (endDate) {
      constraints.push(where('createdAt', '<=', Timestamp.fromDate(endDate)));
    }
    if (storeId) {
      constraints.push(where('storeId', '==', storeId));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const ordersQuery = query(collection(db, 'orders'), ...constraints);
    const ordersSnapshot = await getDocs(ordersQuery);

    // Buscar configurações da plataforma
    const config = await getPlatformConfig();
    const commissionRate = config.commissionRate / 100; // Converter % para decimal
    const platformFee = config.platformFee;

    const transactions: FinancialTransaction[] = ordersSnapshot.docs.map(doc => {
      const order = doc.data();
      const total = order.total || 0;
      const platformCommission = total * commissionRate;
      const storeAmount = total - platformCommission - platformFee;

      return {
        id: doc.id,
        orderId: doc.id,
        storeId: order.storeId || '',
        storeName: order.storeName || 'N/A',
        total,
        platformFee,
        platformCommission,
        storeAmount,
        paymentMethod: order.paymentMethod || 'N/A',
        status: order.status || 'pending',
        createdAt: order.createdAt
      };
    });

    return transactions;
  } catch (error) {
    console.error('❌ Erro ao buscar transações:', error);
    throw error;
  }
}

// ==================== CONFIGURAÇÕES DA PLATAFORMA ====================

export async function getPlatformConfig(): Promise<PlatformConfig> {
  try {
    const configDoc = await getDoc(doc(db, 'platform_config', 'global'));
    
    if (configDoc.exists()) {
      return configDoc.data() as PlatformConfig;
    }
    
    // Configuração padrão
    return {
      commissionRate: 10,
      platformFee: 2,
      minimumOrderValue: 10,
      deliveryFeeBase: 5,
      termsOfService: '',
      privacyPolicy: ''
    };
  } catch (error) {
    console.error('❌ Erro ao buscar configurações:', error);
    throw error;
  }
}

export async function updatePlatformConfig(config: Partial<PlatformConfig>) {
  const configRef = doc(db, 'platform_config', 'global');
  
  // Usar setDoc com merge para criar o documento se não existir
  await setDoc(configRef, {
    ...config,
    updatedAt: Timestamp.now()
  }, { merge: true });
}

// ==================== OPERAÇÕES E SUPORTE ====================

export async function findOrderById(orderId: string) {
  const orderDoc = await getDoc(doc(db, 'orders', orderId));
  if (!orderDoc.exists()) throw new Error('Pedido não encontrado');
  
  return { id: orderDoc.id, ...orderDoc.data() };
}

export async function getPendingStores() {
  const storesQuery = query(
    collection(db, 'stores'),
    where('status', '==', 'pending'),
    orderBy('createdAt', 'desc')
  );
  
  const storesSnapshot = await getDocs(storesQuery);
  return storesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// ==================== GESTÃO DE TIPOS DE LOJA (CATEGORIAS) ====================

export interface StoreType {
  id: string;
  name: string;
  slug: string; // URL-friendly version (ex: "pizzaria", "acai")
  icon?: string; // Emoji ou nome do ícone
  description?: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

/**
 * Busca todos os tipos de loja (incluindo inativos)
 */
export async function getStoreTypes(): Promise<StoreType[]> {
  try {
    // Buscar todos sem orderBy para evitar necessidade de índice
    const typesSnapshot = await getDocs(collection(db, 'store_types'));
    
    // Ordenar em memória
    const types = typesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as StoreType[];
    
    return types.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  } catch (error) {
    console.error('❌ Erro ao buscar tipos de loja:', error);
    throw error;
  }
}

/**
 * Cria um novo tipo de loja
 */
export async function addStoreType(
  name: string, 
  icon?: string, 
  description?: string, 
  imageUrl?: string
): Promise<string> {
  try {
    // Gerar slug a partir do nome
    const slug = name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9]+/g, '-') // Substitui caracteres especiais por hífen
      .replace(/^-+|-+$/g, ''); // Remove hífens no início e fim

    // Verificar se já existe um tipo com esse slug
    const existingQuery = query(
      collection(db, 'store_types'),
      where('slug', '==', slug)
    );
    const existingSnapshot = await getDocs(existingQuery);
    
    if (!existingSnapshot.empty) {
      throw new Error('Já existe uma categoria com esse nome');
    }

    const newType = {
      name,
      slug,
      icon: icon || '🏪',
      description: description || '',
      imageUrl: imageUrl || '',
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'store_types'), newType);
    
    console.log('✅ Tipo de loja criado:', name);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erro ao criar tipo de loja:', error);
    throw error;
  }
}

/**
 * Atualiza um tipo de loja existente
 */
export async function updateStoreType(
  id: string, 
  updates: { name?: string; icon?: string; description?: string; imageUrl?: string; isActive?: boolean }
): Promise<void> {
  try {
    const typeRef = doc(db, 'store_types', id);
    
    // Se o nome mudou, atualizar o slug também
    if (updates.name) {
      const slug = updates.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      // Verificar se já existe outro tipo com esse slug
      const existingQuery = query(
        collection(db, 'store_types'),
        where('slug', '==', slug)
      );
      const existingSnapshot = await getDocs(existingQuery);
      
      if (!existingSnapshot.empty && existingSnapshot.docs[0].id !== id) {
        throw new Error('Já existe uma categoria com esse nome');
      }
      
      await updateDoc(typeRef, {
        ...updates,
        slug,
        updatedAt: Timestamp.now()
      });
    } else {
      await updateDoc(typeRef, {
        ...updates,
        updatedAt: Timestamp.now()
      });
    }
    
    console.log('✅ Tipo de loja atualizado:', id);
  } catch (error) {
    console.error('❌ Erro ao atualizar tipo de loja:', error);
    throw error;
  }
}

/**
 * Exclui um tipo de loja
 * ATENÇÃO: Verifica se há lojas usando essa categoria antes de excluir
 */
export async function deleteStoreType(id: string): Promise<void> {
  try {
    // Verificar se há lojas usando essa categoria
    const storesQuery = query(
      collection(db, 'stores'),
      where('categories', 'array-contains', id)
    );
    const storesSnapshot = await getDocs(storesQuery);
    
    if (!storesSnapshot.empty) {
      throw new Error(`Não é possível excluir. ${storesSnapshot.size} loja(s) estão usando esta categoria.`);
    }

    const typeRef = doc(db, 'store_types', id);
    await updateDoc(typeRef, {
      isActive: false,
      updatedAt: Timestamp.now()
    });
    
    console.log('✅ Tipo de loja desativado:', id);
  } catch (error) {
    console.error('❌ Erro ao excluir tipo de loja:', error);
    throw error;
  }
}

/**
 * Busca tipos de loja ativos (para uso pelos lojistas)
 * Versão otimizada sem orderBy para evitar necessidade de índice composto
 */
export async function getActiveStoreTypes(): Promise<StoreType[]> {
  try {
    console.log('🔍 getActiveStoreTypes: Iniciando busca...');
    const typesQuery = query(
      collection(db, 'store_types'),
      where('isActive', '==', true)
    );
    console.log('🔍 getActiveStoreTypes: Query montada, executando...');
    const typesSnapshot = await getDocs(typesQuery);
    console.log('🔍 getActiveStoreTypes: Docs recebidos:', typesSnapshot.size);
    
    // Ordenar em memória em vez de no Firestore
    const types = typesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as StoreType[];
    
    console.log('✅ getActiveStoreTypes: Tipos mapeados:', types);
    
    // Ordenar por nome alfabeticamente
    const sortedTypes = types.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
    console.log('✅ getActiveStoreTypes: Retornando', sortedTypes.length, 'tipos');
    return sortedTypes;
  } catch (error) {
    console.error('❌ getActiveStoreTypes: Erro ao buscar tipos ativos:', error);
    throw error;
  }
}

