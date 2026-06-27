import { useState } from 'react';
import { View, Text, LayoutChangeEvent } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { useAppTheme } from '@theme/ThemeProvider';
import { tokens } from '@src/theme/tokens';
import { niceCeil } from '../format';

export type BarDatum = {
  label: string;
  value: number;
};

type Props = {
  data: BarDatum[];
  /** Formats a value for the y-axis ticks and bar tooltips. */
  formatValue?: (v: number) => string;
  height?: number;
  /** Accent colour for bars; defaults to theme accent. */
  color?: string;
};

const PADDING_LEFT = 56;
const PADDING_BOTTOM = 34;
const PADDING_TOP = 12;
const PADDING_RIGHT = 12;

/**
 * Minimal dependency-free bar chart built on react-native-svg. Replaces the
 * Access PivotChart graphs — it renders the same bucketed series the API returns.
 */
export function BarChart({ data, formatValue = String, height = 280, color }: Props) {
  const theme = useAppTheme();
  const [width, setWidth] = useState(0);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const barColor = color ?? theme.colors.accent;
  const axisColor = theme.colors.border;
  const labelColor = theme.colors.textMuted;

  const plotWidth = Math.max(width - PADDING_LEFT - PADDING_RIGHT, 0);
  const plotHeight = height - PADDING_TOP - PADDING_BOTTOM;
  const maxValue = Math.max(1, ...data.map((d) => d.value));
  // Round the axis max up to a "nice" number for readable gridlines.
  const niceMax = niceCeil(maxValue);

  const tickCount = 4;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => (niceMax / tickCount) * i);

  const n = data.length;
  const slot = n > 0 ? plotWidth / n : 0;
  const barWidth = Math.min(slot * 0.65, 48);
  // With many buckets, only label every k-th tick to avoid overlap.
  const labelStep = n > 0 ? Math.ceil(n / Math.max(1, Math.floor(plotWidth / 48))) : 1;

  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          {/* Y gridlines + tick labels */}
          {ticks.map((t, i) => {
            const y = PADDING_TOP + plotHeight - (t / niceMax) * plotHeight;
            return (
              <G key={`tickwrap-${i}`}>
                <Line
                  x1={PADDING_LEFT}
                  y1={y}
                  x2={width - PADDING_RIGHT}
                  y2={y}
                  stroke={axisColor}
                  strokeWidth={1}
                  strokeDasharray={i === 0 ? undefined : '3,4'}
                />
                <SvgText
                  x={PADDING_LEFT - 8}
                  y={y + 4}
                  fontSize={10}
                  fill={labelColor}
                  textAnchor="end"
                >
                  {formatValue(t)}
                </SvgText>
              </G>
            );
          })}

          {/* Bars + x labels */}
          {data.map((d, i) => {
            const barHeight = (d.value / niceMax) * plotHeight;
            const x = PADDING_LEFT + slot * i + (slot - barWidth) / 2;
            const y = PADDING_TOP + plotHeight - barHeight;
            const showLabel = i % labelStep === 0;
            return (
              <G key={`bar-${d.label}-${i}`}>
                <Rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 0)}
                  rx={3}
                  fill={barColor}
                />
                {showLabel ? (
                  <SvgText
                    x={x + barWidth / 2}
                    y={height - PADDING_BOTTOM + 16}
                    fontSize={10}
                    fill={labelColor}
                    textAnchor="middle"
                  >
                    {d.label}
                  </SvgText>
                ) : null}
              </G>
            );
          })}
        </Svg>
      ) : (
        <View style={{ height }} />
      )}
      {data.length === 0 ? (
        <Text
          style={{
            position: 'absolute',
            alignSelf: 'center',
            top: height / 2 - 10,
            color: theme.colors.textMuted,
            fontSize: 14,
          }}
        >
          No data for this range
        </Text>
      ) : null}
    </View>
  );
}

// Re-export spacing so callers can wrap the chart consistently.
export const CHART_GAP = tokens.spacing.md;
