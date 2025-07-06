import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, ScrollView, Image, SafeAreaView, Modal, Animated, Easing, KeyboardAvoidingView, Platform, TextInput, PanResponder, Dimensions, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import CustomText from '../components/CustomText';
import { supabase } from '../lib/supabase';
import { Heart, HeartIcon } from 'lucide-react-native';

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
  const [favorited, setFavorited] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const editTags = [
    'Vegan',
    'Vegetarian',
    'Gluten-free',
    'Dairy-free',
    'High Protein',
    'Lower Calories',
    'Kid-friendly',
    'Simplify',
  ];
  const [selectedEditTags, setSelectedEditTags] = useState<string[]>([]);
  const [editPrompt, setEditPrompt] = useState('');

  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    console.log('params', params);
    if (params.id) {
      setLoading(true);
      const url = userId 
        ? `https://familycooksclean.onrender.com/recipes/${params.id}?user_id=${userId}`
        : `https://familycooksclean.onrender.com/recipes/${params.id}`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          console.log('Recipe loaded from database:', data);
          console.log('Recipe ID:', data.id);
          setRecipe(data);
          setFavorited(data.is_favorited || false);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      // For AI recipes passed directly in params (e.g. from chat), use params
      function toArray(val: any): string[] {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') {
          try {
            const parsed = JSON.parse(val);
            if (Array.isArray(parsed)) return parsed;
          } catch { }
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
  }, [params.id, isAIRecipe, userId]);

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

  // Fetch user ID on mount
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) setUserId(data.user.id);
    });
  }, []);

  // Handler for heart icon
  const handleToggleFavorite = async () => {
    if (!userId || !recipe?.id) return;
    const currentlyFav = favorited;
    setFavorited(f => !f);
    try {
      if (!currentlyFav) {
        // Add favorite
        const res = await fetch('https://familycooksclean.onrender.com/recipes/favorite', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, recipe_id: recipe.id }),
        });
        if (!res.ok) throw new Error('Failed to favorite');
      } else {
        // Remove favorite
        const res = await fetch('https://familycooksclean.onrender.com/recipes/favorite', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id: userId, recipe_id: recipe.id }),
        });
        if (!res.ok) throw new Error('Failed to unfavorite');
      }
    } catch (err) {
      setFavorited(currentlyFav);
      alert('Failed to update favorite. Please try again.');
    }
  };

  // Handler for start cooking
  const handleStartCooking = async () => {
    if (!userId || !recipe?.id) return;
    
    try {
      // Call the server to record the cooking start
      const res = await fetch('https://familycooksclean.onrender.com/recipes/start-cooking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, recipe_id: recipe.id }),
      });
      
      if (!res.ok) {
        console.error('Failed to record cooking start');
        // Continue with cooking even if server call fails
      }
    } catch (err) {
      console.error('Error recording cooking start:', err);
      // Continue with cooking even if server call fails
    }
    
    // Start the cooking timer regardless of server response
    setCooking(true);
    setTimerRunning(true);
    setTimer(0);
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
      const savedRecipe = await response.json();
                        if (params.message_id) {
                    console.log('About to call save-message-recipe with:', {
                      message_id: params.message_id,
                      saved_recipe_id: savedRecipe.id,
                    });
                    try {
                      const response = await fetch('https://familycooksclean.onrender.com/recipes/save-message-recipe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          message_id: params.message_id,
                          saved_recipe_id: savedRecipe.id,
                        }),
                      });
                      console.log('save-message-recipe response status:', response.status);
                      if (!response.ok) {
                        const errorText = await response.text();
                        console.error('save-message-recipe error:', errorText);
                      } else {
                        console.log('save-message-recipe success');
                      }
                    } catch (e) {
                      console.error('Failed to update message with saved_recipe_id', e);
                    }
                  }
      router.replace({ pathname: '/recipe-detail', params: { id: savedRecipe.id, isAI: '1' } });
    } catch (err: any) {
      setSaveStatus('error');
      alert(err.message || 'Failed to save recipe');
    }
  }

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
            <TouchableOpacity onPress={handleToggleFavorite} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              {favorited ? (
                <HeartIcon color="#E4576A" size={28} />
              ) : (
                <Heart color="#B0B0B0" size={28} />
              )}
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
          {(() => {
            console.log('Save button condition check:', {
              hasRecipe: !!recipe,
              recipeId: recipe?.id,
              hasUserId: !!userId,
              shouldShow: !recipe?.id && !!userId
            });
            return !recipe?.id && userId;
          })() && (
            <TouchableOpacity
              style={{ backgroundColor: saveStatus === 'saving' ? '#B0B0B0' : '#E2B36A', borderRadius: 16, paddingVertical: 12, alignItems: 'center', marginTop: 16, marginBottom: 8 }}
              disabled={saveStatus === 'saving'}
              onPress={async () => {
                setSaveStatus('saving');
                setSaveError(null);
                try {
                  // Validation: check required fields
                  if (!recipe.title || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0 || !Array.isArray(recipe.steps) || recipe.steps.length === 0) {
                    setSaveStatus('idle');
                    setSaveError('Recipe is missing required fields.');
                    return;
                  }
                  const payload = {
                    user_id: userId,
                    title: recipe.title,
                    time: recipe.time || '',
                    tags: recipe.tags || [],
                    ingredients: recipe.ingredients,
                    steps: recipe.steps,
                  };
                  console.log('Saving AI recipe from chat payload:', payload);
                  const response = await fetch('https://familycooksclean.onrender.com/recipes/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });
                  if (!response.ok) {
                    const errText = await response.text();
                    setSaveStatus('error');
                    setSaveError('Failed to save recipe: ' + errText);
                    return;
                  }
                  const savedRecipe = await response.json();
                  setSaveStatus('success');
                  console.log('PARAMS', params.message_id);
                  // Update message with saved recipe ID if coming from chat
                  if (params.message_id) {
                    console.log('About to call save-message-recipe with:', {
                      message_id: params.message_id,
                      saved_recipe_id: savedRecipe.id,
                    });
                    try {
                      const updateResponse = await fetch('https://familycooksclean.onrender.com/recipes/save-message-recipe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          message_id: params.message_id,
                          saved_recipe_id: savedRecipe.id,
                        }),
                      });
                      console.log('save-message-recipe response status:', updateResponse.status);
                      if (!updateResponse.ok) {
                        const errorText = await updateResponse.text();
                        console.error('save-message-recipe error:', errorText);
                      } else {
                        console.log('save-message-recipe success');
                      }
                    } catch (e) {
                      console.error('Failed to update message with saved_recipe_id', e);
                    }
                  }
                  
                  router.replace({ pathname: '/recipe-detail', params: { id: savedRecipe.id, isAI: '1', message_id: params.message_id } });
                } catch (err: any) {
                  setSaveStatus('error');
                  setSaveError(err.message || 'Failed to save recipe');
                }
              }}
            >
              <CustomText style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                {saveStatus === 'saving' ? 'Saving...' : 'Save AI Recipe'}
              </CustomText>
            </TouchableOpacity>
          )}
          {!recipe?.id && saveError && (
            <CustomText style={{ color: '#E4576A', marginBottom: 8, textAlign: 'center' }}>{saveError}</CustomText>
          )}
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
            <View style={{ marginBottom: 8 }}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ alignItems: 'center', height: 43 }}
              >
                {editTags.map((tag, idx) => (
                  <TouchableOpacity
                    key={tag}
                    style={[
                      styles.filterChip,
                      idx === 0 && { marginLeft: 0 },
                      idx === editTags.length - 1 && { marginRight: 0 },
                      selectedEditTags.includes(tag) && { backgroundColor: '#E2B36A' }
                    ]}
                    onPress={() => {
                      setSelectedEditTags(selected =>
                        selected.includes(tag)
                          ? selected.filter(t => t !== tag)
                          : [...selected, tag]
                      );
                    }}
                  >
                    <CustomText style={styles.filterText}>{tag}</CustomText>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <TextInput
              style={{
                backgroundColor: '#fff',
                borderRadius: 16,
                paddingHorizontal: 16,
                paddingVertical: 10,
                fontSize: 15,
                marginBottom: 8,
                borderWidth: 1,
                borderColor: '#E2E2E2',
              }}
              placeholder="E.g. Make this gluten-free and add more veggies"
              value={editPrompt}
              onChangeText={setEditPrompt}
            />
            <TouchableOpacity
              style={{
                backgroundColor: (selectedEditTags.length > 0 || editPrompt.trim()) ? '#7BA892' : '#B0B0B0',
                borderRadius: 16,
                paddingVertical: 12,
                alignItems: 'center',
                marginBottom: 16,
              }}
              disabled={!(selectedEditTags.length > 0 || editPrompt.trim())}
              onPress={async () => {
                setAiLoading(true);
                setAiError(null);
                setAiResult(null);
                try {
                  const res = await fetch('https://familycooksclean.onrender.com/ai/transform-recipe', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      recipe: {
                        title: recipe.title,
                        time: recipe.time,
                        tags: tags,
                        ingredients: ingredients,
                        steps: steps,
                      },
                      tags: selectedEditTags,
                      prompt: editPrompt,
                    }),
                  });
                  if (!res.ok) throw new Error('AI request failed');
                  const data = await res.json();
                  setAiResult(data);
                } catch (err: any) {
                  setAiError(err.message || 'Failed to get AI response');
                } finally {
                  setAiLoading(false);
                }
              }}
            >
              <CustomText style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
                Suggest Changes
              </CustomText>
            </TouchableOpacity>
            {aiLoading && (
              <View style={{ alignItems: 'center', marginVertical: 16 }}>
                <ActivityIndicator size="large" color="#7BA892" />
                <CustomText style={{ marginTop: 8 }}>Thinking...</CustomText>
              </View>
            )}
            {aiError && (
              <CustomText style={{ color: '#E4576A', marginVertical: 8 }}>{aiError}</CustomText>
            )}
            {aiResult && (
              <View style={{ marginTop: 12, marginBottom: 16 }}>
                <CustomText style={{ fontWeight: '700', fontSize: 16, marginBottom: 4 }}>AI Suggestions</CustomText>
                <CustomText style={{ color: '#6C757D', marginBottom: 12 }}>{aiResult.summary}</CustomText>
                {aiResult.swaps && aiResult.swaps.length > 0 ? (
                  <View style={{ marginBottom: 8 }}>
                    <CustomText style={{ fontWeight: '600', marginBottom: 4 }}>Ingredient Swaps:</CustomText>
                    {aiResult.swaps.map((swap: any, idx: number) => (
                      <View key={idx} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                        <CustomText style={{ flex: 1, color: '#888', textDecorationLine: 'line-through' }}>{swap.original}</CustomText>
                        <Ionicons name="arrow-forward" size={18} color="#E2B36A" style={{ marginHorizontal: 8 }} />
                        <CustomText style={{ flex: 1, color: '#7BA892', fontWeight: '700' }}>{swap.new}</CustomText>
                        {swap.amount_change && <CustomText style={{ marginLeft: 6, color: '#E2B36A' }}>{swap.amount_change}</CustomText>}
                      </View>
                    ))}
                  </View>
                ) : (
                  <CustomText style={{ color: '#6C757D', marginBottom: 8 }}>No ingredient swaps were needed.</CustomText>
                )}
                <TouchableOpacity
                  style={{ backgroundColor: '#E2B36A', borderRadius: 16, paddingVertical: 12, alignItems: 'center', marginTop: 8 }}
                  onPress={async () => {
                    setSaveStatus('saving');
                    setSaveError(null);
                    try {
                      const { data } = await supabase.auth.getUser();
                      const user_id = data?.user?.id;
                      if (!user_id) throw new Error('You must be logged in to save recipes.');
                      const newRecipe = aiResult.newRecipe || {};
                      // Validation: check required fields
                      if (!newRecipe.title || !Array.isArray(newRecipe.ingredients) || newRecipe.ingredients.length === 0 || !Array.isArray(newRecipe.steps) || newRecipe.steps.length === 0) {
                        setSaveStatus('idle');
                        setSaveError('AI did not return a complete recipe. Please try again or edit your prompt.');
                        console.error('Invalid AI recipe:', newRecipe);
                        return;
                      }
                      const payload = {
                        user_id,
                        title: newRecipe.title,
                        time: newRecipe.time || recipe.time || '',
                        tags: newRecipe.tags || recipe.tags || [],
                        ingredients: newRecipe.ingredients,
                        steps: newRecipe.steps,
                        parent_recipe_id: recipe.id || null,
                      };
                      console.log('Saving AI recipe payload:', payload);
                      const response = await fetch('https://familycooksclean.onrender.com/recipes/add', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      });
                      if (!response.ok) {
                        const errText = await response.text();
                        setSaveStatus('error');
                        setSaveError('Failed to save recipe: ' + errText);
                        console.error('Save error:', errText);
                        return;
                      }
                      const savedRecipe = await response.json();
                      setSaveStatus('success');
                      setShowChefSheet(false);
                      router.replace({ pathname: '/recipe-detail', params: { id: savedRecipe.id, isAI: '1', message_id: params.message_id } });
                    } catch (err: any) {
                      setSaveStatus('error');
                      setSaveError(err.message || 'Failed to save recipe');
                      console.error('Save error:', err);
                    }
                  }}
                >
                  <CustomText style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Accept Changes & Save as New Recipe</CustomText>
                </TouchableOpacity>
              </View>
            )}
            {saveError && (
              <CustomText style={{ color: '#E4576A', marginTop: 8, textAlign: 'center' }}>{saveError}</CustomText>
            )}
            {/* Cooking Timer or Button */}
            {!cooking ? (
              <TouchableOpacity style={styles.cookButton} onPress={handleStartCooking}>
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
  filterChip: {
    backgroundColor: '#7BA892',
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    height: 35,
    minHeight: 35,
    maxHeight: 35,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  filterText: { color: '#fff', fontSize: 15, fontWeight: '600' },
}); 