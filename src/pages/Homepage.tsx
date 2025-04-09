import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

const Homepage = () => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletType, setWalletType] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve wallet information from sessionStorage instead of localStorage
    const storedAddress = sessionStorage.getItem('walletAddress');
    const storedType = sessionStorage.getItem('walletType');
    
    if (storedAddress) {
      setWalletAddress(storedAddress);
    }
    
    if (storedType) {
      setWalletType(storedType);
    }
  }, []);

  // Function to format wallet address for display (truncate middle)
  const formatWalletAddress = (address: string) => {
    if (!address) return '';
    if (address.length <= 10) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  // Function to disconnect wallet
  const disconnectWallet = async () => {
    try {
      // Disconnect from the wallet provider
      if (walletType === 'phantom') {
        const solanaWindow = window as any;
        if (solanaWindow.solana && solanaWindow.solana.isPhantom) {
          await solanaWindow.solana.disconnect();
        }
      } else if (walletType === 'metamask') {
        // MetaMask doesn't have a direct disconnect method, but we can clear the connection
        // by removing the stored account
        const ethereumWindow = window as any;
        if (ethereumWindow.ethereum) {
          // We can't programmatically disconnect, but we can clear our stored data
          console.log('MetaMask wallet disconnected');
        }
      }

      // Clear wallet information from sessionStorage
      sessionStorage.removeItem('walletAddress');
      sessionStorage.removeItem('walletType');
      sessionStorage.removeItem('isUserSignedUp');
      
      // Update state
      setWalletAddress(null);
      setWalletType(null);
      
      // Show success message
      alert('Logged out successfully');
      
      // Reload the page to reset the app state
      window.location.reload();
    } catch (error) {
      console.error('Error logging out:', error);
      alert('Failed to log out. Please try again.');
    }
  };

  return (
    <div className='min-h-screen flexCol'>
      {/* Wallet Info Section */}
      {walletAddress && (
        <div className="w-4/5 mx-auto max-w-[2000px] mb-8 bg-[#141a20] p-4 rounded-[20px]">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-[18px] font-medium">Connected Wallet</h3>
              <p className="text-gray-400">{formatWalletAddress(walletAddress)}</p>
              <p className="text-sm text-gray-500 capitalize">{walletType}</p>
            </div>
            <div className="flex gap-2">
              <button 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                onClick={() => {
                  // Copy wallet address to clipboard
                  navigator.clipboard.writeText(walletAddress);
                  alert('Wallet address copied to clipboard!');
                }}
              >
                Copy Address
              </button>
              <button 
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
                onClick={disconnectWallet}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex x-container gap-[3vw]">
        {/* Sponsor Card */}
         <div className="text-white w-1/2 bg-[#141a20] px-[4vw] py-[40px] rounded-[20px]">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-[28px] font-semibold">Sponsor</h2>
            </div>
            <p className="mb-4 text-[18px] text-gray-300">Send money to beneficiaries with spending controls</p>
            <ul className="text-[16px] text-gray-400 space-y-2 mb-6">
              <li>✔ Add multiple beneficiaries</li>
              <li>✔ Control spending categories</li>
              <li>✔ Track where funds are spent</li>
            </ul>
            <div className="overflow-hidden">
                <div className=" text-[18px] text-end font-medium relative transform transition-all duration-300 translate-x-[25px] hover:translate-x-[0px]">
  <Link
    to="/sponsor"
    className=""
  >
    <span className="text-blue-300 pr-[0.7em]">Continue as Sponsor</span>
    <span className="text-blue-300 w-[25px] font-light">→</span>
  </Link></div>
</div>

          </div>
        </div>

        {/* Merchant Card */}
        <div className="text-white w-1/2 bg-[#141a20] px-[4vw] py-[40px] rounded-[20px]">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-[28px] font-semibold">Merchant</h2>
            </div>
            <p className="mb-4 text-[18px] text-gray-300">Accept payments from beneficiaries</p>
            <ul className="text-[16px] text-gray-400 space-y-2 mb-6">
              <li>✔ Accept digital payments</li>
              <li>✔ Simple OTP verification</li>
              <li>✔ Fast settlement to wallet</li>
            </ul>

            <div className="overflow-hidden">
                <div className=" text-[18px] text-end font-medium relative transform transition-all duration-300 translate-x-[25px] hover:translate-x-[0px]">
  <Link
    to="/merchant"
    className=""
  >
    <span className="text-green-300 pr-[0.7em]">Continue as Merchant</span>
    <span className="text-green-300 w-[25px] font-light">→</span>
  </Link></div>
</div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Homepage;
