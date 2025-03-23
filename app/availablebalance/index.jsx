import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  SafeAreaView,
  TouchableWithoutFeedback,
  ScrollView,
  Keyboard,
  TouchableOpacity,
  Platform,
  Alert,
  ToastAndroid,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter, useNavigation } from "expo-router";
import { auth, firestore } from "../../configs/firebase";
import {
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import InvestmentProfileButtons from "../../components/InvestmentProfileButtons";
import AmountContent from "../../components/TimeDepositContent";
import AvailBalanceContent from "../../components/AvailBalanceContent";
import TransactionHistory from "../../components/TransactionHistory";
import AutoCarousel from "../../components/AutoCarousel";
import CurrencyConverter from "../../components/CurrencyConverter";
import { Colors } from "../../constants/Colors";
import WithdrawContent from "../../components/WithdrawContent";

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
      headerTitle: "Available Balance",
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
        <ScrollView
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={{ alignItems: "center" }}
        >
          <View style={styles.mainContainer}>
            <WithdrawContent
              withdrawAmount={data.walletAmount || 0}
              dollarWithdrawAmount={data.dollarWalletAmount || 0}
              cryptoWithdrawAmount={data.cryptoWalletAmount || 0}
            />
            <AvailBalanceContent
              availBalanceAmount={data.availBalanceAmount || 0}
              dollarAvailBalanceAmount={data.dollarAvailBalanceAmount || 0}
              cryptoAvailBalanceAmount={data.cryptoAvailBalanceAmount || 0}
            />
            <View
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              <AutoCarousel />
            </View>
            <CurrencyConverter />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={() => router.push("withdraw")}
              >
                <Text
                  style={{ color: Colors.newYearTheme.text, fontWeight: "500" }}
                >
                  WITHDRAW
                </Text>
              </TouchableOpacity>
            </View>
            <TransactionHistory userId={userId} />
          </View>
        </ScrollView>
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
    backgroundColor: "#ddf6e1",
    height: 50,
    justifyContent: "center",
    borderRadius: 15,
  },
  transferText: {
    fontSize: 15,
    color: "#00a651",
    textAlign: "center",
  },
  androidSafeArea: {
    paddingTop: Platform.OS === "android" ? 80 : 0,
    opacity: 0,
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 25,
  },
  buttonContainer: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.newYearTheme.background,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
