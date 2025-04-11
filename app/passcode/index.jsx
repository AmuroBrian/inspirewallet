import { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
} from "react-native";
import { router, useNavigation } from "expo-router";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { Colors } from "../../constants/Colors";

const auth = getAuth();
const db = getFirestore();

export default function Passcode() {
  const [passcode, setPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState(null);
  const [currentPasscode, setCurrentPasscode] = useState(null);
  const [step, setStep] = useState("check"); // check, enterCurrent, enterNew, confirmNew
  const [modalVisible, setModalVisible] = useState(false);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const navigation = useNavigation();

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "PASSCODE SETUP",
    });

    checkExistingPasscode();
  }, []);

  const checkExistingPasscode = async () => {
    const user = auth.currentUser;
    if (!user) {
      console.error("User not authenticated.");
      setLoading(false);
      return;
    }

    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists() && userDoc.data().passcode) {
        setCurrentPasscode(userDoc.data().passcode);
        setStep("enterCurrent");
      } else {
        setStep("enterNew");
      }
    } catch (error) {
      console.error("Error checking passcode:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePasscodeToFirestore = async (newPasscode) => {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) {
      console.error("User not authenticated.");
      setLoading(false);
      return;
    }

    try {
      await setDoc(
        doc(db, "users", user.uid),
        { passcode: newPasscode },
        { merge: true }
      );
      console.log("Passcode saved successfully");
      setSuccessModalVisible(true);
      setStep("enterCurrent");
    } catch (error) {
      console.error("Error saving passcode:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = (value) => {
    if (value === "Del") {
      setPasscode(passcode.slice(0, -1));
    } else if (value === "✓") {
      if (passcode.length !== 4) {
        setErrorMessage("Passcode must be 4 digits.");
        setModalVisible(true);
        return;
      }

      if (step === "enterCurrent") {
        if (passcode === currentPasscode) {
          setStep("enterNew");
        } else {
          setErrorMessage("Incorrect passcode. Try again.");
          setModalVisible(true);
        }
        setPasscode("");
      } else if (step === "enterNew") {
        setConfirmPasscode(passcode);
        setStep("confirmNew");
        setPasscode("");
      } else if (step === "confirmNew") {
        if (passcode === confirmPasscode) {
          savePasscodeToFirestore(passcode);
        } else {
          setErrorMessage("Passcodes do not match. Try again.");
          setModalVisible(true);
          setStep("enterNew");
        }
        setPasscode("");
        setConfirmPasscode(null);
      }
    } else if (/^\d$/.test(value) && passcode.length < 4) {
      setPasscode(passcode + value);
    }
  };

  const renderButton = (value) => (
    <TouchableOpacity
      key={value}
      style={styles.button}
      onPress={() => handlePress(value)}
    >
      <Text style={styles.buttonText}>{value}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.instructionText}>
        {step === "enterCurrent"
          ? "Enter your current 4-digit passcode"
          : step === "enterNew"
          ? "Enter your new 4-digit passcode"
          : "Confirm your new 4-digit passcode"}
      </Text>
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Text style={styles.passcodeText}>{passcode.replace(/./g, "●")}</Text>
      )}

      <View style={styles.keypad}>
        <View style={styles.row}>{[1, 2, 3].map(renderButton)}</View>
        <View style={styles.row}>{[4, 5, 6].map(renderButton)}</View>
        <View style={styles.row}>{[7, 8, 9].map(renderButton)}</View>
        <View style={styles.row}>{["Del", 0, "✓"].map(renderButton)}</View>
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>{errorMessage}</Text>
            <TouchableOpacity
              onPress={() => setModalVisible(false)}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={successModalVisible}
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Passcode successfully changed!</Text>
            <TouchableOpacity
              onPress={() => {
                setSuccessModalVisible(false);
                router.push("/settings");
              }}
              style={styles.modalButton}
            >
              <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
  instructionText: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  passcodeText: {
    fontSize: 32,
    marginBottom: 20,
    letterSpacing: 10,
  },
  keypad: {
    justifyContent: "center",
    alignItems: "center",
  },
  row: {
    flexDirection: "row",
  },
  button: {
    width: 90,
    height: 90,
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
    backgroundColor: Colors.redTheme.background,
    borderRadius: 45,
  },
  buttonText: {
    fontSize: 28,
    color: "white",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: 300,
    padding: 20,
    backgroundColor: "white",
    borderRadius: 10,
    alignItems: "center",
  },
  modalText: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: "center",
  },
  modalButton: {
    width: "80%",
    backgroundColor: Colors.redTheme.background,
    padding: 10,
    borderRadius: 5,
  },
  modalButtonText: {
    color: "white",
    fontSize: 16,
    textAlign: "center",
  },
});
