// Add Buffer polyfill for browser environment
if (typeof window !== 'undefined' && !window.Buffer) {
  window.Buffer = {
    from: (data: any, encoding?: string) => {
      if (typeof data === 'string') {
        return new TextEncoder().encode(data);
      }
      return data;
    },
    alloc: (size: number) => new Uint8Array(size),
    isBuffer: (obj: any) => obj instanceof Uint8Array,
  } as any;
}

import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { Connection, PublicKey, LAMPORTS_PER_SOL, clusterApiUrl } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { AnchorProvider, Program, Idl } from "@project-serum/anchor";
import { WalletAdapter } from "@solana/wallet-adapter-base";
import idl from "../assets/idl.json";
import * as anchor from "@project-serum/anchor";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';


interface Beneficiary {
  name: string;
  email: string;
}

// Add wallet type declarations
interface PhantomWindow extends Window {
  phantom?: {
    solana?: {
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      on: (event: string, callback: (args: any) => void) => void;
      request: (method: string, params: any) => Promise<any>;
      isPhantom?: boolean;
    };
  };
}

interface EthereumWindow extends Window {
  ethereum?: {
    request: (args: { method: string; params?: any[] }) => Promise<any>;
    on: (event: string, callback: (args: any) => void) => void;
    isMetaMask?: boolean;
  };
}

// Use a valid Solana public key for testing
// This is a dummy program ID - replace with your actual program ID when ready
const PROGRAM_ID = new PublicKey("8S8xBT9QucqzVdybrp7Yaxkw77WVqpdc19bsLBcXidtZ");



