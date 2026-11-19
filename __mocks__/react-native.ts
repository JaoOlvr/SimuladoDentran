export const Platform = {
  OS: 'android',
  select: (obj: any) => obj.android || obj.default,
};

export const StyleSheet = {
  create: (styles: any) => styles,
};

export const Alert = {
  alert: jest.fn(),
};

export const View = 'View';
export const Text = 'Text';
export const TouchableOpacity = 'TouchableOpacity';
export const ScrollView = 'ScrollView';
export const FlatList = 'FlatList';
export const TextInput = 'TextInput';
export const ActivityIndicator = 'ActivityIndicator';
export const Modal = 'Modal';
export const SafeAreaView = 'SafeAreaView';
export const Animated = {
  Value: jest.fn(() => ({
    interpolate: jest.fn(),
  })),
  timing: jest.fn(() => ({
    start: jest.fn((cb) => cb && cb()),
  })),
  View: 'Animated.View',
};

export default {
  Platform,
  StyleSheet,
  Alert,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  SafeAreaView,
  Animated,
};

