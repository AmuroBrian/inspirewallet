import React from "react";
import DropDownPicker from "react-native-dropdown-picker";

const DropdownDeposit = ({
  open,
  value,
  items,
  setOpen,
  setValue,
  placeholder,
}) => {
  return (
    <DropDownPicker
      open={open}
      value={value}
      items={items}
      setOpen={setOpen}
      setValue={setValue}
      placeholder={placeholder}
      containerStyle={{ height: 50, width: "95%", margin: 10 }}
      style={{
        backgroundColor: "white",
        borderColor: "black",
        borderWidth: 2,
        borderRadius: 15,
      }}
      dropDownContainerStyle={{
        borderColor: "black",
        borderWidth: 2,
        borderRadius: 15,
      }}
    />
  );
};

export default DropdownDeposit;
