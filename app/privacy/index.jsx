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
      headerTitle: "Privacy Policy",
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
            <Text style={styles.title}>Introduction</Text>
            <Text style={styles.paragraph}>
              We value your privacy. This policy explains how we collect, use,
              and protect your information when you use our app, "Investor
              Wallet."
            </Text>

            <Text style={styles.sectionTitle}>What Information We Collect</Text>
            <Text style={styles.paragraph}>
              We collect the following types of data:
            </Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraph}>
                Personal Information: Your name, email address, and other
                details you provide.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraph}>
                Usage Data: Information like your device type, IP address, and
                how you use the app.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>How We Use Your Information</Text>
            <Text style={styles.paragraph}>We use your information to:</Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraph}>
                Provide and improve our services.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraph}>
                Contact you with updates or important notices.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraph}>
                Monitor how the app is used to enhance performance.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Sharing Your Information</Text>
            <Text style={styles.paragraph}>We may share your data with:</Text>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraph}>
                Service providers who help us run the app.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraph}>
                Business partners or affiliates.
              </Text>
            </View>
            <View style={styles.bulletPoint}>
              <Text style={styles.bullet}>•</Text>
              <Text style={styles.paragraph}>
                Authorities if required by law.
              </Text>
            </View>

            <Text style={styles.sectionTitle}>Data Security</Text>
            <Text style={styles.paragraph}>
              We take steps to protect your information, but no system is 100%
              secure. Always be cautious when sharing data online.
            </Text>

            <Text style={styles.sectionTitle}>Children's Privacy</Text>
            <Text style={styles.paragraph}>
              We do not collect data from anyone under 13. If you believe your
              child has shared data with us, contact us to remove it.
            </Text>

            <Text style={styles.sectionTitle}>Your Rights</Text>
            <Text style={styles.paragraph}>
              You can update or delete your personal data by logging into your
              account or contacting us.
            </Text>

            <Text style={styles.sectionTitle}>Changes to This Policy</Text>
            <Text style={styles.paragraph}>
              We may update this policy. Check this page for the latest version.
            </Text>

            <Text style={styles.sectionTitle}>Contact Us</Text>
            <Text style={styles.paragraph}>
              If you have any questions, email us at{" "}
              <Text style={styles.link}>info@inspireholdings.ph</Text>
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
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: Colors.redTheme.background,
    marginBottom: 20,
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
});
