import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/constants';

const CircularProgress = ({
  progress = 0,
  size = 100,
  strokeWidth = 10,
  color = COLORS.primary,
  backgroundColor = COLORS.border,
  label,
  value,
  unit,
  showPercentage = true,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset =
    circumference - Math.min(progress, 1) * circumference;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View style={styles.svgContainer}>
        {/* Background Circle */}
        <View
          style={[
            styles.circle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: backgroundColor,
            },
          ]}
        />
        {/* Progress Circle - Using a simplified approach */}
        <View
          style={[
            styles.progressCircle,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: 'transparent',
              borderTopColor: color,
              borderRightColor: progress > 0.25 ? color : 'transparent',
              borderBottomColor: progress > 0.5 ? color : 'transparent',
              borderLeftColor: progress > 0.75 ? color : 'transparent',
              transform: [{ rotate: '-90deg' }],
            },
          ]}
        />
      </View>
      <View style={styles.content}>
        {value !== undefined ? (
          <>
            <Text style={[styles.value, { color }]}>{value}</Text>
            {unit && <Text style={styles.unit}>{unit}</Text>}
          </>
        ) : showPercentage ? (
          <Text style={[styles.percentage, { color }]}>
            {Math.round(progress * 100)}%
          </Text>
        ) : null}
        {label && <Text style={styles.label}>{label}</Text>}
      </View>
    </View>
  );
};

const ProgressBar = ({
  progress = 0,
  height = 8,
  color = COLORS.primary,
  backgroundColor = COLORS.border,
  label,
  showValue = false,
  value,
  maxValue,
  unit,
  style,
}) => {
  return (
    <View style={[styles.barContainer, style]}>
      {(label || showValue) && (
        <View style={styles.barHeader}>
          {label && <Text style={styles.barLabel}>{label}</Text>}
          {showValue && (
            <Text style={styles.barValue}>
              {value !== undefined
                ? `${value}${unit ? ` ${unit}` : ''}`
                : `${Math.round(progress * 100)}%`}
              {maxValue !== undefined &&
                ` / ${maxValue}${unit ? ` ${unit}` : ''}`}
            </Text>
          )}
        </View>
      )}
      <View style={[styles.barBg, { height, backgroundColor }]}>
        <View
          style={[
            styles.barFill,
            {
              width: `${Math.min(progress, 1) * 100}%`,
              backgroundColor: color,
              height,
            },
          ]}
        />
      </View>
    </View>
  );
};

const NutritionProgress = ({
  label,
  current,
  goal,
  unit = 'g',
  color = COLORS.primary,
  icon,
}) => {
  const progress = goal > 0 ? current / goal : 0;
  const isOver = current > goal;

  return (
    <View style={styles.nutritionContainer}>
      <View style={styles.nutritionHeader}>
        <View style={styles.nutritionLabelRow}>
          {icon}
          <Text style={styles.nutritionLabel}>{label}</Text>
        </View>
        <Text style={[styles.nutritionValues, isOver && styles.overLimit]}>
          {current} / {goal} {unit}
        </Text>
      </View>
      <View style={styles.nutritionBarBg}>
        <View
          style={[
            styles.nutritionBarFill,
            {
              width: `${Math.min(progress, 1) * 100}%`,
              backgroundColor: isOver ? COLORS.danger : color,
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // Circular Progress
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  svgContainer: {
    position: 'absolute',
  },
  circle: {
    position: 'absolute',
  },
  progressCircle: {
    position: 'absolute',
  },
  content: {
    alignItems: 'center',
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
  },
  unit: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  percentage: {
    fontSize: 20,
    fontWeight: '700',
  },
  label: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Progress Bar
  barContainer: {
    width: '100%',
  },
  barHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  barLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  barValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  barBg: {
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    borderRadius: 4,
  },

  // Nutrition Progress
  nutritionContainer: {
    marginBottom: 16,
  },
  nutritionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  nutritionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nutritionLabel: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  nutritionValues: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  overLimit: {
    color: COLORS.danger,
    fontWeight: '600',
  },
  nutritionBarBg: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  nutritionBarFill: {
    height: '100%',
    borderRadius: 4,
  },
});

export { CircularProgress, ProgressBar, NutritionProgress };
