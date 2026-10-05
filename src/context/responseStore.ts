import { create } from 'zustand'
import { RequestBuildError, buildRequest } from '@/utils/buildRequest'
import {
  sendSerializedRequest,
  toApiResponse,
  toResponseError,
} from '@/api/api'
import type { RequestDraft } from '@/types/request.type'
import type { SendResult } from '@/types/response.type'

/**
 * The in-flight request lives outside the store. Abort controllers are not
 * serialisable and nothing else needs to see them.
 */
let inFlight: AbortController | null = null

type ResponseStoreType = {
  result: SendResult | null
  isLoading: boolean
  /**
   * Builds the request from the draft, sends it, and stores either the
   * response or the reason it failed. Never rejects.
   */
  send: (draft: RequestDraft) => Promise<void>
  cancel: () => void
  clear: () => void
}

export const useResponseStore = create<ResponseStoreType>()((set) => ({
  result: null,
  isLoading: false,

  send: async (draft) => {
    inFlight?.abort()
    const controller = new AbortController()
    inFlight = controller
    const startedAt = performance.now()
    set({ isLoading: true, result: null })

    try {
      const request = await buildRequest(draft)
      const response = await sendSerializedRequest(request, controller.signal)
      if (controller.signal.aborted) return
      set({
        isLoading: false,
        result: {
          ok: true,
          response: toApiResponse(response, startedAt),
        },
      })
    } catch (thrown) {
      if (controller.signal.aborted) {
        set({ isLoading: false })
        return
      }
      const error =
        thrown instanceof RequestBuildError
          ? { message: thrown.message, stage: 'build' as const, status: null }
          : toResponseError(thrown)
      set({ isLoading: false, result: { ok: false, error } })
    } finally {
      if (inFlight === controller) inFlight = null
    }
  },

  cancel: () => {
    inFlight?.abort()
    inFlight = null
    set({ isLoading: false })
  },

  clear: () => set({ result: null, isLoading: false }),
}))
