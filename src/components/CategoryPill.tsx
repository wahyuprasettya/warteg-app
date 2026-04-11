import { Pressable, StyleSheet, Text } from "react-native";

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
}: Props) => (
  <Pressable
    className="mr-2 flex-row items-center rounded-2xl border px-5"
    style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
    onPress={onPress}
  >
    {icon ? (
      <Text style={styles.icon} className="font-poppins">
        {icon}
      </Text>
    ) : null}
    <Text
      style={[styles.label, active ? styles.labelActive : styles.labelInactive, { fontFamily: active ? 'Poppins-Bold' : 'Poppins' }]}
    >
      {label}
    </Text>
  </Pressable>
);

const styles = StyleSheet.create({
  pill: {
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
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
