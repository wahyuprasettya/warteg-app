import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, Text, View } from "react-native";

import { useAuth } from "@/hooks/useAuth";
import { AppStackParamList } from "@/types";
import { AddProductScreen } from "@/screens/AddProductScreen";
import { CartScreen } from "@/screens/CartScreen";
import { CheckoutScreen } from "@/screens/CheckoutScreen";
import { DashboardScreen } from "@/screens/DashboardScreen";
import { LoginScreen } from "@/screens/LoginScreen";
import { POSScreen } from "@/screens/POSScreen";
import { ProductScreen } from "@/screens/ProductScreen";
import { RegisterScreen } from "@/screens/RegisterScreen";
import { SetupBusinessScreen } from "@/screens/SetupBusinessScreen";
import { TableScreen } from "@/screens/TableScreen";
import { TransactionHistoryScreen } from "@/screens/TransactionHistoryScreen";
import { WartegScreen } from "@/screens/WartegScreen";

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator = () => {
  const { authUser, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-brand-soft">
        <ActivityIndicator size="large" color="#A63D40" />
        <Text className="mt-4 text-base text-brand-ink">Menyiapkan aplikasi kasir...</Text>
      </View>
    );
  }

  const initialBusinessRoute =
    profile?.businessType === "restoran"
      ? "Table"
      : profile?.businessType === "warteg"
        ? "Warteg"
        : "POS";

  return (
    <NavigationContainer>
      {!authUser ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </Stack.Navigator>
      ) : !profile?.businessType ? (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="SetupBusiness" component={SetupBusinessScreen} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator
          key={profile.businessType}
          initialRouteName={initialBusinessRoute}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="POS" component={POSScreen} />
          <Stack.Screen name="Warteg" component={WartegScreen} />
          <Stack.Screen name="Table" component={TableScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="Products" component={ProductScreen} />
          <Stack.Screen name="AddProduct" component={AddProductScreen} />
          <Stack.Screen name="Transactions" component={TransactionHistoryScreen} />
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};
