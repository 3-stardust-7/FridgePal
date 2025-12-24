import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  runOnJS,
} from 'react-native-reanimated';


const DraggableProgressBar = ({ progress, onProgressChange, color, label }) => {
  const translateX = useSharedValue(0);
  const startX = useSharedValue(0);
  const barWidth = useSharedValue(0);

  useEffect(() => {
    if (barWidth.value > 0) {
      translateX.value = progress * barWidth.value;
    }
  }, [progress]);

  const gesture = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
    })
    .onUpdate((event) => {
      const newX = startX.value + event.translationX;
      translateX.value = Math.max(
        0,
        Math.min(newX, barWidth.value)
      );
    })
    .onEnd(() => {
      // const newProgress =
      //   barWidth.value === 0 ? 0 : translateX.value / barWidth.value;
      // runOnJS(onProgressChange)(newProgress);
      const newProgress =
        barWidth.value > 0
          ? Math.min(1, Math.max(0, translateX.value / barWidth.value))
          : 0;

runOnJS(onProgressChange)(newProgress);

    });

  const fillStyle = useAnimatedStyle(() => ({
    width: translateX.value,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={styles.progressContainer}>
      <Text style={styles.progressLabel}>{label}</Text>

      <View style={styles.progressBarWrapper}>
        <View
          style={styles.progressBarBg}
          onLayout={(e) => {
            barWidth.value = e.nativeEvent.layout.width;
            translateX.value = progress * barWidth.value;
          }}
        >
          <Animated.View
            style={[
              styles.progressBarFill,
              { backgroundColor: color },
              fillStyle,
            ]}
          />
        </View>

        <GestureDetector gesture={gesture}>
          <Animated.View style={[styles.progressThumb, thumbStyle]}>
            <View style={[styles.thumbCircle, { backgroundColor: color }]} />
          </Animated.View>
        </GestureDetector>
      </View>

      <Text style={styles.progressText}>
        {/* {Math.round(progress * 100)}% */}
        {Number.isFinite(progress)
          ? Math.round(progress * 100)
          : 0}%
      </Text>
    </View>
  );
};



const FridgeItemCard = ({ item }) => {
  const [amountProgress, setAmountProgress] = useState(item.amountLeft);
  const [expiryProgress, setExpiryProgress] = useState(item.expiryProgress);

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Image source={{ uri: item.image }} style={styles.itemImage} />
        <View style={styles.itemInfo}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemQuantity}>{item.quantity}</Text>
        </View>
      </View>

      <View style={styles.progressBarsContainer}>
        <DraggableProgressBar
          progress={amountProgress}
          onProgressChange={setAmountProgress}
          color="#4CAF50"
          label="Amount Left"
        />

        <DraggableProgressBar
          progress={expiryProgress}
          onProgressChange={setExpiryProgress}
          color="#FF9800"
          label="Freshness"
        />
      </View>
    </View>
  );
};


const Home = () => {
  const fridgeItems = [
    {
      id: 1,
      name: 'Potatoes',
      quantity: '1.5 kg',
      image:
        'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=100&h=100&fit=crop',
      amountLeft: 0.6,
      expiryProgress: 0.8,
    },
    {
      id: 5,
      name: 'Eggs',
      quantity: '12 pieces',
      image:
        'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=100&h=100&fit=crop',
      amountLeft: 0.5,
      expiryProgress: 0.7,
    },
    {
      id: 3,
      name: 'Milk',
      quantity: '2 L',
      image:
        'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=100&h=100&fit=crop',
      amountLeft: 0.75,
      expiryProgress: 0.3,
    },
    {
      id: 8,
      name: 'Spinach',
      quantity: '300 g',
      image:
        'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=100&h=100&fit=crop',
      amountLeft: 0.3,
      expiryProgress: 0.2,
    },
    {
      id: 4,
      name: 'Chicken',
      quantity: '500 g',
      image:
        'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=100&h=100&fit=crop',
      amountLeft: 0.9, 
      expiryProgress: 0.6,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Items Left</Text>
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {fridgeItems.map((item) => (
          <FridgeItemCard key={item.id} item={item} />
        ))}
      </ScrollView>
    </View>
  );
};



const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
  },
  addButtonText: {
    fontSize: 32,
    color: '#FFFFFF',
    fontWeight: '300',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  itemImage: {
    width: 70,
    height: 70,
    borderRadius: 16,
  },
  itemInfo: {
    marginLeft: 16,
    flex: 1,
  },
  itemName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
  },
  itemQuantity: {
    fontSize: 14,
    color: '#6B7280',
  },
  progressBarsContainer: {
    gap: 16,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },
  progressBarWrapper: {
    position: 'relative',
    height: 8,
    marginBottom: 4,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
  },
  progressThumb: {
    position: 'absolute',
    top: -6,
    left: -10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'right',
  },
});

export default Home;
