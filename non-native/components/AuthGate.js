import React, { useEffect, useState } from 'react';
import { View, Text, Button, ActivityIndicator, StyleSheet, TextInput } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export default function AuthGate({ children }) {
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [busy, setBusy] = useState(false);
  const CORRECT_PIN = '1234'; // replace with secure check

  async function runAuth() {
  setBusy(true);
  setShowPin(false);
  setAuthed(false);
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    console.log('Auth debug: hasHardware=', hasHardware, 'isEnrolled=', isEnrolled);

    if (!hasHardware || !isEnrolled) {
      setShowPin(true);
      return;
    }

    const res = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Authenticate to open the app'
    });
    console.log('Auth debug: authenticateAsync result =', res);

    if (res && res.success) {
      setAuthed(true);
      setShowPin(false);
    } else {
      setShowPin(true);
    }
  } catch (e) {
    console.warn('Auth error', e);
    setShowPin(true);
  } finally {
    setBusy(false);
    setReady(true);
  }
}

  useEffect(() => {
    runAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready || busy) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (showPin && !authed) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 12 }}>Enter PIN to continue</Text>
        <TextInput
          value={pin}
          onChangeText={setPin}
          secureTextEntry
          keyboardType="number-pad"
          style={{ width: 160, height: 44, borderWidth: 1, padding: 8, marginBottom: 12 }}
        />
        <Button title="Unlock" onPress={() => {
          if (pin === CORRECT_PIN) setAuthed(true);
          else setPin('');
        }} />
        <View style={{ height: 12 }} />
        <Button title="Try Face ID / Touch ID" onPress={runAuth} />
      </View>
    );
  }

  if (!authed) {
    return (
      <View style={styles.center}>
        <Text style={{ marginBottom: 12 }}>Authentication required</Text>
        <Button title="Try Face ID / PIN" onPress={runAuth} />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' }
});