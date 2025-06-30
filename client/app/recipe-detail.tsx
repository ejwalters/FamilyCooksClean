import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image, SafeAreaView, Modal, Animated, Easing } from 'react-native';
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

  // --- New State ---
  const [cooking, setCooking] = useState(false);
  const [timer, setTimer] = useState(0); // Start at 0 and count up
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState(Array(recipe.ingredients.length).fill(false));
  const [completedSteps, setCompletedSteps] = useState(Array(recipe.steps.length).fill(false));
  const [timerRunning, setTimerRunning] = useState(false);
  const [showTimerOptions, setShowTimerOptions] = useState(false);
  // Airbnb-style pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  // Timer increment effect (separate from animation)
  useEffect(() => {
    if (cooking && timerRunning) {
      timerRef.current = setTimeout(() => setTimer(t => t + 1), 1000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [cooking, timerRunning, timer]);

  // Pulse animation effect
  useEffect(() => {
    if (cooking && timerRunning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.08, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
    // No cleanup needed for animation here
  }, [cooking, timerRunning]);

  // Format timer as mm:ss
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Ingredient check handler
  const toggleIngredient = (idx: number) => {
    setCheckedIngredients(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
  };

  // Step complete handler
  const toggleStep = (idx: number) => {
    setCompletedSteps(prev => {
      const next = [...prev];
      next[idx] = !next[idx];
      return next;
    });
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
          {/* Cooking Timer or Button */}
          {!cooking ? (
            <TouchableOpacity style={styles.cookButton} onPress={() => { setCooking(true); setTimerRunning(true); setTimer(0); }}>
              <CustomText style={styles.cookButtonText}>Start Cooking</CustomText>
            </TouchableOpacity>
          ) : (
            <View style={styles.timerBarRow}>
              <Animated.View style={[styles.timerBox, { transform: [{ scale: timerRunning ? pulseAnim : 1 }] }]}>
                <CustomText style={styles.timerText}>{formatTime(timer)}</CustomText>
                {!timerRunning && <Ionicons name="pause-circle" size={22} color="#fff" style={{ marginLeft: 4 }} />}
              </Animated.View>
              <TouchableOpacity style={styles.timerOptionsButton} onPress={() => setShowTimerOptions(true)}>
                <Ionicons name="ellipsis-horizontal" size={26} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
          {/* Timer Options Modal */}
          <Modal
            visible={showTimerOptions}
            transparent
            animationType="fade"
            onRequestClose={() => setShowTimerOptions(false)}
          >
            <View style={styles.modalOverlay}>
              <Animated.View style={styles.modalContent}>
                {timerRunning ? (
                  <TouchableOpacity style={[styles.modalButton, styles.modalButtonGold]} onPress={() => { setTimerRunning(false); setShowTimerOptions(false); }}>
                    <Ionicons name="pause" size={22} color="#fff" style={{ marginRight: 8 }} />
                    <CustomText style={styles.modalButtonText}>Pause</CustomText>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity style={[styles.modalButton, styles.modalButtonGold]} onPress={() => { setTimerRunning(true); setShowTimerOptions(false); }}>
                    <Ionicons name="play" size={22} color="#fff" style={{ marginRight: 8 }} />
                    <CustomText style={styles.modalButtonText}>Resume</CustomText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonRed]} onPress={() => {
                  setCooking(false);
                  setTimerRunning(false);
                  setTimer(0);
                  setShowTimerOptions(false);
                }}>
                  <Ionicons name="stop" size={22} color="#fff" style={{ marginRight: 8 }} />
                  <CustomText style={styles.modalButtonText}>End Recipe</CustomText>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.modalButtonGray]} onPress={() => setShowTimerOptions(false)}>
                  <Ionicons name="close" size={22} color="#6C757D" style={{ marginRight: 8 }} />
                  <CustomText style={[styles.modalButtonText, { color: '#6C757D' }]}>Cancel</CustomText>
                </TouchableOpacity>
              </Animated.View>
            </View>
          </Modal>
          <CustomText style={styles.sectionTitle}>Ingredients</CustomText>
          {recipe.ingredients.map((ing, idx) => (
            <TouchableOpacity key={idx} style={styles.ingredientRow} onPress={() => toggleIngredient(idx)}>
              <CustomText style={[styles.ingredientText, checkedIngredients[idx] && { textDecorationLine: 'line-through', color: '#A0A0A0' }]}>{ing}</CustomText>
              <View style={[styles.checkbox, checkedIngredients[idx] && styles.checkboxChecked]}>
                {checkedIngredients[idx] && (
                  <Ionicons name="checkmark" size={18} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          ))}
          <CustomText style={styles.sectionTitle}>Steps</CustomText>
          {recipe.steps.map((step, idx) => (
            <View key={idx} style={styles.stepRow}>
              <CustomText style={[styles.stepText, completedSteps[idx] && { textDecorationLine: 'line-through', color: '#A0A0A0' }]}>{idx + 1}. {step}</CustomText>
              <TouchableOpacity
                style={[styles.stepButton, completedSteps[idx] ? styles.stepButtonComplete : styles.stepButtonStart]}
                onPress={() => toggleStep(idx)}
              >
                <CustomText style={completedSteps[idx] ? styles.stepButtonTextComplete : styles.stepButtonTextStart}>
                  {completedSteps[idx] ? 'Complete' : 'Start'}
                </CustomText>
              </TouchableOpacity>
            </View>
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
  timerBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    justifyContent: 'center',
  },
  timerBox: {
    backgroundColor: '#E2B36A',
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    minWidth: 140,
    flexDirection: 'row',
    shadowColor: '#E2B36A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    paddingHorizontal: 36,
  },
  timerText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1,
    textAlign: 'center',
  },
  pausedText: {
    color: '#fff',
    fontSize: 14,
    fontStyle: 'italic',
    marginLeft: 8,
  },
  timerOptionsButton: {
    marginLeft: 18,
    backgroundColor: 'rgba(226,179,106,0.85)',
    borderRadius: 22,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    width: 44,
    shadowColor: '#E2B36A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingVertical: 32,
    paddingHorizontal: 24,
    width: 300,
    alignItems: 'stretch',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 12,
    gap: 8,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    paddingVertical: 16,
    marginVertical: 4,
    marginHorizontal: 0,
    shadowColor: 'transparent',
  },
  modalButtonGold: {
    backgroundColor: '#E2B36A',
  },
  modalButtonRed: {
    backgroundColor: '#FF385C',
  },
  modalButtonGray: {
    backgroundColor: '#F1F6F9',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  modalButtonText: {
    fontSize: 18,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  checkboxChecked: {
    backgroundColor: '#E2B36A',
    borderColor: '#E2B36A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  stepButton: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginLeft: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  stepButtonStart: {
    backgroundColor: '#E2B36A',
  },
  stepButtonComplete: {
    backgroundColor: '#7BA892',
  },
  stepButtonTextStart: {
    color: '#fff',
    fontWeight: '700',
  },
  stepButtonTextComplete: {
    color: '#fff',
    fontWeight: '700',
  },
}); 