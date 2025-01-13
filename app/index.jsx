import { useNavigation, useRouter } from "expo-router";
import {
  ImageBackground,
  StyleSheet,
  Image,
  Text,
  View,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  ToastAndroid,
  Alert,
  BackHandler,
} from "react-native";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { onSnapshot, doc } from "firebase/firestore";
import { auth, app, firestore } from "../configs/firebase";
import { useState, useEffect } from "react";
import { Modal } from "react-native";
import { BlurView } from "expo-blur";
// import messaging from "@react-native-firebase/messaging";
import { Colors } from "../constants/Colors";
// import * as Notifications from "expo-notifications";
// import * as Device from "expo-device";
// import Constants from "expo-constants";

export default function Index() {
  const router = useRouter();
  const navigation = useNavigation();
  const auth = getAuth();

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      headerTitle: "Login",
    });
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [isDeveloper, setIsDeveloper] = useState(false);
  // const [expoPushToken, setExpoPushToken] = useState("");

  useEffect(() => {
    setIsDeveloper(false);
  }, []);

  useEffect(() => {
    const db = firestore; // Initialize Firestore
    const docRef = doc(db, "appConfig", "maintenance"); // Reference to the maintenance document

    // Set up a real-time listener for maintenance status
    const unsubscribe = onSnapshot(
      docRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const { isEnabled, message } = docSnap.data();
          setIsMaintenance(isEnabled);
          setMaintenanceMessage(message);
        } else {
          console.log("No maintenance document found.");
          setIsMaintenance(false); // Default to no maintenance mode
          setMaintenanceMessage(""); // Clear the message
        }
      },
      (error) => {
        console.error("Error listening for maintenance status changes:", error);
      }
    );

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []);

  // useEffect(() => {
  //   // Register for push notifications
  //   registerForPushNotificationsAsync().then((token) => {
  //     if (token) {
  //       console.log(token);
  //       setExpoPushToken(token);
  //       saveTokenToFirestore(token); // Save token to Firestore
  //     }
  //   });

  //   // Listen to incoming notifications
  //   const subscription = Notifications.addNotificationReceivedListener(
  //     (notification) => {
  //       Alert.alert("Notification Received", notification.request.content.body);
  //     }
  //   );

  //   return () => {
  //     subscription.remove();
  //   };
  // }, []);

  // const saveTokenToFirestore = async (token) => {
  //   if (!auth.currentUser) return;

  //   const uid = auth.currentUser.uid;
  //   const db = getFirestore();
  //   const userDocRef = doc(db, "users", uid);

  //   await setDoc(userDocRef, { pushToken: token }, { merge: true });
  // };

  if (isMaintenance || isDeveloper) {
    return (
      <Modal
        transparent={true}
        animationType="fade"
        visible={isMaintenance || isDeveloper}
      >
        <ImageBackground
          source={require("../assets/images/bg2.png")}
          style={style.container}
        >
          <BlurView
            intensity={80}
            tint="dark"
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
            }}
          >
            <View
              style={{
                backgroundColor: "white",
                padding: 20,
                borderRadius: 15,
                alignItems: "center",
                width: "80%",
              }}
            >
              <Text
                style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}
              >
                Maintenance Mode
              </Text>
              <Text
                style={{ fontSize: 16, textAlign: "center", marginBottom: 20 }}
              >
                {maintenanceMessage}
              </Text>
              <TouchableOpacity
                style={style.dismissButton}
                onPress={() => {
                  if (Platform.OS === "android") {
                    BackHandler.exitApp();
                  } else if (Platform.OS === "ios") {
                    Alert.alert(
                      "Exit App",
                      "The app cannot close itself on iOS. Please close it manually.",
                      [{ text: "OK" }]
                    );
                  }
                }}
              >
                <Text style={style.dismissButtonText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </ImageBackground>
      </Modal>
    );
  }

  const SignIn = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredentials) => {
        const user = userCredentials.user;
        router.replace("/main");
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        console.log(errorMessage);
        if (errorCode === "auth/invalid-credential") {
          if (Platform.OS === "android") {
            ToastAndroid.show("Invalid Email or Password", ToastAndroid.SHORT);
          } else if (Platform.OS === "ios") {
            Alert.alert(
              "Invalid",
              "Invalid email address or password. Please Try Again",
              ["OK"]
            );
          }
        } else if (
          errorCode === "auth/missing-password" ||
          errorCode === "auth/missing-email" ||
          errorCode === "auth/invalid-email"
        ) {
          if (Platform.OS === "android") {
            ToastAndroid.show("Missing Email or Password", ToastAndroid.SHORT);
          } else if (Platform.OS === "ios") {
            Alert.alert("Invalid", "Missing Email or Password");
          }
        } else if (errorCode === "auth/too-many-requests") {
          if (Platform.OS === "android") {
            ToastAndroid.show(
              "It seems you forgot email or password. Please click forgot password.",
              ToastAndroid.SHORT
            );
          } else if (Platform.OS === "ios") {
            Alert.alert(
              "Too Many Request",
              "It seems you forgot email or password. Please click forgot password.",
              ["OK"]
            );
          }
        }
      });
  };

  async function registerForPushNotificationsAsync() {
    if (Device.isDevice) {
      const { status: existingStatus } =
        await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        Alert.alert("Failed to get push token for push notification!");
        return null;
      }

      const token = (await Notifications.getExpoPushTokenAsync()).data;
      return token;
    } else {
      Alert.alert("Must use physical device for Push Notifications");
      return null;
    }

    if (Platform.OS === "android") {
      Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }
  }
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ImageBackground
        source={require("../assets/images/bg2.png")}
        style={style.container}
      >
        <SafeAreaView style={style.androidSafeArea} />
        <View style={style.logoContainer}>
          <Image
            source={require("../assets/images/title.png")}
            style={{
              width: 320,
              height: 90,
              alignItems: "center",
              justifyContent: "center",
            }}
          />
        </View>
        <Text
          style={{
            textAlign: "center",
            fontSize: 25,
            paddingTop: 30,
          }}
        >
          WELCOME INVESTOR
        </Text>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={style.loginContainer}>
            <View style={style.loginStyle}>
              <TextInput
                style={{
                  borderColor: "gray",
                  borderWidth: 1,
                  padding: 10,
                  borderRadius: 25,
                  width: "90%",
                  height: 50,
                  marginBottom: 20,
                  color: "black",
                }}
                placeholder="Email Address"
                placeholderTextColor={"black"}
                keyboardType="email-address"
                onChangeText={(value) => setEmail(value)}
              />
              <TextInput
                style={{
                  borderColor: "gray",
                  borderWidth: 1,
                  padding: 10,
                  borderRadius: 25,
                  width: "90%",
                  height: 50,
                  marginBottom: 20,
                  color: "black",
                }}
                placeholder="Password"
                placeholderTextColor={"black"}
                keyboardType="default"
                secureTextEntry
                onChangeText={(value) => setPassword(value)}
              />
              <TouchableOpacity
                style={{
                  width: "90%",
                  height: 50,
                  backgroundColor: Colors.redTheme.background,
                  borderRadius: 25,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                }}
                onPress={SignIn}
              >
                <Text
                  style={{
                    color: Colors.redTheme.text,
                    fontWeight: 800,
                  }}
                >
                  LOGIN
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  width: "90%",
                  height: 50,
                  borderRadius: 25,
                  justifyContent: "center",
                  alignItems: "center",
                  borderColor: "black",
                  borderWidth: 2,
                }}
                onPress={() => {
                  router.push("/register");
                }}
              >
                <Text
                  style={{
                    color: "black",
                    fontWeight: 800,
                  }}
                >
                  REGISTER
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push("/forgotpassword")}>
                <Text
                  style={{
                    color: "black",
                    textDecorationLine: "underline",
                    marginTop: 10,
                  }}
                >
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>

        <View style={style.ownerContainer}>
          <Text
            style={{
              fontStyle: "italic",
            }}
          >
            CREATED BY INSPIRE
          </Text>
        </View>
        <SafeAreaView style={style.androidSafeArea} />
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
}

const style = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  loginContainer: {
    flex: 3,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    paddingTop: Platform.OS === "ios" ? 30 : 10,
    paddingBottom: Platform.OS === "ios" ? 30 : 10,
  },
  ownerContainer: {
    flex: 1,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  loginStyle: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 100 : 10,
    alignItems: "center",
    width: 300,
    borderRadius: 25,
    backgroundColor: "white",
    position: "relative",
    borderColor: "black",
    borderWidth: 1,
    paddingBottom: Platform.OS === "android" ? 100 : 10,
    justifyContent: "center",
  },
  androidSafeArea: {
    paddingTop: Platform.OS === "android" ? 25 : 0,
    opacity: 0,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: "center",
  },
  dismissButton: {
    backgroundColor: "#ff4444",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginTop: 10,
  },
  dismissButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
