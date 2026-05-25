import React, { useMemo, useRef, useState } from 'react';
import { Button } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import ResetPasswordLayout from '../ResetPasswordLayout';

const OTP_LENGTH = 6;
const fallbackEmail = 'sonu.ortez@gmail.com';

const EnterOtp: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const email = (location.state as { email?: string } | null)?.email ?? fallbackEmail;
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));

  const isComplete = useMemo(() => otp.every(Boolean), [otp]);

  const updateDigit = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    setOtp((currentOtp) => {
      const nextOtp = [...currentOtp];
      nextOtp[index] = digit;
      return nextOtp;
    });

    if (digit && index < OTP_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (event.key === 'Backspace' && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pastedOtp = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    const nextOtp = Array(OTP_LENGTH).fill('');

    pastedOtp.split('').forEach((digit, index) => {
      nextOtp[index] = digit;
    });

    setOtp(nextOtp);
    inputsRef.current[Math.min(pastedOtp.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleNext = () => {
    if (isComplete) {
      navigate('/set-new-password', { state: { email, otp: otp.join('') } });
    }
  };

  return (
    <ResetPasswordLayout>
      <h1 className="text-[36px] leading-tight font-bold text-black mb-2">Enter Your Code</h1>
      <div className="relative mb-5 pb-5">
        <p className="text-base text-gray-700">
          We sent a code to <span className="font-semibold text-black">{email}</span>
        </p>
        <div className="absolute left-0 bottom-0 w-full max-w-[288px] h-px bg-gray-200"></div>
      </div>

      <div className="flex gap-2 mb-8">
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(node) => {
              inputsRef.current[index] = node;
            }}
            value={digit}
            inputMode="numeric"
            maxLength={1}
            onChange={(event) => updateDigit(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            onPaste={handlePaste}
            className="h-[55px] w-[55px] rounded-md border border-[#b9ddff] bg-[#fcfdff] text-center text-xl outline-none transition focus:border-[#1677ff] focus:shadow-[0_0_0_2px_rgba(5,145,255,0.1)]"
            aria-label={`OTP digit ${index + 1}`}
          />
        ))}
      </div>

      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          Didn't receive the email?{' '}
          <button type="button" className="text-gray-700 underline hover:text-blue-600">
            Click to resend
          </button>
        </p>
        <Button
          size="large"
          type="primary"
          disabled={!isComplete}
          onClick={handleNext}
          className="!bg-[#0d3a8d] !border-[#0d3a8d] disabled:!bg-[#91a7c4] disabled:!border-[#91a7c4] hover:!bg-[#0a2d6c] hover:!border-[#0a2d6c] text-white rounded min-w-[100px] font-medium"
        >
          Next
        </Button>
      </div>
    </ResetPasswordLayout>
  );
};

export default EnterOtp;
