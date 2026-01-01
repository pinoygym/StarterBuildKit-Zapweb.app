import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Button, Card, Snackbar } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { login, clearError, selectAuthLoading, selectAuthError } from '../../store/slices/authSlice';
import { setError, setSuccessMessage } from '../../store/slices/appSlice';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [branchCode, setBranchCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(selectAuthLoading);
  const error = useAppSelector(selectAuthError);

  useEffect(() => {
    // Clear any previous errors when component mounts
    dispatch(clearError());
  }, [dispatch]);

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        dispatch(setError('Please fill in all required fields'));
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        dispatch(setError('Please enter a valid email address'));
        return;
      }

      await dispatch(login({ email, password, branchId: branchCode })).unwrap();
      dispatch(setSuccessMessage('Login successful!'));
    } catch (error: any) {
      // Error is already handled by the slice
      console.error('Login error:', error);
    }
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Please contact your system administrator to reset your password.',
      [{ text: 'OK' }]
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.logoContainer}>
        <MaterialCommunityIcons name="cash-register" size={80} color="#6200ee" />
        <Text style={styles.logoText}>Mobile POS</Text>
        <Text style={styles.subtitle}>Inventory Management System</Text>
      </View>

      <Card style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="email" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              editable={!isLoading}
            />
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="lock" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
              editable={!isLoading}
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              disabled={isLoading}
            >
              <MaterialCommunityIcons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="store" size={20} color="#666" />
            <TextInput
              style={styles.input}
              placeholder="Branch Code (Optional)"
              value={branchCode}
              onChangeText={setBranchCode}
              autoCapitalize="characters"
              editable={!isLoading}
            />
          </View>

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={isLoading}
            disabled={isLoading}
            style={styles.loginButton}
            contentStyle={styles.loginButtonContent}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </Button>

          <TouchableOpacity 
            style={styles.forgotPasswordButton}
            onPress={handleForgotPassword}
            disabled={isLoading}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>

      <View style={styles.footer}>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>

      {/* Error Snackbar */}
      <Snackbar
        visible={!!error}
        onDismiss={() => dispatch(clearError())}
        duration={3000}
        style={styles.errorSnackbar}
        action={{
          label: 'Dismiss',
          onPress: () => dispatch(clearError()),
        }}
      >
        {error}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
  },
  card: {
    marginHorizontal: 10,
    elevation: 4,
    borderRadius: 12,
  },
  cardContent: {
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  input: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#333',
  },
  loginButton: {
    marginTop: 20,
    borderRadius: 8,
  },
  loginButtonContent: {
    paddingVertical: 8,
  },
  forgotPasswordButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#6200ee',
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  version: {
    fontSize: 12,
    color: '#999',
  },
  errorSnackbar: {
    backgroundColor: '#f44336',
  },
});