import React from 'react';
import { View, TextInput, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../../components/CustomText';

const filters = ['15min Meals', 'Kid Friendly', 'Vegan', 'Healthy'];

const recipes = Array(5).fill({
    title: 'Honey Garlic Chicken',
    time: '15 min',
    ingredients: 6,
});

export default function FavoritesScreen() {
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
            <FlatList
                data={recipes}
                keyExtractor={(_, idx) => idx.toString()}
                renderItem={({ item }) => (
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
                                {item.ingredients} Ingredients
                            </CustomText>
                        </View>
                        <TouchableOpacity>
                            <Image
                                source={require('../../assets/images/heart.png')}
                                style={styles.heartIcon}
                                resizeMode="contain"
                            />
                        </TouchableOpacity>
                    </View>
                )}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
            />
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