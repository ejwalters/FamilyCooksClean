import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, Stack } from 'expo-router';
import CustomText from '../components/CustomText';

export default function AddRecipeManualScreen() {
    const router = useRouter();
    const [ingredients, setIngredients] = useState(['']);
    const [steps, setSteps] = useState(['']);

    function addIngredient() {
        setIngredients([...ingredients, '']);
    }
    function updateIngredient(idx: number, value: string) {
        setIngredients(ingredients.map((ing, i) => (i === idx ? value : ing)));
    }
    function addStep() {
        setSteps([...steps, '']);
    }
    function updateStep(idx: number, value: string) {
        setSteps(steps.map((step, i) => (i === idx ? value : step)));
    }

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
                {/* Header */}
                <View style={styles.headerRow}>
                    <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={26} color="#444" />
                    </TouchableOpacity>
                    <CustomText style={styles.headerText}>Add a Recipe</CustomText>
                </View>
                {/* Form */}
                <CustomText style={styles.sectionLabel}>Recipe Name</CustomText>
                <TextInput style={styles.input} placeholder="Enter Recipe Name" placeholderTextColor="#A0A0A0" />
                <CustomText style={styles.sectionLabel}>Tags & Categories</CustomText>
                <TextInput style={styles.input} placeholder="Select Tags" placeholderTextColor="#A0A0A0" />
                <TextInput style={styles.input} placeholder="Select Categories" placeholderTextColor="#A0A0A0" />
                <CustomText style={styles.sectionLabel}>Cook Time & Servings</CustomText>
                <TextInput style={styles.input} placeholder="Cook time (minutes)" placeholderTextColor="#A0A0A0" keyboardType="numeric" />
                <TextInput style={styles.input} placeholder="Servings" placeholderTextColor="#A0A0A0" keyboardType="numeric" />
                <CustomText style={styles.sectionLabel}>Ingredients</CustomText>
                {ingredients.map((ing, idx) => (
                    <TextInput
                        key={idx}
                        style={styles.input}
                        placeholder="Select Ingredient"
                        placeholderTextColor="#A0A0A0"
                        value={ing}
                        onChangeText={val => updateIngredient(idx, val)}
                    />
                ))}
                <TouchableOpacity style={styles.addButton} onPress={addIngredient}>
                    <CustomText style={styles.addButtonText}>Add Ingredient</CustomText>
                </TouchableOpacity>
                <CustomText style={styles.sectionLabel}>Steps</CustomText>
                {steps.map((step, idx) => (
                    <TextInput
                        key={idx}
                        style={styles.input}
                        placeholder={`Step ${idx + 1}`}
                        placeholderTextColor="#A0A0A0"
                        value={step}
                        onChangeText={val => updateStep(idx, val)}
                    />
                ))}
                <TouchableOpacity style={styles.addButton} onPress={addStep}>
                    <CustomText style={styles.addButtonText}>Add Step</CustomText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveButton}>
                    <CustomText style={styles.saveButtonText}>Save Recipe</CustomText>
                </TouchableOpacity>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F1F6F9',
        paddingTop: 80,
        paddingHorizontal: 0,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 20,
        marginBottom: 18,
    },
    backButton: {
        marginRight: 8,
        padding: 4,
    },
    headerText: {
        fontSize: 20,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
        marginRight: 32,
        color: '#444',
    },
    sectionLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: '#222',
        marginLeft: 24,
        marginTop: 18,
        marginBottom: 6,
    },
    input: {
        backgroundColor: '#fff',
        borderRadius: 20,
        paddingHorizontal: 18,
        paddingVertical: 14,
        fontSize: 16,
        color: '#222',
        marginHorizontal: 20,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
    },
    addButton: {
        backgroundColor: '#7BA892',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        height: 40,
        marginHorizontal: 20,
        marginBottom: 8,
        marginTop: 0,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    saveButton: {
        backgroundColor: '#E2B36A',
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        height: 48,
        marginHorizontal: 20,
        marginTop: 18,
        marginBottom: 24,
        shadowColor: '#E2B36A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.10,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
}); 