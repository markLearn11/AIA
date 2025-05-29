/*
 * @Author: jihao00122 52628008+jihao00122@users.noreply.github.com
 * @Date: 2025-05-27 15:56:00
 * @LastEditors: jihao00122 52628008+jihao00122@users.noreply.github.com
 * @LastEditTime: 2025-05-27 19:50:47
 * @FilePath: /AiA/AiA/src/screens/main/ConversationsScreen.tsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
  useColorScheme,
  Image,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Colors } from '../../utils/colors';
import { formatTime } from '../../utils/helpers';
import { chatApi, Conversation } from '../../services/api';
import { useRequest } from '../../hooks/useApi';
import { AI_CONTACT } from '../../services/aiApi';

const ConversationsScreen = () => {
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();
  const { lastMessage } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // 使用自定义钩子获取会话列表
  const { loading, execute: fetchConversations } = useRequest<Conversation[], []>(
    chatApi.getConversations,
    null,
    true
  );

  // 获取会话列表
  const loadConversations = useCallback(async () => {
    try {
      const data = await fetchConversations();
      if (data) {
        setConversations(data);
      }
    } finally {
      setRefreshing(false);
    }
  }, [fetchConversations]);

  // 当屏幕获得焦点时刷新会话列表
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  // 监听新消息
  React.useEffect(() => {
    if (lastMessage) {
      // 更新会话列表中的最后一条消息
      setConversations((prevConversations) => {
        const updatedConversations = [...prevConversations];
        const conversationIndex = updatedConversations.findIndex(
          (c) => c._id === lastMessage.conversation
        );

        if (conversationIndex !== -1) {
          updatedConversations[conversationIndex] = {
            ...updatedConversations[conversationIndex],
            lastMessage: {
              text: lastMessage.text,
              image: lastMessage.image,
              video: lastMessage.video,
              audio: lastMessage.audio,
              sender: lastMessage.sender,
              createdAt: new Date().toISOString(),
            },
            updatedAt: new Date().toISOString(),
          };

          // 将更新的会话移到顶部
          const updatedConversation = updatedConversations.splice(conversationIndex, 1)[0];
          updatedConversations.unshift(updatedConversation);
        }

        return updatedConversations;
      });
    }
  }, [lastMessage]);

  // 下拉刷新
  const onRefresh = () => {
    setRefreshing(true);
    loadConversations();
  };

  // 获取会话名称和头像
  const getConversationInfo = (conversation: Conversation) => {
    if (conversation.type === 'group') {
      return {
        name: conversation.name || '群聊',
        avatar: conversation.avatar || 'https://via.placeholder.com/50',
      };
    } else {
      // 私聊，获取对方用户信息
      const otherParticipant = conversation.participants.find(
        (p) => p._id !== user?._id
      );
      return {
        name: otherParticipant?.username || '用户',
        avatar: otherParticipant?.avatar || 'https://via.placeholder.com/50',
      };
    }
  };

  // 获取最后一条消息的预览
  const getLastMessagePreview = (conversation: Conversation) => {
    const { lastMessage } = conversation;
    if (!lastMessage) return '暂无消息';

    if (lastMessage.text) return lastMessage.text;
    if (lastMessage.image) return '[图片]';
    if (lastMessage.video) return '[视频]';
    if (lastMessage.audio) return '[语音]';
    return '新消息';
  };

  // 渲染AI助手会话
  const renderAiChat = () => {
    const lastActivity = new Date();
    const time = formatTime(lastActivity);

    return (
      <TouchableOpacity
        style={[styles.conversationItem, { borderBottomColor: colors.border }]}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: AI_CONTACT._id,
            name: AI_CONTACT.username,
            avatar: AI_CONTACT.avatar,
            type: 'ai',
          })
        }
      >
        <Image source={{ uri: AI_CONTACT.avatar }} style={styles.avatar} />
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <View style={styles.nameContainer}>
              <Text style={[styles.conversationName, { color: colors.text }]} numberOfLines={1}>
                {AI_CONTACT.username}
              </Text>
              <View style={styles.aiLabelContainer}>
                <Text style={styles.aiLabel}>AI</Text>
              </View>
            </View>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>{time}</Text>
          </View>
          <View style={styles.messagePreviewContainer}>
            <Text
              style={[styles.messagePreview, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              随时为您提供智能对话服务
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 渲染会话项
  const renderItem = ({ item }: { item: Conversation }) => {
    const { name, avatar } = getConversationInfo(item);
    const lastMessagePreview = getLastMessagePreview(item);
    const time = item.lastMessage
      ? formatTime(new Date(item.lastMessage.createdAt))
      : formatTime(new Date(item.updatedAt));
    const isCurrentUserLastMessage = item.lastMessage?.sender._id === user?._id;

    return (
      <TouchableOpacity
        style={[styles.conversationItem, { borderBottomColor: colors.border }]}
        onPress={() =>
          navigation.navigate('Chat', {
            conversationId: item._id,
            name,
            avatar,
            type: item.type,
          })
        }
      >
        <Image source={{ uri: avatar }} style={styles.avatar} />
        <View style={styles.conversationInfo}>
          <View style={styles.conversationHeader}>
            <Text style={[styles.conversationName, { color: colors.text }]} numberOfLines={1}>
              {name}
            </Text>
            <Text style={[styles.timeText, { color: colors.textSecondary }]}>{time}</Text>
          </View>
          <View style={styles.messagePreviewContainer}>
            {isCurrentUserLastMessage && (
              <Text style={[styles.senderPrefix, { color: colors.textSecondary }]}>
                我:{' '}
              </Text>
            )}
            <Text
              style={[styles.messagePreview, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {lastMessagePreview}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // 渲染空状态
  const renderEmptyComponent = () => {
    if (loading) return null;

    return (
      <View style={styles.emptyContainer}>
        <Icon name="chatbubbles-outline" size={60} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          暂无会话
        </Text>
        <Text style={[styles.emptySubText, { color: colors.textSecondary }]}>
          在联系人页面开始新的对话
        </Text>
      </View>
    );
  };

  // 渲染加载状态
  if (loading && !refreshing) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FlatList
        data={conversations}
        renderItem={renderItem}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={renderEmptyComponent}
        ListHeaderComponent={renderAiChat}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
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
  conversationItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16,
  },
  conversationInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  conversationName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  timeText: {
    fontSize: 12,
  },
  messagePreviewContainer: {
    flexDirection: 'row',
  },
  senderPrefix: {
    fontSize: 14,
  },
  messagePreview: {
    fontSize: 14,
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    marginTop: 8,
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

export default ConversationsScreen; 