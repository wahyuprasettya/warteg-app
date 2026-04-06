import { ReactNode } from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  children: ReactNode;
  scroll?: boolean;
}

export const ScreenContainer = ({ children, scroll = false }: Props) => {
  if (scroll) {
    return (
      <SafeAreaView className="flex-1 bg-brand-soft">
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <View className="pb-8">{children}</View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-brand-soft">
      <View className="flex-1 p-4">{children}</View>
    </SafeAreaView>
  );
};
