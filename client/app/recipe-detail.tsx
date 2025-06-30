import React from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import CustomText from '../components/CustomText';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const recipe = {
    title: params.title || 'Honey Garlic Chicken',
    time: params.time || '15 min',
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
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F6F9' }}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.headerImage}>
          <Image
            source={require('../assets/images/fork-knife.png')}
            style={{ width: 64, height: 64, tintColor: '#fff', alignSelf: 'center', marginTop: 32 }}
          />
        </View>
        <View style={{ paddingHorizontal: 20, marginTop: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <CustomText style={styles.title}>{recipe.title}</CustomText>
            <TouchableOpacity>
              <Ionicons name="heart-outline" size={28} color="#6C757D" />
            </TouchableOpacity>
          </View>
          <CustomText style={styles.meta}>
            <Ionicons name="time-outline" size={16} color="#6C757D" /> {recipe.time}  •  Last made {recipe.lastMade}
          </CustomText>
          <View style={{ flexDirection: 'row', marginVertical: 8 }}>
            {recipe.tags.map((tag, idx) => (
              <View key={idx} style={styles.tag}><CustomText style={styles.tagText}>{tag}</CustomText></View>
            ))}
          </View>
          <TouchableOpacity style={styles.cookButton}>
            <CustomText style={styles.cookButtonText}>Start Cooking</CustomText>
          </TouchableOpacity>
          <CustomText style={styles.sectionTitle}>Ingredients</CustomText>
          {recipe.ingredients.map((ing, idx) => (
            <View key={idx} style={styles.ingredientRow}>
              <CustomText style={styles.ingredientText}>{ing}</CustomText>
              <View style={styles.checkbox} />
            </View>
          ))}
          <CustomText style={styles.sectionTitle}>Steps</CustomText>
          {recipe.steps.map((step, idx) => (
            <CustomText key={idx} style={styles.stepText}>{idx + 1}. {step}</CustomText>
          ))}
          <CustomText style={styles.sectionTitle}>AI Chef</CustomText>
          <CustomText style={styles.aiChefText}>
            Missing or want to substitute an ingredient? Make it protein-packed or vegan? Ask the AI Chef how!
          </CustomText>
          <TouchableOpacity style={styles.askChefButton} onPress={() => router.push('/chat')}>
            <CustomText style={styles.askChefButtonText}>Ask The AI Chef</CustomText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    backgroundColor: '#8CBEC7',
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#222',
    flex: 1,
  },
  meta: {
    color: '#6C757D',
    fontSize: 14,
    marginTop: 2,
  },
  tag: {
    backgroundColor: '#7BA892',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    marginRight: 8,
  },
  tagText: {
    color: '#fff',
    fontSize: 13,
  },
  cookButton: {
    backgroundColor: '#E2B36A',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginVertical: 18,
  },
  cookButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginTop: 18,
    marginBottom: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  ingredientText: {
    fontSize: 16,
    color: '#222',
    flex: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#C4C4C4',
    backgroundColor: '#fff',
    marginLeft: 8,
  },
  stepText: {
    fontSize: 16,
    color: '#222',
    marginBottom: 6,
  },
  aiChefText: {
    color: '#6C757D',
    fontSize: 14,
    marginBottom: 12,
  },
  askChefButton: {
    backgroundColor: '#7BA892',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: 8,
    marginBottom: 24,
  },
  askChefButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
}); 