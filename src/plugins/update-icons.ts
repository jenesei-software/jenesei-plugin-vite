import sharp from 'sharp'

import fs from 'node:fs'
import path from 'node:path'
import { logger } from '../logger'

export function generateManifestIcons(props: {
  path: string
  prefix: string
  sizesBackgroundWhite: number[]
  sizesBackgroundTransparent: number[]
  sizesFavicon: number[]
}) {
  const icons = [
    ...props.sizesBackgroundTransparent.map(size => ({
      src: `${props.path}/${props.prefix}-${size}x${size}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'any'
    })),
    ...props.sizesBackgroundWhite.map(size => ({
      src: `${props.path}/${props.prefix}-${size}x${size}-white.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'any'
    })),
    ...props.sizesFavicon.map(size => ({
      src: `${props.path}/${props.prefix}-${size}x${size}-favicon.ico`,
      sizes: `${size}x${size}`,
      type: 'image/x-icon',
      purpose: 'any'
    }))
  ]
  return icons
}

export function pluginUpdateIcons(props: {
  sizesBackgroundWhite: number[]
  sizesBackgroundTransparent: number[]
  sizesFavicon: number[]
  prefix: string
  pathInputFile: string
  pathOutputDirectory: string
}) {
  return {
    name: 'plugin-update-icons',
    buildStart() {
      const pathInputFile = props.pathInputFile
      const pathOutputDirectory = props.pathOutputDirectory

      if (!fs.existsSync(pathOutputDirectory)) {
        fs.mkdirSync(pathOutputDirectory, { recursive: true })
      }

      props.sizesBackgroundTransparent.forEach(size => {
        sharp(pathInputFile)
          .resize(size, size)
          .toFile(path.join(pathOutputDirectory, `${props.prefix}-${size}x${size}.png`), err => {
            if (err) {
              logger.warn(`UpdateIcons: Error generate ${size}x${size}.`, err)
            } else {
              logger.info(`UpdateIcons: Create ${size}x${size}.`)
            }
          })
      })
      props.sizesBackgroundWhite.forEach(size => {
        sharp(pathInputFile)
          .resize(size, size)
          .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } })
          .toFile(path.join(pathOutputDirectory, `${props.prefix}-${size}x${size}-white.png`), err => {
            if (err) {
              logger.warn(`UpdateIcons: Error generate white ${size}x${size}.`, err)
            } else {
              logger.info(`UpdateIcons: Create ${size}x${size} white.`)
            }
          })
      })
      props.sizesFavicon.forEach(size => {
        sharp(pathInputFile)
          .resize(size, size)
          .toFile(path.join(pathOutputDirectory, `${props.prefix}-${size}x${size}-favicon.ico`), err => {
            if (err) {
              logger.warn(`UpdateIcons: Error generate favicon ${size}x${size}.`, err)
            } else {
              logger.info(`UpdateIcons: Create ${size}x${size} favicon.`)
            }
          })
      })
    }
  }
}
