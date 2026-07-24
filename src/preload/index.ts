import { contextBridge, ipcRenderer, webUtils } from 'electron'
import type { IpcRendererEvent } from 'electron'
import type { Api, Unsubscribe } from '@shared/ipc'
import { IpcChannel } from '@shared/ipc'
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
} from '@shared/types'

function subscribe<T>(channel: string, cb: (payload: T) => void): Unsubscribe {
  const listener = (_e: IpcRendererEvent, payload: T): void => cb(payload)
  ipcRenderer.on(channel, listener)
  return () => ipcRenderer.removeListener(channel, listener)
}

const api: Api = {
  ffmpegVersion: () => ipcRenderer.invoke(IpcChannel.FfmpegVersion) as Promise<string>,
  probe: (path) => ipcRenderer.invoke(IpcChannel.Probe, path) as Promise<MediaInfo>,
  openFiles: () => ipcRenderer.invoke(IpcChannel.OpenFiles) as Promise<string[]>,
  pickFiles: (req: PickFilesRequest) =>
    ipcRenderer.invoke(IpcChannel.PickFiles, req) as Promise<string[]>,
  saveFile: (req: SaveDialogRequest) =>
    ipcRenderer.invoke(IpcChannel.SaveFile, req) as Promise<string | null>,
  suggestOutput: (req: SuggestOutputRequest) =>
    ipcRenderer.invoke(IpcChannel.SuggestOutput, req) as Promise<string>,
  startJob: (spec: JobSpec) => ipcRenderer.invoke(IpcChannel.JobStart, spec) as Promise<Job>,
  cancelJob: (id) => ipcRenderer.invoke(IpcChannel.JobCancel, id) as Promise<boolean>,
  listJobs: () => ipcRenderer.invoke(IpcChannel.JobList) as Promise<Job[]>,
  revealInFolder: (path) =>
    ipcRenderer.invoke(IpcChannel.RevealInFolder, path) as Promise<void>,
  getPathForFile: (file: File) => webUtils.getPathForFile(file),

  onJobCreated: (cb: (e: JobCreatedEvent) => void) =>
    subscribe(IpcChannel.EvtJobCreated, cb),
  onJobProgress: (cb: (e: JobProgressEvent) => void) =>
    subscribe(IpcChannel.EvtJobProgress, cb),
  onJobStatus: (cb: (e: JobStatusEvent) => void) =>
    subscribe(IpcChannel.EvtJobStatus, cb),
  onJobLog: (cb: (e: JobLogEvent) => void) => subscribe(IpcChannel.EvtJobLog, cb)
}

contextBridge.exposeInMainWorld('api', api)
