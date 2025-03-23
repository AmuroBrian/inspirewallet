import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TouchableWithoutFeedback,
  SafeAreaView,
  Keyboard,
  TextInput,
  TouchableOpacity,
  Alert,
  ToastAndroid,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { send, EmailJSResponseStatus } from "@emailjs/react-native";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import DropDownPicker from "react-native-dropdown-picker";
import { Colors } from "../../constants/Colors";
import LoadingScreen from "../../components/LoadingScreen";

export default function Index() {
  const navigation = useNavigation();
  const db = getFirestore();
  const auth = getAuth();
  const [userData, setUserData] = useState({ firstName: "", lastName: "" });
  const [open, setOpen] = useState(false);
  const [type, setType] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "WITHDRAW",
    });
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = auth.currentUser; // Get the currently signed-in user
        if (user) {
          const userDocRef = doc(db, "users", user.uid); // Reference to user's document
          const userDocSnap = await getDoc(userDocRef); // Fetch user document

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

    fetchUserData(); // Call function to fetch user data on component mount
  }, []);

  const [amount, setAmount] = useState();
  const [emailAddress, setEmailAddress] = useState();
  const [bankAccountNumber, setBankAccountNumber] = useState();
  const [bankAccountName, setBankAccountName] = useState();
  const [bankName, setBankName] = useState();
  const [branchName, setBranchName] = useState();

  const onSubmit = async () => {
    if (
      !amount ||
      !emailAddress ||
      !bankAccountName ||
      !bankAccountNumber ||
      !bankName ||
      !branchName
    ) {
      if (Platform.OS === "ios") {
        Alert.alert("Error", "Please fill in all fields before submitting.", [
          "OK",
        ]);
      } else if (Platform.OS === "android") {
        ToastAndroid.show("Please fill in all fields.", ToastAndroid.SHORT);
      }
      return; // Exit the function if validation fails
    }

    setLoading(true); // Start loading
    try {
      await send(
        process.env.EXPO_PUBLIC_SERVICE_ID,
        process.env.EXPO_PUBLIC_TEMPLATE_ID,
        {
          emailAddress,
          message: `Name: ${userData.firstName} ${userData.lastName}\nAmount: ${amount}\nEmail Address: ${emailAddress}\nBank Account Number: ${bankAccountNumber}\nBank Account Holder Name: ${bankAccountName}\nBank Name: ${bankName}\nBank Branch Name: ${branchName}\nType: ${type}`,
        },
        {
          publicKey: process.env.EXPO_PUBLIC_API_KEY,
        }
      );

      console.log("SUCCESS!");
      if (Platform.OS === "ios") {
        Alert.alert("SUCCESS", "It is successfully sent", ["OK"]);
      } else if (Platform.OS === "android") {
        ToastAndroid.show("Successfully sent!", ToastAndroid.SHORT);
      }
    } catch (err) {
      if (err instanceof EmailJSResponseStatus) {
        console.log("EmailJS Request Failed...", err);
      }

      console.log("ERROR", err);
      if (Platform.OS === "ios") {
        Alert.alert("FAILURE", "It is unsuccessfully sent", ["OK"]);
      } else if (Platform.OS === "android") {
        ToastAndroid.show(
          "Unsuccessfully Sent, Please Try Again Later",
          ToastAndroid.SHORT
        );
      }
    } finally {
      setLoading(false); // Stop loading
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ImageBackground
      source={require("../../assets/images/bg2.png")}
      style={styles.container}
    >
      <SafeAreaView style={styles.androidSafeArea}>
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <TouchableWithoutFeedback
            onPress={Keyboard.dismiss}
            accessible={false}
          >
            <ScrollView
              contentContainerStyle={{
                flex: 1,
                alignItems: "center",
                width: "100%",
                padding: 10,
              }}
            >
              <Text style={{ padding: 10 }}>
                Please fill up the following form in order to request a
                withdraw.
              </Text>

              <DropDownPicker
                open={open}
                value={type}
                items={[
                  { label: "Available Balance", value: "Available Balance" },
                  { label: "Agent Withdrawal", value: "Agent Withdrawal" },
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

              {/* TextInput Fields */}
              <TextInput
                style={styles.input}
                placeholder="Enter Amount"
                placeholderTextColor={"black"}
                keyboardType="numeric"
                onChangeText={(value) => setAmount(value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter Email Address"
                placeholderTextColor={"black"}
                keyboardType="email-address"
                onChangeText={(value) => setEmailAddress(value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter Bank Account Number"
                placeholderTextColor={"black"}
                keyboardType="numeric"
                onChangeText={(value) => setBankAccountNumber(value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter Bank Account Holder Name"
                placeholderTextColor={"black"}
                onChangeText={(value) => setBankAccountName(value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter Bank Name"
                placeholderTextColor={"black"}
                onChangeText={(value) => setBankName(value)}
              />
              <TextInput
                style={styles.input}
                placeholder="Enter Bank Branch Name"
                placeholderTextColor={"black"}
                onChangeText={(value) => setBranchName(value)}
              />

              <Text style={{ paddingLeft: 10, paddingRight: 10 }}>
                By submitting these details, we will receive an email confirming
                bank account details. Please note that this process will take
                about 5–7 working days.
              </Text>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={onSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>SUBMIT REQUEST</Text>
              </TouchableOpacity>
              <View style={{ width: "100%", height: 300 }} />
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  androidSafeArea: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 80 : 0,
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
