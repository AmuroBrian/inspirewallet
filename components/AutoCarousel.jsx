import React, { useState, useEffect, useRef } from "react";
import { View, Image, StyleSheet, Animated, Dimensions } from "react-native";

const images = [
  require("../assets/images/xmasads.png"),
  require("../assets/images/mayaads.png"),
  require("../assets/images/bdoads.png"),
];

const AutoCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % images.length;
      Animated.timing(translateX, {
        toValue: -nextIndex * (screenWidth - 30),
        duration: 500,
        useNativeDriver: true,
      }).start();
      setCurrentIndex(nextIndex);
    }, 2000); // Scroll every 2 seconds

    return () => clearInterval(interval);
  }, [currentIndex, translateX, screenWidth]);

  return (
    <View style={styles.carouselContainer}>
      <Animated.View
        style={[
          styles.carouselImages,
          {
            width: images.length,
            transform: [{ translateX }],
          },
        ]}
      >
        {images.map((image, index) => (
          <Image key={index} source={image} style={styles.carouselImage} />
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
