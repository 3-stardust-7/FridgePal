import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/constants';
import { getFreshnessStatus, formatDate } from '../utils/helpers';

const FridgeItemCard = ({
  item,
  onDelete,
  onUpdateAmount,
  compact = false,
}) => {
  const freshness = getFreshnessStatus(item.expiryDate);

  if (compact) {
    return (
      <View style={styles.compactCard}>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={1}>
            {item.name}
          </Text>
          <View
            style={[
              styles.freshnessTag,
              { backgroundColor: freshness.color + '20' },
            ]}
          >
            <Text style={[styles.freshnessText, { color: freshness.color }]}>
              {freshness.label}
            </Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.image }} style={styles.itemImage} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemQuantity}>
            {item.quantity} {item.unit}
          </Text>
          <View style={styles.categoryRow}>
            <Icon name="tag" size={12} color={COLORS.textSecondary} />
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
        <View style={styles.rightSection}>
          <View
            style={[
              styles.freshnessIndicator,
              { backgroundColor: freshness.color },
            ]}
          >
            <Icon
              name={freshness.status === 'expired' ? 'alert' : 'clock-outline'}
              size={14}
              color="#FFF"
            />
          </View>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete?.(item.id)}
          >
            <Icon name="trash-can-outline" size={18} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.progressSection}>
        {/* Amount Left */}
        <View style={styles.progressRow}>
          <View style={styles.progressLabelRow}>
            <Icon name="chart-pie" size={14} color={COLORS.textSecondary} />
            <Text style={styles.progressLabel}>Amount Left</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${item.amountLeft * 100}%`,
                    backgroundColor: COLORS.primary,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressValue}>
              {Math.round(item.amountLeft * 100)}%
            </Text>
          </View>
        </View>

        {/* Freshness */}
        <View style={styles.progressRow}>
          <View style={styles.progressLabelRow}>
            <Icon name="leaf" size={14} color={COLORS.textSecondary} />
            <Text style={styles.progressLabel}>Freshness</Text>
          </View>
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${
                      Math.max(
                        0,
                        1 -
                          (new Date() - new Date(item.purchaseDate)) /
                            (new Date(item.expiryDate) -
                              new Date(item.purchaseDate)),
                      ) * 100
                    }%`,
                    backgroundColor: freshness.color,
                  },
                ]}
              />
            </View>
            <Text style={[styles.progressValue, { color: freshness.color }]}>
              {freshness.label}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.dateInfo}>
          <Icon name="calendar" size={14} color={COLORS.textSecondary} />
          <Text style={styles.dateText}>
            Expires: {formatDate(item.expiryDate)}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onUpdateAmount?.(item.id, -0.25)}
          >
            <Icon name="minus" size={16} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={() => onUpdateAmount?.(item.id, 0.25)}
          >
            <Icon name="plus" size={16} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 1,
  },
  itemQuantity: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 8,
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: COLORS.danger + '15',
  },
  freshnessIndicator: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    gap: 10,
    marginBottom: 10,
  },
  progressRow: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBg: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.border,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    minWidth: 60,
    textAlign: 'right',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnPrimary: {
    backgroundColor: COLORS.primary,
  },
  // Compact styles
  compactCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 8,
    marginRight: 12,
    marginBottom: 2,
    width: 120,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  compactInfo: {
    alignItems: 'center',
  },
  compactName: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
    textAlign: 'center',
  },
  freshnessTag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  freshnessText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

export default FridgeItemCard;
