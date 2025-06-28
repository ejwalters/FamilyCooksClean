import { Tabs } from 'expo-router';
import { Image, View } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 100,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          position: 'absolute',
          backgroundColor: '#fff',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarIconStyle: {
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          marginTop: 0,
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
                alignSelf: 'center',
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
                alignSelf: 'center',
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
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 50,
                borderWidth: focused ? 3 : 0,
                borderColor: focused ? '#6DA98C' : 'transparent',
                backgroundColor: '#6DA98C',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 4,
                elevation: 4,
                alignSelf: 'center',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Image
                source={require('../../assets/images/chef-hat.png')}
                style={{
                  width: 32,
                  height: 32,
                  tintColor: '#fff',
                  alignSelf: 'center',
                }}
                resizeMode="contain"
              />
            </View>
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
                alignSelf: 'center',
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
                alignSelf: 'center',
              }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
