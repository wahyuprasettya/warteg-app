import { Text, View } from "react-native";

interface Props {
  title: string;
  description: string;
}

export const EmptyState = ({ title, description }: Props) => (
  <View className="items-center rounded-3xl bg-white p-6">
    <Text className="text-xl font-poppins-bold text-brand-ink">{title}</Text>
    <Text className="font-poppins mt-2 text-center text-base text-brand-muted">
      {description}
    </Text>
  </View>
);
