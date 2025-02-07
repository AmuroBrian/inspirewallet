import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  Platform,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";

export default function Index() {
  const navigation = useNavigation();
  const router = useRouter();
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "About Us",
      headerTransparent: true,
    });
  }, [navigation]);

  return (
    <ImageBackground
      source={require("../../assets/images/bg2.png")}
      style={styles.container}
    >
      <SafeAreaView style={styles.androidSafeArea}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <Text style={styles.text}>
            At Inspire Holdings Inc., we are a visionary financial and
            management company with a diverse portfolio of interests that span
            across construction and development, healthcare and pharmaceuticals,
            gaming and entertainment, agricultural trading, and specialized
            services. Serving both private and public sectors, we are dedicated
            to driving innovation, efficiency, and collaboration. {"\n\n"}
            As a central financial hub, we operate under the Wealthy Clique
            Model, harmonizing our subsidiaries and affiliates to foster a
            cohesive ecosystem. Our mission is to deliver measurable impact on
            the lives of individuals while influencing positive shifts in global
            affairs. At the same time, we are committed to delivering
            substantial returns to our valued shareholders. {"\n\n"}
            Investor Wallet, our flagship app for Inspire Investors, embodies
            this vision. Designed as your all-in-one financial companion,
            Investor Wallet allows you to stay on top of your investments,
            manage stocks, track withdrawals, and keep a clear record of all
            your financial transactions. Whether you're a seasoned investor or
            just getting started, our app provides all the tools you need to
            manage your portfolio with ease and confidence. {"\n\n"}
            Join us at Inspire Holdings Inc., and together, let's shape a
            prosperous future. Download Investor Wallet today and take control
            of your financial journey!
          </Text>
        </ScrollView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  androidSafeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 80 : 0,
  },
  scrollViewContent: {
    padding: 20,
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
  },
  textbold: {
    fontSize: 18,
    fontWeight: "600",
  },
});
