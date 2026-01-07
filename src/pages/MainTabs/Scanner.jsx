import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  Modal,
  StatusBar,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, useCameraDevices, useCameraPermission } from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useDispatch } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import { COLORS } from '../../utils/constants';
import { detectFoodItems, processDetectionResults } from '../../services/detectionService';
import { uploadItemImage } from '../../services/storageService';
import { addFridgeItem } from '../../../store/slices/fridgeSliceAsync';

const Scanner = ({ navigation }) => {
  const dispatch = useDispatch();
  const camera = useRef(null);
  const { hasPermission, requestPermission } = useCameraPermission();
  const devices = useCameraDevices();
  const device = devices.find((d) => d.position === 'back');
  const format = device?.formats.find(f => 
    f.videoWidth === 1080 && f.videoHeight === 1920
  ) || device?.formats[0];
  const { isAuthenticated } = useAuth();

  const [isScanning, setIsScanning] = useState(false);
  const [capturedBase64, setCapturedBase64] = useState(null);
  const [detectedItems, setDetectedItems] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);

  // Request camera permission on mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  // Capture and analyze image
  const handleCapture = useCallback(async () => {
    if (!camera.current) return;

    try {
      setIsScanning(true);
      setError(null);

      // Capture photo
      const photo = await camera.current.takePhoto({
        qualityPrioritization: 'balanced',
      });

      // Read as base64
      const RNFS = require('react-native-fs');
      const base64Image = await RNFS.readFile(photo.path, 'base64');
      setCapturedBase64(base64Image);

      // Send to backend for detection
      const response = await detectFoodItems(base64Image);
      
      // Process results
      const items = processDetectionResults(response);
      setDetectedItems(items);
      setShowResults(true);

    } catch (err) {
      console.error('Scan error:', err);
      setError(err.message || 'Failed to scan. Make sure backend is running.');
      Alert.alert(
        'Scan Failed',
        err.message || 'Could not detect items. Check if backend server is running.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsScanning(false);
    }
  }, []);

  // Add detected items to fridge
  const handleAddToFridge = async (item) => {
    if (!isAuthenticated) {
      Alert.alert('Not signed in', 'Please sign in to add items to your fridge.');
      return;
    }

    try {
      let imageUrl;
      let imagePath;

      if (capturedBase64) {
        const upload = await uploadItemImage(capturedBase64);
        imageUrl = upload.url;
        imagePath = upload.path;
      }

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // Default 7 days

      // Dispatch and unwrap so errors from the async thunk throw here
      await dispatch(addFridgeItem({
        name: item.name,
        category: item.category,
        expiryDate: expiryDate.toISOString().split('T')[0],
        amountLeft: 100,
        quantity: 1,
        unit: 'item',
        notes: item.ocrText ? `OCR: ${item.ocrText}` : '',
        imageUrl,
        imagePath,
      })).unwrap();

      // Remove from detected list
      setDetectedItems(prev => prev.filter(i => i.id !== item.id));
      
      Alert.alert('Added!', `${item.name} added to your fridge`);
    } catch (err) {
      console.error('Add to fridge error:', err);
      const message = err?.message || err?.payload || 'Failed to add item';
      Alert.alert('Error', message.toString());
    }
  };

  // Add all items to fridge
  const handleAddAll = async () => {
    for (const item of detectedItems) {
      await handleAddToFridge(item);
    }
    setShowResults(false);
    navigation.navigate('Fridge');
  };

  // Render detected item
  const renderDetectedItem = ({ item }) => (
    <View style={styles.detectedItem}>
      <View style={styles.itemInfo}>
        <Icon 
          name={getCategoryIcon(item.category)} 
          size={24} 
          color={COLORS.primary} 
        />
        <View style={styles.itemText}>
          <Text style={styles.itemName}>{item.name}</Text>
          <Text style={styles.itemCategory}>
            {item.category} • {Math.round(item.confidence * 100)}% confident
          </Text>
          {item.ocrText && (
            <Text style={styles.ocrText}>OCR: {item.ocrText}</Text>
          )}
        </View>
      </View>
      <TouchableOpacity 
        style={styles.addButton}
        onPress={() => handleAddToFridge(item)}
      >
        <Icon name="plus" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const getCategoryIcon = (category) => {
    const icons = {
      fruits: 'food-apple',
      vegetables: 'carrot',
      packaged: 'package-variant',
      other: 'food',
    };
    return icons[category] || 'food';
  };

  // Permission not granted
  if (!hasPermission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Icon name="camera-off" size={64} color={COLORS.textLight} />
          <Text style={styles.permissionText}>Camera permission required</Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // No camera device
  if (!device) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Icon name="camera-off" size={64} color={COLORS.textLight} />
          <Text style={styles.permissionText}>No camera device found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Camera View */}
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        format={format}
        isActive={!showResults}
        photo={true}
      />

      {/* Overlay */}
      <View style={styles.overlay}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Scan Fridge</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Scan Frame */}
        <View style={styles.scanFrame}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            Point camera at your fridge contents
          </Text>
        </View>

        {/* Capture Button */}
        <View style={styles.captureContainer}>
          <TouchableOpacity
            style={[styles.captureButton, isScanning && styles.captureButtonDisabled]}
            onPress={handleCapture}
            disabled={isScanning}
          >
            {isScanning ? (
              <ActivityIndicator size="large" color="#fff" />
            ) : (
              <Icon name="camera" size={36} color="#fff" />
            )}
          </TouchableOpacity>
          <Text style={styles.captureText}>
            {isScanning ? 'Analyzing...' : 'Tap to Scan'}
          </Text>
        </View>
      </View>

      {/* Results Modal */}
      <Modal
        visible={showResults}
        animationType="slide"
        transparent={true}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Detected Items</Text>
              <TouchableOpacity onPress={() => setShowResults(false)}>
                <Icon name="close" size={24} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            {detectedItems.length > 0 ? (
              <>
                <FlatList
                  data={detectedItems}
                  renderItem={renderDetectedItem}
                  keyExtractor={(item) => item.id}
                  style={styles.itemList}
                />
                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.addAllButton}
                    onPress={handleAddAll}
                  >
                    <Icon name="plus-circle" size={20} color="#fff" />
                    <Text style={styles.addAllText}>Add All to Fridge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.scanAgainButton}
                    onPress={() => setShowResults(false)}
                  >
                    <Text style={styles.scanAgainText}>Scan Again</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <View style={styles.noItems}>
                <Icon name="magnify-close" size={48} color={COLORS.textLight} />
                <Text style={styles.noItemsText}>No food items detected</Text>
                <TouchableOpacity 
                  style={styles.scanAgainButton}
                  onPress={() => setShowResults(false)}
                >
                  <Text style={styles.scanAgainText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  scanFrame: {
    flex: 1,
    margin: 40,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.primary,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 12,
  },
  instructions: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    opacity: 0.9,
  },
  captureContainer: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  captureButtonDisabled: {
    backgroundColor: COLORS.textLight,
  },
  captureText: {
    color: '#fff',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  permissionText: {
    fontSize: 18,
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 34,
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
  itemList: {
    maxHeight: 400,
  },
  detectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemText: {
    marginLeft: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  itemCategory: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  ocrText: {
    fontSize: 12,
    color: COLORS.primary,
    marginTop: 4,
    fontStyle: 'italic',
  },
  addButton: {
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    padding: 20,
    gap: 12,
  },
  addAllButton: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addAllText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scanAgainButton: {
    alignItems: 'center',
    padding: 12,
  },
  scanAgainText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  noItems: {
    alignItems: 'center',
    padding: 40,
  },
  noItemsText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 16,
    marginBottom: 24,
  },
});

export default Scanner;
