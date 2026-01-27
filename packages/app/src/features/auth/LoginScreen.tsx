/// <reference types="nativewind/types" />
import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
// import { styled } from 'nativewind';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

const StyledView = View;
const StyledText = Text;
const StyledKeyboardAvoidingView = KeyboardAvoidingView;

export function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = () => {
        setIsLoading(true);
        // Simulate login for now
        setTimeout(() => {
            setIsLoading(false);
            alert('Login pressed with email: ' + email);
        }, 1500);
    };

    return (
        <StyledKeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            className="flex-1 bg-gray-50"
        >
            <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
                <StyledView className="flex-1 px-6 pt-20 pb-10">
                    <StyledView className="items-center mb-10">
                        <StyledView className="w-16 h-16 bg-blue-600 rounded-2xl items-center justify-center mb-4 shadow-lg">
                            <StyledText className="text-white text-3xl font-bold text-center leading-[64px]">I</StyledText>
                        </StyledView>
                        <StyledText className="text-2xl font-bold text-gray-900">InventoryPro</StyledText>
                        <StyledText className="text-gray-500 mt-1">Sign in to your account</StyledText>
                    </StyledView>

                    <StyledView className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                        <Input
                            label="Email Address"
                            placeholder="name@example.com"
                            value={email}
                            onChangeText={setEmail}
                            autoCapitalize="none"
                        />

                        <Input
                            label="Password"
                            placeholder="••••••••"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry
                        />

                        <Button
                            title="Sign In"
                            onPress={handleLogin}
                            isLoading={isLoading}
                            className="mt-4"
                        />

                        <StyledView className="flex-row justify-center mt-6">
                            <StyledText className="text-gray-500">Don't have an account? </StyledText>
                            <StyledText className="text-blue-600 font-semibold">Sign Up</StyledText>
                        </StyledView>
                    </StyledView>

                    <StyledView className="mt-auto items-center">
                        <StyledText className="text-gray-400 text-xs">v0.1.0 • Universal Codebase</StyledText>
                    </StyledView>
                </StyledView>
            </ScrollView>
        </StyledKeyboardAvoidingView>
    );
}
