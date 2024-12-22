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
      headerTitle: "Terms & Conditions",
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
            Welcome to Inspire Wallet. Please read these terms and conditions
            carefully before accessing, using, or obtaining any materials,
            information, products or services. By accessing the Inspire Wallet
            (collectively, “The app”), you agree to be bound by these terms and
            conditions (“Terms”) and our Privacy Policy. In these Terms “ we”,
            “us”, “our” and “Inspire Wallet” refers to Inspire Wallet, and”I”,
            “you”, and “your” refers to you, the user of our application.
            {"\n\n"}
            <Text style={styles.textbold}>Eligibility</Text>
            {"\n"}
            You must be at least 18 years old and have the legal capacity to
            enter into contracts. By using our app, you represent that you meet
            the requirements. If you are located in a jurisdiction where
            investment services are restricted, you may not use the app.
            {"\n"}
            <Text style={styles.textbold}>Account Registration</Text>
            {"\n"}
            To access the maximum capacity of the app, you must create an
            account. You agree to: Provide accurate and complete information;
            Maintain the security of your password; In case of any unauthorized
            use of your account, kindly notify us immediately.
            {"\n"}
            <Text style={styles.textbold}>Services Provided</Text>
            {"\n"}
            Inspire Wallet tracks your stocks and investment and lets you
            monitor your money before and after withdrawal. Every transaction
            shall be made through email and not directly with the bank. Inspire
            Holdings, Inc. will process your transaction, not the app itself.
            The process could take approximately five (5) to seven (7) working
            days to reflect on your Inspire Wallet account.
            {"\n"}
            <Text style={styles.textbold}>Fees and Charges</Text>
            {"\n"}
            Details about fees associated with transactions, account
            maintenance, and other services will be provided in-app and may
            change from time to time.
            {"\n"}
            <Text style={styles.textbold}>User Responsibilities</Text>
            {"\n"}
            You agree to use the app for lawful purposes and to abide by all
            applicable laws and regulations. You are responsible for your
            account and investment decisions.
            {"\n"}
            <Text style={styles.textbold}>Intellectual Property</Text>
            {"\n"}
            All content, trademarks, and software related to are owned by
            Inspire Holdings Inc. or its licensors. You are granted a limited,
            non-exclusive license to use the app for personal purposes.
            {"\n"}
            <Text style={styles.textbold}>Privacy Policy</Text>
            {"\n"}
            Your use of the app is also governed by our Privacy Policy, which
            details how we collect, use, and protect your personal information.
            The app only collects data such as your name, email address and bank
            details.
            {"\n"}
            <Text style={styles.textbold}>Changes to Terms</Text>
            {"\n"}
            We may modify these terms at any time. We will notify you of
            significant changes through the app or via email. Your continued use
            of the app after changes constitutes acceptance of the new terms.
            {"\n\n"}
            <Text style={styles.textbold}>Contact Details</Text>
            {"\n"}
            For questions or concerns regarding these terms, please contact us
            at inspireholdings 85963671 __ I hereby agree that I have read and
            fully understood the Terms and conditions and agree to be bound by
            the statements above.
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
