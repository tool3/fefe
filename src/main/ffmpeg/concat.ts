import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

/**
 * Write a temporary list file for ffmpeg's concat demuxer:
 *
 *   file '/path/to/one.mp4'
 *   file '/path/to/two.mp4'
 *
 * Single quotes inside paths are escaped per the concat file syntax.
 * Returns the absolute path to the generated list file.
 */
export async function writeConcatList(inputs: string[]): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'fefe-concat-'))
  const listPath = join(dir, 'list.txt')
  const body =
    inputs.map((p) => `file '${p.replace(/'/g, "'\\''")}'`).join('\n') + '\n'
  await writeFile(listPath, body, 'utf8')
  return listPath
}
