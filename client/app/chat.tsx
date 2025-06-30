import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import CustomText from '../components/CustomText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';

const messages = [
    {
        sender: 'AI Chef',
        text: "Hi there! I'm your AI Chef assistant. How can I help you today?",
        ai: true,
    },
    {
        sender: 'Eric',
        text: "I'm looking for a quick and easy dinner recipe for tonight",
        ai: false,
    },
    {
        sender: 'AI Chef',
        text: 'Sure! I can help with that. How about this delicious and simple recipe?',
        ai: true,
    },
];

export default function ChatScreen() {
    const router = useRouter();
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
                {messages.map((msg, idx) => (
                    <View key={idx} style={[styles.messageRow, msg.ai ? styles.aiRow : styles.userRow]}>
                        <Image
                            source={msg.ai ? require('../assets/images/chef-hat.png') : require('../assets/images/avatar.png')}
                            style={styles.avatar}
                        />
                        <View style={[styles.bubble, msg.ai ? styles.aiBubble : styles.userBubble]}>
                            <CustomText style={[styles.bubbleText, msg.ai ? styles.aiText : styles.userText]}>{msg.text}</CustomText>
                        </View>
                    </View>
                ))}
                {/* Recipe Card */}
                <View style={styles.recipeCard}>
                    <View style={{ flex: 1 }}>
                        <CustomText style={styles.recipeMeta}>Quick & Easy   •   25 min</CustomText>
                        <CustomText style={styles.recipeTitle}>Honey Garlic Chicken</CustomText>
                        <CustomText style={styles.recipeDesc}>A flavorful and healthy dish ready in under 30 mins</CustomText>
                    </View>
                    <View style={styles.recipeIconBox}>
                        <Ionicons name="restaurant" size={32} color="#fff" />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F6F9', paddingTop: 80 },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 12,
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
        marginBottom: 16,
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
        maxWidth: '70%',
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
}); 