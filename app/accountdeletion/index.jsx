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
  ScrollView,
} from "react-native";
import { useNavigation } from "expo-router";
import { send, EmailJSResponseStatus } from "@emailjs/react-native";
import { Colors } from "../../constants/Colors";

export default function Index() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "ACCOUNT DELETION REQUEST",
    });
  }, []);

  const [firstName, setFirstName] = useState();
  const [lastName, setLastName] = useState();
  const [emailAddress, setEmailAddress] = useState();
  const [reason, setReason] = useState();

  const onSubmit = async () => {
    if (!firstName || !lastName || !emailAddress || !reason) {
      if (Platform.OS === "ios") {
        Alert.alert("Error", "Please fill in all fields before submitting.", [
          "OK",
        ]);
      } else if (Platform.OS === "android") {
        ToastAndroid.show("Please fill in all fields.", ToastAndroid.SHORT);
      }
      return; // Exit the function if validation fails
    }
    try {
      await send(
        process.env.EXPO_PUBLIC_SERVICE_ID,
        process.env.EXPO_PUBLIC_TEMPLATE_ID,
        {
          email: emailAddress,
          message: `First Name: ${firstName}\nLast Name: ${lastName}\nEmail Address: ${emailAddress}\nType of Request: Account Deletion\nReason: ${reason}`,
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
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bg2.png")}
      style={styles.container}
    >
      <SafeAreaView style={styles.androidSafeArea} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View
          style={{ flex: 1, alignItems: "center", width: "100%", padding: 10 }}
        >
          <ScrollView>
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
              placeholder="Enter First Name"
              placeholderTextColor={"black"}
              keyboardType="default"
              onChangeText={(value) => setFirstName(value)}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Enter Last Name"
              placeholderTextColor={"black"}
              keyboardType="default"
              onChangeText={(value) => setLastName(value)}
            />
            <TextInput
              style={styles.textInput}
              placeholder="Enter Email Address"
              placeholderTextColor={"black"}
              keyboardType="email-address"
              onChangeText={(value) => setEmailAddress(value)}
            />
            <TextInput
              style={styles.reasonInput}
              placeholder="Enter Reason for account deletion"
              placeholderTextColor={"black"}
              keyboardType="default"
              multiline
              textAlignVertical="top"
              onChangeText={(value) => setReason(value)}
            />
            <Text
              style={{
                paddingLeft: 10,
                paddingRight: 10,
              }}
            >
              By submitting these details, we will receive an email confirming
              your request for account deletion. We will get back to you as soon
              as possible, typically within 2–3 working days. Thank you!
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
    height: 200,
    borderColor: "black",
    borderWidth: 2,
    margin: 10,
    borderRadius: 15,
    padding: 10,
    backgroundColor: "white",
    textAlignVertical: "top",
  },
});
