import React from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView } from 'expo-camera';

interface ScannerCameraProps {
  onScan: (token: string) => void;
  active: boolean;
}

const VIEWFINDER_SIZE = 260;

export default function ScannerCamera({ onScan, active }: ScannerCameraProps) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={
          active
            ? ({ data }) => {
                if (data) onScan(data);
              }
            : undefined
        }
      />

      {/* Viewfinder overlay */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Top */}
        <View style={styles.overlayTop} />
        {/* Middle row */}
        <View style={styles.middleRow}>
          <View style={styles.overlaySide} />
          <View style={styles.viewfinder}>
            {/* Corner brackets */}
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <View style={styles.overlaySide} />
        </View>
        {/* Bottom */}
        <View style={styles.overlayBottom} />
      </View>
    </View>
  );
}

const OVERLAY_COLOR = 'rgba(0, 0, 0, 0.6)';
const CORNER_SIZE = 28;
const CORNER_WIDTH = 3;
const CORNER_COLOR = '#BFFF00';

const styles = StyleSheet.create({
  overlayTop: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  middleRow: {
    flexDirection: 'row',
    height: VIEWFINDER_SIZE,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  viewfinder: {
    width: VIEWFINDER_SIZE,
    height: VIEWFINDER_SIZE,
    borderRadius: 16,
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: OVERLAY_COLOR,
  },
  corner: {
    position: 'absolute',
    width: CORNER_SIZE,
    height: CORNER_SIZE,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderTopLeftRadius: 16,
    borderColor: CORNER_COLOR,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderTopRightRadius: 16,
    borderColor: CORNER_COLOR,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderLeftWidth: CORNER_WIDTH,
    borderBottomLeftRadius: 16,
    borderColor: CORNER_COLOR,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_WIDTH,
    borderRightWidth: CORNER_WIDTH,
    borderBottomRightRadius: 16,
    borderColor: CORNER_COLOR,
  },
});
