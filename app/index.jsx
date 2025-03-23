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
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { onSnapshot, doc } from "firebase/firestore";
import { firestore } from "../configs/firebase";
import { useState, useEffect } from "react";
import { Modal } from "react-native";
import { BlurView } from "expo-blur";
import { Colors } from "../constants/Colors";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LoadingScreen from "./../components/LoadingScreen";

export default function Index() {
  const router = useRouter();
  const navigation = useNavigation();
  const auth = getAuth();
  const { width } = useWindowDimensions();
  const buttonSize = width * 0.2; // Adjusts button size based on screen width
  const imageWidth = width * 0.8; // Adjusts image width dynamically
  const imageHeight = imageWidth * 0.3; // Maintains aspect ratio

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      headerTitle: "Login",
    });
  }, []);

  useEffect(() => {
    // Block back button on Android
    const backAction = () => true;
    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [isPasscodeScreen, setIsPasscodeScreen] = useState(false);
  const [checkPasscode, setCheckPasscode] = useState("");
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState("");
  const [loadingScreen, setLoadingScreen] = useState(false);

  useEffect(() => {
    setIsDeveloper(false);
  }, []);

  const checkUserPasscode = async () => {
    try {
      const userEmail = await AsyncStorage.getItem("userEmail");
      const userPassword = await AsyncStorage.getItem("userPassword");

      if (!userEmail || !userPassword) {
        console.log("No email or password found in AsyncStorage.");
        return;
      }

      // Re-authenticate user
      const userCredential = await signInWithEmailAndPassword(
        auth,
        userEmail,
        userPassword
      );
      const user = userCredential.user;

      if (!user) {
        console.log("Re-authentication failed.");
        return;
      }

      const uid = user.uid;

      // 🔥 Real-time listener for user document
      const userDocRef = doc(firestore, "users", uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();

          if (userData.passcode) {
            setCheckPasscode(userData.passcode);
            setIsPasscodeScreen(true);
          } else {
            console.log("No passcode found for this user.");
          }
        } else {
          Alert.alert("Error", "User not found in Firestore.");
        }
      });

      // Cleanup listener on unmount
      return () => unsubscribe();
    } catch (error) {
      console.error("Error checking passcode:", error);
    }
  };

  // Call function inside useEffect to run when the component mounts
  useEffect(() => {
    checkUserPasscode();
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

  if (!isMaintenance || !isDeveloper) {
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

  const handlePress = (value) => {
    if (value === "Del") {
      setPasscode(passcode.slice(0, -1));
    } else if (value === "✓") {
      if (passcode.length === 4) {
        if (passcode === checkPasscode) {
          Alert.alert("Access Granted!");
          router.replace("/main");
        } else {
          setError("Incorrect Passcode");
          Alert.alert("Incorrect Passcode");
        }
      } else {
        setError("Passcode must be 4 digits");
      }
      setPasscode("");
    } else {
      if (passcode.length < 4) {
        setPasscode(passcode + value);
        setError("");
      }
    }
  };

  if (isPasscodeScreen) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8f9fa",
          paddingHorizontal: 20,
        }}
      >
        <View
          style={{
            width: "100%",
            height: 200,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Image
            source={require("../assets/images/title.png")}
            style={{
              width: imageWidth,
              height: imageHeight,
              resizeMode: "contain",
            }}
          />
        </View>

        <Text
          style={{
            fontSize: width * 0.06,
            fontWeight: "bold",
            marginBottom: 15,
            color: "#333",
          }}
        >
          Enter Passcode
        </Text>
        <Text
          style={{
            fontSize: width * 0.08,
            marginBottom: 20,
            fontWeight: "bold",
            color: "#222",
          }}
        >
          {passcode.replace(/./g, "●")}
        </Text>

        <View
          style={{
            width: "80%",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "space-between",
          }}
        >
          {["1", "2", "3", "4", "5", "6", "7", "8", "9", "Del", "0", "✓"].map(
            (key, index) => (
              <TouchableOpacity
                key={key}
                style={{
                  width: "30%", // Ensures 3 columns
                  aspectRatio: 1, // Makes the buttons square
                  justifyContent: "center",
                  alignItems: "center",
                  marginVertical: 5,
                  backgroundColor: Colors.redTheme.background,
                  borderRadius: 15,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 5,
                }}
                onPress={() => handlePress(key)}
              >
                <Text
                  style={{
                    fontSize: buttonSize * 0.4,
                    fontWeight: "bold",
                    color: "#fff",
                  }}
                >
                  {key}
                </Text>
              </TouchableOpacity>
            )
          )}
          {/* New "Use Email and Password" Button */}
          <TouchableOpacity
            style={{
              marginTop: 20,
              width: "100%",
              paddingVertical: 10,
              paddingHorizontal: 20,
              backgroundColor: Colors.redTheme.background,
              borderRadius: 10,
            }}
            onPress={() => {
              setIsPasscodeScreen(false);
            }} // Adjust as needed
          >
            <Text
              style={{
                color: "#fff",
                fontSize: width * 0.04,
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Use Email and Password
            </Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <Text style={{ color: "red", marginTop: 10, fontSize: width * 0.04 }}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  }

  const SignIn = () => {
    setLoadingScreen(true);
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredentials) => {
        const user = userCredentials.user;
        await AsyncStorage.clear();
        await AsyncStorage.setItem("userEmail", email);
        await AsyncStorage.setItem("userPassword", password);
        setTimeout(() => {
          setLoadingScreen(false);
          router.replace("/main");
        }, 2000);
      })
      .catch((error) => {
        setLoadingScreen(false);
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
          setLoadingScreen(false);
          if (Platform.OS === "android") {
            ToastAndroid.show("Missing Email or Password", ToastAndroid.SHORT);
          } else if (Platform.OS === "ios") {
            Alert.alert("Invalid", "Missing Email or Password");
          }
        } else if (errorCode === "auth/too-many-requests") {
          setLoadingScreen(false);
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

  if (loadingScreen) {
    return <LoadingScreen />;
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
              <TouchableOpacity
                onPress={() => {
                  setIsPasscodeScreen(true);
                }}
              >
                <Text
                  style={{
                    color: "black",
                    textDecorationLine: "underline",
                    marginTop: 10,
                  }}
                >
                  Enter Passcode Instead
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
