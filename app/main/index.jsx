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
import { useRouter } from "expo-router";
import WithdrawContent from "../../components/WithdrawContent";
import USDTAmountContent from "../../components/USDTAmountContent";
import IconButton from "../../components/IconButton";
import AutoCarousel from "../../components/AutoCarousel";
import { Colors } from "../../constants/Colors";

export default function Index() {
  const navigation = useNavigation();
  const router = useRouter();
  const width = Dimensions.get("window").width;

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
                  Hi! {data.firstName || "User"} {data.lastName || ""}
                </Text>
              </View>

              {/* Menu Button */}
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
                  }}
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
              <AmountContent walletAmount={data.timeDepositAmount || 0} />
              <USDTAmountContent usdtAmount={data.usdtAmount || 0} />
              <WithdrawContent withdrawAmount={data.walletAmount || 0} />
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
});
