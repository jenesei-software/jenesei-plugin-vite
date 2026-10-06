import sharp from 'sharp';
import type { Plugin } from 'vite';

import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../logger';

export function generateManifestIcons(props: {
  path: string;
  prefix: string;
  sizesBackgroundWhite: number[];
  sizesBackgroundTransparent: number[];
  sizesFavicon: number[];
}) {
  const icons = [
    ...props.sizesBackgroundTransparent.map((size) => ({
      src: `${props.path}/${props.prefix}-${size}x${size}.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'any',
    })),
    ...props.sizesBackgroundWhite.map((size) => ({
      src: `${props.path}/${props.prefix}-${size}x${size}-white.png`,
      sizes: `${size}x${size}`,
      type: 'image/png',
      purpose: 'any',
    })),
    ...props.sizesFavicon.map((size) => ({
      src: `${props.path}/${props.prefix}-${size}x${size}-favicon.ico`,
      sizes: `${size}x${size}`,
      type: 'image/x-icon',
      purpose: 'any',
    })),
  ];
  return icons;
}

type IconTask = {
  label: string;
  pathOutput: string;
  run: () => Promise<unknown>;
};

export function pluginUpdateIcons(props: {
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
        addTask(`${props.prefix}-${size}x${size}.png`, `${size}x${size}`, () =>
          sharp(props.pathInputFile).resize(size, size),
        );
      });
      props.sizesBackgroundWhite.forEach((size) => {
        addTask(`${props.prefix}-${size}x${size}-white.png`, `${size}x${size} white`, () =>
          sharp(props.pathInputFile)
            .resize(size, size)
            .flatten({ background: { r: 255, g: 255, b: 255, alpha: 1 } }),
        );
      });
      props.sizesFavicon.forEach((size) => {
        addTask(`${props.prefix}-${size}x${size}-favicon.ico`, `${size}x${size} favicon`, () =>
          sharp(props.pathInputFile).resize(size, size),
        );
      });

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
