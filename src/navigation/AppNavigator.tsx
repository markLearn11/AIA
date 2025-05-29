import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useColorScheme } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../context/AuthContext';
import { Colors } from '../utils/colors';
import { RouteProp } from '@react-navigation/native';

// 导入屏幕
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ConversationsScreen from '../screens/main/ConversationsScreen';
import ChatScreen from '../screens/main/ChatScreen';
import ContactsScreen from '../screens/main/ContactsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import LoadingScreen from '../screens/LoadingScreen';

// 定义导航参数类型
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Chat: { conversationId: string; name: string; avatar?: string; type: 'private' | 'group' | 'ai' };
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Conversations: undefined;
  Contacts: undefined;
  Profile: undefined;
};

// 创建导航器
const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();

// 身份验证导航
const AuthNavigator = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: colors.text,
        },
        headerTintColor: colors.primary,
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: '登录' }} />
      <AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: '注册' }} />
    </AuthStack.Navigator>
  );
};

// 主导航
const MainNavigator = () => {
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = '';

          if (route.name === 'Conversations') {
            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
          } else if (route.name === 'Contacts') {
            iconName = focused ? 'people' : 'people-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }

          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: colors.text,
        },
      })}
    >
      <MainTab.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{ title: '会话' }}
      />
      <MainTab.Screen
        name="Contacts"
        component={ContactsScreen}
        options={{ title: '联系人' }}
      />
      <MainTab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: '我的' }}
      />
    </MainTab.Navigator>
  );
};

// 主应用导航
const AppNavigator = () => {
  const { user, loading } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.background,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: colors.text,
        },
        headerTintColor: colors.primary,
      }}
    >
      {user ? (
        <>
          <Stack.Screen
            name="Main"
            component={MainNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={({ route }: { route: RouteProp<RootStackParamList, 'Chat'> }) => ({
              title: route.params.name,
              headerBackTitle: '返回',
            })}
          />
        </>
      ) : (
        <Stack.Screen
          name="Auth"
          component={AuthNavigator}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator; 