/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
  newYearTheme: {
    text: "#cc2135",
    // background: "#cc2135",
    background: "white",
  },
  redTheme: {
    text: "white",
    background: "#cc2135",
  },
  mayaTheme: {
    text: "#00a651",
    background: "#ddf6e1",
  },
  hollowButton: {
    color: "black",
    borderWidth: 2,
    borderColor: "black",
  },
};
