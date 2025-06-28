import React from 'react';
import { View, TextInput, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import CustomText from '../../components/CustomText';
import { Ionicons } from '@expo/vector-icons';

const recentlyCooked = [
  { title: 'Honey Garlic Chicken' },
  { title: 'Homemade Chili' },
  { title: 'Beef & Broccoli' },
];
const favorites = [
  { title: 'Honey Garlic Chicken' },
  { title: 'Homemade Chili' },
  { title: 'Beef & Broccoli' },
];

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Image
          source={require('../../assets/images/avatar.png')}
          style={styles.avatar}
        />
        <CustomText style={styles.logoText}>LOGO</CustomText>
      </View>
      <View style={styles.searchBarContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search Recipes"
          placeholderTextColor="#888"
        />
        <Ionicons name="search" size={22} color="#888" style={styles.searchIcon} />
      </View>
      <CustomText style={styles.sectionPrompt}>Stuck without a dinner plan?</CustomText>
      <TouchableOpacity style={styles.aiChefButton}>
        <CustomText style={styles.aiChefButtonText}>Ask The AI Chef</CustomText>
      </TouchableOpacity>
      <CustomText style={styles.sectionTitle}>Recently Cooked</CustomText>
      <View style={styles.cardRow}>
        {recentlyCooked.map((item, idx) => (
          <View key={idx} style={[styles.card, styles.cardBlue]}>
            <CustomText style={styles.cardText}>{item.title}</CustomText>
          </View>
        ))}
      </View>
      <CustomText style={styles.sectionTitle}>Favorites</CustomText>
      <View style={styles.cardRow}>
        {favorites.map((item, idx) => (
          <View key={idx} style={[styles.card, styles.cardGold]}>
            <CustomText style={styles.cardText}>{item.title}</CustomText>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F6F9',
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 16,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 24,
    marginRight: 16,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 1,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
    height: 52,
    shadowColor: 'transparent',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Nunito',
    color: '#222',
  },
  searchIcon: {
    marginLeft: 8,
  },
  sectionPrompt: {
    fontSize: 15,
    color: '#444',
    marginBottom: 8,
    fontWeight: '600',
  },
  aiChefButton: {
    backgroundColor: '#6DA98C',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginBottom: 24,
  },
  aiChefButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#444',
    marginBottom: 12,
    marginTop: 8,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 12,
  },
  card: {
    flex: 1,
    minWidth: 130,
    minHeight: 120,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  cardBlue: {
    backgroundColor: '#8CBEC7',
  },
  cardGold: {
    backgroundColor: '#E2B36A',
  },
  cardText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
});
