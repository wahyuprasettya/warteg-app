import { Pressable, StyleSheet, Text, useWindowDimensions } from "react-native";
import { getResponsiveLayout } from "@/utils/responsive";

interface Props {
  label: string;
  icon?: string;
  active?: boolean;
  onPress: () => void;
}

export const CategoryPill = ({
  label,
  icon,
  active = false,
  onPress,
}: Props) => {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return (
    <Pressable
      className="mr-2 flex-row items-center rounded-2xl border px-5"
      style={[
        styles.pill,
        active ? styles.pillActive : styles.pillInactive,
        { height: layout.isTablet ? 42 : 38, paddingHorizontal: layout.isTablet ? 18 : 16 },
      ]}
      onPress={onPress}
    >
      {icon ? (
        <Text style={[styles.icon, { fontSize: layout.isTablet ? 14 : 13 }]} className="font-poppins">
          {icon}
        </Text>
      ) : null}
      <Text
        style={[
          styles.label,
          active ? styles.labelActive : styles.labelInactive,
          { fontFamily: active ? "Poppins-Bold" : "Poppins", fontSize: layout.isTablet ? 14 : 13 },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  pillActive: {
    backgroundColor: "#A63D40",
    borderColor: "#A63D40",
  },
  pillInactive: {
    backgroundColor: "#FFFFFF",
    borderColor: "rgba(166, 61, 64, 0.08)",
  },
  icon: {
    fontSize: 13,
    marginRight: 5,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
  labelActive: {
    color: "#FFFFFF",
  },
  labelInactive: {
    color: "#2F2522",
  },
});
