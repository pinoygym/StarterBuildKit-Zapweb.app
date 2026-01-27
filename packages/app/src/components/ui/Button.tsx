/// <reference types="nativewind/types" />
import React from 'react';
import { Pressable, Text, ActivityIndicator, View } from 'react-native';
// import { styled } from 'nativewind'; // removed due to runtime error

const StyledPressable = Pressable;
const StyledText = Text;

interface ButtonProps {
    onPress: () => void;
    title: string;
    variant?: 'primary' | 'outline';
    isLoading?: boolean;
    className?: string;
}

export function Button({
    onPress,
    title,
    variant = 'primary',
    isLoading = false,
    className = ''
}: ButtonProps) {
    const baseStyles = "py-3 px-6 rounded-lg flex-row items-center justify-center";
    const variantStyles = variant === 'primary'
        ? "bg-blue-600 active:bg-blue-700"
        : "border border-gray-300 bg-transparent active:bg-gray-50";

    const textStyles = variant === 'primary' ? "text-white" : "text-gray-700";

    return (
        <StyledPressable
            onPress={onPress}
            disabled={isLoading}
            className={`${baseStyles} ${variantStyles} ${className} ${isLoading ? 'opacity-70' : ''}`}
        >
            {isLoading && <ActivityIndicator size="small" color={variant === 'primary' ? 'white' : 'blue'} />}
            <StyledText className={`${textStyles} font-semibold text-center ${isLoading ? 'ml-2' : ''}`}>
                {title}
            </StyledText>
        </StyledPressable>
    );
}
