import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

// Add TypeScript declarations for wallet providers
declare global {
  interface Window {
    phantom?: {
      solana?: {
        connect: () => Promise<{ publicKey: { toString: () => string } }>;
      };
    };
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
    };
  }
}

const HomepageBL = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // API base URL
  const API_URL = 'http://localhost:3001/api';

  const handleLogin = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Check if user exists
      const response = await fetch(`${API_URL}/user/${email}`);
      const data = await response.json();

      if (!response.ok || !data.user) {
        // User not found, redirect to signup
        navigate("/signup");
        return;
      }

      // User exists, attempt to connect wallet
      const user = data.user;
      
      if (user.wallet_type === 'phantom') {
        // Connect to Phantom wallet
        if (!window.phantom?.solana) {
          setError("Phantom wallet is not installed. Please install it and try again.");
          return;
        }

        try {
          const response = await window.phantom.solana.connect();
          const walletAddress = response.publicKey.toString();
          
          // Store wallet information in sessionStorage
          sessionStorage.setItem('walletAddress', walletAddress);
          sessionStorage.setItem('walletType', 'phantom');
          sessionStorage.setItem('isUserSignedUp', 'true');
          
          // Reload the page to show the homepage with connected wallet
          window.location.reload();
        } catch (err) {
          setError("Failed to connect Phantom wallet. Please try again.");
        }
      } else if (user.wallet_type === 'metamask') {
        // Connect to MetaMask wallet
        if (!window.ethereum) {
          setError("MetaMask is not installed. Please install it and try again.");
          return;
        }

        try {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
          });
          
          const walletAddress = accounts[0];
          
          // Store wallet information in sessionStorage
          sessionStorage.setItem('walletAddress', walletAddress);
          sessionStorage.setItem('walletType', 'metamask');
          sessionStorage.setItem('isUserSignedUp', 'true');
          
          // Reload the page to show the homepage with connected wallet
          window.location.reload();
        } catch (err) {
          setError("Failed to connect MetaMask wallet. Please try again.");
        }
      } else {
        setError("Unknown wallet type. Please sign up again.");
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flexCol">
      <div className="w-[60%] mx-auto bg-[#141a20] text-[20px] py-[40px] px-[5vw] rounded-[20px]">
        <h1 className="text-[30px] font-bold text-center mb-[20px]">Welcome to Reppay</h1>
        <p className="text-center mb-[30px]">Please login or sign up to continue.</p>
        
        {error && <div className="bg-red-900 text-white p-3 rounded-lg mb-4">{error}</div>}
        
        <div className="mb-6">
          <label className="block mb-2">Email Address:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            className="border-[1px] border-[#999] w-full px-[1em] py-[0.5em] rounded-[15px] my-[0.5em]"
          />
        </div>
        
        <div className="flex gap-[2vw] mb-6">
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-1/2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            {loading ? "Connecting..." : "Login"}
          </button>
          <Link
            to="/signup"
            className="w-1/2 bg-[#2b3642] hover:bg-[#3b4652] text-white px-4 py-2 rounded-lg text-center"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomepageBL;
  