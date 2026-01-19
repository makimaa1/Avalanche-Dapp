const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function getBlockchainValue() {
  if (!BACKEND_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not defined");
  }

  const res = await fetch(`${BACKEND_URL}/blockchain/value`, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch blockchain value");
  }

  // 👇 PERBAIKAN DISINI:
  // Kita ubah response jadi object JSON, lalu ambil properti .value nya saja
  const data = await res.json(); 
  
  // Pastikan mengembalikan string angka saja (contoh: "3")
  return data.value; 
}