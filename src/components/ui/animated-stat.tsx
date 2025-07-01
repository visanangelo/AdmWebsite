import { useInView } from "react-intersection-observer"
import CountUp from "react-countup"

interface AnimatedStatProps {
  value: number
  suffix?: string
  duration?: number
  className?: string
}

export function AnimatedStat({
  value,
  suffix = "",
  duration = 2,
  className = "",
}: AnimatedStatProps) {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  })

  return (
    <div ref={ref} className={className}>
      {inView && (
        <CountUp
          end={value}
          duration={duration}
          suffix={suffix}
          separator=","
          enableScrollSpy
          scrollSpyOnce
        />
      )}
    </div>
  )
} 