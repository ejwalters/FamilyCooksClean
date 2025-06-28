import { Tabs } from 'expo-router';
import { Image } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 70,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/home.png')}
              style={{
                width: 28,
                height: 28,
                tintColor: focused ? '#6DA98C' : '#B0B0B0',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/recipes.png')}
              style={{
                width: 28,
                height: 28,
                tintColor: focused ? '#6DA98C' : '#B0B0B0',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chef"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/chef-hat.png')}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                borderWidth: focused ? 3 : 0,
                borderColor: focused ? '#6DA98C' : 'transparent',
                backgroundColor: '#F1F6F9',
                marginTop: -20,
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/heart.png')}
              style={{
                width: 28,
                height: 28,
                tintColor: focused ? '#6DA98C' : '#B0B0B0',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <Image
              source={require('../../assets/images/profile.png')}
              style={{
                width: 28,
                height: 28,
                tintColor: focused ? '#6DA98C' : '#B0B0B0',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
