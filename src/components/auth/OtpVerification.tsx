import { useState, useEffect, useRef } from 'react';

interface OtpVerificationProps {
  email: string;
  onVerify: (otp: string) => Promise<void>;
  onCancel: () => void;
  resendOtp: () => Promise<void>;
}

const OtpVerification = ({ email, onVerify, onCancel, resendOtp }: OtpVerificationProps) => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>(Array(6).fill(null));

  useEffect(() => {
    // Focus the first input on mount
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }

    // Start countdown timer
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (value && !/^\d+$/.test(value)) return;

    const newOtp = [...otp];
    
    // If pasting multiple digits
    if (value.length > 1) {
      const digits = value.split('').slice(0, 6 - index);
      for (let i = 0; i < digits.length; i++) {
        if (index + i < 6) {
          newOtp[index + i] = digits[i];
        }
      }
      setOtp(newOtp);
      
      // Focus on next empty input or last input
      const nextIndex = Math.min(index + digits.length, 5);
      const nextInput = inputRefs.current[nextIndex];
      if (nextInput) {
        nextInput.focus();
      }
      return;
    }

    // Regular single digit input
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = inputRefs.current[index - 1];
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  const handleSubmit = async () => {
    const otpValue = otp.join('');
    if (otpValue.length !== 6) return;

    setIsLoading(true);
    try {
      await onVerify(otpValue);
    } catch (error) {
      console.error('OTP verification failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (timer > 0) return;
    
    setIsLoading(true);
    try {
      await resendOtp();
      setTimer(60); // Reset timer
    } catch (error) {
      console.error('Failed to resend OTP:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Verify Your Email</h2>
        <p className="text-indigo-300 mb-1">We've sent a verification code to</p>
        <p className="text-amber-400 font-medium">{email}</p>
      </div>

      <div className="flex justify-center gap-2 my-8">
        {otp.map((digit, index) => (
          <input
            key={index}
            type="text"
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            ref={(el) => (inputRefs.current[index] = el)}
            className="w-12 h-14 text-center bg-gray-900 border border-gray-700 rounded-lg text-white text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
            maxLength={1}
            autoComplete="off"
          />
        ))}
      </div>

      <div className="flex justify-center space-x-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isLoading}
          className="py-3 px-5 rounded-lg bg-gray-700 text-white font-medium hover:bg-gray-600 transition-colors"
        >
          Cancel
        </button>
        
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isLoading || otp.join('').length !== 6}
          className={`py-3 px-5 rounded-lg text-white font-medium transition-all ${
            isLoading || otp.join('').length !== 6
              ? 'bg-indigo-800 cursor-not-allowed'
              : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:shadow-lg hover:shadow-indigo-500/30'
          }`}
        >
          {isLoading ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            'Verify'
          )}
        </button>
      </div>

      <div className="text-center mt-4">
        <p className="text-indigo-300">
          Didn't receive the code?{' '}
          <button
            type="button"
            onClick={handleResendOtp}
            disabled={timer > 0 || isLoading}
            className={`font-medium ${
              timer > 0
                ? 'text-gray-500 cursor-not-allowed'
                : 'text-amber-400 hover:text-amber-300 transition-colors'
            }`}
          >
            Resend {timer > 0 && `(${timer}s)`}
          </button>
        </p>
      </div>
    </div>
  );
};

export default OtpVerification; 