import { TextInput } from "react-native";

interface Props {
  value: string;
  onChangeText: (value: string) => void;
  placeholder?: string;
}

export const SearchBar = ({
  value,
  onChangeText,
  placeholder = "Cari produk...",
}: Props) => (
  <TextInput
    style={{ fontFamily: 'Poppins', fontSize: 16, backgroundColor: '#fff', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(193,125,60,0.15)', paddingHorizontal: 16, paddingVertical: 12, color: '#2d2d2d', marginBottom: 8 }}
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor="#8B7E74"
  />
);
