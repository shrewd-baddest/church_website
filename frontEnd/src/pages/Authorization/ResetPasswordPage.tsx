

import OTPInput from "./OTPInput";


export default function ResetPasswordPage() {
  // const handleOTPComplete = (otp: string) => {
  //   console.log("OTP received:", otp);
  //   // Add your OTP verification logic here
  // };

  return (
    <div>
      <h2>Enter Verification Code</h2>
      <OTPInput />
    </div>
  );
}

