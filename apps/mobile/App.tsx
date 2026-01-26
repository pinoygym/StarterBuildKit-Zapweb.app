import { Hello } from '@inventory-pro/app/src/Hello';
import './global.css';
import { View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Hello />
    </View>
  );
}
