import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import axios from "axios";
import DropDownPicker from "react-native-dropdown-picker";

const CurrencyConverter = () => {
  const [amount, setAmount] = useState("1");
  const [result, setResult] = useState("");
  const [currencies, setCurrencies] = useState([]);
  const [fromCurrency, setFromCurrency] = useState("PHP");
  const [toCurrency, setToCurrency] = useState("JPY");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  useEffect(() => {
    fetchCurrencies();
  }, []);

  useEffect(() => {
    if (fromCurrency && toCurrency) {
      convertCurrency();
    }
  }, [amount, fromCurrency, toCurrency]);

  const fetchCurrencies = async () => {
    try {
      const response = await axios.get(
        "https://api.exchangerate-api.com/v4/latest/USD"
      );
      const currencyList = Object.keys(response.data.rates).map((currency) => ({
        label: currency,
        value: currency,
      }));
      setCurrencies(currencyList);
      setLoading(false);
    } catch (error) {
      setError("Failed to fetch currencies");
      setLoading(false);
      console.error(error);
    }
  };

  const convertCurrency = async () => {
    try {
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`
      );
      const rate = response.data.rates[toCurrency];
      setResult((amount * rate).toFixed(2));
    } catch (error) {
      setError("Failed to convert currency");
      console.error(error);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  if (error) {
    return <Text style={styles.error}>{error}</Text>;
  }

  return (
    <View style={styles.container}>
      <Text
        style={{
          width: "100%",
          textAlign: "center",
          marginBottom: 10,
          fontSize: 20,
        }}
      >
        FOREX CONVERTER
      </Text>
      <View
        style={{
          width: "100%",
          flexDirection: "row",
        }}
      >
        <TextInput
          style={styles.input}
          keyboardType="numbers-and-punctuations"
          value={amount}
          onChangeText={setAmount}
        />
        <TextInput style={styles.input} value={result} editable={false} />
      </View>
      <View style={styles.dropdownWrapper}>
        <DropDownPicker
          open={openFrom}
          value={fromCurrency}
          items={currencies}
          setOpen={setOpenFrom}
          setValue={setFromCurrency}
          setItems={setCurrencies}
          placeholder="Select From Currency"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          dropdownStyle={styles.dropdownStyle}
          onChangeValue={(value) => {
            setFromCurrency(value);
            console.log("Selected From Currency:", value);
          }}
        />
        <DropDownPicker
          open={openTo}
          value={toCurrency}
          items={currencies}
          setOpen={setOpenTo}
          setValue={setToCurrency}
          setItems={setCurrencies}
          placeholder="Select To Currency"
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          dropdownStyle={styles.dropdownStyle}
          onChangeValue={(value) => {
            setToCurrency(value);
            console.log("Selected To Currency:", value);
          }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    justifyContent: "center",
    padding: 20,
    overflow: "visible",
  },
  input: {
    flex: 1,
    margin: 5,
    height: 40,
    borderColor: "black",
    borderWidth: 2,
    marginBottom: 20,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: "white",
    color: "black",
  },
  dropdownWrapper: {
    flexDirection: "row", // Ensure horizontal layout
    justifyContent: "flex-between", // Space out dropdowns
    width: "50%",
  },
  dropdown: {
    width: "90%", // Adjust as needed to fit side-by-side,
    marginHorizontal: 8,
  },
  dropdownStyle: {
    width: "100%", // Dropdown list width
  },
  dropdownContainer: {
    width: "100%", // Container width for the dropdown
    height: 100,
  },
  error: {
    color: "red",
    textAlign: "center",
  },
});

export default CurrencyConverter;
