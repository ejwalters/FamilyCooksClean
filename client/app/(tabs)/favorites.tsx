import CustomText from '../../components/CustomText';
import { View, StyleSheet } from 'react-native';
export default function FavoritesScreen() {
    return (
        <View style={styles.container}>
            <CustomText style={styles.text}>Favorites Screen</CustomText>
        </View>
    );
}
const styles = StyleSheet.create({
    container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F6F9' },
    text: { fontSize: 24, fontWeight: '700' },
}); 