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
  ScrollView,
  ActivityIndicator,
  Image,
  Linking,
} from "react-native";
import { useNavigation, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { send, EmailJSResponseStatus } from "@emailjs/react-native";
import { getFirestore, doc, getDoc, onSnapshot } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import DropDownPicker from "react-native-dropdown-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Colors } from "../../constants/Colors";
import { launchImageLibrary } from "react-native-image-picker";
import {
  ref,
  getDownloadURL,
  uploadBytesResumable,
  uploadBytes,
} from "firebase/storage";
import { storage, auth } from "../../configs/firebase";
import axios from "axios";

export default function Index() {
  const navigation = useNavigation();
  const router = useRouter();
  const db = getFirestore();
  const [userData, setUserData] = useState({ firstName: "", lastName: "" });
  const [open, setOpen] = useState(false);
  const [openGender, setOpenGender] = useState(false);
  const [openCivilStatus, setOpenCivilStatus] = useState(false);
  const [type, setType] = useState(null);
  const [loading, setLoading] = useState(false); // Loading state
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [placeholderDate, setPlaceHolderDate] = useState("Enter Birthdate");
  const [placeholderStayInDate, setPlaceHolderStayInDate] =
    useState("Enter Stay In Date");
  const [placeholderArrivalTime, setPlaceHolderArrivalTime] =
    useState("Arrival Time");
  const [placeholderDepartureTime, setPlaceHolderDepartureTime] =
    useState("Departure Time");
  const [showStayIn, setShowStayIn] = useState(false);
  const [showArrivalTime, setShowArrivalTime] = useState(false);
  const [showDepartureTime, setShowDepartureTime] = useState(false);
  const [imageUri, setImageUri] = useState(null);
  const [imageGovtId, setImageGovtId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [userAmount, setUserAmount] = useState(0);
  const [amount, setAmount] = useState(0);
  const [approvalUrl, setApprovalUrl] = useState(null);
  const [transactionId, setTransactionId] = useState(null);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate;
    setDate(currentDate);
    setPlaceHolderDate("Birthdate: " + currentDate.toLocaleDateString());
  };

  const stayInOnChange = (event, selectedDate) => {
    const currentDate = selectedDate;
    setPlaceHolderStayInDate(currentDate.toLocaleDateString());
    setStartDateStayIn(currentDate);
  };

  const arrivalTimeOnChange = (event, selectedTime) => {
    const currentTime = selectedTime;
    setPlaceHolderArrivalTime(
      "Arrival Time: " +
        currentTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
    );
    setArrivalTime(currentTime);
  };

  const departureTimeOnChange = (event, selectedTime) => {
    const currentTime = selectedTime;
    setPlaceHolderDepartureTime(
      "Departure Time: " +
        currentTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
    );
    setDepartureTime(currentTime);
  };

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "Travel Protection",
    });
  }, []);

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(db, "users", user.uid); // Reference to the user's document
      const unsubscribe = onSnapshot(
        userRef,
        (userDoc) => {
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              firstName: data.firstName,
              lastName: data.lastName,
            });
            setUserAmount(data.timeDepositAmount); // Update state with time deposit amount
          } else {
            Alert.alert("Error", "No user data found");
          }
        },
        (error) => {
          Alert.alert("Error", error.message);
        }
      );

      // Cleanup function to unsubscribe from the listener
      return () => unsubscribe();
    }
  }, []);

  const selectImage = async () => {
    const options = {
      mediaType: "photo",
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.errorCode) {
        console.error("Image picker error:", response.errorMessage);
      } else {
        const uri = response.assets[0].uri;
        setImageUri(uri);
      }
    });
  };

  selectGovtImage = async () => {
    const options = {
      mediaType: "photo",
      maxWidth: 800,
      maxHeight: 800,
      quality: 0.8,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        console.log("User cancelled image picker");
      } else if (response.errorCode) {
        console.error("Image picker error:", response.errorMessage);
      } else {
        const uri = response.assets[0].uri;
        setImageGovtId(uri);
      }
    });
  };

  const uploadImage = async () => {
    if (!imageUri) {
      Alert.alert("Error", "Please select an image first.");
      setLoading(false);
      return;
    }

    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in to upload an image.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const storageRef = ref(
        storage,
        `gs://inspire-wallet.firebasestorage.app/passport/${
          auth.currentUser.uid
        }_${new Date()}.jpg`
      );
      console.log(storageRef);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      console.log("Image uploaded successfully:", downloadURL);
    } catch (error) {
      console.error("Error uploading image:", error);
      if (error.serverResponse) {
        console.error("Server response:", error.serverResponse);
      }
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const uploadGovtId = async () => {
    if (!imageGovtId) {
      Alert.alert("Error", "Please select an image first.");
      setLoading(false);
      return;
    }

    if (!auth.currentUser) {
      Alert.alert("Error", "You must be logged in to upload an image.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(imageGovtId);
      const blob = await response.blob();

      const storageRef = ref(
        storage,
        `gs://inspire-wallet.firebasestorage.app/governmentid/${
          auth.currentUser.uid
        }_${new Date()}.jpg`
      );
      console.log(storageRef);
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);

      console.log("Image uploaded successfully:", downloadURL);
    } catch (error) {
      console.error("Error uploading image:", error);
      if (error.serverResponse) {
        console.error("Server response:", error.serverResponse);
      }
      Alert.alert("Error", "Failed to upload image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userAmount > 0) {
      setAmount(625);
    } else {
      setAmount(1250);
    }
  }, [userAmount]);

  const [emailAddress, setEmailAddress] = useState();
  const [mobileNumber, setMobileNumber] = useState();
  const [landlineNumber, setLandlineNumber] = useState();
  const [address, setAddress] = useState();
  const [sourceFund, setSourceFund] = useState();
  const [grossIncome, setGrossIncome] = useState(0);
  const [gender, setGender] = useState();
  const [civilStatus, setCivilStatus] = useState("Single");
  const [citizenShip, setCitizenShip] = useState("Japanese");
  const [cashOnHand, setCashOnHand] = useState(0);
  const [stayInAddress, setStayInAddress] = useState();
  const [startDateStayIn, setStartDateStayIn] = useState(new Date());
  const [stayInDuration, setStayInDuration] = useState(0);
  const [airlineType, setAirlineType] = useState();
  const [departureTime, setDepartureTime] = useState(new Date());
  const [arrivalTime, setArrivalTime] = useState(new Date());
  const [passportNumber, setPassportNumber] = useState();
  const [purpose, setPurpose] = useState();
  const [isCaptureSuccessful, setIsCaptureSuccessful] = useState(false);

  const createOrder = async () => {
    try {
      const response = await axios.post(
        "https://elevated-agent-447620-i5.de.r.appspot.com/create-order",
        {
          amount,
        }
      );

      console.log("Amount:", amount);

      const { id, approvalUrl } = response.data;

      setOrderId(id); // Update the Order ID
      setApprovalUrl(approvalUrl); // Save the approval URL
    } catch (error) {
      Alert.alert("Error", "Failed to create order");
      console.log("Error: " + error);
    }
  };

  const captureOrder = async (id) => {
    try {
      const response = await axios.post(
        "https://elevated-agent-447620-i5.de.r.appspot.com/capture-order",
        {
          orderId: id,
        }
      );
      const { transactionId } = response.data;
      setTransactionId(transactionId);
      setIsCaptureSuccessful(true);
      uploadImage();
      uploadGovtId();
    } catch (error) {
      Alert.alert("Error", "Failed to capture payment");
      console.log("Capture error:", error);
      setLoading(false);
    }
  };

  // useEffect to handle actions when orderId is updated
  useEffect(() => {
    if (orderId && approvalUrl) {
      console.log("Order ID updated:", orderId);

      // Show confirmation alert when order ID is updated
      Alert.alert(
        "Order Created",
        "Please click CONFIRM to confirm the payment",
        [
          {
            text: "CONFIRM",
            onPress: () => captureOrder(orderId),
          },
        ]
      );

      // Open approval URL in the browser
      Linking.openURL(approvalUrl);
    }
  }, [orderId, approvalUrl]);

  useEffect(() => {
    const onProcessSubmission = async () => {
      if (orderId) {
        setLoading(false);
        try {
          await send(
            process.env.EXPO_PUBLIC_SERVICE_ID,
            process.env.EXPO_PUBLIC_TEMPLATE_ID,
            {
              emailAddress,
              message: `Type: Travel Protection\nName: ${userData.firstName} ${userData.lastName}\nEmail Address: ${emailAddress}\nLandline Number: ${landlineNumber}\nGender: ${gender}\nBirthdate: ${date}\nAddress: ${address}\nSource of Fund: ${sourceFund}\nGross Monthly Income: ${grossIncome}\nCivil Status: ${civilStatus}\nCitizenship: ${citizenShip}\nCash On Hand: ${cashOnHand}\nStay In Address: ${stayInAddress}\nStay Date: ${startDateStayIn}\nStay In Duration: ${stayInDuration}\nAirline Type: ${airlineType}\nArrival Time: ${arrivalTime}\nDeparture Time: ${departureTime}\nPassport Number: ${passportNumber}\nPurpose: ${purpose}\nTransaction ID: ${transactionId}`,
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
          router.back();
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
      }
    };
    onProcessSubmission();
  }, [isCaptureSuccessful]);

  const onSubmit = async () => {
    setShow(false);
    setShowStayIn(false);
    setShowArrivalTime(false);
    setShowDepartureTime(false);
    if (
      !emailAddress ||
      !mobileNumber ||
      !address ||
      !sourceFund ||
      !grossIncome ||
      !citizenShip ||
      !cashOnHand ||
      !stayInAddress ||
      !startDateStayIn ||
      !stayInDuration ||
      !airlineType ||
      !arrivalTime ||
      !departureTime ||
      !passportNumber ||
      !purpose
    ) {
      if (Platform.OS === "ios") {
        Alert.alert(
          "Submit Error",
          "Please fill in all fields before submitting.",
          ["OK"]
        );
      } else if (Platform.OS === "android") {
        ToastAndroid.show("Please fill in all fields.", ToastAndroid.SHORT);
      }
      return; // Exit the function if validation fails
    }

    setLoading(true); // Start loading
    createOrder();
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
              Please fill up the following form in order to request to subscribe
              the Travel Protection.
            </Text>

            {/* TextInput Fields */}
            <TextInput
              style={styles.input}
              placeholder="Enter Email Address"
              placeholderTextColor={"black"}
              keyboardType="email-address"
              onChangeText={(value) => setEmailAddress(value)}
              onPress={() => {
                setShow(false);
                setShowStayIn(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
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
                setShowStayIn(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
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
                setShowStayIn(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
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
                setShowStayIn(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
              }}
            />

            <TextInput
              style={styles.input}
              placeholder={placeholderDate}
              placeholderTextColor={"black"}
              onPress={() => {
                console.log("Pressed");
                setShow(true);
                setShowStayIn(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
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
              style={styles.addressInput}
              placeholder="Enter Address"
              placeholderTextColor={"black"}
              keyboardType="default"
              multiline
              textAlignVertical="top"
              onChangeText={(value) => setAddress(value)}
              onPress={() => {
                setShow(false);
                setShowStayIn(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
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
                setShowStayIn(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
              }}
            />
            <TextInput
              style={styles.input}
              placeholder="Gross Monthly Income"
              placeholderTextColor={"black"}
              keyboardType="number-pad"
              onChangeText={(value) => setGrossIncome(value)}
              onPress={() => {
                setShow(false);
                setShowStayIn(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
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
                setShowStayIn(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
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
                setShowStayIn(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
              }}
            />

            <TextInput
              style={styles.input}
              placeholder="Cash On Hand"
              placeholderTextColor={"black"}
              keyboardType="number-pad"
              onChangeText={(value) => setCashOnHand(value)}
              onPress={() => {
                setShow(false);
                setShowStayIn(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
              }}
            />

            <TextInput
              style={styles.addressInput}
              placeholder="Stay In Address"
              placeholderTextColor={"black"}
              keyboardType="default"
              multiline
              textAlignVertical="top"
              onChangeText={(value) => setStayInAddress(value)}
              onPress={() => {
                setShow(false);
                setShowStayIn(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
              }}
            />

            <TextInput
              style={styles.input}
              placeholder={placeholderStayInDate}
              placeholderTextColor={"black"}
              onPress={() => {
                console.log("Pressed");
                setShowStayIn(true);
                setShow(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
              }}
            />

            {showStayIn && (
              <DateTimePicker
                testID="dateTimePicker"
                value={startDateStayIn}
                mode={"date"}
                is24Hour={true}
                onChange={stayInOnChange}
                display="compact"
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Duration to Stay in Days"
              placeholderTextColor={"black"}
              keyboardType="number-pad"
              onChangeText={(value) => setStayInDuration(value)}
              onPress={() => {
                setShow(false);
                setShowStayIn(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
              }}
            />

            <TextInput
              style={styles.input}
              placeholder="Airline Type"
              placeholderTextColor={"black"}
              keyboardType="default"
              onChangeText={(value) => setAirlineType(value)}
              onPress={() => {
                setShow(false);
                setShowStayIn(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
              }}
            />

            <TextInput
              style={styles.input}
              placeholder={placeholderDepartureTime}
              placeholderTextColor={"black"}
              onPress={() => {
                console.log("Pressed");
                setShowStayIn(false);
                setShow(false);
                setShowArrivalTime(false);
                setShowDepartureTime(true);
              }}
            />

            {showDepartureTime && (
              <DateTimePicker
                testID="dateTimePicker"
                value={departureTime}
                mode={"time"}
                is24Hour={false}
                onChange={departureTimeOnChange}
                display="compact"
              />
            )}

            <TextInput
              style={styles.input}
              placeholder={placeholderArrivalTime}
              placeholderTextColor={"black"}
              onPress={() => {
                console.log("Pressed");
                setShowStayIn(false);
                setShow(false);
                setShowArrivalTime(true);
                setShowDepartureTime(false);
              }}
            />

            {showArrivalTime && (
              <DateTimePicker
                testID="dateTimePicker"
                value={arrivalTime}
                mode={"time"}
                is24Hour={false}
                onChange={arrivalTimeOnChange}
                display="compact"
              />
            )}

            <TextInput
              style={styles.input}
              placeholder="Passport Number"
              placeholderTextColor={"black"}
              keyboardType="default"
              onChangeText={(value) => setPassportNumber(value)}
              onPress={() => {
                setShow(false);
                setShowStayIn(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
              }}
            />

            <TextInput
              style={styles.addressInput}
              placeholder="Purpose"
              placeholderTextColor={"black"}
              keyboardType="default"
              multiline
              textAlignVertical="top"
              onChangeText={(value) => setPurpose(value)}
              onPress={() => {
                setShow(false);
                setShowStayIn(false);
                setShowArrivalTime(false);
                setShowDepartureTime(false);
              }}
            />

            <TouchableOpacity style={styles.uploadButton} onPress={selectImage}>
              {imageUri ? (
                // Display the selected image
                <Image source={{ uri: imageUri }} style={styles.image} />
              ) : (
                // Default text when no image is selected
                <Text style={styles.uploadText}>Upload Passport</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadButton}
              onPress={selectGovtImage}
            >
              {imageGovtId ? (
                // Display the selected image
                <Image source={{ uri: imageGovtId }} style={styles.image} />
              ) : (
                // Default text when no image is selected
                <Text style={styles.uploadText}>Upload Government ID</Text>
              )}
            </TouchableOpacity>

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
  addressInput: {
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
  uploadButton: {
    width: "95%",
    height: 150,
    margin: 10,
    borderColor: "black",
    borderWidth: 2,
    borderRadius: 25,
    borderStyle: "dashed",
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
  },
  uploadText: {
    color: "black",
    fontSize: 25,
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    borderRadius: 25,
    resizeMode: "stretch",
  },
});
