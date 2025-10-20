import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { HomeStackParamList } from '../types/navigation';
import { Ionicons } from '@expo/vector-icons';

import CategoryGridCard from '../components/CategoryGridCard';
import StoreListItem from '../components/StoreListItem';
import MenuItemListCard from '../components/MenuItemListCard';
import {
  searchAll,
  SearchFilters,
  SearchResults,
} from '../services/searchService';
import { Store, MenuItem } from '../types/shared';
import { subscribeToActiveCategories, Category } from '../services/categoryService';

type SearchScreenNavigationProp = StackNavigationProp<HomeStackParamList>;

// Cores padrão para categorias (serão aplicadas ciclicamente)
const CATEGORY_COLORS = [
  '#EA1D2C', // Vermelho principal
  '#0A5847', // Verde escuro
  '#FF9F24', // Laranja
  '#FF7B52', // Coral
  '#E21B5A', // Rosa forte
  '#D81F3D', // Vermelho escuro
  '#F5A3D0', // Rosa claro
  '#B91E3C', // Bordô
  '#1A1A1A', // Preto
  '#E67E22', // Laranja queimado
  '#D68910', // Dourado
  '#FF8C52', // Laranja claro
];

const SearchScreen: React.FC = () => {
  const navigation = useNavigation<SearchScreenNavigationProp>();

  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [results, setResults] = useState<SearchResults>({ stores: [], items: [] });
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>();
  const [categories, setCategories] = useState<Category[]>([]);

  // Carregar categorias do Firestore com listener em tempo real
  useEffect(() => {
    console.log('🔵 SearchScreen: Inscrevendo-se nas categorias em tempo real...');
    setLoadingCategories(true);
    
    const unsubscribe = subscribeToActiveCategories((loadedCategories) => {
      setCategories(loadedCategories);
      setLoadingCategories(false);
      console.log('✅ SearchScreen: Categorias atualizadas em tempo real:', loadedCategories.length);
    });

    // Cleanup: cancelar listener quando o componente desmontar
    return () => {
      console.log('🔵 SearchScreen: Cancelando listener de categorias');
      unsubscribe();
    };
  }, []);

  // Debounce para busca
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchText.trim().length >= 2) {
        performSearch();
      } else {
        setResults({ stores: [], items: [] });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchText]);

  const performSearch = async () => {
    try {
      setLoading(true);
      const searchResults = await searchAll(searchText, { category: selectedCategory });
      setResults(searchResults);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryPress = (category: Category) => {
    // Navegar para tela de categoria com os resultados filtrados
    console.log('🔵 SearchScreen: Navegando para categoria:', category.name);
    navigation.navigate('Category', { 
      categoryId: category.slug, 
      categoryName: category.name 
    });
  };

  const handleStorePress = (store: Store) => {
    navigation.navigate('Store', { storeId: store.id });
  };

  const handleMenuItemPress = (item: MenuItem) => {
    navigation.navigate('Product', {
      productId: item.id,
      product: item,
      store: { id: item.storeId },
    });
  };

  const renderSearchBar = () => (
    <View style={styles.searchBarContainer}>
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={20} color="#999" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="O que vai pedir hoje?"
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>
    </View>
  );

  const renderSearchResults = () => {
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA1D2C" />
          <Text style={styles.loadingText}>Buscando...</Text>
        </View>
      );
    }

    const hasResults = results.stores.length > 0 || results.items.length > 0;

    if (searchText.trim().length >= 2 && !hasResults) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>Nenhum resultado encontrado</Text>
          <Text style={styles.emptySubtitle}>
            Tente buscar por outro termo
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
        {results.stores.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Restaurantes ({results.stores.length})
            </Text>
            {results.stores.map((store) => (
              <StoreListItem
                key={store.id}
                store={store}
                onPress={() => handleStorePress(store)}
              />
            ))}
          </View>
        )}

        {results.items.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pratos ({results.items.length})</Text>
            {results.items.map((item) => (
              <MenuItemListCard
                key={item.id}
                item={item}
                onPress={() => handleMenuItemPress(item)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  const renderCategoriesGrid = () => {
    if (loadingCategories) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#EA1D2C" />
          <Text style={styles.loadingText}>Carregando categorias...</Text>
        </View>
      );
    }

    if (categories.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="apps-outline" size={64} color="#CCC" />
          <Text style={styles.emptyTitle}>Nenhuma categoria disponível</Text>
          <Text style={styles.emptySubtitle}>
            Aguarde enquanto novas categorias são cadastradas
          </Text>
        </View>
      );
    }

    return (
      <ScrollView 
        style={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.categorySection}>
          <Text style={styles.sectionTitle}>Todas as Categorias</Text>
          <View style={styles.gridContainer}>
            {categories.map((category, index) => (
              <CategoryGridCard
                key={category.id}
                title={category.name}
                subtitle={category.description}
                backgroundColor={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
                image={category.imageUrl ? { uri: category.imageUrl } : undefined}
                onPress={() => handleCategoryPress(category)}
              />
            ))}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    );
  };

  const showResults = searchText.trim().length >= 2;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {renderSearchBar()}
      {showResults ? renderSearchResults() : renderCategoriesGrid()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  categorySection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: 4, // Espaço extra para sombras não serem cortadas
  },
  bottomSpacing: {
    height: 40,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8, // Espaço extra para sombras não serem cortadas
    backgroundColor: '#F5F5F5',
  },
  section: {
    marginBottom: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default SearchScreen;