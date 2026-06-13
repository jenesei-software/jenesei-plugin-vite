import fs from 'node:fs';
import path from 'node:path';

export function pluginWriteBuildInfo(props: { mode: string; pathBuildInfo: string; version: string }) {
  return {
    name: 'plugin-write-build-info',
    closeBundle() {
      fs.mkdirSync(path.dirname(props.pathBuildInfo), { recursive: true });
      fs.writeFileSync(
        props.pathBuildInfo,
        [`version: ${props.version}`, `mode: ${props.mode}`, `builtAt: ${new Date().toISOString()}`, ''].join('\n'),
        'utf8',
      );
    },
  };
}
