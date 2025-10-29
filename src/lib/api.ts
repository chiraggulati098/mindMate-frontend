type AuthResponse = {
  message: string;
  token?: string;
};

const baseUrl = (import.meta.env.VITE_BACKEND_URI as string);

async function parseJson(response: Response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function signup(payload: { name: string; email: string; password: string }): Promise<AuthResponse> {
  const res = await fetch(`${baseUrl}/auth/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(res);
  if (!res.ok) {
    const err = (data && data.message) || res.statusText || "Signup failed";
    throw new Error(err);
  }
  return data as AuthResponse;
}

export async function login(payload: { email: string; password: string }): Promise<AuthResponse> {
  const res = await fetch(`${baseUrl}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await parseJson(res);
  if (!res.ok) {
    const err = (data && data.message) || res.statusText || "Login failed";
    throw new Error(err);
  }
  return data as AuthResponse;
}

export default { signup, login };
