import { Fraunces_500Medium, Fraunces_500Medium_Italic, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold } from '@expo-google-fonts/manrope';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from '../lib/auth';
import { colors, fonts } from '../theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

export const unstable_settings = { anchor: '(tabs)' };

function RootStack() {
  const { ready } = useAuth();
  const [loaded, error] = useFonts({
    Fraunces_500Medium, Fraunces_500Medium_Italic, Fraunces_600SemiBold,
    Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold, Manrope_800ExtraBold,
  });
  const show = (loaded || error) && ready;
  useEffect(() => { if (show) SplashScreen.hideAsync().catch(() => {}); }, [show]);
  if (!show) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{
        headerStyle: { backgroundColor: colors.ivory },
        headerShadowVisible: false,
        headerTintColor: colors.ink,
        headerTitleStyle: { fontFamily: fonts.display, fontSize: 18, color: colors.ink },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.ivory },
      }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false, animation: 'fade' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="tickets/new" options={{ title: 'New request', presentation: 'modal' }} />
        <Stack.Screen name="tickets/[id]" options={{ title: 'Request' }} />
        <Stack.Screen name="bills" options={{ title: 'Bills & dues' }} />
        <Stack.Screen name="notices" options={{ title: 'Notices' }} />
        <Stack.Screen name="events" options={{ title: 'Events' }} />
        <Stack.Screen name="polls" options={{ title: 'Polls & voting' }} />
        <Stack.Screen name="parcels" options={{ title: 'Parcels' }} />
        <Stack.Screen name="staff" options={{ title: 'Staff & help' }} />
        <Stack.Screen name="maintenance" options={{ title: 'Maintenance' }} />
        <Stack.Screen name="forum" options={{ title: 'Community' }} />
        <Stack.Screen name="accounts" options={{ title: 'Society accounts' }} />
        <Stack.Screen name="move" options={{ title: 'Move in / out' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="sos" options={{ title: 'Emergency', headerStyle: { backgroundColor: colors.ink }, headerTintColor: colors.onInk, headerTitleStyle: { fontFamily: fonts.display, color: colors.onInk } }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <RootStack />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
