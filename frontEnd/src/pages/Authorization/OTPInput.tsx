import { useRef, useState, type ChangeEvent, type KeyboardEvent  } from "react";

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
}

export default function OTPInput({
  length = 6,
  onComplete,
}: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(
    new Array(length).fill("")
  );

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);


  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Move to next input
    if (value && index < length - 1) {
      inputsRef.current[index + 1]?.focus();
    }

    // Auto submit when complete
    if (newOtp.every((digit) => digit !== "")) {
      onComplete(newOtp.join(""));
    }
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleInputChange = (
    e: ChangeEvent<HTMLInputElement>,
    index: number
  ) => {
    handleChange(e.target.value, index);
  };

  return (
    <div className="flex gap-2.5 justify-center lg:justify-start w-full">
      {otp.map((digit, index) => (
        <input
          key={index}
          type="text"
          maxLength={1}
          value={digit}
          ref={(el) => { inputsRef.current[index] = el }}
          onChange={(e) => handleInputChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          className="w-11 sm:w-12 h-12 sm:h-14 bg-gray-100 rounded-xl text-center text-xl font-black text-black focus:outline-none focus:ring-2 focus:ring-black focus:bg-white transition-all border border-gray-200 shadow-sm"
        />
      ))}
    </div>
  );
}