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
  getDocs,
  orderBy,
} from "firebase/firestore";
import { app } from "../configs/firebase"; // Adjust import path

const TransactionHistory = ({ userId }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const db = getFirestore(app);
        // Fetch from the user's subcollection
        const transactionsRef = collection(db, "users", userId, "transactions");
        const q = query(transactionsRef, orderBy("date", "desc"));
        const querySnapshot = await getDocs(q);

        // console.log("Query Snapshot:", querySnapshot); // Debug log

        const fetchedTransactions = [];
        querySnapshot.forEach((doc) => {
          // console.log("Fetched Document ID:", doc.id); // Debug log
          const data = doc.data();

          // Check if date field exists and is a timestamp
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

        // console.log("Fetched Transactions:", fetchedTransactions); // Debug log
        setTransactions(fetchedTransactions);
      } catch (err) {
        console.error("Error fetching transactions:", err); // Debug log
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchTransactions();
    }
  }, [userId]);

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text>Error: {error}</Text>;
  }

  return (
    <View style={styles.container}>
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
                ₱ {item.amount.toFixed(2)}
              </Text>
            </View>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    width: "100%",
    margin: 10,
  },
  transactionBox: {
    flexDirection: "row",
    backgroundColor: "#ddf6e1",
    borderRadius: 15,
    marginBottom: 10,
    padding: 5,
    alignItems: "center",
    height: 50,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  transactionItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionText: {
    fontSize: 15,
    color: "#00a651",
  },
});

export default TransactionHistory;