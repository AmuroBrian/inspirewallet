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
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from 'expo-router';
import { Colors } from '../../constants/Colors';
import { Ionicons } from '@expo/vector-icons';

export default function TimeDepositCalculator() {
  const navigation = useNavigation();
  const [depositAmount, setDepositAmount] = useState('');
  const [showResults, setShowResults] = useState(false);

  // Constants
  const ANNUAL_RATE = 0.14; // 14% annual interest rate
  const TAX_RATE = 0.20; // 20% tax rate

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: "Time Deposit Calculator",
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
  }, []);

  const formatMoney = (amount) => {
    return '₱' + amount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const calculateProjections = () => {
    const deposit = parseFloat(depositAmount) || 0;

    if (deposit <= 0) {
      Alert.alert('Error', 'Please enter a valid deposit amount');
      return;
    }
    setShowResults(true);
  };

  const calculateGrowth = (amount, years) => {
    const grossAmount = amount * Math.pow(1 + ANNUAL_RATE, years);
    const totalGrowth = grossAmount - amount;
    const tax = totalGrowth * TAX_RATE;
    return grossAmount - tax;
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
              <Text style={styles.title}>Time Deposit Growth</Text>
              <Text style={styles.subtitle}>14% Annual Rate with 20% Tax</Text>

              <View style={styles.inputContainer}>

                <Text style={styles.label}>Deposit Amount:</Text>
                <TextInput
                  style={styles.input}
                  value={depositAmount}
                  onChangeText={setDepositAmount}
                  keyboardType="numeric"
                  placeholder="Enter deposit amount"
                  placeholderTextColor="#666"
                />

                <TouchableOpacity
                  style={styles.calculateButton}
                  onPress={calculateProjections}
                >
                  <Text style={styles.buttonText}>Calculate Projections</Text>
                </TouchableOpacity>
              </View>

              {showResults && depositAmount && (
                <View style={styles.resultsContainer}>
                  <Text style={styles.resultsTitle}>Projected Growth</Text>
                  
                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>Initial Deposit:</Text>
                    <Text style={styles.resultValue}>{formatMoney(parseFloat(depositAmount))}</Text>
                  </View>

                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>6 Months:</Text>
                    <Text style={styles.resultValue}>
                      {formatMoney(calculateGrowth(parseFloat(depositAmount), 0.5))}
                    </Text>
                  </View>

                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>1 Year:</Text>
                    <Text style={styles.resultValue}>
                      {formatMoney(calculateGrowth(parseFloat(depositAmount), 1))}
                    </Text>
                  </View>

                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>1.5 Years:</Text>
                    <Text style={styles.resultValue}>
                      {formatMoney(calculateGrowth(parseFloat(depositAmount), 1.5))}
                    </Text>
                  </View>

                  <View style={styles.resultItem}>
                    <Text style={styles.resultLabel}>2 Years:</Text>
                    <Text style={styles.resultValue}>
                      {formatMoney(calculateGrowth(parseFloat(depositAmount), 2))}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.noteBox}>
                <Text style={styles.noteText}>• 14% Annual Interest Rate</Text>
                <Text style={styles.noteText}>• 20% Tax on Earnings</Text>
                <Text style={styles.noteText}>• Compounds Annually</Text>
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
    marginBottom: 20,
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
    marginBottom: 15,
  },
  calculateButton: {
    backgroundColor: Colors.redTheme.background,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resultsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.redTheme.background,
    marginBottom: 15,
    textAlign: 'center',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  resultValue: {
    fontSize: 16,
    color: 'green',
    fontWeight: 'bold',
  },
  noteBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 15,
    borderRadius: 10,
  },
  noteText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
}); 