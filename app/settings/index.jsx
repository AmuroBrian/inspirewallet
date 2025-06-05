import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Linking,
  ToastAndroid,
  Alert,
  Image,
} from "react-native";
import React from "react";
import { useRouter, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, firestore } from "../../configs/firebase";
import IconButton from "../../components/IconButton";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";
import { unregisterIndieDevice } from "native-notify";

export default function Index() {
  const navigation = useNavigation();
  const router = useRouter();

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
      title: "Transfer",
      iconSource: require("../../assets/images/transfer.png"),
      routeData: () => {
        router.push("/transfer");
      },
    },
    {
      id: "3",
      title: "Agent",
      iconSource: require("../../assets/images/agentdashboard.png"),
      routeData: () => {
        router.push("agentdashboard");
      },
    },
    {
      id: "4",
      title: "Stockholder",
      iconSource: require("../../assets/images/stock.png"),
      routeData: () => {
        router.push("stockholder");
      },
    },
    {
      id: "5",
      title: "Inspire Cards",
      iconSource: require("../../assets/images/card.png"),
      routeData: () => {
        router.push("inspirecards");
      },
    },
    {
      id: "6",
      title: "Maya",
      iconSource: require("../../assets/images/maya.png"),
      routeData: () => {
        router.push("maya");
      },
    },
    {
      id: "7",
      title: "Banking Service",
      iconSource: require("../../assets/images/finance.png"),
      routeData: () => {
        router.push("bdo");
      },
    },
    // {
    //   id: "7",
    //   title: "NFT",
    //   iconSource: require("../../assets/images/nft.png"),
    //   routeData: null,
    // },
    {
      id: "8",
      title: "Trading",
      iconSource: require("../../assets/images/crypto.png"),
      routeData: () => {
        router.push("crypto");
      },
    },
    // {
    //   id: "9",
    //   title: "FX Trading",
    //   iconSource: require("../../assets/images/fx.png"),
    //   routeData: null,
    // },
    {
      id: "9",
      title: "Events",
      iconSource: require("../../assets/images/event.png"),
      routeData: () => {
        router.push("events");
      },
    },
    {
      id: "10",
      title: "Travel Protection",
      iconSource: require("../../assets/images/travel.png"),
      routeData: () => {
        router.push("travel");
      },
    },
    {
      id: "11",
      title: "Privacy Policy",
      iconSource: require("../../assets/images/privacypolicy.png"),
      routeData: () => {
        router.push("privacy");
      },
    },
    {
      id: "12",
      title: "Passcode",
      iconSource: require("../../assets/images/passcode.png"),
      routeData: () => {
        router.push("passcode");
      },
    },
    {
      id: "13",
      title: "Terms & Conditions",
      iconSource: require("../../assets/images/termsandcondition.png"),
      routeData: () => {
        router.push("termsandcondition");
      },
    },
    {
      id: "14",
      title: "About Us",
      iconSource: require("../../assets/images/aboutus.png"),
      routeData: () => {
        router.push("about");
      },
    },
    {
      id: "15",
      title: "Help Center",
      iconSource: require("../../assets/images/helpcenter.png"),
      routeData: () => {
        router.push("helpcenter");
      },
    },
    {
      id: "16",
      title: "Test",
      iconSource: require("../../assets/images/helpcenter.png"),
      routeData: () => {
        router.push("test");
      },
    },
    {
      id: "17",
      title: "Test2",
      iconSource: require("../../assets/images/aboutus.png"),
      routeData: () => {
        router.push("test2");
      },
    },
    {
      id: "18",
      title: "Auto",
      iconSource: require("../../assets/images/helpcenter.png"),
      routeData: () => {
        router.push("investmentauto");
      },
    },
  ];

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Settings",
      headerTransparent: true,
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.replace("/main")}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={Colors.redTheme.background}
          />
        </TouchableOpacity>
      ),
    });
  }, []);

  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);

      router.replace("/");

      // Navigate to the login screen
      setTimeout(() => {
        router.replace("/"); // Adjust the path as needed
      }, 100);
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
    <ImageBackground
      source={require("../../assets/images/bg2.png")}
      style={styles.container}
    >
      <SafeAreaView style={styles.androidSafeArea} />
      <FlatList
        style={styles.list}
        data={DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        ListFooterComponent={() => (
          <View style={styles.footerContainer}>
            <TouchableOpacity
              style={styles.fullWidthButton}
              onPress={() => router.push("accountdeletion")}
            >
              <Text style={styles.fullWidthButtonText}>DELETE ACCOUNT</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.fullWidthButton}
              onPress={handleLogout}
            >
              <Text style={styles.fullWidthButtonText}>LOG OUT</Text>
            </TouchableOpacity>
          </View>
        )}
      />
      <SafeAreaView style={styles.androidSafeArea1} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  buttonContainer: {
    backgroundColor: "#ddf6e1",
    borderRadius: 25,
    margin: 5,
    justifyContent: "center",
    alignItems: "center",
    width: "95%",
    height: 40,
  },
  androidSafeArea: {
    paddingTop: Platform.OS === "android" ? 80 : 0,
    opacity: 0,
  },
  androidSafeArea1: {
    paddingBottom: Platform.OS === "android" ? 20 : 0,
    opacity: 0,
  },
  item: {
    flex: 1,
    margin: 5,
    alignItems: "center",
    justifyContent: "center",
    minWidth: Dimensions.get("window").width / 3.5,
  },
  list: {
    flex: 1,
    width: "100%",
    paddingHorizontal: 5,
  },
  soonBadge: {
    position: "absolute",
    top: 5,
    right: 5,
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
  footerContainer: {
    width: "100%",
    paddingHorizontal: 10,
    paddingVertical: 15,
    marginTop: 10,
  },
  fullWidthButton: {
    backgroundColor: "red",
    borderRadius: 25,
    marginVertical: 8,
    justifyContent: "center",
    alignItems: "center",
    width: "95%",
    height: 45,
    alignSelf: "center",
  },
  fullWidthButtonText: {
    color: "white",
    fontWeight: "800",
    fontSize: 14,
  },
});
