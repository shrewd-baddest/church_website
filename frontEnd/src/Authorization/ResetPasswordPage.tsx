 

import { useNavigate, useParams } from "react-router-dom";
import OTPInput from "./OTPInput";


export default function ResetPasswordPage() {
  const navigate=useNavigate();
  const {reg}=useParams<{reg:string}>();
  console.log(reg);
   const handleOTPComplete = async (otp: string) => {
    try {
      const response = await fetch(
        `http://localhost:3000/authorisation/otp/${reg}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ otp }),
        }
      );

      const data = await response.json();

      if (data.message === "password updated successfully") {
        alert("password updated successfully");
        navigate("/");
      }
    }catch (error) {
  alert((error as Error).message);
}

  }

  return (
    <div>
      <h2>Enter Verification Code</h2>
      <OTPInput length={6} onComplete={handleOTPComplete} />
    </div>
  );
}

