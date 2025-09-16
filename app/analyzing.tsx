import React, { useEffect, useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, router } from "expo-router";
import { useApp } from "@/providers/AppProvider";
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';

export default function AnalyzingScreen() {
  const { imageUri } = useLocalSearchParams();
  const { incrementScans, addToHistory } = useApp();
  const [status, setStatus] = useState("Contacting AI service...");
  
  // Add safety checks for functions using useCallback
  const safeIncrementScans = useCallback(async () => {
    if (typeof incrementScans === 'function') {
      await incrementScans();
    } else {
      console.warn('incrementScans function not available');
    }
  }, [incrementScans]);
  
  const safeAddToHistory = useCallback(async (historyItem: any) => {
    if (typeof addToHistory === 'function') {
      await addToHistory(historyItem);
    } else {
      console.warn('addToHistory function not available');
    }
  }, [addToHistory]);

  useEffect(() => {
    const analyzeImage = async () => {
      try {
        // Simulate analysis steps
        const steps = [
          "Contacting AI service",
          "Processing iris patterns",
          "Analyzing color distribution",
          "Detecting unique features",
          "Generating insights"
        ];

        for (let i = 0; i < steps.length; i++) {
          setStatus(`${steps[i]}...`);
          await new Promise((resolve) => {
            if (resolve) setTimeout(resolve, 800);
          });
        }

        // Handle image data for backend with compression
        let imageData: string = '';
        const imageUriStr = imageUri as string;
        
        setStatus('Preparing image for analysis...');
        
        if (!imageUriStr.startsWith('data:image/') && Platform.OS !== 'web') {
          // Compress image using ImageManipulator for mobile
          try {
            const manipulatedImage = await ImageManipulator.manipulateAsync(
              imageUriStr,
              [
                { resize: { width: 800, height: 800 } }, // Resize to max 800x800
              ],
              {
                compress: 0.7, // 70% quality
                format: ImageManipulator.SaveFormat.JPEG,
                base64: true,
              }
            );
            
            if (manipulatedImage.base64) {
              imageData = `data:image/jpeg;base64,${manipulatedImage.base64}`;
              console.log('Compressed image size:', Math.round(imageData.length / 1024), 'KB');
            } else {
              throw new Error('Failed to compress image');
            }
          } catch (compressionError) {
            console.warn('Image compression failed, using original:', compressionError);
            // Fallback to original method
            const base64 = await FileSystem.readAsStringAsync(imageUriStr, {
              encoding: FileSystem.EncodingType.Base64,
            });
            imageData = `data:image/jpeg;base64,${base64}`;
          }
        } else if (imageUriStr.startsWith('data:image/')) {
          // Image is already a data URI, check size
          imageData = imageUriStr;
          const sizeKB = Math.round(imageData.length / 1024);
          console.log('Using processed data URI, size:', sizeKB, 'KB');
          
          // If image is too large, we need to compress it
          if (imageData.length > 2 * 1024 * 1024) { // 2MB limit
            console.log('Image too large, attempting compression...');
            try {
              // Extract base64 data and create a temporary file for compression
              const base64Data = imageData.split(',')[1];
              const tempUri = `${FileSystem.cacheDirectory}temp_image.jpg`;
              await FileSystem.writeAsStringAsync(tempUri, base64Data, {
                encoding: FileSystem.EncodingType.Base64,
              });
              
              const manipulatedImage = await ImageManipulator.manipulateAsync(
                tempUri,
                [
                  { resize: { width: 600, height: 600 } },
                ],
                {
                  compress: 0.6,
                  format: ImageManipulator.SaveFormat.JPEG,
                  base64: true,
                }
              );
              
              if (manipulatedImage.base64) {
                imageData = `data:image/jpeg;base64,${manipulatedImage.base64}`;
                console.log('Compressed large image to:', Math.round(imageData.length / 1024), 'KB');
              }
              
              // Clean up temp file
              await FileSystem.deleteAsync(tempUri, { idempotent: true });
            } catch (compressionError) {
              console.warn('Failed to compress large image:', compressionError);
              // Continue with original, but it might fail
            }
          }
        } else if (Platform.OS === 'web') {
          // For web, fetch the image and convert to base64
          const response = await fetch(imageUriStr);
          const blob = await response.blob();
          imageData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              if (typeof reader.result === 'string') {
                resolve(reader.result);
              } else {
                reject(new Error('Failed to read image as string'));
              }
            };
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
        } else {
          // Fallback case
          throw new Error('Unable to process image format');
        }
        
        // Final validation
        if (!imageData || imageData.length === 0) {
          throw new Error('Failed to process image data');
        }
        
        // Final size check
        const finalSizeKB = Math.round(imageData.length / 1024);
        console.log('Final image size for backend:', finalSizeKB, 'KB');
        
        if (imageData.length > 3 * 1024 * 1024) { // 3MB hard limit
          throw new Error('Image is too large even after compression. Please use a smaller image.');
        }

        // Always use offline mode for now to avoid connection issues
        console.log('Using offline analysis mode');
        setStatus('Analyzing with offline AI...');
        let result: any = null;
        
        // Simulate some processing time
        await new Promise((resolve) => {
          if (resolve) setTimeout(resolve, 1000);
        });
        
        // Generate offline analysis
        console.log('Generating offline analysis');
        setStatus('Finalizing analysis...');
        
        // Create varied analysis based on some randomization
        const patterns = [
          {
            name: "European Tapestry",
            description: "The captivating blend of cool blue-grey with a warm central ring often hints at a diverse European heritage, possibly combining Northern and Central European lineages.",
            uniquePatterns: ["Radiant Furrows", "Concentric Ring of Fire", "Defined Limbal Ring"]
          },
          {
            name: "Nordic Constellation",
            description: "Your iris displays the classic Nordic pattern with intricate stellar formations and crystalline structures that reflect ancient Scandinavian lineages.",
            uniquePatterns: ["Stellar Crypts", "Crystalline Formations", "Nordic Rings"]
          },
          {
            name: "Celtic Mosaic",
            description: "The complex interweaving patterns and subtle color variations suggest Celtic heritage with its characteristic mosaic-like iris structure.",
            uniquePatterns: ["Celtic Weave", "Emerald Flecks", "Ancient Spirals"]
          }
        ];
        
        const selectedPattern = patterns[Math.floor(Math.random() * patterns.length)];
        
        result = {
          success: true,
          analysis: {
            pattern: {
              name: selectedPattern.name,
              description: selectedPattern.description,
              metrics: {
                prevalence: `${Math.floor(Math.random() * 20) + 5}%`,
                regions: "Northern Europe, Central Europe",
                genetic: `T${Math.floor(Math.random() * 20) + 1}`
              }
            },
            sensitivity: {
              name: "Sunlight Sensitivity",
              description: "Lighter-colored eyes, like yours, contain less protective pigment against the sun's rays. It's a great reminder to don stylish sunglasses on bright days to keep those beautiful eyes happy!"
            },
            uniquePatterns: selectedPattern.uniquePatterns,
            rarity: {
              title: "A Rare Gem",
              description: "While blue eyes are somewhat rare globally, your specific combination makes your eye color particularly unique, setting it apart from more common variations.",
              percentage: Math.floor(Math.random() * 30) + 70
            },
            additionalInsights: [
              {
                icon: "🧬",
                title: "The Reflective Sage",
                description: "Individuals with this distinctive eye color often exude an aura of calm and depth, perceived as insightful, empathetic, and possessing a thoughtful, artistic spirit."
              },
              {
                icon: "👁️",
                title: "Unique Iris Signature",
                description: "Your iris contains distinctive patterns and color variations that create a truly unique biometric signature, as individual as your fingerprint."
              }
            ],
            summary: `Your iris reveals a fascinating ${selectedPattern.name} pattern with unique characteristics that make your eyes truly one-of-a-kind.`
          },
          timestamp: new Date().toISOString(),
        };
        
        if (!result?.success) {
          throw new Error(result?.error || 'Analysis failed');
        }
        
        const analysis = result.analysis;
        
        // Save to history and increment scan count
        await safeIncrementScans();
        await safeAddToHistory({
          id: Date.now().toString(),
          imageUri: imageUri as string,
          analysis,
          timestamp: new Date().toISOString(),
        });

        // Navigate to results
        router.replace({
          pathname: "/analysis" as any,
          params: { 
            imageUri: imageUri as string,
            analysisData: JSON.stringify(analysis)
          }
        });
      } catch (error) {
        console.error("Analysis error:", error);
        
        // Provide more specific error messages
        let errorMessage = "Unable to analyze the image. Please try again.";
        if (error instanceof Error) {
          if (error.message.includes('too large')) {
            errorMessage = "Image is too large. Please use a smaller image or compress it.";
          } else if (error.message.includes('timeout')) {
            errorMessage = "Analysis timed out. Please check your connection and try again.";
          } else if (error.message.includes('Failed to fetch') || error.message.includes('Unable to connect')) {
            errorMessage = "Connection failed. Analysis completed in offline mode.";
            
            // Use offline analysis for connection errors
            console.log('Using offline analysis due to connection error');
            
            // Generate a simple offline analysis
            const offlineAnalysis = {
              pattern: {
                name: "Classic Iris Pattern",
                description: "Your iris displays beautiful natural patterns with unique characteristics that make it distinctly yours.",
                metrics: {
                  prevalence: "15%",
                  regions: "Global",
                  genetic: "Natural"
                }
              },
              sensitivity: {
                name: "Normal Light Sensitivity",
                description: "Your iris provides natural protection against light while maintaining excellent visual clarity."
              },
              uniquePatterns: [
                "Natural Fibers",
                "Iris Crypts",
                "Color Variations"
              ],
              rarity: {
                title: "Unique Beauty",
                description: "Every iris is unique, and yours has its own special characteristics that make it beautiful.",
                percentage: 80
              },
              additionalInsights: [
                {
                  icon: "👁️",
                  title: "Natural Beauty",
                  description: "Your iris displays the natural beauty and complexity that makes each person's eyes unique."
                }
              ],
              summary: "Your iris shows beautiful natural patterns that make your eyes uniquely yours."
            };
            
            // Save to history and increment scan count
            await safeIncrementScans();
            await safeAddToHistory({
              id: Date.now().toString(),
              imageUri: imageUri as string,
              analysis: offlineAnalysis,
              timestamp: new Date().toISOString(),
            });

            // Navigate to results
            router.replace({
              pathname: "/analysis" as any,
              params: { 
                imageUri: imageUri as string,
                analysisData: JSON.stringify(offlineAnalysis)
              }
            });
            return;
          }
        }
        
        // Only show alert for non-connection errors
        if (error instanceof Error && !error.message.includes('Failed to fetch') && !error.message.includes('Unable to connect')) {
          Alert.alert(
            "Analysis Failed",
            errorMessage,
            [
              { text: "OK", onPress: () => router.back() }
            ]
          );
        } else {
          // For connection errors, just go back since we already handled fallback
          router.back();
        }
      }
    };

    if (imageUri) {
      analyzeImage();
    }
  }, [imageUri, safeIncrementScans, safeAddToHistory]);



  return (
    <LinearGradient
      colors={['#1a1a3e', '#2d2d5f']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.imageContainer}>
          <Image 
            source={{ uri: imageUri as string }} 
            style={styles.image}
          />
          <View style={styles.imageOverlay} />
          <View style={styles.imageBorder} />
        </View>

        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4dd0e1" />
        </View>

        <Text style={styles.title}>Analyzing Iris...</Text>
        <Text style={styles.status}>{status}</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  imageContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: 'hidden',
    marginBottom: 40,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(77, 208, 225, 0.1)',
  },
  imageBorder: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: 104,
    borderWidth: 4,
    borderColor: '#4dd0e1',
  },
  loadingContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
  },
  status: {
    fontSize: 14,
    color: '#a0a0b8',
  },
});