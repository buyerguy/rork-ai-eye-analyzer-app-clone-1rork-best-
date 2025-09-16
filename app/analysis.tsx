import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Share,
  Modal,
  Pressable,
  Platform,

} from "react-native";
import { Share2, Save, ArrowLeft, Eye, Shield, X, Wifi } from "lucide-react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useApp } from "@/providers/AppProvider";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface PatternInfo {
  name: string;
  description: string;
  icon: string;
}

const patternDescriptions: Record<string, PatternInfo> = {
  "Radiant Crypts": {
    name: "Radiant Crypts",
    description: "Observe the subtle, intricate openings within your iris, especially around the pupil, which create a captivating radial pattern, unique to your eye's architecture.",
    icon: "✨"
  },
  "Distinct Limbal Ring": {
    name: "Distinct Limbal Ring",
    description: "The dark ring around the outer edge of your iris creates a striking contrast, enhancing the depth and definition of your eye color.",
    icon: "⭕"
  },
  "Nordic Echoes": {
    name: "Nordic Echoes",
    description: "The clear, bright blue of your irises is a charming trait often found predominantly in populations tracing their origins back to Northern Europe.",
    icon: "🌍"
  },
  "Light's Gentle Reminder": {
    name: "Light's Gentle Reminder",
    description: "With less melanin to absorb light, your vibrant blue eyes may be more sensitive to bright sunlight. It's a fun reminder to shield them with stylish sunglasses on sunny days!",
    icon: "☀️"
  }
};

