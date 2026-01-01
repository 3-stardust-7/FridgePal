import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useSelector, useDispatch } from 'react-redux';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, CATEGORIES } from '../../utils/constants';
import { getGreeting, getDaysUntilExpiry } from '../../utils/helpers';
import FridgeItemCard from '../../components/FridgeItemCard';
import AddItemModal from '../../components/AddItemModal';
import {
  selectFilteredItems,
  selectExpiringItems,
  setSelectedCategory,
  fetchFridgeItems,
  addFridgeItem,
  deleteFridgeItem,
  updateItemAmount,
} from '../../../store/slices/fridgeSliceAsync';
import {
  selectProfile,
  fetchProfile,
} from '../../../store/slices/userSliceAsync';

const Home = () => {
  const dispatch = useDispatch();
  const { items, selectedCategory, loading, error } = useSelector(
    state => state.fridge,
  );
  const filteredItemsFromSelector = useSelector(selectFilteredItems);
  const expiringItems = useSelector(selectExpiringItems);
  const profile = useSelector(selectProfile);

  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchFridgeItems());
    dispatch(fetchProfile());
  }, [dispatch]);

  // Handle pull to refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchFridgeItems());
    setRefreshing(false);
  };

  const filteredItems = useMemo(() => {
    if (!searchQuery) return filteredItemsFromSelector;
    const query = searchQuery.toLowerCase();
    return filteredItemsFromSelector.filter(
      item =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query),
    );
  }, [filteredItemsFromSelector, searchQuery]);

  const stats = useMemo(
    () => ({
      total: items.length,
      expiringSoon: expiringItems.length,
      lowStock: items.filter(i => i.amountLeft < 0.3).length,
    }),
    [items, expiringItems],
  );

  const handleAddItem = async newItem => {
    console.log('Adding item:', newItem);
    try {
      const result = await dispatch(
        addFridgeItem({
          name: newItem.name,
          category: newItem.category,
          expiryDate: newItem.expiryDate,
          amountLeft: (newItem.amountLeft || 1) * 100, // Convert to percentage (0-100)
          quantity: newItem.quantity || 1,
          unit: newItem.unit || 'item',
          notes: newItem.notes || '',
        }),
      );
      console.log('Add result:', result);
      if (result.error) {
        Alert.alert('Error', result.payload || 'Failed to add item');
      }
    } catch (err) {
      console.error('Add item error:', err);
      Alert.alert('Error', err.message || 'Failed to add item');
    }
  };

  const handleRemoveItem = id => {
    Alert.alert('Remove Item', 'Are you sure you want to remove this item?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => dispatch(deleteFridgeItem(id)),
      },
    ]);
  };

  const handleUpdateAmount = (id, change) => {
    const item = items.find(i => i.id === id);
    if (item) {
      const newAmount = Math.max(0, Math.min(1, item.amountLeft + change));
      if (newAmount === 0) {
        handleRemoveItem(id);
      } else {
        // Convert to percentage (0-100) for the database
        dispatch(updateItemAmount({ id, amountLeft: newAmount * 100 }));
      }
    }
  };

  const renderCategoryItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryChip,
        selectedCategory === item.id && styles.categoryChipActive,
      ]}
      onPress={() => dispatch(setSelectedCategory(item.id))}
    >
      <Icon
        name={item.icon}
        size={18}
        color={selectedCategory === item.id ? '#FFF' : COLORS.textSecondary}
      />
      <Text
        style={[
          styles.categoryChipText,
          selectedCategory === item.id && styles.categoryChipTextActive,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.userName}>{profile.name} 👋</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={() => setShowNotifications(true)}
        >
          <Icon name="bell-outline" size={24} color={COLORS.text} />
          {stats.expiringSoon > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {stats.expiringSoon}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={22} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search your fridge..."
          placeholderTextColor={COLORS.textLight}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="close-circle" size={20} color={COLORS.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Stats Cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
        contentContainerStyle={styles.statsContent}
      >
        <View
          style={[styles.statCard, { backgroundColor: COLORS.primary + '15' }]}
        >
          <Icon name="fridge-outline" size={28} color={COLORS.primary} />
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View
          style={[styles.statCard, { backgroundColor: COLORS.warning + '15' }]}
        >
          <Icon name="clock-alert-outline" size={28} color={COLORS.warning} />
          <Text style={styles.statValue}>{stats.expiringSoon}</Text>
          <Text style={styles.statLabel}>Expiring Soon</Text>
        </View>
        <View
          style={[styles.statCard, { backgroundColor: COLORS.danger + '15' }]}
        >
          <Icon name="alert-circle-outline" size={28} color={COLORS.danger} />
          <Text style={styles.statValue}>{stats.lowStock}</Text>
          <Text style={styles.statLabel}>Low Stock</Text>
        </View>
      </ScrollView>

      {/* Expiring Soon Alert */}
      {expiringItems.length > 0 && (
        <View style={styles.alertContainer}>
          <View style={styles.alertHeader}>
            <Icon name="alert" size={20} color={COLORS.warning} />
            <Text style={styles.alertTitle}>Use these soon!</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {expiringItems.map(item => (
              <FridgeItemCard
                key={item.id}
                item={item}
                compact
                onPress={() => {}}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Categories */}
      <FlatList
        data={CATEGORIES}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      />

      {/* Items List Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === 'all'
            ? 'All Items'
            : CATEGORIES.find(c => c.id === selectedCategory)?.name}
        </Text>
        <Text style={styles.itemCount}>{filteredItems.length} items</Text>
      </View>

      {/* Items List */}
      <ScrollView
        style={styles.itemsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.itemsContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {loading && items.length === 0 ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading your fridge...</Text>
          </View>
        ) : filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="fridge-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptyText}>
              {searchQuery
                ? 'Try a different search'
                : 'Add some items to your fridge!'}
            </Text>
          </View>
        ) : (
          filteredItems.map(item => (
            <FridgeItemCard
              key={item.id}
              item={item}
              onDelete={handleRemoveItem}
              onUpdateAmount={handleUpdateAmount}
            />
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAddModal(true)}
      >
        <Icon name="plus" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Add Item Modal */}
      <AddItemModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddItem}
      />

      {/* Notifications Modal */}
      <Modal
        visible={showNotifications}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowNotifications(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.notificationModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                <Icon name="bell-outline" size={22} color={COLORS.warning} />{' '}
                Expiring Soon
              </Text>
              <TouchableOpacity onPress={() => setShowNotifications(false)}>
                <Icon name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.notificationList}>
              {expiringItems.length === 0 ? (
                <View style={styles.emptyNotification}>
                  <Icon
                    name="check-circle-outline"
                    size={48}
                    color={COLORS.success}
                  />
                  <Text style={styles.emptyNotificationTitle}>All good!</Text>
                  <Text style={styles.emptyNotificationText}>
                    No items expiring soon
                  </Text>
                </View>
              ) : (
                expiringItems.map(item => {
                  const daysLeft = getDaysUntilExpiry(item.expiryDate);
                  return (
                    <View key={item.id} style={styles.notificationItem}>
                      <View
                        style={[
                          styles.notificationIcon,
                          {
                            backgroundColor:
                              daysLeft <= 1
                                ? COLORS.danger + '20'
                                : COLORS.warning + '20',
                          },
                        ]}
                      >
                        <Icon
                          name={
                            daysLeft <= 1
                              ? 'alert-circle'
                              : 'clock-alert-outline'
                          }
                          size={24}
                          color={daysLeft <= 1 ? COLORS.danger : COLORS.warning}
                        />
                      </View>
                      <View style={styles.notificationContent}>
                        <Text style={styles.notificationItemName}>
                          {item.name}
                        </Text>
                        <Text
                          style={[
                            styles.notificationItemExpiry,
                            {
                              color:
                                daysLeft <= 1 ? COLORS.danger : COLORS.warning,
                            },
                          ]}
                        >
                          {daysLeft <= 0
                            ? 'Expired!'
                            : daysLeft === 1
                            ? 'Expires tomorrow!'
                            : `Expires in ${daysLeft} days`}
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.notificationAction}
                        onPress={() => {
                          setShowNotifications(false);
                          handleRemoveItem(item.id);
                        }}
                      >
                        <Icon
                          name="delete-outline"
                          size={20}
                          color={COLORS.danger}
                        />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
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
    paddingTop: 40,
    paddingBottom: 10,
    backgroundColor: '#E8F5E9',
  },
  greeting: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: COLORS.danger,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '700',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    marginHorizontal: 20,
    marginVertical: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
    color: COLORS.text,
  },
  statsContainer: {
    maxHeight: 100,
  },
  statsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    width: 110,
    padding: 10,
    borderRadius: 16,
    alignItems: 'center',
    marginRight: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  alertContainer: {
    marginHorizontal: 20,
    marginTop: 10,
    padding: 10,
    backgroundColor: COLORS.warning + '10',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.warning,
  },
  categoriesContainer: {
    maxHeight: 35,
    marginTop: 10,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 2,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 2,
    gap: 6,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
  },
  categoryChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  categoryChipTextActive: {
    color: '#FFF',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemCount: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  itemsList: {
    flex: 1,
  },
  itemsContent: {
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
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
  // Notification Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  notificationModal: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
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
  notificationList: {
    padding: 8,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    marginBottom: 10,
  },
  notificationIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  notificationContent: {
    flex: 1,
  },
  notificationItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  notificationItemExpiry: {
    fontSize: 13,
    marginTop: 1,
  },
  notificationAction: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.danger + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyNotification: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyNotificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 12,
  },
  emptyNotificationText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});

export default Home;
