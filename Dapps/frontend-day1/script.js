// Mengambil elemen DOM
const connectBtn = document.getElementById("connectBtn");
const statusText = document.getElementById("statusText");
const statusBadge = document.getElementById("statusBadge");
const addressEl = document.getElementById("address");
const networkEl = document.getElementById("network");
const balanceEl = document.getElementById("balance");
const errorMsg = document.getElementById("errorMsg");

// Chain ID untuk Avalanche Fuji Testnet
const AVALANCHE_FUJI_CHAIN_ID = "0xa869";

// Menampilkan pesan error sementara
function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.style.display = "block";
  setTimeout(() => { errorMsg.style.display = "none"; }, 5000);
}

// Fungsi utama update UI
async function updateUI() {
  try {
    const accounts = await window.ethereum.request({ method: "eth_accounts" });
    
    if (accounts.length === 0) {
      resetUI();
      return;
    }

    const address = accounts[0];
    const chainId = await window.ethereum.request({ method: "eth_chainId" });

    // --- PERUBAHAN: Menampilkan Full Address ---
    // Tidak ada lagi fungsi shortenAddress()
    addressEl.textContent = address; 
    // ------------------------------------------

    if (chainId === AVALANCHE_FUJI_CHAIN_ID) {
      networkEl.textContent = "Avalanche Fuji";
      statusText.textContent = "Active";
      statusBadge.classList.add("connected");
      
      // Ambil Balance
      const balanceWei = await window.ethereum.request({
        method: "eth_getBalance",
        params: [address, "latest"],
      });
      
      // Konversi Wei ke AVAX
      const balance = parseInt(balanceWei, 16) / 1e18;
      balanceEl.textContent = balance.toFixed(4);

      // Disable tombol setelah konek
      connectBtn.disabled = true;
      connectBtn.textContent = "Wallet Connected";
    } else {
      // Salah Network
      networkEl.textContent = "Wrong Network";
      statusText.textContent = "Switch Chain";
      statusBadge.classList.remove("connected");
      balanceEl.textContent = "-";
      
      connectBtn.disabled = false;
      connectBtn.textContent = "Switch to Fuji";
    }
  } catch (err) {
    console.error("Error updating UI:", err);
  }
}

// Reset tampilan ke default
function resetUI() {
  addressEl.textContent = "-";
  networkEl.textContent = "-";
  balanceEl.textContent = "-";
  statusText.textContent = "Disconnected";
  statusBadge.classList.remove("connected");
  connectBtn.disabled = false;
  connectBtn.textContent = "Connect Wallet";
}

// Logika Koneksi Wallet
async function connectWallet() {
  if (typeof window.ethereum === "undefined") {
    showError("Core Wallet tidak ditemukan. Harap instal terlebih dahulu.");
    return;
  }

  try {
    // 1. Request akses akun
    await window.ethereum.request({ method: "eth_requestAccounts" });
    
    // 2. Cek Network, jika bukan Fuji minta switch
    const currentChainId = await window.ethereum.request({ method: "eth_chainId" });
    if (currentChainId !== AVALANCHE_FUJI_CHAIN_ID) {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: AVALANCHE_FUJI_CHAIN_ID }],
            });
        } catch (switchError) {
            // Error 4902 berarti chain belum ditambahkan ke wallet
            if (switchError.code === 4902) {
                showError("Silakan tambahkan Avalanche Fuji Testnet secara manual.");
            } else {
                showError("Gagal mengganti network.");
            }
            return;
        }
    }
    
    updateUI();
  } catch (error) {
    if (error.code === 4001) {
        showError("Koneksi dibatalkan oleh user.");
    } else {
        showError("Terjadi kesalahan koneksi.");
    }
  }
}

// Event Listeners
if (window.ethereum) {
  // Deteksi ganti akun
  window.ethereum.on('accountsChanged', (accounts) => {
    if (accounts.length === 0) resetUI();
    else updateUI();
  });

  // Deteksi ganti network
  window.ethereum.on('chainChanged', () => {
    window.location.reload(); 
  });
}

connectBtn.addEventListener("click", connectWallet);

// Cek status saat halaman dimuat
window.addEventListener('load', () => {
    if (window.ethereum) updateUI();
});