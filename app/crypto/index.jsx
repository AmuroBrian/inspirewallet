import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Alert,
  Platform,
  ToastAndroid,
  ImageBackground,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  StatusBar,
  Animated,
  KeyboardAvoidingView,
} from "react-native";
import React, { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import Constants from "expo-constants";
import { auth, firestore } from "../../configs/firebase";
import {
  doc,
  onSnapshot,
  updateDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { useNavigation } from "expo-router";
import { Colors } from "../../constants/Colors";
import { Ionicons } from "@expo/vector-icons";

// Get API keys from environment variables
const CRYPTO_API_KEY = process.env.EXPO_PUBLIC_CRYPTO_API_KEY;

// Add Alpha Vantage API key
const ALPHA_VANTAGE_API_KEY = process.env.EXPO_PUBLIC_ALPHA_VANTAGE_API_KEY;

// Print API keys
console.log("API Keys:", {
  CRYPTO_API_KEY,
  ALPHA_VANTAGE_API_KEY,
});

// Create axios instances with default config
const cryptoApi = axios.create({
  baseURL: "https://min-api.cryptocompare.com/data",
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
    authorization: `Apikey ${CRYPTO_API_KEY}`,
  },
});

// Add forex API instance
const forexApi = axios.create({
  baseURL: "https://www.alphavantage.co/query",
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Cache configuration
const CACHE_DURATION = 60000; // 1 minute
let priceCache = {
  data: null,
  timestamp: 0,
};

// Add animation configuration
const CANDLE_ANIMATION_DURATION = 500; // 500ms for each candle animation
const LAST_CANDLE_ANIMATION_DURATION = 1000; // 1 second for the last candle pulse

// Add these helper functions at the top of the file
const calculateTrendLine = (data) => {
  const n = data.length;
  const xMean = (n - 1) / 2;
  const yMean = data.reduce((sum, y) => sum + y, 0) / n;

  let numerator = 0;
  let denominator = 0;

  data.forEach((y, x) => {
    numerator += (x - xMean) * (y - yMean);
    denominator += Math.pow(x - xMean, 2);
  });

  const slope = numerator / denominator;
  const intercept = yMean - slope * xMean;

  return data.map((_, x) => slope * x + intercept);
};

const calculateMovingAverage = (data, windowSize = 3) => {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - Math.floor(windowSize / 2));
    const end = Math.min(data.length, i + Math.floor(windowSize / 2) + 1);
    const window = data.slice(start, end);
    const average = window.reduce((sum, val) => sum + val, 0) / window.length;
    result.push(average);
  }
  return result;
};

const calculateOHLC = (data) => {
  const result = [];
  // Group data into periods (e.g., hourly)
  for (let i = 0; i < data.length; i++) {
    const currentPrice = data[i];
    const nextPrice = data[i + 1] || currentPrice;

    result.push({
      open: currentPrice,
      high: Math.max(currentPrice, nextPrice),
      low: Math.min(currentPrice, nextPrice),
      close: nextPrice,
      time: i,
    });
  }
  return result;
};

// Add a function to check if cache is valid
const isCacheValid = (timestamp) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

// Modify the ChartComponent to include proper animation initialization
const ChartComponent = React.memo(({ data, selectedCrypto }) => {
  const [animations, setAnimations] = useState([]);
  const [lastCandleAnimation] = useState(new Animated.Value(0));
  const [lastPrice, setLastPrice] = useState(null);
  const [isPriceIncreasing, setIsPriceIncreasing] = useState(true);

  // Initialize animations when data changes
  useEffect(() => {
    if (data?.datasets?.[0]?.data?.length > 0) {
      const newAnimations = data.datasets[0].data.map(
        () => new Animated.Value(0)
      );
      setAnimations(newAnimations);

      // Start animations
      newAnimations.forEach((anim, index) => {
        Animated.timing(anim, {
          toValue: 1,
          duration: CANDLE_ANIMATION_DURATION,
          delay: index * 100,
          useNativeDriver: true,
        }).start();
      });

      // Handle last candle animation
      const currentPrice =
        data.datasets[0].data[data.datasets[0].data.length - 1];
      if (lastPrice !== null) {
        setIsPriceIncreasing(currentPrice > lastPrice);
      }
      setLastPrice(currentPrice);

      // Start continuous animation for the last candle
      Animated.loop(
        Animated.sequence([
          Animated.timing(lastCandleAnimation, {
            toValue: 1,
            duration: LAST_CANDLE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(lastCandleAnimation, {
            toValue: 0,
            duration: LAST_CANDLE_ANIMATION_DURATION,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [data?.datasets?.[0]?.data]);

  const chartCalculations = useMemo(() => {
    if (!data?.datasets?.[0]?.data?.length) return null;

    const prices = data.datasets[0].data;
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceRange = Math.max(maxPrice - minPrice, 0.1);
    const padding = priceRange * 0.1;
    const paddedMinPrice = minPrice - padding;
    const paddedMaxPrice = maxPrice + padding;
    const paddedRange = paddedMaxPrice - paddedMinPrice;

    return {
      prices,
      maxPrice,
      minPrice,
      priceRange,
      paddedMinPrice,
      paddedMaxPrice,
      paddedRange,
    };
  }, [data?.datasets?.[0]?.data]);

  const ohlcData = useMemo(() => {
    if (!chartCalculations) return [];
    return calculateOHLC(chartCalculations.prices);
  }, [chartCalculations]);

  if (!chartCalculations || !animations.length) {
    return (
      <View style={styles.noDataContainer}>
        <Text style={styles.noDataText}>No price data available</Text>
      </View>
    );
  }

  const isForex = selectedCrypto === "USD" || selectedCrypto === "JPY";
  const currencySymbol = isForex ? "₱" : "$";

  // Fix the color logic
  const getCandleColor = (isBullish, isLastCandle = false) => {
    if (isLastCandle) {
      return isPriceIncreasing ? "#4CAF50" : "#f44336";
    }
    return isBullish ? "#4CAF50" : "#f44336";
  };

  return (
    <View style={styles.chartContainer}>
      <View style={styles.chartWrapper}>
        <View style={styles.yAxisContainer}>
          {[0, 1, 2, 3, 4].map((i) => {
            const price =
              chartCalculations.paddedMaxPrice -
              (i * chartCalculations.paddedRange) / 4;
            const isUSDT = selectedCrypto === "USDT";
            return (
              <Text key={i} style={styles.yAxisLabel}>
                {currencySymbol}
                {price.toLocaleString(undefined, {
                  minimumFractionDigits: isUSDT ? 4 : 2,
                  maximumFractionDigits: isUSDT ? 4 : 2,
                })}
              </Text>
            );
          })}
        </View>

        <View style={styles.chartArea}>
          {[0, 1, 2, 3, 4].map((i) => (
            <View
              key={`grid-${i}`}
              style={[styles.gridLine, { top: `${i * 25}%` }]}
            />
          ))}

          <View style={styles.chartContent}>
            {ohlcData.map((candle, index) => {
              if (!animations[index]) return null;

              const isLastCandle = index === ohlcData.length - 1;
              const isBullish = candle.close >= candle.open;
              const candleWidth = 6;
              const spacing = 4;
              const totalWidth = candleWidth + spacing;
              const xPosition = index * totalWidth;

              const highY = Math.max(
                0,
                Math.min(
                  100,
                  ((candle.high - chartCalculations.paddedMinPrice) /
                    chartCalculations.paddedRange) *
                    100
                )
              );
              const lowY = Math.max(
                0,
                Math.min(
                  100,
                  ((candle.low - chartCalculations.paddedMinPrice) /
                    chartCalculations.paddedRange) *
                    100
                )
              );
              const openY = Math.max(
                0,
                Math.min(
                  100,
                  ((candle.open - chartCalculations.paddedMinPrice) /
                    chartCalculations.paddedRange) *
                    100
                )
              );
              const closeY = Math.max(
                0,
                Math.min(
                  100,
                  ((candle.close - chartCalculations.paddedMinPrice) /
                    chartCalculations.paddedRange) *
                    100
                )
              );

              const candleColor = getCandleColor(isBullish, isLastCandle);

              return (
                <Animated.View
                  key={`candle-${index}`}
                  style={[
                    styles.candleContainer,
                    {
                      left: `${xPosition}%`,
                      width: `${candleWidth}%`,
                      opacity: animations[index],
                      transform: [
                        {
                          scaleY: animations[index].interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, 1],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.candleWick,
                      {
                        top: `${highY}%`,
                        height: `${lowY - highY}%`,
                        backgroundColor: candleColor,
                        ...(isLastCandle && {
                          borderWidth: 2,
                          borderColor: candleColor,
                          opacity: lastCandleAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1],
                          }),
                        }),
                      },
                    ]}
                  />
                  <Animated.View
                    style={[
                      styles.candleBody,
                      {
                        top: `${Math.min(openY, closeY)}%`,
                        height: `${Math.max(Math.abs(closeY - openY), 1)}%`,
                        backgroundColor: candleColor,
                        ...(isLastCandle && {
                          borderWidth: 2,
                          borderColor: candleColor,
                          opacity: lastCandleAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.5, 1],
                          }),
                        }),
                      },
                    ]}
                  />
                </Animated.View>
              );
            })}
          </View>
        </View>

        <View style={styles.xAxisContainer}>
          {data.labels.map((label, index) => (
            <Text key={index} style={styles.xAxisLabel}>
              {label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
});

const Crypto = () => {
  const navigation = useNavigation();
  const [selectedCrypto, setSelectedCrypto] = useState("BTC");
  const [price, setPrice] = useState(0);
  const [previousPrice, setPreviousPrice] = useState(0);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [timeRange, setTimeRange] = useState("1m");
  const [tradeHistory, setTradeHistory] = useState([]);
  const [priceChange, setPriceChange] = useState(0);
  const [cryptoBalances, setCryptoBalances] = useState({
    BTC: 0,
    ETH: 0,
    USDT: 0,
  });
  const [selectedType, setSelectedType] = useState("CRYPTO");
  const [selectedCurrency, setSelectedCurrency] = useState("USD");
  const [exchangeRates, setExchangeRates] = useState({
    USD: 0,
    JPY: 0,
  });
  const [currencyBalances, setCurrencyBalances] = useState({
    USD: 0,
    JPY: 0,
  });
  const [forexChartData, setForexChartData] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [forexPriceChange, setForexPriceChange] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);
  const [updateInterval, setUpdateInterval] = useState(null);

  const screenWidth = Dimensions.get("window").width;

  // Map of crypto symbols for CryptoCompare API
  const cryptoSymbols = {
    BTC: "BTC",
    ETH: "ETH",
    USDT: "USDT",
  };

  useEffect(() => {
    fetchCryptoData();
    fetchUserBalance();
    fetchCryptoBalances();
    fetchForexBalances();
    fetchForexRates();
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Trading",
      headerTransparent: true,
      headerLeft: () => (
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={Colors.redTheme.background}
          />
        </TouchableOpacity>
      ),
    });
  }, [selectedCrypto, timeRange, navigation]);

  const fetchUserBalance = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(firestore, "users", user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          const balanceAmount = parseFloat(userData.availBalanceAmount || 0);
          setBalance(balanceAmount);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      setError("Failed to fetch balance");
    }
  };

  const updateBalance = async (newBalance) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(firestore, "users", user.uid);
      await updateDoc(userDocRef, {
        availBalanceAmount: parseFloat(newBalance.toFixed(2)),
      });
    } catch (error) {
      throw error;
    }
  };

  const addTradeToHistory = async (tradeData) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      await addDoc(collection(firestore, "users", user.uid, "cryptoTrades"), {
        ...tradeData,
        timestamp: new Date(),
      });
    } catch (error) {
      throw error;
    }
  };

  const fetchCryptoData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchCryptoPrice(), fetchHistoricalData()]);
    } catch (error) {
      setError("Failed to fetch data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCryptoPrice = async () => {
    try {
      const now = Date.now();
      if (priceCache.data && isCacheValid(priceCache.timestamp)) {
        setPreviousPrice(price);
        setPrice(priceCache.data.USD);
        return;
      }

      const response = await cryptoApi.get(`/price`, {
        params: {
          fsym: cryptoSymbols[selectedCrypto],
          tsyms: "USD",
        },
      });

      if (!response.data || response.data.Response === "Error") {
        throw new Error(response.data?.Message || "API Error");
      }

      if (response.data.USD) {
        setPreviousPrice(price);
        setPrice(response.data.USD);
        priceCache = {
          data: response.data,
          timestamp: now,
        };
      } else {
        throw new Error("Invalid response format - USD price not found");
      }
    } catch (error) {
      setError(`Failed to fetch current price: ${error.message}`);
      throw error;
    }
  };

  // Add a useEffect to clear cache when crypto changes
  useEffect(() => {
    priceCache = {
      data: null,
      timestamp: 0,
    };
    fetchCryptoPrice();
  }, [selectedCrypto]);

  // Add a useEffect to periodically fetch new prices
  useEffect(() => {
    const fetchInterval = setInterval(() => {
      fetchCryptoPrice();
    }, 30000); // Fetch every 30 seconds

    return () => clearInterval(fetchInterval);
  }, [selectedCrypto]);

  const calculatePriceChange = (data) => {
    if (!data || data.length < 2) return 0;

    const firstPrice = data[0].close;
    const lastPrice = data[data.length - 1].close;
    const change = ((lastPrice - firstPrice) / firstPrice) * 100;

    return selectedCrypto === "USDT"
      ? Number(change.toFixed(4))
      : Number(change.toFixed(2));
  };

  const fetchHistoricalData = async () => {
    try {
      const limit = timeRange === "24h" ? 24 : timeRange === "7d" ? 7 : 30;
      const aggregate = timeRange === "24h" ? 1 : timeRange === "7d" ? 24 : 24;

      const response = await cryptoApi.get(`/v2/histohour`, {
        params: {
          fsym: cryptoSymbols[selectedCrypto],
          tsym: "USD",
          limit: limit,
          aggregate: aggregate,
        },
      });

      if (!response.data || response.data.Response === "Error") {
        throw new Error(response.data?.Message || "API Error");
      }

      if (response.data.Data && response.data.Data.Data) {
        const data = response.data.Data.Data;
        data.sort((a, b) => a.time - b.time);

        const change = calculatePriceChange(data);
        setPriceChange(change);

        const prices = data.map((item) => item.close);

        const labels = data.map((item) => {
          const date = new Date(item.time * 1000);
          if (timeRange === "24h") {
            return `${date.getHours()}:00`;
          } else if (timeRange === "7d") {
            return `${date.getDate()}/${date.getMonth() + 1}`;
          } else {
            return `${date.getDate()}/${date.getMonth() + 1}`;
          }
        });

        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const priceRange = Math.max(maxPrice - minPrice, 0.1);
        const paddedMinPrice = minPrice - priceRange * 0.1;
        const paddedMaxPrice = maxPrice + priceRange * 0.1;

        setChartData({
          labels,
          datasets: [
            {
              data: prices,
              minPrice: paddedMinPrice,
              maxPrice: paddedMaxPrice,
            },
          ],
        });
      }
    } catch (error) {
      setError(`Failed to fetch historical data: ${error.message}`);
    }
  };

  // Memoize price change calculation
  const priceChangeValue = useMemo(() => {
    if (!chartData.datasets[0].data.length) return 0;
    return calculatePriceChange(chartData.datasets[0].data);
  }, [chartData.datasets[0].data]);

  const fetchCryptoBalances = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(firestore, "users", user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setCryptoBalances({
            BTC: parseFloat(userData.cryptoBalances?.BTC || 0),
            ETH: parseFloat(userData.cryptoBalances?.ETH || 0),
            USDT: parseFloat(userData.cryptoBalances?.USDT || 0),
          });
        }
      });

      return () => unsubscribe();
    } catch (error) {
      setError("Failed to fetch crypto balances");
    }
  };

  const fetchForexRates = async () => {
    try {
      const response = await axios.get(
        "https://api.exchangerate-api.com/v4/latest/PHP"
      );
      if (response.data && response.data.rates) {
        setExchangeRates({
          USD: response.data.rates.USD,
          JPY: response.data.rates.JPY,
        });
      }
    } catch (error) {
      setError("Failed to fetch forex rates");
    }
  };

  // Add function to fetch forex historical data
  const fetchForexHistoricalData = async () => {
    try {
      const response = await forexApi.get("", {
        params: {
          function: "FX_DAILY",
          from_symbol: selectedCurrency,
          to_symbol: "PHP",
          apikey: ALPHA_VANTAGE_API_KEY,
          outputsize: timeRange === "30d" ? "full" : "compact",
        },
      });

      if (response.data["Error Message"]) {
        setError("API Error: " + response.data["Error Message"]);
        return;
      }

      const timeSeriesKey = "Time Series FX (Daily)";
      if (!response.data[timeSeriesKey]) {
        setError("Invalid data format received from API");
        return;
      }

      const timeSeriesData = response.data[timeSeriesKey];
      const dataPoints = Object.entries(timeSeriesData)
        .slice(0, timeRange === "24h" ? 1 : timeRange === "7d" ? 7 : 30)
        .reverse();

      if (dataPoints.length === 0) {
        setError("No historical data available");
        return;
      }

      const prices = dataPoints.map(([_, data]) => {
        const price = parseFloat(data["4. close"]);
        if (isNaN(price)) {
          return 0;
        }
        return price;
      });

      const labels = dataPoints.map(([date]) => {
        const d = new Date(date);
        return `${d.getDate()}/${d.getMonth() + 1}`;
      });

      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];
      const change = ((lastPrice - firstPrice) / firstPrice) * 100;
      setForexPriceChange(change);

      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const priceRange = Math.max(maxPrice - minPrice, 0.1);
      const paddedMinPrice = minPrice - priceRange * 0.1;
      const paddedMaxPrice = maxPrice + priceRange * 0.1;

      setForexChartData({
        labels,
        datasets: [
          {
            data: prices,
            minPrice: paddedMinPrice,
            maxPrice: paddedMaxPrice,
          },
        ],
      });
    } catch (error) {
      if (error.response) {
        setError(
          `API Error: ${error.response.data.message || "Unknown error"}`
        );
      } else if (error.request) {
        setError("No response received from API");
      } else {
        setError("Failed to fetch forex historical data");
      }
    }
  };

  // Modify useEffect to fetch forex data when needed
  useEffect(() => {
    if (selectedType === "FOREX") {
      fetchForexHistoricalData();
    }
  }, [selectedType, selectedCurrency, timeRange]);

  // Add function to fetch forex balances
  const fetchForexBalances = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(firestore, "users", user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const userData = doc.data();
          setCurrencyBalances({
            USD: parseFloat(userData.currencyBalances?.USD || 0),
            JPY: parseFloat(userData.currencyBalances?.JPY || 0),
          });
        }
      });

      return () => unsubscribe();
    } catch (error) {
      setError("Failed to fetch forex balances");
    }
  };

  const handleBuy = useCallback(async () => {
    const buyAmountPHP = parseFloat(amount);
    if (!buyAmountPHP || buyAmountPHP <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount in PHP");
      return;
    }

    if (buyAmountPHP > balance) {
      Alert.alert(
        "Insufficient Balance",
        `You need ₱${buyAmountPHP.toFixed(
          2
        )} but your balance is ₱${balance.toFixed(2)}`
      );
      return;
    }

    try {
      setLoading(true);
      const newBalance = balance - buyAmountPHP;

      if (selectedType === "CRYPTO") {
        const cryptoAmount = buyAmountPHP / price;
        const newCryptoBalance = cryptoBalances[selectedCrypto] + cryptoAmount;

        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(firestore, "users", user.uid);
          await updateDoc(userDocRef, {
            availBalanceAmount: parseFloat(newBalance.toFixed(2)),
            [`cryptoBalances.${selectedCrypto}`]: parseFloat(
              newCryptoBalance.toFixed(8)
            ),
          });
        }

        await addTradeToHistory({
          type: "BUY",
          asset: selectedCrypto,
          amount: cryptoAmount,
          amountPHP: buyAmountPHP,
          price: price,
          totalCost: buyAmountPHP,
        });

        setAmount("");
        if (Platform.OS === "android") {
          ToastAndroid.show(
            `Purchase successful! Bought ${cryptoAmount.toFixed(
              8
            )} ${selectedCrypto} for ₱${buyAmountPHP.toFixed(2)}`,
            ToastAndroid.SHORT
          );
        } else {
          Alert.alert(
            "Success",
            `Purchase successful! Bought ${cryptoAmount.toFixed(
              8
            )} ${selectedCrypto} for ₱${buyAmountPHP.toFixed(2)}`
          );
        }
      } else {
        const exchangeRate = exchangeRates[selectedCurrency];
        const foreignAmount = buyAmountPHP * exchangeRate;
        const newCurrencyBalance =
          (currencyBalances[selectedCurrency] || 0) + foreignAmount;

        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(firestore, "users", user.uid);
          await updateDoc(userDocRef, {
            availBalanceAmount: parseFloat(newBalance.toFixed(2)),
            [`currencyBalances.${selectedCurrency}`]: parseFloat(
              newCurrencyBalance.toFixed(2)
            ),
          });

          setCurrencyBalances((prev) => ({
            ...prev,
            [selectedCurrency]: parseFloat(newCurrencyBalance.toFixed(2)),
          }));
        }

        await addTradeToHistory({
          type: "BUY",
          asset: selectedCurrency,
          amount: foreignAmount,
          amountPHP: buyAmountPHP,
          rate: exchangeRate,
          totalCost: buyAmountPHP,
        });

        setAmount("");
        if (Platform.OS === "android") {
          ToastAndroid.show(
            `Purchase successful! Bought ${foreignAmount.toFixed(
              2
            )} ${selectedCurrency} for ₱${buyAmountPHP.toFixed(2)}`,
            ToastAndroid.SHORT
          );
        } else {
          Alert.alert(
            "Success",
            `Purchase successful! Bought ${foreignAmount.toFixed(
              2
            )} ${selectedCurrency} for ₱${buyAmountPHP.toFixed(2)}`
          );
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to complete purchase");
    } finally {
      setLoading(false);
    }
  }, [
    amount,
    balance,
    price,
    selectedCrypto,
    selectedType,
    selectedCurrency,
    exchangeRates,
    cryptoBalances,
    currencyBalances,
  ]);

  const handleSell = useCallback(async () => {
    const sellAmount = parseFloat(amount);
    if (!sellAmount || sellAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount to sell");
      return;
    }

    try {
      setLoading(true);

      if (selectedType === "CRYPTO") {
        if (sellAmount > cryptoBalances[selectedCrypto]) {
          Alert.alert(
            "Insufficient Balance",
            `You only have ${cryptoBalances[selectedCrypto].toFixed(
              8
            )} ${selectedCrypto}`
          );
          return;
        }

        const totalValuePHP = sellAmount * price;
        const newBalance = balance + totalValuePHP;
        const newCryptoBalance = cryptoBalances[selectedCrypto] - sellAmount;

        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(firestore, "users", user.uid);
          await updateDoc(userDocRef, {
            availBalanceAmount: parseFloat(newBalance.toFixed(2)),
            [`cryptoBalances.${selectedCrypto}`]: parseFloat(
              newCryptoBalance.toFixed(8)
            ),
          });
        }

        await addTradeToHistory({
          type: "SELL",
          asset: selectedCrypto,
          amount: sellAmount,
          price: price,
          totalValue: totalValuePHP,
        });

        setAmount("");
        if (Platform.OS === "android") {
          ToastAndroid.show(
            `Sale successful! Added ₱${totalValuePHP.toFixed(
              2
            )} to your balance`,
            ToastAndroid.SHORT
          );
        } else {
          Alert.alert(
            "Success",
            `Sale successful! Added ₱${totalValuePHP.toFixed(
              2
            )} to your balance`
          );
        }
      } else {
        if (sellAmount > (currencyBalances[selectedCurrency] || 0)) {
          Alert.alert(
            "Insufficient Balance",
            `You only have ${currencyBalances[selectedCurrency].toFixed(
              2
            )} ${selectedCurrency}`
          );
          return;
        }

        const exchangeRate = exchangeRates[selectedCurrency];
        const phpAmount = sellAmount / exchangeRate;
        const newBalance = balance + phpAmount;
        const newCurrencyBalance =
          (currencyBalances[selectedCurrency] || 0) - sellAmount;

        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(firestore, "users", user.uid);
          await updateDoc(userDocRef, {
            availBalanceAmount: parseFloat(newBalance.toFixed(2)),
            [`currencyBalances.${selectedCurrency}`]: parseFloat(
              newCurrencyBalance.toFixed(2)
            ),
          });

          setCurrencyBalances((prev) => ({
            ...prev,
            [selectedCurrency]: parseFloat(newCurrencyBalance.toFixed(2)),
          }));
        }

        await addTradeToHistory({
          type: "SELL",
          asset: selectedCurrency,
          amount: sellAmount,
          rate: exchangeRate,
          totalValue: phpAmount,
        });

        setAmount("");
        if (Platform.OS === "android") {
          ToastAndroid.show(
            `Sale successful! Added ₱${phpAmount.toFixed(2)} to your balance`,
            ToastAndroid.SHORT
          );
        } else {
          Alert.alert(
            "Success",
            `Sale successful! Added ₱${phpAmount.toFixed(2)} to your balance`
          );
        }
      }
    } catch (error) {
      Alert.alert("Error", "Failed to complete sale");
    } finally {
      setLoading(false);
    }
  }, [
    amount,
    balance,
    price,
    selectedCrypto,
    selectedType,
    selectedCurrency,
    exchangeRates,
    cryptoBalances,
    currencyBalances,
  ]);

  // Add function to fetch 1-minute data
  const fetchOneMinuteData = async () => {
    try {
      const response = await cryptoApi.get(`/v2/histominute`, {
        params: {
          fsym: cryptoSymbols[selectedCrypto],
          tsym: "USD",
          limit: 60, // Get last 60 minutes
          aggregate: 1,
        },
      });

      if (!response.data || response.data.Response === "Error") {
        throw new Error(response.data?.Message || "API Error");
      }

      if (response.data.Data && response.data.Data.Data) {
        const data = response.data.Data.Data;
        data.sort((a, b) => a.time - b.time);

        const change = calculatePriceChange(data);
        setPriceChange(change);

        const prices = data.map((item) => item.close);
        const labels = data.map((item) => {
          const date = new Date(item.time * 1000);
          return `${date.getHours()}:${date
            .getMinutes()
            .toString()
            .padStart(2, "0")}`;
        });

        setChartData({
          labels,
          datasets: [{ data: prices }],
        });
      }
    } catch (error) {
      setError(`Failed to fetch 1-minute data: ${error.message}`);
    }
  };

  // Add function to fetch 1-minute forex data
  const fetchOneMinuteForexData = async () => {
    try {
      const response = await forexApi.get("", {
        params: {
          function: "FX_INTRADAY",
          from_symbol: selectedCurrency,
          to_symbol: "PHP",
          interval: "1min",
          apikey: ALPHA_VANTAGE_API_KEY,
          outputsize: "compact",
        },
      });

      if (response.data["Error Message"]) {
        setError("API Error: " + response.data["Error Message"]);
        return;
      }

      const timeSeriesKey = "Time Series FX (1min)";
      if (!response.data[timeSeriesKey]) {
        setError("Invalid data format received from API");
        return;
      }

      const timeSeriesData = response.data[timeSeriesKey];
      const dataPoints = Object.entries(timeSeriesData)
        .slice(0, 60) // Get last 60 minutes
        .reverse();

      if (dataPoints.length === 0) {
        setError("No historical data available");
        return;
      }

      const prices = dataPoints.map(([_, data]) => {
        const price = parseFloat(data["4. close"]);
        if (isNaN(price)) {
          return 0;
        }
        return price;
      });

      const labels = dataPoints.map(([date]) => {
        const d = new Date(date);
        return `${d.getHours()}:${d.getMinutes().toString().padStart(2, "0")}`;
      });

      const firstPrice = prices[0];
      const lastPrice = prices[prices.length - 1];
      const change = ((lastPrice - firstPrice) / firstPrice) * 100;
      setForexPriceChange(change);

      setForexChartData({
        labels,
        datasets: [{ data: prices }],
      });
    } catch (error) {
      if (error.response) {
        setError(
          `API Error: ${error.response.data.message || "Unknown error"}`
        );
      } else if (error.request) {
        setError("No response received from API");
      } else {
        setError("Failed to fetch forex historical data");
      }
    }
  };

  // Modify useEffect to handle time range changes
  useEffect(() => {
    if (selectedType === "CRYPTO") {
      if (timeRange === "1m") {
        fetchOneMinuteData();
        const interval = setInterval(fetchOneMinuteData, 60000);
        setUpdateInterval(interval);
      } else {
        if (updateInterval) {
          clearInterval(updateInterval);
          setUpdateInterval(null);
        }
        fetchHistoricalData();
      }
    } else {
      // For forex, always use historical data
      if (updateInterval) {
        clearInterval(updateInterval);
        setUpdateInterval(null);
      }
      fetchForexHistoricalData();
    }

    return () => {
      if (updateInterval) {
        clearInterval(updateInterval);
      }
    };
  }, [timeRange, selectedCrypto, selectedType, selectedCurrency]);

  const renderError = () => {
    if (!error) return null;
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchCryptoData}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderInstructions = () => {
    return (
      <Modal
        visible={showInstructions}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInstructions(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Trading Instructions</Text>
              <TouchableOpacity
                onPress={() => setShowInstructions(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.instructionsContainer}>
              <View style={styles.instructionSection}>
                <Text style={styles.sectionTitle}>Crypto Trading</Text>
                <Text style={styles.instructionText}>
                  1. Select "Crypto" from the type selector
                </Text>
                <Text style={styles.instructionText}>
                  2. Choose your preferred cryptocurrency (BTC, ETH, or USDT)
                </Text>
                <Text style={styles.instructionText}>
                  3. To Buy:
                  {"\n"} • Enter the amount in PHP you want to spend
                  {"\n"} • Click "Buy" to purchase the selected crypto
                </Text>
                <Text style={styles.instructionText}>
                  4. To Sell:
                  {"\n"} • Enter the amount of crypto you want to sell
                  {"\n"} • Click "Sell" to convert to PHP
                </Text>
              </View>

              <View style={styles.instructionSection}>
                <Text style={styles.sectionTitle}>Forex Trading</Text>
                <Text style={styles.instructionText}>
                  1. Select "Forex" from the type selector
                </Text>
                <Text style={styles.instructionText}>
                  2. Choose your preferred currency (USD or JPY)
                </Text>
                <Text style={styles.instructionText}>
                  3. To Buy:
                  {"\n"} • Enter the amount in PHP you want to spend
                  {"\n"} • Click "Buy" to purchase the selected currency
                </Text>
                <Text style={styles.instructionText}>
                  4. To Sell:
                  {"\n"} • Enter the amount of currency you want to sell
                  {"\n"} • Click "Sell" to convert to PHP
                </Text>
              </View>

              <View style={styles.instructionSection}>
                <Text style={styles.sectionTitle}>General Tips</Text>
                <Text style={styles.instructionText}>
                  • Monitor price changes using the chart
                </Text>
                <Text style={styles.instructionText}>
                  • Use different time ranges (24h, 7d, 30d) to analyze trends
                </Text>
                <Text style={styles.instructionText}>
                  • Keep track of your balances in both crypto and forex
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  // Modify the timeRangeSelector to show different options for crypto and forex
  const renderTimeRangeSelector = () => {
    const timeRanges =
      selectedType === "CRYPTO"
        ? ["1m", "24h", "7d", "30d"]
        : ["24h", "7d", "30d"];

    return (
      <View style={styles.timeRangeSelector}>
        {timeRanges.map((range) => (
          <TouchableOpacity
            key={range}
            style={[
              styles.timeRangeButton,
              timeRange === range && styles.selectedTimeRange,
            ]}
            onPress={() => setTimeRange(range)}
          >
            <Text
              style={[
                styles.timeRangeText,
                timeRange === range && styles.selectedTimeRangeText,
              ]}
            >
              {range}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      <ImageBackground
        source={require("../../assets/images/bg2.png")}
        style={styles.container}
      >
        {renderInstructions()}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.keyboardAvoidingView}
          keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
        >
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={[
              styles.scrollViewContent,
              Platform.OS === "android" && { paddingBottom: 100 },
            ]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <Text style={styles.balanceText}>
                  Available Balance: ₱{balance.toFixed(2)}
                </Text>
                <TouchableOpacity
                  style={styles.instructionButton}
                  onPress={() => setShowInstructions(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="help-circle"
                    size={24}
                    color={Colors.redTheme.background}
                  />
                </TouchableOpacity>
              </View>
              <View style={styles.balancesContainer}>
                <View style={styles.cryptoBalancesContainer}>
                  <Text style={styles.balanceTitle}>Crypto Balances:</Text>
                  <Text style={styles.balanceText}>
                    BTC: {cryptoBalances.BTC.toFixed(8)}
                  </Text>
                  <Text style={styles.balanceText}>
                    ETH: {cryptoBalances.ETH.toFixed(8)}
                  </Text>
                  <Text style={styles.balanceText}>
                    USDT: {cryptoBalances.USDT.toFixed(8)}
                  </Text>
                </View>
                <View style={styles.currencyBalancesContainer}>
                  <Text style={styles.balanceTitle}>Forex Balances:</Text>
                  <Text style={styles.balanceText}>
                    USD: {currencyBalances.USD.toFixed(2)}
                  </Text>
                  <Text style={styles.balanceText}>
                    JPY: {currencyBalances.JPY.toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.typeSelector}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  selectedType === "CRYPTO" && styles.selectedType,
                ]}
                onPress={() => setSelectedType("CRYPTO")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    selectedType === "CRYPTO" && styles.selectedTypeText,
                  ]}
                >
                  Crypto
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  selectedType === "FOREX" && styles.selectedType,
                ]}
                onPress={() => setSelectedType("FOREX")}
              >
                <Text
                  style={[
                    styles.typeButtonText,
                    selectedType === "FOREX" && styles.selectedTypeText,
                  ]}
                >
                  Forex
                </Text>
              </TouchableOpacity>
            </View>

            {selectedType === "CRYPTO" ? (
              <View style={styles.cryptoSelector}>
                {["BTC", "ETH", "USDT"].map((crypto) => (
                  <TouchableOpacity
                    key={crypto}
                    style={[
                      styles.assetButton,
                      selectedCrypto === crypto && styles.selectedAsset,
                    ]}
                    onPress={() => setSelectedCrypto(crypto)}
                  >
                    <Text
                      style={[
                        styles.assetButtonText,
                        selectedCrypto === crypto && styles.selectedAssetText,
                      ]}
                    >
                      {crypto}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.currencySelector}>
                {["USD", "JPY"].map((currency) => (
                  <TouchableOpacity
                    key={currency}
                    style={[
                      styles.assetButton,
                      selectedCurrency === currency && styles.selectedAsset,
                    ]}
                    onPress={() => setSelectedCurrency(currency)}
                  >
                    <Text
                      style={[
                        styles.assetButtonText,
                        selectedCurrency === currency &&
                          styles.selectedAssetText,
                      ]}
                    >
                      {currency}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator
                  size="large"
                  color={Colors.redTheme.background}
                />
              </View>
            ) : (
              <>
                {renderError()}

                <View style={styles.priceContainer}>
                  {selectedType === "CRYPTO" ? (
                    <>
                      <Text style={styles.priceText}>
                        Current Price: 1 {selectedCrypto} = $
                        {price.toLocaleString(undefined, {
                          minimumFractionDigits:
                            selectedCrypto === "USDT" ? 4 : 2,
                          maximumFractionDigits:
                            selectedCrypto === "USDT" ? 4 : 2,
                        })}
                      </Text>
                      <Text
                        style={[
                          styles.priceChangeText,
                          { color: priceChange >= 0 ? "#4CAF50" : "#f44336" },
                        ]}
                      >
                        {priceChange >= 0 ? "↑" : "↓"}{" "}
                        {Math.abs(priceChange).toFixed(
                          selectedCrypto === "USDT" ? 4 : 2
                        )}
                        %
                        <Text style={styles.timeRangeText}> ({timeRange})</Text>
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.priceText}>
                        Current Rate: 1 {selectedCurrency} = ₱
                        {(1 / exchangeRates[selectedCurrency]).toFixed(2)}
                      </Text>
                      <Text style={styles.priceText}>
                        1 PHP = {exchangeRates[selectedCurrency].toFixed(4)}{" "}
                        {selectedCurrency}
                      </Text>
                      <Text
                        style={[
                          styles.priceChangeText,
                          {
                            color:
                              forexPriceChange >= 0 ? "#4CAF50" : "#f44336",
                          },
                        ]}
                      >
                        {forexPriceChange >= 0 ? "↑" : "↓"}{" "}
                        {Math.abs(forexPriceChange).toFixed(2)}%
                        <Text style={styles.timeRangeText}> ({timeRange})</Text>
                      </Text>
                    </>
                  )}
                </View>

                {selectedType === "CRYPTO" && (
                  <>
                    {renderTimeRangeSelector()}
                    {chartData.datasets[0].data.length > 0 && (
                      <ChartComponent
                        data={chartData}
                        selectedCrypto={selectedCrypto}
                      />
                    )}
                  </>
                )}

                {selectedType === "FOREX" && (
                  <>
                    {renderTimeRangeSelector()}
                    {forexChartData.datasets[0].data.length > 0 && (
                      <ChartComponent
                        data={forexChartData}
                        selectedCrypto={selectedCurrency}
                      />
                    )}
                  </>
                )}
              </>
            )}
          </ScrollView>

          <View
            style={[
              styles.tradingContainer,
              Platform.OS === "android" && styles.androidTradingContainer,
            ]}
          >
            <TextInput
              style={styles.input}
              placeholder={`Amount in ${
                selectedType === "CRYPTO" ? selectedCrypto : "PHP"
              }`}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              placeholderTextColor="#666"
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buyButton]}
                onPress={handleBuy}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Processing..." : "Buy"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.sellButton]}
                onPress={handleSell}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "Processing..." : "Sell"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ImageBackground>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  balanceText: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.redTheme.background,
  },
  balancesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  cryptoBalancesContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    marginRight: 5,
  },
  currencyBalancesContainer: {
    flex: 1,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 8,
    marginLeft: 5,
  },
  balanceTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: Colors.redTheme.background,
    marginBottom: 5,
  },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginTop: 10,
  },
  typeButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
    backgroundColor: "#f0f0f0",
  },
  selectedType: {
    backgroundColor: Colors.redTheme.background,
  },
  typeButtonText: {
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  selectedTypeText: {
    color: "#fff",
  },
  cryptoSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginTop: 10,
  },
  assetButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#f0f0f0",
  },
  selectedAsset: {
    backgroundColor: Colors.redTheme.background,
  },
  selectedAssetText: {
    color: "#fff",
  },
  assetButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
  },
  priceContainer: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginTop: 10,
  },
  priceText: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.redTheme.background,
  },
  priceChangeText: {
    fontSize: 18,
    marginTop: 5,
  },
  timeRangeSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginTop: 10,
  },
  timeRangeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: "#f0f0f0",
  },
  selectedTimeRange: {
    backgroundColor: Colors.redTheme.background,
  },
  selectedTimeRangeText: {
    color: "#fff",
  },
  timeRangeText: {
    fontSize: 14,
    color: "#666",
  },
  tradingContainer: {
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    width: "100%",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e0e0e0",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    color: "#333",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  buyButton: {
    backgroundColor: "#4CAF50",
  },
  sellButton: {
    backgroundColor: "#f44336",
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "bold",
  },
  loadingContainer: {
    padding: 20,
    alignItems: "center",
  },
  errorContainer: {
    padding: 20,
    backgroundColor: "#ffebee",
    margin: 10,
    borderRadius: 8,
  },
  errorText: {
    color: "#c62828",
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: "#c62828",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  chartContainer: {
    marginVertical: 10,
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: "hidden",
    height: 350,
  },
  chartWrapper: {
    height: 300,
    flexDirection: "row",
  },
  yAxisContainer: {
    width: 60,
    justifyContent: "space-between",
    paddingRight: 10,
  },
  yAxisLabel: {
    fontSize: 10,
    color: "#666",
    textAlign: "right",
  },
  chartArea: {
    flex: 1,
    position: "relative",
    height: "100%",
  },
  chartContent: {
    flex: 1,
    position: "relative",
    height: "100%",
    paddingHorizontal: 6,
    backgroundColor: "#fff",
  },
  gridLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#e0e0e0",
  },
  candleContainer: {
    position: "absolute",
    height: "100%",
    transformOrigin: "bottom",
  },
  candleWick: {
    position: "absolute",
    width: 2,
    left: "50%",
    transform: [{ translateX: -1 }],
  },
  candleBody: {
    position: "absolute",
    width: "100%",
    borderRadius: 2,
  },
  xAxisContainer: {
    position: "absolute",
    bottom: 0,
    left: 60,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  xAxisLabel: {
    fontSize: 10,
    color: "#666",
    transform: [{ rotate: "-45deg" }],
    width: 40,
    textAlign: "center",
  },
  noDataContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noDataText: {
    fontSize: 16,
    color: "#666",
  },
  currencySelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 10,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    marginTop: 10,
  },
  instructionButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: Colors.redTheme.background,
  },
  closeButton: {
    padding: 5,
  },
  instructionsContainer: {
    maxHeight: "100%",
  },
  instructionSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: Colors.redTheme.background,
    marginBottom: 10,
  },
  instructionText: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    lineHeight: 24,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  androidTradingContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
});

export default Crypto;
