/*
 * @Author: jihao00122 52628008+jihao00122@users.noreply.github.com
 * @Date: 2025-05-27 15:28:24
 * @LastEditors: jihao00122 52628008+jihao00122@users.noreply.github.com
 * @LastEditTime: 2025-05-27 16:14:53
 * @FilePath: /AiA/App.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar, useColorScheme } from 'react-native';
import { AuthProvider } from './src/context/AuthContext';
import { SocketProvider } from './src/context/SocketContext';
import AppNavigator from './src/navigation/AppNavigator';
import { Colors } from './src/utils/colors';

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? Colors.dark.background : Colors.light.background}
      />
      <AuthProvider>
        <SocketProvider>
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </SocketProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
