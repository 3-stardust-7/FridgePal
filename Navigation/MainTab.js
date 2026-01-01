import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Home from '../src/pages/MainTabs/Home';
import Recipe from '../src/pages/MainTabs/Recipe';
import CalTracker from '../src/pages/MainTabs/CalTracker';
import Profile from '../src/pages/MainTabs/Profile';
import { COLORS } from '../src/utils/constants';

const Tab = createBottomTabNavigator();
const MainTab = () => {
  return (
    <>
      <Tab.Navigator
        screenOptions={({ route }) => {
          let iconName;
          let iconNameFocused;

          if (route.name === 'Fridge') {
            iconName = 'fridge-outline';
            iconNameFocused = 'fridge';
          } else if (route.name === 'Recipes') {
            iconName = 'chef-hat';
            iconNameFocused = 'chef-hat';
          } else if (route.name === 'Nutrition') {
            iconName = 'chart-donut';
            iconNameFocused = 'chart-donut';
          } else if (route.name === 'Profile') {
            iconName = 'account-outline';
            iconNameFocused = 'account';
          }

          return {
            tabBarIcon: ({ color, size, focused }) => (
              <Icon
                name={focused ? iconNameFocused : iconName}
                size={24}
                color={color}
              />
            ),
            headerShown: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textLight,
            tabBarStyle: {
              height: 70,
              backgroundColor: COLORS.surface,
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              elevation: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.1,
              shadowRadius: 12,
              borderTopWidth: 0,
              paddingTop: 8,
              paddingBottom: 12,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '600',
              marginTop: 2,
            },
          };
        }}
        initialRouteName="Fridge"
      >
        <Tab.Screen name="Fridge" component={Home} />
        <Tab.Screen name="Recipes" component={Recipe} />
        <Tab.Screen name="Nutrition" component={CalTracker} />
        <Tab.Screen name="Profile" component={Profile} />
      </Tab.Navigator>
    </>
  );
};
export default MainTab;
