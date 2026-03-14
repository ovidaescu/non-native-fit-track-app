import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ExercisesProvider } from './contexts/ExerciseContext';
import ListScreen from './screens/ListScreen';
import AddScreen from './screens/AddScreen';
import EditScreen from './screens/EditScreen';
import AuthGate from './components/AuthGate'; // added


const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <ExercisesProvider>
        <AuthGate>
          <NavigationContainer>
            <Stack.Navigator initialRouteName="List" screenOptions={{ headerShown: false }}>
              <Stack.Screen name="List" component={ListScreen} />
              <Stack.Screen name="Add" component={AddScreen} />
              <Stack.Screen name="Edit" component={EditScreen} />
            </Stack.Navigator>
          </NavigationContainer>
        </AuthGate>
      </ExercisesProvider>
    </SafeAreaProvider>
  );
}