type AuthResponse = {
  message: string;
  token?: string;
};

type Subject = {
  _id?: string; 
  name: string;
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

export async function getSubjects(): Promise<Subject[]> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${baseUrl}/subjects`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  const data = await parseJson(res);
  if (!res.ok) {
    const err = (data && data.message) || res.statusText || "Failed to fetch subjects";
    throw new Error(err);
  }
  
  // Normalize the data to ensure we have consistent 'id' field
  const subjects = (data as any[]).map(subject => ({
    ...subject,
    id: subject.id || subject._id, // Use _id if id is not present
    name: subject.name
  }));
  
  return subjects;
}

export async function createSubject(name: string): Promise<Subject> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${baseUrl}/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name }),
  });

  const data = await parseJson(res);
  if (!res.ok) {
    const err = (data && data.message) || res.statusText || "Failed to create subject";
    throw new Error(err);
  }
  
  // Normalize the response to ensure we have consistent 'id' field
  const subject = {
    ...data,
    id: data.id || data._id, // Use _id if id is not present
    name: data.name
  };
  
  return subject;
}

export async function deleteSubject(id: string): Promise<void> {
  const token = localStorage.getItem('token');
  const res = await fetch(`${baseUrl}/subjects/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const data = await parseJson(res);
    const err = (data && data.message) || res.statusText || "Failed to delete subject";
    throw new Error(err);
  }
}

export default { signup, login };
