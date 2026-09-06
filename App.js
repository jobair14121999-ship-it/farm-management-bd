import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  FlatList,
  ActivityIndicator,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import FarmApp from './FarmApp';

const cleanId = (id) =>
  id.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const makeEmail = (id) =>
  `${cleanId(id)}@farmmanagementbd.app`;

export default function App() {
  const [user, setUser] = useState(null);
  const [starting, setStarting] = useState(true);
  const [id, setId] = useState('');
  const [pin, setPin] = useState('');
  const [farms, setFarms] = useState([]);
  const [farmName, setFarmName] = useState('');
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [farmVersion, setFarmVersion] = useState(0);

  const lastSynced = useRef(null);
  const syncReady = useRef(false);

  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setSelectedFarm(null);
      setStarting(false);
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!user) {
      setFarms([]);
      return;
    }

    const farmsRef = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('farms');

    const unsubscribe = farmsRef.onSnapshot(
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        list.sort(
          (a, b) =>
            Number(a.clientCreatedAt || 0) -
            Number(b.clientCreatedAt || 0)
        );

        setFarms(list);
      },
      (error) => console.log('Farm list error:', error)
    );

    return unsubscribe;
  }, [user]);

  const storageKey =
    user && selectedFarm
      ? `farm_management_bd_final_v1_${user.uid}_${selectedFarm.id}`
      : null;

  useEffect(() => {
    if (!user || !selectedFarm || !storageKey) return;

    syncReady.current = false;
    lastSynced.current = null;

    const cloudRef = firestore()
      .collection('users')
      .doc(user.uid)
      .collection('farms')
      .doc(selectedFarm.id)
      .collection('state')
      .doc('main');

    const unsubscribe = cloudRef.onSnapshot(
      async (snapshot) => {
        try {
          if (snapshot.exists) {
            const remote = snapshot.data();

            if (typeof remote?.data === 'string') {
              const local = await AsyncStorage.getItem(storageKey);

              if (remote.data !== local) {
                await AsyncStorage.setItem(storageKey, remote.data);
                lastSynced.current = remote.data;
                setFarmVersion((v) => v + 1);
              } else {
                lastSynced.current = local;
              }
            }
          } else {
            const local = await AsyncStorage.getItem(storageKey);

            if (local) {
              await cloudRef.set(
                {
                  data: local,
                  clientUpdatedAt: Date.now(),
                  updatedAt: firestore.FieldValue.serverTimestamp(),
                },
                { merge: true }
              );

              lastSynced.current = local;
            }
          }

          syncReady.current = true;
        } catch (error) {
          console.log('Cloud receive error:', error);
          syncReady.current = true;
        }
      },
      (error) => {
        console.log('Cloud listener error:', error);
        syncReady.current = true;
      }
    );

    const timer = setInterval(async () => {
      if (!syncReady.current) return;

      try {
        const local = await AsyncStorage.getItem(storageKey);

        if (local && local !== lastSynced.current) {
          lastSynced.current = local;

          await cloudRef.set(
            {
              data: local,
              clientUpdatedAt: Date.now(),
              updatedAt: firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
      } catch (error) {
        console.log('Cloud send error:', error);
      }
    }, 1500);

    return () => {
      unsubscribe();
      clearInterval(timer);
      syncReady.current = false;
      lastSynced.current = null;
    };
  }, [user, selectedFarm, storageKey]);

  const validate = () => {
    if (cleanId(id).length < 3) {
      Alert.alert('ID ঠিক করুন', 'ID কমপক্ষে ৩টি ইংরেজি অক্ষর বা সংখ্যা দিন।');
      return false;
    }

    if (!/^\d{4,8}$/.test(pin.trim())) {
      Alert.alert('PIN ঠিক করুন', 'PIN ৪ থেকে ৮ সংখ্যার দিন।');
      return false;
    }

    return true;
  };

  const login = async () => {
    if (!validate()) return;

    try {
      await auth().signInWithEmailAndPassword(
        makeEmail(id),
        `fm${pin.trim()}`
      );
    } catch (error) {
      Alert.alert('Login হয়নি', 'ID অথবা PIN সঠিক নয়।');
    }
  };

  const signup = async () => {
    if (!validate()) return;

    try {
      await auth().createUserWithEmailAndPassword(
        makeEmail(id),
        `fm${pin.trim()}`
      );
    } catch (error) {
      if (error?.code?.includes('email-already-in-use')) {
        Alert.alert('এই ID আগে থেকেই আছে', 'আগের Account হলে Login চাপুন।');
      } else {
        Alert.alert('Account তৈরি হয়নি', 'Internet আছে কিনা দেখে আবার চেষ্টা করুন।');
      }
    }
  };

  const addFarm = async () => {
    const name = farmName.trim();

    if (!name) {
      Alert.alert('ফার্মের নাম দিন');
      return;
    }

    try {
      await firestore()
        .collection('users')
        .doc(user.uid)
        .collection('farms')
        .add({
          name,
          clientCreatedAt: Date.now(),
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

      setFarmName('');
    } catch (error) {
      Alert.alert('Farm যোগ হয়নি', 'আবার চেষ্টা করুন।');
    }
  };

  const logout = async () => {
    setSelectedFarm(null);
    await auth().signOut();
  };

  if (starting) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
        <Text style={styles.gray}>Farm Management BD চালু হচ্ছে...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.loginBox}>
          <Text style={styles.title}>Farm Management BD</Text>
          <Text style={styles.subtitle}>
            একই ID + PIN দিয়ে কয়েকটি ফোনে একই হিসাব
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Account ID"
            autoCapitalize="none"
            value={id}
            onChangeText={setId}
          />

          <TextInput
            style={styles.input}
            placeholder="PIN (৪-৮ সংখ্যা)"
            keyboardType="number-pad"
            secureTextEntry
            value={pin}
            onChangeText={setPin}
          />

          <TouchableOpacity style={styles.button} onPress={login}>
            <Text style={styles.white}>Login</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.outlineButton} onPress={signup}>
            <Text style={styles.green}>নতুন Account তৈরি করুন</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedFarm) {
    return (
      <SafeAreaView style={styles.page}>
        <View style={styles.wrapper}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.title}>আমার ফার্ম</Text>
              <Text style={styles.subtitle}>
                যে Farm-এ কাজ করবেন সেটি খুলুন
              </Text>
            </View>

            <TouchableOpacity onPress={logout}>
              <Text style={styles.red}>Logout</Text>
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="নতুন Farm-এর নাম"
            value={farmName}
            onChangeText={setFarmName}
          />

          <TouchableOpacity style={styles.button} onPress={addFarm}>
            <Text style={styles.white}>+ Farm যোগ করুন</Text>
          </TouchableOpacity>

          <FlatList
            data={farms}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.empty}>এখনো কোনো Farm নেই।</Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.farmCard}
                onPress={() => setSelectedFarm(item)}
              >
                <Text style={styles.farmName}>{item.name}</Text>
                <Text style={styles.green}>খুলুন ›</Text>
              </TouchableOpacity>
            )}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <SafeAreaView style={styles.top}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => setSelectedFarm(null)}>
            <Text style={styles.white}>‹ Farm List</Text>
          </TouchableOpacity>

          <Text style={styles.topName}>{selectedFarm.name}</Text>
        </View>
      </SafeAreaView>

      <View style={{ flex: 1 }}>
        <FarmApp
          key={`${selectedFarm.id}_${farmVersion}`}
          storageKey={storageKey}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f3f6f4',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f6f4',
  },
  loginBox: {
    margin: 20,
    padding: 20,
    backgroundColor: '#ffffff',
    borderRadius: 16,
  },
  wrapper: {
    flex: 1,
    padding: 18,
  },
  title: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#17452f',
    marginBottom: 6,
  },
  subtitle: {
    color: '#68766f',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccd5d0',
    borderRadius: 10,
    padding: 13,
    marginBottom: 10,
    backgroundColor: '#ffffff',
  },
  button: {
    backgroundColor: '#176b49',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  outlineButton: {
    borderWidth: 1,
    borderColor: '#176b49',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  white: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  green: {
    color: '#176b49',
    fontWeight: 'bold',
  },
  red: {
    color: '#c62828',
    fontWeight: 'bold',
  },
  gray: {
    color: '#68766f',
    marginTop: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  farmCard: {
    padding: 17,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  farmName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#17452f',
  },
  empty: {
    textAlign: 'center',
    color: '#68766f',
    marginTop: 40,
  },
  top: {
    backgroundColor: '#17452f',
    padding: 14,
  },
  topName: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
});
