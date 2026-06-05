'use client'

import dynamic from 'next/dynamic'

const DotLottieReact = dynamic(
  () => import('@lottiefiles/dotlottie-react').then((m) => ({ default: m.DotLottieReact })),
  { ssr: false, loading: () => <div /> }
)

interface Props {
  src: string
  size?: number
  loop?: boolean
}

export default function LottiePlayer({ src, size = 120, loop = false }: Props) {
  return (
    <DotLottieReact
      src={src}
      autoplay
      loop={loop}
      style={{ width: size, height: size }}
    />
  )
}
