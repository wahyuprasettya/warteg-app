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
import { TransactionHistoryScreen } from "@/screens/TransactionHistoryScreen";
import { SettingsScreen } from "@/screens/SettingsScreen";
import { OrderListScreen } from "@/screens/OrderListScreen";
import { CustomerOrderScreen } from "@/screens/CustomerOrderScreen";
import { CashierManagementScreen } from "@/screens/CashierManagementScreen";
import { PaymentScreen } from "@/screens/PaymentScreen";
import { OwnerManagementScreen } from "@/screens/OwnerManagementScreen";

const Stack = createNativeStackNavigator<AppStackParamList>();

export const AppNavigator = () => {
  const { authUser, profile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fcfaf8' }}>
        <ActivityIndicator size="large" color="#c17d3c" />
        <Text style={{ fontFamily: 'Poppins-Bold', marginTop: 16, color: '#c17d3c' }}>
          Menyiapkan aplikasi...
        </Text>
      </View>
    );
  }

  const isOwner = profile?.role === "owner";

  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      {!authUser ? (
        // Auth Group
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="CustomerOrder" component={CustomerOrderScreen} />
        </Stack.Group>
      ) : isOwner ? (
        // Owner Group
        <Stack.Group>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="OrderList" component={OrderListScreen} />
          <Stack.Screen name="POS" component={POSScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="CustomerOrder" component={CustomerOrderScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="CashierManagement" component={CashierManagementScreen} />
          <Stack.Screen name="OwnerManagement" component={OwnerManagementScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Transactions" component={TransactionHistoryScreen} />
          <Stack.Screen name="Products" component={ProductScreen} />
          <Stack.Screen name="AddProduct" component={AddProductScreen} />
        </Stack.Group>
      ) : (
        // Cashier Group
        <Stack.Group>
          <Stack.Screen name="Dashboard" component={DashboardScreen} />
          <Stack.Screen name="OrderList" component={OrderListScreen} />
          <Stack.Screen name="POS" component={POSScreen} />
          <Stack.Screen name="Cart" component={CartScreen} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="CustomerOrder" component={CustomerOrderScreen} />
          <Stack.Screen name="Settings" component={SettingsScreen} />
          <Stack.Screen name="Payment" component={PaymentScreen} />
          <Stack.Screen name="Products" component={ProductScreen} />
          <Stack.Screen name="AddProduct" component={AddProductScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
};
