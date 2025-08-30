import React, { useMemo, useState } from "react";
import { LayoutChangeEvent, PanResponder, View } from "react-native";
import Svg, { Circle, Line, Path, Rect } from "react-native-svg"; // no G/Text needed now

type Props = {
  labels: string[];
  values: number[];
  onFocusIndex?: (i: number | null) => void;
  strokeColor: string;
  gridColor: string;
  areaFill?: string;
};

export default function TrendChart({
  labels, values, onFocusIndex, strokeColor, gridColor, areaFill,
}: Props) {
  // measured size (re-render on change)
  const [size, setSize] = useState({ w: 320, h: 180 });
  const P = 16; // padding inside plot

  const { path, area, xAt, yAt, min, max } = useMemo(() => {
    const { w, h } = size;
    const n = Math.max(1, values.length);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const X = (i: number) => P + (i * (w - 2 * P)) / (n - 1 || 1);
    const Y = (v: number) => {
      if (max === min) return h / 2;
      const t = (v - min) / (max - min);
      return h - P - t * (h - 2 * P);
    };

    let d = "";
    values.forEach((v, i) => {
      const x = X(i), y = Y(v);
      d += (i === 0 ? `M ${x} ${y}` : ` L ${x} ${y}`);
    });

    let a = "";
    if (values.length > 1) {
      a = `M ${X(0)} ${Y(values[0])}`;
      values.forEach((v, i) => { a += ` L ${X(i)} ${Y(v)}`; });
      a += ` L ${X(values.length - 1)} ${size.h - P} L ${X(0)} ${size.h - P} Z`;
    }

    return { path: d, area: a, xAt: X, yAt: Y, min, max };
  }, [values, size]);

  // pan to select nearest index
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: (e) => handleMove(e.nativeEvent.locationX),
        onPanResponderMove: (e) => handleMove(e.nativeEvent.locationX),
        onPanResponderRelease: () => onFocusIndex?.(null),
        onPanResponderTerminate: () => onFocusIndex?.(null),
      }),
    // depends only on values length & size, not the values array object
    [values.length, size],
  );

  function handleMove(x: number) {
    const n = Math.max(1, values.length);
    const left = P, right = size.w - P;
    const clamped = Math.max(left, Math.min(right, x));
    const i = Math.round(((clamped - left) / (right - left || 1)) * (n - 1));
    onFocusIndex?.(i);
  }

  function onLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout;
    if (width && height) setSize({ w: Math.round(width), h: Math.round(height) });
  }

  // numeric grid positions (no % strings)
  const y25 = size.h * 0.25;
  const y50 = size.h * 0.50;
  const y75 = size.h * 0.75;

  return (
    <View style={{ height: 220 }} onLayout={onLayout}>
      <Svg width={size.w} height={size.h} viewBox={`0 0 ${size.w} ${size.h}`}>
        {/* grid */}
        <Line x1={0} x2={size.w} y1={y25} y2={y25} stroke={gridColor} strokeWidth={1} />
        <Line x1={0} x2={size.w} y1={y50} y2={y50} stroke={gridColor} strokeWidth={1} />
        <Line x1={0} x2={size.w} y1={y75} y2={y75} stroke={gridColor} strokeWidth={1} />

        {/* area under line */}
        {area ? <Path d={area} fill={areaFill ?? "transparent"} /> : null}

        {/* line */}
        <Path d={path} stroke={strokeColor} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />

        {/* invisible overlay to capture gestures inside the SVG */}
        <Rect
          x={0}
          y={0}
          width={size.w}
          height={size.h}
          fill="transparent"
          {...pan.panHandlers as any}
        />

        {/* dummy marker keeps svg tree happy */}
        <Circle cx={-999} cy={-999} r={0} fill="transparent" />
      </Svg>
    </View>
  );
}
