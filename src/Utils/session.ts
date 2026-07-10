const safeParse = (value: string | null) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

export const hydrateSessionStorage = () => {
  const existingSession = safeParse(sessionStorage.getItem("userSession"));
  if (existingSession) return existingSession;

  const storedCredentials = safeParse(localStorage.getItem("userCredentials"));
  if (storedCredentials) {
    sessionStorage.setItem("userSession", JSON.stringify(storedCredentials));
    return storedCredentials;
  }

  return null;
};

export const hasAuthenticatedSession = () =>
  Boolean(hydrateSessionStorage());
