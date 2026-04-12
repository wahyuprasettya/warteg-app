import { Text, View, useWindowDimensions } from "react-native";
import { getResponsiveLayout } from "@/utils/responsive";

interface Props {
  title: string;
  description: string;
}

export const EmptyState = ({ title, description }: Props) => {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return (
    <View className="items-center rounded-3xl bg-white p-6" style={{ padding: layout.isTablet ? 28 : 24 }}>
      <Text style={{ fontSize: layout.isTablet ? 22 : 20 }} className="font-poppins-bold text-brand-ink">
        {title}
      </Text>
      <Text className="font-poppins mt-2 text-center text-base text-brand-muted" style={{ fontSize: layout.isTablet ? 16 : 15, lineHeight: layout.isTablet ? 24 : 22 }}>
        {description}
      </Text>
    </View>
  );
};
