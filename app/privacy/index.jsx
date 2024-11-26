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
      headerTitle: "Privacy Policy",
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
            <Text style={{ fontSize: 20, fontWeight: "600" }}>
              Introduction
            </Text>
            {"\n\n"}
            We value your privacy. This policy explains how we collect, use, and
            protect your information when you use our app, "Investor Wallet."{" "}
            {"\n\n"}
            <Text style={styles.textbold}>What Information We Collect</Text>
            {"\n"}
            We collect the following types of data: {"\n"}- Personal
            Information: Your name, email address, and other details you
            provide. {"\n"}- Usage Data: Information like your device type, IP
            address, and how you use the app.{"\n\n"}
            <Text style={styles.textbold}>How We Use Your Information</Text>
            {"\n"}
            We use your information to: {"\n"}- Provide and improve our
            services.{"\n"} - Contact you with updates or important notices.
            {"\n"} - Monitor how the app is used to enhance performance.{"\n\n"}
            <Text style={styles.textbold}>Sharing Your Information</Text>
            {"\n"}
            We may share your data with:{"\n"} - Service providers who help us
            run the app.{"\n"} - Business partners or affiliates.{"\n"} -
            Authorities if required by law.{"\n\n"}
            <Text style={styles.textbold}>Data Security</Text>
            {"\n"}
            We take steps to protect your information, but no system is 100%
            secure. Always be cautious when sharing data online.{"\n\n"}
            <Text style={styles.textbold}>Children's Privacy</Text>
            {"\n"}We do not collect data from anyone under 13. If you believe
            your child has shared data with us, contact us to remove it.{"\n\n"}
            <Text style={styles.textbold}>Your Rights </Text>
            {"\n"}
            You can update or delete your personal data by logging into your
            account or contacting us.{"\n\n"}
            <Text style={styles.textbold}>Changes to This Policy </Text>
            {"\n"}
            We may update this policy. Check this page for the latest version.
            {"\n\n"}
            <Text style={styles.textbold}>Contact Us </Text>
            {"\n"}
            If you have any questions, email us at info@inspireholdings.ph.
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
