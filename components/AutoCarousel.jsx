import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Image,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { useRouter } from "expo-router";

const images = [
  { src: require("../assets/images/womensmonth.png"), route: null },
  { src: require("../assets/images/mayaads.png"), route: "/maya" },
  { src: require("../assets/images/securitybank.png"), route: "/bdo" },
  { src: require("../assets/images/unionbank.png"), route: "/bdo" },
  { src: require("../assets/images/ctbc.png"), route: "/bdo" },
];

const AutoCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get("window").width;
  const router = useRouter();

  // Add a duplicate of the first image to the end for seamless looping
  const extendedImages = [...images, images[0]];

  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = currentIndex + 1;

      Animated.timing(translateX, {
        toValue: -nextIndex * (screenWidth - 30),
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Reset position when reaching the duplicated image
        if (nextIndex === extendedImages.length - 1) {
          translateX.setValue(0); // Instantly reset position
          setCurrentIndex(0); // Reset index to the original first image
        } else {
          setCurrentIndex(nextIndex);
        }
      });
    }, 5000); // Scroll every 5 seconds

    return () => clearInterval(interval);
  }, [currentIndex, translateX, screenWidth, extendedImages]);

  const handlePress = (route) => {
    if (route) {
      router.push(route);
    } else {
      console.log("Route not defined");
    }
  };

  return (
    <View style={styles.carouselContainer}>
      <Animated.View
        style={[
          styles.carouselImages,
          {
            width: extendedImages.length * (screenWidth - 30),
            transform: [{ translateX }],
          },
        ]}
      >
        {extendedImages.map((image, index) => (
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
    width: Dimensions.get("window").width,
    height: 120,
    overflow: "hidden",
    justifyContent: "center",
    padding: 0,
  },
  carouselImages: {
    flexDirection: "row",
    justifyContent: "flex-start",
    padding: 0,
    gap: 3,
  },
  carouselImage: {
    width: Dimensions.get("window").width - 30,
    height: 150,
    resizeMode: "contain",
  },
});

export default AutoCarousel;
