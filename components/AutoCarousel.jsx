import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";

const images = [
  { src: require("../assets/images/xmasads.png"), route: null }, // Set to null to simulate error
  { src: require("../assets/images/mayaads.png"), route: "/maya" },
  { src: require("../assets/images/bdoads.png"), route: "/bdo" },
];

const AutoCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
  const router = useRouter();

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      Animated.timing(translateX, {
        toValue: -nextIndex * (screenWidth - 30),
        duration: 500,
        useNativeDriver: true,
      }).start();
      setCurrentIndex(nextIndex);
    }, 5000); // Scroll every 2 seconds

    return () => clearInterval(interval);
  }, [currentIndex, translateX, screenWidth]);

  const handlePress = (route) => {
    try {
      if (!route) {
        throw new Error("Route not defined"); // Simulate an error for null routes
      }
      router.push(route);
    } catch (error) {
      console.log("XMAS");
    }
  };

  return (
    <View style={styles.carouselContainer}>
      <Animated.View
        style={[
          styles.carouselImages,
          {
            width: images.length * (screenWidth - 30),
            transform: [{ translateX }],
          },
        ]}
      >
        {images.map((image, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => handlePress(image.route)}
          >
            <Image source={image.src} style={styles.carouselImage} />
          </TouchableOpacity>
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  carouselContainer: {
    width: "100%",
    height: 120,
    overflow: "hidden",
    justifyContent: "center", // Vertically centers the images
    padding: 0,
  },
  carouselImages: {
    flexDirection: "row",
    justifyContent: "flex-start",
    padding: 0,
  },
  carouselImage: {
    width: Dimensions.get("window").width - 30, // Full width for each image
    height: 150, // Ensure the image matches the container height
    resizeMode: "contain", // Maintain aspect ratio without distortion
    margin: 0,
  },
});

export default AutoCarousel;
