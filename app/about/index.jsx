import React, { useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  SafeAreaView,
  ScrollView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { useRouter, useNavigation } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Colors } from "../../constants/Colors";

export default function Index() {
  const navigation = useNavigation();
  const router = useRouter();

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "About Us",
      headerTitleStyle: {
        color: Colors.redTheme.background,
        fontSize: 20,
        fontWeight: "600",
      },
      headerLeft: () => (
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={Colors.redTheme.background}
          />
        </TouchableOpacity>
      ),
    });
  }, []);

  return (
    <ImageBackground
      source={require("../../assets/images/bg2.png")}
      style={styles.container}
    >
      <SafeAreaView style={styles.androidSafeArea}>
        <ScrollView contentContainerStyle={styles.scrollViewContent}>
          <View style={styles.contentContainer}>
            <Text style={styles.sectionTitle}>Our Company</Text>
            <Text style={styles.paragraph}>
              At Inspire Holdings Inc., we are a visionary financial and
              management company with a diverse portfolio of interests that span
              across construction and development, healthcare and
              pharmaceuticals, gaming and entertainment, agricultural trading,
              and specialized services. Serving both private and public sectors,
              we are dedicated to driving innovation, efficiency, and
              collaboration.
            </Text>

            <Text style={styles.sectionTitle}>Our Mission</Text>
            <Text style={styles.paragraph}>
              As a central financial hub, we operate under the Wealthy Clique
              Model, harmonizing our subsidiaries and affiliates to foster a
              cohesive ecosystem. Our mission is to deliver measurable impact on
              the lives of individuals while influencing positive shifts in
              global affairs. At the same time, we are committed to delivering
              substantial returns to our valued shareholders.
            </Text>

            <Text style={styles.sectionTitle}>Inspire Wallet</Text>
            <Text style={styles.paragraph}>
              Inspire Wallet, our flagship app for Inspire Investors, embodies
              this vision. Designed as your all-in-one financial companion,
              Inspire Wallet allows you to:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraph}>
                Stay on top of your investments
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraph}>Manage stocks</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraph}>Track withdrawals</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraph}>
                Keep a clear record of all your financial transactions
              </Text>
            </View>

            <Text style={styles.paragraph}>
              Whether you're a seasoned investor or just getting started, our
              app provides all the tools you need to manage your portfolio with
              ease and confidence.
            </Text>

            <Text style={styles.callToAction}>
              Join us at Inspire Holdings Inc., and together, let's shape a
              prosperous future. Download Inspire Wallet today and take control
              of your financial journey!
            </Text>
          </View>
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
    paddingTop: Platform.OS === "android" ? 80 : 0,
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  contentContainer: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 15,
    margin: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: Colors.redTheme.background,
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 12,
  },
  bulletPoint: {
    flexDirection: "row",
    marginBottom: 8,
    paddingLeft: 8,
  },
  bullet: {
    fontSize: 16,
    color: Colors.redTheme.background,
    marginRight: 8,
  },
  callToAction: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.redTheme.background,
    marginTop: 24,
    fontWeight: "500",
    textAlign: "center",
  },
});
