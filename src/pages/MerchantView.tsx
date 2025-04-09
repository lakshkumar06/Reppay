import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const MerchantView = () => {
  const [amount, setAmount] = useState('');
  const [beneficiaryPhoneNumber, setBeneficiaryPhoneNumber] = useState('');
  const navigate = useNavigate(); // Using navigate for routing in React Router v6

  const handleGoBack = () => {
    navigate('/'); // Redirects to the home page
  };

  const handleConfirm = () => {
    // Add your confirm logic here
    console.log("Amount:", amount);
    console.log("Beneficiary Phone Number:", beneficiaryPhoneNumber);
  };

  return (
    <div className="min-h-screen flexCol">
      <form className='w-[50%] mx-auto bg-[#141a20] text-[20px] px-[5vw] py-[70px] rounded-[20px]'>
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
        <div>
          <label htmlFor="beneficiaryPhoneNumber" className=''>Beneficiary Phone Number:</label><br />
          <input
            type="text"
            id="beneficiaryPhoneNumber"
            value={beneficiaryPhoneNumber}
            onChange={(e) => setBeneficiaryPhoneNumber(e.target.value)}
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
  );
};

export default MerchantView;
