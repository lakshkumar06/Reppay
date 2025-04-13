import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';
import { useWallet } from "@solana/wallet-adapter-react";

interface SignupProps {
  onSignupComplete: () => void;
}

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

const Signup: React.FC<SignupProps> = ({ onSignupComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // API base URL
  const API_URL = 'http://localhost:3001/api';

  const handleEmailSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!name.trim()) {
        throw new Error('Please enter your name');
      }
      
      const response = await fetch(`${API_URL}/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, name }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send OTP');
      }

      setCurrentStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`${API_URL}/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify OTP');
      }

      setCurrentStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const connectPhantomWallet = async () => {
    try {
      if (!window.phantom?.solana) {
        throw new Error('Phantom wallet is not installed');
      }

      const response = await window.phantom.solana.connect();
      return response.publicKey.toString();
    } catch (err) {
      throw new Error('Failed to connect Phantom wallet');
    }
  };

  const connectMetaMaskWallet = async () => {
    try {
      if (!window.ethereum) {
        throw new Error('MetaMask is not installed');
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });
      
      return accounts[0];
    } catch (err) {
      throw new Error('Failed to connect MetaMask wallet');
    }
  };

  const handleWalletConnection = async (walletType: 'phantom' | 'metamask') => {
    try {
      setLoading(true);
      setError('');
      
      let walletAddress;
      if (walletType === 'phantom') {
        walletAddress = await connectPhantomWallet();
      } else {
        walletAddress = await connectMetaMaskWallet();
      }

      const response = await fetch(`${API_URL}/connect-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email,
          name,
          walletType,
          walletAddress
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to connect wallet');
      }

      // Store wallet information and user email in sessionStorage
      sessionStorage.setItem('walletAddress', walletAddress);
      sessionStorage.setItem('walletType', walletType);
      sessionStorage.setItem('userEmail', email);

      setCurrentStep(4);
      onSignupComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-container">
      {error && <div className="error-message">{error}</div>}
      
      {currentStep === 1 && (
        <div className="step-1">
          <h2 className='text-[#3b3b3b]'>Enter Your Details</h2>
          <input
            type="text"
            className="input-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name"
            disabled={loading}
          />
          <input
            type="email"
            className="input-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            disabled={loading}
          />
          <button
            className="btn-submit"
            onClick={handleEmailSubmit}
            disabled={loading || !email || !name}
          >
            {loading ? 'Sending OTP...' : 'Send OTP'}
          </button>
        </div>
      )}

      {currentStep === 2 && (
        <div className="step-2">
          <h2>Enter OTP</h2>
          <p className="otp-info">We've sent an OTP to {email}</p>
          <input
            type="text"
            className="input-field"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            placeholder="Enter OTP"
            disabled={loading}
          />
          <button
            className="btn-submit"
            onClick={handleOtpSubmit}
            disabled={loading || !otp}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </div>
      )}

      {currentStep === 3 && (
        <div className="step-3">
          <h2>Connect Your Wallet</h2>
          <p className="wallet-info">Choose your preferred wallet to continue</p>
          <button
            className="btn-wallet"
            onClick={() => handleWalletConnection('phantom')}
            disabled={loading}
          >
            Connect Phantom Wallet
          </button>
          <button
            className="btn-wallet"
            onClick={() => handleWalletConnection('metamask')}
            disabled={loading}
          >
            Connect MetaMask Wallet
          </button>
        </div>
      )}

      {currentStep === 4 && (
        <div className="step-3">
          <h2>Success!</h2>
          <p className="wallet-info">Your account has been created successfully.</p>
          <button
            className="btn-submit"
            onClick={() => navigate('/')}
          >
            Go to Dashboard
          </button>
        </div>
      )}
    </div>
  );
};

export default Signup;
