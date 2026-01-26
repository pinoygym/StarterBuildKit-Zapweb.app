import React from 'react';
import { View, Text } from 'react-native';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);

export function Hello() {
    return (
        <StyledView className="flex-1 items-center justify-center bg-blue-500 p-4">
            <StyledText className="text-white text-xl font-bold">
                Connected to MEmu! 🚀
            </StyledText>
            <StyledText className="text-white mt-2">
                Hot Reload is working!
            </StyledText>
        </StyledView>
    );
}
