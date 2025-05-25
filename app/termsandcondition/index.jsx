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
      headerTitle: "Terms & Conditions",
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
            <Text style={styles.paragraph}>
              Welcome to Inspire Wallet. Please read these terms and conditions
              carefully before accessing, using, or obtaining any materials,
              information, products or services. By accessing the Inspire Wallet
              (collectively, "The app"), you agree to be bound by these terms
              and conditions ("Terms") and our Privacy Policy. In these Terms "
              we", "us", "our" and "Inspire Wallet" refers to Inspire Wallet,
              and"I", "you", and "your" refers to you, the user of our
              application.
            </Text>

            <Text style={styles.sectionTitle}>Eligibility</Text>
            <Text style={styles.paragraph}>
              You must be at least 18 years old and have the legal capacity to
              enter into contracts. By using our app, you represent that you
              meet the requirements. If you are located in a jurisdiction where
              investment services are restricted, you may not use the app.
            </Text>

            <Text style={styles.sectionTitle}>Account Registration</Text>
            <Text style={styles.paragraph}>
              To access the maximum capacity of the app, you must create an
              account. You agree to:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraph}>
                Provide accurate and complete information
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraph}>
                Maintain the security of your password
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraph}>
                In case of any unauthorized use of your account, kindly notify
                us immediately
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Services Provided</Text>
            <Text style={styles.paragraph}>
              Inspire Wallet tracks your stocks and investment and lets you
              monitor your money before and after withdrawal. Every transaction
              shall be made through email and not directly with the bank.
              Inspire Holdings, Inc. will process your transaction, not the app
              itself. The process could take approximately five (5) to seven (7)
              working days to reflect on your Inspire Wallet account.
            </Text>

            <Text style={styles.sectionTitle}>Fees and Charges</Text>
            <Text style={styles.paragraph}>
              Details about fees associated with transactions, account
              maintenance, and other services will be provided in-app and may
              change from time to time.
            </Text>

            <Text style={styles.sectionTitle}>User Responsibilities</Text>
            <Text style={styles.paragraph}>
              You agree to use the app for lawful purposes and to abide by all
              applicable laws and regulations. You are responsible for your
              account and investment decisions.
            </Text>

            <Text style={styles.sectionTitle}>Intellectual Property</Text>
            <Text style={styles.paragraph}>
              All content, trademarks, and software related to are owned by
              Inspire Holdings Inc. or its licensors. You are granted a limited,
              non-exclusive license to use the app for personal purposes.
            </Text>

            <Text style={styles.sectionTitle}>Privacy Policy</Text>
            <Text style={styles.paragraph}>
              Your use of the app is also governed by our Privacy Policy, which
              details how we collect, use, and protect your personal
              information. The app only collects data such as your name, email
              address and bank details.
            </Text>

            <Text style={styles.sectionTitle}>Changes to Terms</Text>
            <Text style={styles.paragraph}>
              We may modify these terms at any time. We will notify you of
              significant changes through the app or via email. Your continued
              use of the app after changes constitutes acceptance of the new
              terms.
            </Text>

            <Text style={styles.sectionTitle}>Contact Details</Text>
            <Text style={styles.paragraph}>
              For questions or concerns regarding these terms, please contact us
              at <Text style={styles.link}>inspireholdings 85963671</Text>
            </Text>

            <Text style={styles.agreement}>
              I hereby agree that I have read and fully understood the Terms and
              conditions and agree to be bound by the statements above.
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
  link: {
    color: Colors.redTheme.background,
    textDecorationLine: "underline",
  },
  agreement: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginTop: 24,
    fontStyle: "italic",
    fontWeight: "500",
  },
});
