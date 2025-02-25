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
  ActivityIndicator,
  Modal,
} from "react-native";
import { useNavigation } from "expo-router";
import React, { useEffect, useState } from "react";
import { send, EmailJSResponseStatus } from "@emailjs/react-native";
import { getFirestore, doc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors } from "../../constants/Colors";

export default function Index() {
  const navigation = useNavigation();
  const db = getFirestore();
  const auth = getAuth();
  const [userData, setUserData] = useState({ firstName: "", lastName: "" });
  const [open, setOpen] = useState(false);
  const [openGender, setOpenGender] = useState(false);
  const [openCivilStatus, setOpenCivilStatus] = useState(false);
  const [openBank, setOpenBank] = useState(false);
  const [type, setType] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [placeholderDate, setPlaceHolderDate] = useState("Enter Birthdate");

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate;
    setDate(currentDate);
    setPlaceHolderDate(currentDate.toLocaleDateString());
  };

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "Finance*",
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

  const [emailAddress, setEmailAddress] = useState();
  const [mobileNumber, setMobileNumber] = useState();
  const [landlineNumber, setLandlineNumber] = useState();
  const [address, setAddress] = useState();
  const [sourceFund, setSourceFund] = useState();
  const [grossIncome, setGrossIncome] = useState(0);
  const [gender, setGender] = useState();
  const [civilStatus, setCivilStatus] = useState("Single");
  const [BankType,setBankType] = useState("BDO");
  const [citizenShip, setCitizenShip] = useState("Japanese");

  const onSubmit = async () => {
    if (
      !emailAddress ||
      !mobileNumber ||
      !address ||
      !sourceFund ||
      !grossIncome ||
      !citizenShip
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
          message: `Name: ${userData.firstName} ${userData.lastName}\nEmail Address: ${emailAddress}\nLandline Number: ${landlineNumber}\nGender: ${gender}\nBirthdate: ${date}\nAddress: ${address}\nSource of Fund: ${sourceFund}\nGross Monthly Income: ${grossIncome}\nCivil Status: ${civilStatus}\nCitizenship: ${citizenShip}\nType: BDO Account Opening`,
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

  return (
    <ImageBackground
      source={require("../../assets/images/bg2.png")}
      style={styles.container}
    >
      <SafeAreaView style={styles.androidSafeArea}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={{
              alignItems: "center",
              width: "100%",
              padding: 10,
              marginBottom: 100,
            }}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={{ padding: 10 }}>
              Please fill up the following form in order to request an open
              account in BDO.
            </Text>

            {/* TextInput Fields */}

            <DropDownPicker
              open={openBank}
              value={BankType}
              items={[
                { label: "BDO", value: "BDO" },
                { label: "Security Bank", value: "Security Bank" },
                { label: "CTBC", value: "CTBC" },
                { label: "Unionbank", value: "Unionbank" },
              ]}
              setOpen={setOpenBank}
              setValue={setBankType}
              placeholder="Select Bank Type"
              containerStyle={{
                height: 50,
                width: "95%",
                margin: 10,
                zIndex: 1000,
              }}
              style={{
                backgroundColor: "white",
                borderColor: "black",
                borderWidth: 2,
                borderRadius: 15,
                zIndex: 1500,
              }}
              onPress={() => {
                setShow(false);
              }}
            />






            <TextInput
              style={styles.input}
              placeholder="Enter Email Address"
              placeholderTextColor={"black"}
              keyboardType="email-address"
              onChangeText={(value) => setEmailAddress(value)}
              onPress={() => {
                setShow(false);
              }}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter Personal Mobile Number"
              placeholderTextColor={"black"}
              keyboardType="phone-pad"
              onChangeText={(value) => setMobileNumber(value)}
              onPress={() => {
                setShow(false);
              }}
            />
            <TextInput
              style={styles.input}
              placeholder="Enter Landline Number"
              placeholderTextColor={"black"}
              keyboardType="phone-pad"
              onChangeText={(value) => setLandlineNumber(value)}
              onPress={() => {
                setShow(false);
              }}
            />

            <DropDownPicker
              open={openGender}
              value={gender}
              items={[
                { label: "Male", value: "Male" },
                { label: "Female", value: "Female" },
                { label: "Prefer not to say", value: "Prefer not to say" },
              ]}
              setOpen={setOpenGender}
              setValue={setGender}
              placeholder="Select Gender"
              containerStyle={{
                height: 50,
                width: "95%",
                margin: 10,
                zIndex: 1000,
              }}
              style={{
                backgroundColor: "white",
                borderColor: "black",
                borderWidth: 2,
                borderRadius: 15,
                zIndex: 1500,
              }}
              onPress={() => {
                setShow(false);
              }}
            />

            <TextInput
              style={styles.input}
              placeholder={placeholderDate}
              placeholderTextColor={"black"}
              onPress={() => {
                console.log("Pressed");
                setShow(true);
              }}
            />

            {show && (
              <DateTimePicker
                testID="dateTimePicker"
                value={date}
                mode={"date"}
                is24Hour={true}
                onChange={onChange}
                display="compact"
              />
            )}

            <TextInput
              style={styles.reasonInput}
              placeholder="Enter Address"
              placeholderTextColor={"black"}
              keyboardType="default"
              multiline
              textAlignVertical="top"
              onChangeText={(value) => setAddress(value)}
              onPress={() => {
                setShow(false);
              }}
            />
            {/* Date Time Picker */}
            <TextInput
              style={styles.input}
              placeholder="Source of Fund"
              placeholderTextColor={"black"}
              keyboardType="default"
              onChangeText={(value) => setSourceFund(value)}
              onPress={() => {
                setShow(false);
              }}
            />
            <TextInput
              style={styles.input}
              placeholder="Gross Monthly Income"
              placeholderTextColor={"black"}
              keyboardType="default"
              onChangeText={(value) => setGrossIncome(value)}
              onPress={() => {
                setShow(false);
              }}
            />

            <DropDownPicker
              open={openCivilStatus}
              value={civilStatus}
              items={[
                { label: "Single", value: "Single" },
                { label: "Married", value: "Married" },
                { label: "Legally Separated", value: "Legally Separated" },
                { label: "Divorced", value: "Divorced" },
                { label: "Annulled", value: "Annulled" },
                { label: "Widow/er", value: "Widow/er" },
              ]}
              setOpen={setOpenCivilStatus}
              setValue={setCivilStatus}
              placeholder="Select Civil Status"
              containerStyle={{
                height: 50,
                width: "95%",
                margin: 10,
                zIndex: 1000,
              }}
              style={{
                backgroundColor: "white",
                borderColor: "black",
                borderWidth: 2,
                borderRadius: 15,
                zIndex: 1500,
              }}
              onPress={() => {
                setShow(false);
              }}
            />

            <TextInput
              style={styles.input}
              placeholder="Citizenship"
              placeholderTextColor={"black"}
              keyboardType="default"
              onChangeText={(value) => setCitizenShip(value)}
              onPress={() => {
                setShow(false);
              }}
            />

            <Text style={{ paddingLeft: 10, paddingRight: 10 }}>
              By submitting these details, we will receive an email confirming
              personal details. Please note that this process will take about
              5–7 working days.
            </Text>

            {loading ? (
              <ActivityIndicator size="large" color="#00a651" />
            ) : (
              <TouchableOpacity
                style={styles.submitButton}
                onPress={onSubmit}
                disabled={loading}
              >
                <Text style={styles.submitButtonText}>SUBMIT REQUEST</Text>
              </TouchableOpacity>
            )}
            <View style={{ width: "100%", height: 300 }} />
          </ScrollView>
        </TouchableWithoutFeedback>
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
