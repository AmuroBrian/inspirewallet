import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from "react-native";
import axios from "axios";
import DropDownPicker from "react-native-dropdown-picker";

export default function CurrencyConverter() {
  const [amount, setAmount] = useState("1");
  const [result, setResult] = useState("");
  const [currencies, setCurrencies] = useState([]);
  const [fromCurrency, setFromCurrency] = useState("PHP");
  const [toCurrency, setToCurrency] = useState("JPY");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openFrom, setOpenFrom] = useState(false);
  const [openTo, setOpenTo] = useState(false);

  // Fetch currencies when the component mounts
  useEffect(() => {
    let isMounted = true; // Track component mount status

    const fetchCurrencies = async () => {
      try {
        const response = await axios.get(
          "https://api.exchangerate-api.com/v4/latest/USD",
          { timeout: 5000 } // Set a timeout of 5 seconds
        );

        // Check if the response data is valid
        if (response && response.data && response.data.rates) {
          if (isMounted) {
            const currencyList = Object.keys(response.data.rates).map(
              (currency) => ({
                label: currency,
                value: currency,
              })
            );
            setCurrencies(currencyList);
            setLoading(false);
          }
        } else {
          setError("Invalid data from API");
          setLoading(false);
        }
      } catch (error) {
        if (isMounted) {
          console.error("Error fetching currencies:", error);
          setError("Failed to fetch currencies");
          setLoading(false);
        }
      }
    };

    fetchCurrencies();

    // Cleanup if component is unmounted
    return () => {
      isMounted = false;
    };
  }, []);

  // Convert currency when the amount or currency changes
  useEffect(() => {
    if (fromCurrency && toCurrency) {
      convertCurrency();
    }
  }, [amount, fromCurrency, toCurrency]);

  const convertCurrency = async () => {
    try {
      const response = await axios.get(
        `https://api.exchangerate-api.com/v4/latest/${fromCurrency}`,
        { timeout: 5000 } // Set a timeout of 5 seconds
      );

      if (response && response.data && response.data.rates) {
        const rate = response.data.rates[toCurrency];
        if (rate) {
          setResult((amount * rate).toFixed(2));
        } else {
          setError(`No conversion rate found for ${toCurrency}`);
        }
      } else {
        console.log("Invalid conversion data:", response);
        setError("Failed to convert currency");
      }
    } catch (error) {
      console.error("Error converting currency:", error);
      setError("Failed to convert currency");
    }
  };

  // Show loading indicator if currencies are being fetched
  if (loading) {
    return <ActivityIndicator size="large" color="#0000ff" />;
  }

  // Show error message if there's an error fetching currencies
  if (error) {
    console.log("Error:", error);
    return <Text style={styles.error}>{error}</Text>;
  }

  // Check if currencies is empty
  if (currencies.length === 0) {
    return <Text style={styles.error}>No currencies available</Text>;
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
      <View style={{ width: "100%", flexDirection: "row" }}>
        <TextInput
          style={styles.input}
          keyboardType="numbers-and-punctuation"
          value={amount}
          onChangeText={(text) => {
            setAmount(text);
          }}
          editable={true}
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
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    justifyContent: "center",
    padding: 20,
    overflow: "visible",
    zIndex: 1000,
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center", // Align dropdowns vertically
    width: "50%",
    gap: 1,
  },
  dropdown: {
    width: "95%", // Take equal space for alignment
    marginHorizontal: 5, // Add some spacing
    height: 40, // Match the height of the TextInput for consistency
  },
  dropdownContainer: {
    width: "100%",
    zIndex: 1000, // Prevent overlap issues
  },
  dropdownStyle: {
    backgroundColor: "#fff",
  },
  error: {
    color: "red",
    textAlign: "center",
  },
});
