import {
  ImageBackground,
  StyleSheet,
  Text,
  View,
  SafeAreaView,
  Image,
  Alert,
  TouchableOpacity,
  Keyboard,
  TouchableWithoutFeedback,
  Platform,
  Dimensions,
  FlatList,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useNavigation } from "expo-router";
import { auth, firestore } from "../../configs/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import AmountContent from "../../components/AmountContent";
import StockContent from "../../components/StockContent";
import CurrencyConverter from "../../components/CurrencyConverter";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import WithdrawContent from "../../components/WithdrawContent";
import USDTAmountContent from "../../components/USDTAmountContent";
import IconButton from "../../components/IconButton";

export default function Index() {
  const navigation = useNavigation();
  const router = useRouter();
  const width = Dimensions.get("window").width;

  const DATA = [
    {
      id: "1",
      title: "Investment Profile",
      iconSource: require("../../assets/images/investmentprofile.png"),
      routeData: () => {
        router.push("investmentprofile");
      },
    },
    {
      id: "2",
      title: "Agent Dashboard",
      iconSource: require("../../assets/images/agentdashboard.png"),
      routeData: () => {
        router.push("agentdashboard");
      },
    },
    {
      id: "3",
      title: "Stockholder Dashboard",
      iconSource: require("../../assets/images/stock.png"),
      routeData: () => {
        router.push("stockholder");
      },
    },
  ];

  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      headerTitle: "Dashboard",
    });
  }, []);

  const [data, setUserData] = useState({});

  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userRef = doc(firestore, "users", user.uid);
      const unsubscribe = onSnapshot(
        userRef,
        (userDoc) => {
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            Alert.alert("Error", "No user data found");
          }
        },
        (error) => {
          Alert.alert("Error", error.message);
        }
      );

      return () => unsubscribe();
    }
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/"); // Adjust the path as needed
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <IconButton
        title={item.title}
        iconSource={item.iconSource}
        onPress={item.routeData}
      />
      {!item.routeData && (
        <View style={styles.soonBadge}>
          <Text style={styles.soonText}>SOON</Text>
        </View>
      )}
    </View>
  );

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <ImageBackground
        source={require("../../assets/images/bg2.png")}
        style={styles.container}
      >
        <SafeAreaView style={styles.androidSafeArea} />
        <FlatList
          data={DATA}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={3}
          style={styles.list}
          ListHeaderComponent={
            <View style={styles.mainContainer}>
              <View
                style={{
                  width: "100%",
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: 10,
                }}
              >
                <Text
                  style={{
                    alignSelf: "flex-start",
                    padding: 5,
                    fontSize: 25,
                    fontWeight: "900",
                    width: width,
                  }}
                >
                  Hi! {data.firstName} {data.lastName}
                </Text>
              </View>
              <View
                style={{
                  alignItems: "flex-end",
                  paddingBottom: 10,
                  paddingRight: 10,
                  width: "100%",
                }}
              >
                <TouchableOpacity
                  style={{
                    backgroundColor: "#ddf6e1",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: 10,
                    borderRadius: 10,
                    height: 40,
                    width: width * 0.25,
                  }}
                  onPress={() => {
                    router.push("settings");
                  }}
                >
                  <Text style={{ color: "#00a651", fontWeight: "800" }}>
                    MENU
                  </Text>
                </TouchableOpacity>
              </View>
              <AmountContent walletAmount={data.walletAmount} />
              <USDTAmountContent usdtAmount={data.usdtAmount} />
              <WithdrawContent withdrawAmount={data.withdrawAmount} />
            </View>
          }
          ListFooterComponent={
            <View style={{ width: "100%" }}>
              <CurrencyConverter />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.buttonContainer}
                  onPress={() => router.push("deposit")}
                >
                  <Text style={{ color: "#00a651", fontWeight: "500" }}>
                    DEPOSIT
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.buttonContainer}
                  onPress={() => router.push("withdraw")}
                >
                  <Text style={{ color: "#00a651", fontWeight: "500" }}>
                    WITHDRAW
                  </Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.historyButton}
                onPress={() => router.push("history")}
              >
                <Text style={styles.historyText}>TRANSACTION HISTORY</Text>
              </TouchableOpacity>
              <View style={{ height: 100 }} />
            </View>
          }
        />
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F6F0",
  },
  mainContainer: {
    width: "100%",
    alignItems: "center",
  },
  buttonRow: {
    flexDirection: "row",
    width: "100%",
    marginTop: 25,
  },
  buttonContainer: {
    flex: 1,
    height: 40,
    backgroundColor: "#ddf6e1",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
  },
  list: {
    width: "95%",
  },
  item: {
    flex: 1,
    margin: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  androidSafeArea: {
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  soonBadge: {
    position: "absolute",
    top: 5,
    right: -2,
    backgroundColor: "red",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  soonText: {
    color: "white",
    fontSize: 10,
    fontWeight: "bold",
  },
  historyButton: {
    width: "100%",
    backgroundColor: "#f4e7ff",
    borderRadius: 15,
    padding: 10,
    marginTop: 30,
    height: 40,
    justifyContent: "center",
  },
  historyText: {
    fontSize: 15,
    textAlign: "center",
    color: "black",
    fontWeight: "800",
  },
});
