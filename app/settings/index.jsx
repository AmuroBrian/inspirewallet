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
} from "react-native";
import React from "react";
import { useRouter, useNavigation } from "expo-router";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth, firestore } from "../../configs/firebase";
import IconButton from "../../components/IconButton";

export default function Index() {
  const navigation = useNavigation();
  const router = useRouter();
  // const openApp = async (url) => {
  //   try {
  //     const supported = await Linking.canOpenURL(url);
  //     if (supported) {
  //       await Linking.openURL(url);
  //     } else {
  //       if (Platform.OS === "ios") {
  //         Alert.alert(
  //           "Uninstalled App",
  //           "Please install the app before proceeding.",
  //           ["OK"]
  //         );
  //       } else if (Platform.OS === "android") {
  //         ToastAndroid.show("The app is not installed", ToastAndroid.SHORT);
  //       } else {
  //         console.log("Error Platform");
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error opening app:", error);
  //   }
  // };

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
    {
      id: "4",
      title: "Inspire Cards",
      iconSource: require("../../assets/images/card.png"),
      routeData: null,
    },
    {
      id: "5",
      title: "Maya",
      iconSource: require("../../assets/images/maya.png"),
      routeData: null,
    },
    {
      id: "6",
      title: "Gcash",
      iconSource: require("../../assets/images/gcash.png"),
      routeData: null,
    },
    {
      id: "7",
      title: "NFT",
      iconSource: require("../../assets/images/nft.png"),
      routeData: null,
    },
    {
      id: "8",
      title: "Crypto",
      iconSource: require("../../assets/images/crypto.png"),
      routeData: null,
    },
    {
      id: "9",
      title: "FX Trading",
      iconSource: require("../../assets/images/fx.png"),
      routeData: null,
    },
    {
      id: "10",
      title: "Events",
      iconSource: require("../../assets/images/event.png"),
      routeData: null,
    },
    {
      id: "11",
      title: "Travel",
      iconSource: require("../../assets/images/travel.png"),
      routeData: null,
    },
    {
      id: "12",
      title: "Privacy Policy",
      iconSource: require("../../assets/images/privacypolicy.png"),
      routeData: () => {
        router.push("privacy");
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
  ];

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Settings",
      headerTransparent: true,
    });
  }, []);

  const handleLogout = async () => {
    try {
      // Sign out from Firebase
      await signOut(auth);

      // Navigate to the login screen
      router.replace("/"); // Adjust the path as needsed
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
        numColumns={3} // Set the number of columns to 2
      />

      <TouchableOpacity
        style={{
          backgroundColor: "red",
          borderRadius: 25,
          margin: 5,
          justifyContent: "center",
          alignItems: "center",
          width: "95%",
          height: 40,
        }}
        onPress={() => router.push("accountdeletion")}
      >
        <Text
          style={{
            color: "white",
            fontWeight: "800",
          }}
        >
          DELETE ACCOUNT
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={{
          backgroundColor: "red",
          borderRadius: 25,
          margin: 5,
          justifyContent: "center",
          alignItems: "center",
          width: "95%",
          height: 40,
        }}
        onPress={handleLogout}
      >
        <Text
          style={{
            color: "white",
            fontWeight: "800",
          }}
        >
          LOG OUT
        </Text>
      </TouchableOpacity>

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
    flex: 1, // Allow the item to grow and fill space
    margin: 5, // Add some space around each item
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    flex: 1, // Ensure FlatList takes full height
    width: "95%",
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
});