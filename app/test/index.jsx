import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ImageBackground,
  SafeAreaView,
  TouchableWithoutFeedback,
  Keyboard,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function TenMinuteCompoundInterest() {
  const navigation = useNavigation();
  const [initialDeposit, setInitialDeposit] = useState('');
  const [currentValue, setCurrentValue] = useState(0);
  const [timeElapsed, setTimeElapsed] = useState({ minutes: 0, seconds: 0 });
  const [running, setRunning] = useState(false);
  const [totalGrowth, setTotalGrowth] = useState(0);
  const [reinvestmentHistory, setReinvestmentHistory] = useState([]);
  const [cycleCount, setCycleCount] = useState(0);
  const [yearCount, setYearCount] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

  // Financial parameters
  const ANNUAL_RATE = 0.14; // 14% annual
  const TOTAL_SECONDS = 720; // 12 minutes = 720 seconds
  const TAX_RATE = 0.20; // 20% tax on profits

  // Check if current time is a valid withdrawal period
  const isValidWithdrawalTime = () => {
    const totalMinutes = timeElapsed.minutes;

    if (totalMinutes === 0){
      return false;
    }

    return totalMinutes % 6 === 0 || (totalMinutes % 6 === 1 && timeElapsed.seconds === 0);
  };

  const handleWithdrawal = () => {
    const canWithdraw = isValidWithdrawalTime();
    const currentPeriod = timeElapsed.minutes % 6 === 0 ? Math.floor(timeElapsed.minutes / 6) * 6 : 0;
    const yearText = yearCount > 0 ? ` (Year ${yearCount + 1})` : '';
    const withdrawalPhase = yearCount > 0 && timeElapsed.minutes === 0 ? 'start of new year' : `${currentPeriod} month mark`;
    
    const totalGrowthAmount = reinvestmentHistory.reduce((sum, item) => sum + item.growth, 0) + (currentValue - parseFloat(initialDeposit));
    const taxAmount = totalGrowthAmount * TAX_RATE;
    const netGrowthAfterTax = totalGrowthAmount * (1 - TAX_RATE);
    
    Alert.alert(
      canWithdraw ? "Withdrawal" : "⚠️ Early/Late Withdrawal Warning",
      canWithdraw 
        ? `Are you sure you want to withdraw?\n\nGross Growth: ${formatMoney(totalGrowthAmount)}\nTax (20%): ${formatMoney(taxAmount)}\nNet Growth: ${formatMoney(netGrowthAfterTax)}`
        : yearCount === 0 && timeElapsed.minutes === 0
          ? "WARNING: No growth available yet."
          : timeElapsed.minutes < 6 && timeElapsed.minutes > 0
            ? "WARNING: Please wait for the 6-month mark to withdraw without losing growth. Withdrawing now will result in losing all growth interest."
            : "WARNING: Please wait for the next safe withdrawal period to withdraw without losing growth. Withdrawing now will result in losing additional growth.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: canWithdraw ? "Withdraw" : "Withdraw Anyway",
          style: canWithdraw ? "default" : "destructive",
          onPress: () => {
            const initial = parseFloat(initialDeposit) || 0;
            if (!canWithdraw) {
              setCurrentValue(initial);
            }
            setTimeElapsed({ minutes: 0, seconds: 0 });
            setTotalGrowth(0);
            setRunning(false);
            setReinvestmentHistory([]);
            setCycleCount(0);
            setYearCount(0);
          }
        }
      ]
    );
  };

  const toggleSimulation = () => {
    if (!running) {
      Alert.alert(
        "Start",
        `Are you sure you want to start with initial deposit of: ${formatMoney(parseFloat(initialDeposit))}?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Start",
            onPress: () => setRunning(true)
          }
        ]
      );
    } else {
      setRunning(false);
    }
  };

  // Handle reinvestment at year completion
  const handleReinvestment = () => {
    const currentTotal = currentValue;
    const newYearCount = yearCount + 1;
    
    setReinvestmentHistory(prev => [...prev, {
      cycle: cycleCount + 1,
      year: newYearCount,
      previousAmount: parseFloat(initialDeposit),
      newAmount: currentTotal,
      growth: currentTotal - parseFloat(initialDeposit)
    }]);
    
    setInitialDeposit(currentTotal.toFixed(2));
    setCurrentValue(currentTotal);
    setTotalGrowth(0);
    setCycleCount(prev => prev + 1);
    setYearCount(newYearCount);
    setRunning(true);
  };

  const formatMoney = (amount) => {
    return '₱' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  useEffect(() => {
    (async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      setNotificationPermission(status === 'granted');
    })();
  }, []);

  const scheduleWithdrawalNotification = async () => {
    if (!notificationPermission) return;

    const growth = currentValue - parseFloat(initialDeposit);
    const netGrowthAfterTax = growth * (1 - TAX_RATE);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Growth Withdrawal Available!",
        body: `Your investment has grown by ₱${netGrowthAfterTax.toFixed(2)}. You can now withdraw your earnings!`,
        data: { growth: netGrowthAfterTax },
      },
      trigger: null, 
    });
  };

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: `Automatic Reinvesting Anually (Year ${yearCount + 1})`,
      headerTransparent: true,
      headerLeft: () => (
        <TouchableWithoutFeedback onPress={() => navigation.goBack()}>
          <Ionicons
            name="chevron-back"
            size={24}
            color={Colors.redTheme.background}
          />
        </TouchableWithoutFeedback>
      ),
    });
  }, [yearCount]);

  useEffect(() => {
    let interval;
    if (running) {
      interval = setInterval(() => {
        setTimeElapsed(prev => {
          const newSeconds = prev.seconds + 1;
          if (newSeconds >= 60) {
            return {
              minutes: prev.minutes + 1,
              seconds: 0
            };
          }
          return {
            ...prev,
            seconds: newSeconds
          };
        });

        setCurrentValue(prev => {
          const initial = parseFloat(initialDeposit);
          const targetGrowth = initial * ANNUAL_RATE;
          const growthPerSecond = targetGrowth / TOTAL_SECONDS;
          // Remove tax calculation here so full growth is accumulated
          return prev + growthPerSecond;
        });

        setTotalGrowth(prev => {
          const initial = parseFloat(initialDeposit);
          const targetGrowth = initial * ANNUAL_RATE;
          const currentCycleSeconds = (timeElapsed.minutes % 12) * 60 + timeElapsed.seconds;
          const progressPercent = currentCycleSeconds / TOTAL_SECONDS;
          return targetGrowth * progressPercent;
        });

        // Check if we've reached a 6-month mark for notification
        if (timeElapsed.minutes > 0 && timeElapsed.minutes % 6 === 0 && timeElapsed.seconds === 0) {
          scheduleWithdrawalNotification();
        }

        // Handle yearly reinvestment (every 12 minutes)
        if (timeElapsed.minutes > 0 && timeElapsed.minutes % 12 === 0 && timeElapsed.seconds === 0) {
          handleReinvestment();
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [running, timeElapsed, initialDeposit, notificationPermission]);

  const expectedFinalValue = parseFloat(initialDeposit) * (1 + ANNUAL_RATE);
  const currentGrowth = currentValue - parseFloat(initialDeposit);
  const taxAmount = currentGrowth * TAX_RATE;
  const netGrowth = currentGrowth * (1 - TAX_RATE);

  const calculateTimeEquivalent = () => {
  const totalMinutes = timeElapsed.minutes;
  const totalSeconds = timeElapsed.seconds;
  
  // Calculate continuous time without resetting
  const totalYears = Math.floor(totalMinutes / 12);
  const monthsInCurrentYear = totalMinutes % 12;
  
  return {
    year: totalYears,
    month: monthsInCurrentYear,
    day: Math.floor(totalSeconds / 5),
    hour: Math.floor((totalSeconds % 5) * 4.8),
    minute: Math.floor(((totalSeconds % 5) * 4.8 % 1) * 60)
  };
};

  // Update currentValue when initialDeposit changes
  useEffect(() => {
    const initial = parseFloat(initialDeposit) || 0;
    setCurrentValue(initial);
  }, [initialDeposit]);

  const calculateNextReinvestmentDate = () => {
    const currentDate = new Date();
    const monthsToAdd = 12 - (timeElapsed.minutes % 12);
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + monthsToAdd);
    return newDate.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <ImageBackground
        source={require('../../assets/images/bg2.png')}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea}>
          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              <Text style={styles.title}>
                Year in 12 Minutes {yearCount > 0 ? `(Year ${yearCount + 1})` : ''}
              </Text>
              <Text style={styles.subtitle}>14% Annual Growth with 20% Tax</Text>
              
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Initial Deposit:</Text>
                <TextInput
                  style={[
                    styles.input,
                    (running || timeElapsed.minutes > 0 || timeElapsed.seconds > 0) && styles.disabledInput
                  ]}
                  value={initialDeposit}
                  onChangeText={setInitialDeposit}
                  keyboardType="numeric"
                  placeholder="Enter amount"
                  placeholderTextColor="#666"
                  editable={!(running || timeElapsed.minutes > 0 || timeElapsed.seconds > 0)}
                />
                {(running || timeElapsed.minutes > 0 || timeElapsed.seconds > 0) && (
                  <Text style={styles.inputNote}>
                    ℹ️ Initial deposit locked until withdrawal
                  </Text>
                )}
              </View>

              <View style={styles.totalGrowthContainer}>
                <Text style={styles.label}>Total Accumulated Growth:</Text>
                <View style={styles.totalGrowthBox}>
                  <Text style={styles.totalGrowthAmount}>
                    {formatMoney(reinvestmentHistory.reduce((sum, item) => sum + item.growth, 0) + (currentValue - parseFloat(initialDeposit)))}
                  </Text>
                  <Text style={styles.totalGrowthLabel}>
                    Total from all cycles including current growth
                  </Text>
                </View>
              </View>

              {reinvestmentHistory.length > 0 && (
                <View style={styles.historyContainer}>
                  <TouchableOpacity 
                    style={styles.historyHeader}
                    onPress={() => setIsHistoryExpanded(!isHistoryExpanded)}
                  >
                    <Text style={styles.historyTitle}>
                      Reinvestment History {isHistoryExpanded ? '▼' : '▶'}
                    </Text>
                  </TouchableOpacity>
                  
                  {isHistoryExpanded && (
                    <View style={styles.historyContent}>
                      {reinvestmentHistory.map((item, index) => (
                        <View key={index} style={styles.historyItem}>
                          <Text style={styles.historyCycle}>Year {item.year}</Text>
                          <View style={styles.historyDetails}>
                            <Text style={styles.historyText}>
                              Previous: {formatMoney(item.previousAmount)}
                            </Text>
                            <Text style={[styles.historyText, { color: 'green' }]}>
                              Growth: +{formatMoney(item.growth)}
                            </Text>
                            <Text style={[styles.historyText, { fontWeight: 'bold' }]}>
                              New Amount: {formatMoney(item.newAmount)}
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}

              <View style={styles.breakdownContainer}>
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Current Growth:</Text>
                  <Text style={[styles.breakdownValue, { color: 'green' }]}>
                    ₱ {currentGrowth.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Tax at Withdrawal (20%):</Text>
                  <Text style={[styles.breakdownValue, { color: '#d32f2f' }]}>
                    - ₱ {taxAmount.toFixed(2)}
                  </Text>
                </View>

                <View style={[styles.breakdownRow, styles.netGrowthRow]}>
                  <Text style={styles.breakdownLabel}>Net Growth After Tax:</Text>
                  <Text style={[styles.breakdownValue, { color: Colors.redTheme.background }]}>
                    ₱ {netGrowth.toFixed(2)}
                  </Text>
                </View>
              </View>

              <View style={styles.displayContainer}>
                <Text style={styles.displayLabel}>Current Value:</Text>
                <Text style={styles.displayValue}>{formatMoney(currentValue)}</Text>
                
                <View style={styles.timeEquivalentContainer}>
                  <Text style={styles.timeEquivalentTitle}>Time:</Text>
                  {(() => {
                    const time = calculateTimeEquivalent();
                    return (
                      <View style={styles.timeEquivalentContent}>
                        <View style={styles.timeEquivalentItem}>
                          <Text style={styles.timeEquivalentValue}>{time.year}</Text>
                          <Text style={styles.timeEquivalentLabel}>Year</Text>
                        </View>
                        <View style={styles.timeEquivalentItem}>
                          <Text style={styles.timeEquivalentValue}>{time.month}</Text>
                          <Text style={styles.timeEquivalentLabel}>Month</Text>
                        </View>
                        <View style={styles.timeEquivalentItem}>
                          <Text style={styles.timeEquivalentValue}>{time.day}</Text>
                          <Text style={styles.timeEquivalentLabel}>Day</Text>
                        </View>
                        <View style={styles.timeEquivalentItem}>
                          <Text style={styles.timeEquivalentValue}>{time.hour}</Text>
                          <Text style={styles.timeEquivalentLabel}>Hour</Text>
                        </View>
                        <View style={styles.timeEquivalentItem}>
                          <Text style={styles.timeEquivalentValue}>{time.minute}</Text>
                          <Text style={styles.timeEquivalentLabel}>Min</Text>
                        </View>
                      </View>
                    );
                  })()}
                </View>

                <View style={styles.statsRow}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Total Value (Without 20% Tax)</Text>
                    <Text style={styles.statValue}>{formatMoney(expectedFinalValue)}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Next Reinvestment</Text>
                    <Text style={styles.statValue}>
                      {calculateNextReinvestmentDate()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.buttonContainer}>
                <TouchableWithoutFeedback onPress={running ? toggleSimulation : toggleSimulation} disabled={running}>
                  <View style={[
                    styles.button, 
                    running ? styles.pauseButton : styles.startButton,
                    running && styles.disabledButton
                  ]}>
                    <Text style={[styles.buttonText, running && styles.disabledText]}>
                      {running ? 'Start' : 'Start'}
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
                
                <TouchableWithoutFeedback onPress={handleWithdrawal}>
                  <View style={[
                    styles.button, 
                    isValidWithdrawalTime() ? styles.safeWithdrawButton : styles.earlyWithdrawButton
                  ]}>
                    <Text style={styles.buttonText}>
                      {isValidWithdrawalTime()
                        ? 'Withdraw Growth'
                        : yearCount === 0 && timeElapsed.minutes === 0
                          ? '⚠️ Withdraw'
                          : '⚠️ Withdraw'}
                    </Text>
                  </View>
                </TouchableWithoutFeedback>
              </View>

              {yearCount >= 2 && (
                <View style={styles.fullWithdrawContainer}>
                  <TouchableWithoutFeedback onPress={() => {
                    Alert.alert(
                      "Full Withdrawal",
                      `Are you sure you want to withdraw your initial deposit (${formatMoney(parseFloat(initialDeposit))}) along with all growth (${formatMoney(reinvestmentHistory.reduce((sum, item) => sum + item.growth, 0) + (currentValue - parseFloat(initialDeposit)))})?`,
                      [
                        {
                          text: "Cancel",
                          style: "cancel"
                        },
                        {
                          text: "Withdraw All",
                          style: "destructive",
                          onPress: () => {
                            setCurrentValue(0);
                            setInitialDeposit('0');
                            setTimeElapsed({ minutes: 0, seconds: 0 });
                            setTotalGrowth(0);
                            setRunning(false);
                            setReinvestmentHistory([]);
                            setCycleCount(0);
                            setYearCount(0);
                          }
                        }
                      ]
                    );
                  }}>
                    <View style={[styles.button, styles.fullWithdrawButton]}>
                      <Text style={styles.buttonText}>Withdraw All (Initial + Growth)</Text>
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              )}

              <View style={styles.noteBox}>
                <Text style={styles.noteText}>
                  • Each 12-minute cycle = 1 year of growth
                </Text>
                <Text style={styles.noteText}>
                  • Auto-reinvests full growth to start next year
                </Text>
                <Text style={styles.noteText}>
                  • 20% tax applied only at withdrawal
                </Text>
                <Text style={[styles.noteText, styles.warningNote]}>
                  • Safe withdrawals at every 6 and 12 months
                </Text>
                <Text style={[styles.noteText, styles.warningNote]}>
                  • First minute of each new year is also safe (after year 1)
                </Text>
                <Text style={[styles.noteText, styles.warningNote]}>
                  • Other withdrawals will forfeit growth
                </Text>
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </ImageBackground>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    padding: 20,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    color: Colors.redTheme.background,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  inputContainer: {
    marginBottom: 25,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.redTheme.background,
    fontSize: 16,
  },
  breakdownContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  breakdownValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  netGrowthRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    marginTop: 8,
    paddingTop: 12,
  },
  displayContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  displayLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
    textAlign: 'center',
  },
  displayValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'green',
    marginBottom: 20,
    textAlign: 'center',
  },
  timeEquivalentContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  timeEquivalentTitle: {
    fontSize: 16,
    color: Colors.redTheme.background,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  timeEquivalentContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeEquivalentItem: {
    alignItems: 'center',
    flex: 1,
  },
  timeEquivalentValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.redTheme.background,
  },
  timeEquivalentLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    padding: 12,
    borderRadius: 8,
    width: '48%',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.redTheme.background,
    textAlign: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    width: '48%',
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#4CAF50',
  },
  pauseButton: {
    backgroundColor: '#FFC107',
  },
  resetButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  noteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  historyContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.redTheme.background,
    textAlign: 'center',
  },
  historyContent: {
    marginTop: 10,
  },
  historyItem: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 10,
  },
  historyCycle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: Colors.redTheme.background,
    marginBottom: 5,
  },
  historyDetails: {
    marginLeft: 10,
  },
  historyText: {
    fontSize: 13,
    color: '#333',
    marginBottom: 2,
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: '#666',
  },
  disabledText: {
    color: '#ccc',
  },
  earlyWithdrawButton: {
    backgroundColor: '#FF6B6B',
  },
  safeWithdrawButton: {
    backgroundColor: '#4CAF50',
  },
  warningNote: {
    color: '#FF6B6B',
    fontWeight: 'bold',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
    color: '#666',
  },
  inputNote: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 5,
    textAlign: 'center',
  },
  fullWithdrawContainer: {
    backgroundColor: 'rgba(66, 45, 45, 0)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  fullWithdrawButton: {
    backgroundColor: '#0D9E19',
  },
  totalGrowthContainer: {
    marginBottom: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 15,
    borderRadius: 10,
  },
  totalGrowthBox: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  totalGrowthAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0D9E19',
    marginBottom: 5,
  },
  totalGrowthLabel: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
});