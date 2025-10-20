import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types/navigation';

// Componentes
import CategoryHeader from '../components/CategoryHeader';
import CategoryFilterCarousel from '../components/CategoryFilterCarousel';
import SubCategoryCarousel from '../components/SubCategoryCarousel';
import ContentCarousel from '../components/ContentCarousel';
import RestaurantCard from '../components/RestaurantCard';
import DiscountedDishCard from '../components/DiscountedDishCard';
import PromoBannerCard from '../components/PromoBannerCard';
import RestaurantListItem from '../components/RestaurantListItem';
import ResponsiveBanner from '../components/ResponsiveBanner';

// Dados
import { mockCategories } from '../data/mockData';
import { getCategoryScreenData } from '../data/categoryData';

// Services
import { getStoresByCategorySlug } from '../services/storeService';
import { mapCategoryIdToSlug } from '../services/categoryService';

type CategoryScreenRouteProp = RouteProp<{
  Category: { categoryId: string; categoryName: string };
}, 'Category'>;

interface ShelfItem {
  type: string;
  title?: string;
  data?: any;
}

type CategoryScreenNavigationProp = StackNavigationProp<HomeStackParamList>;

const CategoryScreen: React.FC = () => {
  const route = useRoute<CategoryScreenRouteProp>();
  const navigation = useNavigation<CategoryScreenNavigationProp>();
  const { categoryId, categoryName } = route.params;
  
  const [activeCategory, setActiveCategory] = useState(categoryId);
  const [screenData, setScreenData] = useState<ShelfItem[]>([]);
  const [stores, setStores] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [discountedDishes, setDiscountedDishes] = useState<any[]>([]);
  const [subcategories, setSubcategories] = useState<any[]>([]);
  const [categoryBanners, setCategoryBanners] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  // Carregar categorias do Firebase
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { subscribeToActiveCategories } = await import('../services/categoryService');
        const unsubscribe = subscribeToActiveCategories((firebaseCategories) => {
          if (firebaseCategories.length > 0) {
            const formatted = firebaseCategories.map(cat => ({
              id: cat.id,
              name: cat.name,
              icon: cat.icon,
              slug: cat.slug,
              imageUrl: cat.imageUrl,
            }));
            setCategories(formatted);
          } else {
            // Fallback para categorias mock
            setCategories(mockCategories);
          }
        });
        return () => unsubscribe();
      } catch (error) {
        console.error('Erro ao carregar categorias:', error);
        setCategories(mockCategories);
      }
    };
    loadCategories();
  }, []);

  // Carregar banners para tela de categoria
  useEffect(() => {
    const loadCategoryBanners = async () => {
      try {
        const { getBannersByLocation } = await import('../services/bannerService');
        const banners = await getBannersByLocation('category');
        setCategoryBanners(banners);
      } catch (error) {
        console.error('Erro ao carregar banners:', error);
      }
    };
    loadCategoryBanners();
  }, []);

  // Carregar produtos com desconto do Firebase
  useEffect(() => {
    const loadDiscountedProducts = async () => {
      try {
        const { getDiscountedProducts } = await import('../services/menuService');
        const products = await getDiscountedProducts(10);
        setDiscountedDishes(products);
      } catch (error) {
        console.error('Erro ao carregar produtos com desconto:', error);
      }
    };
    loadDiscountedProducts();
  }, []);

  // Carregar subcategorias (categorias de menu das lojas da categoria)
  useEffect(() => {
    const loadSubcategories = async () => {
      if (stores.length === 0) return;
      
      try {
        const { getStoreMenuCategories } = await import('../services/menuService');
        const allSubcategories: any[] = [];
        
        // Buscar categorias de menu das primeiras lojas
        for (const store of stores.slice(0, 3)) {
          try {
            const categories = await getStoreMenuCategories(store.id);
            categories.forEach(cat => {
              // Adicionar apenas se ainda não existe (evitar duplicatas)
              if (!allSubcategories.find(sub => sub.name.toLowerCase() === cat.name.toLowerCase())) {
                allSubcategories.push({
                  id: cat.id,
                  name: cat.name,
                  image: cat.image || `https://images.unsplash.com/photo-${Math.floor(Math.random() * 1000000)}?w=200&h=200&fit=crop`,
                  storeId: store.id,
                });
              }
            });
          } catch (err) {
            console.log(`Erro ao carregar categorias da loja ${store.id}:`, err);
          }
        }
        
        setSubcategories(allSubcategories);
      } catch (error) {
        console.error('Erro ao carregar subcategorias:', error);
      }
    };
    
    loadSubcategories();
  }, [stores]);

  // Carregar lojas da categoria
  useEffect(() => {
    loadCategoryStores(activeCategory);
  }, [activeCategory]);

  const loadCategoryStores = async (categoryId: string) => {
    setLoading(true);
    try {
      const categorySlug = mapCategoryIdToSlug(categoryId);
      console.log(`🔵 Carregando lojas da categoria: ${categorySlug}`);
      
      const categoryStores = await getStoresByCategorySlug(categorySlug);
      
      // Formatar dados para o componente
      const formattedStores = categoryStores.map(store => ({
        id: store.id,
        name: store.name,
        image: store.coverImage || 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=400&fit=crop',
        logo: store.logo || 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop',
        rating: store.rating || 4.5,
        reviewCount: store.reviewCount || 0,
        distance: '2.1 km', // TODO: Calcular distância real
        deliveryTime: store.delivery?.deliveryTime || '25-35 min',
        deliveryFee: `R$ ${store.delivery?.deliveryFee?.toFixed(2) || '3,99'}`,
        category: store.category || categoryName,
        isFavorite: false,
        isSponsored: false,
      }));

      setStores(formattedStores);

      // Montar estrutura de dados da tela
      const newScreenData: ShelfItem[] = [];

      // Se houver lojas patrocinadas (pode ser implementado depois)
      const sponsoredStores = formattedStores.filter(s => s.isSponsored);
      if (sponsoredStores.length > 0) {
        newScreenData.push({
          type: 'sponsored_stores_carousel',
          title: 'Lojas em Destaque',
          data: sponsoredStores,
        });
      }

      // Título da seção de todas as lojas
      newScreenData.push({
        type: 'section_title',
        title: `Todas as lojas de ${categoryName}`,
      });

      // Lista de lojas
      formattedStores.forEach(store => {
        newScreenData.push({
          type: 'store_list_item',
          data: store,
        });
      });

      setScreenData(newScreenData);
      console.log(`✅ ${formattedStores.length} lojas carregadas`);
    } catch (error) {
      console.error('❌ Erro ao carregar lojas:', error);
      // Em caso de erro, usar dados mockados como fallback
      setScreenData(getCategoryScreenData(categoryId));
    } finally {
      setLoading(false);
    }
  };

  // Filtrar lojas pela busca
  const getFilteredStores = useCallback(() => {
    if (!searchQuery.trim()) {
      return stores;
    }
    
    const query = searchQuery.toLowerCase();
    return stores.filter(store => 
      store.name.toLowerCase().includes(query) ||
      store.description?.toLowerCase().includes(query) ||
      store.category?.toLowerCase().includes(query)
    );
  }, [stores, searchQuery]);

  const handleCategoryPress = useCallback((newCategoryId: string) => {
    setActiveCategory(newCategoryId);
  }, []);

  const handleRestaurantPress = useCallback((restaurant: any) => {
    console.log('Restaurant pressed:', restaurant);
    // Navegar para a tela do restaurante
    navigation.navigate('Store', {
      storeId: restaurant.id,
    });
  }, [navigation]);

  const handleFavoritePress = useCallback((restaurant: any) => {
    console.log('Favorite pressed:', restaurant);
    // Aqui você pode implementar a lógica de favoritos
  }, []);

  const handleSubCategoryPress = useCallback((subCategory: any) => {
    console.log('SubCategory pressed:', subCategory);
    // Navegar para a loja que tem essa subcategoria
    if (subCategory.storeId) {
      navigation.navigate('Store', {
        storeId: subCategory.storeId,
      });
    }
  }, [navigation]);

  const handleDishPress = useCallback((dish: any) => {
    console.log('Dish pressed:', dish);
    // Navegar para a loja do produto
    if (dish.storeId) {
      navigation.navigate('Store', {
        storeId: dish.storeId,
      });
    }
  }, [navigation]);

  const handleBannerPress = useCallback((banner: any) => {
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
      console.log('Navegar para produto:', banner.linkTarget);
    } else if (banner.linkType === 'external' && banner.link) {
      console.log('Abrir link externo:', banner.link);
    }
  }, [navigation]);

  const handleSeeMorePress = useCallback(() => {
    console.log('See more pressed');
    // Aqui você pode navegar para ver mais itens
  }, []);

  const renderScreenItem = ({ item }: { item: ShelfItem }) => {
    switch (item.type) {
      case 'sub_category_carousel':
        return (
          <SubCategoryCarousel 
            data={item.data} 
            onSubCategoryPress={handleSubCategoryPress}
          />
        );

      case 'promo_banner_carousel':
        return (
          <ContentCarousel
            title="Promoções"
            data={item.data}
            renderCard={(banner) => (
              <PromoBannerCard 
                banner={banner} 
                onPress={handleBannerPress}
              />
            )}
            onSeeMorePress={handleSeeMorePress}
            showSeeMore={false}
          />
        );

      case 'discounted_dishes_carousel':
        return (
          <ContentCarousel
            title={item.title || 'Pratos com Desconto'}
            data={item.data}
            renderCard={(dish) => (
              <DiscountedDishCard 
                dish={dish} 
                onPress={handleDishPress}
              />
            )}
            onSeeMorePress={handleSeeMorePress}
          />
        );

      case 'sponsored_stores_carousel':
        return (
          <ContentCarousel
            title={item.title || 'Lojas Patrocinadas'}
            data={item.data}
            renderCard={(restaurant) => (
              <RestaurantCard 
                restaurant={restaurant} 
                onPress={handleRestaurantPress}
                onFavoritePress={handleFavoritePress}
              />
            )}
            onSeeMorePress={handleSeeMorePress}
          />
        );

      case 'section_title':
        return (
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
          </View>
        );

      case 'store_list_item':
        return (
          <RestaurantListItem
            restaurant={item.data}
            onPressRestaurant={handleRestaurantPress}
            onToggleFavorite={handleFavoritePress}
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <CategoryHeader 
          categoryName={categoryName}
          onSearchChange={(text) => console.log('Search:', text)}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA1D2C" />
          <Text style={styles.loadingText}>Carregando lojas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <CategoryHeader 
        categoryName={categoryName}
        onSearchChange={(text) => setSearchQuery(text)}
      />
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Filtro de Categorias */}
        <CategoryFilterCarousel
          categories={categories.length > 0 ? categories : mockCategories}
          activeCategory={activeCategory}
          onCategoryPress={handleCategoryPress}
        />

        {/* Subcategorias */}
        {subcategories.length > 0 && (
          <SubCategoryCarousel
            data={subcategories}
            onSubCategoryPress={handleSubCategoryPress}
          />
        )}

        {/* Banner Promocional Grande */}
        {categoryBanners.length > 0 && (
          <ResponsiveBanner
            imageUrl={categoryBanners[0].imageUrl}
            videoUrl={categoryBanners[0].videoUrl}
            title={categoryBanners[0].title}
            backgroundColor={categoryBanners[0].backgroundColor}
            onPress={() => handleBannerPress(categoryBanners[0])}
            marginHorizontal={16}
            marginVertical={16}
          />
        )}

        {/* Últimas Lojas */}
        {stores.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Últimas Lojas</Text>
              <Text style={styles.seeMore}>Ver mais</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {stores.slice(0, 3).map((store) => (
                <RestaurantCard
                  key={store.id}
                  restaurant={store}
                  onPress={handleRestaurantPress}
                  onFavoritePress={handleFavoritePress}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Desconto até 35% OFF */}
        {discountedDishes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionTitle}>Desconto até 50% OFF</Text>
                <Text style={styles.sectionSubtitle}>Pratos incríveis com até 50% de desconto</Text>
              </View>
              <Text style={styles.seeMore}>Ver mais</Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {discountedDishes.map((dish) => (
                <DiscountedDishCard
                  key={dish.id}
                  dish={dish}
                  onPress={handleDishPress}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Lista Completa de Lojas */}
        <View style={styles.storesListSection}>
          <Text style={styles.storesListTitle}>
            Lojas
            {searchQuery && ` (${getFilteredStores().length})`}
          </Text>
          
          {stores.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma loja encontrada nesta categoria</Text>
              <Text style={styles.emptySubtext}>Tente outra categoria ou volte mais tarde</Text>
            </View>
          ) : getFilteredStores().length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Nenhuma loja encontrada</Text>
              <Text style={styles.emptySubtext}>Tente outro termo de busca</Text>
            </View>
          ) : (
            getFilteredStores().map((store) => (
              <RestaurantListItem
                key={store.id}
                restaurant={store}
                onPressRestaurant={handleRestaurantPress}
                onToggleFavorite={handleFavoritePress}
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },

  // Seções
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  seeMore: {
    fontSize: 14,
    fontWeight: '600',
    color: '#EA1D2C',
  },
  horizontalScrollContent: {
    paddingHorizontal: 16,
  },

  // Lista de Lojas
  storesListSection: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  storesListTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },

  // Empty State
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default CategoryScreen;