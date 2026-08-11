/**
 * Chrome WebMCP Declarative API attributes (origin trial).
 * @see https://developer.chrome.com/docs/ai/webmcp/declarative-api
 */
import "react";

declare module "react" {
  interface HTMLAttributes<T> {
    /** Registers this form as a WebMCP tool. Requires `tooldescription`. */
    toolname?: string;
    /** Human-readable tool purpose for agents. Requires `toolname`. */
    tooldescription?: string;
    /** When present, agent invocation auto-submits the form. */
    toolautosubmit?: boolean | "";
    /** JSON Schema property description for this field. */
    toolparamdescription?: string;
  }
}

export {};
