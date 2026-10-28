import sharp from 'sharp';
import type { Plugin } from 'vite';

import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../logger';

const defaultFaviconFileName = 'favicon.ico';
const defaultFaviconDensity = 384;

function iconFileName(prefix: string, size: number, suffix = '') {
  return `${prefix}-${size}x${size}${suffix}`;
}

function joinUrlPath(base: string, fileName: string) {
  const normalized = base.replace(/\/+$/, '');

  return normalized ? `${normalized}/${fileName}` : `/${fileName}`;
}

function normalizeFaviconSizes(sizes: number[]) {
  const unique = [...new Set(sizes)];

  for (const size of unique) {
    if (!Number.isInteger(size) || size < 1 || size > 256) {
      throw new Error(`UpdateIcons: favicon size must be an integer from 1 to 256, got ${size}.`);
    }
  }

  return unique;
}

/**
 * A single `.ico` may carry several PNG frames. Windows and every current browser read that
 * layout, and crawlers still ask for `/favicon.ico` even when the page links an SVG icon.
 */
function buildIco(frames: Array<{ data: Buffer; size: number }>) {
  if (frames.length === 0) {
    throw new Error('UpdateIcons: at least one favicon frame is required.');
  }

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(frames.length, 4);

  let offset = header.length + 16 * frames.length;

  const entries = frames.map(({ data, size }) => {
    const entry = Buffer.alloc(16);

    // A zero byte means 256 px in the ICO directory.
    entry.writeUInt8(size >= 256 ? 0 : size, 0);
    entry.writeUInt8(size >= 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette size
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);

    offset += data.length;

    return entry;
  });

  return Buffer.concat([header, ...entries, ...frames.map((frame) => frame.data)]);
}

async function createFavicon(pathInputFile: string, sizes: number[], density: number) {
  const frames = await Promise.all(
    sizes.map(async (size) => ({
      data: await sharp(pathInputFile, { density }).resize(size, size).png().toBuffer(),
      size,
    })),
  );

  return buildIco(frames);
}

export function generateManifestIcons(props: {
  faviconFileName?: string;
  faviconPath?: string;
  path: string;
  prefix: string;
  sizesBackgroundWhite: number[];
  sizesBackgroundTransparent: number[];
  sizesFavicon: number[];
}) {
  const faviconFileName = props.faviconFileName ?? defaultFaviconFileName;
  const faviconPath = props.faviconPath ?? joinUrlPath(props.path, faviconFileName);

  const icons = [
    ...props.sizesBackgroundTransparent.map((size) => ({
      src: joinUrlPath(props.path, iconFileName(props.prefix, size, '.png')),
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'any',
    })),
    ...props.sizesBackgroundWhite.map((size) => ({
      src: joinUrlPath(props.path, iconFileName(props.prefix, size, '-white.png')),
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'any',
    })),
    ...(props.sizesFavicon.length > 0
      ? [
          {
            src: faviconPath,
            sizes: props.sizesFavicon.map((size) => `${size}x${size}`).join(' '),
            type: 'image/x-icon',
            purpose: 'any',
          },
        ]
      : []),
  ];

  return icons;
}

type IconTask = {
  label: string;
  pathOutput: string;
  run: () => Promise<unknown>;
};

export function pluginUpdateIcons(props: {
  faviconDensity?: number;
  faviconFileName?: string;
  pathFaviconOutputDirectory?: string;
  sizesBackgroundWhite: number[];
  sizesBackgroundTransparent: number[];
  sizesFavicon: number[];
  prefix: string;
  pathInputFile: string;
  pathOutputDirectory: string;
}): Plugin {
  return {
    name: 'plugin-update-icons',
    async buildStart() {
      if (!fs.existsSync(props.pathInputFile)) {
        throw new Error(`UpdateIcons: source file not found: ${props.pathInputFile}`);
      }

      fs.mkdirSync(props.pathOutputDirectory, { recursive: true });

      const tasks = new Map<string, IconTask>();

      function addTask(fileName: string, label: string, createPipeline: () => sharp.Sharp) {
        const pathOutput = path.join(props.pathOutputDirectory, fileName);

        if (tasks.has(pathOutput)) {
          logger.warn(`UpdateIcons: Skip duplicate ${label}.`);
          return;
        }

        tasks.set(pathOutput, {
          label,
          pathOutput,
          run: () => createPipeline().toFile(pathOutput),
        });
      }

      props.sizesBackgroundTransparent.forEach((size) => {
        addTask(iconFileName(props.prefix, size, '.png'), `${size}x${size}`, () =>
          sharp(props.pathInputFile).resize(size, size),
        );
      });
      props.sizesBackgroundWhite.forEach((size) => {
        addTask(iconFileName(props.prefix, size, '-white.png'), `${size}x${size} white`, () =>
          sharp(props.pathInputFile)
            .resize(size, size)
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } }),
        );
      });

      const faviconSizes = normalizeFaviconSizes(props.sizesFavicon);

      if (faviconSizes.length > 0) {
        const faviconDirectory = props.pathFaviconOutputDirectory ?? props.pathOutputDirectory;
        const faviconFileName = path.basename(props.faviconFileName?.trim() || defaultFaviconFileName);
        const pathOutput = path.join(faviconDirectory, faviconFileName);
        const label = `favicon ${faviconSizes.map((size) => `${size}px`).join(', ')}`;

        fs.mkdirSync(faviconDirectory, { recursive: true });

        if (tasks.has(pathOutput)) {
          logger.warn(`UpdateIcons: Skip duplicate ${label}.`);
        } else {
          tasks.set(pathOutput, {
            label,
            pathOutput,
            run: async () => {
              const icon = await createFavicon(
                props.pathInputFile,
                faviconSizes,
                props.faviconDensity ?? defaultFaviconDensity,
              );

              await fs.promises.writeFile(pathOutput, icon);
            },
          });
        }
      }

      const taskList = [...tasks.values()];
      const results = await Promise.allSettled(taskList.map((task) => task.run()));
      const failures: string[] = [];

      results.forEach((result, index) => {
        const task = taskList[index];

        if (result.status === 'fulfilled') {
          logger.info(`UpdateIcons: Create ${task.label}.`);
          return;
        }

        const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
        failures.push(`${task.pathOutput} (${task.label}): ${reason}`);
      });

      if (failures.length > 0) {
        throw new Error(
          `UpdateIcons: Failed to generate ${failures.length} of ${taskList.length} icons.\n${failures
            .map((failure) => ` - ${failure}`)
            .join('\n')}`,
        );
      }

      logger.success(`UpdateIcons: Generated ${taskList.length} icons in ${props.pathOutputDirectory}.`);
    },
  };
}
