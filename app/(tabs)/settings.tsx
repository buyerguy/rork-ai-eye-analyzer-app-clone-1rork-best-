import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Trash2, Moon, Globe, CreditCard, Mail, Star } from "lucide-react-native";
import { router } from "expo-router";
import { useApp } from "@/providers/AppProvider";
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';

export default function SettingsScreen() {
  const { userData, isDarkMode, setDarkMode, clearHistory, isPro, mockPurchase } = useApp();

  const handleClearHistory = async () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all scan history? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: async () => {
            try {
              await clearHistory();
              Alert.alert("Success", "History cleared successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to clear history. Please try again.");
            }
          }
        }
      ]
    );
  };

  const handleManageSubscription = async () => {
    try {
      await WebBrowser.openBrowserAsync('https://play.google.com/store/account/subscriptions');
    } catch (error) {
      console.error('Failed to open subscription management:', error);
      Alert.alert('Error', 'Failed to open subscription management');
    }
  };

  const handleSupport = async () => {
    try {
      const emailUrl = 'mailto:savemoresuppliers.com?subject=Iris Analyzer Support';
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      } else {
        Alert.alert('Error', 'No email app found on your device');
      }
    } catch (error) {
      console.error('Failed to open email:', error);
      Alert.alert('Error', 'Failed to open email app');
    }
  };

  const handleMockPurchase = async () => {
    try {
      await mockPurchase();
      Alert.alert('Success', 'Mock subscription activated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to activate subscription');
    }
  };

  return (
    <LinearGradient
      colors={isDarkMode ? ['#1a1a3e', '#2d2d5f'] : ['#f8fafc', '#e2e8f0']}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ChevronLeft size={24} color={isDarkMode ? "#fff" : "#1f2937"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Settings</Text>
          <View style={styles.spacer} />
        </View>

        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {/* Account Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#8a8aa0' : '#8a8aa0' }]}>Account</Text>
            <View style={[styles.settingItem, { borderBottomColor: isDarkMode ? 'rgba(138, 138, 160, 0.2)' : 'rgba(138, 138, 160, 0.1)' }]}>
              <View style={styles.settingLeft}>
                <Globe size={20} color="#8a8aa0" />
                <View>
                  <Text style={[styles.settingLabel, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Scans Used</Text>
                  <Text style={[styles.settingDescription, { color: isDarkMode ? '#8a8aa0' : '#8a8aa0' }]}>
                    {userData?.scansUsed || 0} / {isPro ? '∞' : (userData?.weeklyLimit || 3)} this week
                  </Text>
                </View>
              </View>
              <Text style={[styles.settingValue, { color: isDarkMode ? '#8a8aa0' : '#8a8aa0' }]}>
                {isPro ? 'Premium' : 'Free'}
              </Text>
            </View>
          </View>

          {/* App Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#8a8aa0' : '#8a8aa0' }]}>App Settings</Text>
            <View style={[styles.settingItem, { borderBottomColor: isDarkMode ? 'rgba(138, 138, 160, 0.2)' : 'rgba(138, 138, 160, 0.1)' }]}>
              <View style={styles.settingLeft}>
                <Moon size={20} color="#8a8aa0" />
                <Text style={[styles.settingLabel, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDarkMode}
                onValueChange={setDarkMode}
                trackColor={{ false: '#3a3a5c', true: '#4dd0e1' }}
                thumbColor="#fff"
              />
            </View>
          </View>

          {/* Support */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#8a8aa0' : '#8a8aa0' }]}>Support</Text>
            <TouchableOpacity 
              style={[styles.settingItem, { borderBottomColor: isDarkMode ? 'rgba(138, 138, 160, 0.2)' : 'rgba(138, 138, 160, 0.1)' }]} 
              onPress={handleManageSubscription}
            >
              <View style={styles.settingLeft}>
                <CreditCard size={20} color="#8a8aa0" />
                <View>
                  <Text style={[styles.settingLabel, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Manage Subscription</Text>
                  <Text style={[styles.settingDescription, { color: isDarkMode ? '#8a8aa0' : '#8a8aa0' }]}>
                    {isPro ? 'Premium Active' : 'Free Plan'}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.settingItem, { borderBottomColor: isDarkMode ? 'rgba(138, 138, 160, 0.2)' : 'rgba(138, 138, 160, 0.1)' }]} 
              onPress={handleSupport}
            >
              <View style={styles.settingLeft}>
                <Mail size={20} color="#8a8aa0" />
                <Text style={[styles.settingLabel, { color: isDarkMode ? '#fff' : '#1f2937' }]}>Support</Text>
              </View>
            </TouchableOpacity>
            
            {/* Mock purchase button for development */}
            {!isPro && (
              <TouchableOpacity 
                style={[styles.settingItem, { borderBottomColor: isDarkMode ? 'rgba(138, 138, 160, 0.2)' : 'rgba(138, 138, 160, 0.1)' }]} 
                onPress={handleMockPurchase}
              >
                <View style={styles.settingLeft}>
                  <Star size={20} color="#4dd0e1" />
                  <View>
                    <Text style={[styles.settingLabel, { color: '#4dd0e1' }]}>Activate Premium (Dev)</Text>
                    <Text style={[styles.settingDescription, { color: isDarkMode ? '#8a8aa0' : '#8a8aa0' }]}>
                      Mock subscription for testing
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Data & Privacy */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#8a8aa0' : '#8a8aa0' }]}>Data & Privacy</Text>
            <TouchableOpacity style={[styles.settingItem, { borderBottomColor: 'transparent' }]} onPress={handleClearHistory}>
              <View style={styles.settingLeft}>
                <Trash2 size={20} color="#ff6b9d" />
                <Text style={[styles.settingLabel, { color: '#ff6b9d' }]}>Clear History</Text>
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8a8aa0',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(138, 138, 160, 0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
  },
  settingDescription: {
    fontSize: 12,
    color: '#8a8aa0',
    marginTop: 2,
  },
  settingValue: {
    fontSize: 14,
    color: '#8a8aa0',
  },
  spacer: {
    width: 24,
  },
});