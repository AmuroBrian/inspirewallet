import { StyleSheet, Text, View } from "react-native";
import React from "react";

export default function WithdrawContent({
  withdrawAmount,
  dollarWithdrawAmount,
  cryptoWithdrawAmount,
}) {
  const formatCurrency = (value) => {
    const numberValue = Number(value);
    if (isNaN(numberValue)) {
      return "loading data...";
    }
  
    // Format number with commas and exactly two decimal places
    return numberValue.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
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
        Amount Wallet
      </Text>
      <Text
        style={{
          width: "100%",
          textAlign: "right",
          paddingRight: 10,
          fontSize: 20,
        }}
      >
        PHP {formatCurrency(withdrawAmount)}
      </Text>
      <Text
        style={{
          width: "100%",
          textAlign: "right",
          paddingRight: 10,
          fontSize: 20,
        }}
      >
        USD {formatCurrency(dollarWithdrawAmount)}
      </Text>
      <Text
        style={{
          width: "100%",
          textAlign: "right",
          paddingRight: 10,
          fontSize: 20,
        }}
      >
        USDT {formatCurrency(cryptoWithdrawAmount)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "auto",
    backgroundColor: "white",
    borderColor: "black",
    borderWidth: 2,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    padding: 10,
  },
});
