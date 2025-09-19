import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  SafeAreaView,
  Dimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { X, Camera, RotateCcw, Check } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

const { width } = Dimensions.get('window');

interface CameraScreenProps {
  onCapture: (imageUri: string) => void;
  onClose: () => void;
}

export default function CameraScreen({ onCapture, onClose }: CameraScreenProps) {
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [isCapturing, setIsCapturing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleCameraReady = () => {
    console.log('Camera is ready');
    setCameraReady(true);
    setError(null);
  };

  const handleCameraError = (error: any) => {
    console.error('Camera error:', error);
    setError('Camera failed to initialize. Please try again.');
    setCameraReady(false);
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#1a1a3e', '#2d2d5f']} style={styles.container}>
          <View style={styles.permissionContainer}>
            <Camera size={64} color="#fff" />
            <Text style={styles.permissionTitle}>Camera Permission Required</Text>
            <Text style={styles.permissionMessage}>
              We need access to your camera to capture iris photos for analysis.
            </Text>
            <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const toggleCameraFacing = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  const takePicture = async () => {
    if (!cameraRef.current || isCapturing || !cameraReady) {
      console.log('Cannot take picture:', { 
        hasRef: !!cameraRef.current, 
        isCapturing, 
        cameraReady 
      });
      return;
    }

    try {
      console.log('Starting photo capture...');
      setIsCapturing(true);
      setError(null);
      
      // Add a longer delay for Android stability
      if (Platform.OS === 'android') {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: Platform.OS === 'android' ? 0.5 : 0.7,
        base64: false,
        skipProcessing: Platform.OS === 'android',
        exif: false,
        ...(Platform.OS === 'android' && {
          imageType: 'jpg',
          isImageMirror: false,
        }),
      });

      console.log('Photo captured:', photo);

      if (photo?.uri) {
        if (Platform.OS !== 'web') {
          // For mobile platforms, save to device storage
          const fileName = `iris_${Date.now()}.jpg`;
          const newPath = `${FileSystem.documentDirectory}${fileName}`;
          
          console.log('Moving file from', photo.uri, 'to', newPath);
          
          // Check if source file exists
          const fileInfo = await FileSystem.getInfoAsync(photo.uri);
          if (!fileInfo.exists) {
            throw new Error('Captured photo file does not exist');
          }
          
          await FileSystem.moveAsync({
            from: photo.uri,
            to: newPath,
          });
          
          console.log('File moved successfully to:', newPath);
          setCapturedImage(newPath);
        } else {
          // For web, use the URI directly
          setCapturedImage(photo.uri);
        }
      } else {
        throw new Error('No photo URI received');
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      setError('Failed to capture photo. Please try again.');
      Alert.alert(
        'Camera Error', 
        'Failed to capture photo. Please ensure the camera has proper permissions and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsCapturing(false);
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
  };

  const confirmPicture = async () => {
    if (capturedImage) {
      try {
        console.log('Processing image for upload...');
        
        // For mobile platforms, just pass the file URI directly
        // The backend will handle the image processing
        if (Platform.OS !== 'web') {
          console.log('Using file URI for mobile:', capturedImage);
          onCapture(capturedImage);
        } else {
          // For web, we need to compress the image
          const manipulatedImage = await ImageManipulator.manipulateAsync(
            capturedImage,
            [
              { resize: { width: 512 } },
            ],
            {
              compress: 0.7,
              format: ImageManipulator.SaveFormat.JPEG,
              base64: false, // Don't convert to base64 here
            }
          );
          
          console.log('Image processed for web:', manipulatedImage.uri);
          onCapture(manipulatedImage.uri);
        }
      } catch (error) {
        console.error('Error processing image:', error);
        onCapture(capturedImage); // Fallback to original
      }
    }
  };

  if (capturedImage) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#1a1a3e', '#2d2d5f']} style={styles.container}>
          <View style={styles.previewContainer}>
            <View style={styles.imagePreview}>
              <Image source={{ uri: capturedImage }} style={styles.previewImage} />
            </View>
            
            <View style={styles.previewControls}>
              <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
                <RotateCcw size={20} color="#fff" />
                <Text style={styles.controlButtonText}>Retake</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.confirmButton} onPress={confirmPicture}>
                <Check size={20} color="#fff" />
                <Text style={styles.controlButtonText}>Use Photo</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={['#1a1a3e', '#2d2d5f']} style={styles.container}>
          <View style={styles.errorContainer}>
            <Camera size={64} color="#ff6b6b" />
            <Text style={styles.errorTitle}>Camera Error</Text>
            <Text style={styles.errorMessage}>{error}</Text>
            <TouchableOpacity 
              style={styles.retryButton} 
              onPress={() => {
                setError(null);
                setCameraReady(false);
              }}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.container}>
        <CameraView 
          ref={cameraRef}
          style={styles.camera} 
          facing={facing}
          mode="picture"
          onCameraReady={handleCameraReady}
          onMountError={handleCameraError}
        >
          {!cameraReady && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#4dd0e1" />
              <Text style={styles.loadingText}>Initializing camera...</Text>
            </View>
          )}
          <View style={styles.header}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Capture Iris</Text>
            <TouchableOpacity style={styles.flipButton} onPress={toggleCameraFacing}>
              <RotateCcw size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.cameraGuide}>
            <View style={styles.guideCircle} />
            <Text style={styles.guideText}>
              Position your eye in the circle and tap to capture
            </Text>
          </View>

          <View style={styles.controls}>
            <View style={styles.captureButtonContainer}>
              <TouchableOpacity 
                style={[
                  styles.captureButton, 
                  (isCapturing || !cameraReady) && styles.capturingButton
                ]} 
                onPress={takePicture}
                disabled={isCapturing || !cameraReady}
              >
                {isCapturing ? (
                  <ActivityIndicator size="small" color="#4dd0e1" />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>
            </View>
            {!cameraReady && (
              <Text style={styles.cameraStatusText}>Preparing camera...</Text>
            )}
          </View>
        </CameraView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  message: {
    textAlign: 'center',
    paddingBottom: 10,
    color: '#fff',
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraGuide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#4dd0e1',
    backgroundColor: 'transparent',
  },
  guideText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingVertical: 10,
    borderRadius: 8,
  },
  controls: {
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  captureButtonContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#4dd0e1',
  },
  capturingButton: {
    opacity: 0.7,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4dd0e1',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  permissionMessage: {
    color: '#a0a0b8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  permissionButton: {
    backgroundColor: '#4dd0e1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  cancelButtonText: {
    color: '#8a8aa0',
    fontSize: 16,
  },
  previewContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  imagePreview: {
    width: width - 40,
    height: width - 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 40,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  previewControls: {
    flexDirection: 'row',
    gap: 20,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#666',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4dd0e1',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  cameraStatusText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    opacity: 0.8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    color: '#ff6b6b',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#a0a0b8',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  retryButton: {
    backgroundColor: '#4dd0e1',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 16,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});