const DEFAULT_DEV_API_ORIGIN = process.env.NODE_ENV === "development" ? "http://localhost:4000" : "";
const rawEnvOrigin = (process.env.NEXT_PUBLIC_API_ORIGIN ?? "").trim();
const selectedOrigin = rawEnvOrigin.length > 0 ? rawEnvOrigin : DEFAULT_DEV_API_ORIGIN;

const apiOrigin = selectedOrigin.replace(/\/$/, "");

export function resolveApiUrl(path: string): string {
  if (!path.startsWith("/")) {
    throw new Error("resolveApiUrl expects a leading slash in the path");
  }
  return apiOrigin ? `${apiOrigin}${path}` : path;
}

export { apiOrigin };
