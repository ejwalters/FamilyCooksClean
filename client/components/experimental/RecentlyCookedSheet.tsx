import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity, FlatList, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../CustomText';

const CARD_COLORS = ['#CDEFE3', '#E2E2F9', '#FFF7D1', '#D6ECFB'];
const CARD_ICON_BG = ['#E6F6F0', '#F0F0FB', '#FFFBE7', '#EAF6FE'];
const CARD_WIDTH = (Dimensions.get('window').width - 18 * 2 - 16) / 2;

interface RecentlyCookedSheetProps {
  recipes: any[];
  router: any;
  onClose: () => void;
}

export default function RecentlyCookedSheet({ recipes, router }: RecentlyCookedSheetProps) {
  const renderItem = ({ item, index }: { item: any; index: number }) => {
    const cardColor = CARD_COLORS[index % CARD_COLORS.length];
    const iconBg = CARD_ICON_BG[index % CARD_ICON_BG.length];
    return (
      <TouchableOpacity
        key={item.id || index}
        style={[styles.card, { backgroundColor: cardColor }]}
        activeOpacity={0.88}
        onPress={() => router.push({ pathname: '/recipe-detail', params: { id: item.id } })}
      >
        <View style={[styles.cardImageWrapper, { backgroundColor: iconBg }]}> 
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.cardImage} />
          ) : (
            <Ionicons name="fast-food-outline" size={32} color="#B0B0B0" />
          )}
        </View>
        <CustomText style={styles.cardTitle} numberOfLines={2}>{item.title || 'No name'}</CustomText>
        <View style={styles.cardMetaRow}>
          <CustomText style={styles.cardMeta} numberOfLines={1}>
            {Array.isArray(item.ingredients) ? item.ingredients.length : 0} ingredients
          </CustomText>
          <CustomText style={styles.cardMeta} numberOfLines={1}>
            • {item.time || '—'}
          </CustomText>
        </View>
        <Ionicons
          name={'heart-outline'}
          size={22}
          color={'#B0B0B0'}
          style={styles.cardHeart}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <View style={styles.headerContainer}>
        <CustomText style={styles.headerTitle}>Recently Cooked</CustomText>
        <CustomText style={styles.headerSubtitle}>Your latest creations, at a glance</CustomText>
      </View>
      {(!recipes || recipes.length === 0) ? (
        <CustomText style={styles.emptyText}>No recently cooked recipes yet.</CustomText>
      ) : (
        <FlatList
          data={recipes}
          renderItem={renderItem}
          keyExtractor={(item, idx) => item.id ? String(item.id) : String(idx)}
          numColumns={2}
          contentContainerStyle={styles.gridContent}
          columnWrapperStyle={styles.gridRow}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 60,
    marginBottom: 18,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#222',
    textAlign: 'center',
    marginBottom: 2,
    letterSpacing: -0.5,
    marginTop: 2,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#B0B0B0',
    fontSize: 17,
    marginTop: 32,
  },
  gridContent: {
    paddingHorizontal: 18,
    paddingBottom: 32,
    paddingTop: 0,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 22,
    paddingVertical: 26,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    position: 'relative',
    marginTop: 4,
  },
  cardImageWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  cardImage: {
    width: 56,
    height: 56,
    borderRadius: 16,
    resizeMode: 'cover',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 8,
    minHeight: 44,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  cardHeart: {
    position: 'absolute',
    top: 18,
    right: 18,
  },
}); 