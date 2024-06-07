import { Platform, StatusBar, StyleSheet, Text, View } from 'react-native'
import React from 'react'

const signin = () => {
  return (
    <View style={styles.container}>
      <Text>signin</Text>
    </View>
  )
}

export default signin

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight + 20 : 0,
    width: "100%",
    backgroundColor: "#fff",
  },
});