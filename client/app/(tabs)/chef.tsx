import React, { useRef } from 'react';
import CustomText from '../../components/CustomText';
import { View, StyleSheet, TextInput, TouchableOpacity, FlatList, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const chatHistory = Array(8).fill({
    time: 'Today, 10:30PM',
    summary: 'Stir Fry',
});

export default function ChefScreen() {
    const router = useRouter();
    const startChatRef = useRef<any>(null);
    const chatBtnRefs = useRef<any[]>([]);

    // Helper to open chat with animation origin
    const openChatFromRef = (ref: React.RefObject<any>) => {
        if (ref.current) {
            ref.current.measureInWindow((x: number, y: number, width: number, height: number) => {
                router.push({
                    pathname: '/chat',
                    params: {
                        originX: x + width / 2,
                        originY: y + height / 2,
                        originWidth: width,
                        originHeight: height,
                        originRadius: 20, // match button borderRadius
                    },
                });
            });
        } else {
            router.push('/chat');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.headerRow}>
                <CustomText style={styles.headerText}>AI Chef Chat History</CustomText>
            </View>
            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search Chats"
                    placeholderTextColor="#888"
                />
                <Ionicons name="search" size={22} color="#888" style={styles.searchIcon} />
            </View>
            {/* Start New Chat Button */}
            <TouchableOpacity
                ref={startChatRef}
                style={styles.aiChefButton}
                onPress={() => openChatFromRef(startChatRef)}
            >
                <CustomText style={styles.aiChefButtonText}>Start New Chat</CustomText>
            </TouchableOpacity>
            {/* Chat History List */}
            <FlatList
                data={chatHistory}
                keyExtractor={(_, idx) => idx.toString()}
                renderItem={({ item, index }) => {
                    return (
                        <View style={styles.chatRow}>
                            <View style={{ flex: 1 }}>
                                <CustomText style={styles.chatTime}>{item.time}</CustomText>
                                <CustomText style={styles.chatSummary}>Summary: {item.summary}</CustomText>
                            </View>
                            <TouchableOpacity
                                ref={el => { chatBtnRefs.current[index] = el; }}
                                style={styles.chatIconButton}
                                onPress={() => openChatFromRef(chatBtnRefs.current[index])}
                            >
                                <Image source={require('../../assets/images/chat.png')} style={styles.chatIconImage} />
                            </TouchableOpacity>
                        </View>
                    );
                }}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F6F9', paddingTop: 80, paddingHorizontal: 0 },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 18,
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
        marginRight: 32, // to balance the back button
    },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 16,
        marginHorizontal: 16,
        marginBottom: 18,
        height: 48,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#222',
    },
    searchIcon: {
        marginLeft: 8,
    },
    listContent: {
        paddingHorizontal: 16,
        paddingBottom: 24,
    },
    chatRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderRadius: 16,
        paddingVertical: 10,
        paddingHorizontal: 0,
        marginBottom: 2,
    },
    chatTime: {
        fontSize: 15,
        fontWeight: '700',
        color: '#444',
    },
    chatSummary: {
        fontSize: 14,
        color: '#6C757D',
    },
    chatIconButton: {
        marginLeft: 12,
        padding: 4,
    },
    chatIconImage: {
        width: 28,
        height: 28,
        resizeMode: 'contain',
    },
    aiChefButton: {
        backgroundColor: '#6DA98C',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        height: 50,
        minWidth: 350,
        paddingHorizontal: 24,
        marginTop: 0,
        marginBottom: 18,
        alignSelf: 'center',
    },
    aiChefButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
}); 