import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Home from "../src/pages/MainTabs/Home";
import Recipe from "../src/pages/MainTabs/Recipe";
import CalTracker from "../src/pages/MainTabs/CalTracker";
import Profile from "../src/pages/MainTabs/Profile";
import { useTheme } from '@react-navigation/native';


const Tab = createBottomTabNavigator();
const MainTab = () => {
     const { colors } = useTheme();

    return(
        <>
        <Tab.Navigator
            screenOptions = {({route}) => {
                let iconName;
                if (route.name === "Home") iconName = "home-outline";
                else if (route.name === "Recipe") iconName ="account-outline";
                else if (route.name === "CalTracker") ;//iconName = "heart-plus-outline";
                else if (route.name === "Profile") iconName = "cog-outline";

                return {
                    tabBarIcon: ({ color, size }) => (
                    <Icon name={iconName} size={size} color={color} />
                    ),
                   headerShown: false,
                    tabBarStyle: {
                        height: "6%",              
                        backgroundColor: colors.background,
                        position: 'absolute',      
                        bottom: 0,
                        left: 0,
                        right: 0,
                        elevation: 10,             
                        shadowColor: colors.background,      
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        zIndex: 10,          
                    },
                        tabBarSafeAreaInsets: { bottom: 8 },
                        };
                    }}
                    initialRouteName = "Home"
                >
            <Tab.Screen name = "Home" component={Home} />
            <Tab.Screen name = "Recipe" component ={Recipe} />
            <Tab.Screen name = "CalTracker" component={CalTracker} />
            <Tab.Screen name = "Profile" component ={Profile} />
        </Tab.Navigator>
        </>
    );
};
export default MainTab;