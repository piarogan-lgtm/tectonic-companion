const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

export async function queryServer(prompt: string) {
  const response = await fetch(`${API_BASE_URL}/api/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.details?.error?.message || data.error || "Failed to contact server"
    );
  }

  return data as {
    reply: string;
    precedents?: {
      name: string;
      architect: string;
      image: string;
    }[];
  };
}