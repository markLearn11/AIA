import React from 'react';
import { View, ActivityIndicator, StyleSheet, Text, useColorScheme } from 'react-native';
import { Colors } from '../utils/colors';

const LoadingScreen: React.FC = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.text, { color: colors.text }]}>加载中...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: 16,
    fontSize: 16,
  },
});

export default LoadingScreen; 