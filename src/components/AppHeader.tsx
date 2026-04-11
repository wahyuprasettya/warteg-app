import { View, Text, Pressable } from "react-native";

interface Props {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: string;
  onActionPress?: () => void;
}

export const AppHeader = ({ title, subtitle, actionLabel, actionIcon, onActionPress }: Props) => (
  <View style={{ marginBottom: 20, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
    <View style={{ flex: 1, paddingRight: 12 }}>
      <Text style={{ fontSize: 30, fontFamily: 'Poppins-Bold', color: '#1a1a1a' }}>{title}</Text>
      {subtitle ? (
        <Text style={{ marginTop: 6, fontFamily: 'Poppins-Medium', fontSize: 14, lineHeight: 20, color: '#666' }}>{subtitle}</Text>
      ) : null}
    </View>

    {actionLabel && onActionPress ? (
      <Pressable
        style={{ overflow: 'hidden', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', backgroundColor: '#fff', padding: 8, elevation: 1 }}
        onPress={onActionPress}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 18, backgroundColor: 'rgba(242, 228, 209, 0.4)', paddingHorizontal: 10, paddingVertical: 6 }}>
          {actionIcon ? (
            <View style={{ marginRight: 8, height: 28, width: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#fff' }}>
              <Text style={{ fontFamily: 'Poppins', fontSize: 12 }}>{actionIcon}</Text>
            </View>
          ) : null}
          <Text style={{ fontSize: 14, fontFamily: 'Poppins-Bold', color: '#c17d3c' }}>{actionLabel}</Text>
          <View style={{ marginLeft: 8, height: 28, width: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#c17d3c' }}>
            <Text style={{ fontSize: 12, fontFamily: 'Poppins-Bold', color: '#fff' }}>{">"}</Text>
          </View>
        </View>
      </Pressable>
    ) : null}
  </View>
);
