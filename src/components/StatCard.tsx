import { View, Text, useWindowDimensions } from "react-native";
import { getResponsiveLayout } from "@/utils/responsive";

interface Props {
  label: string;
  value: string;
  icon?: string;
  accent?: boolean;
}

export const StatCard = ({ label, value, icon, accent = false }: Props) => {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return (
    <View
      className={`mr-3 flex-1 rounded-[28px] border ${
        accent ? "bg-brand border-brand/20" : "bg-white border-brand/5"
      }`}
      style={{ padding: layout.isTablet ? 22 : 20, minWidth: layout.isTablet ? 150 : 0 }}
    >
      {icon ? (
        <View
          className={`mb-3 h-10 w-10 items-center justify-center rounded-2xl ${
            accent ? "bg-white/20" : "bg-brand-soft/50"
          }`}
        >
          <Text className="font-poppins text-lg">{icon}</Text>
        </View>
      ) : null}
      <Text
        className={`text-xs font-poppins-semibold tracking-wide uppercase ${
          accent ? "text-white/70" : "text-brand-muted"
        }`}
      >
        {label}
      </Text>
      <Text
        className={`mt-1.5 font-poppins-bold ${
          accent ? "text-white" : "text-brand-ink"
        }`}
        style={{ fontSize: layout.isTablet ? 26 : 22 }}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
};
