import { z } from 'zod'

/* -------------------------------------------------------------------------- */
/*                                  Status                                    */
/* -------------------------------------------------------------------------- */

export const statusKindArr = [
  'success',
  'redirect',
  'clientError',
  'serverError',
] as const
export const statusKindSchema = z.enum(statusKindArr)
export type StatusKind = z.infer<typeof statusKindSchema>

/**
 * Buckets a status code so the UI can pick one colour instead of a giant
 * switch in the component.
 */
export const statusKind = (status: number): StatusKind => {
  if (status >= 200 && status < 300) return 'success'
  if (status >= 300 && status < 400) return 'redirect'
  if (status >= 400 && status < 500) return 'clientError'
  return 'serverError'
}

/* -------------------------------------------------------------------------- */
/*                                  Payload                                   */
/* -------------------------------------------------------------------------- */

export const payloadKindArr = ['json', 'text', 'empty'] as const
export const payloadKindSchema = z.enum(payloadKindArr)
export type PayloadKind = z.infer<typeof payloadKindSchema>

/* -------------------------------------------------------------------------- */
/*                            A single HTTP response                          */
/* -------------------------------------------------------------------------- */

export const responseSchema = z.object({
  status: z.number(),
  statusText: z.string(),
  kind: statusKindSchema,
  ok: z.boolean(),
  url: z.string(),
  headers: z.record(z.string(), z.string()),
  payloadKind: payloadKindSchema,
  /** Raw body exactly as it came back. */
  raw: z.string(),
  /** `raw` parsed into JSON when possible, otherwise `null`. */
  data: z.unknown().nullable(),
  sizeBytes: z.number(),
  durationMs: z.number(),
  timestamp: z.string(),
})
export type ApiResponse = z.infer<typeof responseSchema>

/* -------------------------------------------------------------------------- */
/*                             The send result                                */
/* -------------------------------------------------------------------------- */

export const responseErrorSchema = z.object({
  message: z.string(),
  /** Which stage failed: building the request, the network, or the proxy. */
  stage: z.enum(['build', 'network', 'proxy']),
  status: z.number().nullable(),
})
export type ResponseError = z.infer<typeof responseErrorSchema>

/**
 * Send is a discriminated union: you either have a response or an error,
 * never a half-state. That keeps `if (result.ok)` exhaustive.
 */
export const sendResultSchema = z.discriminatedUnion('ok', [
  z.object({ ok: z.literal(true), response: responseSchema }),
  z.object({ ok: z.literal(false), error: responseErrorSchema }),
])
export type SendResult = z.infer<typeof sendResultSchema>
