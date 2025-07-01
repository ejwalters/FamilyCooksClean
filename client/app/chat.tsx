import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CustomText from '../components/CustomText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack, useLocalSearchParams } from 'expo-router';

export default function ChatScreen() {
    const router = useRouter();
    const { chat_id } = useLocalSearchParams();
    const [message, setMessage] = useState('');
    const [allMessages, setAllMessages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch messages for this chat on mount
    useEffect(() => {
        if (!chat_id) {
            setLoading(false);
            return;
        }
        setLoading(true);
        fetch(`https://familycooksclean.onrender.com/ai/messages?chat_id=${chat_id}`)
            .then(res => res.json())
            .then(data => {
                setAllMessages(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [chat_id]);

    // Example AI recipe suggestion (replace with real AI logic as needed)
    const aiRecipe = {
        title: 'Honey Garlic Chicken',
        time: '15 min',
        lastMade: '8 days ago',
        tags: ['Kid Friendly', 'Healthy'],
        ingredients: [
            '1 lb. Chicken breast',
            '1 lb. Chicken breast',
            '1 lb. Chicken breast',
            '1 lb. Chicken breast',
            '1 lb. Chicken breast',
        ],
        steps: [
            'Prepare the chicken breast',
            'Prepare the chicken breast',
            'Prepare the chicken breast',
        ],
        isAI: true,
    };

    const sendMessage = () => {
        if (message.trim()) {
            const newMessage = {
                sender: 'You',
                text: message.trim(),
                ai: false,
            };
            setAllMessages([...allMessages, newMessage]);
            setMessage('');
            // TODO: Add AI response logic here
        }
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#6DA98C" style={{ marginTop: 100 }} />
            </View>
        );
    }

    if (!chat_id) {
        return (
            <View style={styles.container}>
                <CustomText style={{ marginTop: 100, textAlign: 'center' }}>Start a new chat to begin messaging the AI Chef.</CustomText>
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
                {allMessages.map((msg, idx) => (
                    <View key={idx} style={[styles.messageRow, msg.role === 'assistant' ? styles.aiRow : styles.userRow]}>
                        <Image
                            source={msg.role === 'assistant' ? require('../assets/images/ai-avatar.png') : require('../assets/images/avatar.png')}
                            style={styles.avatar}
                        />
                        <View style={[styles.bubble, msg.role === 'assistant' ? styles.aiBubble : styles.userBubble]}>
                            <CustomText style={[styles.bubbleText, msg.role === 'assistant' ? styles.aiText : styles.userText]}>{msg.content}</CustomText>
                        </View>
                    </View>
                ))}
                {/* Recipe Card (AI suggestion) */}
                <TouchableOpacity
                    style={styles.recipeCard}
                    onPress={() => {
                        const params = {
                            ...aiRecipe,
                            isAI: '1',
                            tags: Array.isArray(aiRecipe.tags) ? aiRecipe.tags.join('||') : aiRecipe.tags,
                            ingredients: Array.isArray(aiRecipe.ingredients) ? aiRecipe.ingredients.join('||') : aiRecipe.ingredients,
                            steps: Array.isArray(aiRecipe.steps) ? aiRecipe.steps.join('||') : aiRecipe.steps,
                        };
                        router.push({ pathname: '/recipe-detail', params });
                    }}
                >
                    <View style={{ flex: 1 }}>
                        <CustomText style={styles.recipeMeta}>Quick & Easy   •   25 min</CustomText>
                        <CustomText style={styles.recipeTitle}>{aiRecipe.title}</CustomText>
                        <CustomText style={styles.recipeDesc}>A flavorful and healthy dish ready in under 30 mins</CustomText>
                    </View>
                    <View style={styles.recipeIconBox}>
                        <Image
                            source={require('../assets/images/fork-knife.png')}
                            style={{ width: 32, height: 32, tintColor: '#fff' }}
                        />
                    </View>
                </TouchableOpacity>
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
                            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
                            onPress={sendMessage}
                            disabled={!message.trim()}
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