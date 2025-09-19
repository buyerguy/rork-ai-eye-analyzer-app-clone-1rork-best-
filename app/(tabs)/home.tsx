import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Alert,
  Image,
  ActivityIndicator,
  Modal,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Upload, Camera, Sparkles, Info, Wifi, WifiOff, X } from "lucide-react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useApp } from "@/providers/AppProvider";
import { trpcClient } from "@/lib/trpc";

export default function HomeScreen() {
  const { scansUsed, weeklyLimit, isDeveloperMode, checkQuota, isDarkMode } = useApp();
  
  // Add safety check for functions
  const safeCheckQuota = () => {
    if (typeof checkQuota === 'function') {
      return checkQuota();
    }
    console.warn('checkQuota function not available');
    return false;
  };
  const [loading, setLoading] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [showShotTips, setShowShotTips] = useState(false);

  const handleUploadPhoto = async () => {
    if (!safeCheckQuota()) {
      Alert.alert(
        "Scan Limit Reached",
        "You've used all your free scans this week. Upgrade to premium for unlimited scans.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      // Request permissions first
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'We need access to your photo library to upload images.',
          [{ text: 'OK' }]
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: Platform.OS === 'web' ? 0.5 : 0.7, // Lower quality for web
        allowsMultipleSelection: false,
        base64: false, // Don't convert to base64 in picker
        exif: false, // Don't include EXIF data
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImage = result.assets[0];
        console.log('Image selected:', {
          uri: selectedImage.uri,
          width: selectedImage.width,
          height: selectedImage.height,
          fileSize: selectedImage.fileSize
        });
        
        // Check file size (limit to 5MB)
        if (selectedImage.fileSize && selectedImage.fileSize > 5 * 1024 * 1024) {
          Alert.alert(
            'File Too Large',
            'Please select an image smaller than 5MB.',
            [{ text: 'OK' }]
          );
          return;
        }
        
        router.push({
          pathname: "/analyzing" as any,
          params: { imageUri: selectedImage.uri }
        });
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert(
        'Error',
        'Failed to select image. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleUseCamera = async () => {
    if (!safeCheckQuota()) {
      Alert.alert(
        "Scan Limit Reached",
        "You've used all your free scans this week. Upgrade to premium for unlimited scans.",
        [{ text: "OK" }]
      );
      return;
    }

    try {
      // For web, use image picker as camera fallback
      if (Platform.OS === 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'We need access to your camera/photos to capture images.',
            [{ text: 'OK' }]
          );
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.5,
          allowsMultipleSelection: false,
          base64: false,
          exif: false,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
          const selectedImage = result.assets[0];
          console.log('Image selected via web camera fallback:', selectedImage.uri);
          
          router.push({
            pathname: "/analyzing" as any,
            params: { imageUri: selectedImage.uri }
          });
        }
      } else {
        // Navigate to dedicated camera screen for mobile
        router.push('/camera');
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert(
        'Error',
        'Failed to open camera. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <LinearGradient
      colors={isDarkMode ? ['#1a1a3e', '#2d2d5f'] : ['#f8fafc', '#e2e8f0']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            {/* Logo and Title */}
            <View style={styles.logoContainer}>
              <View style={styles.sparklesContainer}>
                <Sparkles size={32} color="#ff6b9d" style={styles.sparkle1} />
                <Sparkles size={24} color="#c44569" style={styles.sparkle2} />
                <Sparkles size={28} color="#ff6b9d" style={styles.sparkle3} />
              </View>
              <Text style={[styles.title, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Iris Analyzer</Text>
              <Text style={[styles.subtitle, { color: isDarkMode ? '#a0a0b8' : '#6b7280' }]}>
                Discover the story in your eyes. Upload or capture a high-quality{'\n'}
                photo of your iris for a fun AI-powered analysis.
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonsContainer}>
              <TouchableOpacity 
                style={styles.uploadButton}
                onPress={handleUploadPhoto}
                activeOpacity={0.8}
              >
                <Upload size={20} color="#fff" />
                <Text style={styles.buttonText}>Upload Eye Photo</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cameraButton}
                onPress={handleUseCamera}
                activeOpacity={0.8}
              >
                <Camera size={20} color="#fff" />
                <Text style={styles.buttonText}>Use Camera</Text>
              </TouchableOpacity>
            </View>

            {/* Disclaimer and Shot Tips */}
            <View style={styles.infoContainer}>
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={() => setShowDisclaimer(true)}
              >
                <Info size={16} color="#8a8aa0" />
                <Text style={styles.infoText}>Disclaimer</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.infoButton}
                onPress={() => setShowShotTips(true)}
              >
                <Camera size={16} color="#8a8aa0" />
                <Text style={styles.infoText}>Shot Tips</Text>
              </TouchableOpacity>
            </View>

            {/* Quota Display */}
            <View style={styles.quotaContainer}>
              <Text style={[styles.quotaText, { color: isDarkMode ? '#a0a0b8' : '#6b7280' }]}>
                You have used {scansUsed} scans this week, {weeklyLimit - scansUsed} left.
              </Text>
              {isDeveloperMode && (
                <Text style={styles.devModeText}>Developer Mode Active</Text>
              )}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Disclaimer Modal */}
      <Modal
        visible={showDisclaimer}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDisclaimer(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: isDarkMode ? '#4dd0e1' : '#1f2937' }]}>Disclaimer</Text>
              <TouchableOpacity 
                onPress={() => setShowDisclaimer(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#8a8aa0" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={[styles.modalText, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>
                This app is intended for entertainment and personal insight purposes only. The analysis and results provided are not medical advice and should not be used for diagnosing or treating any health condition. For medical concerns, consult a qualified healthcare professional.
              </Text>
              <Text style={[styles.modalText, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>
                All photos are processed securely and are not stored or shared by the app. Your privacy is important to us.
              </Text>
            </View>
          </View>
        </View>
      </Modal>

      {/* Shot Tips Modal */}
      <Modal
        visible={showShotTips}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowShotTips(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <View style={styles.shotTipsHeader}>
                <Camera size={20} color="#4dd0e1" />
                <Text style={[styles.modalTitle, { color: isDarkMode ? '#4dd0e1' : '#1f2937' }]}>Shot Tips</Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowShotTips(false)}
                style={styles.closeButton}
              >
                <X size={20} color="#8a8aa0" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={[styles.tipText, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>Place your eye close to the camera</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={[styles.tipText, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>Align your iris within the circle</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={[styles.tipText, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>Use good lighting—bright but not harsh</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={[styles.tipText, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>Remove glasses or contact lenses if possible</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={[styles.tipText, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>Look straight at the camera and keep your eye open wide</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={[styles.tipText, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>Avoid blurry or out-of-focus shots</Text>
              </View>
              <View style={styles.tipItem}>
                <Text style={styles.tipBullet}>•</Text>
                <Text style={[styles.tipText, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>Keep the background simple</Text>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 60,
  },
  sparklesContainer: {
    width: 100,
    height: 60,
    marginBottom: 20,
  },
  sparkle1: {
    position: 'absolute',
    top: 0,
    left: 20,
  },
  sparkle2: {
    position: 'absolute',
    top: 20,
    right: 15,
  },
  sparkle3: {
    position: 'absolute',
    bottom: 0,
    left: 35,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#a0a0b8',
    textAlign: 'center',
    lineHeight: 20,
  },
  buttonsContainer: {
    width: '100%',
    gap: 16,
    marginBottom: 40,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7c4dff',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4dd0e1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoContainer: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 40,
  },
  infoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoText: {
    color: '#8a8aa0',
    fontSize: 14,
  },
  quotaContainer: {
    alignItems: 'center',
  },
  quotaText: {
    color: '#a0a0b8',
    fontSize: 13,
  },
  devModeText: {
    color: '#4dd0e1',
    fontSize: 12,
    marginTop: 8,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#2a2a4a',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 0,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a5a',
  },
  shotTipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4dd0e1',
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalText: {
    color: '#a0a0b8',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 8,
  },
  tipBullet: {
    color: '#4dd0e1',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 12,
    marginTop: 1,
  },
  tipText: {
    color: '#a0a0b8',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});