const SponsorView = () => {
  const navigate = useNavigate();
  const [beneficiaryEmail, setBeneficiaryEmail] = useState<string>("");
  const [beneficiaryName, setBeneficiaryName] = useState<string>("");
  const [step, setStep] = useState<number>(0);
  const [isRegisteredUser, setIsRegisteredUser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [registeredUserName, setRegisteredUserName] = useState<string>("");
  const [data, setData] = useState<any>(null);
  const [accountBalance, setAccountBalance] = useState<string>("0");
  const [amountToSend, setAmountToSend] = useState<string>("");
  const [programConnected, setProgramConnected] = useState<boolean>(false);
  const [program, setProgram] = useState<any>(null);
  const { connection } = useConnection();
  const wallet = useWallet();
  // USDC token addresses
  const SOLANA_USDC_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // Solana devnet USDC mint address
  const ETHEREUM_USDC_ADDRESS = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // Ethereum USDC contract address

  // Function to test connection to your smart contract
  const testProgramConnection = async () => {
    try {
      // First check if wallet is connected
      if (!wallet.connected || !wallet.publicKey) {
        alert('Please connect your Phantom wallet first. Click the wallet icon in the top right to connect.');
        return;
      }
      
      console.log("✅ Wallet connected:", wallet.publicKey.toBase58());

      // Set up connection to devnet
      const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
      
      // Check if the program exists
      const accountInfo = await connection.getAccountInfo(PROGRAM_ID);
      if (!accountInfo) {
        console.error("❌ Program does not exist on the network");
        alert("❌ Program does not exist on the network. Please check your program ID or ensure you're connected to the Solana devnet.");
        setProgramConnected(false);
        return false;
      }

      // Create a wallet adapter that's compatible with AnchorProvider
      const walletAdapter = {
        publicKey: wallet.publicKey,
        signTransaction: async (tx: any) => {
          if (!wallet.signTransaction) {
            throw new Error("Wallet does not support transaction signing");
          }
          return await wallet.signTransaction(tx);
        },
        signAllTransactions: async (txs: any[]) => {
          if (!wallet.signAllTransactions) {
            throw new Error("Wallet does not support transaction signing");
          }
          return await wallet.signAllTransactions(txs);
        }
      };

      // Create Anchor Provider
      const provider = new AnchorProvider(connection, walletAdapter as any, {
        commitment: "confirmed",
      });

      // Instantiate the Program
      const program = new Program(idl as Idl, PROGRAM_ID, provider);
      
      // Log connection details
      console.log("🧠 Program ID:", PROGRAM_ID.toBase58());
      console.log("✅ Wallet connected:", wallet.publicKey.toBase58());
      console.log("✅ Program exists on the network");

      // Set program state
      setProgram(program);
      setProgramConnected(true);

      alert("🚀 Connected to program successfully!");
      return true;
    } catch (error) {
      console.error("❌ Error connecting to program:", error);
      alert("❌ Failed to connect to the program. Make sure you're connected to the Solana devnet in your Phantom wallet.");
      setProgramConnected(false);
      return false;
    }
  };

  // Function to get Solana USDC balance
  const getSolanaBalance = async (publicKey: string) => {
    try {
      // Connect to Solana devnet
      const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
      const pubKey = new PublicKey(publicKey);
      const usdcMint = new PublicKey(SOLANA_USDC_ADDRESS);
      
      console.log('Fetching USDC balance for address:', publicKey);
      console.log('Using USDC mint address:', SOLANA_USDC_ADDRESS);
      
      // Find token accounts owned by the user
      const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
        pubKey,
        { mint: usdcMint }
      );
      
      console.log('Found token accounts:', tokenAccounts.value.length);
      
      // Calculate total USDC balance
      let totalBalance = 0;
      for (const account of tokenAccounts.value) {
        const parsedInfo = account.account.data.parsed.info;
        const balance = parsedInfo.tokenAmount.uiAmount;
        console.log('Token account balance:', balance);
        totalBalance += balance;
      }
      
      console.log('Total USDC balance:', totalBalance);
      setAccountBalance(totalBalance.toFixed(2));
    } catch (error) {
      console.error('Error fetching Solana USDC balance:', error);
      setAccountBalance("0");
    }
  };

  // Function to get Ethereum USDC balance
  const getEthereumBalance = async (address: string) => {
    try {
      const ethereumWindow = window as unknown as EthereumWindow;
      
      // ERC-20 balanceOf function call
      const balance = await ethereumWindow.ethereum?.request({
        method: 'eth_call',
        params: [
          {
            to: ETHEREUM_USDC_ADDRESS,
            data: `0x70a08231${address.slice(2).padStart(64, '0')}` // balanceOf(address) function call
          },
          'latest'
        ]
      });
      
      if (balance) {
        // Convert hex to decimal and divide by 10^6 (USDC has 6 decimals)
        const balanceInUSDC = parseInt(balance, 16) / 1e6;
        setAccountBalance(balanceInUSDC.toFixed(2));
      }
    } catch (error) {
      console.error('Error fetching Ethereum USDC balance:', error);
      setAccountBalance("0");
    }
  };

  // Function to fetch wallet balance
  const fetchWalletBalance = async () => {
    const walletAddress = wallet.publicKey?.toBase58();

    const walletType = sessionStorage.getItem('walletType');

    if (!walletAddress || !walletType) {
      setAccountBalance("0");
      return;
    }

    if (walletType === 'phantom') {
      await getSolanaBalance(walletAddress);
    } else if (walletType === 'metamask') {
      await getEthereumBalance(walletAddress);
    }
  };

  // Fetch balance when component mounts and when wallet changes
  useEffect(() => {
    fetchWalletBalance();
    
    // Set up event listeners for balance updates
    const phantomWindow = window as unknown as PhantomWindow;
    const ethereumWindow = window as unknown as EthereumWindow;
    
    if (phantomWindow.phantom?.solana) {
      phantomWindow.phantom.solana.on('accountChanged', fetchWalletBalance);
    }
    if (ethereumWindow.ethereum) {
      ethereumWindow.ethereum.on('accountsChanged', fetchWalletBalance);
    }

    // Check if we can connect to the program
    const checkProgramConnection = async () => {
      const walletAddress = wallet.publicKey?.toBase58();

      const walletType = sessionStorage.getItem('walletType');
      
      if (walletAddress && walletType === 'phantom') {
        try {
          // Set up connection to devnet
          const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
          
          // Check if the program exists
          const accountInfo = await connection.getAccountInfo(PROGRAM_ID);
          if (!accountInfo) {
            console.error("❌ Program does not exist on the network");
            setProgramConnected(false);
            return;
          }
          
          // Create a wallet adapter object with proper signTransaction implementation
          const walletAdapter = {
            publicKey: wallet.publicKey,
            signTransaction: async (tx: any) => {
              if (!wallet.signTransaction) {
                throw new Error("Wallet does not support transaction signing");
              }
              return await wallet.signTransaction(tx);
            },
            signAllTransactions: async (txs: any[]) => {
              if (!wallet.signAllTransactions) {
                throw new Error("Wallet does not support transaction signing");
              }
              return await wallet.signAllTransactions(txs);
            }
          };

          // Create Anchor Provider
          const provider = new AnchorProvider(connection, walletAdapter as any, {
            commitment: "confirmed",
          });

          // Instantiate the Program
          const program = new Program(idl as Idl, PROGRAM_ID, provider);
          
          // Log connection details
          console.log("🧠 Program ID:", PROGRAM_ID.toBase58());
          console.log("✅ Wallet connected:", walletAddress);
          console.log("✅ Program exists on the network");
          
          // Set program state
          setProgram(program);
          setProgramConnected(true);
        } catch (error) {
          console.error("❌ Error checking program connection:", error);
          setProgramConnected(false);
        }
      } else {
        setProgramConnected(false);
      }
    };
    
    checkProgramConnection();

    return () => {
      // Clean up event listeners
      if (phantomWindow.phantom?.solana) {
        phantomWindow.phantom.solana.on('accountChanged', () => {});
      }
      if (ethereumWindow.ethereum) {
        ethereumWindow.ethereum.on('accountsChanged', () => {});
      }
    };
  }, []);

  const handleGoBack = () => {
    navigate('/');
  };

  const pastBeneficiaries: Beneficiary[] = [
    { name: "John Doe", email: "lakumar@ttu.edu" },
    { name: "Jane Smith", email: "k.laksh@hotmail.com" },
    { name: "Alice Johnson", email: "alice@example.com" },
    { name: "Bob Brown", email: "bob@example.com" },
  ];

  const checkUserRegistration = async (email: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/user/${email}`);
      const data = await response.json();
      setIsRegisteredUser(response.ok && data.user);
      if (response.ok && data.user) {
        setRegisteredUserName(data.user.name || "");
        setData(data);
      } else {
        setRegisteredUserName("");
        setData(null);
      }
    } catch (error) {
      console.error('Error checking user registration:', error);
      setIsRegisteredUser(false);
      setRegisteredUserName("");
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  const goToNextStep = async () => {
    if (step === 0 && beneficiaryEmail && beneficiaryName) {
      try {
        setLoading(true);
        await checkUserRegistration(beneficiaryEmail);
        setStep(1);
      } catch (error) {
        console.error('Error in goToNextStep:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const goToPreviousStep = () => {
    setStep(0);
  };

  const handleBeneficiaryClick = (beneficiary: Beneficiary) => {
    setBeneficiaryEmail(beneficiary.email);
    setBeneficiaryName(beneficiary.name);
  };

  const handleDirectTransfer = async () => {
    if (!wallet.connected || !wallet.publicKey) {
      alert("Please connect your Phantom wallet");
      return;
    }
    try {
      if (!amountToSend || parseFloat(amountToSend) <= 0) {
        alert('Please enter a valid amount');
        return;
      }

  
      if (!isRegisteredUser || !data?.user?.wallet_address) {
        alert('Beneficiary must be registered with a connected wallet to receive direct transfers');
        return;
      }
  
      const sponsorPubKey = wallet.publicKey;
      const merchantPubKey = new PublicKey(data.user.wallet_address);
      const amountInSmallestUnit = Math.floor(parseFloat(amountToSend) * 1e6);
      const usdcMint = new PublicKey(SOLANA_USDC_ADDRESS);
  
      const sponsorTokenAccounts = await connection.getParsedTokenAccountsByOwner(
        sponsorPubKey,
        { mint: usdcMint }
      );
      if (sponsorTokenAccounts.value.length === 0) {
        alert('You do not have a USDC token account');
        return;
      }
      const sponsorTokenAccount = new PublicKey(sponsorTokenAccounts.value[0].pubkey);
  
      const merchantTokenAccounts = await connection.getParsedTokenAccountsByOwner(
        merchantPubKey,
        { mint: usdcMint }
      );
      if (merchantTokenAccounts.value.length === 0) {
        alert('Beneficiary does not have a USDC token account');
        return;
      }
      const merchantTokenAccount = new PublicKey(merchantTokenAccounts.value[0].pubkey);
  
      // Create a wallet adapter that's compatible with AnchorProvider
      const walletAdapter = {
        publicKey: wallet.publicKey,
        signTransaction: async (tx: any) => {
          if (!wallet.signTransaction) {
            throw new Error("Wallet does not support transaction signing");
          }
          return await wallet.signTransaction(tx);
        },
        signAllTransactions: async (txs: any[]) => {
          if (!wallet.signAllTransactions) {
            throw new Error("Wallet does not support transaction signing");
          }
          return await wallet.signAllTransactions(txs);
        }
      };
  
      const provider = new AnchorProvider(connection, walletAdapter as any, {
        commitment: "confirmed",
      });
  
      const program = new Program(idl as Idl, PROGRAM_ID, provider);
  
      const tx = await program.methods
        .directTransfer(new anchor.BN(amountInSmallestUnit))
        .accounts({
          sponsor: sponsorPubKey,
          sponsorTokenAccount,
          merchantTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
  
      console.log("✅ Direct transfer successful:", tx);
      alert(`Transfer successful! Transaction ID: ${tx}`);
      fetchWalletBalance();
  
    } catch (error: any) {
      console.error("❌ Error in direct transfer:", error);
      alert(`Transfer failed: ${error.message || 'Unknown error'}`);
    }
  };
  

  const handleEscrowTransfer = async () => {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        alert('Please connect your Phantom wallet first');
        return false;
      }
      
      const walletAddress = wallet.publicKey.toBase58();
      const walletType = sessionStorage.getItem('walletType');

      if (!amountToSend || parseFloat(amountToSend) <= 0) {
        alert('Please enter a valid amount');
        return;
      }

      const response = await fetch('http://localhost:3001/api/escrow/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          beneficiaryEmail,
          beneficiaryName,
          amount: amountToSend,
          currency: 'USDC',
          senderWalletAddress: walletAddress,
          senderWalletType: walletType
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create escrow');
      }

      alert('Escrow transfer created successfully! The beneficiary will be able to claim this amount once they register.');
      navigate('/');
    } catch (error) {
      console.error('Error in escrow transfer:', error);
      alert(error instanceof Error ? error.message : 'Failed to create escrow transfer');
    }
  };

  return (
    <div className="min-h-screen flexCol">
      <div className="w-[60%] mx-auto bg-[#141a20] text-[20px] py-[40px] rounded-[20px] overflow-hidden">
        {/* Add connection status indicator at the top */}
        <div className="flex justify-between items-center mb-[20px] px-[5vw]">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${wallet.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-[16px]">
              {wallet.connected ? 'Wallet Connected' : 'Wallet Not Connected'}
            </span>
          </div>
          {!wallet.connected && (
            <WalletMultiButton className="bg-[#2b3642] text-[16px] px-[15px] py-[5px] rounded-[10px] hover:bg-[#3a4a5a]" />
          )}
        </div>
        
        {/* Program connection status */}
        <div className="flex justify-between items-center mb-[20px] px-[5vw]">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${programConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-[16px]">
              {programConnected ? 'Connected to Smart Contract' : 'Program Not Found'}
            </span>
          </div>
          <button
            onClick={testProgramConnection}
            className="bg-[#2b3642] text-[16px] px-[15px] py-[5px] rounded-[10px] hover:bg-[#3a4a5a]"
            disabled={!wallet.connected}
          >
            {programConnected ? 'Reconnect' : 'Check Program'}
          </button>
        </div>
        
        {/* Add detailed connection info when connected */}
        {programConnected && (
          <div className="bg-[#2b3642] text-[14px] px-[5vw] py-[10px] mb-[20px] rounded-[10px]">
            <div className="flex justify-between">
              <div>
                <span className="font-bold">Program ID: </span>
                <span className="text-[#e6e6e6]">{PROGRAM_ID.toBase58()}</span>
              </div>
              <div>
                <span className="font-bold">Wallet: </span>
                <span className="text-[#e6e6e6]">
                  {(() => {
                    const walletAddress = wallet.publicKey?.toBase58();

                    if (!walletAddress) return 'Not connected';
                    return `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}`;
                  })()}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${step * 100}%)` }}>
          {/* Step 1 */}
          <div className="w-full flex-shrink-0 px-[5vw]">
            <h2 className="text-[30px] text-center pb-[20px] font-bold">Step 1: Enter Beneficiary Details</h2>
            <div>
              <label>Beneficiary Name:</label><br />
              <input
                type="text"
                value={beneficiaryName}
                onChange={(e) => setBeneficiaryName(e.target.value)}
                placeholder="Enter name"
                className="border-[1px] border-[#999] w-full px-[1em] py-[0.5em] rounded-[15px] my-[0.5em]"
              />
            </div>
            <div>
              <label>Email Address:</label><br />
              <input
                type="email"
                value={beneficiaryEmail}
                onChange={(e) => setBeneficiaryEmail(e.target.value)}
                placeholder="Enter email address"
                className="border-[1px] border-[#999] w-full px-[1em] py-[0.5em] rounded-[15px] my-[0.5em]"
              />
            </div>

            <div className="flex gap-[2vw] mt-[20px]">
              <button
                type="button"
                onClick={handleGoBack}
                className="w-1/2 bg-[#2b3642] text-[24px] rounded-[10px] py-[0.3em] cursor-pointer"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={goToNextStep}
                disabled={!beneficiaryEmail || !beneficiaryName || loading}
                className="w-1/2 text-[24px] rounded-[10px] py-[0.3em] bg-white text-[#141a20] cursor-pointer disabled:bg-[#2b3642] disabled:text-white"
              >
                {loading ? 'Checking...' : 'Next'}
              </button>
            </div>

            <h3 className="text-[24px] mt-[20px] mb-[10px]">Past Beneficiaries:</h3>
            <ul className="border-[1px] border-[#333] h-[5.92em] overflow-y-scroll rounded-[10px]">
              {pastBeneficiaries.map((beneficiary, index) => (
                <li
                  key={index}
                  className="border-b-[1px] border-[#333] py-[0.2em] px-[20px] flex justify-between cursor-pointer hover:bg-[#1d252d]"
                  onClick={() => handleBeneficiaryClick(beneficiary)}
                >
                  <div>{beneficiary.name}</div>
                  <div>{beneficiary.email}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Step 2 */}
          <div className="w-full flex-shrink-0 px-[5vw]">
            <h2 className="text-[30px] font-bold text-center pb-[1em] text-white">Step 2: Enter Amount to Send</h2>
            <div>
              <div className="bg-[#2b3642] text-[18px] px-[1em] py-[0.5em] rounded-[10px]">
                <h3 className="text-[18px] font-bold">Beneficiary Details</h3>
                <p className="text-[#e6e6e6]">Name: {beneficiaryName}</p>
                <p className="text-[#e6e6e6]">Email: {beneficiaryEmail} {isRegisteredUser && registeredUserName ? `(Registered as ${registeredUserName} on Reppay)` : ''}</p>
                {isRegisteredUser && (
                  <>
                    <p className="text-[#e6e6e6]">Wallet Type: {data?.user?.wallet_type || 'Not connected'}</p>
                    <p className="text-[#e6e6e6]">Wallet Address: {data?.user?.wallet_address ? `${data.user.wallet_address.substring(0, 6)}...${data.user.wallet_address.substring(data.user.wallet_address.length - 4)}` : 'Not connected'}</p>
                  </>
                )}
              </div>
              <div className="mt-[0.5em] bg-[#2b3642] text-[18px] px-[1em] py-[0.5em] rounded-[10px]">
                <p className="font-bold">Account Balance: <br /> {accountBalance} USDC</p>
              </div>

              <div className="mt-[20px]">
                <label>Amount to Send:</label>
                <input
                  type="number"
                  value={amountToSend}
                  onChange={(e) => setAmountToSend(e.target.value)}
                  placeholder="Enter amount"
                  className="border-[1px] border-[#999] w-full px-[1em] py-[0.5em] rounded-[15px] my-[0.3em]"
                />
              </div>

              <div className="flex gap-[2vw] mt-[20px]">
                <div className="w-1/2 relative group">
                  <button
                    type="button"
                    onClick={handleDirectTransfer}
                    disabled={!isRegisteredUser || !amountToSend}
                    className="w-full text-[24px] rounded-[10px] py-[0.3em] bg-white text-[#141a20] cursor-pointer disabled:bg-[#2b3642] disabled:text-white"
                  >
                    Direct Transfer
                  </button>
                  {!isRegisteredUser && (
                    <div className="absolute hidden group-hover:block bg-[#1d252d] text-white p-2 rounded mt-2 w-64 text-sm z-10 left-1/2 transform -translate-x-1/2">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[#2b3642] flex items-center justify-center">
                          <span className="text-white text-xs font-bold">i</span>
                        </div>
                        <span>Direct transfer is only available for registered users. Please use Escrow Transfer instead.</span>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleEscrowTransfer}
                  disabled={!amountToSend}
                  className="w-1/2 text-[24px] rounded-[10px] py-[0.3em] bg-white text-[#141a20] cursor-pointer disabled:bg-[#2b3642] disabled:text-white"
                >
                  Escrow Transfer
                </button>
              </div>

              <div className="mt-[20px]">
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="w-full bg-[#2b3642] text-[24px] rounded-[10px] py-[0.3em] cursor-pointer"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SponsorView;