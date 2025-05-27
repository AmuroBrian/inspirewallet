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
  Modal,
} from "react-native";
import { useNavigation } from "expo-router";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { ScrollView } from "react-native";
import { Colors } from "../../constants/Colors";

export default function Index() {
  const navigation = useNavigation();
  const auth = getAuth();
  const [emailAddress, setEmailAddress] = useState("");
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "FORGOT PASSWORD",
    });
  }, []);

  const onSubmit = async () => {
    if (!emailAddress) {
      if (Platform.OS === "ios") {
        Alert.alert("MISSING INFORMATION", "Please enter your email address", [
          "OK",
        ]);
      } else if (Platform.OS === "android") {
        ToastAndroid.show(
          "Please enter your email address",
          ToastAndroid.SHORT
        );
      }
      return;
    }

    try {
      await sendPasswordResetEmail(auth, emailAddress);
      setModalVisible(true);
    } catch (error) {
      console.error("Error sending password reset email:", error);
      if (Platform.OS === "ios") {
        Alert.alert(
          "ERROR",
          "Failed to send password reset email. Please try again.",
          ["OK"]
        );
      } else if (Platform.OS === "android") {
        ToastAndroid.show(
          "Failed to send password reset email. Please try again.",
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
          <ScrollView style={{ width: "100%" }}>
            <Text
              style={{
                padding: 10,
                textAlign: "left",
                width: "100%",
              }}
            >
              Please enter your email address to reset your password.
            </Text>

            <TextInput
              style={styles.textInput}
              placeholder="Enter Email Address"
              placeholderTextColor={"black"}
              keyboardType="email-address"
              onChangeText={(value) => setEmailAddress(value)}
            />

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
                SEND RESET LINK
              </Text>
            </TouchableOpacity>
            <View style={{ width: "100%", height: 300 }}></View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
      <SafeAreaView style={styles.androidSafeArea} />

      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Password Reset Email Sent</Text>
            <Text style={styles.modalText}>
              We have sent a password reset link to your email address. Please
              check your inbox and follow the instructions to reset your
              password.
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setModalVisible(false);
                navigation.goBack();
              }}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "80%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: Colors.newYearTheme.background,
    padding: 10,
    borderRadius: 15,
    width: "50%",
    alignItems: "center",
  },
  modalButtonText: {
    color: Colors.newYearTheme.text,
    fontSize: 16,
    fontWeight: "600",
  },
});
