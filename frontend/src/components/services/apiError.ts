export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly messages: string[],
  ) {
    super(messages.join(" "));
  }
}

type ErrorBody = { statusCode?: number; message?: string | string[]; error?: string };

export function apiErrorFromBody(status: number, body: ErrorBody | null | undefined, fallback: string) {
  const raw = body?.message;
  const messages = Array.isArray(raw) ? raw.filter(Boolean) : raw ? [raw] : body?.error ? [body.error] : [fallback];
  return new ApiError(status, messages.length ? messages : [fallback]);
}

export async function toApiError(response: Response, fallback: string) {
  const body = (await response.json().catch(() => null)) as ErrorBody | null;
  return apiErrorFromBody(response.status, body, fallback);
}

export function handleUnauthorized() {
  localStorage.removeItem("athlyzer_user");
  window.location.href = "/login";
}

export function describeApiError(error: ApiError): string[] {
  switch (error.status) {
    case 403:
      return ["No tienes permiso para realizar esta acción."];
    case 404:
      return error.messages.length ? error.messages : ["El jugador o el equipo no existe."];
    default:
      return error.messages;
  }
}
