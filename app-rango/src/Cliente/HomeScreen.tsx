import React, { useState, useEffect } from 'react';
import { View, ScrollView, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';
import HomeHeader from '../components/HomeHeader';
import CategoriesCarousel from '../components/CategoriesCarousel';
import RestaurantCarousel from '../components/RestaurantCarousel';
import ProductCarousel from '../components/ProductCarousel';
import FilterBar from '../components/FilterBar';
import RestaurantListItem from '../components/RestaurantListItem';
import BannersCarousel from '../components/BannersCarousel';
import { 
  mockCategories, 
  mockFilters
} from '../data/mockData';
import { subscribeToActiveStores } from '../services/storeService';
import { useAuth } from '../contexts/AuthContext';
import { getFavoriteStores } from '../services/favoriteService';
import { subscribeToActiveCategories, getDefaultCategories } from '../services/categoryService';
import { Banner } from '../services/bannerService';

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList>;

const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { usuarioLogado: user } = useAuth();
  
  // Estados para dados reais do Firebase
  const [stores, setStores] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [favoriteStores, setFavoriteStores] = useState<any[]>([]);
  const [pizzaProducts, setPizzaProducts] = useState<any[]>([]);
  const [marmitaProducts, setMarmitaProducts] = useState<any[]>([]);
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(true);

  // Popular banco automaticamente se vazio
  const [autoSeedChecked, setAutoSeedChecked] = useState(false);

  // Carregar categorias com listener em tempo real
  useEffect(() => {
    console.log('🔵 HomeScreen: Inscrevendo-se nas categorias em tempo real...');
    
    const unsubscribe = subscribeToActiveCategories((firebaseCategories) => {
      if (firebaseCategories.length > 0) {
        // Formatar para o componente
        const formatted = firebaseCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          slug: cat.slug,
          imageUrl: cat.imageUrl,
        }));
        setCategories(formatted);
        console.log('✅ Categorias atualizadas em tempo real:', formatted.length);
      } else {
        // Fallback para categorias padrão
        const defaultCategories = getDefaultCategories();
        const formatted = defaultCategories.map(cat => ({
          id: cat.id,
          name: cat.name,
          icon: cat.icon,
          slug: cat.slug,
          imageUrl: cat.imageUrl,
        }));
        setCategories(formatted);
        console.log('✅ Usando categorias padrão:', formatted.length);
      }
    });

    // Cleanup: cancelar listener quando o componente desmontar
    return () => {
      console.log('🔵 HomeScreen: Cancelando listener de categorias');
      unsubscribe();
    };
  }, []);

  // Carregar banners com listener em tempo real (apenas para HOME)
  useEffect(() => {
    console.log('🎨 HomeScreen: Carregando banners para tela HOME...');
    
    const loadHomeBanners = async () => {
      try {
        const { getBannersByLocation } = await import('../services/bannerService');
        const homeBanners = await getBannersByLocation('home');
        setBanners(homeBanners);
        console.log('✅ Banners HOME carregados:', homeBanners.length);
      } catch (error) {
        console.error('❌ Erro ao carregar banners HOME:', error);
        setBanners([]);
      }
    };

    loadHomeBanners();
    
    // Recarregar a cada 5 minutos para pegar novos banners
    const interval = setInterval(loadHomeBanners, 5 * 60 * 1000);

    // Cleanup
    return () => {
      console.log('🎨 HomeScreen: Limpando interval de banners');
      clearInterval(interval);
    };
  }, []);

  // Estados dos filtros
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'relevancia' | 'distancia' | 'tempo' | 'avaliacao' | 'preco'>('relevancia');

  // Carregar lojas ativas do Firebase
  useEffect(() => {
    console.log('🔵 HomeScreen: Carregando lojas ativas do Firebase...');
    
    const unsubscribe = subscribeToActiveStores(async (storesData) => {
      console.log('✅ HomeScreen: Lojas recebidas:', storesData.length);
      
      // Se não houver lojas e ainda não tentou popular, popular automaticamente
      if (storesData.length === 0 && !autoSeedChecked) {
        setAutoSeedChecked(true);
        console.log('\n' + '='.repeat(50));
        console.log('⚠️ BANCO VAZIO! Populando automaticamente...');
        console.log('='.repeat(50));
        try {
          const { seedFirebaseData } = await import('../utils/seedFirebase');
          await seedFirebaseData();
          console.log('\n' + '='.repeat(50));
          console.log('✅ BANCO POPULADO COM SUCESSO!');
          console.log('⏳ Aguardando sincronização...');
          console.log('='.repeat(50) + '\n');
          // O listener vai detectar automaticamente as novas lojas
        } catch (error) {
          console.error('\n❌ ERRO AO POPULAR BANCO:', error);
        }
        return;
      }
      
      // Converter dados do Firebase para formato do componente
      const formattedStores = storesData.map(store => {
        // Log para debug de imagens
        if (!store.coverImage || !store.logo) {
          console.warn(`⚠️ Loja "${store.name}" sem imagens:`, {
            coverImage: store.coverImage || 'AUSENTE',
            logo: store.logo || 'AUSENTE'
          });
        }
        
        // Log para debug de categoria
        console.log(`📊 Loja: ${store.name} | Categoria: ${store.category || 'SEM CATEGORIA'}`);
        
        return {
          id: store.id,
          name: store.name,
          image: store.coverImage || 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop',
          logo: store.logo || 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop',
          rating: store.rating || 4.5,
          reviewCount: store.reviewCount || Math.floor(Math.random() * 1000) + 100,
          distance: '2.1 km', // TODO: Calcular distância real
          deliveryTime: store.delivery?.deliveryTime || '25-35 min',
          deliveryFee: `R$ ${store.delivery?.deliveryFee?.toFixed(2) || '3,99'}`,
          category: store.category || 'Restaurante',
          isFavorite: false,
          description: store.description,
          isActive: store.isActive,
        };
      });
      
      setStores(formattedStores);
      setLoading(false);
    });

    return () => {
      console.log('🔴 HomeScreen: Cancelando inscrição de lojas');
      unsubscribe();
    };
  }, []);

  // Carregar produtos populares (sem necessidade de índices complexos)
  useEffect(() => {
    const loadProducts = async () => {
      // Aguardar um pouco para as lojas carregarem primeiro
      if (loading) return;
      
      console.log('🔵 HomeScreen: Carregando produtos populares...');
      setProductsLoading(true);
      
      try {
        const { getPopularProducts } = await import('../services/menuService');
        const popularItems = await getPopularProducts(20);
        
        console.log('✅ Produtos populares carregados:', popularItems.length);
        
        if (popularItems.length === 0) {
          console.log('⚠️ Nenhum produto popular encontrado');
          setProductsLoading(false);
          return;
        }
        
        // Formatar produtos para exibição
        const formattedProducts = popularItems.map((item: any) => {
          // Suportar AMBAS estruturas: web-rango (basePrice) e app-rango (price)
          const price = typeof item.basePrice === 'number' 
            ? item.basePrice 
            : (typeof item.price === 'number' ? item.price : 0);
          
          // Suportar AMBAS estruturas: web-rango (images array) e app-rango (image string)
          let image = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop';
          if (item.image) {
            // Estrutura simples do app
            image = item.image;
          } else if (item.images && item.images.length > 0) {
            // Estrutura avançada do web (pegar primeira imagem)
            image = item.images[0].url || item.images[0].thumbnailUrl || image;
          }
          
          // Descrição pode ser shortDescription ou description
          const description = item.shortDescription || item.description || '';
          
          // Log de debug
          console.log(`📦 Formatando produto: ${item.name}`, {
            price: price,
            hasImage: !!image,
            structure: item.basePrice ? 'web-rango' : 'app-rango'
          });
          
          return {
            id: item.id,
            name: item.name || 'Produto sem nome',
            description: description,
            basePrice: price, // Enviar como número para o ProductCard formatar
            image: image,
            storeId: item.storeId,
            rating: item.rating || 4.5,
            isPopular: item.isPopular || false,
            isFavorite: false,
          };
        });
        
        // Filtrar apenas produtos válidos (com nome e preço)
        const validProducts = formattedProducts.filter(p => p.name && p.basePrice > 0);
        
        console.log('📦 Produtos formatados:', formattedProducts.length);
        console.log('✅ Produtos válidos:', validProducts.length);
        
        if (validProducts.length === 0) {
          console.warn('⚠️ Nenhum produto válido encontrado!');
          setProductsLoading(false);
          return;
        }
        
        // Separar por loja (simplificado)
        setPizzaProducts(validProducts.slice(0, 5));
        setMarmitaProducts(validProducts.slice(5, 10));
        
      } catch (error) {
        console.error('❌ Erro ao carregar produtos:', error);
      } finally {
        setProductsLoading(false);
      }
    };
    
    loadProducts();
  }, [loading]);

  // Carregar lojas favoritas
  useEffect(() => {
    const loadFavorites = async () => {
      if (!user?.uid) {
        setFavoriteStores([]);
        return;
      }

      try {
        const favStores = await getFavoriteStores(user.uid);
        const formattedFavorites = favStores.map(store => ({
          id: store.id,
          name: store.name,
          image: store.coverImage || 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop',
          logo: store.logo || 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop',
          rating: store.rating || 4.5,
          reviewCount: store.reviewCount || 100,
          distance: '2.1 km',
          deliveryTime: store.delivery?.deliveryTime || '25-35 min',
          deliveryFee: `R$ ${store.delivery?.deliveryFee?.toFixed(2) || '3,99'}`,
          category: store.category || 'Restaurante',
          isFavorite: true,
          description: store.description,
          isActive: store.isActive,
        }));
        setFavoriteStores(formattedFavorites);
      } catch (error) {
        console.error('Erro ao carregar favoritos:', error);
      }
    };

    loadFavorites();
  }, [user]);

  const handleAddressChange = () => {
    navigation.navigate('Address');
  };

  // Função para filtrar e ordenar lojas
  const getFilteredStores = () => {
    let filteredStores = [...stores];
    
    // Aplicar filtros
    activeFilters.forEach(filterId => {
      switch(filterId) {
        case '2': // Entrega grátis
          filteredStores = filteredStores.filter(store => 
            store.delivery?.deliveryFee === 0 || store.delivery?.deliveryFee === '0'
          );
          break;
        case '3': // Vale-refeição
          filteredStores = filteredStores.filter(store => 
            store.paymentOptions?.includes('Ticket') || 
            store.paymentOptions?.includes('Vale-refeição')
          );
          break;
        case '5': // Entrega rápida (até 30 min)
          filteredStores = filteredStores.filter(store => {
            const timeMatch = store.delivery?.deliveryTime?.match(/(\d+)/);
            return timeMatch && parseInt(timeMatch[0]) <= 30;
          });
          break;
        case '7': // Promoções
          filteredStores = filteredStores.filter(store => 
            store.hasPromotions || store.discount > 0
          );
          break;
      }
    });
    
    // Aplicar ordenação
    switch(sortBy) {
      case 'avaliacao':
        filteredStores.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'tempo':
        filteredStores.sort((a, b) => {
          const timeA = parseInt(a.delivery?.deliveryTime?.match(/(\d+)/)?.[0] || '999');
          const timeB = parseInt(b.delivery?.deliveryTime?.match(/(\d+)/)?.[0] || '999');
          return timeA - timeB;
        });
        break;
      case 'preco':
        filteredStores.sort((a, b) => {
          const feeA = parseFloat(String(a.delivery?.deliveryFee || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
          const feeB = parseFloat(String(b.delivery?.deliveryFee || 0).replace(/[^\d,]/g, '').replace(',', '.')) || 0;
          return feeA - feeB;
        });
        break;
      case 'distancia':
        // Placeholder para distância (requer geolocalização)
        break;
      case 'relevancia':
      default:
        // Ordenar por popularidade/rating
        filteredStores.sort((a, b) => {
          const scoreA = (a.rating || 0) * (a.reviewCount || 1);
          const scoreB = (b.rating || 0) * (b.reviewCount || 1);
          return scoreB - scoreA;
        });
        break;
    }
    
    return filteredStores;
  };

  const handleCategoryPress = (category: any) => {
    console.log('Categoria selecionada:', category.name, 'slug:', category.slug);
    navigation.navigate('Category', {
      categoryId: category.slug || category.id, // Usar slug, fallback para id
      categoryName: category.name,
    });
  };

  const handleRestaurantPress = (restaurant: any) => {
    console.log('Restaurante selecionado:', restaurant.name);
    navigation.navigate('Store', {
      storeId: restaurant.id,
    });
  };

  const handleProductPress = (product: any) => {
    console.log('Produto selecionado:', product.name);
    // Navegar para a loja do produto
    navigation.navigate('Store', {
      storeId: product.storeId,
    });
  };

  const handleFavoritePress = (restaurant: any) => {
    console.log('Favoritar restaurante:', restaurant.name);
  };

  const handleFavoriteProductPress = (product: any) => {
    console.log('Favoritar produto:', product.name);
  };

  const handleSeeMorePress = () => {
    console.log('Ver mais restaurantes');
  };

  const handleFilterPress = (filter: any) => {
    console.log('Filtro selecionado:', filter.label);
    
    const filterId = filter.id;
    
    // Filtros especiais com ações
    if (filterId === '1') {
      // Ordenar - Ciclar entre opções
      const sortOptions: Array<'relevancia' | 'distancia' | 'tempo' | 'avaliacao' | 'preco'> = 
        ['relevancia', 'avaliacao', 'tempo', 'preco'];
      const currentIndex = sortOptions.indexOf(sortBy);
      const nextSort = sortOptions[(currentIndex + 1) % sortOptions.length];
      setSortBy(nextSort);
      
      const sortLabels = {
        relevancia: 'Relevância',
        avaliacao: 'Melhor avaliação',
        tempo: 'Entrega rápida',
        preco: 'Menor preço',
        distancia: 'Distância'
      };
      console.log('📊 Ordenando por:', sortLabels[nextSort]);
      return;
    }
    
    // Toggle outros filtros
    if (activeFilters.includes(filterId)) {
      setActiveFilters(activeFilters.filter(f => f !== filterId));
      console.log('❌ Filtro removido:', filter.label);
    } else {
      setActiveFilters([...activeFilters, filterId]);
      console.log('✅ Filtro adicionado:', filter.label);
    }
  };

  const handlePressRestaurant = (restaurant: any) => {
    console.log('Restaurante da lista selecionado:', restaurant.name);
    navigation.navigate('Store', {
      storeId: restaurant.id,
    });
  };

  const handleToggleFavorite = (restaurant: any) => {
    console.log('Toggle favorito:', restaurant.name);
  };

  const handleBannerPress = (banner: Banner) => {
    console.log('Banner pressionado:', banner.title);
    
    // Navegar de acordo com o tipo de link
    if (banner.linkType === 'store' && banner.linkTarget) {
      navigation.navigate('Store', { storeId: banner.linkTarget });
    } else if (banner.linkType === 'category' && banner.linkTarget) {
      navigation.navigate('Category', {
        categoryId: banner.linkTarget,
        categoryName: banner.title,
      });
    } else if (banner.linkType === 'product' && banner.linkTarget) {
      // TODO: Implementar navegação direta para produto
      console.log('Navegar para produto:', banner.linkTarget);
    } else if (banner.linkType === 'external' && banner.link) {
      // TODO: Abrir link externo
      console.log('Abrir link externo:', banner.link);
    }
  };

  // Separar lojas por categoria (para seção "Restaurantes")
  const restaurantStores = stores.filter(store => {
    const category = store.category?.toLowerCase() || '';
    return category.includes('restaurante') || category.includes('comida');
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <HomeHeader 
        address="R. Dr. José Gabriel Monteiro Neto, 271"
        onAddressPress={handleAddressChange}
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Carrossel de Categorias */}
        <CategoriesCarousel 
          categories={categories.length > 0 ? categories : mockCategories}
          onCategoryPress={handleCategoryPress}
        />
        
        {/* Carrossel de Banners */}
        {banners.length > 0 && (
          <BannersCarousel 
            banners={banners}
            onBannerPress={handleBannerPress}
          />
        )}
        
        {productsLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Carregando produtos...</Text>
          </View>
        ) : (
          <>
            {/* Lojas Favoritas */}
            {favoriteStores.length > 0 && (
              <View style={styles.favoritesSection}>
                <View style={styles.sectionHeader}>
                  <View style={styles.sectionTitleContainer}>
                    <Ionicons name="heart" size={20} color="#EA1D2C" />
                    <Text style={styles.sectionTitle}>Favoritos</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('Favorites')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.seeMoreText}>Ver todos</Text>
                  </TouchableOpacity>
                </View>
                <RestaurantCarousel
                  title=""
                  data={favoriteStores}
                  onSeeMorePress={() => navigation.navigate('Favorites')}
                  onRestaurantPress={handleRestaurantPress}
                  onFavoritePress={handleFavoritePress}
                />
              </View>
            )}

            {/* Carrossel de Produtos Populares */}
            {pizzaProducts.length > 0 && (
              <ProductCarousel
                title="Mais Pedidos"
                data={pizzaProducts}
                onSeeMorePress={handleSeeMorePress}
                onProductPress={handleProductPress}
                onFavoritePress={handleFavoriteProductPress}
              />
            )}
            
            {/* Carrossel de Destaques */}
            {marmitaProducts.length > 0 && (
              <ProductCarousel
                title="Em Destaque"
                data={marmitaProducts}
                onSeeMorePress={handleSeeMorePress}
                onProductPress={handleProductPress}
                onFavoritePress={handleFavoriteProductPress}
              />
            )}
            
            {/* Carrossel de Restaurantes - LOJAS */}
            {restaurantStores.length > 0 && (
              <RestaurantCarousel
                title="Restaurantes"
                data={restaurantStores}
                onSeeMorePress={handleSeeMorePress}
                onRestaurantPress={handleRestaurantPress}
                onFavoritePress={handleFavoritePress}
              />
            )}
          </>
        )}
        
        {/* Filtros */}
        <FilterBar 
          filters={mockFilters}
          onFilterPress={handleFilterPress}
          activeFilters={activeFilters}
          currentSort={sortBy}
        />
        
        {/* Lista de Restaurantes */}
        <View style={styles.restaurantsList}>
          <Text style={styles.listTitle}>
            Todas as lojas
            {(activeFilters.length > 0 || sortBy !== 'relevancia') && (
              <Text style={styles.filterCount}> ({getFilteredStores().length})</Text>
            )}
          </Text>
          
          {loading ? (
            <Text style={styles.loadingText}>Carregando...</Text>
          ) : stores.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Nenhuma loja encontrada</Text>
              <Text style={styles.emptyText}>
                As lojas aparecerão aqui assim que forem criadas no dashboard
              </Text>
            </View>
          ) : getFilteredStores().length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Nenhuma loja corresponde aos filtros</Text>
              <Text style={styles.emptyText}>
                Tente remover alguns filtros para ver mais opções
              </Text>
            </View>
          ) : (
            getFilteredStores().map((restaurant, index) => (
              <RestaurantListItem
                key={restaurant.id}
                restaurant={restaurant}
                onPressRestaurant={() => handlePressRestaurant(restaurant)}
                onToggleFavorite={() => handleToggleFavorite(restaurant)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  restaurantsList: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  filterCount: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EA1D2C',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
  favoritesSection: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  seeMoreText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EA1D2C',
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default HomeScreen;