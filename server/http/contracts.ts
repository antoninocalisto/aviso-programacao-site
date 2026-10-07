import type { IncomingMessage, ServerResponse } from 'node:http';
/** Structural subset of Vercel's Node HTTP handler, without bundling platform tooling. */
export type ApiRequest = IncomingMessage;
export interface ApiResponse extends ServerResponse {
  status(code: number): ApiResponse;
  json(value: unknown): ApiResponse;
}
