import React, { useEffect, useState } from "react";
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
  Platform,
  ToastAndroid,
  ActivityIndicator,
} from "react-native";
import { send, EmailJSResponseStatus } from "@emailjs/react-native";
import { ScrollView } from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { Colors } from "../../constants/Colors";
import LoadingScreen from "../../components/LoadingScreen";
import { Ionicons } from "@expo/vector-icons";

export default function Index() {
  const navigation = useNavigation();
  const router = useRouter();
  const db = getFirestore();
  const auth = getAuth();
  const [userData, setUserData] = useState({ firstName: "", lastName: "" });
  const [emailAddress, setEmailAddress] = useState();
  const [address, setAddress] = useState();
  const [loading, setLoading] = useState(false); // State for activity indicator

  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true); // Start loading
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
      } finally {
        setLoading(false); // Stop loading
      }
    };

    fetchUserData();
  }, []);

  const onSubmit = async () => {
    if (!emailAddress || !address) {
      if (Platform.OS === "ios") {
        Alert.alert("MISSING INFORMATION", "Please fill in all the fields", [
          "OK",
        ]);
      } else if (Platform.OS === "android") {
        ToastAndroid.show("Please fill in all the fields", ToastAndroid.SHORT);
      }
      return; // Stop execution if any field is empty
    }

    setLoading(true); // Start loading
    try {
      await send(
        process.env.EXPO_PUBLIC_SERVICE_ID,
        process.env.EXPO_PUBLIC_TEMPLATE_ID,
        {
          email: emailAddress,
          message: `First Name: ${userData.firstName}\nLast Name: ${userData.lastName}\nEmail Address: ${emailAddress}\nType of Request: Help Concern\nReason: ${address}`,
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

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Inspire Cards",
      headerTransparent: true,
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

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ImageBackground
      source={require("../../assets/images/bg2.png")}
      style={styles.container}
    >
      <SafeAreaView style={styles.androidSafeArea} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.mainContainer}>
          <ScrollView style={{ width: "100%" }}>
            <Text
              style={{
                padding: 10,
                textAlign: "left",
                width: "100%",
              }}
            >
              Please fill up the following form.
            </Text>

            <TextInput
              style={styles.textInput}
              placeholder="Enter Email Address"
              placeholderTextColor={"black"}
              keyboardType="email-address"
              onChangeText={(value) => setEmailAddress(value)}
            />
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter complete address"
              placeholderTextColor={"black"}
              keyboardType="default"
              multiline
              textAlignVertical="top"
              onChangeText={(value) => setAddress(value)}
            />
            <Text
              style={{
                paddingLeft: 10,
                paddingRight: 10,
              }}
            >
              By submitting these details, we will receive an email confirming
              your request to concern. We will get back to you as soon as
              possible. Thank You!
            </Text>
            <TouchableOpacity
              style={{
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
              }}
              onPress={onSubmit}
            >
              <Text
                style={{
                  textAlign: "center",
                  width: "100%",
                  fontSize: 15,
                  color: Colors.newYearTheme.text,
                  fontWeight: 600,
                }}
              >
                SUBMIT REQUEST
              </Text>
            </TouchableOpacity>
            <View style={{ width: "100%", height: 300 }}></View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
      <SafeAreaView style={styles.androidSafeArea} />
    </ImageBackground>
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
  textInput: {
    width: "95%",
    height: 50,
    borderColor: "black",
    borderWidth: 2,
    margin: 10,
    borderRadius: 15,
    padding: 10,
    backgroundColor: "white",
  },
  reasonInput: {
    width: "95%",
    height: 100,
    borderColor: "black",
    borderWidth: 2,
    margin: 10,
    borderRadius: 15,
    padding: 10,
    backgroundColor: "white",
    textAlignVertical: "top",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "green",
  },
});
