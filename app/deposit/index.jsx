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
import { Ionicons } from "@expo/vector-icons";

export default function Index() {
  const db = getFirestore();
  const auth = getAuth();
  const navigation = useNavigation();
  const [userData, setUserData] = useState({ firstName: "", lastName: "" });
  const [amount, setAmount] = useState("");
  const [email, setEmail] = useState("");
  const [type, setType] = useState(null);
  const [open, setOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [contractType, setContractType] = useState(null);
  const [isLoading, setIsLoading] = useState(false); // Loading state

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "DEPOSIT",
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={Colors.redTheme.background}
          />
        </TouchableOpacity>
      ),
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
    if (
      !amount ||
      !email ||
      !type ||
      (type === "Time Deposit" && !contractType)
    ) {
      if (Platform.OS === "ios") {
        Alert.alert("Error", "Please fill in all fields before submitting.", [
          "OK",
        ]);
      } else if (Platform.OS === "android") {
        ToastAndroid.show("Please fill in all fields.", ToastAndroid.SHORT);
      }
      return;
    }

    setIsLoading(true);

    try {
      await send(
        process.env.EXPO_PUBLIC_SERVICE_ID,
        process.env.EXPO_PUBLIC_TEMPLATE_ID,
        {
          email,
          message: `Name: ${userData.firstName} ${
            userData.lastName
          }\nAmount: ${amount}\nEmail Address: ${email}\nType: ${type}${
            type === "Time Deposit" ? `\nContract Type: ${contractType}` : ""
          }`,
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
      setIsLoading(false);
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
                zIndex={3000}
              />

              {type === "Time Deposit" && (
                <DropDownPicker
                  open={contractOpen}
                  value={contractType}
                  items={[
                    { label: "6 months contract", value: "6_months" },
                    { label: "1 year contract", value: "1_year" },
                    { label: "2 years contract", value: "2_years" },
                  ]}
                  setOpen={setContractOpen}
                  setValue={setContractType}
                  placeholder="Contract Type"
                  containerStyle={{ height: 50, width: "95%", margin: 10 }}
                  style={{
                    backgroundColor: "white",
                    borderColor: "black",
                    borderWidth: 2,
                    borderRadius: 15,
                  }}
                  zIndex={2000}
                />
              )}

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
                By submitting these details, we will receive an email confirming
                bank account details. Please note that this process will take
                about 5–7 working days.
              </Text>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={onSubmit}
                disabled={isLoading}
              >
                <Text style={styles.submitButtonText}>SUBMIT REQUEST</Text>
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
});
