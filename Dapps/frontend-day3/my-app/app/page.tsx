'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useChainId,
} from 'wagmi';
import { injected } from 'wagmi/connectors';
import { avalancheFuji } from 'wagmi/chains';

// ==============================
// 🔹 CONFIG
// ==============================

// 👉 Contract Address (Pastikan ini benar)
const CONTRACT_ADDRESS = '0x98598442f1d8e469a4fca0602bf9d2b4377845a7';

// 👉 ABI
const SIMPLE_STORAGE_ABI = [
  {
    inputs: [],
    name: 'getValue',
    outputs: [{ type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ name: '_value', type: 'uint256' }],
    name: 'setValue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

// Helper: Shorten Address (Contoh: 0x1234...5678)
const formatAddress = (addr: string | undefined) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export default function Page() {
  // ==============================
  // 🔹 STATE & HOOKS
  // ==============================
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [inputValue, setInputValue] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Custom Toast State
  const [toast, setToast] = useState<{ type: 'success' | 'error' | null; message: string }>({
    type: null,
    message: '',
  });

  // Prevent Hydration Error
  useEffect(() => {
    setMounted(true);
  }, []);

  // ==============================
  // 🔹 SMART CONTRACT READ
  // ==============================
  const {
    data: value,
    isLoading: isReading,
    refetch,
  } = useReadContract({
    address: CONTRACT_ADDRESS,
    abi: SIMPLE_STORAGE_ABI,
    functionName: 'getValue',
  });

  // ==============================
  // 🔹 SMART CONTRACT WRITE
  // ==============================
  const { 
    data: hash, 
    writeContract, 
    isPending: isSigning, 
    error: writeError 
  } = useWriteContract();

  // Menunggu Transaksi sampai masuk Blok (Mining)
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // ==============================
  // 🔹 EFFECTS (LOGIC UX)
  // ==============================

  // 1. Auto Refresh saat Sukses & Show Success Toast
  useEffect(() => {
    if (isConfirmed) {
      refetch(); // Refresh value otomatis
      setInputValue(''); // Reset input
      showToast('success', 'Transaction Confirmed! Value updated.');
    }
  }, [isConfirmed, refetch]);

  // 2. Handle Error (User Reject / Revert)
  useEffect(() => {
    if (writeError) {
      // Mengambil pesan error yang lebih bersih
      const message = writeError.message.includes('User rejected') 
        ? 'User rejected the transaction.' 
        : 'Transaction failed. Check console for details.';
      showToast('error', message);
    }
  }, [writeError]);

  // Fungsi Kirim Transaksi
  const handleSetValue = async () => {
    if (!inputValue) return;
    
    // Reset Toast
    setToast({ type: null, message: '' });

    try {
      writeContract({
        address: CONTRACT_ADDRESS,
        abi: SIMPLE_STORAGE_ABI,
        functionName: 'setValue',
        args: [BigInt(inputValue)],
      });
    } catch (err) {
      console.error(err);
    }
  };

  // Helper Toast
  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    // Auto hide setelah 3 detik
    setTimeout(() => setToast({ type: null, message: '' }), 5000);
  };

  // Jika belum mounted, return null
  if (!mounted) return null;

  // Cek apakah User di Network yang salah
  const isWrongNetwork = isConnected && chainId !== avalancheFuji.id;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-gray-900 to-black text-white p-4 font-sans relative overflow-hidden">
      
      {/* 🔹 TOAST NOTIFICATION (Pop-up) */}
      {toast.type && (
        <div className={`fixed top-5 left-1/2 transform -translate-x-1/2 z-50 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 transition-all animate-bounce ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.type === 'success' ? (
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          ) : (
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          )}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* 🔹 MAIN CARD CONTAINER */}
      <div className="w-full max-w-lg relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
              Avalanche dApp
            </h1>
            <p className="text-xs text-red-400 tracking-widest mt-2 uppercase font-semibold">
              Advanced Interaction
            </p>
          </div>

          {/* ==========================
              SECTION 1: WALLET & NETWORK
          ========================== */}
          <div className="mb-8">
            {!isConnected ? (
              <button
                onClick={() => connect({ connector: injected() })}
                disabled={isConnecting}
                className="w-full group relative px-4 py-3 bg-white text-black font-bold rounded-xl overflow-hidden hover:scale-[1.02] transition-all"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : isWrongNetwork ? (
              // 🔴 TAMPILAN JIKA SALAH NETWORK
              <button
                onClick={() => switchChain({ chainId: avalancheFuji.id })}
                className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all animate-pulse"
              >
                ⚠️ Switch to Avalanche Fuji
              </button>
            ) : (
              // 🟢 TAMPILAN CONNECTED
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase tracking-wide">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Connected to Fuji
                </div>
                {/* SHORTEN ADDRESS APPLIED HERE */}
                <p className="font-mono text-xl text-white tracking-wider">
                  {formatAddress(address)}
                </p>
                <button onClick={() => disconnect()} className="text-xs text-red-400 hover:text-red-300 underline">
                  Disconnect Wallet
                </button>
              </div>
            )}
          </div>

          {/* ==========================
              SECTION 2: READ VALUE
          ========================== */}
          <div className="bg-black/20 rounded-xl p-6 border border-white/5 mb-6 text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Current Value</p>
            <div className="text-5xl font-mono font-bold text-white mb-4">
              {isReading ? <span className="animate-pulse">...</span> : value?.toString() || '0'}
            </div>
            <button onClick={() => refetch()} className="text-xs text-gray-400 hover:text-white flex items-center justify-center gap-2 mx-auto">
              <svg className={`w-3 h-3 ${isReading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
              Refresh Data
            </button>
          </div>

          {/* ==========================
              SECTION 3: WRITE VALUE
          ========================== */}
          <div className="space-y-4">
            <input
              type="number"
              placeholder="Enter new value..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={!isConnected || isWrongNetwork || isSigning || isConfirming}
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-all disabled:opacity-50"
            />

            <button
              onClick={handleSetValue}
              // DISABLE BUTTON SAAT PENDING (Signing atau Confirming)
              disabled={isSigning || isConfirming || !isConnected || !inputValue || isWrongNetwork}
              className={`w-full py-3 rounded-xl font-semibold transition-all shadow-lg ${
                isSigning || isConfirming || !isConnected || !inputValue || isWrongNetwork
                  ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-red-900/20'
              }`}
            >
              {isSigning ? 'Check Wallet...' : isConfirming ? 'Confirming Transaction...' : 'Write to Blockchain'}
            </button>
            
            {/* HASH LINK JIKA ADA */}
            {hash && (
              <a 
                href={`https://testnet.snowtrace.io/tx/${hash}`} 
                target="_blank" 
                rel="noreferrer"
                className="block text-center text-xs text-blue-400 hover:text-blue-300 underline mt-2"
              >
                View Transaction on Snowtrace ↗
              </a>
            )}
          </div>

        </div>

        {/* 🔹 FOOTER IDENTITY */}
        <div className="mt-8 text-center space-y-1">
          <div className="inline-flex items-center justify-center gap-4 px-6 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-sm font-medium text-gray-300">
              <span className="text-red-500 font-bold mr-1">NAMA:</span> SOFYAN AGUNG
            </p>
            <div className="w-px h-3 bg-gray-700"></div>
            <p className="text-sm font-medium text-gray-300">
              <span className="text-red-500 font-bold mr-1">NIM:</span> [231011400159]
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}