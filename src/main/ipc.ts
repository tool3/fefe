import { execFile } from 'node:child_process'
import { dirname, extname, join } from 'node:path'
import { promisify } from 'node:util'
import { BrowserWindow, dialog, ipcMain, shell } from 'electron'
import type {
  Job,
  JobSpec,
  MediaInfo,
  PickFilesRequest,
  SaveDialogRequest,
  SuggestOutputRequest
} from '@shared/types'
import { IpcChannel } from '@shared/ipc'
import { ffmpegPath } from './ffmpeg/binaries'
import type { JobManager } from './ffmpeg/jobManager'
import { probe } from './ffmpeg/probe'

const execFileAsync = promisify(execFile)

const OPEN_FILTERS = [
  {
    name: 'Media',
    extensions: [
      'mp4', 'mkv', 'mov', 'webm', 'avi', 'flv', 'm4v', 'ts', 'mpg', 'mpeg',
      'mp3', 'wav', 'flac', 'aac', 'm4a', 'ogg', 'opus'
    ]
  },
  { name: 'All Files', extensions: ['*'] }
]

async function ffmpegVersion(): Promise<string> {
  try {
    const { stdout } = await execFileAsync(ffmpegPath, ['-version'])
    return stdout.split('\n')[0]?.trim() ?? 'ffmpeg'
  } catch (err) {
    return `ffmpeg unavailable: ${(err as Error).message}`
  }
}

function suggestOutput(req: SuggestOutputRequest): string {
  const dir = dirname(req.input)
  const base = req.input
    .slice(dir.length + 1)
    .replace(new RegExp(`${extname(req.input)}$`), '')
  const suffix = req.suffix ?? 'out'
  return join(dir, `${base}.${suffix}.${req.container}`)
}

/** Register every renderer-facing handler. Call once after app is ready. */
export function registerIpc(manager: JobManager): void {
  ipcMain.handle(IpcChannel.FfmpegVersion, (): Promise<string> => ffmpegVersion())

  ipcMain.handle(IpcChannel.Probe, (_e, path: string): Promise<MediaInfo> => probe(path))

  ipcMain.handle(IpcChannel.OpenFiles, async (): Promise<string[]> => {
    const result = await dialog.showOpenDialog({
      title: 'Open media',
      properties: ['openFile', 'multiSelections'],
      filters: OPEN_FILTERS
    })
    return result.canceled ? [] : result.filePaths
  })

  ipcMain.handle(
    IpcChannel.PickFiles,
    async (_e, req: PickFilesRequest): Promise<string[]> => {
      const result = await dialog.showOpenDialog({
        properties: req.multi ? ['openFile', 'multiSelections'] : ['openFile'],
        filters: req.filters ?? OPEN_FILTERS
      })
      return result.canceled ? [] : result.filePaths
    }
  )

  ipcMain.handle(
    IpcChannel.SaveFile,
    async (_e, req: SaveDialogRequest): Promise<string | null> => {
      const result = await dialog.showSaveDialog({
        title: 'Save output',
        defaultPath: req.defaultPath,
        filters: req.filters
      })
      return result.canceled ? null : (result.filePath ?? null)
    }
  )

  ipcMain.handle(
    IpcChannel.SuggestOutput,
    (_e, req: SuggestOutputRequest): string => suggestOutput(req)
  )

  ipcMain.handle(IpcChannel.JobStart, (_e, spec: JobSpec): Promise<Job> => manager.start(spec))

  ipcMain.handle(IpcChannel.JobCancel, (_e, id: string): boolean => manager.cancel(id))

  ipcMain.handle(IpcChannel.JobList, (): Job[] => manager.list())

  ipcMain.handle(IpcChannel.RevealInFolder, (_e, path: string): void => {
    shell.showItemInFolder(path)
  })
}

/** Forward job-manager events to every renderer window. */
export function wireJobEvents(manager: JobManager): void {
  const broadcast = (channel: string, payload: unknown): void => {
    for (const win of BrowserWindow.getAllWindows()) {
      win.webContents.send(channel, payload)
    }
  }

  manager.on('created', (job) => broadcast(IpcChannel.EvtJobCreated, { job }))
  manager.on('progress', (e) => broadcast(IpcChannel.EvtJobProgress, e))
  manager.on('status', (e) => broadcast(IpcChannel.EvtJobStatus, e))
  manager.on('log', (e) => broadcast(IpcChannel.EvtJobLog, e))
}
