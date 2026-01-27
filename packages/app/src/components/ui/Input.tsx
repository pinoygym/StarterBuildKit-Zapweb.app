/// <reference types="nativewind/types" />
import React from 'react';
import { View, TextInput, Text } from 'react-native';
// import { styled } from 'nativewind'; // removed due to runtime error

const StyledView = View;
const StyledTextInput = TextInput;
const StyledText = Text;

interface InputProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    secureTextEntry?: boolean;
    error?: string;
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    className?: string;
}

export function Input({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry,
    error,
    autoCapitalize = 'sentences',
    className = ''
}: InputProps) {
    return (
        <StyledView className={`mb-4 ${className}`}>
            {label && (
                <StyledText className="text-gray-700 font-medium mb-1 ml-1 text-sm">
                    {label}
                </StyledText>
            )}
            <StyledTextInput
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
                autoCapitalize={autoCapitalize}
                className={`w-full bg-white border ${error ? 'border-red-500' : 'border-gray-200'} rounded-lg px-4 py-3 text-gray-900 focus:border-blue-500`}
                placeholderTextColor="#9CA3AF"
            />
            {error && (
                <StyledText className="text-red-500 text-xs mt-1 ml-1">
                    {error}
                </StyledText>
            )}
        </StyledView>
    );
}
