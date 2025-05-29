import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Text,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { RouteProp } from '@react-navigation/native';
import { GiftedChat, Bubble, InputToolbar, Send, MessageText, Day, IMessage } from 'react-native-gifted-chat';
import Icon from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../navigation/AppNavigator';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Colors } from '../../utils/colors';
import { debounce } from '../../utils/helpers';
import { AI_CONTACT } from '../../services/aiApi';
import { useRequest } from '../../hooks/useApi';
import { aiApi } from '../../services/aiApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, NavigationProp } from '@react-navigation/native';

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

// ChatGPT消息历史记录接口
interface ChatGPTMessage {
  role: string;
  content: string;
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
  const [aiTyping, setAiTyping] = useState(false);
  const [chatGPTHistory, setChatGPTHistory] = useState<ChatGPTMessage[]>([]);
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();

  // 使用自定义钩子获取AI回复
  const { loading: aiLoading, execute: sendMessageToAi } = useRequest<any, [string]>(
    (message: string) => aiApi.sendMessage(message),
    null,
    true
  );

  // 检查是否是AI对话
  const isAiChat = conversationId === AI_CONTACT._id;

  // API基础URL
  // const API_URL = 'http://10.0.2.2:5001/api'; // Android模拟器
  const API_URL = 'http://localhost:5001/api'; // iOS模拟器

  // 加载ChatGPT对话历史
  const loadChatGPTHistory = useCallback(async () => {
    if (isAiChat) {
      try {
        const historyJson = await AsyncStorage.getItem('chatgpt_history');
        if (historyJson) {
          const history = JSON.parse(historyJson);
          setChatGPTHistory(history);
        }
      } catch (error) {
        console.error('加载ChatGPT历史记录失败:', error);
      }
    }
  }, [isAiChat]);

  // 保存ChatGPT对话历史
  const saveChatGPTHistory = async (history: ChatGPTMessage[]) => {
    try {
      await AsyncStorage.setItem('chatgpt_history', JSON.stringify(history));
    } catch (error) {
      console.error('保存ChatGPT历史记录失败:', error);
    }
  };

  // 加载历史消息
  useEffect(() => {
    loadChatGPTHistory();
  }, [loadChatGPTHistory]);

