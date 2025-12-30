import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  Alert,
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
  selectSelectedCategory,
  setSelectedCategory,
  addItem,
  removeItem,
  updateAmountLeft,
  consumeItem,
} from '../../../store/slices/fridgeSlice';
import { selectProfile } from '../../../store/slices/userSlice';

const Home = () => {
  const dispatch = useDispatch();
  const items = useSelector(selectFilteredItems);
  const expiringItems = useSelector(selectExpiringItems);
  const selectedCategory = useSelector(selectSelectedCategory);
  const profile = useSelector(selectProfile);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item =>
      item.name.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);
  
  const stats = useMemo(() => ({
    total: items.length,
    expiringSoon: expiringItems.length,
    lowStock: items.filter(i => i.amountLeft < 0.3).length,
  }), [items, expiringItems]);
  
  const handleAddItem = (newItem) => {
    dispatch(addItem(newItem));
  };
  
  const handleRemoveItem = (id) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => dispatch(removeItem(id))
        },
      ]
    );
  };
  
  const handleUpdateAmount = (id, change) => {
    const item = items.find(i => i.id === id);
    if (item) {
      const newAmount = Math.max(0, Math.min(1, item.amountLeft + change));
      if (newAmount === 0) {
        handleRemoveItem(id);
      } else {
        dispatch(updateAmountLeft({ id, amountLeft: newAmount }));
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
        <TouchableOpacity style={styles.notificationBtn}>
          <Icon name="bell-outline" size={24} color={COLORS.text} />
          {stats.expiringSoon > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>{stats.expiringSoon}</Text>
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
        <View style={[styles.statCard, { backgroundColor: COLORS.primary + '15' }]}>
          <Icon name="fridge-outline" size={28} color={COLORS.primary} />
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Items</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.warning + '15' }]}>
          <Icon name="clock-alert-outline" size={28} color={COLORS.warning} />
          <Text style={styles.statValue}>{stats.expiringSoon}</Text>
          <Text style={styles.statLabel}>Expiring Soon</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: COLORS.danger + '15' }]}>
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
            {expiringItems.slice(0, 5).map((item) => (
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
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      />
      
      {/* Items List Header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {selectedCategory === 'all' ? 'All Items' : CATEGORIES.find(c => c.id === selectedCategory)?.name}
        </Text>
        <Text style={styles.itemCount}>{filteredItems.length} items</Text>
      </View>
      
      {/* Items List */}
      <ScrollView 
        style={styles.itemsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.itemsContent}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="fridge-outline" size={64} color={COLORS.textLight} />
            <Text style={styles.emptyTitle}>No items found</Text>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Try a different search' : 'Add some items to your fridge!'}
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <FridgeItemCard
              key={item.id}
              item={item}
              onPress={() => handleRemoveItem(item.id)}
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
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.background,
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
    marginVertical: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    maxHeight: 110,
  },
  statsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  statCard: {
    width: 110,
    padding: 14,
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
    marginTop: 2,
  },
  alertContainer: {
    marginHorizontal: 20,
    marginTop: 16,
    padding: 14,
    backgroundColor: COLORS.warning + '10',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.warning + '30',
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.warning,
  },
  categoriesContainer: {
    maxHeight: 50,
    marginTop: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
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
});

export default Home;
