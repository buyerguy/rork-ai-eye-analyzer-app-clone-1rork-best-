import React, { useState, useEffect, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
} from "react-native";
import { Eye, Calendar, ChevronRight, Trash2 } from "lucide-react-native";
import { router } from "expo-router";
import { useApp } from "@/providers/AppProvider";
import { firebaseService } from "@/services/firebaseService";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HistoryItem {
  id: string;
  imageUri: string;
  analysis: any;
  timestamp: string;
  date: string;
  time: string;
  rarity?: string;
}

export default function HistoryScreen() {
  const { isDarkMode, user, analysisHistory, isHistoryLoading, clearHistory, getLocalHistory, clearLocalHistory } = useApp();
  const [localHistory, setLocalHistory] = useState<HistoryItem[]>([]);
  const [isLoadingLocal, setIsLoadingLocal] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const insets = useSafeAreaInsets();
  
  // Load local history if user is not authenticated
  const loadLocalHistory = useCallback(async () => {
    if (user) return; // Skip if user is authenticated (use Firebase history)
    
    try {
      setIsLoadingLocal(true);
      const history = await getLocalHistory();
      setLocalHistory(history);
    } catch (error) {
      console.error('Error loading local history:', error);
    } finally {
      setIsLoadingLocal(false);
    }
  }, [user, getLocalHistory]);
  
  // Handle clear history button
  const handleClearHistory = useCallback(() => {
    setShowClearModal(true);
  }, []);
  
  // Confirm clear history
  const confirmClearHistory = useCallback(async () => {
    try {
      if (user) {
        await clearHistory();
      } else {
        await clearLocalHistory();
        setLocalHistory([]);
      }
      setShowClearModal(false);
    } catch (error) {
      console.error('Error clearing history:', error);
    }
  }, [user, clearHistory, clearLocalHistory]);
  
  // Load local history on component mount
  useEffect(() => {
    loadLocalHistory();
  }, [loadLocalHistory]);
  
  // Get display history (Firebase or local)
  const displayHistory = user ? analysisHistory : localHistory;
  const isLoading = user ? isHistoryLoading : isLoadingLocal;
  
  // Convert Firebase history to display format
  const formatHistoryForDisplay = useCallback((history: any[]): HistoryItem[] => {
    return history.map((item) => {
      let imageUri = item.imageUri;
      let analysis = item.analysis;
      let timestamp = item.timestamp;
      
      // Handle Firebase history format
      if (item.imageStoragePath && !item.imageUri) {
        // For Firebase history, we'll need to get the download URL
        // For now, use a placeholder or the storage path
        imageUri = item.imageStoragePath;
      }
      
      // Handle timestamp conversion
      let date: Date;
      if (timestamp?.toDate) {
        date = timestamp.toDate();
      } else if (timestamp) {
        date = new Date(timestamp);
      } else {
        date = new Date();
      }
      
      return {
        id: item.id,
        imageUri,
        analysis,
        timestamp: date.toISOString(),
        date: date.toLocaleDateString(),
        time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        rarity: analysis?.rarity?.percentage ? `${analysis.rarity.percentage}% Rarity` : undefined
      };
    });
  }, []);
  
  const formattedHistory = formatHistoryForDisplay(displayHistory);
  
  const handleViewAnalysis = useCallback(async (item: HistoryItem) => {
    if (!item?.id?.trim()) return;
    
    try {
      let imageUri = item.imageUri;
      
      // If this is a Firebase storage path, get the download URL
      if (user && item.imageUri && !item.imageUri.startsWith('http') && !item.imageUri.startsWith('file://') && !item.imageUri.startsWith('data:')) {
        try {
          imageUri = await firebaseService.getImageDownloadURL(item.imageUri);
        } catch (error) {
          console.error('Error getting download URL:', error);
          // Use original URI as fallback
        }
      }
      
      router.push({
        pathname: "/analysis" as any,
        params: { 
          imageUri,
          analysisData: JSON.stringify(item.analysis)
        }
      });
    } catch (error) {
      console.error('Error viewing analysis:', error);
    }
  }, [user]);

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a1a3e' : '#f8fafc' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <View style={styles.headerContent}>
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Analysis History</Text>
          <Text style={[styles.subtitle, { color: isDarkMode ? '#a0a0b8' : '#6b7280' }]}>Your previous iris analyses</Text>
        </View>
        {formattedHistory.length > 0 && (
          <TouchableOpacity 
            style={styles.clearButton}
            onPress={handleClearHistory}
          >
            <Trash2 size={20} color={isDarkMode ? '#ff6b6b' : '#ef4444'} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={isDarkMode ? '#4dd0e1' : '#7c4dff'} />
            <Text style={[styles.loadingText, { color: isDarkMode ? '#a0a0b8' : '#6b7280' }]}>
              Loading your analysis history...
            </Text>
          </View>
        ) : formattedHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Eye size={48} color={isDarkMode ? '#6b7280' : '#9ca3af'} />
            <Text style={[styles.emptyTitle, { color: isDarkMode ? '#e5e7eb' : '#374151' }]}>No analyses yet</Text>
            <Text style={[styles.emptyDescription, { color: isDarkMode ? '#a0a0b8' : '#6b7280' }]}>
              Start by analyzing your first iris photo
            </Text>
            {!user && (
              <Text style={[styles.offlineNote, { color: isDarkMode ? '#8a8aa0' : '#9ca3af' }]}>
                Sign in to sync your history across devices
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.historyList}>
            {formattedHistory.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.historyItem, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff' }]}
                onPress={() => handleViewAnalysis(item)}
                activeOpacity={0.7}
              >
                <View style={styles.imageContainer}>
                  {item.imageUri && item.imageUri.startsWith('http') ? (
                    <Image 
                      source={{ uri: item.imageUri }} 
                      style={styles.eyeImage}
                      defaultSource={require('@/assets/images/icon.png')}
                    />
                  ) : (
                    <View style={[styles.eyeImagePlaceholder, { backgroundColor: isDarkMode ? '#3a3a5a' : '#e5e7eb' }]}>
                      <Eye size={24} color={isDarkMode ? '#6b7280' : '#9ca3af'} />
                    </View>
                  )}
                </View>
                
                <View style={styles.itemContent}>
                  <Text style={[styles.analysisTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>
                    {item.analysis?.pattern?.name || item.analysis?.summary || 'Iris Analysis'}
                  </Text>
                  {item.rarity && (
                    <Text style={styles.rarityText}>{item.rarity}</Text>
                  )}
                  <View style={styles.dateContainer}>
                    <Calendar size={14} color="#6b7280" />
                    <Text style={[styles.dateText, { color: isDarkMode ? '#8a8aa0' : '#6b7280' }]}>
                      {item.date} at {item.time}
                    </Text>
                  </View>
                </View>
                
                <ChevronRight size={20} color={isDarkMode ? '#6b7280' : '#9ca3af'} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
      
      {/* Clear History Modal */}
      {showClearModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff' }]}>
            <Text style={[styles.modalTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Clear History</Text>
            <Text style={[styles.modalText, { color: isDarkMode ? '#a0a0b8' : '#6b7280' }]}>
              Are you sure you want to delete all your analysis history? This action cannot be undone.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowClearModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmModalButton]}
                onPress={confirmClearHistory}
              >
                <Text style={styles.confirmModalButtonText}>Clear All</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
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
  clearButton: {
    padding: 8,
    borderRadius: 8,
  },
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 16,
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
    marginBottom: 16,
  },
  offlineNote: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  eyeImagePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e5e7eb',
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
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    marginHorizontal: 20,
    maxWidth: 400,
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelModalButton: {
    backgroundColor: '#f3f4f6',
  },
  confirmModalButton: {
    backgroundColor: '#ef4444',
  },
  cancelModalButtonText: {
    color: '#6b7280',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmModalButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});