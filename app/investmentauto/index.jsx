import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  SafeAreaView,
  TextInput,
  Platform,
  TouchableOpacity,
  Alert,
  ScrollView,
  Animated,
} from "react-native";
import React, { useState, useEffect, useRef } from "react";
import { Colors } from "../../constants/Colors";
import rates from "../../assets/data/investmentRates.json";
import * as Notifications from 'expo-notifications';
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import Collapsible from 'react-native-collapsible';

// Set up notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function Index() {
  const [amount, setAmount] = useState("");
  const [activeDeposits, setActiveDeposits] = useState([]);
  const [completedDeposits, setCompletedDeposits] = useState([]);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const navigation = useNavigation();
  const [expandedDeposits, setExpandedDeposits] = useState(new Set());
  const [expandedActiveDeposits, setExpandedActiveDeposits] = useState(new Set());
  const fadeAnims = useRef({}).current;

  // Add navigation header
  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTransparent: true,
      headerTitle: "Auto Investment",
      headerTitleStyle: {
        color: Colors.newYearTheme.text,
      },
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
  }, []);

  // Request notification permissions
  useEffect(() => {
    (async () => {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return;
        }
        
        setNotificationPermission(true);
      } catch (error) {
        console.log('Error getting notification permission:', error);
      }
    })();
  }, []);

  // Initialize fade animations for new deposits
  useEffect(() => {
    activeDeposits.forEach(deposit => {
      if (!fadeAnims[deposit.id]) {
        fadeAnims[deposit.id] = new Animated.Value(0);
        Animated.timing(fadeAnims[deposit.id], {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [activeDeposits]);

  const handleDeposit = () => {
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) < 50000) {
      alert('Please enter a valid amount (minimum ₱50,000)');
      return;
    }

    const depositAmount = parseFloat(amount);
    Alert.alert(
      "Time Deposit Started",
      `₱${depositAmount.toLocaleString()} will be locked for 24 minutes (4 cycles).\nYou will receive earnings every 6 minutes.\nThe full amount will be returned to your available balance after completion.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Proceed",
          onPress: () => {
            const rate = getInterestRate(depositAmount);
            const initialEarningsPerMinute = calculateEarningsPerMinute(depositAmount, rate);
            
            const newDeposit = {
              id: Date.now(),
              amount: depositAmount,
              totalEarned: 0,
              availableBalance: 0,
              startTime: getPHTNow(),
              interestRate: rate,
              isActive: true,
              lastTransferMinute: 0,
              totalAccumulatedEarnings: 0,
              elapsedTotalMinutes: 0,
              averageEarningPerMinute: initialEarningsPerMinute,
              cycleCount: 0,
            };

            setActiveDeposits(prev => [...prev, newDeposit]);
            setAmount(""); // Clear input for next deposit
          }
        }
      ]
    );
  };

  const handleStop = (depositId) => {
    setActiveDeposits(prev => 
      prev.map(deposit => 
        deposit.id === depositId 
          ? { ...deposit, isActive: false }
          : deposit
      )
    );
  };

  const handleReset = (depositId) => {
    setActiveDeposits(prev => prev.filter(deposit => deposit.id !== depositId));
  };

  const handleComplete = (deposit, finalNetEarnings) => {
    const completedDeposit = {
      ...deposit,
      endTime: new Date(),
      totalEarned: finalNetEarnings,
      isActive: false,
    };
    
    setCompletedDeposits(prev => [completedDeposit, ...prev]);
    setActiveDeposits(prev => prev.filter(d => d.id !== deposit.id));
  };

  useEffect(() => {
    const intervals = {};

    activeDeposits.forEach(deposit => {
      if (!deposit.isActive) return;

      const earningsPerMinute = calculateEarningsPerMinute(deposit.amount, deposit.interestRate);

      intervals[deposit.id] = setInterval(() => {
        const now = getPHTNow();
        const elapsedMinutes = Math.floor((now.getTime() - deposit.startTime.getTime()) / 60000);
        
        if (elapsedMinutes < 1) return;

        setActiveDeposits(prev => prev.map(d => {
          if (d.id !== deposit.id) return d;

          const earnedThisMinute = earningsPerMinute;
          const newTotalEarned = d.totalEarned + earnedThisMinute;
          const newTotalAccumulated = d.totalAccumulatedEarnings + earnedThisMinute;
          const newAverage = newTotalAccumulated / elapsedMinutes;

          let updatedDeposit = {
            ...d,
            totalEarned: newTotalEarned,
            totalAccumulatedEarnings: newTotalAccumulated,
            elapsedTotalMinutes: elapsedMinutes,
            averageEarningPerMinute: newAverage,
          };

          // Handle 6-minute transfer
          if (elapsedMinutes > 0 && elapsedMinutes % 6 === 0 && elapsedMinutes > d.lastTransferMinute) {
            const tax = newTotalEarned * 0.20;
            const netEarnings = newTotalEarned - tax;
            
            sendNotification(netEarnings, tax);
            
            updatedDeposit = {
              ...updatedDeposit,
              totalEarned: 0,
              availableBalance: d.availableBalance + netEarnings,
              lastTransferMinute: elapsedMinutes,
              cycleCount: d.cycleCount + 1,
            };

            // Handle completion
            if (updatedDeposit.cycleCount >= 4) {
              clearInterval(intervals[deposit.id]);
              const finalBalance = updatedDeposit.availableBalance + deposit.amount;
              
              Alert.alert(
                "Time Deposit Complete",
                `Your 4 cycles (24 minutes) of time deposit have been completed.\nYour deposit amount of ₱${deposit.amount.toLocaleString()} has been returned to your available balance.`,
                [{ text: "OK" }]
              );

              sendNotification(deposit.amount, 0);
              handleComplete(updatedDeposit, finalBalance);
              return null;
            }
          }

          return updatedDeposit;
        }).filter(Boolean));
      }, 60000);
    });

    return () => {
      Object.values(intervals).forEach(clearInterval);
    };
  }, [activeDeposits]);

  const getPHTNow = () => {
    const now = new Date();
    const options = {
      timeZone: 'Asia/Manila',
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    };
    const formatter = new Intl.DateTimeFormat('en-PH', options);
    const parts = formatter.formatToParts(now);
    let y, m, d, h, min, s;
    for (const part of parts) {
      if (part.type === 'year') y = part.value;
      if (part.type === 'month') m = part.value;
      if (part.type === 'day') d = part.value;
      if (part.type === 'hour') h = part.value;
      if (part.type === 'minute') min = part.value;
      if (part.type === 'second') s = part.value;
    }
    return new Date(`${y}-${m}-${d}T${h}:${min}:${s}`);
  };

  const getInterestRate = (investAmount) => {
    const rateTable = rates.sixMonths; // Using 6 months rate
    const rateKeys = Object.keys(rateTable).map(Number).sort((a, b) => a - b);
    
    if (investAmount <= rateKeys[0]) return rateTable[rateKeys[0]];
    if (investAmount >= rateKeys[rateKeys.length - 1])
      return rateTable[rateKeys[rateKeys.length - 1]];

    let lowerAmount = rateKeys[0];
    let upperAmount = rateKeys[rateKeys.length - 1];

    for (let i = 0; i < rateKeys.length - 1; i++) {
      if (investAmount >= rateKeys[i] && investAmount <= rateKeys[i + 1]) {
        lowerAmount = rateKeys[i];
        upperAmount = rateKeys[i + 1];
        break;
      }
    }

    const lowerRate = rateTable[lowerAmount];
    const upperRate = rateTable[upperAmount];

    return (
      lowerRate +
      ((investAmount - lowerAmount) / (upperAmount - lowerAmount)) *
        (upperRate - lowerRate)
    );
  };

  const calculateEarningsPerMinute = (principal, sixMonthRate) => {
    // Total minutes in 6 months (approximately)
    const totalMinutesInSixMonths = 262800; // 6 months * 30.5 days * 24 hours * 60 minutes
    
    // Convert 6-month rate to decimal
    const rateDecimal = sixMonthRate / 100;
    
    // Calculate total earnings for 6 months
    const totalEarnings = principal * rateDecimal;
    
    // Calculate earnings per minute
    return totalEarnings / totalMinutesInSixMonths;
  };

  // Function to send push notification
  const sendNotification = async (netEarnings, tax) => {
    try {
      if (!notificationPermission) return;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Earnings Transferred! 💰",
          body: `₱${netEarnings.toFixed(2)} has been transferred to your available balance.\nTax deducted: ₱${tax.toFixed(2)}`,
          sound: true,
          priority: Notifications.AndroidNotificationPriority.HIGH,
          vibrate: [0, 250, 250, 250],
        },
        trigger: null,
      });
    } catch (error) {
      console.log('Error sending notification:', error);
    }
  };

  const formatDateTime = (date) => {
    if (!date) return '';
    return date.toLocaleString('en-PH', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const toggleDepositExpand = (depositId) => {
    setExpandedDeposits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(depositId)) {
        newSet.delete(depositId);
      } else {
        newSet.add(depositId);
      }
      return newSet;
    });
  };

  const toggleActiveDepositExpand = (depositId) => {
    setExpandedActiveDeposits(prev => {
      const newSet = new Set(prev);
      if (newSet.has(depositId)) {
        newSet.delete(depositId);
      } else {
        newSet.add(depositId);
      }
      return newSet;
    });
  };

  return (
    <ImageBackground
      source={require("../../assets/images/bg2.png")}
      style={styles.container}
      imageStyle={styles.backgroundImage}
    >
      <SafeAreaView style={styles.androidSafeArea} />
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>New Time Deposit</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Enter Time Deposit Amount (min ₱50,000)"
                placeholderTextColor="rgba(0,0,0,0.5)"
                keyboardType="numeric"
                value={amount}
                onChangeText={setAmount}
              />
              <TouchableOpacity 
                style={[styles.depositButton, !amount ? styles.disabledButton : null]}
                onPress={handleDeposit}
                disabled={!amount}
              >
                <Ionicons name="wallet-outline" size={24} color={Colors.newYearTheme.text} />
                <Text style={styles.buttonText}>Start New Deposit</Text>
              </TouchableOpacity>
            </View>
          </View>

          {activeDeposits.map((deposit) => (
            <Animated.View 
              key={deposit.id} 
              style={[
                styles.depositCard,
                { opacity: fadeAnims[deposit.id] }
              ]}
            >
              <TouchableOpacity 
                style={styles.depositHeader}
                onPress={() => toggleActiveDepositExpand(deposit.id)}
                activeOpacity={0.7}
              >
                <View style={styles.depositHeaderContent}>
                  <View style={styles.depositTitleContainer}>
                    <Ionicons name="time-outline" size={24} color={Colors.newYearTheme.text} />
                    <Text style={styles.depositTitle}>Active Deposit</Text>
                  </View>
                  <Text style={styles.depositAmount}>₱{deposit.amount.toLocaleString()}</Text>
                </View>
                <View style={styles.headerRight}>
                  <View style={styles.cycleIndicator}>
                    <Text style={styles.cycleText}>Cycle {deposit.cycleCount}/4</Text>
                  </View>
                  <Ionicons 
                    name={expandedActiveDeposits.has(deposit.id) ? "chevron-up" : "chevron-down"} 
                    size={24} 
                    color={Colors.newYearTheme.text} 
                  />
                </View>
              </TouchableOpacity>

              <Collapsible collapsed={!expandedActiveDeposits.has(deposit.id)}>
                <View style={styles.depositDetails}>
                  <View style={styles.infoSection}>
                    <View style={styles.infoRow}>
                      <Ionicons name="calendar-outline" size={20} color={Colors.newYearTheme.text} />
                      <Text style={styles.infoLabel}>Start Time:</Text>
                      <Text style={styles.infoValue}>{formatDateTime(deposit.startTime)}</Text>
                    </View>

                    <View style={styles.infoRow}>
                      <Ionicons name="trending-up-outline" size={20} color={Colors.newYearTheme.text} />
                      <Text style={styles.infoLabel}>Interest Rate:</Text>
                      <Text style={styles.infoValue}>{deposit.interestRate?.toFixed(2)}% (6 months)</Text>
                    </View>
                  </View>

                  <View style={styles.earningsSection}>
                    <View style={styles.earningsRow}>
                      <View style={styles.earningsIconContainer}>
                        <Ionicons name="cash-outline" size={24} color={Colors.newYearTheme.text} />
                      </View>
                      <View style={styles.earningsContent}>
                        <Text style={styles.earningsLabel}>Current Earnings</Text>
                        <Text style={styles.earningsValue}>₱{deposit.totalEarned.toFixed(6)}</Text>
                      </View>
                    </View>

                    <View style={styles.earningsRow}>
                      <View style={styles.earningsIconContainer}>
                        <Ionicons name="wallet-outline" size={24} color={Colors.newYearTheme.text} />
                      </View>
                      <View style={styles.earningsContent}>
                        <Text style={styles.earningsLabel}>Available Balance</Text>
                        <Text style={styles.earningsValue}>₱{deposit.availableBalance.toFixed(2)}</Text>
                      </View>
                    </View>

                    <View style={styles.earningsRow}>
                      <View style={styles.earningsIconContainer}>
                        <Ionicons name="stats-chart-outline" size={24} color={Colors.newYearTheme.text} />
                      </View>
                      <View style={styles.earningsContent}>
                        <Text style={styles.earningsLabel}>Avg. Earning/Min</Text>
                        <Text style={styles.earningsValue}>₱{deposit.averageEarningPerMinute.toFixed(6)}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                      style={[styles.actionButton, styles.stopButton, !deposit.isActive ? styles.disabledButton : null]}
                      onPress={() => handleStop(deposit.id)}
                      disabled={!deposit.isActive}
                    >
                      <Ionicons name="stop-circle-outline" size={24} color={Colors.newYearTheme.text} />
                      <Text style={styles.buttonText}>Stop</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={[styles.actionButton, styles.resetButton]}
                      onPress={() => handleReset(deposit.id)}
                    >
                      <Ionicons name="refresh-outline" size={24} color={Colors.newYearTheme.text} />
                      <Text style={styles.buttonText}>Reset</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </Collapsible>
            </Animated.View>
          ))}

          {completedDeposits.length > 0 && (
            <View style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Completed Deposits</Text>
              </View>
              
              {completedDeposits.map((deposit) => (
                <View key={deposit.id} style={styles.historyItemContainer}>
                  <TouchableOpacity 
                    style={styles.historyItemHeader}
                    onPress={() => toggleDepositExpand(deposit.id)}
                  >
                    <View style={styles.historyHeaderContent}>
                      <Text style={styles.historyHeaderAmount}>
                        ₱{deposit.amount.toLocaleString()}
                      </Text>
                      <Text style={styles.historyHeaderDate}>
                        {formatDateTime(deposit.startTime)}
                      </Text>
                    </View>
                    <Ionicons 
                      name={expandedDeposits.has(deposit.id) ? "chevron-up" : "chevron-down"} 
                      size={24} 
                      color={Colors.newYearTheme.text} 
                    />
                  </TouchableOpacity>
                  
                  <Collapsible collapsed={!expandedDeposits.has(deposit.id)}>
                    <View style={styles.historyItemDetails}>
                      <View style={styles.historyRow}>
                        <Text style={styles.historyLabel}>Amount:</Text>
                        <Text style={styles.historyValue}>₱{deposit.amount.toLocaleString()}</Text>
                      </View>
                      <View style={styles.historyRow}>
                        <Text style={styles.historyLabel}>Start Time:</Text>
                        <Text style={styles.historyValue}>{formatDateTime(deposit.startTime)}</Text>
                      </View>
                      <View style={styles.historyRow}>
                        <Text style={styles.historyLabel}>End Time:</Text>
                        <Text style={styles.historyValue}>{formatDateTime(deposit.endTime)}</Text>
                      </View>
                      <View style={styles.historyRow}>
                        <Text style={styles.historyLabel}>Total Earned:</Text>
                        <Text style={styles.historyValue}>₱{deposit.totalEarned.toLocaleString()}</Text>
                      </View>
                      <View style={styles.historyRow}>
                        <Text style={styles.historyLabel}>Interest Rate:</Text>
                        <Text style={styles.historyValue}>{deposit.interestRate.toFixed(2)}%</Text>
                      </View>
                    </View>
                  </Collapsible>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
      <SafeAreaView style={styles.androidSafeArea} />
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.9,
  },
  androidSafeArea: {
    paddingTop: Platform.OS === "android" ? 80 : 0,
    opacity: 0,
  },
  content: {
    flex: 1,
    alignItems: "center",
    paddingTop: 20,
    padding: 20,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  card: {
    width: "95%",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333",
    marginBottom: 15,
  },
  inputContainer: {
    gap: 15,
  },
  input: {
    height: 55,
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 15,
    padding: 15,
    backgroundColor: "#f8f9fa",
    fontSize: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  depositButton: {
    flexDirection: 'row',
    backgroundColor: Colors.newYearTheme.background,
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  depositCard: {
    width: "95%",
    backgroundColor: Colors.newYearTheme.background,
    borderRadius: 20,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  depositHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  depositHeaderContent: {
    flex: 1,
    gap: 8,
  },
  depositTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  depositTitle: {
    color: Colors.newYearTheme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  depositAmount: {
    color: Colors.newYearTheme.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cycleIndicator: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  cycleText: {
    color: Colors.newYearTheme.text,
    fontSize: 12,
    fontWeight: '600',
  },
  depositDetails: {
    padding: 20,
    gap: 20,
  },
  infoSection: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 15,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoLabel: {
    color: Colors.newYearTheme.text,
    fontSize: 14,
    opacity: 0.9,
    flex: 1,
  },
  infoValue: {
    color: Colors.newYearTheme.text,
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  earningsSection: {
    gap: 15,
  },
  earningsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    padding: 15,
  },
  earningsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  earningsContent: {
    flex: 1,
  },
  earningsLabel: {
    color: Colors.newYearTheme.text,
    fontSize: 14,
    opacity: 0.9,
  },
  earningsValue: {
    color: Colors.newYearTheme.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    padding: 15,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  stopButton: {
    backgroundColor: "#d9534f",
  },
  resetButton: {
    backgroundColor: "#f0ad4e",
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: Colors.newYearTheme.text,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  historyCard: {
    width: "95%",
    backgroundColor: Colors.newYearTheme.background,
    borderRadius: 15,
    marginTop: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
  },
  historyHeader: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  historyTitle: {
    color: Colors.newYearTheme.text,
    fontSize: 18,
    fontWeight: '600',
  },
  historyItemContainer: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  historyHeaderContent: {
    flex: 1,
  },
  historyHeaderAmount: {
    color: Colors.newYearTheme.text,
    fontSize: 16,
    fontWeight: '600',
  },
  historyHeaderDate: {
    color: Colors.newYearTheme.text,
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
  },
  historyItemDetails: {
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  historyLabel: {
    color: Colors.newYearTheme.text,
    fontSize: 14,
    opacity: 0.8,
  },
  historyValue: {
    color: Colors.newYearTheme.text,
    fontSize: 14,
    fontWeight: '500',
  },
});
