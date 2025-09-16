import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useApp } from '@/providers/AppProvider';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';

export default function Index() {
  const { isAuthLoading, initializeApp } = useApp();

  useEffect(() => {
    initializeApp();
  }, [initializeApp]);

  if (isAuthLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4dd0e1" />
        <Text style={styles.text}>Initializing...</Text>
      </View>
    );
  }

  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a3e',
  },
  text: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
});