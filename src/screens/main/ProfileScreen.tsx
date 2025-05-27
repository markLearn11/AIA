import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../utils/colors';

const ProfileScreen = () => {
  const { user, logout, updateUserInfo } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [isLoading, setIsLoading] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // API基础URL
  // const API_URL = 'http://10.0.2.2:5001/api'; // Android模拟器
  const API_URL = 'http://localhost:5001/api'; // iOS模拟器

  // 处理登出
  const handleLogout = () => {
    Alert.alert(
      '确认登出',
      '您确定要登出吗？',
      [
        {
          text: '取消',
          style: 'cancel',
        },
        {
          text: '确定',
          onPress: () => logout(),
        },
      ],
      { cancelable: true }
    );
  };

  // 开始编辑个人资料
  const startEditing = () => {
    setIsEditing(true);
  };

  // 取消编辑
  const cancelEditing = () => {
    setUsername(user?.username || '');
    setAvatar(user?.avatar || '');
    setIsEditing(false);
  };

  // 保存个人资料
  const saveProfile = async () => {
    if (!username.trim()) {
      Alert.alert('错误', '用户名不能为空');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({
          username,
          avatar,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        updateUserInfo({
          username,
          avatar,
        });
        setIsEditing(false);
        Alert.alert('成功', '个人资料已更新');
      } else {
        Alert.alert('错误', data.message || '更新个人资料失败');
      }
    } catch (error) {
      console.error('更新个人资料失败:', error);
      Alert.alert('错误', '更新个人资料失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
    >
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: avatar || 'https://via.placeholder.com/150' }}
            style={styles.avatar}
          />
          {isEditing && (
            <TouchableOpacity
              style={[styles.editAvatarButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                // 这里应该添加选择图片的功能
                // 简化起见，我们使用一个示例URL
                setAvatar('https://via.placeholder.com/150/FF8C00/FFFFFF');
              }}
            >
              <Icon name="camera" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )}
        </View>

        {isEditing ? (
          <TextInput
            style={[
              styles.usernameInput,
              {
                backgroundColor: colors.surface,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={username}
            onChangeText={setUsername}
            placeholder="用户名"
            placeholderTextColor={colors.textSecondary}
          />
        ) : (
          <Text style={[styles.username, { color: colors.text }]}>{user?.username}</Text>
        )}
        <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
      </View>

      <View style={[styles.section, { backgroundColor: colors.surface }]}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>账号信息</Text>

        <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>用户ID</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{user?._id}</Text>
        </View>

        <View style={[styles.infoItem, { borderBottomColor: colors.border }]}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>邮箱</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{user?.email}</Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        {isEditing ? (
          <>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton, { backgroundColor: colors.surface }]}
              onPress={cancelEditing}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, { color: colors.textSecondary }]}>取消</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton, { backgroundColor: colors.primary }]}
              onPress={saveProfile}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.buttonText}>保存</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.editButton, { backgroundColor: colors.primary }]}
            onPress={startEditing}
          >
            <Text style={styles.buttonText}>编辑个人资料</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.button, styles.logoutButton, { backgroundColor: colors.error }]}
          onPress={handleLogout}
        >
          <Text style={styles.buttonText}>退出登录</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  usernameInput: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    width: '80%',
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
  },
  section: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 16,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    marginTop: 8,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#4A6FFF',
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
  },
  saveButton: {
    backgroundColor: '#4A6FFF',
    flex: 1,
    marginLeft: 8,
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
  },
});

export default ProfileScreen; 