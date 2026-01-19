'use client';

import { useState, useEffect } from 'react';
import {
  useAccount,
  useConnect,
  useDisconnect,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
  useChainId,
} from 'wagmi';
import { injected } from 'wagmi/connectors';
import { avalancheFuji } from 'wagmi/chains';
// 👇 Import Service Frontend
import { getBlockchainValue } from '@/src/services/blockchain.service';

// 👉 GANTI DENGAN CONTRACT ADDRESS KAMU
const CONTRACT_ADDRESS = '0x98598442f1d8e469a4fca0602bf9d2b4377845a7'; 

const SIMPLE_STORAGE_ABI = [
  {
    inputs: [{ name: '_value', type: 'uint256' }],
    name: 'setValue',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];

const formatAddress = (addr: string | undefined) => {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export default function Page() {
  const chainId = useChainId();
  const { switchChain } = useSwitchChain();
  const { address, isConnected } = useAccount();
  const { connect, isPending: isConnecting } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [inputValue, setInputValue] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // State Data Backend
  const [backendValue, setBackendValue] = useState<string>('0');
  const [isFetching, setIsFetching] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchData(); // Ambil data saat pertama load
  }, []);

  // Fungsi Fetch ke Backend
  const fetchData = async () => {
    setIsFetching(true);
    try {
      const val = await getBlockchainValue();
      setBackendValue(val);
    } catch (error) {
      console.error("Gagal ambil data:", error);
    } finally {
      setIsFetching(false);
    }
  };

  // Logic Write ke Blockchain (Tetap pakai Wallet)
  const { 
    data: hash, 
    writeContract, 
    isPending: isSigning 
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  });

  // Jika sukses write, tunggu 3 detik lalu refresh data dari backend
  useEffect(() => {
    if (isConfirmed) {
      setInputValue('');
      setTimeout(() => {
        fetchData();
      }, 3000);
    }
  }, [isConfirmed]);

  const handleSetValue = async () => {
    if (!inputValue) return;
    writeContract({
      address: CONTRACT_ADDRESS,
      abi: SIMPLE_STORAGE_ABI,
      functionName: 'setValue',
      args: [BigInt(inputValue)],
    });
  };

  if (!mounted) return null;
  const isWrongNetwork = isConnected && chainId !== avalancheFuji.id;

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-red-900/20 via-gray-900 to-black text-white p-4 font-sans relative">
      <div className="w-full max-w-lg relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-red-600 to-rose-600 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
        <div className="relative bg-gray-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Avalanche Fullstack</h1>
            <p className="text-xs text-red-400 tracking-widest mt-2 uppercase font-semibold">Next.js + NestJS + Hardhat</p>
          </div>

          {/* WALLET SECTION */}
          <div className="mb-8">
            {!isConnected ? (
              <button onClick={() => connect({ connector: injected() })} disabled={isConnecting} className="w-full px-4 py-3 bg-white text-black font-bold rounded-xl hover:scale-[1.02] transition-all">
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            ) : isWrongNetwork ? (
              <button onClick={() => switchChain({ chainId: avalancheFuji.id })} className="w-full px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl animate-pulse">
                ⚠️ Switch to Avalanche Fuji
              </button>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-green-400 text-xs font-bold uppercase">● Connected to Fuji</div>
                <p className="font-mono text-xl text-white tracking-wider">{formatAddress(address)}</p>
                <button onClick={() => disconnect()} className="text-xs text-red-400 hover:text-red-300 underline">Disconnect</button>
              </div>
            )}
          </div>

          {/* READ VALUE SECTION (FROM API) */}
          <div className="bg-black/20 rounded-xl p-6 border border-white/5 mb-6 text-center">
            <p className="text-gray-400 text-xs uppercase tracking-wider mb-2">Value from NestJS Backend</p>
            <div className="text-5xl font-mono font-bold text-white mb-4">
              {isFetching ? <span className="animate-pulse text-gray-600">...</span> : backendValue}
            </div>
            <button onClick={fetchData} className="text-xs text-gray-400 hover:text-white flex items-center justify-center gap-2 mx-auto">
              🔄 Refresh Data
            </button>
          </div>

          {/* WRITE VALUE SECTION */}
          <div className="space-y-4">
            <input type="number" placeholder="Enter new value..." value={inputValue} onChange={(e) => setInputValue(e.target.value)} disabled={!isConnected || isWrongNetwork} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-red-500 transition-all" />
            <button onClick={handleSetValue} disabled={isSigning || isConfirming || !isConnected || !inputValue || isWrongNetwork} className={`w-full py-3 rounded-xl font-semibold transition-all shadow-lg ${isSigning || isConfirming ? 'bg-gray-800' : 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white'}`}>
              {isSigning ? 'Check Wallet...' : isConfirming ? 'Confirming...' : 'Write to Blockchain'}
            </button>
          </div>

        </div>
        
        {/* FOOTER */}
        <div className="mt-8 text-center space-y-1">
          <div className="inline-flex items-center justify-center gap-4 px-6 py-2 rounded-full bg-white/5 border border-white/5 backdrop-blur-sm">
            <p className="text-sm font-medium text-gray-300"><span className="text-red-500 font-bold mr-1">NAMA:</span> SOFYAN AGUNG</p>
            <div className="w-px h-3 bg-gray-700"></div>
            <p className="text-sm font-medium text-gray-300"><span className="text-red-500 font-bold mr-1">NIM:</span> 231011400159</p>
          </div>
        </div>
      </div>
    </main>
  );
}