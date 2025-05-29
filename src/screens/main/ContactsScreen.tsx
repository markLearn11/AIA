import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  useColorScheme,
  Image,
  Alert,
  ImageStyle,
  TextStyle,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { Colors } from '../../utils/colors';
import { debounce } from '../../utils/helpers';
import { contactsApi, chatApi, User } from '../../services/api';
import { useRequest } from '../../hooks/useApi';
import { AI_CONTACT } from '../../services/aiApi';

const ContactsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // 使用自定义钩子获取联系人列表
  const { loading, execute: fetchUsers } = useRequest<User[], []>(
    contactsApi.getContacts,
    null,
    true
  );

  // 使用自定义钩子创建私聊会话
  const { loading: creatingChat, execute: createPrivateChat } = useRequest<any, [string]>(
    (userId: string) => chatApi.createConversation({
      participants: [userId],
      type: 'private'
    }),
    null,
    true
  );

  // 获取联系人列表
  const loadUsers = useCallback(async () => {
    try {
      const data = await fetchUsers();
      if (data) {
        setUsers(data);
        setFilteredUsers(data);
      }
    } catch (error) {
      console.error('获取联系人列表失败:', error);
      Alert.alert(
        '获取联系人失败',
        '无法加载联系人列表，请检查网络连接或稍后重试。'
      );
    }
  }, [fetchUsers]);

  // 当屏幕获得焦点时刷新联系人列表
  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [loadUsers])
  );

  // 处理搜索
  const handleSearch = useCallback(
    debounce((text: string) => {
      if (text.trim() === '') {
        setFilteredUsers(users);
      } else {
        const filtered = users.filter(
          (user) =>
            user.username.toLowerCase().includes(text.toLowerCase()) ||
            user.email.toLowerCase().includes(text.toLowerCase())
        );
        setFilteredUsers(filtered);
      }
    }, 300),
    [users]
  );

  // 处理搜索输入变化
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    handleSearch(text);
  };

  // 开始聊天
  const startChat = async (userId: string, username: string, avatar?: string) => {
    try {
      // 处理AI联系人
      if (userId === AI_CONTACT._id) {
        navigation.navigate('Chat', {
          conversationId: AI_CONTACT._id,
          name: AI_CONTACT.username,
          avatar: AI_CONTACT.avatar,
          type: 'ai',
        });
        return;
      }

      // 处理普通用户
      const conversation = await createPrivateChat(userId);
      if (conversation) {
        navigation.navigate('Chat', {
          conversationId: conversation._id,
          name: username,
          avatar,
          type: 'private',
        });
      }
    } catch (error) {
      console.error('创建会话失败:', error);
      Alert.alert('错误', '创建会话失败');
    }
  };

  // 获取在线状态指示器
  const getStatusIndicator = (status?: string) => {
    if (status === 'online') {
      return <View style={[styles.statusIndicator, { backgroundColor: colors.online }]} />;
    }
    return null;
  };

  // 渲染AI联系人
  const renderAiContact = () => {
    return (
      <TouchableOpacity
        style={[styles.userItem, { borderBottomColor: colors.border }]}
        onPress={() => startChat(AI_CONTACT._id, AI_CONTACT.username, AI_CONTACT.avatar)}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: AI_CONTACT.avatar }}
            style={styles.avatar as ImageStyle}
          />
          {getStatusIndicator(AI_CONTACT.status)}
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: colors.text }]}>
            {AI_CONTACT.username}
            <View style={styles.aiLabelContainer}>
              <Text style={styles.aiLabel}>AI</Text>
            </View>
          </Text>
          <Text style={[styles.email, { color: colors.textSecondary }]} numberOfLines={1}>
            您的个人智能助手
          </Text>
        </View>
        <Icon name="chatbubble-outline" size={24} color={colors.primary} />
      </TouchableOpacity>
    );
  };

  // 渲染用户项
  const renderItem = ({ item }: { item: User }) => {
    // 跳过当前用户
    if (item._id === user?._id) return null;
    
    return (
      <TouchableOpacity
        style={[styles.userItem, { borderBottomColor: colors.border }]}
        onPress={() => startChat(item._id, item.username, item.avatar)}
        disabled={creatingChat}
      >
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: item.avatar || 'https://via.placeholder.com/50' }}
            style={styles.avatar as ImageStyle}
          />
          {getStatusIndicator(item.status)}
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.username, { color: colors.text }]}>{item.username}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]} numberOfLines={1}>
            {item.email}
          </Text>
        </View>
        {creatingChat ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Icon name="chatbubble-outline" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  // 渲染空状态
  const renderEmptyComponent = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Icon name="people-outline" size={60} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {searchQuery ? '没有找到匹配的用户' : '暂无联系人'}
        </Text>
      </View>
    );
  };

  // 渲染加载状态
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 根据搜索查询过滤AI联系人
  const shouldShowAiContact = !searchQuery || 
    AI_CONTACT.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    'ai助手'.includes(searchQuery.toLowerCase());

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <Icon name="search" size={20} color={colors.textSecondary} style={{ marginRight: 8 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="搜索用户"
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={handleSearchChange}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => handleSearchChange('')}>
            <Icon name="close-circle" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={renderEmptyComponent}
        ListHeaderComponent={shouldShowAiContact ? renderAiContact : null}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 24,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  statusIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 14,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  aiLabelContainer: {
    marginLeft: 8,
    backgroundColor: '#007bff',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiLabel: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
});

export default ContactsScreen; 