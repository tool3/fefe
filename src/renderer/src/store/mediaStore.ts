import { create } from 'zustand'
import type { MediaInfo } from '@shared/types'
import { api } from '@renderer/lib/api'
import { notify } from '@ui'

interface MediaState {
  files: MediaInfo[]
  activePath: string | null
  loading: boolean
  addPaths: (paths: string[]) => Promise<void>
  openDialog: () => Promise<void>
  setActive: (path: string) => void
  remove: (path: string) => void
}

export const useMediaStore = create<MediaState>((set, get) => ({
  files: [],
  activePath: null,
  loading: false,

  addPaths: async (paths) => {
    const existing = new Set(get().files.map((f) => f.path))
    const fresh = paths.filter((p) => !existing.has(p))
    if (fresh.length === 0) {
      if (paths.length) set({ activePath: paths[0] })
      return
    }
    set({ loading: true })
    try {
      const probed = await Promise.all(
        fresh.map(async (p) => {
          try {
            return await api.probe(p)
          } catch (err) {
            notify.error(`Could not read ${p}: ${(err as Error).message}`)
            return null
          }
        })
      )
      const ok = probed.filter((m): m is MediaInfo => m !== null)
      set((s) => ({
        files: [...s.files, ...ok],
        activePath: ok.length ? ok[ok.length - 1].path : s.activePath
      }))
    } finally {
      set({ loading: false })
    }
  },

  openDialog: async () => {
    const paths = await api.openFiles()
    if (paths.length) await get().addPaths(paths)
  },

  setActive: (path) => set({ activePath: path }),

  remove: (path) =>
    set((s) => {
      const files = s.files.filter((f) => f.path !== path)
      const activePath =
        s.activePath === path ? (files.at(-1)?.path ?? null) : s.activePath
      return { files, activePath }
    })
}))

/** Selector: the currently active media file, if any. */
export function useActiveMedia(): MediaInfo | undefined {
  return useMediaStore((s) => s.files.find((f) => f.path === s.activePath))
}
