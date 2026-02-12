import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/theme';

const Logo = ({ size = 40 }) => {
  const dotSize = size * 0.3;
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {/* Colorful gradient circle representing JudgeX logo */}
      <View style={[styles.mainCircle, { width: size, height: size, borderRadius: size / 2 }]}>
        <View style={[styles.redDot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />
        <View style={[styles.yellowDot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />
        <View style={[styles.blueDot, { width: dotSize, height: dotSize, borderRadius: dotSize / 2 }]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainCircle: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  redDot: {
    position: 'absolute',
    backgroundColor: '#FF6B6B',
    top: '10%',
    left: '20%',
  },
  yellowDot: {
    position: 'absolute',
    backgroundColor: '#FFD93D',
    top: '35%',
    left: '45%',
  },
  blueDot: {
    position: 'absolute',
    backgroundColor: '#6BCB77',
    bottom: '20%',
    left: '25%',
  },
});

export default Logo;
