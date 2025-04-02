import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  SafeAreaView,
  TouchableWithoutFeedback,
  ScrollView,
  Keyboard,
  TouchableOpacity,
  Platform,
  Alert,
  ToastAndroid,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter, useNavigation } from "expo-router";
import { auth, firestore } from "../../configs/firebase";
import {
  doc,
  onSnapshot,
  setDoc,
  addDoc,
  collection,
  getDoc, 
  updateDoc,
  getFirestore,
  getDocs

} from "firebase/firestore";
import InvestmentProfileButtons from "../../components/InvestmentProfileButtons";
import AmountContent from "../../components/TimeDepositContent";
import AvailBalanceContent from "../../components/AvailBalanceContent";
import TransactionHistory from "../../components/TransactionHistory";
import AutoCarousel from "../../components/AutoCarousel";
import CurrencyConverter from "../../components/CurrencyConverter";
import { Colors } from "../../constants/Colors";
import WithdrawContent from "../../components/WithdrawContent";
import rates from "../../assets/data/investmentRates.json";




export default function Index() {
  const navigation = useNavigation();
  const router = useRouter();
  const [data, setUserData] = useState({});
  const [userId, setUserId] = useState();
  const [walletAmount, setWalletAmount] = useState(0);
  const [availBalanceAmount, setAvailBalanceAmount] = useState(0); // Default to 0
  

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      setUserId(user.uid);

      // Real-time listener for user data
      const userDocRef = doc(firestore, "users", user.uid);
      const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        } else {
          Alert.alert("Error", "No user data found");
        }
      });

      return () => unsubscribeUser();
    }
  }, []);

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Available Balance",
      headerTransparent: true,
    });
  }, []);


  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
  
      if (!user) {
        console.error("No logged-in user found!");
        return;
      }
  
      const userId = user.uid;
      const db = firestore;
  
      try {
        // Fetch main user document
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
  
        if (!userSnap.exists()) {
          console.error("No document found for this user!");
          return;
        }
  
        const userData = userSnap.data();
        const timeDepositAmount = Number(userData.timeDepositAmount) || 0;
        console.log("Time Deposit Amount:", timeDepositAmount);
  
        // Fetch contractYear and initialDate from investmentProfiles
        const investmentProfilesRef = collection(db, "users", userId, "investmentProfiles");
        const investmentDocs = await getDocs(investmentProfilesRef);
  
        if (investmentDocs.empty) {
          console.error("No investment profile found for this user!");
          return;
        }
  
        let contractValue = null;
        let initialDate = null;
  
        investmentDocs.forEach(doc => {
          if (doc.exists()) {
            const data = doc.data();
            if (data.contractYear) contractValue = data.contractYear;
            if (data.initialDate) initialDate = data.initialDate.toDate(); // Convert Firestore Timestamp to Date
          }
        });
  
        if (!contractValue || !initialDate) {
          console.error("Missing contract details or InitialDate in investment profiles!");
          return;
        }
  
        console.log("Contract Value:", contractValue);
        console.log("Initial Date:", initialDate);
  
        if (![0.5, 1, 2].includes(contractValue)) {
          console.error(`Invalid contract year: ${contractValue}`);
          return;
        }
  
        // Mapping contractValue to corresponding key
        const contractMap = {
          0.5: "sixMonths",
          1: "oneYear",
          2: "twoYears",
        };
  
        const contractYear = contractMap[contractValue];
  
        if (!contractYear || !rates[contractYear]) {
          console.error(`Invalid contract year: ${contractYear} or no rates found`);
          return;
        }
  
        // Get interpolated interest rate
        const getInterpolatedRate = (amount, contractYear) => {
          const rateTable = rates[contractYear];
          const rateKeys = Object.keys(rateTable).map(Number).sort((a, b) => a - b);
  
          if (amount <= rateKeys[0]) return rateTable[rateKeys[0]]; // Use lowest rate
          if (amount >= rateKeys[rateKeys.length - 1]) return rateTable[rateKeys[rateKeys.length - 1]]; // Use highest rate
  
          // Find nearest lower and higher amounts
          let lowerAmount = rateKeys[0];
          let upperAmount = rateKeys[rateKeys.length - 1];
  
          for (let i = 0; i < rateKeys.length - 1; i++) {
            if (amount >= rateKeys[i] && amount <= rateKeys[i + 1]) {
              lowerAmount = rateKeys[i];
              upperAmount = rateKeys[i + 1];
              break;
            }
          }
  
          const lowerRate = rateTable[lowerAmount];
          const upperRate = rateTable[upperAmount];
  
          // Apply interpolation formula
          return lowerRate + ((amount - lowerAmount) / (upperAmount - lowerAmount)) * (upperRate - lowerRate);
        };
  
        const applicableRate = getInterpolatedRate(timeDepositAmount, contractYear);
  
        console.log("Applicable Rate:", applicableRate);
  
        // Compute interest after tax
        const interest = timeDepositAmount * (applicableRate / 100);
        const tax = interest * 0.2;
        const interestAfterTax = interest - tax;
  
        // Compute payout per 6-month period
        const contractMonths = contractValue * 12;
        const payoutPerPeriod = interestAfterTax / (contractMonths / 6);
  
        // Calculate how many payouts have been received
        const today = new Date();
        const monthsElapsed = Math.floor((today - initialDate) / (1000 * 60 * 60 * 24 * 30)); // Convert ms to months
        const payoutCount = Math.floor(monthsElapsed / 6); // Number of 6-month cycles
  
        console.log("Payouts Already Received:", payoutCount);
  
       // Compute total received payouts (walletAmount)
        const totalPayout = Math.round(payoutCount * payoutPerPeriod);

        // Compute total available balance (sum of total received + next payout)
        const availBalance = Math.round(totalPayout * payoutCount);

  
        console.log("Wallet Amount (Total Received Payouts):", totalPayout);
        console.log("Available Balance (Total Received + Next Payout):", availBalance);
  
        // Update Firestore
        await updateDoc(userRef, {
          walletAmount: totalPayout, // Total received payouts
          availBalanceAmount: availBalance, // Total received + next payout
        });
  
        // Update state
        setWalletAmount(totalPayout);
        setAvailBalanceAmount(availBalance);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
  
    fetchData();
  }, []);
  
  








  return (
    <ImageBackground
      source={require("../../assets/images/bg2.png")}
      style={styles.container}
    >
      <SafeAreaView style={styles.androidSafeArea} />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <ScrollView
          style={{ flex: 1, width: "100%" }}
          contentContainerStyle={{ alignItems: "center" }}
        >
          <View style={styles.mainContainer}>
            <WithdrawContent
              withdrawAmount={walletAmount}
              dollarWithdrawAmount={data.dollarWalletAmount || 0}
              cryptoWithdrawAmount={data.cryptoWalletAmount || 0}
            />
            <AvailBalanceContent
              availBalanceAmount={availBalanceAmount}
              dollarAvailBalanceAmount={data.dollarAvailBalanceAmount || 0}
              cryptoAvailBalanceAmount={data.cryptoAvailBalanceAmount || 0}
            />
            <View
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                overflow: "hidden",
              }}
            >
              <AutoCarousel />
            </View>
            <CurrencyConverter />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.buttonContainer}
                onPress={() => router.push("withdraw")}
              >
                <Text
                  style={{ color: Colors.newYearTheme.text, fontWeight: "500" }}
                >
                  WITHDRAW
                </Text>
              </TouchableOpacity>
            </View>
            <TransactionHistory userId={userId} />
          </View>
        </ScrollView>
      </TouchableWithoutFeedback>
      <SafeAreaView style={styles.androidSafeArea} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  mainContainer: {
    flex: 1,
    width: "100%",
    height: "100%",
    alignItems: "center",
    padding: 10,
  },
  transferButton: {
    margin: 10,
    width: "95%",
    backgroundColor: "#ddf6e1",
    height: 50,
    justifyContent: "center",
    borderRadius: 15,
  },
  transferText: {
    fontSize: 15,
    color: "#00a651",
    textAlign: "center",
  },
  androidSafeArea: {
    paddingTop: Platform.OS === "android" ? 80 : 0,
    opacity: 0,
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 25,
  },
  buttonContainer: {
    flex: 1,
    height: 40,
    backgroundColor: Colors.newYearTheme.background,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});
