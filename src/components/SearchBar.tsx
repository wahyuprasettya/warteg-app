import { TextInput, useWindowDimensions } from "react-native";
import { getResponsiveLayout } from "@/utils/responsive";

interface Props {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = ({
  value,
  onChangeText,
  placeholder = "Cari produk...",
}: Props) => {
  const { width } = useWindowDimensions();
  const layout = getResponsiveLayout(width);

  return (
    <TextInput
      style={{
        fontFamily: "Poppins",
        fontSize: layout.isTablet ? 17 : 16,
        backgroundColor: "#fff",
        borderRadius: 16,
        borderWidth: 1,
        borderColor: "rgba(193,125,60,0.15)",
        paddingHorizontal: layout.isTablet ? 18 : 16,
        paddingVertical: layout.isTablet ? 14 : 12,
        color: "#2d2d2d",
        marginBottom: 8,
      }}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor="#8B7E74"
    />
  );
};
