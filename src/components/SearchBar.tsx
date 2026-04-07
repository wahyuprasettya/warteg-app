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
    className="font-poppins mb-2 rounded-2xl border border-brand/15 bg-white px-4 py-3 text-base text-brand-ink"
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor="#8B7E74"
  />
);
