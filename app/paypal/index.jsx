import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  Linking,
} from "react-native";
import axios from "axios";

export default function Index() {
  const [amount, setAmount] = useState("");
  const [orderId, setOrderId] = useState(null);

  // Create order by calling backend
  const createOrder = async () => {
    try {
      const response = await axios.post("http://localhost:8080/create-order", {
        amount,
      });

      const { id, approvalUrl } = response.data;
      setOrderId(id); // Save order ID

      Alert.alert("Order Created", `Order ID: ${id}`);

      // Redirect to PayPal for approval
      if (approvalUrl) {
        Linking.openURL(approvalUrl); // Opens PayPal approval URL in the browser
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create order");
      console.log("Error: " + error);
    }
  };

  // Capture the payment after approval from PayPal
  const captureOrder = async () => {
    if (!orderId) {
      Alert.alert("Error", "No order ID available");
      return;
    }

    try {
      const response = await axios.post("http://localhost:8080/capture-order", {
        orderId,
      });
      Alert.alert("Payment Successful");
      console.log(JSON.stringify(response.data));
    } catch (error) {
      Alert.alert("Error", "Failed to capture payment");
      console.log("Capture error:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter Payment Amount (PHP):</Text>
      <TextInput
        style={styles.input}
        placeholder="Amount"
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <Button title="Pay with PayPal" onPress={createOrder} />
      {orderId && (
        <Button
          title="Capture Payment"
          onPress={captureOrder}
          disabled={!orderId}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20 },
  label: { fontSize: 18, marginBottom: 10 },
  input: { borderWidth: 1, padding: 10, marginBottom: 20, fontSize: 16 },
});
