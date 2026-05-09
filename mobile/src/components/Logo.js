import React from 'react';
import { View, Image, StyleSheet } from 'react-native';

const Logo = ({ size = 40 }) => {
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Image 
        source={require('../../assets/logo.png')} 
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Logo;
