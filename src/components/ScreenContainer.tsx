import { ReactNode } from "react";
import { ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useWindowDimensions } from "react-native";
import { getResponsiveLayout } from "@/utils/responsive";

interface Props {
  children: ReactNode;
  scroll?: boolean;
  className?: string;
  contentClassName?: string;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  maxWidth?: number;
}

export const ScreenContainer = ({
  children,
  scroll = false,
  className,
  contentClassName,
  style,
  contentStyle,
  maxWidth,
}: Props) => {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const resolvedMaxWidth = maxWidth ?? layout.contentMaxWidth;
  const containerPadding = layout.horizontalPadding;

  const wrapperStyle: ViewStyle = {
    width: "100%",
    flex: 1,
    alignSelf: "center",
    maxWidth: resolvedMaxWidth,
  };

  if (scroll) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fcfaf8" }} className={className}>
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            paddingHorizontal: containerPadding,
            paddingTop: containerPadding,
            paddingBottom: containerPadding + 16,
            alignItems: "center",
            ...((contentStyle as ViewStyle) || {}),
          }}
        >
          <View style={wrapperStyle} className={contentClassName}>
            {children}
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fcfaf8" }} className={className}>
      <View
        style={{
          flex: 1,
          paddingHorizontal: containerPadding,
          paddingTop: containerPadding,
          paddingBottom: containerPadding,
          alignItems: "center",
          ...((style as ViewStyle) || {}),
        }}
      >
        <View style={wrapperStyle} className={contentClassName}>
          {children}
        </View>
      </View>
    </SafeAreaView>
  );
};
