

import { useNavigate, useParams } from "react-router-dom";
import OTPInput from "./OTPInput";


const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const email = useParams().email || ""; // Get email from URL params, default to empty string if not present

  const handleOTPComplete = async (otp: string) => {
    console.log("OTP entered:", otp);

    try {
      // Send OTP to backend for verification
      const res = await fetch(`http://localhost:3001/authentication/v1/otp/${email}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otp }),
      });

      const data = await res.json();

      if (res.ok) {
        alert("OTP verified! You can reset your password.");
        navigate("/login", { Response: true });

      } else {
        alert(data.message || "Invalid OTP");
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (

    <div>
      <h2>Enter Verification Code</h2>
      <div className="absolute top-[30%] w-full">
        <div className="flex flex-col items-center justify-center shadow-md h-fit w-[70%] lg:w-[50%] mx-auto bg-white rounded-lg p-8 border border-gray-300" >
          <h2 className="mb-3 text-lg font-bold text-black">Enter Verification Code</h2>
          <OTPInput length={6} onComplete={handleOTPComplete} />
        </div>
      </div>
    </div>

  );
}

export default ResetPasswordPage;





export const emailChecker=()=>{

}