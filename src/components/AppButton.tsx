import { ActivityIndicator, Pressable, Text, View, ViewStyle, useWindowDimensions } from "react-native";
import { getResponsiveLayout } from "@/utils/responsive";

interface Props {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  style?: ViewStyle;
}

export const AppButton = ({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  className,
  style,
}: Props) => {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const variantColors: Record<string, string> = {
    primary: "#A63D40",
    secondary: "#E9B824",
    ghost: "#FFFFFF",
    danger: "#DC2626",
  };

  const bgColor = variantColors[variant] || variantColors.primary;
  const textColor = variant === "ghost" ? "#1F2937" : "#FFFFFF";

  return (
    <Pressable
      className={className}
      style={[
        {
          height: layout.isTablet ? 60 : 56,
          width: "100%",
          minHeight: 52,
        },
        style,
      ]}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {({ pressed }) => (
        <View
            style={{
              backgroundColor: bgColor,
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: layout.isTablet ? 18 : 16,
              opacity: disabled ? 0.4 : (pressed ? 0.8 : 1),
              borderWidth: variant === "ghost" ? 1 : 0,
              borderColor: "rgba(166,61,64,0.15)",
            }}
          >
            {loading ? (
              <ActivityIndicator color={textColor} />
            ) : (
              <Text
              style={{ fontFamily: "Poppins-Bold", fontSize: layout.isTablet ? 17 : 16, color: textColor }}
              >
              {label}
              </Text>
          )}
        </View>
      )}
    </Pressable>
  );
};


