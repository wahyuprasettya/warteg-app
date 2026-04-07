import { View, Text, Pressable } from "react-native";

interface Props {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  actionIcon?: string;
  onActionPress?: () => void;
}

export const AppHeader = ({ title, subtitle, actionLabel, actionIcon, onActionPress }: Props) => (
  <View className="mb-5 flex-row items-start justify-between">
    <View className="flex-1 pr-3">
      <Text className="text-3xl font-poppins-bold text-brand-ink">{title}</Text>
      {subtitle ? (
        <Text className="mt-1.5 font-poppins-medium text-sm leading-5 text-brand-muted">{subtitle}</Text>
      ) : null}
    </View>

    {actionLabel && onActionPress ? (
      <Pressable
        className="overflow-hidden rounded-[22px] border border-white/70 bg-white px-2 py-2 shadow-sm"
        onPress={onActionPress}
      >
        <View className="flex-row items-center rounded-[18px] bg-brand-soft/40 px-2.5 py-1.5">
          {actionIcon ? (
            <View className="mr-2 h-7 w-7 items-center justify-center rounded-full bg-white">
              <Text className="text-xs">{actionIcon}</Text>
            </View>
          ) : null}
          <Text className="text-sm font-poppins-bold text-brand">{actionLabel}</Text>
          <View className="ml-2 h-7 w-7 items-center justify-center rounded-full bg-brand">
            <Text className="text-xs font-poppins-bold text-white">></Text>
          </View>
        </View>
      </Pressable>
    ) : null}
  </View>
);
