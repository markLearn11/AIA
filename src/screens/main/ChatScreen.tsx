import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Text,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { GiftedChat, Bubble, InputToolbar, Send, MessageText, Day, IMessage } from 'react-native-gifted-chat';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Colors } from '../../utils/colors';
import { debounce } from '../../utils/helpers';

type ChatScreenProps = {
  route: RouteProp<RootStackParamList, 'Chat'>;
};

// 定义消息接口
interface MessageData {
  conversationId: string;
  text?: string;
  image?: string;
  video?: string;
  audio?: string;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ route }) => {
  const { conversationId, name, type } = route.params;
  const { user } = useAuth();
  const { socket, isConnected, lastMessage, sendMessage, markAsRead, startTyping, stopTyping } = useSocket();
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const isDarkMode = useColorScheme() === 'dark';
  const colors = isDarkMode ? Colors.dark : Colors.light;

  // API基础URL
  // const API_URL = 'http://10.0.2.2:5001/api'; // Android模拟器
  const API_URL = 'http://localhost:5001/api'; // iOS模拟器

  // 获取消息历史
  const fetchMessages = useCallback(async () => {
    try {
      const response = await fetch(
        `${API_URL}/chat/conversations/${conversationId}/messages`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        // 转换消息格式以适应GiftedChat
        const formattedMessages = data.data.messages.map((msg: any) => ({
          _id: msg._id,
          text: msg.text,
          createdAt: new Date(msg.createdAt),
          user: {
            _id: msg.sender._id,
            name: msg.sender.username,
            avatar: msg.sender.avatar,
          },
          image: msg.image,
          video: msg.video,
          audio: msg.audio,
          system: false,
        }));

        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('获取消息失败:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user]);

  // 初始加载消息
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // 监听新消息
  useEffect(() => {
    if (lastMessage && lastMessage.conversation === conversationId) {
      // 标记消息为已读
      markAsRead(lastMessage._id);

      // 添加新消息到列表
      const newMessage = {
        _id: lastMessage._id,
        text: lastMessage.text || '',
        createdAt: new Date(lastMessage.createdAt),
        user: {
          _id: lastMessage.sender._id,
          name: lastMessage.sender.username,
          avatar: lastMessage.sender.avatar,
        },
        image: lastMessage.image,
        video: lastMessage.video,
        audio: lastMessage.audio,
        system: false,
      };

      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, [newMessage])
      );
    }
  }, [lastMessage, conversationId, markAsRead]);

  // 监听用户正在输入
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleTyping = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === conversationId && data.userId !== user?._id) {
        setTypingUsers((prev) => {
          if (!prev.includes(data.userId)) {
            return [...prev, data.userId];
          }
          return prev;
        });
      }
    };

    const handleStopTyping = (data: { userId: string; conversationId: string }) => {
      if (data.conversationId === conversationId && data.userId !== user?._id) {
        setTypingUsers((prev) => prev.filter((id) => id !== data.userId));
      }
    };

    socket.on('user_typing', handleTyping);
    socket.on('user_stop_typing', handleStopTyping);

    return () => {
      socket.off('user_typing', handleTyping);
      socket.off('user_stop_typing', handleStopTyping);
    };
  }, [socket, isConnected, conversationId, user]);

  // 发送消息
  const onSend = useCallback(
    (newMessages: IMessage[] = []) => {
      const message = newMessages[0];
      
      // 构建要发送的消息数据
      const messageData: MessageData = {
        conversationId,
      };
      
      // 只添加存在的属性
      if (message.text) messageData.text = message.text;
      if (message.image) messageData.image = message.image;
      if (message.video) messageData.video = message.video;
      if (message.audio) messageData.audio = message.audio;
      
      // 发送消息到服务器
      sendMessage(messageData);

      // 立即在UI中显示消息
      setMessages((previousMessages) =>
        GiftedChat.append(previousMessages, newMessages)
      );
    },
    [conversationId, sendMessage]
  );

  // 处理输入变化，发送正在输入状态
  const handleInputTextChanged = useCallback(
    debounce((text: string) => {
      if (text.length > 0) {
        startTyping(conversationId);
      } else {
        stopTyping(conversationId);
      }
    }, 300),
    [conversationId, startTyping, stopTyping]
  );

  // 自定义气泡样式
  const renderBubble = (props: any) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          left: {
            backgroundColor: colors.messageIncoming,
          },
          right: {
            backgroundColor: colors.messageOutgoing,
          },
        }}
        textStyle={{
          left: {
            color: colors.text,
          },
          right: {
            color: isDarkMode ? '#FFFFFF' : '#000000',
          },
        }}
      />
    );
  };

  // 自定义输入工具栏
  const renderInputToolbar = (props: any) => {
    return (
      <InputToolbar
        {...props}
        containerStyle={{
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        }}
        primaryStyle={{ alignItems: 'center' }}
      />
    );
  };

  // 自定义发送按钮
  const renderSend = (props: any) => {
    return (
      <Send
        {...props}
        containerStyle={{
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 10,
          marginBottom: 5,
        }}
      >
        <Icon name="send" size={24} color={colors.primary} />
      </Send>
    );
  };

  // 自定义消息文本
  const renderMessageText = (props: any) => {
    return (
      <MessageText
        {...props}
        textStyle={{
          left: {
            color: colors.text,
          },
          right: {
            color: isDarkMode ? '#FFFFFF' : '#000000',
          },
        }}
      />
    );
  };

  // 自定义日期
  const renderDay = (props: any) => {
    return (
      <Day
        {...props}
        textStyle={{
          color: colors.textSecondary,
        }}
      />
    );
  };

  // 渲染正在输入指示器
  const renderFooter = () => {
    if (typingUsers.length > 0) {
      return (
        <View style={styles.typingContainer}>
          <Text style={[styles.typingText, { color: colors.typing }]}>
            {type === 'group' ? '有人正在输入...' : '对方正在输入...'}
          </Text>
        </View>
      );
    }
    return null;
  };

  // 渲染加载状态
  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
      >
        <GiftedChat
          messages={messages}
          onSend={onSend}
          user={{
            _id: user?._id || '',
            name: user?.username || '',
            avatar: user?.avatar,
          }}
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderSend={renderSend}
          renderMessageText={renderMessageText}
          renderDay={renderDay}
          renderFooter={renderFooter}
          onInputTextChanged={handleInputTextChanged}
          placeholder="输入消息..."
          alwaysShowSend
          scrollToBottomStyle={{}}
          inverted={true}
          timeFormat="HH:mm"
          dateFormat="YYYY-MM-DD"
          scrollToBottomComponent={() => (
            <Icon name="chevron-down" size={24} color={colors.primary} />
          )}
        />
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingContainer: {
    padding: 8,
    marginLeft: 10,
    marginBottom: 5,
  },
  typingText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
});

export default ChatScreen; 