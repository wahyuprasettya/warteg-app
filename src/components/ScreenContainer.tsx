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
      <SafeAreaView style={{ flex: 1, backgroundColor: '#fcfaf8' }}>
        <ScrollView contentContainerStyle={{ padding: 16, flexGrow: 1 }}>
          <View style={{ paddingBottom: 32 }}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fcfaf8' }}>
      <View style={{ flex: 1, padding: 16 }}>{children}</View>
    </SafeAreaView>
  );
};
