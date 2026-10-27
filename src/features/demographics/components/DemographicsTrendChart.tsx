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
import type { DemographicsBucket } from '@/types/api'
import { formatAxisHour, formatCount } from '@/utils/format'
import { hourlyTicks } from '@/utils/time'

export interface DemographicsTrendChartProps {
  buckets: readonly DemographicsBucket[]
  timeZone: string
  dayStart: number
  dayEnd: number
  liveAt: number | null
  height?: number
}

export function DemographicsTrendChart({
  buckets,
  timeZone,
  dayStart,
  dayEnd,
  liveAt,
  height = 260,
}: DemographicsTrendChartProps) {
  const data = buckets.map((b) => ({ utc: b.utc, male: b.male, female: b.female }))
  return (
    <figure style={{ margin: 0 }}>
      <figcaption className="visually-hidden">Hourly average male and female visitors.</figcaption>
      <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 700, height }}>
        <AreaChart data={data} margin={{ top: 22, right: 16, bottom: 8, left: 4 }}>
          <defs>
            <linearGradient id="maleFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.male} stopOpacity={0.2} />
              <stop offset="100%" stopColor={CHART_COLORS.male} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="femaleFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS.female} stopOpacity={0.25} />
              <stop offset="100%" stopColor={CHART_COLORS.female} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="utc"
            type="number"
            scale="time"
            domain={[dayStart, dayEnd]}
            ticks={hourlyTicks(dayStart, dayEnd, 2)}
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
            dataKey="male"
            name="Male"
            stroke={CHART_COLORS.male}
            strokeWidth={2}
            fill="url(#maleFill)"
            isAnimationActive={false}
          />
          <Area
            type="monotone"
            dataKey="female"
            name="Female"
            stroke={CHART_COLORS.female}
            strokeWidth={2}
            strokeDasharray="6 3"
            fill="url(#femaleFill)"
            isAnimationActive={false}
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
        caption="Hourly average visitors by gender"
        columns={['Hour', 'Male', 'Female']}
        rows={buckets.map((b) => [
          formatAxisHour(b.utc, timeZone),
          formatCount(b.male),
          formatCount(b.female),
        ])}
      />
    </figure>
  )
}
