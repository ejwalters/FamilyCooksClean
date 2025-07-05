import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, FlatList, TouchableOpacity, Image, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../../components/CustomText';
import { useRouter } from 'expo-router';
import { Heart, HeartIcon } from 'lucide-react-native';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';

const filters = ['15min Meals', 'Kid Friendly', 'Vegan', 'Healthy'];

function ForkKnifeLoading() {
    const pulseAnim = React.useRef(new Animated.Value(1)).current;
    React.useEffect(() => {
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
            ])
        );
        loop.start();
        return () => loop.stop();
    }, [pulseAnim]);
    return (
        <View style={{ alignItems: 'center', marginTop: 48, marginBottom: 24 }}>
            <Animated.Image
                source={require('../../assets/images/fork-knife.png')}
                style={{ width: 44, height: 44, tintColor: '#8CBEC7', transform: [{ scale: pulseAnim }] }}
                resizeMode="contain"
            />
        </View>
    );
}

export default function FavoritesScreen() {
    const router = useRouter();
    const [userId, setUserId] = useState<string | null>(null);
    const [favorites, setFavorites] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [searching, setSearching] = useState(false);
    const [filteredFavorites, setFilteredFavorites] = useState<any[]>([]);

    // Fetch user ID on mount
    useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data?.user) setUserId(data.user.id);
        });
    }, []);

    // Fetch favorites function
    const fetchFavorites = () => {
        if (!userId) {
            console.log('Favorites screen: No userId, skipping fetch');
            return;
        }
        console.log('Favorites screen: Fetching favorites for user:', userId);
        const url = `https://familycooksclean.onrender.com/recipes/favorites?user_id=${userId}`;
        console.log('Favorites screen: URL:', url);
        fetch(url)
            .then(res => {
                console.log('Favorites screen: Response status:', res.status);
                return res.json();
            })
            .then(data => {
                console.log('Favorites screen: API response:', data);
                console.log('Favorites screen: Response type:', typeof data);
                console.log('Favorites screen: Is array?', Array.isArray(data));
                // Ensure data is always an array
                const favoritesArray = Array.isArray(data) ? data : [];
                console.log('Favorites screen: Processed array:', favoritesArray);
                console.log('Favorites screen: Array length:', favoritesArray.length);
                setFavorites(favoritesArray);
                setFilteredFavorites(favoritesArray);
            })
            .catch((err) => {
                console.error('Favorites screen: Error fetching favorites:', err);
                setFavorites([]);
                setFilteredFavorites([]);
            });
    };

    // Fetch favorites from backend
    useEffect(() => {
        fetchFavorites();
    }, [userId]);

    // Force reload favorites when screen comes into focus
    useFocusEffect(
        React.useCallback(() => {
            console.log('Favorites screen: Focus effect triggered');
            fetchFavorites();
        }, [userId])
    );

    // Search effect (filter favorites)
    useEffect(() => {
        if (search === '') {
            setFilteredFavorites(favorites || []);
            setSearching(false);
            return;
        }
        setSearching(true);
        const timeout = setTimeout(() => {
            // Ensure favorites is an array before filtering
            const favoritesArray = Array.isArray(favorites) ? favorites : [];
            const filtered = favoritesArray.filter(r =>
                r.title.toLowerCase().includes(search.toLowerCase())
            );
            setFilteredFavorites(filtered);
            setSearching(false);
        }, 300);
        return () => clearTimeout(timeout);
    }, [search, favorites]);

    // Handler for heart icon (unfavorite from favorites list)
    const handleToggleFavorite = async (recipeId: string) => {
        if (!userId) return;
        try {
            // Remove favorite
            const res = await fetch('https://familycooksclean.onrender.com/recipes/favorite', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ user_id: userId, recipe_id: recipeId }),
            });
            if (!res.ok) throw new Error('Failed to unfavorite');
            
            // Remove from local state
            setFavorites(prev => prev.filter(r => r.id !== recipeId));
            setFilteredFavorites(prev => prev.filter(r => r.id !== recipeId));
        } catch (err) {
            alert('Failed to remove favorite. Please try again.');
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <CustomText style={styles.headerText}>My Favorites</CustomText>
            </View>

            {/* Search Bar */}
            <View style={styles.searchBarContainer}>
                <TextInput
                    placeholder="Search Recipes"
                    style={styles.searchBar}
                    placeholderTextColor="#A0A0A0"
                    value={search}
                    onChangeText={setSearch}
                />
                <Ionicons name="search" size={22} style={styles.searchIcon} />
            </View>

            {/* Prompt */}
            <CustomText style={styles.prompt}>
                Not sure what to search? Try a prompt like : 'Dinner using ground chicken and spinach'
            </CustomText>

            {/* Filters */}
            <View style={styles.filtersContainer}>
                {filters.map((filter) => (
                    <View key={filter} style={styles.filterChip}>
                        <CustomText style={styles.filterText}>{filter}</CustomText>
                    </View>
                ))}
            </View>

            {/* Recipes Title */}
            <CustomText style={styles.sectionTitle}>Recipes</CustomText>

            {/* Recipes List */}
            {searching ? (
                <ForkKnifeLoading />
            ) : (
                <FlatList
                    data={filteredFavorites}
                    keyExtractor={item => item.id}
                    renderItem={({ item }) => (
                        <TouchableOpacity onPress={() => router.push({ pathname: '/recipe-detail', params: { id: item.id } })}>
                            <View style={styles.recipeCard}>
                                <View style={styles.recipeIcon}>
                                    <Image
                                        source={require('../../assets/images/fork-knife.png')}
                                        style={styles.iconImage}
                                        resizeMode="contain"
                                    />
                                </View>
                                <View style={styles.recipeInfo}>
                                    <CustomText style={styles.recipeTitle}>{item.title}</CustomText>
                                    <View style={styles.recipeMeta}>
                                        <Ionicons name="time-outline" size={14} color="#6C757D" />
                                        <CustomText style={styles.recipeMetaText}>{item.time}</CustomText>
                                    </View>
                                    <CustomText style={styles.recipeIngredients}>
                                        {item.ingredients?.length || 0} Ingredients
                                    </CustomText>
                                </View>
                                <TouchableOpacity
                                    onPress={() => handleToggleFavorite(item.id)}
                                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                                >
                                    <HeartIcon color="#E4576A" size={24} style={styles.heartIcon} />
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={<CustomText style={{ textAlign: 'center', marginTop: 40 }}>No recipes found.</CustomText>}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F6F9', paddingHorizontal: 16, paddingTop: 80 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    headerText: { fontSize: 24, fontWeight: '700', flex: 1, textAlign: 'center' },
    searchBarContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 16,
        marginBottom: 8,
        height: 44,
    },
    searchBar: { flex: 1, fontSize: 16, color: '#333' },
    searchIcon: { color: '#A0A0A0' },
    prompt: { color: '#6C757D', fontSize: 13, marginVertical: 8, textAlign: 'center' },
    filtersContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 16 },
    filterChip: {
        backgroundColor: '#7BA892',
        borderRadius: 16,
        paddingHorizontal: 12,
        paddingVertical: 4,
        marginHorizontal: 4,
    },
    filterText: { color: '#fff', fontSize: 13 },
    sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
    listContent: { paddingBottom: 80 },
    recipeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 12,
        marginBottom: 12,
    },
    recipeIcon: {
        width: 74,
        height: 72,
        borderRadius: 20,
        backgroundColor: '#7BA892',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    recipeInfo: { flex: 1 },
    recipeTitle: { fontSize: 16, fontWeight: '600', marginBottom: 2 },
    recipeMeta: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
    recipeMetaText: { fontSize: 13, color: '#6C757D', marginLeft: 4 },
    recipeIngredients: { fontSize: 13, color: '#6C757D' },
    iconImage: {
        width: 32,
        height: 32,
        tintColor: '#fff',
    },
    heartIcon: {
        width: 24,
        height: 24,
    },
}); 