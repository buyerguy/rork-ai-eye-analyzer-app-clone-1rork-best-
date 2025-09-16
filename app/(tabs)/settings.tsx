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
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { ChevronLeft, Trash2, Moon, Globe, CreditCard, Mail } from "lucide-react-native";
import { router } from "expo-router";
import { useApp } from "@/providers/AppProvider";

export default function SettingsScreen() {
  const { scansUsed, weeklyLimit, clearHistory, isDarkMode, setDarkMode } = useApp();

  const handleClearHistory = () => {
    Alert.alert(
      "Clear History",
      "Are you sure you want to clear all scan history?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Clear", 
          style: "destructive",
          onPress: () => {
            clearHistory();
            Alert.alert("Success", "Scan history cleared");
          }
        }
      ]
    );
  };

  const handleManageSubscription = () => {
    Linking.openURL('https://play.google.com/store/account/subscriptions');
  };

  const handleSupport = () => {
    Linking.openURL('mailto:savemoresuppliers.com');
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
                  <Text style={[styles.settingLabel, { color: isDarkMode ? '#fff' : '#fff' }]}>Scans Used</Text>
                  <Text style={[styles.settingDescription, { color: isDarkMode ? '#8a8aa0' : '#8a8aa0' }]}>
                    {scansUsed} / {weeklyLimit} this week
                  </Text>
                </View>
              </View>
              <Text style={[styles.settingValue, { color: isDarkMode ? '#8a8aa0' : '#8a8aa0' }]}>Free</Text>
            </View>
          </View>

          {/* App Settings */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isDarkMode ? '#8a8aa0' : '#8a8aa0' }]}>App Settings</Text>
            <View style={[styles.settingItem, { borderBottomColor: isDarkMode ? 'rgba(138, 138, 160, 0.2)' : 'rgba(138, 138, 160, 0.1)' }]}>
              <View style={styles.settingLeft}>
                <Moon size={20} color="#8a8aa0" />
                <Text style={[styles.settingLabel, { color: isDarkMode ? '#fff' : '#fff' }]}>Dark Mode</Text>
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
            <TouchableOpacity style={[styles.settingItem, { borderBottomColor: isDarkMode ? 'rgba(138, 138, 160, 0.2)' : 'rgba(138, 138, 160, 0.1)' }]} onPress={handleManageSubscription}>
              <View style={styles.settingLeft}>
                <CreditCard size={20} color="#8a8aa0" />
                <Text style={[styles.settingLabel, { color: isDarkMode ? '#fff' : '#fff' }]}>Manage Subscription</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.settingItem, { borderBottomColor: isDarkMode ? 'rgba(138, 138, 160, 0.2)' : 'rgba(138, 138, 160, 0.1)' }]} onPress={handleSupport}>
              <View style={styles.settingLeft}>
                <Mail size={20} color="#8a8aa0" />
                <Text style={[styles.settingLabel, { color: isDarkMode ? '#fff' : '#fff' }]}>Support</Text>
              </View>
            </TouchableOpacity>
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