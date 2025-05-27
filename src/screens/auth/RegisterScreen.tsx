import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AuthStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../utils/colors';

type RegisterScreenProps = {
  navigation: StackNavigationProp<AuthStackParamList, 'Register'>;
};

const RegisterScreen: React.FC<RegisterScreenProps> = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  const handleRegister = async () => {
    // 简单验证
    if (!username || !email || !password || !confirmPassword) {
      Alert.alert('注册失败', '请填写所有字段');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('注册失败', '两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      Alert.alert('注册失败', '密码长度至少为6位');
      return;
    }

    console.log('开始注册流程...');
    setIsLoading(true);
    
    try {
      console.log('调用register函数...');
      const success = await register(username, email, password);
      console.log('注册结果:', success ? '成功' : '失败');
      
      if (success) {
        console.log('注册成功，即将导航到主页面');
        // 注册成功后不需要手动导航，因为在AppNavigator中
        // 当user状态变为非null时，会自动导航到主页面
      } else {
        console.log('注册失败，错误处理已在AuthContext中完成');
      }
    } catch (error) {
      console.error('注册过程中发生异常:', error);
      Alert.alert('注册错误', '注册过程中发生未知错误');
    } finally {
      setIsLoading(false);
      console.log('注册流程结束，isLoading设为false');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.text }]}>创建新账号</Text>

        <View style={styles.formContainer}>
          <Text style={[styles.label, { color: colors.text }]}>用户名</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="请输入用户名"
            placeholderTextColor={colors.textSecondary}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={[styles.label, { color: colors.text }]}>邮箱</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="请输入邮箱"
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <Text style={[styles.label, { color: colors.text }]}>密码</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="请输入密码（至少6位）"
            placeholderTextColor={colors.textSecondary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Text style={[styles.label, { color: colors.text }]}>确认密码</Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="请再次输入密码"
            placeholderTextColor={colors.textSecondary}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>注册</Text>
            )}
          </TouchableOpacity>

          <View style={styles.loginContainer}>
            <Text style={[styles.loginText, { color: colors.textSecondary }]}>
              已有账号？
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={[styles.loginLink, { color: colors.primary }]}>返回登录</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
    marginTop: 20,
  },
  formContainer: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  loginText: {
    fontSize: 14,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 5,
  },
});

export default RegisterScreen; 