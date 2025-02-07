import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter, useNavigation } from "expo-router";
import { auth, firestore } from "../../configs/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import StockContent from "../../components/StockContent";
import StockTransaction from "../../components/StockTransaction";
import { Colors } from "../../constants/Colors";

export default function Index() {
  const navigation = useNavigation();
  const router = useRouter();
  const [data, setUserData] = useState({});
  const [userId, setUserId] = useState();

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);

      // Real-time listener for user data
      const userDocRef = doc(firestore, "users", user.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        } else {
          Alert.alert("Error", "No user data found");
        }
      });

      return () => unsubscribeUser();
    }
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Stockholder Dashboard",
      headerTransparent: true,
    });
  }, []);

  return (
    <ImageBackground
      source={require("../../assets/images/bg2.png")}
      style={styles.container}
    >
      <SafeAreaView style={styles.androidSafeArea} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.mainContainer}>
          <StockContent stockAmount={data.stockAmount} />
          <TouchableOpacity
            style={styles.transferButton}
            onPress={() => {
              router.push("deposit");
            }}
          >
            <Text style={styles.transferText}>BUY</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.transferRedButton}
            onPress={() => {
              router.push("withdraw");
            }}
          >
            <Text style={styles.transferRedText}>SELL</Text>
          </TouchableOpacity>
          <StockTransaction userId={userId} />
        </View>
      </TouchableWithoutFeedback>
      <SafeAreaView style={styles.androidSafeArea} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    padding: 10,
  },
  transferButton: {
    margin: 10,
    width: "95%",
    backgroundColor: "green",
    height: 50,
    justifyContent: "center",
    borderRadius: 15,
  },
  transferRedButton: {
    margin: 10,
    width: "95%",
    backgroundColor: "red",
    height: 50,
    justifyContent: "center",
    borderRadius: 15,
  },
  transferRedText: {
    fontSize: 15,
    color: "white",
    textAlign: "center",
  },
  transferText: {
    fontSize: 15,
    color: "white",
    textAlign: "center",
  },
  androidSafeArea: {
    paddingTop: Platform.OS === "android" ? 80 : 0,
    opacity: 0,
  },
});
