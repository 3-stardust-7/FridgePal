import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../../utils/constants';
import RecipeCard from '../../components/RecipeCard';
import {
  selectFilteredRecipes,
  selectSavedRecipes,
  selectTopMatches,
  selectAiRecipes,
  selectAiLoading,
  selectAiError,
  fetchRecipes,
  fetchMatchingRecipes,
  fetchSavedRecipes,
  saveRecipeAsync,
  unsaveRecipeAsync,
  generateAiRecipes,
  clearAiRecipes,
} from '../../../store/slices/recipeSliceAsync';
import { selectAllItems } from '../../../store/slices/fridgeSliceAsync';
import { logMealFromRecipeAsync } from '../../../store/slices/nutritionSliceAsync';

const RECIPE_TAGS = [
  'breakfast',
  'lunch',
  'dinner',
  'snack',
  'quick',
  'healthy',
  'high-protein',
  'low-carb',
  'vegetarian',
  'vegan',
];

const SORT_OPTIONS = [
  { id: 'match', label: 'Best Match', icon: 'star' },
  { id: 'time', label: 'Quickest', icon: 'clock-fast' },
  { id: 'calories', label: 'Low Cal', icon: 'fire' },
];

const Recipe = () => {
  const dispatch = useDispatch();
  const { recipes, savedRecipeIds, loading, error } = useSelector(
    state => state.recipes,
  );
  const topMatches = useSelector(selectTopMatches);
  const fridgeItems = useSelector(selectAllItems);
  const aiRecipes = useSelector(selectAiRecipes);
  const aiLoading = useSelector(selectAiLoading);
  const aiError = useSelector(selectAiError);

  const [searchQuery, setLocalSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setLocalSortBy] = useState('match');
  const [showRecipeDetail, setShowRecipeDetail] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAiSection, setShowAiSection] = useState(true);
  const [aiMealType, setAiMealType] = useState(null);

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchRecipes());
    dispatch(fetchSavedRecipes());
  }, [dispatch]);

  // Fetch matching recipes when fridge items change
  useEffect(() => {
    if (fridgeItems.length > 0) {
      dispatch(fetchMatchingRecipes());
    }
  }, [dispatch, fridgeItems]);

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchRecipes()),
      dispatch(fetchMatchingRecipes()),
    ]);
    setRefreshing(false);
  };

  // Generate AI recipes based on fridge items
  const handleGenerateAiRecipes = useCallback(
    (mealType = null) => {
      if (fridgeItems.length === 0) {
        Alert.alert(
          'No Items in Fridge',
          'Please add some items to your fridge first to get AI recipe suggestions.',
          [{ text: 'OK' }],
        );
        return;
      }

      setAiMealType(mealType);
      dispatch(
        generateAiRecipes({
          fridgeItems,
          options: {
            numberOfRecipes: 5,
            mealType,
            dietaryPreferences: [],
          },
        }),
      );
    },
    [dispatch, fridgeItems],
  );

  // Auto-generate AI recipes when fridge items are available
  useEffect(() => {
    if (fridgeItems.length > 0 && aiRecipes.length === 0 && !aiLoading) {
      // Delay to avoid too many initial requests
      const timer = setTimeout(() => {
        handleGenerateAiRecipes();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [fridgeItems.length]);

  const filteredRecipes = useMemo(() => {
    let filtered = recipes;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        r =>
          r.name.toLowerCase().includes(query) ||
          r.description.toLowerCase().includes(query) ||
          r.ingredients.some(i => i.toLowerCase().includes(query)),
      );
    }

    if (selectedTags.length > 0) {
      filtered = filtered.filter(r =>
        selectedTags.some(tag => r.tags.includes(tag)),
      );
    }

    switch (sortBy) {
      case 'match':
        filtered = [...filtered].sort(
          (a, b) => (b.matchPercentage || 0) - (a.matchPercentage || 0),
        );
        break;
      case 'time':
        filtered = [...filtered].sort(
          (a, b) => a.prepTime + a.cookTime - (b.prepTime + b.cookTime),
        );
        break;
      case 'calories':
        filtered = [...filtered].sort((a, b) => a.calories - b.calories);
        break;
    }

    return filtered;
  }, [recipes, searchQuery, selectedTags, sortBy]);

  const handleSaveRecipe = recipeId => {
    if (savedRecipeIds.includes(recipeId)) {
      dispatch(unsaveRecipeAsync(recipeId));
    } else {
      dispatch(saveRecipeAsync(recipeId));
    }
  };

  const handleToggleTag = tag => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleLogMeal = (recipe, mealType) => {
    dispatch(logMealFromRecipeAsync({ recipe, mealType, servings: 1 }));
    setShowRecipeDetail(null);
  };

  const RecipeDetailModal = ({ recipe, visible, onClose }) => {
    if (!recipe) return null;

    const isSaved = savedRecipeIds.includes(recipe.id);

    // Helper to get ingredient name string from either string or object format
    const getIngredientName = ing => {
      if (typeof ing === 'string') return ing;
      if (typeof ing === 'object' && ing !== null) {
        // Handle {name, unit, amount} format from AI
        const { name, amount, unit } = ing;
        if (amount && unit) return `${amount} ${unit} ${name}`;
        if (amount) return `${amount} ${name}`;
        return name || '';
      }
      return '';
    };

    const matchedIngredients = (recipe.ingredients || []).filter(ing => {
      // Handle both string ingredients and object ingredients
      const ingName = typeof ing === 'string' ? ing : ing?.name || '';
      if (!ingName) return false;
      return fridgeItems.some(
        item =>
          item.name?.toLowerCase().includes(ingName.toLowerCase()) ||
          ingName.toLowerCase().includes(item.name?.toLowerCase() || ''),
      );
    });

    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Hero Image */}
            <View style={styles.heroContainer}>
              <Image source={{ uri: recipe.image }} style={styles.heroImage} />
              <View style={styles.heroOverlay}>
                <TouchableOpacity style={styles.backBtn} onPress={onClose}>
                  <Icon name="arrow-left" size={24} color="#FFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.heroSaveBtn}
                  onPress={() => handleSaveRecipe(recipe.id)}
                >
                  <Icon
                    name={isSaved ? 'heart' : 'heart-outline'}
                    size={24}
                    color={isSaved ? COLORS.danger : '#FFF'}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.matchBadgeLarge}>
                <Icon name="check-circle" size={20} color="#FFF" />
                <Text style={styles.matchTextLarge}>
                  {recipe.matchPercentage}% Match
                </Text>
              </View>
            </View>

            {/* Content */}
            <View style={styles.modalContent}>
              <Text style={styles.recipeTitle}>{recipe.name}</Text>
              <Text style={styles.recipeDescription}>{recipe.description}</Text>

              {/* Meta Info */}
              <View style={styles.metaContainer}>
                <View style={styles.metaBox}>
                  <Icon name="clock-outline" size={22} color={COLORS.primary} />
                  <Text style={styles.metaValue}>
                    {recipe.prepTime + recipe.cookTime}
                  </Text>
                  <Text style={styles.metaLabel}>minutes</Text>
                </View>
                <View style={styles.metaBox}>
                  <Icon name="fire" size={22} color={COLORS.accent} />
                  <Text style={styles.metaValue}>{recipe.calories}</Text>
                  <Text style={styles.metaLabel}>calories</Text>
                </View>
                <View style={styles.metaBox}>
                  <Icon
                    name="account-group-outline"
                    size={22}
                    color={COLORS.secondary}
                  />
                  <Text style={styles.metaValue}>{recipe.servings}</Text>
                  <Text style={styles.metaLabel}>servings</Text>
                </View>
                <View style={styles.metaBox}>
                  <Icon
                    name="chef-hat"
                    size={22}
                    color={COLORS.textSecondary}
                  />
                  <Text style={styles.metaValue}>{recipe.difficulty}</Text>
                  <Text style={styles.metaLabel}>level</Text>
                </View>
              </View>

              {/* Nutrition */}
              <View style={styles.nutritionContainer}>
                <Text style={styles.sectionTitle}>Nutrition per serving</Text>
                <View style={styles.nutritionGrid}>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{recipe.protein}g</Text>
                    <Text style={styles.nutritionLabel}>Protein</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{recipe.carbs}g</Text>
                    <Text style={styles.nutritionLabel}>Carbs</Text>
                  </View>
                  <View style={styles.nutritionItem}>
                    <Text style={styles.nutritionValue}>{recipe.fat}g</Text>
                    <Text style={styles.nutritionLabel}>Fat</Text>
                  </View>
                </View>
              </View>

              {/* Ingredients */}
              <View style={styles.ingredientsContainer}>
                <Text style={styles.sectionTitle}>Ingredients</Text>
                <Text style={styles.ingredientNote}>
                  <Icon name="fridge" size={14} color={COLORS.secondary} />{' '}
                  {matchedIngredients.length} of {recipe.ingredients.length} in
                  your fridge
                </Text>
                {recipe.ingredients.map((ingredient, index) => {
                  const ingredientText = getIngredientName(ingredient);
                  const ingNameOnly =
                    typeof ingredient === 'string'
                      ? ingredient
                      : ingredient?.name || '';
                  const inFridge = matchedIngredients.some(mi => {
                    const miName = typeof mi === 'string' ? mi : mi?.name || '';
                    return miName.toLowerCase() === ingNameOnly.toLowerCase();
                  });
                  return (
                    <View key={index} style={styles.ingredientRow}>
                      <Icon
                        name={inFridge ? 'check-circle' : 'circle-outline'}
                        size={20}
                        color={inFridge ? COLORS.secondary : COLORS.textLight}
                      />
                      <Text
                        style={[
                          styles.ingredientText,
                          inFridge && styles.ingredientInFridge,
                        ]}
                      >
                        {ingredientText}
                      </Text>
                      {inFridge && (
                        <Text style={styles.inFridgeTag}>In fridge</Text>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Instructions */}
              <View style={styles.instructionsContainer}>
                <Text style={styles.sectionTitle}>Instructions</Text>
                {(recipe.instructions || []).map((step, index) => {
                  const stepText =
                    typeof step === 'string'
                      ? step
                      : step?.text || step?.instruction || JSON.stringify(step);
                  return (
                    <View key={index} style={styles.stepRow}>
                      <View style={styles.stepNumber}>
                        <Text style={styles.stepNumberText}>{index + 1}</Text>
                      </View>
                      <Text style={styles.stepText}>{stepText}</Text>
                    </View>
                  );
                })}
              </View>

              {/* Tags */}
              <View style={styles.tagsContainer}>
                {(recipe.tags || []).map((tag, index) => {
                  const tagText =
                    typeof tag === 'string' ? tag : tag?.name || '';
                  return (
                    <View key={index} style={styles.detailTag}>
                      <Text style={styles.detailTagText}>{tagText}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action */}
          <View style={styles.bottomAction}>
            <TouchableOpacity
              style={styles.logMealBtn}
              onPress={() => handleLogMeal(recipe, 'dinner')}
            >
              <Icon name="plus-circle-outline" size={22} color="#FFF" />
              <Text style={styles.logMealText}>Log this meal</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerSubtitle}>What can you make?</Text>
          <Text style={styles.headerTitle}>AI Recipes 🍳</Text>
        </View>
        <View style={styles.headerStats}>
          <Icon name="fridge-outline" size={20} color={COLORS.primary} />
          <Text style={styles.headerStatsText}>{fridgeItems.length} items</Text>
        </View>
      </View>

      {/* Search & Filter */}
      <View style={styles.searchRow}>
        <View style={styles.searchContainer}>
          <Icon name="magnify" size={22} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search recipes..."
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setLocalSearchQuery}
          />
        </View>
        <TouchableOpacity
          style={[styles.filterBtn, showFilters && styles.filterBtnActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Icon
            name="tune-variant"
            size={22}
            color={showFilters ? '#FFF' : COLORS.text}
          />
        </TouchableOpacity>
      </View>

      {/* Filters Panel */}
      {showFilters && (
        <View style={styles.filtersPanel}>
          {/* Sort Options */}
          <Text style={styles.filterLabel}>Sort by</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {SORT_OPTIONS.map(option => (
              <TouchableOpacity
                key={option.id}
                style={[
                  styles.sortChip,
                  sortBy === option.id && styles.sortChipActive,
                ]}
                onPress={() => setLocalSortBy(option.id)}
              >
                <Icon
                  name={option.icon}
                  size={16}
                  color={sortBy === option.id ? '#FFF' : COLORS.textSecondary}
                />
                <Text
                  style={[
                    styles.sortChipText,
                    sortBy === option.id && styles.sortChipTextActive,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Tags */}
          <Text style={[styles.filterLabel, { marginTop: 12 }]}>Filter by</Text>
          <View style={styles.tagsRow}>
            {RECIPE_TAGS.map(tag => (
              <TouchableOpacity
                key={tag}
                style={[
                  styles.tagChip,
                  selectedTags.includes(tag) && styles.tagChipActive,
                ]}
                onPress={() => handleToggleTag(tag)}
              >
                <Text
                  style={[
                    styles.tagChipText,
                    selectedTags.includes(tag) && styles.tagChipTextActive,
                  ]}
                >
                  {tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Matches Section */}
        {!searchQuery && selectedTags.length === 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🔥 Top Matches</Text>
              <Text style={styles.sectionSubtitle}>Based on your fridge</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {topMatches.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  compact
                  onPress={() => setShowRecipeDetail(recipe)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* AI Suggestions Banner */}
        <TouchableOpacity
          style={styles.aiBanner}
          onPress={() => handleGenerateAiRecipes()}
          disabled={aiLoading}
        >
          <View style={styles.aiIconContainer}>
            {aiLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <Icon name="robot-outline" size={32} color={COLORS.primary} />
            )}
          </View>
          <View style={styles.aiBannerContent}>
            <Text style={styles.aiBannerTitle}>
              {aiLoading
                ? 'Generating Recipes...'
                : '✨ AI-Powered Suggestions'}
            </Text>
            <Text style={styles.aiBannerText}>
              {aiLoading
                ? 'Analyzing your fridge items...'
                : 'Tap to generate recipes from your fridge items'}
            </Text>
          </View>
          <Icon
            name={aiLoading ? 'loading' : 'refresh'}
            size={24}
            color={COLORS.accent}
          />
        </TouchableOpacity>

        {/* AI Meal Type Quick Filters */}
        <View style={styles.aiQuickFilters}>
          {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
            <TouchableOpacity
              key={type}
              style={[
                styles.aiQuickFilterBtn,
                aiMealType === type && styles.aiQuickFilterBtnActive,
              ]}
              onPress={() => handleGenerateAiRecipes(type)}
              disabled={aiLoading}
            >
              <Icon
                name={
                  type === 'breakfast'
                    ? 'food-croissant'
                    : type === 'lunch'
                    ? 'food'
                    : type === 'dinner'
                    ? 'silverware-fork-knife'
                    : 'cookie'
                }
                size={16}
                color={aiMealType === type ? '#FFF' : COLORS.textSecondary}
              />
              <Text
                style={[
                  styles.aiQuickFilterText,
                  aiMealType === type && styles.aiQuickFilterTextActive,
                ]}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Error Message */}
        {aiError && (
          <View style={styles.aiErrorContainer}>
            <Icon name="alert-circle-outline" size={20} color={COLORS.danger} />
            <Text style={styles.aiErrorText}>{aiError}</Text>
            <TouchableOpacity
              onPress={() => handleGenerateAiRecipes(aiMealType)}
            >
              <Text style={styles.aiRetryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* AI Generated Recipes Section */}
        {aiRecipes.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.aiSectionTitleRow}>
                <Icon name="auto-fix" size={22} color={COLORS.accent} />
                <Text style={styles.sectionTitle}>AI Generated Recipes</Text>
              </View>
              <Text style={styles.sectionSubtitle}>
                {aiRecipes.length} recipes created from your{' '}
                {fridgeItems.length} fridge items
              </Text>
            </View>
            {aiRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={{
                  ...recipe,
                  isAiGenerated: true,
                }}
                isSaved={savedRecipeIds.includes(recipe.id)}
                onPress={() => setShowRecipeDetail(recipe)}
                onSave={handleSaveRecipe}
                showAiBadge
              />
            ))}
          </View>
        )}

        {/* All Recipes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Recipes</Text>
          <Text style={styles.resultCount}>
            {filteredRecipes.length} recipes found
          </Text>

          {filteredRecipes.map(recipe => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              isSaved={savedRecipeIds.includes(recipe.id)}
              onPress={() => setShowRecipeDetail(recipe)}
              onSave={handleSaveRecipe}
            />
          ))}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Recipe Detail Modal */}
      <RecipeDetailModal
        recipe={showRecipeDetail}
        visible={!!showRecipeDetail}
        onClose={() => setShowRecipeDetail(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: '#E8F5E9',
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  headerStatsText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '600',
  },
  searchRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 10,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    color: COLORS.text,
  },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1,
  },
  filterBtnActive: {
    backgroundColor: COLORS.primary,
  },
  filtersPanel: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  sortChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  sortChipActive: {
    backgroundColor: COLORS.primary,
  },
  sortChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  sortChipTextActive: {
    color: '#FFF',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagChipActive: {
    backgroundColor: COLORS.primary,
  },
  tagChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  tagChipTextActive: {
    color: '#FFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  resultCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + '20',
  },
  aiIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  aiBannerContent: {
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  aiBannerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  aiQuickFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  aiQuickFilterBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  aiQuickFilterBtnActive: {
    backgroundColor: COLORS.accent,
  },
  aiQuickFilterText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  aiQuickFilterTextActive: {
    color: '#FFF',
  },
  aiErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.danger + '15',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    gap: 8,
  },
  aiErrorText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.danger,
  },
  aiRetryText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  aiSectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  heroContainer: {
    height: 280,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 50,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroSaveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  matchBadgeLarge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  matchTextLarge: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  recipeTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  recipeDescription: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: 20,
  },
  metaContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  metaBox: {
    alignItems: 'center',
  },
  metaValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
  },
  metaLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  nutritionContainer: {
    marginBottom: 24,
  },
  nutritionGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 16,
    justifyContent: 'space-around',
    marginTop: 12,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  nutritionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  ingredientsContainer: {
    marginBottom: 24,
  },
  ingredientNote: {
    fontSize: 13,
    color: COLORS.secondary,
    marginTop: 4,
    marginBottom: 12,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: 12,
  },
  ingredientText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
  },
  ingredientInFridge: {
    color: COLORS.secondary,
    fontWeight: '500',
  },
  inFridgeTag: {
    fontSize: 11,
    color: COLORS.secondary,
    backgroundColor: COLORS.secondary + '15',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  instructionsContainer: {
    marginBottom: 24,
  },
  stepRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  detailTag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  detailTagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  bottomAction: {
    padding: 20,
    paddingBottom: 34,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  logMealBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  logMealText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Recipe;
