import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import SignIn from '../src/pages/Auth/SignIn';
import SignUp from '../src/pages/Auth/SignUp';

const Stack = createStackNavigator();
const AuthStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="SignIn"
        component={SignIn}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SignUp"
        component={SignUp}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};
export default AuthStack;
