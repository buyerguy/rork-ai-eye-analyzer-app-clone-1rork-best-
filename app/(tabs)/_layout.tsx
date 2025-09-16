import { Tabs } from "expo-router";
import { Home, History, Settings } from "lucide-react-native";
import React from "react";
import { StyleSheet } from "react-native";
import { useApp } from "@/providers/AppProvider";

export default function TabLayout() {
  const { isDarkMode } = useApp();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: isDarkMode ? '#2a2a4a' : '#ffffff',
            borderTopColor: isDarkMode ? '#3a3a5a' : '#e5e7eb',
          }
        ],
        tabBarActiveTintColor: "#6366f1",
        tabBarInactiveTintColor: isDarkMode ? "#8a8aa0" : "#9ca3af",
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <History size={20} color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color }) => <Settings size={20} color={color} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    height: 80,
    paddingBottom: 20,
    paddingTop: 8,
  },
  tabBarLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
});