import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ChartDataTable } from '@/components/charts/ChartDataTable'
import { ChartTooltip } from '@/components/charts/ChartTooltip'
import { AXIS_LABEL, AXIS_TICK, CHART_COLORS } from '@/components/charts/chartTheme'
import { LiveMarkerLabel } from '@/components/charts/LiveMarkerLabel'
import type { OccupancyBucket } from '@/types/api'
import { formatAxisHour, formatCount } from '@/utils/format'
import { hourlyTicks } from '@/utils/time'

export interface OccupancyChartProps {
  buckets: readonly OccupancyBucket[]
  timeZone: string
  dayStart: number
  dayEnd: number
  /** Current time for the LIVE marker; null for past days. */
  liveAt: number | null
  height?: number
}

export function OccupancyChart({
  buckets,
  timeZone,
  dayStart,
  dayEnd,
  liveAt,
  height = 280,
}: OccupancyChartProps) {
  const data = buckets.map((b) => ({ utc: b.utc, avg: b.avg }))
  const ticks = hourlyTicks(dayStart, dayEnd, 2)
  const peak = buckets.reduce<OccupancyBucket | null>((max, b) => (!max || b.avg > max.avg ? b : max), null)
  const latest = buckets.at(-1)

  return (
    <figure style={{ margin: 0 }}>
      <figcaption className="visually-hidden">
        Hourly average occupancy.
        {latest && ` Latest: ${formatCount(latest.avg)} at ${formatAxisHour(latest.utc, timeZone)}.`}
        {peak && ` Peak: ${formatCount(peak.avg)} at ${formatAxisHour(peak.utc, timeZone)}.`}
      </figcaption>
      <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 800, height }}>
        <AreaChart data={data} margin={{ top: 22, right: 16, bottom: 8, left: 4 }}>
          <defs>
            <linearGradient id="occupancyFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.occupancy} stopOpacity={0.22} />
              <stop offset="100%" stopColor={CHART_COLORS.occupancy} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_COLORS.grid} vertical />
          <XAxis
            dataKey="utc"
            type="number"
            scale="time"
            domain={[dayStart, dayEnd]}
            ticks={ticks}
            tickFormatter={(v: number) => formatAxisHour(v, timeZone)}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            label={{ value: 'Time', position: 'insideBottom', offset: -4, ...AXIS_LABEL }}
            height={40}
          />
          <YAxis
            allowDecimals={false}
            tick={AXIS_TICK}
            tickLine={false}
            axisLine={false}
            width={52}
            label={{ value: 'Count', angle: -90, position: 'insideLeft', offset: 12, ...AXIS_LABEL }}
          />
          <Tooltip content={<ChartTooltip timeZone={timeZone} />} />
          <Area
            type="monotone"
            dataKey="avg"
            name="Avg occupancy"
            stroke={CHART_COLORS.occupancy}
            strokeWidth={2}
            fill="url(#occupancyFill)"
            isAnimationActive={false}
            connectNulls={false}
          />
          {liveAt !== null && (
            <ReferenceLine
              x={liveAt}
              stroke={CHART_COLORS.live}
              strokeDasharray="4 3"
              label={<LiveMarkerLabel />}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
      <ChartDataTable
        caption="Hourly average occupancy"
        columns={['Hour', 'Average occupancy']}
        rows={buckets.map((b) => [formatAxisHour(b.utc, timeZone), formatCount(b.avg)])}
      />
    </figure>
  )
}
