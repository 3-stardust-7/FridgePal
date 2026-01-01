import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, DIET_TYPES, HEALTH_GOALS } from '../../utils/constants';
import {
  selectProfile,
  selectPreferences,
  selectNotifications,
  selectStats,
  selectUserLoading,
  fetchProfile,
  updateProfileAsync,
  updatePreferencesAsync,
  updateNotificationsAsync,
  setDietType,
  setHealthGoal,
  toggleNotification,
  resetUser,
} from '../../../store/slices/userSliceAsync';
import { useAuth } from '../../hooks/useAuth';

const Profile = () => {
  const dispatch = useDispatch();
  const { signOut } = useAuth();
  const profile = useSelector(selectProfile);
  const preferences = useSelector(selectPreferences);
  const notifications = useSelector(selectNotifications);
  const stats = useSelector(selectStats);
  const loading = useSelector(selectUserLoading);

  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showDietPicker, setShowDietPicker] = useState(false);
  const [showGoalPicker, setShowGoalPicker] = useState(false);

  const [editName, setEditName] = useState(profile.name || '');
  const [editAge, setEditAge] = useState(String(profile.age || ''));
  const [editHeight, setEditHeight] = useState(String(profile.height || ''));
  const [editWeight, setEditWeight] = useState(String(profile.weight || ''));

  // Fetch profile on mount
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Update edit fields when profile changes
  useEffect(() => {
    setEditName(profile.name || '');
    setEditAge(String(profile.age || ''));
    setEditHeight(String(profile.height || ''));
    setEditWeight(String(profile.weight || ''));
  }, [profile]);

  const currentDiet = DIET_TYPES.find(d => d.id === preferences.dietType);
  const currentGoal = HEALTH_GOALS.find(g => g.id === preferences.healthGoal);

  const bmi =
    profile.weight && profile.height
      ? profile.weight / (profile.height / 100) ** 2
      : 0;
  const bmiStatus =
    bmi < 18.5
      ? 'Underweight'
      : bmi < 25
      ? 'Normal'
      : bmi < 30
      ? 'Overweight'
      : 'Obese';
  const bmiColor =
    bmi < 18.5
      ? COLORS.warning
      : bmi < 25
      ? COLORS.success
      : bmi < 30
      ? COLORS.warning
      : COLORS.danger;

  const handleSaveProfile = async () => {
    await dispatch(
      updateProfileAsync({
        name: editName,
        age: parseInt(editAge) || profile.age,
        height: parseInt(editHeight) || profile.height,
        weight: parseFloat(editWeight) || profile.weight,
      }),
    );
    setShowEditProfile(false);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          dispatch(resetUser());
        },
      },
    ]);
  };

  const SettingItem = ({
    icon,
    label,
    value,
    onPress,
    toggle,
    toggleValue,
    danger,
  }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      disabled={toggle}
    >
      <View style={[styles.settingIcon, danger && styles.settingIconDanger]}>
        <Icon
          name={icon}
          size={20}
          color={danger ? COLORS.danger : COLORS.primary}
        />
      </View>
      <View style={styles.settingContent}>
        <Text
          style={[styles.settingLabel, danger && styles.settingLabelDanger]}
        >
          {label}
        </Text>
        {value && <Text style={styles.settingValue}>{value}</Text>}
      </View>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onPress}
          trackColor={{ false: COLORS.border, true: COLORS.primaryLight }}
          thumbColor={toggleValue ? COLORS.primary : '#f4f3f4'}
        />
      ) : (
        <Icon name="chevron-right" size={24} color={COLORS.textLight} />
      )}
    </TouchableOpacity>
  );

  const StatCard = ({ icon, label, value, color }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Icon name={icon} size={22} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => setShowEditProfile(true)}
        >
          <Icon name="pencil" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {profile.name
                  .split(' ')
                  .map(n => n[0])
                  .join('')}
              </Text>
            </View>
            <TouchableOpacity style={styles.avatarEditBtn}>
              <Icon name="camera" size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{profile.name}</Text>
          <Text style={styles.profileEmail}>{profile.email}</Text>

          <View style={styles.profileStats}>
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatValue}>{profile.age}</Text>
              <Text style={styles.profileStatLabel}>Age</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatValue}>{profile.height}cm</Text>
              <Text style={styles.profileStatLabel}>Height</Text>
            </View>
            <View style={styles.profileStatDivider} />
            <View style={styles.profileStatItem}>
              <Text style={styles.profileStatValue}>{profile.weight}kg</Text>
              <Text style={styles.profileStatLabel}>Weight</Text>
            </View>
          </View>
        </View>

        {/* BMI Card */}
        <View style={styles.bmiCard}>
          <View style={styles.bmiHeader}>
            <Text style={styles.cardTitle}>Body Mass Index</Text>
            <View
              style={[styles.bmiBadge, { backgroundColor: bmiColor + '20' }]}
            >
              <Text style={[styles.bmiBadgeText, { color: bmiColor }]}>
                {bmiStatus}
              </Text>
            </View>
          </View>
          <View style={styles.bmiContent}>
            <Text style={[styles.bmiValue, { color: bmiColor }]}>
              {bmi.toFixed(1)}
            </Text>
            <View style={styles.bmiScale}>
              <View style={styles.bmiScaleBar}>
                <View
                  style={[
                    styles.bmiIndicator,
                    { left: `${Math.min(100, (bmi / 40) * 100)}%` },
                  ]}
                />
              </View>
              <View style={styles.bmiLabels}>
                <Text style={styles.bmiLabel}>15</Text>
                <Text style={styles.bmiLabel}>25</Text>
                <Text style={styles.bmiLabel}>40</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            icon="food-apple"
            label="Items Saved"
            value={stats.itemsSaved}
            color={COLORS.success}
          />
          <StatCard
            icon="chef-hat"
            label="Recipes Made"
            value={stats.recipesMade}
            color={COLORS.primary}
          />
          <StatCard
            icon="fire"
            label="Day Streak"
            value={stats.streak}
            color={COLORS.warning}
          />
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="food-variant"
              label="Diet Type"
              value={currentDiet?.name || 'Not set'}
              onPress={() => setShowDietPicker(true)}
            />
            <SettingItem
              icon="target"
              label="Health Goal"
              value={currentGoal?.name || 'Not set'}
              onPress={() => setShowGoalPicker(true)}
            />
            <SettingItem
              icon="allergy"
              label="Allergies"
              value={
                preferences.allergies.length > 0
                  ? `${preferences.allergies.length} items`
                  : 'None'
              }
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="bell-ring-outline"
              label="Expiry Reminders"
              toggle
              toggleValue={notifications.expiryReminders}
              onPress={() => dispatch(toggleNotification('expiryReminders'))}
            />
            <SettingItem
              icon="food"
              label="Recipe Suggestions"
              toggle
              toggleValue={notifications.recipeSuggestions}
              onPress={() => dispatch(toggleNotification('recipeSuggestions'))}
            />
            <SettingItem
              icon="cup-water"
              label="Water Reminders"
              toggle
              toggleValue={notifications.waterReminder}
              onPress={() => dispatch(toggleNotification('waterReminder'))}
            />
            <SettingItem
              icon="silverware-fork-knife"
              label="Meal Reminders"
              toggle
              toggleValue={notifications.mealReminder}
              onPress={() => dispatch(toggleNotification('mealReminder'))}
            />
          </View>
        </View>

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.settingsCard}>
            <SettingItem
              icon="shield-lock-outline"
              label="Privacy Settings"
              onPress={() => {}}
            />
            <SettingItem
              icon="help-circle-outline"
              label="Help & Support"
              onPress={() => {}}
            />
            <SettingItem
              icon="information-outline"
              label="About FridgePal"
              value="v1.0.0"
              onPress={() => {}}
            />
            <SettingItem
              icon="logout"
              label="Sign Out"
              danger
              onPress={handleSignOut}
            />
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditProfile}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditProfile(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowEditProfile(false)}>
                <Icon name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={styles.input}
                value={editName}
                onChangeText={setEditName}
                placeholder="Your name"
                placeholderTextColor={COLORS.textLight}
              />

              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                value={editAge}
                onChangeText={setEditAge}
                placeholder="Your age"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Height (cm)</Text>
              <TextInput
                style={styles.input}
                value={editHeight}
                onChangeText={setEditHeight}
                placeholder="Height in cm"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
              />

              <Text style={styles.inputLabel}>Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={editWeight}
                onChangeText={setEditWeight}
                placeholder="Weight in kg"
                placeholderTextColor={COLORS.textLight}
                keyboardType="numeric"
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowEditProfile(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveProfile}
              >
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Diet Type Picker */}
      <Modal
        visible={showDietPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDietPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Diet Type</Text>
              <TouchableOpacity onPress={() => setShowDietPicker(false)}>
                <Icon name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerContent}>
              {DIET_TYPES.map(diet => (
                <TouchableOpacity
                  key={diet.id}
                  style={[
                    styles.pickerOption,
                    preferences.dietType === diet.id &&
                      styles.pickerOptionActive,
                  ]}
                  onPress={() => {
                    dispatch(setDietType(diet.id));
                    dispatch(updatePreferencesAsync({ diet_type: diet.id }));
                    setShowDietPicker(false);
                  }}
                >
                  <Icon
                    name={diet.icon}
                    size={24}
                    color={
                      preferences.dietType === diet.id
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />
                  <View style={styles.pickerOptionText}>
                    <Text
                      style={[
                        styles.pickerOptionLabel,
                        preferences.dietType === diet.id &&
                          styles.pickerOptionLabelActive,
                      ]}
                    >
                      {diet.name}
                    </Text>
                    <Text style={styles.pickerOptionDesc}>
                      {diet.description}
                    </Text>
                  </View>
                  {preferences.dietType === diet.id && (
                    <Icon
                      name="check-circle"
                      size={24}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Health Goal Picker */}
      <Modal
        visible={showGoalPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowGoalPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.pickerContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Health Goal</Text>
              <TouchableOpacity onPress={() => setShowGoalPicker(false)}>
                <Icon name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerContent}>
              {HEALTH_GOALS.map(goal => (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.pickerOption,
                    preferences.healthGoal === goal.id &&
                      styles.pickerOptionActive,
                  ]}
                  onPress={() => {
                    dispatch(setHealthGoal(goal.id));
                    dispatch(updatePreferencesAsync({ health_goal: goal.id }));
                    setShowGoalPicker(false);
                  }}
                >
                  <Icon
                    name={goal.icon}
                    size={24}
                    color={
                      preferences.healthGoal === goal.id
                        ? COLORS.primary
                        : COLORS.textSecondary
                    }
                  />
                  <View style={styles.pickerOptionText}>
                    <Text
                      style={[
                        styles.pickerOptionLabel,
                        preferences.healthGoal === goal.id &&
                          styles.pickerOptionLabelActive,
                      ]}
                    >
                      {goal.name}
                    </Text>
                    <Text style={styles.pickerOptionDesc}>
                      {goal.description}
                    </Text>
                  </View>
                  {preferences.healthGoal === goal.id && (
                    <Icon
                      name="check-circle"
                      size={24}
                      color={COLORS.primary}
                    />
                  )}
                </TouchableOpacity>
              ))}
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
  editBtn: {
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
  // Profile Card
  profileCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.primary,
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.surface,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileEmail: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  profileStats: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    width: '100%',
    justifyContent: 'space-around',
  },
  profileStatItem: {
    alignItems: 'center',
  },
  profileStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  profileStatLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  profileStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  // BMI Card
  bmiCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  bmiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  bmiBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  bmiBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bmiContent: {
    alignItems: 'center',
  },
  bmiValue: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: 16,
  },
  bmiScale: {
    width: '100%',
  },
  bmiScaleBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
    flexDirection: 'row',
    overflow: 'hidden',
    position: 'relative',
  },
  bmiIndicator: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.text,
    top: -4,
    marginLeft: -8,
  },
  bmiLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  bmiLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  settingsCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingIconDanger: {
    backgroundColor: COLORS.danger + '20',
  },
  settingContent: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  settingLabelDanger: {
    color: COLORS.danger,
  },
  settingValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
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
    maxHeight: '80%',
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
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  // Picker Modal
  pickerContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  pickerContent: {
    padding: 10,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginVertical: 4,
    backgroundColor: COLORS.background,
  },
  pickerOptionActive: {
    backgroundColor: COLORS.primaryLight,
  },
  pickerOptionText: {
    flex: 1,
    marginLeft: 14,
  },
  pickerOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  pickerOptionLabelActive: {
    color: COLORS.primary,
  },
  pickerOptionDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});

export default Profile;
