import { useState } from "react";
import { useNavigate } from 'react-router-dom';

interface Beneficiary {
  name: string;
  phone: string;
}

const SponsorView = () => {
  const navigate = useNavigate();
  const [beneficiaryPhone, setBeneficiaryPhone] = useState<string>("");
  const [beneficiaryName, setBeneficiaryName] = useState<string>("");
  const [step, setStep] = useState<number>(0); // Changed to 0 for easier calculation

  const handleGoBack = () => {
    navigate('/');
  };

  const pastBeneficiaries: Beneficiary[] = [
    { name: "John Doe", phone: "1234567890" },
    { name: "Jane Smith", phone: "0987654321" },
    { name: "Alice Johnson", phone: "1122334455" },
    { name: "Bob Brown", phone: "9988776655" },
  ];

  const [accountBalance] = useState<number>(1000);
  const [amountToSend, setAmountToSend] = useState<string>("");

  const goToNextStep = () => {
    if (step === 0 && beneficiaryPhone && beneficiaryName) {
      setStep(1);
    }
  };

  const goToPreviousStep = () => {
    setStep(0);
  };

  const handleBeneficiaryClick = (beneficiary: Beneficiary) => {
    setBeneficiaryPhone(beneficiary.phone);
    setBeneficiaryName(beneficiary.name);
  };

  return (
    <div className="min-h-screen flexCol">
      <div className="w-[60%] mx-auto bg-[#141a20] text-[20px]  py-[40px] rounded-[20px] overflow-hidden">
        <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${step * 100}%)` }}>
          {/* Step 1 */}
          <div className="w-full flex-shrink-0 px-[5vw]">
            <h2 className="text-[30px] font-bold text-center pb-[20px]">Step 1: Enter Beneficiary Details</h2>
            <div>
              <label>Phone Number:</label><br />
              <input
                type="text"
                value={beneficiaryPhone}
                onChange={(e) => setBeneficiaryPhone(e.target.value)}
                placeholder="Enter phone number"
                className="border-[1px] border-[#999] w-full px-[1em] py-[0.5em] rounded-[15px] my-[0.5em]"
              />
            </div>
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
                disabled={!beneficiaryPhone || !beneficiaryName}
                className="w-1/2 text-[24px] rounded-[10px] py-[0.3em] bg-white text-[#141a20] cursor-pointer"
              >
                Next
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
                  <div>{beneficiary.phone}</div>
                </li>
              ))}
            </ul>
          </div>

          {/* Step 2 */}
          <div className="w-full flex-shrink-0 px-[5vw]">
            <h2 className="text-[30px] font-bold text-center pb-[1em]">Step 2: Enter Amount to Send</h2>
            <div>
              <div className="bg-[#2b3642] text-[18px] px-[1em] py-[0.5em] rounded-[10px] ">
                <h3 className="text-[18px]">Beneficiary Details</h3>
                <p>Name: {beneficiaryName}</p>
                <p>Phone: {beneficiaryPhone}</p>
              </div>
              <div className="mt-[0.5em] bg-[#2b3642] text-[18px] px-[1em] py-[0.5em] rounded-[10px] ">
                <p>Account Balance: <br /> ${accountBalance}</p>
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
                <button
                  type="button"
                  onClick={goToPreviousStep}
                  className="w-1/2 bg-[#2b3642] text-[24px] rounded-[10px] py-[0.3em] cursor-pointer"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  disabled={!amountToSend}
                  className="w-1/2 text-[24px] rounded-[10px] py-[0.3em] bg-white text-[#141a20] cursor-pointer"
                >
                  Confirm
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