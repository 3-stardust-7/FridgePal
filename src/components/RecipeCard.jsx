import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS } from '../utils/constants';

const RecipeCard = ({
  recipe,
  onPress,
  onSave,
  isSaved = false,
  compact = false,
  showAiBadge = false,
}) => {
  const isAiGenerated = recipe.isAiGenerated || showAiBadge;

  if (compact) {
    return (
      <TouchableOpacity
        style={styles.compactCard}
        onPress={onPress}
        activeOpacity={0.8}
      >
        <Image source={{ uri: recipe.image }} style={styles.compactImage} />
        <View style={styles.compactOverlay}>
          <View style={styles.matchBadgeSmall}>
            <Text style={styles.matchTextSmall}>{recipe.matchPercentage}%</Text>
          </View>
          {isAiGenerated && (
            <View style={styles.aiBadgeSmall}>
              <Icon name="auto-fix" size={10} color="#FFF" />
            </View>
          )}
        </View>
        <View style={styles.compactInfo}>
          <Text style={styles.compactName} numberOfLines={2}>
            {recipe.name}
          </Text>
          <View style={styles.compactMeta}>
            <Icon name="clock-outline" size={12} color={COLORS.textSecondary} />
            <Text style={styles.compactMetaText}>
              {recipe.prepTime + recipe.cookTime} min
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: recipe.image }} style={styles.image} />
        <View style={styles.overlay}>
          <View style={styles.badgeRow}>
            <View
              style={[styles.matchBadge, isAiGenerated && styles.matchBadgeAi]}
            >
              {isAiGenerated && (
                <Icon
                  name="auto-fix"
                  size={14}
                  color="#FFF"
                  style={{ marginRight: 4 }}
                />
              )}
              <Icon name="check-circle" size={16} color="#FFF" />
              <Text style={styles.matchText}>
                {recipe.matchPercentage}% Match
              </Text>
            </View>
            {isAiGenerated && (
              <View style={styles.aiBadge}>
                <Icon name="robot" size={14} color="#FFF" />
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
            )}
          </View>
          <TouchableOpacity
            style={[styles.saveBtn, isSaved && styles.saveBtnActive]}
            onPress={() => onSave?.(recipe.id)}
          >
            <Icon
              name={isSaved ? 'heart' : 'heart-outline'}
              size={22}
              color={isSaved ? COLORS.danger : '#FFF'}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.difficultyBadge}>
          <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{recipe.name}</Text>
          {isAiGenerated && (
            <View style={styles.aiGeneratedTag}>
              <Icon name="sparkles" size={12} color={COLORS.accent} />
              <Text style={styles.aiGeneratedText}>AI Generated</Text>
            </View>
          )}
        </View>
        <Text style={styles.description} numberOfLines={2}>
          {recipe.description}
        </Text>

        {/* Show what's from fridge vs what to buy for AI recipes */}
        {isAiGenerated &&
          recipe.usesFromFridge &&
          recipe.usesFromFridge.length > 0 && (
            <View style={styles.fridgeMatchInfo}>
              <Icon name="fridge-outline" size={14} color={COLORS.secondary} />
              <Text style={styles.fridgeMatchText}>
                Uses {recipe.usesFromFridge.length} items from your fridge
              </Text>
            </View>
          )}

        {isAiGenerated && recipe.needToBuy && recipe.needToBuy.length > 0 && (
          <View style={styles.needToBuyInfo}>
            <Icon name="cart-outline" size={14} color={COLORS.accent} />
            <Text style={styles.needToBuyText}>
              Need to buy: {recipe.needToBuy.slice(0, 3).join(', ')}
              {recipe.needToBuy.length > 3
                ? ` +${recipe.needToBuy.length - 3} more`
                : ''}
            </Text>
          </View>
        )}

        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Icon name="clock-outline" size={16} color={COLORS.textSecondary} />
            <Text style={styles.metaText}>
              {recipe.prepTime + recipe.cookTime} min
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="fire" size={16} color={COLORS.accent} />
            <Text style={styles.metaText}>{recipe.calories} cal</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon
              name="account-outline"
              size={16}
              color={COLORS.textSecondary}
            />
            <Text style={styles.metaText}>{recipe.servings} servings</Text>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {recipe.tags.slice(0, 3).map((tag, index) => (
            <View key={index} style={styles.tag}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>

        <View style={styles.nutritionRow}>
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{recipe.protein}g</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          <View style={styles.nutritionDivider} />
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{recipe.carbs}g</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          <View style={styles.nutritionDivider} />
          <View style={styles.nutritionItem}>
            <Text style={styles.nutritionValue}>{recipe.fat}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  matchText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  saveBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
  },
  difficultyBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    padding: 16,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 12,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tag: {
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  nutritionLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  nutritionDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  // Compact styles
  compactCard: {
    width: 160,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  compactImage: {
    width: '100%',
    height: 100,
  },
  compactOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  matchBadgeSmall: {
    backgroundColor: COLORS.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  matchTextSmall: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  compactInfo: {
    padding: 10,
  },
  compactName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  compactMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  compactMetaText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  // AI Badge styles
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  matchBadgeAi: {
    backgroundColor: COLORS.accent,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  aiBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  aiBadgeSmall: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    flexWrap: 'wrap',
    gap: 8,
  },
  aiGeneratedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  aiGeneratedText: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
  },
  fridgeMatchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  fridgeMatchText: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '500',
  },
  needToBuyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  needToBuyText: {
    fontSize: 12,
    color: COLORS.accent,
    fontWeight: '500',
  },
});

export default RecipeCard;
