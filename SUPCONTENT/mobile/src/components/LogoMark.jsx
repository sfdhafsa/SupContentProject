import { StyleSheet, View } from 'react-native';

export default function LogoMark({ size = 22, radius = 8 }) {
  const cell = Math.max(3, Math.floor(size / 7));

  return (
    <View style={[styles.logo, { width: size, height: size, borderRadius: radius }]}>
      <View style={[styles.grid, { width: size * 0.54, height: size * 0.54, gap: 2 }]}>
        {Array.from({ length: 6 }).map((_, index) => (
          <View
            key={index}
            style={[styles.cell, { width: cell, height: cell, borderRadius: 1 }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logo: {
    alignItems: 'center',
    backgroundColor: '#ef0d1a',
    justifyContent: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    backgroundColor: '#ffffff',
  },
});
