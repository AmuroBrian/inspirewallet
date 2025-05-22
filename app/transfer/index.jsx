import { StyleSheet, Text, View, Alert, Modal } from "react-native";
import React, { useState } from "react";
import { useNavigation, useRouter } from "expo-router";
import { useEffect } from "react";
import {
  ImageBackground,
  SafeAreaView,
  Platform,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Colors } from "../../constants/Colors";
import { auth, firestore } from "../../configs/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  addDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { send, EmailJSResponseStatus } from "@emailjs/react-native";
import LoadingScreen from "../../components/LoadingScreen";

export default function Transfer() {
  const navigation = useNavigation();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [showBalanceOptions, setShowBalanceOptions] = useState(false);
  const [selectedBalance, setSelectedBalance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "Transfer",
    });
  }, []);

  const handleTransfer = async () => {
    if (!email || !amount) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setShowBalanceOptions(true);
  };

  const sendTransferEmail = async (
    senderEmail,
    recipientEmail,
    amount,
    balanceType
  ) => {
    try {
      const senderDoc = await getDoc(
        doc(firestore, "users", auth.currentUser.uid)
      );
      const senderData = senderDoc.data();
      const senderName = `${senderData.firstName} ${senderData.lastName}`;

      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("emailAddress", "==", recipientEmail));
      const querySnapshot = await getDocs(q);
      const recipientData = querySnapshot.docs[0].data();
      const recipientName = `${recipientData.firstName} ${recipientData.lastName}`;

      const formattedBalanceType =
        balanceType === "available"
          ? "Available Balance Amount"
          : "Agent Wallet Amount";

      const emailParams = {
        from_email: senderEmail,
        to_email: recipientEmail,
        transfer_type: formattedBalanceType,
        date: new Date().toLocaleString(),
        amount: `$${parseFloat(amount).toFixed(2)}`,
        sender_name: senderName,
        recipient_name: recipientName,
        sender_first_name: senderData.firstName,
        sender_last_name: senderData.lastName,
        recipient_first_name: recipientData.firstName,
        recipient_last_name: recipientData.lastName,
      };

      await send(
        process.env.EXPO_PUBLIC_SERVICE_ID,
        process.env.EXPO_PUBLIC_TRANSFER_TEMPLATE_ID,
        emailParams,
        {
          publicKey: process.env.EXPO_PUBLIC_API_KEY,
        }
      );
    } catch (error) {
      throw error;
    }
  };

  const processTransfer = async (balanceType) => {
    try {
      setIsLoading(true);
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert("Error", "User not authenticated");
        return;
      }

      const usersRef = collection(firestore, "users");
      const q = query(usersRef, where("emailAddress", "==", email));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        Alert.alert("Error", "Recipient not found");
        return;
      }

      const recipientDoc = querySnapshot.docs[0];
      const recipientId = recipientDoc.id;
      const recipientData = recipientDoc.data();

      const senderDoc = await getDoc(doc(usersRef, currentUser.uid));
      const senderData = senderDoc.data();

      const transferAmount = parseFloat(amount);
      const balanceField =
        balanceType === "available"
          ? "availBalanceAmount"
          : "agentWalletAmount";

      if (senderData[balanceField] < transferAmount) {
        Alert.alert("Error", "Insufficient balance");
        return;
      }

      await updateDoc(doc(usersRef, currentUser.uid), {
        [balanceField]: senderData[balanceField] - transferAmount,
      });

      await updateDoc(doc(usersRef, recipientId), {
        availBalanceAmount: recipientData.availBalanceAmount + transferAmount,
      });

      const transactionData = {
        senderId: currentUser.uid,
        recipientId: recipientId,
        recipientEmail: email,
        amount: transferAmount,
        balanceType: balanceType,
        timestamp: new Date(),
        userId: currentUser.uid,
      };

      await addDoc(collection(firestore, "transactions"), transactionData);

      await sendTransferEmail(
        senderData.emailAddress,
        recipientData.emailAddress,
        transferAmount,
        balanceType
      );

      setShowBalanceOptions(false);
      Alert.alert("Success", "Transfer completed successfully");
      router.back();
    } catch (error) {
      Alert.alert("Error", "Transfer failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <ImageBackground
      source={require("../../assets/images/bg2.png")}
      style={styles.container}
    >
      <SafeAreaView style={styles.androidSafeArea} />
      <TextInput
        placeholder="Enter Email Address"
        style={styles.input}
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <TextInput
        placeholder="Enter Amount"
        style={styles.input}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />

      <TouchableOpacity style={styles.button} onPress={handleTransfer}>
        <Text style={styles.buttonText}>Transfer</Text>
      </TouchableOpacity>

      <Modal
        visible={showBalanceOptions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBalanceOptions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Select Balance Type</Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => processTransfer("available")}
            >
              <Text style={styles.buttonText}>Available Balance</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => processTransfer("agent")}
            >
              <Text style={styles.buttonText}>Agent Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.cancelButton]}
              onPress={() => setShowBalanceOptions(false)}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <SafeAreaView style={styles.androidSafeArea1} />
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
  androidSafeArea1: {
    paddingBottom: Platform.OS === "android" ? 20 : 0,
    opacity: 0,
  },
  input: {
    width: "90%",
    height: 50,
    borderWidth: 1,
    borderColor: "gray",
    borderRadius: 10,
    marginTop: 20,
    paddingHorizontal: 10,
    backgroundColor: "white",
  },
  button: {
    backgroundColor: Colors.redTheme.background,
    padding: 10,
    borderRadius: 10,
    marginTop: 20,
    width: "90%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
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
    marginBottom: 20,
    color: Colors.redTheme.background,
  },
  modalButton: {
    backgroundColor: Colors.redTheme.background,
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    width: "100%",
    height: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#666",
    marginTop: 20,
  },
});
