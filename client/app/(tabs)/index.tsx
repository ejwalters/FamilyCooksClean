import React, { useState, useEffect, useRef } from 'react';
import { View, TextInput, StyleSheet, Image, ScrollView, TouchableOpacity, FlatList, ActivityIndicator, Modal, Animated, Pressable, Keyboard, TouchableWithoutFeedback, LayoutAnimation, Platform, UIManager } from 'react-native';
import CustomText from '../../components/CustomText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { useFocusEffect } from '@react-navigation/native';
import { profileService } from '../../lib/profileService';

export default function HomeScreen() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchTouched, setSearchTouched] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const dropdownAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [favorites, setFavorites] = useState<any[]>([]);
  const [recentlyCooked, setRecentlyCooked] = useState<any[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ avatar_url?: string } | null>(null);

  // Fetch user ID on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id);
    });
  }, []);

  // Fetch profile on mount
  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileData = await profileService.getProfile();
        setProfile(profileData);
      } catch (e) {
        console.log('HomeScreen profile load error:', e);
      }
    };
    loadProfile();
  }, []);

  // Fetch favorites function
  const fetchFavorites = () => {
    if (!userId) return;
    fetch(`https://familycooksclean.onrender.com/recipes/favorites?user_id=${userId}`)
      .then(res => res.json())
      .then(data => {
        const favoritesArray = Array.isArray(data) ? data : [];
        setFavorites(favoritesArray);
      })
      .catch(() => {
        setFavorites([]);
      });
  };

  // Fetch recently cooked function
  const fetchRecentlyCooked = () => {
    if (!userId) return;
    fetch(`https://familycooksclean.onrender.com/recipes/recently-cooked?user_id=${userId}&limit=5`)
      .then(res => res.json())
      .then(data => {
        const recentlyCookedArray = Array.isArray(data) ? data : [];
        setRecentlyCooked(recentlyCookedArray);
      })
      .catch((err) => {
        console.error('Error fetching recently cooked:', err);
        setRecentlyCooked([]);
      });
  };

  // Fetch data on mount and when userId changes
  useEffect(() => {
    fetchFavorites();
    fetchRecentlyCooked();
  }, [userId]);

  // Force reload data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchFavorites();
      fetchRecentlyCooked();
    }, [userId])
  );

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

  // Animate dropdown in/out
  useEffect(() => {
    if (searchTouched && search.length > 0) {
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [searchTouched, search]);

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

  // Enable LayoutAnimation on Android
  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  // Animate search bar expansion
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [search, searchResults, searching]);

  function closeDropdown() {
    setSearch('');
    setSearchTouched(false);
    setSearchResults([]);
    Keyboard.dismiss();
  }

  // In the render, adjust the style for searchBarExpanded based on results
  const hasResults = Array.isArray(searchResults) && searchResults.length > 0;
  const isLoading = searching;
  const resultCount = Array.isArray(searchResults) ? searchResults.length : 0;
  let dynamicExpandStyle = styles.searchBarExpanded;
  if (!hasResults && !isLoading) dynamicExpandStyle = styles.searchBarNoResults;
  else if (resultCount <= 2) dynamicExpandStyle = styles.searchBarSmallResults;
  else if (resultCount <= 4) dynamicExpandStyle = styles.searchBarMediumResults;

  return (
    <TouchableWithoutFeedback onPress={closeDropdown} accessible={false}>
      <View style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Image
              source={
                profile?.avatar_url
                  ? { uri: profile.avatar_url }
                  : require('../../assets/images/avatar.png')
              }
              style={styles.avatar}
            />
            <CustomText style={styles.logoText}>LOGO</CustomText>
          </View>
          <View style={[
            styles.searchBarContainer,
            (searchTouched && search.length > 0) && dynamicExpandStyle
          ]}>
            {/* Input row with search icon */}
            <View style={styles.inputRow}>
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
            {/* Results inside the search bar */}
            {searchTouched && search.length > 0 && (
              <View style={styles.resultsList}>
                {searching ? (
                  <View style={styles.loadingBox}>
                    <Animated.Image
                      source={require('../../assets/images/fork-knife.png')}
                      style={{ width: 40, height: 40, tintColor: '#8CBEC7', transform: [{ scale: pulseAnim }] }}
                    />
                    <CustomText style={{ color: '#8CBEC7', marginTop: 8, fontWeight: '700' }}>Searching...</CustomText>
                  </View>
                ) : !Array.isArray(searchResults) || searchResults.length === 0 ? (
                  <CustomText style={{ textAlign: 'center', color: '#6C757D', marginTop: 16, marginBottom: 12 }}>
                    No results for '{search}'
                  </CustomText>
                ) : (
                  <ScrollView style={{ maxHeight: 180 }} keyboardShouldPersistTaps="handled">
                    {searchResults.slice(0, 8).map((item, idx) => (
                      <TouchableOpacity
                        key={item.id || item.title || idx}
                        onPress={() => { router.push({ pathname: '/recipe-detail', params: { id: item.id } }); closeDropdown(); }}
                        style={styles.resultItem}
                        activeOpacity={0.85}
                      >
                        <View style={styles.dropdownItemRow}>
                          <Image source={require('../../assets/images/fork-knife.png')} style={styles.dropdownIcon} />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <CustomText style={styles.dropdownItemText}>{item.title}</CustomText>
                          </View>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}
          </View>
          <CustomText style={styles.sectionPrompt}>Stuck without a dinner plan?</CustomText>
          <TouchableOpacity 
            style={styles.aiChefButton}
            onPress={() => router.push('/chat')}
          >
            <CustomText style={styles.aiChefButtonText}>Ask The AI Chef</CustomText>
          </TouchableOpacity>
          <CustomText style={styles.sectionTitle}>Recently Cooked</CustomText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}
            style={styles.cardRowContainer}
          >
            {recentlyCooked.length > 0 ? (
              recentlyCooked.map((item, idx) => (
                <TouchableOpacity 
                  key={item.id || idx} 
                  onPress={() => router.push({ pathname: '/recipe-detail', params: { id: item.id } })} 
                  style={[styles.card, styles.cardBlue]}
                >
                  <CustomText style={styles.cardText}>{item.title}</CustomText>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.card, styles.cardBlue, { opacity: 0.6 }]}>
                <CustomText style={styles.cardText}>No recipes cooked yet</CustomText>
              </View>
            )}
          </ScrollView>
          <CustomText style={styles.sectionTitle}>Favorites</CustomText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cardRow}
            style={styles.cardRowContainer}
          >
            {favorites.length > 0 ? (
              favorites.map((item, idx) => (
                <TouchableOpacity 
                  key={item.id || idx} 
                  onPress={() => router.push({ pathname: '/recipe-detail', params: { id: item.id } })} 
                  style={[styles.card, styles.cardGold]}
                >
                  <CustomText style={styles.cardText}>{item.title}</CustomText>
                </TouchableOpacity>
              ))
            ) : (
              <View style={[styles.card, styles.cardGold, { opacity: 0.6 }]}>
                <CustomText style={styles.cardText}>No favorites yet</CustomText>
              </View>
            )}
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
    marginBottom: 0,
    height: 52,
    shadowColor: 'transparent',
    position: 'relative',
    overflow: 'visible',
  },
  searchBarExpanded: {
    minHeight: 180,
    paddingBottom: 8,
    height: 'auto',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  searchBarNoResults: {
    minHeight: 70,
    paddingVertical: 8,
    paddingBottom: 8,
    height: 'auto',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
  },
  searchBarSmallResults: {
    minHeight: 90,
    paddingVertical: 10,
    paddingBottom: 8,
    height: 'auto',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
  },
  searchBarMediumResults: {
    minHeight: 130,
    paddingVertical: 16,
    paddingBottom: 8,
    height: 'auto',
    flexDirection: 'column',
    alignItems: 'stretch',
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 0,
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
    marginTop: 20,
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
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  resultsList: {
    width: '100%',
    backgroundColor: 'transparent',
    borderBottomLeftRadius: 18,
    borderBottomRightRadius: 18,
    overflow: 'hidden',
    marginTop: 0,
    paddingTop: 0,
  },
  resultItem: {
    paddingVertical: 14,
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F6F9',
    backgroundColor: 'transparent',
  },
  dropdownItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F6F9',
  },
  dropdownItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownIcon: {
    width: 24,
    height: 24,
    tintColor: '#8CBEC7',
    borderRadius: 8,
    backgroundColor: '#F1F6F9',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#222',
    fontWeight: '600',
  },
  dropdownLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingTop: 0,
    paddingBottom: 4,
  },
  dropdownLabelText: {
    fontSize: 15,
    color: '#8CBEC7',
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  dropdownDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginHorizontal: 12,
    marginBottom: 2,
  },
});
