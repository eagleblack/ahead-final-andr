import React from "react";
import { TextInput, HelperText } from "react-native-paper";
import { useTheme } from "../context/ThemeContext";

const FormInput = ({ error, style, ...props }) => {
  const { colors } = useTheme();

  return (
    <>
      <TextInput
        mode="outlined"
        style={style}
        error={error}
        theme={{
          colors: {
            primary: error ? colors.error : colors.primary,
            background: colors.surface,
            text: colors.text,
            placeholder: colors.textSecondary,
          },
        }}
        {...props}
      />
      {error && <HelperText type="error">This field is required</HelperText>}
    </>
  );
};

export default FormInput;