export default function AnalysisScreen() {
  const { isDarkMode } = useApp();
  const { imageUri, analysisData } = useLocalSearchParams();
  const analysis = JSON.parse(analysisData as string);
  const [selectedPattern, setSelectedPattern] = useState<PatternInfo | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handlePatternPress = (patternName: string) => {
    const pattern = patternDescriptions[patternName];
    if (pattern) {
      setSelectedPattern(pattern);
      setModalVisible(true);
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedPattern(null);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my iris analysis! ${analysis.summary}`,
      });
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  const handleSave = async () => {
    try {
      // Create the analysis text content
      const analysisText = `IRIS ANALYSIS REPORT
${'='.repeat(50)}

Generated on: ${new Date().toLocaleDateString()}

🔍 UNIQUE PATTERNS DETECTED:
• ✨ Radiant Crypts - Observe the subtle, intricate openings within your iris, especially around the pupil, which create a captivating radial pattern, unique to your eye's architecture.
• ⭕ Distinct Limbal Ring - The dark ring around the outer edge of your iris creates a striking contrast, enhancing the depth and definition of your eye color.

💎 RARITY ANALYSIS:
Blue eyes are a less common gem, gracing about 8-10% of the global population. This puts your captivating azure gaze in a special category compared to the more prevalent brown and hazel shades.
Rarity Score: 91%

🌍 NORDIC ECHOES:
The striking light blue hue, coupled with the distinct structural patterns, is a signature often observed in populations originating from Northern Europe, including regions like Scandinavia and the British Isles.

Global Prevalence: 9%
Regional Hotspots: Northern Europe, Scandinavia
Genetic Probability: 1:12

☀️ LIGHT SENSITIVITY:
With less melanin to absorb light, your vibrant blue eyes may be more sensitive to bright sunlight. It's a fun reminder to shield them with stylish sunglasses on sunny days!

🌊 YOUR UNIQUE AZURE BLUEPRINT:
Your iris boasts an intricate arrangement of delicate fibers and crypts, forming a pattern as unique as a snowflake. This individual blueprint is one of nature's most sophisticated personal identifiers.

✨ THE CALM INNOVATOR:
Folks with blue eyes are often perceived as thoughtful, calm, and possessing a deep intellectual curiosity. Your tranquil gaze might suggest a reflective nature and a keen eye for detail.

👁️ CLEAR AZURE DEPTHS:
Your iris presents a beautifully consistent and clear light blue field. While lacking dramatic central heterochromia or prominent freckles, the subtle interplay of light and shadow within its fibers creates a captivating, uniform depth.

🛡️ HEALTH INDICATORS:

• Energetic Flow Lines - NORMAL
  The presence of fine, radial lines extending from the pupil, sometimes called 'radii solaris' in iridology, could playfully suggest an active and expressive energetic system within you.

• Subtle Focus Rings - NORMAL
  Faint, almost imperceptible concentric rings are observed, which in iridology are sometimes linked to periods of intense concentration or perhaps a 'go-getter' attitude. Think of them as tiny rings of determination!

${'='.repeat(50)}
Disclaimer: These indicators are for entertainment purposes only and are not medical advice.

Generated by Iris Analysis App`;

      if (Platform.OS === 'web') {
        // Web implementation - create and download file
        const blob = new Blob([analysisText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `iris-analysis-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        console.log('Analysis saved to downloads folder');
      } else {
        // Mobile implementation - use expo-file-system and expo-sharing
        const fileName = `iris-analysis-${new Date().toISOString().split('T')[0]}.txt`;
        const fileUri = FileSystem.documentDirectory + fileName;
        
        await FileSystem.writeAsStringAsync(fileUri, analysisText, {
          encoding: FileSystem.EncodingType.UTF8,
        });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/plain',
            dialogTitle: 'Save Iris Analysis',
          });
        } else {
          console.log(`Analysis saved as ${fileName}`);
        }
      }
    } catch (error) {
      console.error('Save error:', error);
      console.error('Failed to save analysis. Please try again.');
    }
  };

  const handleAnalyzeAnother = () => {
    router.replace("/home");
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a3e' : '#f8fafc' }]}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Your Iris Analysis</Text>
            <Text style={[styles.subtitle, { color: isDarkMode ? '#a0a0b8' : '#6b7280' }]}>Here&apos;s what our AI discovered in your eye.</Text>
          </View>

          {/* Iris Image */}
          <View style={[styles.imageCard, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff' }]}>
            <View style={styles.imageContainer}>
              <Image source={{ uri: imageUri as string }} style={styles.irisImage} />
            </View>
            <Text style={[styles.imageCaption, { color: isDarkMode ? '#8a8aa0' : '#6b7280' }]}>Your unique iris</Text>
          </View>

          {/* Unique Patterns Section */}
          <View style={[styles.section, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff' }]}>
            <View style={styles.sectionHeader}>
              <Eye size={20} color={isDarkMode ? '#8a8aa0' : '#374151'} />
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Unique Patterns Detected</Text>
            </View>
            <View style={styles.patternTags}>
              <TouchableOpacity 
                style={styles.patternTag}
                onPress={() => handlePatternPress("Radiant Crypts")}
              >
                <Text style={styles.patternTagText}>✨ Radiant Crypts</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.patternTag}
                onPress={() => handlePatternPress("Distinct Limbal Ring")}
              >
                <Text style={styles.patternTagText}>⭕ Distinct Limbal Ring</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Rarity Section */}
          <View style={[styles.section, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff' }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.rarityIcon}>💎</Text>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>A Touch of Rarity</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>
              Blue eyes are a less common gem, gracing about 8-10% of the global population. This puts your 
              captivating azure gaze in a special category compared to the more prevalent brown and hazel 
              shades.
            </Text>
            <View style={styles.rarityContainer}>
              <Text style={[styles.rarityLabel, { color: isDarkMode ? '#8a8aa0' : '#6b7280' }]}>Rare</Text>
              <Text style={[styles.rarityLabel, { color: isDarkMode ? '#8a8aa0' : '#6b7280' }]}>Common</Text>
            </View>
            <View style={styles.rarityBar}>
              <View style={styles.rarityFill} />
            </View>
            <Text style={styles.rarityPercentage}>91% Rarity</Text>
          </View>

          {/* Northern European Section */}
          <TouchableOpacity 
            style={[styles.section, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff' }]}
            onPress={() => handlePatternPress("Nordic Echoes")}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.rarityIcon}>🌍</Text>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Nordic Echoes</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>
              The striking light blue hue, coupled with the distinct structural patterns, is a signature often 
              observed in populations originating from Northern Europe, including regions like Scandinavia 
              and the British Isles.
            </Text>
            <View style={styles.metricsContainer}>
              <View style={styles.metric}>
                <Text style={styles.metricIcon}>📊</Text>
                <Text style={[styles.metricLabel, { color: isDarkMode ? '#8a8aa0' : '#6b7280' }]}>Global Prevalence:</Text>
                <Text style={[styles.metricValue, { color: isDarkMode ? '#fff' : '#1f2937' }]}>9%</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricIcon}>🌍</Text>
                <Text style={[styles.metricLabel, { color: isDarkMode ? '#8a8aa0' : '#6b7280' }]}>Regional Hotspots:</Text>
                <Text style={[styles.metricValue, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Northern Europe, Scandinavia</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricIcon}>🧬</Text>
                <Text style={[styles.metricLabel, { color: isDarkMode ? '#8a8aa0' : '#6b7280' }]}>Genetic Probability:</Text>
                <Text style={[styles.metricValue, { color: isDarkMode ? '#fff' : '#1f2937' }]}>1:12</Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Light Sensitivity Section */}
          <TouchableOpacity 
            style={[styles.section, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff' }]}
            onPress={() => handlePatternPress("Light's Gentle Reminder")}
          >
            <View style={styles.sectionHeader}>
              <Text style={styles.rarityIcon}>☀️</Text>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Light&apos;s Gentle Reminder</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>
              With less melanin to absorb light, your vibrant blue eyes may be more sensitive to bright sunlight. It&apos;s a 
              fun reminder to shield them with stylish sunglasses on sunny days!
            </Text>
          </TouchableOpacity>

          {/* Azure Blueprint Section */}
          <View style={[styles.section, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff' }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.rarityIcon}>🌊</Text>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Your Unique Azure Blueprint</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>
              Your iris boasts an intricate arrangement of delicate fibers and crypts, forming a pattern as 
              unique as a snowflake. This individual blueprint is one of nature&apos;s most sophisticated personal 
              identifiers.
            </Text>
          </View>

          {/* Calm Innovator Section */}
          <View style={[styles.section, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff' }]}>
            <View style={styles.sectionHeader}>
              <Text style={styles.rarityIcon}>✨</Text>
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>The Calm Innovator</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>
              Folks with blue eyes are often perceived as thoughtful, calm, and possessing a deep intellectual 
              curiosity. Your tranquil gaze might suggest a reflective nature and a keen eye for detail.
            </Text>
          </View>

          {/* Clear Azure Depths Section */}
          <View style={[styles.section, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff' }]}>
            <View style={styles.sectionHeader}>
              <Eye size={20} color={isDarkMode ? '#8a8aa0' : '#374151'} />
              <Text style={[styles.sectionTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Clear Azure Depths</Text>
            </View>
            <Text style={[styles.sectionDescription, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>
              Your iris presents a beautifully consistent and clear light blue field. While lacking dramatic 
              central heterochromia or prominent freckles, the subtle interplay of light and shadow within its 
              fibers creates a captivating, uniform depth.
            </Text>
          </View>

          {/* Health Indicators Section */}
          <View style={styles.healthSection}>
            <Text style={[styles.healthTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Health Indicators</Text>
            
            <View style={[styles.healthCard, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff' }]}>
              <Shield size={24} color={isDarkMode ? '#8a8aa0' : '#6b7280'} />
              <View style={styles.healthContent}>
                <Text style={[styles.healthItemTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Energetic Flow Lines</Text>
                <View style={[styles.healthStatus, { backgroundColor: isDarkMode ? '#3a3a5a' : '#f3f4f6' }]}>
                  <Text style={[styles.healthStatusText, { color: isDarkMode ? '#8a8aa0' : '#6b7280' }]}>NORMAL</Text>
                </View>
                <Text style={[styles.healthDescription, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>
                  The presence of fine, radial lines extending from the pupil, sometimes called &apos;radii solaris&apos; in 
                  iridology, could playfully suggest an active and expressive energetic system within you.
                </Text>
              </View>
            </View>

            <View style={[styles.healthCard, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff' }]}>
              <Shield size={24} color={isDarkMode ? '#8a8aa0' : '#6b7280'} />
              <View style={styles.healthContent}>
                <Text style={[styles.healthItemTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Subtle Focus Rings</Text>
                <View style={[styles.healthStatus, { backgroundColor: isDarkMode ? '#3a3a5a' : '#f3f4f6' }]}>
                  <Text style={[styles.healthStatusText, { color: isDarkMode ? '#8a8aa0' : '#6b7280' }]}>NORMAL</Text>
                </View>
                <Text style={[styles.healthDescription, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>
                  Faint, almost imperceptible concentric rings are observed, which in iridology are sometimes 
                  linked to periods of intense concentration or perhaps a &apos;go-getter&apos; attitude. Think of them as tiny 
                  rings of determination!
                </Text>
              </View>
            </View>

            <Text style={styles.disclaimer}>
              Disclaimer: These indicators are for entertainment purposes only and are not medical advice.
            </Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={[styles.shareButton, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff', borderColor: '#6366f1' }]} onPress={handleShare}>
              <Share2 size={18} color="#6366f1" />
              <Text style={styles.shareButtonText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Save size={18} color="#ffffff" />
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.analyzeButton} onPress={handleAnalyzeAnother}>
              <ArrowLeft size={18} color="#ffffff" />
              <Text style={styles.analyzeButtonText}>Analyze Another</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>

      {/* Pattern Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalBackdrop} onPress={closeModal} />
          <View style={[styles.modalContent, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff' }]}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Wifi size={24} color="#10b981" />
                <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>{selectedPattern?.name}</Text>
              </View>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <X size={24} color={isDarkMode ? '#8a8aa0' : '#6b7280'} />
              </TouchableOpacity>
            </View>
            <Text style={[styles.modalDescription, { color: isDarkMode ? '#a0a0b8' : '#4b5563' }]}>
              {selectedPattern?.description}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  imageCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#10b981',
    padding: 4,
    marginBottom: 12,
  },
  irisImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  imageCaption: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  patternTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  patternTag: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  patternTagText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  clickHere: {
    color: '#6366f1',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  rarityIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  rarityContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 4,
  },
  rarityLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  rarityBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  rarityFill: {
    height: '100%',
    width: '91%',
    backgroundColor: '#ec4899',
    borderRadius: 4,
  },
  rarityPercentage: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ec4899',
    textAlign: 'center',
  },
  metricsContainer: {
    marginTop: 16,
    gap: 12,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  metricLabel: {
    fontSize: 14,
    color: '#6b7280',
    flex: 1,
  },
  metricValue: {
    fontSize: 14,
    color: '#1f2937',
    fontWeight: '500',
  },
  healthSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  healthTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 20,
  },
  healthCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  healthContent: {
    flex: 1,
    marginLeft: 12,
  },
  healthItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  healthStatus: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  healthStatusText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  healthDescription: {
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  disclaimer: {
    fontSize: 12,
    color: '#6366f1',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 40,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  shareButtonText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  analyzeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 6,
    minHeight: 48,
  },
  analyzeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginLeft: 8,
  },
  closeButton: {
    padding: 4,
  },
  modalDescription: {
    fontSize: 16,
    color: '#4b5563',
    lineHeight: 24,
  },
});