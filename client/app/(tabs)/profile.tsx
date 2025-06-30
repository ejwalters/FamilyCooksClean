import React from 'react';
import { View, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CustomText from '../../components/CustomText';
import { useRouter } from 'expo-router';

export default function ProfileScreen() {
    const router = useRouter();
    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <CustomText style={styles.headerText}>Profile</CustomText>
            </View>

            {/* Profile Info */}
            <View style={styles.profileInfo}>
                <Image
                    source={require('../../assets/images/avatar.png')}
                    style={styles.avatar}
                />
                <View>
                    <CustomText style={styles.name}>Eric Walters</CustomText>
                    <CustomText style={styles.email}>ejwalters24@gmail.com</CustomText>
                </View>
            </View>

            {/* Info Rows */}
            <TouchableOpacity style={styles.infoRow} onPress={() => router.push('/edit-profile')}>
                <View style={styles.infoIconBox}>
                    <Image source={require('../../assets/images/profile.png')} style={styles.infoIcon} />
                </View>
                <CustomText style={styles.infoText}>Personal Information</CustomText>
                <Ionicons name="chevron-forward" size={24} color="#6C757D" style={styles.chevron} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoRow} onPress={() => router.push('/dietary-preferences')}>
                <View style={styles.infoIconBox}>
                    <Image source={require('../../assets/images/fork-knife.png')} style={styles.infoIcon} />
                </View>
                <CustomText style={styles.infoText}>Dietary Information</CustomText>
                <Ionicons name="chevron-forward" size={24} color="#6C757D" style={styles.chevron} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.infoRow} onPress={() => router.push('/subscription')}>
                <View style={styles.infoIconBox}>
                    <Image source={require('../../assets/images/splash-icon.png')} style={styles.infoIcon} />
                </View>
                <CustomText style={styles.infoText}>Plan Information</CustomText>
                <Ionicons name="chevron-forward" size={24} color="#6C757D" style={styles.chevron} />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F1F6F9', paddingHorizontal: 16, paddingTop: 80 },
    header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
    backIcon: { marginRight: 12 },
    headerText: { fontSize: 24, fontWeight: '700', flex: 1, textAlign: 'center' },
    profileInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: 32 },
    avatar: { width: 60, height: 60, borderRadius: 32, marginRight: 16 },
    name: { fontSize: 18, fontWeight: '700', color: '#222' },
    email: { fontSize: 14, color: '#6C757D' },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'transparent',
        marginBottom: 20,
    },
    infoIconBox: {
        width: 64,
        height: 64,
        borderRadius: 16,
        backgroundColor: '#7BA892',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    infoIcon: {
        width: 32,
        height: 32,
        tintColor: '#fff',
    },
    infoText: { fontSize: 16, fontWeight: '600', color: '#444', flex: 1 },
    chevron: { marginLeft: 8 },
}); 