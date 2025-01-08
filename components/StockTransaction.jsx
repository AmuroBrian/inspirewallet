import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import {
  getFirestore,
  collection,
  query,
  onSnapshot,
  orderBy,
} from "firebase/firestore";
import { app } from "../configs/firebase"; // Adjust the import path if necessary
import { Colors } from "../constants/Colors";

export default function StockTransaction({ userId }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const db = getFirestore(app);
    const transactionsRef = collection(
      db,
      "users",
      userId,
      "stockTransactions"
    );
    const q = query(transactionsRef, orderBy("date", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedTransactions = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const date = data.date?.toDate
            ? data.date.toDate()
            : new Date(data.date);
          const amount =
            typeof data.amount === "number"
              ? data.amount
              : parseFloat(data.amount) || 0;

          fetchedTransactions.push({
            id: doc.id,
            type: data.type,
            date: date,
            amount: amount,
          });
        });
        setTransactions(fetchedTransactions);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching transactions:", err);
        setError(err.message);
        setLoading(false);
      }
    );

    // Cleanup subscription on component unmount
    return () => unsubscribe();
  }, [userId]);

  if (loading) {
    return <ActivityIndicator size="large" color="green" />;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text
        style={{
          fontSize: 25,
          width: "100%",
          textAlign: "center",
          fontWeight: "500",
          paddingBottom: 10,
        }}
      >
        Transaction History
      </Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.transactionBox}>
            <View style={styles.transactionItem}>
              <Text style={styles.transactionText}>{item.type}</Text>
            </View>
            <View style={styles.transactionItem}>
              <Text style={styles.transactionText}>
                {item.date.toLocaleDateString()}
              </Text>
            </View>
            <View style={styles.transactionItem}>
              <Text style={styles.transactionText}>
                PHP {item.amount.toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    width: "100%",
    margin: 10,
  },
  transactionBox: {
    flexDirection: "row",
    backgroundColor: Colors.newYearTheme.background,
    borderRadius: 15,
    marginBottom: 10,
    padding: 5,
    alignItems: "center",
    height: 50,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  transactionItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionText: {
    fontSize: 15,
    color: Colors.newYearTheme.text,
  },
});
