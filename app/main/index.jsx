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
  Modal,
  ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useNavigation } from "expo-router";
import { auth, firestore } from "../../configs/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import TimeDepositContent from "../../components/TimeDepositContent";
import { useRouter } from "expo-router";
import USDTAmountContent from "../../components/USDTAmountContent";
import IconButton from "../../components/IconButton";
import AutoCarousel from "../../components/AutoCarousel";
import { Colors } from "../../constants/Colors";
import DollarDepositContent from "../../components/DollarDepositContent";
import axios from "axios";
import { registerIndieID } from "native-notify";
import AsyncStorage from "@react-native-async-storage/async-storage";

const width = Dimensions.get("window").width;

export default function Index() {
  const navigation = useNavigation();
  const router = useRouter();

  registerIndieID(
    auth.currentUser.uid.toString(),
    28259,
    process.env.EXPO_PUBLIC_NATIVENOTIFY_API_KEY
  );

  // Sample navigation data
  const DATA = [
    {
      id: "1",
      title: "Balance",
      iconSource: require("../../assets/images/investmentprofile.png"),
      routeData: () => {
        router.push("availablebalance");
      },
    },
    {
      id: "2",
      title: "Agent",
      iconSource: require("../../assets/images/agentdashboard.png"),
      routeData: () => {
        router.push("agentdashboard");
      },
    },
    {
      id: "3",
      title: "Stockholder",
      iconSource: require("../../assets/images/stock.png"),
      routeData: () => {
        router.push("stockholder");
      },
    },
  ];

  const [data, setUserData] = useState({}); // State to hold user data

  // Fetch user data on component mount
  useEffect(() => {
    const user = auth.currentUser;
    AsyncStorage.setItem("userid", user.uid);
    if (user) {
      const userRef = doc(firestore, "users", user.uid);
      const unsubscribe = onSnapshot(
        userRef,
        (userDoc) => {
          if (userDoc.exists()) {
            setUserData(userDoc.data()); // Update state with user data
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

  // Set navigation options
  useEffect(() => {
    navigation.setOptions({
      headerShown: false,
      headerTitle: "Dashboard",
    });
  }, []);

  // Render individual navigation items
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
              {/* Display user greeting */}
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
                    fontSize: 20,
                    fontWeight: "900",
                    width: width,
                  }}
                >
                  Hi! {data.firstName || "User"} {data.lastName || ""}{" "}
                  {data.agentCode == 0 ? "" : data.agentCode || ""}
                </Text>
              </View>

              {/* Menu and Info Buttons */}
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "flex-end",
                  paddingBottom: 10,
                  paddingRight: 10,
                  width: "100%",
                  gap: 10,
                }}
              >
                <TouchableOpacity
                  style={styles.menuButton}
                  onPress={() => {
                    router.replace("settings");
                  }}
                >
                  <Text
                    style={{
                      color: Colors.newYearTheme.text,
                      fontWeight: "800",
                    }}
                  >
                    MENU
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Other Components */}
              <TimeDepositContent
                timeDepositAmount={data.timeDepositAmount || 0}
              />
              <DollarDepositContent
                dollarDepositAmount={data.dollarDepositAmount || 0}
              />
              <USDTAmountContent usdtAmount={data.cryptoBalances?.USDT || 0} />
            </View>
          }
          ListFooterComponent={
            <View style={{ width: "100%" }}>
              <AutoCarousel />
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={styles.hollowButton}
                  onPress={() => router.push("deposit")}
                >
                  <Text
                    style={{
                      color: "black",
                      fontWeight: "500",
                    }}
                  >
                    DEPOSIT
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.hollowButton}
                  onPress={() => router.push("withdraw")}
                >
                  <Text
                    style={{
                      color: "black",
                      fontWeight: "500",
                    }}
                  >
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
        <SafeAreaView style={styles.androidSafeArea} />
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
    backgroundColor: Colors.newYearTheme.background,
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
    backgroundColor: Colors.newYearTheme.background,
    borderRadius: 15,
    padding: 10,
    marginTop: 30,
    height: 40,
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  historyText: {
    fontSize: 15,
    textAlign: "center",
    color: Colors.newYearTheme.text,
    fontWeight: "500",
  },
  hollowButton: {
    flex: 1,
    height: 40,
    backgroundColor: "transparent",
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    margin: 5,
    borderColor: "black",
    borderWidth: 2,
  },
  menuButton: {
    backgroundColor: Colors.newYearTheme.background,
    justifyContent: "center",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    height: 40,
    width: width * 0.25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  modalText: {
    fontSize: 16,
    marginBottom: 15,
    lineHeight: 24,
  },
  closeButton: {
    backgroundColor: Colors.newYearTheme.background,
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  closeButtonText: {
    color: Colors.newYearTheme.text,
    fontSize: 16,
    fontWeight: "bold",
  },
});
