import fs from 'fs'

export function pluginUpdateReadmePD(props: { insertionPoint: string; pathPackageJson: string; pathReadme: string }) {
  return {
    name: 'plugin-update-readme-peer-dependencies',
    buildStart() {
      const pathPackageJson = props.pathPackageJson
      const pathReadme = props.pathReadme

      async function updateReadme() {
        const packageJson = JSON.parse(await fs.promises.readFile(pathPackageJson, 'utf8'))
        const peerDependencies = packageJson.peerDependencies || {}
        const commands = Object.keys(peerDependencies)
          .map(dep => `npm install ${dep} --save`)
          .join('\n')
        const installSection = `
To work correctly you need to install the following dependencies:

\`\`\`bash
${commands}
\`\`\`
`

        const readmeContent = await fs.promises.readFile(pathReadme, 'utf8')
        const insertionPoint = props.insertionPoint

        if (readmeContent.includes(insertionPoint)) {
          const insertionIndex = readmeContent.indexOf(insertionPoint) + insertionPoint.length

          const beforeInsertion = readmeContent.slice(0, insertionIndex).trim()
          const newContent = beforeInsertion + '\n\n' + installSection

          await fs.promises.writeFile(pathReadme, newContent, 'utf8')
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
