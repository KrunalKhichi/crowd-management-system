import { Pie, PieChart, ResponsiveContainer } from 'recharts'
import { CHART_COLORS } from '@/components/charts/chartTheme'
import { formatCount, formatPercent } from '@/utils/format'
import styles from './Demographics.module.css'

interface DemographicsDonutProps {
  male: number
  female: number
  /** What the numbers represent, e.g. "Average for 15:00 – 16:00". */
  caption: string
}

export function DemographicsDonut({ male, female, caption }: DemographicsDonutProps) {
  const total = male + female
  const malePct = total > 0 ? (male / total) * 100 : 0
  const femalePct = total > 0 ? 100 - malePct : 0
  const slices = [
    { name: 'Male', value: male, fill: CHART_COLORS.male },
    { name: 'Female', value: female, fill: CHART_COLORS.female },
  ]

  return (
    <figure className={styles.donutFigure}>
      <div className={styles.donutWrap} aria-hidden="true">
        <ResponsiveContainer width="100%" height={180} initialDimension={{ width: 180, height: 180 }}>
          <PieChart>
            <Pie
              data={slices}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              startAngle={90}
              endAngle={-270}
              paddingAngle={total > 0 && male > 0 && female > 0 ? 3 : 0}
              stroke="none"
              isAnimationActive={false}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className={styles.donutCenter}>
          <span>Total Crowd</span>
          <strong className="tabular">{formatCount(total)}</strong>
        </div>
      </div>
      <figcaption>
        <p className={styles.caption}>{caption}</p>
        <ul className={styles.legendList}>
          <li>
            <span className={styles.swatch} style={{ background: CHART_COLORS.male }} aria-hidden="true" />
            <strong className="tabular">{formatPercent(malePct)}</strong> Males
            <span className={styles.count}>{formatCount(male)}</span>
          </li>
          <li>
            <span className={styles.swatch} style={{ background: CHART_COLORS.female }} aria-hidden="true" />
            <strong className="tabular">{formatPercent(femalePct)}</strong> Females
            <span className={styles.count}>{formatCount(female)}</span>
          </li>
        </ul>
      </figcaption>
    </figure>
  )
}
