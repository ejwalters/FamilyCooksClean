import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, Image, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Modal, Animated, Pressable, Keyboard, TouchableWithoutFeedback } from 'react-native';
import CustomText from '../../components/CustomText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

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
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchTouched, setSearchTouched] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const dropdownRef = useRef<View>(null);

  useEffect(() => {
    if (!search) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timeout = setTimeout(() => {
      fetch(`https://familycooksclean.onrender.com/recipes/list?q=${encodeURIComponent(search)}`)
        .then(res => res.json())
        .then(data => {
          setSearchResults(Array.isArray(data) ? data : []);
          setSearching(false);
        })
        .catch(() => { setSearchResults([]); setSearching(false); });
    }, 400);
    return () => clearTimeout(timeout);
  }, [search]);

  // Pulsing animation for fork-knife
  useEffect(() => {
    if (searching) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [searching]);

  function closeDropdown() {
    setSearch('');
    setSearchTouched(false);
    setSearchResults([]);
    Keyboard.dismiss();
  }

  return (
    <TouchableWithoutFeedback onPress={closeDropdown} accessible={false}>
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
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
              value={search}
              onChangeText={t => { setSearch(t); setSearchTouched(true); }}
              autoCorrect={false}
              autoCapitalize="none"
              onFocus={() => setSearchTouched(true)}
            />
            <Ionicons name="search" size={22} color="#888" style={styles.searchIcon} />
          </View>
          {/* Search Dropdown */}
          {searchTouched && search.length > 0 && (
            <View style={styles.dropdown} ref={dropdownRef}>
              {searching ? (
                <View style={styles.loadingBox}>
                  <Animated.Image
                    source={require('../../assets/images/fork-knife.png')}
                    style={{ width: 40, height: 40, tintColor: '#8CBEC7', transform: [{ scale: pulseAnim }] }}
                  />
                  <CustomText style={{ color: '#8CBEC7', marginTop: 8, fontWeight: '700' }}>Searching...</CustomText>
                </View>
              ) : !Array.isArray(searchResults) || searchResults.length === 0 ? (
                <CustomText style={{ textAlign: 'center', color: '#6C757D', marginTop: 16, marginBottom: 12 }}>No recipes found.</CustomText>
              ) : (
                <View style={{ maxHeight: 260 }}>
                  {searchResults.slice(0, 15).map((item, idx) => (
                    <TouchableOpacity
                      key={item.id || item.title || idx}
                      onPress={() => { router.push({ pathname: '/recipe-detail', params: { id: item.id } }); closeDropdown(); }}
                      style={styles.dropdownItem}
                    >
                      <CustomText style={styles.dropdownItemText}>{item.title}</CustomText>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          )}
          <CustomText style={styles.sectionPrompt}>Stuck without a dinner plan?</CustomText>
          <TouchableOpacity style={styles.aiChefButton}>
            <CustomText style={styles.aiChefButtonText}>Ask The AI Chef</CustomText>
          </TouchableOpacity>
          <CustomText style={styles.sectionTitle}>Recently Cooked</CustomText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}
            style={styles.cardRowContainer}
          >
            {recentlyCooked.map((item, idx) => (
              <TouchableOpacity key={idx} onPress={() => router.push({ pathname: '/recipe-detail', params: item })} style={[styles.card, styles.cardBlue]}>
                <CustomText style={styles.cardText}>{item.title}</CustomText>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <CustomText style={styles.sectionTitle}>Favorites</CustomText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}
            style={styles.cardRowContainer}
          >
            {favorites.map((item, idx) => (
              <TouchableOpacity key={idx} onPress={() => router.push({ pathname: '/recipe-detail', params: item })} style={[styles.card, styles.cardGold]}>
                <CustomText style={styles.cardText}>{item.title}</CustomText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </ScrollView>
      </View>
    </TouchableWithoutFeedback>
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
  cardRowContainer: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  cardRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 20,
  },
  card: {
    width: 130,
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
  dropdown: {
    position: 'absolute',
    top: 132, // below search bar
    left: 20,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 18,
    elevation: 12,
    zIndex: 10,
    minHeight: 40,
    maxHeight: 300,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F6F9',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '600',
  },
});
