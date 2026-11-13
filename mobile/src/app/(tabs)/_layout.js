import { Feather } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tap } from '../../components/ui';
import { useAuth } from '../../lib/auth';
import { colors, fonts } from '../../theme';

// Which tabs each role sees. Hidden tabs keep their route but drop out of the bar.
const HIDE = {
  SECURITY: ['requests'],
  TECHNICIAN: ['gate'],
  FACILITY_MANAGER: ['gate'],
};

function TabIcon({ name, color, focused }) {
  return (
    <View style={styles.iconWrap}>
      {focused ? <View style={styles.activeBar} /> : null}
      <Feather name={name} size={21} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  if (!user) return <Redirect href="/login" />;
  const hidden = HIDE[user.role] || [];
  const opts = (name, title, glyph) => ({ title, tabBarIcon: ({ color, focused }) => <TabIcon name={glyph} color={color} focused={focused} />, ...(hidden.includes(name) ? { href: null } : {}) });

  return (
    <Tabs
      screenListeners={{ tabPress: tap }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.brassLight,
        tabBarInactiveTintColor: '#7F8899',
        tabBarLabelStyle: { fontFamily: fonts.bold, fontSize: 10.5, letterSpacing: 0.3, marginTop: 2 },
        tabBarStyle: {
          backgroundColor: colors.ink,
          borderTopWidth: 0,
          height: 70 + (Platform.OS === 'web' ? 0 : insets.bottom),
          paddingTop: 10,
          paddingBottom: Platform.OS === 'web' ? 10 : Math.max(insets.bottom, 10),
        },
        sceneStyle: { backgroundColor: colors.ivory },
      }}>
      <Tabs.Screen name="home" options={opts('home', 'Home', 'home')} />
      <Tabs.Screen name="requests" options={opts('requests', user.role === 'TECHNICIAN' ? 'Jobs' : 'Requests', 'tool')} />
      <Tabs.Screen name="gate" options={opts('gate', 'Gate', 'shield')} />
      <Tabs.Screen name="copilot" options={opts('copilot', 'Copilot', 'message-circle')} />
      <Tabs.Screen name="more" options={opts('more', 'More', 'grid')} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconWrap: { alignItems: 'center', justifyContent: 'center', width: 44, height: 26 },
  activeBar: { position: 'absolute', top: -9, width: 22, height: 2.5, borderRadius: 2, backgroundColor: colors.brassLight },
});
