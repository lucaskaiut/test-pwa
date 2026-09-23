import { mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = resolve(root, 'public/splash')
const icon = resolve(root, 'public/pwa-512x512.png')

const devices = [
  { width: 640, height: 1136, deviceWidth: 320, deviceHeight: 568, dpr: 2 },
  { width: 750, height: 1334, deviceWidth: 375, deviceHeight: 667, dpr: 2 },
  { width: 1125, height: 2436, deviceWidth: 375, deviceHeight: 812, dpr: 3 },
  { width: 1170, height: 2532, deviceWidth: 390, deviceHeight: 844, dpr: 3 },
  { width: 1179, height: 2556, deviceWidth: 393, deviceHeight: 852, dpr: 3 },
  { width: 828, height: 1792, deviceWidth: 414, deviceHeight: 896, dpr: 2 },
  { width: 1242, height: 2688, deviceWidth: 414, deviceHeight: 896, dpr: 3 },
  { width: 1284, height: 2778, deviceWidth: 428, deviceHeight: 926, dpr: 3 },
  { width: 1290, height: 2796, deviceWidth: 430, deviceHeight: 932, dpr: 3 },
  { width: 1488, height: 2266, deviceWidth: 744, deviceHeight: 1133, dpr: 2 },
  { width: 1536, height: 2048, deviceWidth: 768, deviceHeight: 1024, dpr: 2 },
  { width: 1620, height: 2160, deviceWidth: 810, deviceHeight: 1080, dpr: 2 },
  { width: 1668, height: 2388, deviceWidth: 834, deviceHeight: 1194, dpr: 2 },
  { width: 2048, height: 2732, deviceWidth: 1024, deviceHeight: 1366, dpr: 2 },
]

const background = { r: 255, g: 255, b: 255, alpha: 1 }

await mkdir(outDir, { recursive: true })

for (const device of devices) {
  const iconSize = Math.round(Math.min(device.width, device.height) * 0.22)
  const iconBuffer = await sharp(icon).resize(iconSize, iconSize).toBuffer()

  await sharp({
    create: {
      width: device.width,
      height: device.height,
      channels: 4,
      background,
    },
  })
    .composite([{ input: iconBuffer, gravity: 'center' }])
    .png()
    .toFile(resolve(outDir, `apple-splash-${device.width}-${device.height}.png`))

  console.log(`generated apple-splash-${device.width}-${device.height}.png`)
}
