import fs from 'fs'
import { resolve } from 'path'

export function pluginUpdateReadmePD(props: { insertionPoint: string }) {
  return {
    name: 'plugin-update-readme-peer-dependencies',
    buildStart() {
      const packageJsonPath = resolve(__dirname, 'package.json')
      const readmePath = resolve(__dirname, 'README.md')

      async function updateReadme() {
        const packageJson = JSON.parse(await fs.promises.readFile(packageJsonPath, 'utf8'))
        const peerDependencies = packageJson.peerDependencies || {}
        const commands = Object.keys(peerDependencies)
          .map(dep => `npm install ${dep} --save`)
          .join('\n')
        const installSection = `
## Installing dependencies

To work correctly you need to install the following dependencies:

\`\`\`bash
${commands}
\`\`\`
`

        const readmeContent = await fs.promises.readFile(readmePath, 'utf8')
        const insertionPoint = props.insertionPoint

        if (readmeContent.includes(insertionPoint)) {
          const insertionIndex = readmeContent.indexOf(insertionPoint) + insertionPoint.length

          const beforeInsertion = readmeContent.slice(0, insertionIndex).trim()
          const newContent = beforeInsertion + '\n\n' + installSection

          await fs.promises.writeFile(readmePath, newContent, 'utf8')
          console.log(
            '\x1b[32minfo\x1b[0m => UpdateReadmePeerDependencies: README updated with dependency install command.'
          )
        } else {
          console.log(
            '\x1b[33mwarn\x1b[0m => UpdateReadmePeerDependencies: Could not find section to insert into README.'
          )
        }
      }

      updateReadme().catch(console.error)
    }
  }
}
