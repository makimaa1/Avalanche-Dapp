const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function getBlockchainValue() {
  if (!BACKEND_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
  }

  // Request ke Backend API (NestJS)
  const res = await fetch(`${BACKEND_URL}/blockchain/value`, {
    method: "GET",
    cache: "no-store", // Agar data selalu fresh (realtime)
  });

  if (!res.ok) {
    throw new Error("Failed to fetch blockchain value");
  }

 const data = await res.json(); 
  return data.value;
}