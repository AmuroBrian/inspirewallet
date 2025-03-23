import React, { useEffect, useRef } from "react";
import { View, Animated, Image, Text, StyleSheet, Easing } from "react-native";

const LoadingScreen = () => {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnims = Array.from(
    { length: 8 },
    () => useRef(new Animated.Value(0)).current
  );
  const loadingText = "LOADING...";

  useEffect(() => {
    // Rotation Animation (Infinite Loop)
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Letter-by-letter fade-in animation
    fadeAnims.forEach((anim, index) => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: 1,
            duration: 500,
            delay: index * 150, // Delay for each letter
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    });
  }, []);

  // Rotation Interpolation
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      {/* Rotating Logo */}
      <Animated.Image
        source={require("../assets/images/loadinglogo.png")}
        style={[styles.logo, { transform: [{ rotate: rotateInterpolate }] }]}
      />

      {/* Animated "LOADING..." Text */}
      <View style={styles.textContainer}>
        {loadingText.split("").map((letter, index) => (
          <Animated.Text
            key={index}
            style={[styles.loadingText, { opacity: fadeAnims[index] }]}
          >
            {letter}
          </Animated.Text>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  logo: {
    width: 120,
    height: 120,
  },
  textContainer: {
    flexDirection: "row",
    marginTop: 20,
  },
  loadingText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    letterSpacing: 2,
  },
});

export default LoadingScreen;
