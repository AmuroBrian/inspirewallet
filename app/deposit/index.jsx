import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  SafeAreaView,
  Keyboard,
  TextInput,
  TouchableOpacity,
  Alert,
  Platform,
  ToastAndroid,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "expo-router";
import CurrencyConverter from "../../components/CurrencyConverter";
import { send } from "@emailjs/react-native";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import DropDownPicker from "react-native-dropdown-picker";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Colors } from "../../constants/Colors";
import LoadingScreen from "../../components/LoadingScreen";

export default function Index() {
  const db = getFirestore();
  const auth = getAuth();
  const navigation = useNavigation();
  const [userData, setUserData] = useState({ firstName: "", lastName: "" });
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState(null);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Loading state

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "DEPOSIT",
    });
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data();
            setUserData({
              firstName: data.firstName,
              lastName: data.lastName,
            });
          } else {
            console.log("No such document!");
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const onSubmit = async () => {
    if (!amount || !email || !type) {
      if (Platform.OS === "ios") {
        Alert.alert("Error", "Please fill in all fields before submitting.", [
          "OK",
        ]);
      } else if (Platform.OS === "android") {
        ToastAndroid.show("Please fill in all fields.", ToastAndroid.SHORT);
      }
      return;
    }

    setIsLoading(true); // Start loading

    try {
      await send(
        process.env.EXPO_PUBLIC_SERVICE_ID,
        process.env.EXPO_PUBLIC_TEMPLATE_ID,
        {
          email,
          message: `Name: ${userData.firstName} ${userData.lastName}\nAmount: ${amount}\nEmail Address: ${email}\nType: ${type}`,
        },
        {
          publicKey: process.env.EXPO_PUBLIC_API_KEY,
        }
      );

      if (Platform.OS === "ios") {
        Alert.alert("SUCCESS", "It is successfully sent", ["OK"]);
      } else if (Platform.OS === "android") {
        ToastAndroid.show("Successfully sent!", ToastAndroid.SHORT);
      }
    } catch (err) {
      if (Platform.OS === "ios") {
        Alert.alert("FAILURE", "It is unsuccessfully sent", ["OK"]);
      } else if (Platform.OS === "android") {
        ToastAndroid.show(
          "Unsuccessfully Sent, Please Try Again Later",
          ToastAndroid.SHORT
        );
      }
    } finally {
      setIsLoading(false); // Stop loading
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ImageBackground
        source={require("../../assets/images/bg2.png")}
        style={styles.container}
      >
        <SafeAreaView style={styles.androidSafeArea} />
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <KeyboardAwareScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ alignItems: "center", width: "100%", padding: 10 }}>
              <Text style={{ padding: 10 }}>
                Please fill up the following form in order to request a deposit.
              </Text>

              <DropDownPicker
                open={open}
                value={type}
                items={[
                  { label: "Time Deposit", value: "Time Deposit" },
                  { label: "Stock", value: "Stock" },
                ]}
                setOpen={setOpen}
                setValue={setType}
                placeholder="Select Type"
                containerStyle={{ height: 50, width: "95%", margin: 10 }}
                style={{
                  backgroundColor: "white",
                  borderColor: "black",
                  borderWidth: 2,
                  borderRadius: 15,
                }}
              />

              <TextInput
                style={styles.input}
                placeholder="Enter Amount"
                placeholderTextColor={"black"}
                keyboardType="numeric"
                onChangeText={setAmount}
                value={amount}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter Email Address"
                placeholderTextColor={"black"}
                keyboardType="email-address"
                onChangeText={setEmail}
                value={email}
              />
              <Text style={{ paddingLeft: 10, paddingRight: 10 }}>
                By submitting this amount, we will receive an email confirming
                your investment or stock purchase details. Please note that
                approval for the request will take about 2–3 working days.
              </Text>
              <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
                <Text style={styles.submitButtonText}>SUBMIT REQUEST</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitPaypalButton}
                onPress={() =>
                  Linking.openURL(
                    "https://www.paypal.com/ncp/payment/8SB8AW72XCHPJ"
                  )
                }
              >
                <Text style={styles.submitPaypalText}>PAY VIA PAYPAL</Text>
              </TouchableOpacity>
              <CurrencyConverter />
            </View>
          </KeyboardAwareScrollView>
        </KeyboardAvoidingView>
        <SafeAreaView style={styles.androidSafeArea} />
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  androidSafeArea: {
    paddingTop: Platform.OS === "android" ? 80 : 0,
    opacity: 0,
  },
  input: {
    width: "95%",
    height: 50,
    borderColor: "black",
    borderWidth: 2,
    margin: 10,
    borderRadius: 15,
    padding: 10,
    backgroundColor: "white",
  },
  submitButton: {
    width: "70%",
    backgroundColor: Colors.newYearTheme.background,
    padding: 10,
    borderRadius: 15,
    margin: 20,
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  submitButtonText: {
    textAlign: "center",
    width: "100%",
    fontSize: 15,
    color: Colors.newYearTheme.text,
    fontWeight: "600",
  },
  submitPaypalButton: {
    width: "70%",
    backgroundColor: "blue",
    padding: 10,
    borderRadius: 15,
    margin: 20,
    alignSelf: "center",
  },
  submitPaypalText: {
    textAlign: "center",
    width: "100%",
    fontSize: 15,
    color: "white",
    fontWeight: "600",
  },
});
