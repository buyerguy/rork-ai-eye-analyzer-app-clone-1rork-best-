import React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Image,
} from "react-native";
import { Eye, Calendar, ChevronRight } from "lucide-react-native";
import { router } from "expo-router";
import { useApp } from "@/providers/AppProvider";

// Mock data for history
const historyData = [
  {
    id: 1,
    date: "2025-09-12",
    time: "2:28 PM",
    imageUri: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=200&h=200&fit=crop&crop=face",
    analysis: "Northern European Echoes",
    rarity: "91% Rarity",
  },
  {
    id: 2,
    date: "2025-09-10",
    time: "4:15 PM",
    imageUri: "https://images.unsplash.com/photo-1596815064285-45ed8a9c0463?w=200&h=200&fit=crop&crop=face",
    analysis: "Mediterranean Warmth",
    rarity: "73% Rarity",
  },
  {
    id: 3,
    date: "2025-09-08",
    time: "11:30 AM",
    imageUri: "https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=200&h=200&fit=crop&crop=face",
    analysis: "Celtic Heritage",
    rarity: "85% Rarity",
  },
];

export default function HistoryScreen() {
  const { isDarkMode } = useApp();
  const handleViewAnalysis = (item: any) => {
    if (!item?.analysis?.trim()) return;
    
    // Navigate to analysis screen with mock data
    const mockAnalysis = {
      pattern: {
        name: item.analysis,
        description: "Your unique iris pattern tells a fascinating story.",
        metrics: {
          prevalence: "9%",
          regions: "Northern Europe, Scandinavia",
          genetic: "1:12"
        }
      },
      sensitivity: {
        name: "Radiant Light Sensitivity",
        description: "Your eyes might be more sensitive to bright sunlight."
      },
      uniquePatterns: ["Radiant Crypts", "Distinct Limbal Ring"],
      rarity: {
        title: "A Touch of Rarity",
        description: "Your eye color is quite rare in the global population.",
        percentage: parseInt(item.rarity) || 50
      },
      additionalInsights: [
        {
          icon: "🌊",
          title: "Your Unique Azure Blueprint",
          description: "Your iris boasts an intricate arrangement of delicate fibers."
        }
      ]
    };

    router.push({
      pathname: "/analysis" as any,
      params: { 
        imageUri: item.imageUri,
        analysisData: JSON.stringify(mockAnalysis)
      }
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a3e' : '#f8fafc' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Analysis History</Text>
        <Text style={[styles.subtitle, { color: isDarkMode ? '#a0a0b8' : '#6b7280' }]}>Your previous iris analyses</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {historyData.length === 0 ? (
          <View style={styles.emptyState}>
            <Eye size={48} color={isDarkMode ? '#6b7280' : '#9ca3af'} />
            <Text style={[styles.emptyTitle, { color: isDarkMode ? '#e5e7eb' : '#374151' }]}>No analyses yet</Text>
            <Text style={[styles.emptyDescription, { color: isDarkMode ? '#a0a0b8' : '#6b7280' }]}>
              Start by analyzing your first iris photo
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {historyData.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.historyItem, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff' }]}
                onPress={() => handleViewAnalysis(item)}
                activeOpacity={0.7}
              >
                <View style={styles.imageContainer}>
                  <Image source={{ uri: item.imageUri }} style={styles.eyeImage} />
                </View>
                
                <View style={styles.itemContent}>
                  <Text style={[styles.analysisTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>{item.analysis}</Text>
                  <Text style={styles.rarityText}>{item.rarity}</Text>
                  <View style={styles.dateContainer}>
                    <Calendar size={14} color="#6b7280" />
                    <Text style={[styles.dateText, { color: isDarkMode ? '#8a8aa0' : '#6b7280' }]}>{item.date} at {item.time}</Text>
                  </View>
                </View>
                
                <ChevronRight size={20} color={isDarkMode ? '#6b7280' : '#9ca3af'} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    paddingTop: 60,
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  historyList: {
    gap: 12,
    paddingBottom: 24,
  },
  historyItem: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  imageContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#10b981',
    padding: 2,
    marginRight: 16,
  },
  eyeImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  itemContent: {
    flex: 1,
  },
  analysisTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  rarityText: {
    fontSize: 14,
    color: '#ec4899',
    fontWeight: '500',
    marginBottom: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#6b7280',
  },
});