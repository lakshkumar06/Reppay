import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { getAssociatedTokenAddress, TOKEN_PROGRAM_ID, createTransferInstruction } from "@solana/spl-token";
import { AnchorProvider, Program, Idl } from "@project-serum/anchor";
import * as anchor from "@project-serum/anchor";
import idl from "../assets/idl.json";

// Use the same program ID as in SponsorView
const PROGRAM_ID = new PublicKey("8S8xBT9QucqzVdybrp7Yaxkw77WVqpdc19bsLBcXidtZ");
const SOLANA_USDC_ADDRESS = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"; // Solana devnet USDC mint address

interface EscrowEntry {
  id: number;
  amount: string;
  currency: string;
  sender_wallet_address: string;
  created_at: string;
  transaction_id?: string; // Add transaction ID for blockchain reference
}

const MerchantView = () => {
  const [amount, setAmount] = useState('');
  const [escrowEntries, setEscrowEntries] = useState<EscrowEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingEscrow, setClaimingEscrow] = useState<number | null>(null);
  const navigate = useNavigate();
  const { connection } = useConnection();
  const wallet = useWallet();

  useEffect(() => {
    const fetchEscrowBalance = async () => {
      try {
        const email = sessionStorage.getItem('userEmail');
        if (!email) {
          setError('Please log in to view escrow balance');
          return;
        }

        const response = await fetch(`http://localhost:3001/api/escrow/balance/${email}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch escrow balance');
        }

        setEscrowEntries(data.escrowEntries);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch escrow balance');
      } finally {
        setLoading(false);
      }
    };

    fetchEscrowBalance();
  }, []);

  const handleGoBack = () => {
    navigate('/');
  };

  const handleConfirm = () => {
    // Add your confirm logic here
    console.log("Amount:", amount);
  };

  const formatWalletAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const claimEscrow = async (entry: EscrowEntry) => {
    try {
      if (!wallet.connected || !wallet.publicKey) {
        alert('Please connect your Phantom wallet first');
        return;
      }

      setClaimingEscrow(entry.id);

      // Get the merchant's public key (current user)
      const merchantPubKey = wallet.publicKey;
      
      // Get the sponsor's public key (sender)
      const sponsorPubKey = new PublicKey(entry.sender_wallet_address);
      
      // Get the USDC mint address
      const usdcMint = new PublicKey(SOLANA_USDC_ADDRESS);

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

      // Log available methods to help debug
      console.log("Available program methods:", Object.keys(program.methods));

      // Derive PDA for escrow account
      const [escrowPDA, _escrowBump] = await PublicKey.findProgramAddress(
        [Buffer.from("escrow"), wallet.publicKey.toBuffer(), merchantPubKey.toBuffer()],
        program.programId
      );

      // Derive PDA for escrow signer - using the correct seeds based on the error logs
      // The program expects different seeds than what we were using
      const [escrowSignerPDA, _escrowSignerBump] = await PublicKey.findProgramAddress(
        [Buffer.from("escrow_signer"), escrowPDA.toBuffer()],
        program.programId
      );

      // Log the PDAs for debugging
      console.log("Escrow PDA:", escrowPDA.toBase58());
      console.log("Escrow Signer PDA:", escrowSignerPDA.toBase58());

      // Get the escrow token account
      const escrowTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        escrowPDA,
        true // allowOwnerOffCurve for PDA
      );

      // Get the merchant's token account
      const merchantTokenAccount = await getAssociatedTokenAddress(
        usdcMint,
        merchantPubKey
      );

      // Convert amount to smallest unit (USDC has 6 decimals)
      const amountInSmallestUnit = Math.floor(parseFloat(entry.amount) * 1e6);

      // Try a different approach - use the direct token transfer instruction
      console.log("Using direct token transfer approach");
      
      // Create a transaction to transfer tokens from escrow to merchant
      
      // ✅ NEW - Anchor program method call
const tx = await program.methods
.claimFromEscrow(new anchor.BN(amountInSmallestUnit))
.accounts({
  escrow: escrowPDA,
  merchant: wallet.publicKey,
  merchantTokenAccount: merchantTokenAccount,
  escrowTokenAccount: escrowTokenAccount,
  escrowSigner: escrowSignerPDA,
  tokenProgram: TOKEN_PROGRAM_ID,
})
.rpc();

console.log("✅ Escrow claimed successfully. Tx:", tx);
alert(`Escrow claimed successfully! Transaction ID: ${tx}`);

      
      // Sign and send the transaction

      console.log("✅ Escrow claimed successfully. Tx:", tx);
      alert(`Escrow claimed successfully! Transaction ID: ${tx}`);

      // Update the escrow entry in the backend
      const response = await fetch(`http://localhost:3001/api/escrow/claim/${entry.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transactionId: tx
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        console.warn('Warning: Escrow claimed on blockchain but failed to update in backend:', data.error);
      }

      // Refresh the escrow entries
      const email = sessionStorage.getItem('userEmail');
      if (email) {
        const balanceResponse = await fetch(`http://localhost:3001/api/escrow/balance/${email}`);
        const balanceData = await balanceResponse.json();
        if (balanceResponse.ok) {
          setEscrowEntries(balanceData.escrowEntries);
        }
      }
    } catch (error) {
      console.error('Error claiming escrow:', error);
      alert(error instanceof Error ? error.message : 'Failed to claim escrow');
    } finally {
      setClaimingEscrow(null);
    }
  };

  return (
    <div className="min-h-screen flexCol">
      <div className='w-[50%] mx-auto bg-[#141a20] text-[20px] px-[5vw] py-[70px] rounded-[20px]'>
        {/* Wallet Connection Status */}
        <div className="flex justify-between items-center mb-[20px]">
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

        {/* Available Escrow Section */}
        <div className="mb-8">
          <h2 className="text-[24px] font-bold mb-4">Available Escrow</h2>
          {loading ? (
            <p>Loading escrow balance...</p>
          ) : error ? (
            <p className="text-red-500">{error}</p>
          ) : escrowEntries.length === 0 ? (
            <p>No available escrow found</p>
          ) : (
            <div className="space-y-4">
              {escrowEntries.map((entry) => (
                <div key={entry.id} className="bg-[#2b3642] p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="font-bold">{entry.amount} {entry.currency}</span>
                      <p className="text-sm text-gray-400">From: {formatWalletAddress(entry.sender_wallet_address)}</p>
                    </div>
                    <div className="flex flex-col items-end">
                      <div className="text-sm text-gray-400">
                        {new Date(entry.created_at).toLocaleDateString()}
                      </div>
                      <button
                        onClick={() => claimEscrow(entry)}
                        disabled={!wallet.connected || claimingEscrow === entry.id}
                        className={`mt-2 px-3 py-1 rounded text-sm ${
                          wallet.connected && claimingEscrow !== entry.id
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {claimingEscrow === entry.id ? 'Claiming...' : 'Claim'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Existing Form */}
        <form>
          <div>
            <label htmlFor="amount" className=''>Amount:</label><br />
            <input
              type="number"
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              className='border-[1px] border-[#999] w-full px-[1em] py-[0.5em] rounded-[15px] my-[0.5em]'
            />
          </div>
          <div className='flex gap-[2vw] mt-[30px]'>
            <button type="button" onClick={handleGoBack} className='w-1/2 bg-[#2b3642] text-[24px] rounded-[10px] py-[0.3em] cursor-pointer'>
              Go Back
            </button>
            <button type="button" onClick={handleConfirm} className='w-1/2 text-[24px] rounded-[10px] py-[0.3em] bg-white text-[#141a20] cursor-pointer'>
              Confirm
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MerchantView;
