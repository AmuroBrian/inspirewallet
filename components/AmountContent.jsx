import { StyleSheet, Text, View } from "react-native";
import React from "react";

export default function AmountContent({ walletAmount }) {
  const formatCurrency = (value) => {
    const numberValue = Number(value);
    if (isNaN(numberValue)) {
      return "loading data...";
    }
    const numStr = numberValue.toString().replace(/,/g, "");
    const formattedStr = numStr.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return `PHP ${formattedStr}`;
  };
  return (
    <View style={styles.container}>
      <Text
        style={{
          textAlign: "left",
          width: "100%",
          paddingLeft: 10,
        }}
      >
        Time Deposit
      </Text>
      <Text
        style={{
          width: "100%",
          textAlign: "right",
          paddingRight: 10,
          fontSize: 20,
        }}
      >
        {formatCurrency(walletAmount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 70,
    backgroundColor: "white",
    borderColor: "black",
    borderWidth: 2,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
});