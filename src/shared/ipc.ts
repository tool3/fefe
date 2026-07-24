/**
 * Canonical IPC channel names and the typed API surface exposed to the
 * renderer via the preload bridge. Keeping these here means the main process
 * handlers and the renderer client can never drift apart.
 */

import type {
  Job,
  JobCreatedEvent,
  JobLogEvent,
  JobProgressEvent,
  JobSpec,
  JobStatusEvent,
  MediaInfo,
  PickFilesRequest,
  SaveDialogRequest,
  SuggestOutputRequest
} from './types'

export const IpcChannel = {
  // invoke (renderer → main → renderer)
  FfmpegVersion: 'ffmpeg:version',
  Probe: 'media:probe',
  OpenFiles: 'dialog:open-files',
  PickFiles: 'dialog:pick-files',
  SaveFile: 'dialog:save-file',
  SuggestOutput: 'path:suggest-output',
  JobStart: 'job:start',
  JobCancel: 'job:cancel',
  JobList: 'job:list',
  RevealInFolder: 'shell:reveal',
  // events (main → renderer)
  EvtJobCreated: 'evt:job-created',
  EvtJobProgress: 'evt:job-progress',
  EvtJobStatus: 'evt:job-status',
  EvtJobLog: 'evt:job-log'
} as const

export type Unsubscribe = () => void

/**
 * The contract exposed on `window.api`. The renderer never touches Node or
 * Electron APIs directly — everything flows through this typed surface.
 */
export interface Api {
  ffmpegVersion(): Promise<string>
  probe(path: string): Promise<MediaInfo>
  openFiles(): Promise<string[]>
  pickFiles(req: PickFilesRequest): Promise<string[]>
  saveFile(req: SaveDialogRequest): Promise<string | null>
  suggestOutput(req: SuggestOutputRequest): Promise<string>
  startJob(spec: JobSpec): Promise<Job>
  cancelJob(id: string): Promise<boolean>
  listJobs(): Promise<Job[]>
  revealInFolder(path: string): Promise<void>
  /** Resolve the absolute filesystem path of a dropped File (Electron webUtils). */
  getPathForFile(file: File): string

  onJobCreated(cb: (e: JobCreatedEvent) => void): Unsubscribe
  onJobProgress(cb: (e: JobProgressEvent) => void): Unsubscribe
  onJobStatus(cb: (e: JobStatusEvent) => void): Unsubscribe
  onJobLog(cb: (e: JobLogEvent) => void): Unsubscribe
}
