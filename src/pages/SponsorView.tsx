import { useState } from "react";
import { useNavigate } from 'react-router-dom';

interface Beneficiary {
  name: string;
  email: string;
}

const SponsorView = () => {
  const navigate = useNavigate();
  const [beneficiaryEmail, setBeneficiaryEmail] = useState<string>("");
  const [beneficiaryName, setBeneficiaryName] = useState<string>("");
  const [step, setStep] = useState<number>(0);
  const [isRegisteredUser, setIsRegisteredUser] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [registeredUserName, setRegisteredUserName] = useState<string>("");

  const handleGoBack = () => {
    navigate('/');
  };

  const pastBeneficiaries: Beneficiary[] = [
    { name: "John Doe", email: "john@example.com" },
    { name: "Jane Smith", email: "jane@example.com" },
    { name: "Alice Johnson", email: "alice@example.com" },
    { name: "Bob Brown", email: "bob@example.com" },
  ];

  const [accountBalance] = useState<number>(1000);
  const [amountToSend, setAmountToSend] = useState<string>("");

  const checkUserRegistration = async (email: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/user/${email}`);
      const data = await response.json();
      setIsRegisteredUser(response.ok && data.user);
      if (response.ok && data.user) {
        setRegisteredUserName(data.user.name || "");
      } else {
        setRegisteredUserName("");
      }
    } catch (error) {
      console.error('Error checking user registration:', error);
      setIsRegisteredUser(false);
      setRegisteredUserName("");
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
    try {
      // Implement direct transfer logic here
      console.log('Direct transfer initiated');
    } catch (error) {
      console.error('Error in direct transfer:', error);
    }
  };

  const handleEscrowTransfer = async () => {
    try {
      // Implement escrow transfer logic here
      console.log('Escrow transfer initiated');
    } catch (error) {
      console.error('Error in escrow transfer:', error);
    }
  };

  return (
    <div className="min-h-screen flexCol">
      <div className="w-[60%] mx-auto bg-[#141a20] text-[20px] py-[40px] rounded-[20px] overflow-hidden">
        <div className="flex transition-transform duration-300" style={{ transform: `translateX(-${step * 100}%)` }}>
          {/* Step 1 */}
          <div className="w-full flex-shrink-0 px-[5vw]">
            <h2 className="text-[30px] font-bold text-center pb-[20px]">Step 1: Enter Beneficiary Details</h2>
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
            <h2 className="text-[30px] font-bold text-center pb-[1em]">Step 2: Enter Amount to Send</h2>
            <div>
              <div className="bg-[#2b3642] text-[18px] px-[1em] py-[0.5em] rounded-[10px]">
                <h3 className="text-[18px]">Beneficiary Details</h3>
                <p>Name: {beneficiaryName}</p>
                <p>Email: {beneficiaryEmail} {isRegisteredUser && registeredUserName ? `(Registered as ${registeredUserName} on Reppay)` : ''}</p>
              </div>
              <div className="mt-[0.5em] bg-[#2b3642] text-[18px] px-[1em] py-[0.5em] rounded-[10px]">
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