import { View, Text, Pressable, useWindowDimensions } from "react-native";
import { getResponsiveLayout } from "@/utils/responsive";

interface Props {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: string;
  onActionPress?: () => void;
}

export const AppHeader = ({ title, subtitle, actionLabel, actionIcon, onActionPress }: Props) => {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);
  const isStacked = width < 420;

  return (
    <View
      style={{
        marginBottom: layout.isTablet ? 24 : 20,
        flexDirection: isStacked ? "column" : "row",
        alignItems: isStacked ? "flex-start" : "flex-start",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flex: 1, paddingRight: isStacked ? 0 : 12, width: "100%" }}>
        <Text
          style={{
            fontSize: layout.titleSize,
            fontFamily: "Poppins-Bold",
            color: "#1a1a1a",
            lineHeight: layout.titleSize + 6,
          }}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            style={{
              marginTop: 6,
              fontFamily: "Poppins-Medium",
              fontSize: layout.subtitleSize,
              lineHeight: layout.subtitleSize + 6,
              color: "#666",
              maxWidth: layout.isTablet ? 760 : undefined,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {actionLabel && onActionPress ? (
        <Pressable
          style={{
            overflow: "hidden",
            borderRadius: 22,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.7)",
            backgroundColor: "#fff",
            padding: 8,
            elevation: 1,
            marginTop: isStacked ? 14 : 0,
            alignSelf: isStacked ? "flex-start" : "auto",
          }}
          onPress={onActionPress}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              borderRadius: 18,
              backgroundColor: "rgba(242, 228, 209, 0.4)",
              paddingHorizontal: 10,
              paddingVertical: 6,
            }}
          >
            {actionIcon ? (
              <View
                style={{
                  marginRight: 8,
                  height: 28,
                  width: 28,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 14,
                  backgroundColor: "#fff",
                }}
              >
                <Text style={{ fontFamily: "Poppins", fontSize: 12 }}>{actionIcon}</Text>
              </View>
            ) : null}
            <Text style={{ fontSize: 14, fontFamily: "Poppins-Bold", color: "#c17d3c" }}>
              {actionLabel}
            </Text>
            <View
              style={{
                marginLeft: 8,
                height: 28,
                width: 28,
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 14,
                backgroundColor: "#c17d3c",
              }}
            >
              <Text style={{ fontSize: 12, fontFamily: "Poppins-Bold", color: "#fff" }}>{">"}</Text>
            </View>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
};
