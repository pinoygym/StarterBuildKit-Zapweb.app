import React from 'react';
import { View, Text } from 'react-native';

export function Simple() {
    return (
        <View style={{ flex: 1, backgroundColor: 'blue', padding: 20 }}>
            <Text style={{ color: 'white', fontSize: 20 }}>
                Hello Simple (No NativeWind)
            </Text>
        </View>
    );
}
