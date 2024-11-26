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
} from "react-native";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../configs/firebase";
import { useState, useEffect } from "react";

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

  const SignIn = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredentials) => {
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

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ImageBackground
        source={require("../assets/images/bgmain.png")}
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
                  backgroundColor: "#ddf6e1",
                  borderRadius: 25,
                  justifyContent: "center",
                  alignItems: "center",
                  marginBottom: 20,
                }}
                onPress={SignIn}
              >
                <Text
                  style={{
                    color: "#00a651",
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
});
