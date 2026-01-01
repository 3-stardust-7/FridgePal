import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, CATEGORIES, DEFAULT_EXPIRY_DAYS } from '../utils/constants';

const AddItemModal = ({ visible, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('pieces');
  const [notes, setNotes] = useState('');
  const [expiryDays, setExpiryDays] = useState('7');

  const units = ['pieces', 'kg', 'g', 'L', 'ml', 'dozen', 'pack'];

  const handleAdd = () => {
    if (!name.trim()) return;

    const today = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(today.getDate() + parseInt(expiryDays));

    const newItem = {
      name: name.trim(),
      category,
      quantity: parseFloat(quantity) || 1,
      unit,
      notes,
      purchaseDate: today.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      image: getCategoryImage(category),
    };

    onAdd(newItem);
    resetForm();
    onClose();
  };

  const resetForm = () => {
    setName('');
    setCategory('other');
    setQuantity('');
    setUnit('pieces');
    setNotes('');
    setExpiryDays('7');
  };

  const getCategoryImage = cat => {
    const images = {
      dairy:
        'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=200&h=200&fit=crop',
      vegetables:
        'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=200&h=200&fit=crop',
      fruits:
        'https://images.unsplash.com/photo-1619566636858-adf3ef46400b?w=200&h=200&fit=crop',
      meat: 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200&h=200&fit=crop',
      beverages:
        'https://images.unsplash.com/photo-1534353473418-4cfa6c56fd38?w=200&h=200&fit=crop',
      condiments:
        'https://images.unsplash.com/photo-1472476443507-c7a5948772fc?w=200&h=200&fit=crop',
      frozen:
        'https://images.unsplash.com/photo-1584568694244-14fbdf83bd30?w=200&h=200&fit=crop',
      other:
        'https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=200&h=200&fit=crop',
    };
    return images[cat] || images.other;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Add New Item</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Icon name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Item Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Item Name *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Milk, Eggs, Chicken..."
                placeholderTextColor={COLORS.textLight}
              />
            </View>

            {/* Category */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Category</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.categoryScroll}
              >
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      category === cat.id && styles.categoryChipActive,
                    ]}
                    onPress={() => {
                      setCategory(cat.id);
                      setExpiryDays(
                        DEFAULT_EXPIRY_DAYS[cat.id]?.toString() || '7',
                      );
                    }}
                  >
                    <Icon
                      name={cat.icon}
                      size={18}
                      color={
                        category === cat.id ? '#FFF' : COLORS.textSecondary
                      }
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        category === cat.id && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Quantity & Unit */}
            <View style={styles.row}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="1"
                  placeholderTextColor={COLORS.textLight}
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
                <Text style={styles.label}>Unit</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.unitScroll}
                >
                  {units.map(u => (
                    <TouchableOpacity
                      key={u}
                      style={[
                        styles.unitChip,
                        unit === u && styles.unitChipActive,
                      ]}
                      onPress={() => setUnit(u)}
                    >
                      <Text
                        style={[
                          styles.unitChipText,
                          unit === u && styles.unitChipTextActive,
                        ]}
                      >
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>

            {/* Expiry Days */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Days until Expiry</Text>
              <View style={styles.expiryRow}>
                {['3', '5', '7', '14', '30'].map(days => (
                  <TouchableOpacity
                    key={days}
                    style={[
                      styles.expiryChip,
                      expiryDays === days && styles.expiryChipActive,
                    ]}
                    onPress={() => setExpiryDays(days)}
                  >
                    <Text
                      style={[
                        styles.expiryChipText,
                        expiryDays === days && styles.expiryChipTextActive,
                      ]}
                    >
                      {days}
                    </Text>
                  </TouchableOpacity>
                ))}
                <TextInput
                  style={[styles.input, styles.expiryInput]}
                  value={expiryDays}
                  onChangeText={setExpiryDays}
                  keyboardType="numeric"
                  placeholder="Custom"
                  placeholderTextColor={COLORS.textLight}
                />
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Any additional notes..."
                placeholderTextColor={COLORS.textLight}
                multiline
                numberOfLines={3}
              />
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, !name.trim() && styles.addBtnDisabled]}
              onPress={handleAdd}
              disabled={!name.trim()}
            >
              <Icon name="plus" size={20} color="#FFF" />
              <Text style={styles.addBtnText}>Add Item</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
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
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  categoryScroll: {
    flexDirection: 'row',
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
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
  unitScroll: {
    flexDirection: 'row',
  },
  unitChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginRight: 6,
  },
  unitChipActive: {
    backgroundColor: COLORS.primary,
  },
  unitChipText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  unitChipTextActive: {
    color: '#FFF',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expiryChip: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  expiryChipActive: {
    backgroundColor: COLORS.primary,
  },
  expiryChipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  expiryChipTextActive: {
    color: '#FFF',
  },
  expiryInput: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 10,
  },
  footer: {
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
    flexDirection: 'row',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addBtnDisabled: {
    opacity: 0.5,
  },
  addBtnText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
});

export default AddItemModal;
