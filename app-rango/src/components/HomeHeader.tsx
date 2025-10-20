import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, iconSize } from '../utils/responsive';
import theme from '../styles/theme';

interface HomeHeaderProps {
  address: string;
  onAddressPress: () => void;
}

const HomeHeader: React.FC<HomeHeaderProps> = ({ address, onAddressPress }) => {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.addressContainer} onPress={onAddressPress}>
        <Text style={styles.addressText} numberOfLines={1}>
          {address}
        </Text>
        <Ionicons name="chevron-down" size={iconSize.sm} color={theme.colors.text} style={styles.arrowIcon} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.backgroundLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: '80%',
  },
  addressText: {
    fontSize: fontSize.md,
    fontWeight: theme.typography.fontWeight.semibold,
    color: theme.colors.text,
    marginRight: spacing.xs,
  },
  arrowIcon: {
    marginLeft: spacing.xs,
  },
});

export default HomeHeader;