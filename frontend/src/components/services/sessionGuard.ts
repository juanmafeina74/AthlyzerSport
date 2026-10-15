import { handleUnauthorized } from "./apiError";

const API_ORIGIN = "http://localhost:3000/api/";
const LOGIN_URL = `${API_ORIGIN}auth/login`;

let installed = false;

export function installSessionGuard() {
  if (installed) return;
  installed = true;

  const originalFetch = window.fetch.bind(window);
  window.fetch = async (input, init) => {
    const response = await originalFetch(input, init);
    const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;

    if (response.status === 401 && url.startsWith(API_ORIGIN) && !url.startsWith(LOGIN_URL)) {
      handleUnauthorized();
    }
    return response;
  };
}
