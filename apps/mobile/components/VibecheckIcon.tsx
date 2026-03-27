import { View } from 'react-native';

/**
 * VibeCheck app icon — black background variant from the brand SVG.
 *
 * Geometry derived from vibecheck_logo_suite.svg (dark bg icon at x=170,y=72):
 *   Rounded square 100×100 rx=22, fill=#000
 *   V path: M22 24 L50 76 L78 24 (stroke #FF2D55, width 6)
 *   Live dot: cx=67 cy=20 r=6 fill=#FF2D55
 *
 * All coordinates scaled by size/100.
 */
export default function VibecheckIcon({ size = 80 }: { size?: number }) {
  const s = size / 100;
  const radius = Math.round(22 * s);
  const stroke = 6 * s;

  // V left arm: (22,24) → (50,76)
  const leftLen = Math.sqrt((50 - 22) ** 2 + (76 - 24) ** 2) * s; // ≈47.2 * s
  const leftAngleDeg = (Math.atan2(76 - 24, 50 - 22) * 180) / Math.PI; // ≈61.7°
  const leftMidX = ((22 + 50) / 2) * s; // 36 * s
  const leftMidY = ((24 + 76) / 2) * s; // 50 * s

  // V right arm: (50,76) → (78,24)
  const rightLen = Math.sqrt((78 - 50) ** 2 + (24 - 76) ** 2) * s;
  const rightAngleDeg = (Math.atan2(24 - 76, 78 - 50) * 180) / Math.PI; // ≈-61.7°
  const rightMidX = ((50 + 78) / 2) * s; // 64 * s
  const rightMidY = ((76 + 24) / 2) * s; // 50 * s

  // Live dot: cx=67, cy=20, r=6
  const dotR = 6 * s;
  const dotX = 67 * s;
  const dotY = 20 * s;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: '#000000',
      }}
    >
      {/* Left arm of V */}
      <View
        style={{
          position: 'absolute',
          width: leftLen,
          height: stroke,
          borderRadius: stroke / 2,
          backgroundColor: '#FF2D55',
          left: leftMidX - leftLen / 2,
          top: leftMidY - stroke / 2,
          transform: [{ rotate: `${leftAngleDeg}deg` }],
        }}
      />
      {/* Right arm of V */}
      <View
        style={{
          position: 'absolute',
          width: rightLen,
          height: stroke,
          borderRadius: stroke / 2,
          backgroundColor: '#FF2D55',
          left: rightMidX - rightLen / 2,
          top: rightMidY - stroke / 2,
          transform: [{ rotate: `${rightAngleDeg}deg` }],
        }}
      />
      {/* Live dot */}
      <View
        style={{
          position: 'absolute',
          width: dotR * 2,
          height: dotR * 2,
          borderRadius: dotR,
          backgroundColor: '#FF2D55',
          left: dotX - dotR,
          top: dotY - dotR,
        }}
      />
    </View>
  );
}