  // 获取消息历史
  const fetchMessages = useCallback(async () => {
    try {
      if (isAiChat) {
        try {
          // 尝试从AsyncStorage加载聊天记录
          const historyJson = await AsyncStorage.getItem('ai_chat_messages');
          if (historyJson) {
            const storedMessages = JSON.parse(historyJson);
            setMessages(storedMessages);
          } else {
            // 如果是第一次聊天，创建欢迎消息
            const welcomeMessage = {
              _id: 'ai-welcome-message',
              text: '您好！我是您的AI助手，有什么可以帮助您的吗？\n\n我使用了ChatGPT模型，可以回答您的各种问题。',
              createdAt: new Date(),
              user: {
                _id: AI_CONTACT._id,
                name: AI_CONTACT.username,
                avatar: AI_CONTACT.avatar,
              },
              system: false,
            };
            setMessages([welcomeMessage]);
          }
        } catch (error) {
          console.error('获取AI聊天历史失败:', error);
          // 如果出错，创建欢迎消息
          const welcomeMessage = {
            _id: 'ai-welcome-message',
            text: '您好！我是您的AI助手，有什么可以帮助您的吗？',
            createdAt: new Date(),
            user: {
              _id: AI_CONTACT._id,
              name: AI_CONTACT.username,
              avatar: AI_CONTACT.avatar,
            },
            system: false,
          };
          setMessages([welcomeMessage]);
        }
      } else {
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
      }
    } catch (error) {
      console.error('获取消息失败:', error);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user, isAiChat]);

  // 初始加载消息
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // 保存AI聊天记录
  useEffect(() => {
    if (isAiChat && messages.length > 0) {
      AsyncStorage.setItem('ai_chat_messages', JSON.stringify(messages))
        .catch(error => console.error('保存AI聊天记录失败:', error));
    }
  }, [isAiChat, messages]);

  // 监听新消息（仅非AI对话）
  useEffect(() => {
    if (!isAiChat && lastMessage && lastMessage.conversation === conversationId) {
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
  }, [lastMessage, conversationId, markAsRead, isAiChat]);

  // 监听用户正在输入（仅非AI对话）
  useEffect(() => {
    if (isAiChat || !socket || !isConnected) return;

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
  }, [socket, isConnected, conversationId, user, isAiChat]);

  // 发送消息
  const onSend = useCallback(
    async (newMessages: IMessage[] = []) => {
      const message = newMessages[0];
      
      if (isAiChat) {
        // AI对话
        try {
          // 立即在UI中显示用户消息
          setMessages((previousMessages) =>
            GiftedChat.append(previousMessages, newMessages)
          );
          
          // 显示AI正在输入
          setAiTyping(true);
          
          // 添加用户消息到ChatGPT历史
          const newUserMessage: ChatGPTMessage = {
            role: 'user',
            content: message.text || '',
          };
          
          const updatedHistory = [...chatGPTHistory, newUserMessage];
          setChatGPTHistory(updatedHistory);
          
          // 发送消息给ChatGPT并获取回复
          setTimeout(async () => {
            try {
              // 调用ChatGPT API
              const chatGPTResponse = await aiApi.sendMessageToChatGPT(
                message.text || '', 
                chatGPTHistory
              );
              
              let aiReplyText = '';
              
              // 处理ChatGPT响应
              if (chatGPTResponse && chatGPTResponse.success) {
                aiReplyText = chatGPTResponse.data.text;
                
                // 添加AI回复到历史
                const newAiMessage: ChatGPTMessage = {
                  role: 'assistant',
                  content: aiReplyText
                };
                
                const historyWithReply = [...updatedHistory, newAiMessage];
                setChatGPTHistory(historyWithReply);
                
                // 保存更新后的历史
                saveChatGPTHistory(historyWithReply);
              } else {
                // 处理错误情况
                aiReplyText = chatGPTResponse?.data?.text || 
                  '抱歉，我无法处理您的请求。请检查您的OpenAI API密钥是否已配置。';
              }
              
              // 创建AI回复消息
              const aiReply = {
                _id: `ai-${Date.now()}`,
                text: aiReplyText,
                createdAt: new Date(),
                user: {
                  _id: AI_CONTACT._id,
                  name: AI_CONTACT.username,
                  avatar: AI_CONTACT.avatar,
                },
              };
              
              // 将AI回复添加到消息列表
              setMessages((previousMessages) => 
                GiftedChat.append(previousMessages, [aiReply])
              );
            } catch (error) {
              console.error('获取ChatGPT回复失败:', error);
              
              // 出错时显示错误消息
              const errorReply = {
                _id: `ai-error-${Date.now()}`,
                text: '抱歉，我遇到了一些问题，无法回应您的消息。请稍后再试。',
                createdAt: new Date(),
                user: {
                  _id: AI_CONTACT._id,
                  name: AI_CONTACT.username,
                  avatar: AI_CONTACT.avatar,
                },
              };
              
              setMessages((previousMessages) => 
                GiftedChat.append(previousMessages, [errorReply])
              );
              
              Alert.alert('错误', 'AI助手暂时无法回复，请稍后再试');
            } finally {
              setAiTyping(false);
            }
          }, 1000); // 模拟AI思考的时间
        } catch (error) {
          console.error('发送消息给AI失败:', error);
          Alert.alert('错误', '无法发送消息给AI助手');
        }
      } else {
        // 普通对话
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
      }
    },
    [conversationId, sendMessage, isAiChat, chatGPTHistory]
  );

  // 清除聊天记录
  const clearChatHistory = useCallback(async () => {
    if (isAiChat) {
      try {
        await AsyncStorage.removeItem('ai_chat_messages');
        await AsyncStorage.removeItem('chatgpt_history');
        setChatGPTHistory([]);
        
        // 重新添加欢迎消息
        const welcomeMessage = {
          _id: 'ai-welcome-message',
          text: '您好！我是您的AI助手，有什么可以帮助您的吗？\n\n我使用了ChatGPT模型，可以回答您的各种问题。',
          createdAt: new Date(),
          user: {
            _id: AI_CONTACT._id,
            name: AI_CONTACT.username,
            avatar: AI_CONTACT.avatar,
          },
          system: false,
        };
        setMessages([welcomeMessage]);
        
        Alert.alert('提示', '聊天记录已清除');
      } catch (error) {
        console.error('清除聊天记录失败:', error);
        Alert.alert('错误', '清除聊天记录失败');
      }
    }
  }, [isAiChat]);

  // 处理输入变化，发送正在输入状态
  const handleInputTextChanged = useCallback(
    debounce((text: string) => {
      if (!isAiChat && text.length > 0) {
        startTyping(conversationId);
      } else if (!isAiChat) {
        stopTyping(conversationId);
      }
    }, 300),
    [conversationId, startTyping, stopTyping, isAiChat]
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

  // 自定义日期显示
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

  // 渲染底部状态（正在输入等）
  const renderFooter = () => {
    if ((typingUsers.length > 0 && !isAiChat) || (isAiChat && aiTyping)) {
      return (
        <View style={[styles.typingContainer, { backgroundColor: colors.messageIncoming }]}>
          <Text style={[styles.typingText, { color: colors.textSecondary }]}>
            {isAiChat ? 'AI助手正在输入...' : `${name} 正在输入...`}
          </Text>
          <ActivityIndicator size="small" color={colors.textSecondary} />
        </View>
      );
    }
    return null;
  };

  // 渲染自定义操作按钮
  const renderActions = () => {
    if (isAiChat) {
      return (
        <View style={styles.actionsContainer}>
          <TouchableOpacity onPress={clearChatHistory} style={styles.actionButton}>
            <Icon name="trash-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      );
    }
    return null;
  };

  // 添加标题组件
  useEffect(() => {
    if (isAiChat) {
      // 设置导航标题
      navigation.setOptions({
        headerRight: () => (
          <TouchableOpacity 
            onPress={clearChatHistory}
            style={{ marginRight: 15 }}
          >
            <Icon name="trash-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
        ),
      });
    }
  }, [navigation, isAiChat, clearChatHistory]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      {isAiChat && (
        <View style={styles.apiKeyWarning}>
          <Text style={styles.apiKeyWarningText}>
            请确保在 src/services/aiApi.ts 中设置了您的 OpenAI API 密钥
          </Text>
        </View>
      )}
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
        renderActions={isAiChat ? renderActions : undefined}
        onInputTextChanged={handleInputTextChanged}
        placeholder="输入消息..."
        alwaysShowSend
        inverted={Platform.OS !== 'web'}
        renderAvatarOnTop
        showUserAvatar
        showAvatarForEveryMessage={false}
        renderUsernameOnMessage={type === 'group'}
        timeFormat="HH:mm"
        dateFormat="YYYY-MM-DD"
        scrollToBottomComponent={() => (
          <Icon name="chevron-down" size={24} color={colors.primary} />
        )}
      />
    </KeyboardAvoidingView>
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
  typingContainer: {
    flexDirection: 'row',
    padding: 8,
    borderRadius: 15,
    marginLeft: 10,
    marginRight: 10,
    marginBottom: 10,
    maxWidth: '70%',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 12,
    marginRight: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    marginBottom: 5,
  },
  actionButton: {
    padding: 8,
  },
  apiKeyWarning: {
    backgroundColor: '#FFF3CD',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiKeyWarningText: {
    color: '#856404',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default ChatScreen; 