import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../components/CustomText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';
import { supabase } from '../lib/supabase';

// Helper to extract JSON from a string (handles code blocks and extra text)
function extractJsonFromString(str: string) {
    // Remove markdown code block if present
    const cleaned = str.replace(/```(json)?/gi, '').replace(/```/g, '').trim();
    // Try to find the first {...} block
    const match = cleaned.match(/{[\s\S]*}/);
    if (match) {
        try {
            return JSON.parse(match[0]);
        } catch (e) {
            return null;
        }
    }
    // Fallback: try to parse the whole string
    try {
        return JSON.parse(cleaned);
    } catch (e) {
        return null;
    }
}

export default function ChatScreen() {
    const router = useRouter();
    const { chat_id } = useLocalSearchParams();
    const [message, setMessage] = useState('');
    const [allMessages, setAllMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);
    const [currentChatId, setCurrentChatId] = useState<string | null>(chat_id ? String(chat_id) : null);
    const [sending, setSending] = useState(false);

    // Fetch user ID on mount
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data?.user) setUserId(data.user.id);
        });
    }, []);

    // Fetch messages for this chat on mount
    useEffect(() => {
        if (!currentChatId) {
            setAllMessages([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        fetch(`https://familycooksclean.onrender.com/ai/messages?chat_id=${currentChatId}`)
            .then(res => res.json())
            .then(data => {
                // Transform messages: if assistant message is valid recipe JSON, replace with [RECIPE_CARD]
                const transformed = data.flatMap((msg: any) => {
                    if (msg.role === 'assistant') {
                        const maybeJson = extractJsonFromString(msg.content);
                        if (maybeJson && maybeJson.is_recipe) {
                            return [{ role: 'assistant', content: '[RECIPE_CARD]', recipe: maybeJson }];
                        } else if (maybeJson && maybeJson.is_recipe === false) {
                            // Prefer 'text', fallback to 'message'
                            const text = maybeJson.text || maybeJson.message;
                            if (text) {
                                return [{ role: 'assistant', content: text }];
                            }
                        }
                    }
                    return [msg];
                });
                setAllMessages(transformed);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [currentChatId]);

    const sendMessage = async () => {
        if (!message.trim() || !userId) return;
        setSending(true);
        try {
            // If no chat yet, create one and send first message
            const payload: any = {
                user_id: userId,
                message: message.trim(),
            };
            if (currentChatId) {
                payload.chat_id = currentChatId;
            }
            const res = await fetch('https://familycooksclean.onrender.com/ai/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            const data = await res.json();
            if (res.ok) {
                // Update chat_id if new
                if (!currentChatId && data.chat_id) {
                    setCurrentChatId(data.chat_id);
                }
                // Add user message
                setAllMessages(prev => [
                    ...prev,
                    { role: 'user', content: message.trim() }
                ]);
                // Robustly extract and parse JSON from AI response
                const maybeJson = extractJsonFromString(data.ai_response);
                if (maybeJson && maybeJson.is_recipe) {
                    setAllMessages(prev => [
                        ...prev,
                        { role: 'assistant', content: '[RECIPE_CARD]', recipe: maybeJson }
                    ]);
                } else if (maybeJson && maybeJson.is_recipe === false) {
                    // Prefer 'text', fallback to 'message'
                    const text = maybeJson.text || maybeJson.message;
                    setAllMessages(prev => [
                        ...prev,
                        { role: 'assistant', content: text || data.ai_response }
                    ]);
                } else {
                    setAllMessages(prev => [
                        ...prev,
                        { role: 'assistant', content: data.ai_response }
                    ]);
                }
                setMessage('');
            } else {
                alert(data.error || 'Failed to send message');
            }
        } catch (err) {
            alert('Failed to send message');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#6DA98C" style={{ marginTop: 100 }} />
            </View>
        );
    }

    if (!userId) {
        return (
            <View style={styles.container}>
                <CustomText style={{ marginTop: 100, textAlign: 'center' }}>You must be logged in to chat with the AI Chef.</CustomText>
            </View>
        );
    }

    // If no chat or no messages, prompt to start chat
    if (!currentChatId || allMessages.length === 0) {
        return (
            <View style={styles.container}>
                <Stack.Screen options={{ headerShown: false }} />
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={26} color="#444" />
                    </TouchableOpacity>
                    <CustomText style={styles.headerText}>Ask the AI Chef</CustomText>
                </View>
                <CustomText style={{ marginTop: 100, textAlign: 'center' }}>Start a new chat to begin messaging the AI Chef.</CustomText>
                <SafeAreaView edges={['bottom']} style={styles.safeAreaInput}>
                    <View style={styles.inputContainer}>
                        <View style={styles.inputBox}>
                            <TextInput
                                style={styles.textInput}
                                placeholder="Message the AI Chef..."
                                placeholderTextColor="#717171"
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                maxLength={500}
                            />
                            <TouchableOpacity
                                style={[styles.sendButton, (!message.trim() || sending) && styles.sendButtonDisabled]}
                                onPress={sendMessage}
                                disabled={!message.trim() || sending}
                            >
                                <Ionicons name="send" size={18} color={message.trim() ? "#fff" : "#DDD"} />
                            </TouchableOpacity>
                        </View>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            {/* Header */}
            <View style={styles.headerRow}>
                <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                    <Ionicons name="arrow-back" size={26} color="#444" />
                </TouchableOpacity>
                <CustomText style={styles.headerText}>Ask the AI Chef</CustomText>
            </View>
            {/* Chat Messages */}
            <ScrollView style={styles.messagesContainer} contentContainerStyle={{ paddingBottom: 24 }}>
                {allMessages.map((msg, idx) => {
                    if (msg.content === '[RECIPE_CARD]' && msg.recipe) {
                        console.log('Passing to detail:', {
                            steps: msg.recipe.steps,
                            isArray: Array.isArray(msg.recipe.steps),
                            typeofSteps: typeof msg.recipe.steps,
                        });
                        return (
                            <TouchableOpacity
                                key={idx}
                                style={styles.recipeCard}
                                onPress={() => {
                                    const params = {
                                        ...msg.recipe,
                                        title: msg.recipe.name,
                                        isAI: '1',
                                        tags: JSON.stringify(msg.recipe.tags),
                                        ingredients: JSON.stringify(msg.recipe.ingredients),
                                        steps: JSON.stringify(msg.recipe.steps),
                                    };
                                    router.push({ pathname: '/recipe-detail', params });
                                }}
                            >
                                <View style={{ flex: 1 }}>
                                    <CustomText style={styles.recipeMeta}>{msg.recipe.tags?.join(', ')}   •   {msg.recipe.time}</CustomText>
                                    <CustomText style={styles.recipeTitle}>{msg.recipe.name}</CustomText>
                                    <CustomText style={styles.recipeDesc}>{msg.recipe.ingredients?.length} ingredients • {msg.recipe.steps?.length} steps</CustomText>
                                </View>
                                <View style={styles.recipeIconBox}>
                                    <Image
                                        source={require('../assets/images/fork-knife.png')}
                                        style={{ width: 32, height: 32, tintColor: '#fff' }}
                                    />
                                </View>
                            </TouchableOpacity>
                        );
                    }
                    // Debug log
                    let displayContent = msg.content;
                    // If it's a string that looks like JSON, parse it
                    if (typeof displayContent === 'string' && displayContent.trim().startsWith('{')) {
                        try {
                            const parsed = JSON.parse(displayContent);
                            displayContent = parsed.text || parsed.message || parsed.response || displayContent;
                        } catch {
                            // Not valid JSON, leave as is
                        }
                    } else if (typeof displayContent === 'object' && displayContent !== null) {
                        displayContent = displayContent.text || displayContent.message || displayContent.response || '';
                    }
                    return (
                        <View key={idx} style={[styles.messageRow, msg.role === 'assistant' ? styles.aiRow : styles.userRow]}>
                            <Image
                                source={msg.role === 'assistant' ? require('../assets/images/ai-avatar.png') : require('../assets/images/avatar.png')}
                                style={styles.avatar}
                            />
                            <View style={[styles.bubble, msg.role === 'assistant' ? styles.aiBubble : styles.userBubble]}>
                                <CustomText style={[styles.bubbleText, msg.role === 'assistant' ? styles.aiText : styles.userText]}>{displayContent}</CustomText>
                            </View>
                        </View>
                    );
                })}
            </ScrollView>
            {/* Message Input */}
            <SafeAreaView edges={['bottom']} style={styles.safeAreaInput}>
                <View style={styles.inputContainer}>
                    <View style={styles.inputBox}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Message the AI Chef..."
                            placeholderTextColor="#717171"
                            value={message}
                            onChangeText={setMessage}
                            multiline
                            maxLength={500}
                        />
                        <TouchableOpacity
                            style={[styles.sendButton, (!message.trim() || sending) && styles.sendButtonDisabled]}
                            onPress={sendMessage}
                            disabled={!message.trim() || sending}
                        >
                            <Ionicons name="send" size={18} color={message.trim() ? "#fff" : "#DDD"} />
                        </TouchableOpacity>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F6F9', paddingTop: 80 },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 40,
    },
    backButton: {
        marginRight: 8,
        padding: 4,
    },
    headerText: {
        fontSize: 20,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
        marginRight: 32,
    },
    messagesContainer: {
        flex: 1,
        paddingHorizontal: 16,
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        marginBottom: 40,
    },
    aiRow: {
        justifyContent: 'flex-start',
    },
    userRow: {
        flexDirection: 'row-reverse',
        justifyContent: 'flex-end',
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginHorizontal: 8,
        backgroundColor: '#eee',
    },
    bubble: {
        maxWidth: '80%',
        borderRadius: 16,
        padding: 12,
        marginHorizontal: 4,
    },
    aiBubble: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 0,
    },
    userBubble: {
        backgroundColor: '#F7D774',
        borderTopRightRadius: 0,
    },
    bubbleText: {
        fontSize: 15,
    },
    aiText: {
        color: '#222',
    },
    userText: {
        color: '#222',
    },
    recipeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 18,
        marginTop: 12,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    recipeMeta: {
        color: '#6C757D',
        fontSize: 13,
        marginBottom: 2,
    },
    recipeTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 2,
        color: '#222',
    },
    recipeDesc: {
        color: '#6C757D',
        fontSize: 14,
    },
    recipeIconBox: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: '#8CBEC7',
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 16,
    },
    safeAreaInput: {
        backgroundColor: 'transparent',
    },
    inputContainer: {
        backgroundColor: 'transparent',
        paddingHorizontal: 0,
        paddingBottom: 16,
        paddingTop: 0,
        borderTopWidth: 0,
        shadowColor: 'transparent',
        elevation: 0,
    },
    inputBox: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        backgroundColor: '#fff',
        borderRadius: 32,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderWidth: 0,
        marginHorizontal: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.10,
        shadowRadius: 16,
        elevation: 8,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: '#222',
        maxHeight: 120,
        paddingVertical: 4,
        lineHeight: 20,
    },
    sendButton: {
        backgroundColor: '#FF385C',
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
        shadowColor: '#FF385C',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 3,
    },
    sendButtonDisabled: {
        backgroundColor: '#F7F7F7',
        shadowOpacity: 0,
        elevation: 0,
    },
}); 