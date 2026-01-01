import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Platform,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Svg, { Circle } from 'react-native-svg';
import { COLORS, MEAL_TYPES } from '../../utils/constants';
import { NutritionProgress } from '../../components/ProgressComponents';
import {
  selectMealsByType,
  selectDailyProgress,
  selectRemainingCalories,
  setSelectedDate,
  fetchMealsGrouped,
  fetchWaterIntake,
  fetchDailyTotals,
  addMealAsync,
  deleteMealAsync,
  addWaterAsync,
} from '../../../store/slices/nutritionSliceAsync';
import { selectDailyGoals } from '../../../store/slices/userSliceAsync';

const CalTracker = () => {
  const dispatch = useDispatch();
  const { selectedDate, mealsByType, waterIntake, dailyTotals, loading } =
    useSelector(state => state.nutrition);
  const goals = useSelector(selectDailyGoals);
  const progress = useSelector(selectDailyProgress);
  const remainingCalories = useSelector(selectRemainingCalories);

  const [showAddMeal, setShowAddMeal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState('breakfast');
  const [mealName, setMealName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const caloriePercentage = Math.min(
    100,
    Math.round((dailyTotals.calories / goals.calories) * 100),
  );

  // Fetch data on mount and when date changes
  useEffect(() => {
    dispatch(fetchMealsGrouped(selectedDate));
    dispatch(fetchWaterIntake(selectedDate));
    dispatch(fetchDailyTotals(selectedDate));
  }, [dispatch, selectedDate]);

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      dispatch(fetchMealsGrouped(selectedDate)),
      dispatch(fetchWaterIntake(selectedDate)),
      dispatch(fetchDailyTotals(selectedDate)),
    ]);
    setRefreshing(false);
  };

  const getDateLabel = dateStr => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000)
      .toISOString()
      .split('T')[0];

    if (dateStr === today) return 'Today';
    if (dateStr === yesterday) return 'Yesterday';

    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleAddMeal = async () => {
    if (!mealName.trim() || !calories) return;

    await dispatch(
      addMealAsync({
        type: selectedMealType,
        name: mealName.trim(),
        calories: parseInt(calories) || 0,
        protein: parseInt(protein) || 0,
        carbs: parseInt(carbs) || 0,
        fat: parseInt(fat) || 0,
        fiber: 0,
        date: selectedDate,
      }),
    );

    resetMealForm();
    setShowAddMeal(false);
  };

  const resetMealForm = () => {
    setMealName('');
    setCalories('');
    setProtein('');
    setCarbs('');
    setFat('');
  };

  const handleDeleteMeal = mealId => {
    dispatch(deleteMealAsync(mealId));
  };

  const handleAddWater = amount => {
    dispatch(addWaterAsync({ amount, date: selectedDate }));
  };

  const waterGlasses = Math.floor(waterIntake / 250);
  const waterGoalGlasses = Math.floor(goals.water / 250);

  const MealSection = ({ type, meals, icon }) => {
    const mealTotal = meals.reduce((sum, m) => sum + m.calories, 0);

    return (
      <View style={styles.mealSection}>
        <View style={styles.mealSectionHeader}>
          <View style={styles.mealTitleRow}>
            <Icon name={icon} size={22} color={COLORS.primary} />
            <Text style={styles.mealSectionTitle}>{type}</Text>
          </View>
          <Text style={styles.mealSectionCalories}>{mealTotal} cal</Text>
        </View>

        {meals.length === 0 ? (
          <TouchableOpacity
            style={styles.addMealPrompt}
            onPress={() => {
              setSelectedMealType(type.toLowerCase());
              setShowAddMeal(true);
            }}
          >
            <Icon
              name="plus-circle-outline"
              size={20}
              color={COLORS.textLight}
            />
            <Text style={styles.addMealPromptText}>
              Add {type.toLowerCase()}
            </Text>
          </TouchableOpacity>
        ) : (
          <>
            {meals.map(meal => (
              <View key={meal.id} style={styles.mealItem}>
                <View style={styles.mealItemInfo}>
                  <Text style={styles.mealItemName}>{meal.name}</Text>
                  <Text style={styles.mealItemMacros}>
                    P: {meal.protein}g • C: {meal.carbs}g • F: {meal.fat}g
                  </Text>
                </View>
                <View style={styles.mealItemRight}>
                  <Text style={styles.mealItemCalories}>
                    {meal.calories} cal
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteMealBtn}
                    onPress={() => handleDeleteMeal(meal.id)}
                  >
                    <Icon name="close" size={16} color={COLORS.textLight} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addMoreBtn}
              onPress={() => {
                setSelectedMealType(type.toLowerCase());
                setShowAddMeal(true);
              }}
            >
              <Icon name="plus" size={18} color={COLORS.primary} />
              <Text style={styles.addMoreText}>Add more</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Nutrition</Text>
          <Text style={styles.headerDate}>{getDateLabel(selectedDate)}</Text>
        </View>
        <TouchableOpacity
          style={styles.calendarBtn}
          onPress={() => setShowDatePicker(true)}
        >
          <Icon name="calendar" size={24} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Calorie Ring */}
        <View style={styles.calorieCard}>
          <View style={styles.calorieRing}>
            <View style={styles.ringContainer}>
              {/* SVG Circular Progress */}
              <Svg width={160} height={160} style={styles.svgRing}>
                {/* Background Circle */}
                <Circle
                  cx={80}
                  cy={80}
                  r={70}
                  stroke={COLORS.border}
                  strokeWidth={14}
                  fill="none"
                />
                {/* Progress Circle */}
                <Circle
                  cx={80}
                  cy={80}
                  r={70}
                  stroke={
                    dailyTotals.calories > goals.calories
                      ? COLORS.danger
                      : COLORS.primary
                  }
                  strokeWidth={14}
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={2 * Math.PI * 70}
                  strokeDashoffset={
                    2 * Math.PI * 70 * (1 - caloriePercentage / 100)
                  }
                  transform="rotate(-90 80 80)"
                />
              </Svg>
              {/* Center Content */}
              <View style={styles.ringContent}>
                <Text style={styles.calorieValue}>{dailyTotals.calories}</Text>
                <Text style={styles.calorieLabel}>of {goals.calories}</Text>
                <Text style={styles.calorieUnit}>calories</Text>
              </View>
            </View>
          </View>

          <View style={styles.calorieStats}>
            <View style={styles.calorieStat}>
              <Icon
                name="silverware-fork-knife"
                size={20}
                color={COLORS.secondary}
              />
              <Text style={styles.calorieStatValue}>
                {dailyTotals.calories}
              </Text>
              <Text style={styles.calorieStatLabel}>Eaten</Text>
            </View>
            <View style={styles.calorieStatDivider} />
            <View style={styles.calorieStat}>
              <Icon name="target" size={20} color={COLORS.accent} />
              <Text style={styles.calorieStatValue}>{remainingCalories}</Text>
              <Text style={styles.calorieStatLabel}>Remaining</Text>
            </View>
          </View>
        </View>

        {/* Macros */}
        <View style={styles.macrosCard}>
          <Text style={styles.cardTitle}>Macronutrients</Text>
          <NutritionProgress
            label="Protein"
            current={dailyTotals.protein}
            goal={goals.protein}
            unit="g"
            color={COLORS.secondary}
            icon={<Icon name="food-steak" size={16} color={COLORS.secondary} />}
          />
          <NutritionProgress
            label="Carbs"
            current={dailyTotals.carbs}
            goal={goals.carbs}
            unit="g"
            color={COLORS.accent}
            icon={<Icon name="bread-slice" size={16} color={COLORS.accent} />}
          />
          <NutritionProgress
            label="Fat"
            current={dailyTotals.fat}
            goal={goals.fat}
            unit="g"
            color={COLORS.primary}
            icon={<Icon name="oil" size={16} color={COLORS.primary} />}
          />
          <NutritionProgress
            label="Fiber"
            current={dailyTotals.fiber}
            goal={goals.fiber}
            unit="g"
            color={COLORS.success}
            icon={<Icon name="leaf" size={16} color={COLORS.success} />}
          />
        </View>

        {/* Water Intake */}
        <View style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <Text style={styles.cardTitle}>💧 Water Intake</Text>
            <Text style={styles.waterProgress}>
              {waterIntake} / {goals.water} ml
            </Text>
          </View>

          <View style={styles.waterGlasses}>
            {Array.from({ length: waterGoalGlasses }).map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.waterGlass,
                  index < waterGlasses && styles.waterGlassFilled,
                ]}
                onPress={() => {
                  if (index >= waterGlasses) {
                    handleAddWater(250);
                  }
                }}
              >
                <Icon
                  name={index < waterGlasses ? 'cup' : 'cup-outline'}
                  size={24}
                  color={index < waterGlasses ? '#FFF' : COLORS.textLight}
                />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.waterButtons}>
            <TouchableOpacity
              style={styles.waterBtn}
              onPress={() => handleAddWater(250)}
            >
              <Text style={styles.waterBtnText}>+250ml</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.waterBtn}
              onPress={() => handleAddWater(500)}
            >
              <Text style={styles.waterBtnText}>+500ml</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Meals */}
        <View style={styles.mealsCard}>
          <Text style={styles.cardTitle}>Today's Meals</Text>
          <MealSection
            type="Breakfast"
            meals={mealsByType.breakfast}
            icon="weather-sunny"
          />
          <MealSection
            type="Lunch"
            meals={mealsByType.lunch}
            icon="white-balance-sunny"
          />
          <MealSection
            type="Dinner"
            meals={mealsByType.dinner}
            icon="weather-night"
          />
          <MealSection type="Snack" meals={mealsByType.snack} icon="cookie" />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity style={styles.fab} onPress={() => setShowAddMeal(true)}>
        <Icon name="plus" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Add Meal Modal */}
      <Modal
        visible={showAddMeal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddMeal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Meal</Text>
              <TouchableOpacity onPress={() => setShowAddMeal(false)}>
                <Icon name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Meal Type */}
              <Text style={styles.inputLabel}>Meal Type</Text>
              <View style={styles.mealTypeRow}>
                {MEAL_TYPES.map(type => (
                  <TouchableOpacity
                    key={type.id}
                    style={[
                      styles.mealTypeBtn,
                      selectedMealType === type.id && styles.mealTypeBtnActive,
                    ]}
                    onPress={() => setSelectedMealType(type.id)}
                  >
                    <Icon
                      name={type.icon}
                      size={18}
                      color={
                        selectedMealType === type.id
                          ? '#FFF'
                          : COLORS.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.mealTypeBtnText,
                        selectedMealType === type.id &&
                          styles.mealTypeBtnTextActive,
                      ]}
                    >
                      {type.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Meal Name */}
              <Text style={styles.inputLabel}>Meal Name *</Text>
              <TextInput
                style={styles.input}
                value={mealName}
                onChangeText={setMealName}
                placeholder="e.g., Grilled Chicken Salad"
                placeholderTextColor={COLORS.textLight}
              />

              {/* Calories */}
              <Text style={styles.inputLabel}>Calories *</Text>
              <TextInput
                style={styles.input}
                value={calories}
                onChangeText={setCalories}
                placeholder="0"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
              />

              {/* Macros Row */}
              <Text style={styles.inputLabel}>Macros (optional)</Text>
              <View style={styles.macrosRow}>
                <View style={styles.macroInput}>
                  <Text style={styles.macroLabel}>Protein</Text>
                  <TextInput
                    style={styles.input}
                    value={protein}
                    onChangeText={setProtein}
                    placeholder="0g"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.macroInput}>
                  <Text style={styles.macroLabel}>Carbs</Text>
                  <TextInput
                    style={styles.input}
                    value={carbs}
                    onChangeText={setCarbs}
                    placeholder="0g"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.macroInput}>
                  <Text style={styles.macroLabel}>Fat</Text>
                  <TextInput
                    style={styles.input}
                    value={fat}
                    onChangeText={setFat}
                    placeholder="0g"
                    placeholderTextColor={COLORS.textLight}
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowAddMeal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.addBtn,
                  (!mealName || !calories) && styles.addBtnDisabled,
                ]}
                onPress={handleAddMeal}
                disabled={!mealName || !calories}
              >
                <Text style={styles.addBtnText}>Add Meal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.datePickerModal}>
            <View style={styles.datePickerHeader}>
              <Text style={styles.datePickerTitle}>Select Date</Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Icon name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.datePickerContent}>
              {/* Quick Options */}
              <View style={styles.quickDateOptions}>
                <TouchableOpacity
                  style={[
                    styles.quickDateBtn,
                    selectedDate === new Date().toISOString().split('T')[0] &&
                      styles.quickDateBtnActive,
                  ]}
                  onPress={() => {
                    dispatch(
                      setSelectedDate(new Date().toISOString().split('T')[0]),
                    );
                    setShowDatePicker(false);
                  }}
                >
                  <Icon
                    name="calendar-today"
                    size={20}
                    color={
                      selectedDate === new Date().toISOString().split('T')[0]
                        ? '#FFF'
                        : COLORS.primary
                    }
                  />
                  <Text
                    style={[
                      styles.quickDateBtnText,
                      selectedDate === new Date().toISOString().split('T')[0] &&
                        styles.quickDateBtnTextActive,
                    ]}
                  >
                    Today
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.quickDateBtn,
                    selectedDate ===
                      new Date(Date.now() - 86400000)
                        .toISOString()
                        .split('T')[0] && styles.quickDateBtnActive,
                  ]}
                  onPress={() => {
                    dispatch(
                      setSelectedDate(
                        new Date(Date.now() - 86400000)
                          .toISOString()
                          .split('T')[0],
                      ),
                    );
                    setShowDatePicker(false);
                  }}
                >
                  <Icon
                    name="calendar-arrow-left"
                    size={20}
                    color={
                      selectedDate ===
                      new Date(Date.now() - 86400000)
                        .toISOString()
                        .split('T')[0]
                        ? '#FFF'
                        : COLORS.primary
                    }
                  />
                  <Text
                    style={[
                      styles.quickDateBtnText,
                      selectedDate ===
                        new Date(Date.now() - 86400000)
                          .toISOString()
                          .split('T')[0] && styles.quickDateBtnTextActive,
                    ]}
                  >
                    Yesterday
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Last 7 Days */}
              <Text style={styles.datePickerLabel}>Last 7 Days</Text>
              {[...Array(7)].map((_, i) => {
                const date = new Date(Date.now() - i * 86400000);
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                return (
                  <TouchableOpacity
                    key={dateStr}
                    style={[
                      styles.dateOption,
                      isSelected && styles.dateOptionActive,
                    ]}
                    onPress={() => {
                      dispatch(setSelectedDate(dateStr));
                      setShowDatePicker(false);
                    }}
                  >
                    <View style={styles.dateOptionLeft}>
                      <Text
                        style={[
                          styles.dateOptionDay,
                          isSelected && styles.dateOptionTextActive,
                        ]}
                      >
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </Text>
                      <Text
                        style={[
                          styles.dateOptionDate,
                          isSelected && styles.dateOptionTextActive,
                        ]}
                      >
                        {date.toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                    {isSelected && (
                      <Icon name="check-circle" size={22} color="#FFF" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  headerTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.text,
  },
  headerDate: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  calendarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  // Calorie Card
  calorieCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
  },
  calorieRing: {
    marginBottom: 20,
  },
  ringContainer: {
    width: 160,
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgRing: {
    position: 'absolute',
  },
  ringContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieValue: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.text,
  },
  calorieLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  calorieUnit: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  calorieStats: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  calorieStat: {
    alignItems: 'center',
  },
  calorieStatValue: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 6,
  },
  calorieStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  calorieStatDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  // Macros Card
  macrosCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  // Water Card
  waterCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  waterProgress: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  waterGlasses: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  waterGlass: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waterGlassFilled: {
    backgroundColor: '#3B82F6',
  },
  waterButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  waterBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  waterBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
  // Meals Card
  mealsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
  },
  mealSection: {
    marginBottom: 20,
  },
  mealSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mealSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  mealSectionCalories: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  addMealPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.border,
    gap: 8,
  },
  addMealPromptText: {
    fontSize: 14,
    color: COLORS.textLight,
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mealItemInfo: {
    flex: 1,
  },
  mealItemName: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
  },
  mealItemMacros: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  mealItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealItemCalories: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  deleteMealBtn: {
    padding: 4,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 4,
  },
  addMoreText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    bottom: 90,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalContent: {
    padding: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 16,
  },
  mealTypeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  mealTypeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    gap: 4,
  },
  mealTypeBtnActive: {
    backgroundColor: COLORS.primary,
  },
  mealTypeBtnText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  mealTypeBtnTextActive: {
    color: '#FFF',
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
  },
  macroInput: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    paddingBottom: 34,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  addBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  // Date Picker Styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  datePickerModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  datePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  datePickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  datePickerContent: {
    padding: 16,
  },
  quickDateOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickDateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
  },
  quickDateBtnActive: {
    backgroundColor: COLORS.primary,
  },
  quickDateBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.primary,
  },
  quickDateBtnTextActive: {
    color: '#FFF',
  },
  datePickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  dateOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    marginBottom: 8,
  },
  dateOptionActive: {
    backgroundColor: COLORS.primary,
  },
  dateOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dateOptionDay: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    width: 40,
  },
  dateOptionDate: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  dateOptionTextActive: {
    color: '#FFF',
  },
});

export default CalTracker;
