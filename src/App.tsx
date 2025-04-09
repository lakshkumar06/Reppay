import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Homepage from './pages/Homepage'; // Your Homepage component
import HomepageBL from './pages/HomepageBL'; // Your Homepage with sign-up page
import MerchantView from './pages/MerchantView'; // Your Merchant view component
import SponsorView from './pages/SponsorView'; // Your Sponsor view component
import Signup from './pages/Signup'; // Import Signup page
import { useState, useEffect } from 'react';

// Contract address for ZepPay
const App = () => {
  // Use React state for signup status
  const [isUserSignedUp, setIsUserSignedUp] = useState(false);
  
  // Check if user is signed up on component mount
  useEffect(() => {
    // We'll use sessionStorage instead of localStorage for temporary persistence
    // This will be cleared when the browser tab is closed
    const signedUp = sessionStorage.getItem('isUserSignedUp') === 'true';
    setIsUserSignedUp(signedUp);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={isUserSignedUp ? <Homepage /> : <HomepageBL />} />
        <Route path="/signup" element={<Signup onSignupComplete={() => {
          // Store in sessionStorage instead of localStorage
          sessionStorage.setItem('isUserSignedUp', 'true');
          setIsUserSignedUp(true);
        }} />} />
        <Route path="/merchant" element={<MerchantView/>} />
        <Route path="/sponsor" element={<SponsorView />} />
      </Routes>
    </Router>
  );
};

export default App;