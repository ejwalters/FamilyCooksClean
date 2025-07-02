import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image, SafeAreaView, Modal, Animated, Easing, KeyboardAvoidingView, Platform, TextInput, PanResponder, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import CustomText from '../components/CustomText';
import { supabase } from '../lib/supabase';

export default function RecipeDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const isAIRecipe = params.isAI === '1';
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [loading, setLoading] = useState(!isAIRecipe);
  const [recipe, setRecipe] = useState<any>(null);

  // --- New State ---
  const [cooking, setCooking] = useState(false);
  const [timer, setTimer] = useState(0); // Start at 0 and count up
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [checkedIngredients, setCheckedIngredients] = useState<boolean[]>([]);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showTimerOptions, setShowTimerOptions] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [showChefSheet, setShowChefSheet] = useState(false);
  const chefSheetAnim = useRef(new Animated.Value(0)).current;
  const screenHeight = Dimensions.get('window').height;
  const chefSheetPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 10,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          chefSheetAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120) {
          setShowChefSheet(false);
        } else {
          Animated.spring(chefSheetAnim, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;
  const [chefInput, setChefInput] = useState('Make this dairy free...');
  const chefFilters = ['Vegan', 'Kid-friendly', 'Simplify', 'More protein'];
  const chefSwaps = [
    { swap: 'Almond Milk', for: 'Whole Milk' },
    { swap: 'Ground Chicken', for: 'Ground Beef' },
  ];
  const [stepButtonAnim, setStepButtonAnim] = useState<Animated.Value[]>([]);

  useEffect(() => {
    console.log('params', params);
    if (!isAIRecipe && params.id) {
      setLoading(true);
      fetch(`https://familycooksclean.onrender.com/recipes/${params.id}`)
        .then(res => res.json())
        .then(data => {
          setRecipe(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else if (isAIRecipe) {
      // For AI recipes, use params directly, but ensure arrays
      console.log('AI params', {
        tags: params.tags,
        ingredients: params.ingredients,
        steps: params.steps,
      });
      console.log('AI params.steps', params.steps, Array.isArray(params.steps), typeof params.steps);
      function toArray(val: any): string[] {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          // Try to parse as JSON array first (for AI recipes passed from chat)
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch { }
          // Try to split on period+comma or period+space+capital letter
          if (val.match(/\\.,|\\. (?=[A-Z])/)) {
            return val.split(/\\.,|\\. (?=[A-Z])/).map(s => s.trim()).filter(Boolean);
          }
          if (val.includes('||')) return val.split('||').map(s => s.trim());
          if (val.includes('\\n')) return val.split('\\n').map(s => s.trim());
          if (val.includes('\n')) return val.split('\n').map(s => s.trim());
          if (!val.includes('.') && val.split(',').length > 1) return val.split(',').map(s => s.trim());
          return [val];
        }
        return [];
      }
      setRecipe({
        title: params.title || 'AI Recipe',
        time: params.time || '',
        tags: toArray(params.tags),
        ingredients: toArray(params.ingredients),
        steps: toArray(params.steps),
      });
      setLoading(false);
    }
  }, [params.id, isAIRecipe]);

  function ensureArray(val: any, fallback: string[]): string[] {
    if (Array.isArray(val)) {
      return val;
    }
    if (typeof val === 'string') {
      try {
        const parsed = JSON.parse(val);
        if (Array.isArray(parsed)) return ensureArray(parsed, fallback);
      } catch { }
      if (val.includes('||')) return val.split('||').map(s => s.trim());
      if (val.includes('\\n')) return val.split('\\n').map(s => s.trim());
      if (val.includes('\n')) return val.split('\n').map(s => s.trim());
      // Only split on commas if there are NO periods (so it's not full sentences)
      if (!val.includes('.') && val.split(',').length > 1) return val.split(',').map(s => s.trim());
      return [val];
    }
    return fallback;
  }

  // Use ensureArray for tags, ingredients, steps
  const tags = ensureArray(recipe?.tags, []);
  const ingredients = ensureArray(recipe?.ingredients, []);
  const steps = ensureArray(recipe?.steps, []);

  // Keep checked/completed state in sync with ingredients/steps length
  useEffect(() => {
    setCheckedIngredients(Array(ingredients.length).fill(false));
  }, [ingredients.length]);
  useEffect(() => {
    setCompletedSteps(Array(steps.length).fill(false));
  }, [steps.length]);

  // Add animation for step button color
  useEffect(() => {
    setStepButtonAnim(steps.map(() => new Animated.Value(0)));
  }, [steps.length]);

  useEffect(() => {
    completedSteps.forEach((isComplete, idx) => {
      if (stepButtonAnim[idx]) {
        Animated.timing(stepButtonAnim[idx], {
          toValue: isComplete ? 1 : 0,
          duration: 350,
          useNativeDriver: false,
          easing: Easing.inOut(Easing.ease),
        }).start();
      }
    });
  }, [completedSteps, stepButtonAnim]);

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

  // Show loading spinner while fetching
  if (loading || !recipe) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#F1F6F9', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#8CBEC7" />
      </SafeAreaView>
    );
  }

  async function handleSaveAIRecipe() {
    setSaveStatus('saving');
    try {
      const { data } = await supabase.auth.getUser();
      const user_id = data?.user?.id;
      if (!user_id) throw new Error('You must be logged in to save recipes.');
      const payload = {
        user_id,
        title: recipe.title,
        time: recipe.time,
        tags: recipe.tags,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
      };
      const response = await fetch('https://familycooksclean.onrender.com/recipes/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to save recipe');
      setSaveStatus('success');
    } catch (err: any) {
      setSaveStatus('error');
      alert(err.message || 'Failed to save recipe');
    }
  }

  console.log('Final steps for rendering:', steps);

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
            {tags.map((tag: string, idx: number) => (
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
          {isAIRecipe && saveStatus !== 'success' && (
            <TouchableOpacity style={styles.saveAIButton} onPress={handleSaveAIRecipe} disabled={saveStatus === 'saving'}>
              <CustomText style={styles.saveAIButtonText}>
                {saveStatus === 'saving' ? 'Saving...' : 'Save AI Recipe'}
              </CustomText>
            </TouchableOpacity>
          )}
          {saveStatus === 'success' && (
            <CustomText style={[styles.saveAIButtonText, { color: '#7BA892', textAlign: 'center', marginTop: 8 }]}>Recipe saved!</CustomText>
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
          {ingredients.map((ing: string, idx: number) => (
            <TouchableOpacity
              key={idx}
              style={[styles.ingredientRow, !cooking && { opacity: 0.5 }]}
              onPress={() => cooking && toggleIngredient(idx)}
              activeOpacity={cooking ? 0.7 : 1}
              disabled={!cooking}
            >
              <CustomText style={[styles.ingredientText, checkedIngredients[idx] && { textDecorationLine: 'line-through', color: '#A0A0A0' }]}>{ing}</CustomText>
              <View style={[styles.checkbox, checkedIngredients[idx] && styles.checkboxChecked]}>
                {checkedIngredients[idx] && (
                  <Ionicons name="checkmark" size={18} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
          ))}
          <CustomText style={styles.sectionTitle}>Steps</CustomText>
          {steps.map((step: string, idx: number) => {
            // Interpolate button color
            const bgColor = stepButtonAnim[idx]
              ? stepButtonAnim[idx].interpolate({
                inputRange: [0, 1],
                outputRange: ['#E2B36A', '#7BA892'],
              })
              : '#E2B36A'; // fallback color if anim not ready
            return (
              <View key={idx} style={styles.stepRow}>
                <CustomText style={[styles.stepText, completedSteps[idx] && { textDecorationLine: 'line-through', color: '#A0A0A0' }]}>{idx + 1}. {step}</CustomText>
                <Animated.View style={[styles.animatedStepButton, { backgroundColor: bgColor, opacity: cooking ? 1 : 0.5 }]}>
                  <TouchableOpacity
                    style={styles.stepButtonTouchable}
                    onPress={() => cooking && toggleStep(idx)}
                    activeOpacity={cooking ? 0.85 : 1}
                    disabled={!cooking}
                  >
                    {completedSteps[idx] ? (
                      <>
                        <Ionicons name="checkmark" size={20} color="#fff" style={{ marginRight: 6 }} />
                        <CustomText style={styles.stepButtonTextComplete}>Complete</CustomText>
                      </>
                    ) : (
                      <CustomText style={styles.stepButtonTextStart}>Start</CustomText>
                    )}
                  </TouchableOpacity>
                </Animated.View>
              </View>
            );
          })}
          <CustomText style={styles.sectionTitle}>AI Chef</CustomText>
          <CustomText style={styles.aiChefText}>
            Missing or want to substitute an ingredient? Make it protein-packed or vegan? Ask the AI Chef how!
          </CustomText>
          <TouchableOpacity style={styles.askChefButton} onPress={() => setShowChefSheet(true)}>
            <CustomText style={styles.askChefButtonText}>Ask The AI Chef</CustomText>
          </TouchableOpacity>
        </View>
      </ScrollView>
      {/* AI Chef Bottom Sheet */}
      <Modal
        visible={showChefSheet}
        transparent
        animationType="none"
        onRequestClose={() => setShowChefSheet(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.chefSheetOverlay}
        >
          <TouchableOpacity
            style={styles.chefSheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowChefSheet(false)}
          />
          <Animated.View
            style={[styles.chefSheetContainer, { transform: [{ translateY: chefSheetAnim }] }]}
            {...chefSheetPan.panHandlers}
          >
            <View style={styles.chefSheetHandle} />
            <TouchableOpacity style={styles.chefSheetCloseButton} onPress={() => setShowChefSheet(false)}>
              <Ionicons name="close" size={24} color="#6C757D" />
            </TouchableOpacity>
            <CustomText style={styles.chefSheetTitle}>How do you want to change the recipe?</CustomText>
            <View style={styles.chefSheetFiltersRow}>
              {chefFilters.map((filter, idx) => (
                <View key={filter} style={styles.chefSheetFilterChip}><CustomText style={styles.chefSheetFilterText}>{filter}</CustomText></View>
              ))}
            </View>
            <View style={styles.chefSheetInputBox}>
              <TextInput
                style={styles.chefSheetInput}
                value={chefInput}
                onChangeText={setChefInput}
                placeholder="Type your request..."
                placeholderTextColor="#A0A0A0"
                multiline
              />
            </View>
            <CustomText style={styles.chefSheetProposedTitle}>Proposed Changes</CustomText>
            <View style={styles.chefSheetProposedRow}>
              <CustomText style={styles.chefSheetProposedColTitle}>Swap</CustomText>
              <CustomText style={styles.chefSheetProposedColTitle}>For</CustomText>
            </View>
            {chefSwaps.map((swap, idx) => (
              <View key={idx} style={styles.chefSheetProposedRow}>
                <View style={styles.chefSheetSwapChip}><CustomText style={styles.chefSheetSwapText}>{swap.swap}</CustomText></View>
                <View style={styles.chefSheetForChip}><CustomText style={styles.chefSheetForText}>{swap.for}</CustomText></View>
              </View>
            ))}
            <TouchableOpacity style={styles.chefSheetAcceptButton} onPress={() => setShowChefSheet(false)}>
              <CustomText style={styles.chefSheetAcceptButtonText}>Accept Changes</CustomText>
            </TouchableOpacity>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
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
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  animatedStepButton: {
    borderRadius: 22,
    minWidth: 110,
    minHeight: 44,
    marginLeft: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    justifyContent: 'center',
  },
  stepButtonTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 22,
    minHeight: 44,
  },
  stepButtonTextStart: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  stepButtonTextComplete: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  chefSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  chefSheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  chefSheetContainer: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 16,
    paddingBottom: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 16,
  },
  chefSheetHandle: {
    width: 48,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E5E5',
    alignSelf: 'center',
    marginBottom: 16,
  },
  chefSheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#222',
    textAlign: 'center',
    marginBottom: 18,
  },
  chefSheetFiltersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 18,
    flexWrap: 'wrap',
  },
  chefSheetFilterChip: {
    backgroundColor: '#7BA892',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginHorizontal: 4,
    marginBottom: 4,
  },
  chefSheetFilterText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  chefSheetInputBox: {
    backgroundColor: '#F1F6F9',
    borderRadius: 18,
    padding: 16,
    marginBottom: 18,
  },
  chefSheetInput: {
    fontSize: 16,
    color: '#222',
    minHeight: 40,
  },
  chefSheetProposedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
    marginTop: 8,
  },
  chefSheetProposedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  chefSheetProposedColTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6C757D',
    flex: 1,
    textAlign: 'center',
  },
  chefSheetSwapChip: {
    backgroundColor: '#7BA892',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  chefSheetSwapText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  chefSheetForChip: {
    backgroundColor: '#FFB6B6',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  chefSheetForText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  chefSheetAcceptButton: {
    backgroundColor: '#E2B36A',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    marginTop: 18,
    marginBottom: 4,
  },
  chefSheetAcceptButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  chefSheetCloseButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 10,
    padding: 4,
  },
  saveAIButton: {
    backgroundColor: '#8CBEC7',
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    marginVertical: 8,
  },
  saveAIButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
}); 