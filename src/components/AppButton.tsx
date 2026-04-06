import { ActivityIndicator, Pressable, Text } from "react-native";

interface Props {
  label: string;
  onPress: () => void | Promise<void>;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
}

export const AppButton = ({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
}: Props) => {
  const styles = {
    primary: "bg-brand px-4 py-4",
    secondary: "bg-brand-accent px-4 py-4",
    ghost: "bg-white px-4 py-4 border border-brand/20",
    danger: "bg-red-700 px-4 py-4",
  };

  return (
    <Pressable
      className={`items-center rounded-2xl ${styles[variant]} ${disabled ? "opacity-50" : ""}`}
      disabled={disabled || loading}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color="#ffffff" />
      ) : (
        <Text className={`text-base font-poppins-bold ${variant === "ghost" ? "text-brand-ink" : "text-white"}`}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};
