import {
  ImageBackground,
  Keyboard,
  StyleSheet,
  Text,
  View,
  TouchableWithoutFeedback,
  SafeAreaView,
  Pressable,
  Platform,
  StatusBar,
  TextInput,
  TouchableOpacity,
  ToastAndroid,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useNavigation, useRouter } from "expo-router";
import { auth, firestore } from "../../configs/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { collection, doc, setDoc, addDoc } from "firebase/firestore";
import { Colors } from "../../constants/Colors";
import LoadingScreen from "./../../components/LoadingScreen";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { registerIndieID, unregisterIndieDevice } from "native-notify";

const { width } = Dimensions.get("window");

export default function Index() {
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "",
      headerTransparent: true,
    });
  }, []);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agentCode, setAgentCode] = useState();

  const [isYesChecked, setIsYesChecked] = useState(false);
  const [isNoChecked, setIsNoChecked] = useState(false);

  const handleYes = () => {
    setIsYesChecked(true);
    setIsNoChecked(false);
  };

  const handleNo = () => {
    setIsNoChecked(true);
    setIsYesChecked(false);
    setAgentCode(0);
  };

  const ConfirmPassMethod = () => {
    if (password === confirmPass) {
      Register();
    } else {
      if (Platform.OS === "android") {
        ToastAndroid.show(
          "Password and Confirm Password do not match!",
          ToastAndroid.SHORT
        );
      } else if (Platform.OS === "ios") {
        Alert.alert(
          "Password Mismatch",
          "Password and Confirm Password do not match. Please Try Again",
          ["OK"]
        );
      }
    }
  };

  const Register = async () => {
    if (!firstName || !lastName || !emailAddress || !password || !confirmPass) {
      if (Platform.OS === "ios") {
        Alert.alert("Error", "Please fill in all fields before submitting.", [
          "OK",
        ]);
      } else if (Platform.OS === "android") {
        ToastAndroid.show("Please fill in all fields.", ToastAndroid.SHORT);
      }
      return;
    }

    // Validate agent code if user is an agent
    if (isYesChecked && !agentCode) {
      if (Platform.OS === "ios") {
        Alert.alert("Error", "Please enter an agent code.", ["OK"]);
      } else if (Platform.OS === "android") {
        ToastAndroid.show("Please enter an agent code.", ToastAndroid.SHORT);
      }
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailAddress,
        password
      );
      const user = userCredential.user;
      let now = new Date();

      await AsyncStorage.clear();
      await AsyncStorage.setItem("userEmail", emailAddress);
      await AsyncStorage.setItem("userPassword", password);

      await setDoc(doc(firestore, "users", user.uid), {
        firstName,
        lastName,
        agentCode: isYesChecked ? agentCode : 0,
        stockAmount: 0,
        walletAmount: 0,
        timeDepositAmount: 0,
        agentWalletAmount: 0,
        usdtAmount: 0,
        availBalanceAmount: 0,
        emailAddress: emailAddress,
        dollarDepositAmount: 0,
        dollarAvailBalanceAmount: 0,
        cryptoAvailBalanceAmount: 0,
        dollarWalletAmount: 0,
        cryptoWalletAmount: 0,
        createdAt: now,
        agent: isYesChecked,
        lastSignedIn: now,
        stock: false,
        cryptoBalances: {
          BTC: 0,
          ETH: 0,
          USDT: 0,
        },
        currencyBalances: {
          USD: 0,
          JPY: 0,
        },
      });

      await addDoc(collection(firestore, "users", user.uid, "transactions"), {
        amount: 0,
        date: now,
        type: "Created Account",
      });

      await addDoc(
        collection(firestore, "users", user.uid, "agentTransactions"),
        {
          amount: 0,
          date: now,
          type: "Created Account",
        }
      );

      await addDoc(
        collection(firestore, "users", user.uid, "stockTransactions"),
        {
          amount: 0,
          date: now,
          type: "Created Account",
        }
      );

      await addDoc(
        collection(firestore, "users", user.uid, "investmentProfiles"),
        {
          amount: 0,
          dateOfMaturity: now,
          interestRate: 0,
        }
      );

      // Add initialization of cryptoTrades collection
      await addDoc(collection(firestore, "users", user.uid, "cryptoTrades"), {
        type: "INITIAL",
        asset: "SYSTEM",
        amount: 0,
        amountPHP: 0,
        price: 0,
        totalCost: 0,
        timestamp: now,
      });

      if (Platform.OS === "android") {
        ToastAndroid.show("Successfully Registered", ToastAndroid.SHORT);
      } else if (Platform.OS === "ios") {
        Alert.alert(
          "Successfully Registered",
          "Congratulations, you are now registered in this app",
          ["OK"]
        );
      }
      registerIndieID(
        user.uid.toString(),
        28259,
        process.env.EXPO_PUBLIC_NATIVENOTIFY_API_KEY
      );
      await axios.post("https://app.nativenotify.com/api/indie/notification", {
        subID: `${user.uid}`,
        appId: 28259,
        appToken: process.env.EXPO_PUBLIC_NATIVENOTIFY_API_KEY,
        title: "Welcome to Inspire Wallet",
        message: "Congratulations you successfully registered your account.",
      });
      unregisterIndieDevice(
        user.uid.toString(),
        28259,
        process.env.EXPO_PUBLIC_NATIVENOTIFY_API_KEY
      );
      router.push("/");
    } catch (error) {
      console.log(error);
      if (error.code === "auth/email-already-in-use") {
        if (Platform.OS === "android") {
          ToastAndroid.show("This email is already in use", ToastAndroid.SHORT);
        } else if (Platform.OS === "ios") {
          Alert.alert("Registration Failed", "This email is already in use", [
            "Try Again",
          ]);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ImageBackground
        source={require("../../assets/images/bg2.png")}
        style={styles.container}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <SafeAreaView style={styles.androidSafeArea} />
          <ScrollView
            contentContainerStyle={styles.formContainer}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.headerText}>REGISTER</Text>
            <View style={{ width: "100%", height: 30 }}></View>
            <Text style={styles.subHeaderText}>WELCOME INVESTOR!</Text>
            <View style={{ width: "100%", height: 30 }}></View>
            <Text style={styles.infoText}>
              Register to Inspire in order for you to track your Investment!
            </Text>
            <View style={{ width: "100%", height: 30 }}></View>
            <TextInput
              style={styles.input}
              placeholder="First Name"
              placeholderTextColor="black"
              onChangeText={(value) => setFirstName(value)}
            />
            <TextInput
              style={styles.input}
              placeholder="Last Name"
              placeholderTextColor="black"
              onChangeText={(value) => setLastName(value)}
            />
            {/* <TextInput
              style={styles.input}
              placeholder="Agent Code"
              placeholderTextColor="black"
              onChangeText={(value) => setAgentCode(value)}
            /> */}

            <View style={styles.inlineRow}>
              <Text style={styles.labelagent}>Agent</Text>

              <Pressable style={styles.checkboxContainer} onPress={handleYes}>
                <View
                  style={[styles.checkbox, isYesChecked && styles.checkedBox]}
                />
                <Text style={styles.checkboxLabel}>Yes</Text>
              </Pressable>

              <Pressable style={styles.checkboxContainer} onPress={handleNo}>
                <View
                  style={[styles.checkbox, isNoChecked && styles.checkedBox]}
                />
                <Text style={styles.checkboxLabel}>No</Text>
              </Pressable>

              {isYesChecked && (
                <TextInput
                  style={styles.inputagent}
                  placeholder="Agent Code"
                  placeholderTextColor="black"
                  value={agentCode}
                  onChangeText={setAgentCode}
                />
              )}
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="black"
              keyboardType="email-address"
              onChangeText={(value) => setEmailAddress(value)}
            />

            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Password"
                placeholderTextColor="black"
                secureTextEntry={!showPassword}
                onChangeText={(value) => setPassword(value)}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={styles.eyeButtonText}>
                  {showPassword ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm Password"
                placeholderTextColor="black"
                secureTextEntry={!showConfirmPass}
                onChangeText={(value) => setConfirmPass(value)}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowConfirmPass(!showConfirmPass)}
              >
                <Text style={styles.eyeButtonText}>
                  {showConfirmPass ? "Hide" : "Show"}
                </Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.submitButton}
              onPress={ConfirmPassMethod}
            >
              <Text style={styles.submitButtonText}>REGISTER</Text>
            </TouchableOpacity>
          </ScrollView>
          <SafeAreaView style={styles.androidSafeArea} />
        </KeyboardAvoidingView>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  formContainer: {
    alignItems: "center",
    width: "100%",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  headerText: {
    fontSize: 30,
    fontWeight: "800",
    textAlign: "center",
  },
  subHeaderText: {
    fontSize: 25,
    textAlign: "center",
    fontWeight: "800",
  },
  infoText: {
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    width: width * 0.95,
    height: 50,
    borderColor: "black",
    borderWidth: 1,
    margin: 10,
    borderRadius: 25,
    padding: 10,
    backgroundColor: "white",
  },
  passwordContainer: {
    width: width * 0.95,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    borderColor: "black",
    borderWidth: 1,
    borderRadius: 25,
    margin: 10,
    backgroundColor: "white",
  },
  passwordInput: {
    flex: 1,
    padding: 10,
  },
  eyeButton: {
    padding: 10,
  },
  eyeButtonText: {
    color: Colors.redTheme.background,
  },
  submitButton: {
    width: width * 0.95,
    backgroundColor: Colors.newYearTheme.background,
    padding: 15,
    alignItems: "center",
    borderRadius: 25,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  submitButtonText: {
    color: Colors.newYearTheme.text,
    fontSize: 20,
    fontWeight: "bold",
  },
  androidSafeArea: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },

  inlineRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap", // wraps on smaller screens
    gap: 10,
    marginBottom: "10",
    marginTop: "10",
  },
  labelagent: {
    fontSize: 15,
    fontWeight: "400",
    marginRight: 10,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 10,
  },
  checkbox: {
    height: 20,
    width: 20,
    borderWidth: 1,
    borderColor: "black",
    marginRight: 5,
    borderRadius: 4,
  },
  checkedBox: {
    backgroundColor: "red",
  },
  checkboxLabel: {
    fontSize: 16,
    marginRight: 5,
  },
  inputagent: {
    borderWidth: 1,
    borderColor: "black",
    borderRadius: 5,
    padding: 8,
    width: 150,
  },
});
