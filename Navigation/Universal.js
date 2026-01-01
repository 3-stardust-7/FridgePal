import { React, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import RootNavigator from './RootNavigator.js';
import AuthStack from './AuthStack.js';
//import { useDispatch, useSelector } from "react-redux";
//import { loadUser } from "../Store/AuthThunk.js";

const Stack = createStackNavigator();

const Universal = () => {
  //   const dispatch = useDispatch();
  //   const {user} = useSelector((state) => state.user || {})
  //    useEffect(() => {
  //       dispatch(loadUser());
  //     }, [dispatch]);

  //   console.warn(user)

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {true ? (
          <Stack.Screen
            name="RootNavigator"
            component={RootNavigator}
            options={{ headerShown: false }}
          />
        ) : (
          <Stack.Screen
            name="AuthStack"
            component={AuthStack}
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default Universal;
