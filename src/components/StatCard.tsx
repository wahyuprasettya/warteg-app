import { View, Text } from "react-native";

interface Props {
  label: string;
  value: string;
  icon?: string;
  accent?: boolean;
}

export const StatCard = ({ label, value, icon, accent = false }: Props) => (
  <View
    className={`mr-3 flex-1 rounded-[28px] p-5 border ${
      accent ? "bg-brand border-brand/20" : "bg-white border-brand/5"
    }`}
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
      className={`mt-1.5 text-2xl font-poppins-bold ${
        accent ? "text-white" : "text-brand-ink"
      }`}
      numberOfLines={1}
      adjustsFontSizeToFit
    >
      {value}
    </Text>
  </View>
);
