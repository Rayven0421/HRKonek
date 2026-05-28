"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Users, Briefcase, AlertCircle, Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!email.trim()) {
      setLoginError('Please enter your email or username');
      return;
    }
    if (!password.trim()) {
      setLoginError('Please enter your password');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.includes('@') ? email : undefined,
          username: !email.includes('@') ? email : undefined,
          password,
          rememberMe
        })
      });

      const data = await res.json().catch(() => ({
        message: 'Unexpected response from server'
      }));

      if (!res.ok) {
        setLoginError(data.message || 'Login failed. Please try again.');
        return;
      }

      router.push('/dashboard');

    } catch {
      setLoginError('Connection error. Please check your network and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-white flex items-center justify-center overflow-hidden font-sans">

      {/* Dark blue blob — top left, viewport-relative, fully responsive */}
      <svg
        className="pointer-events-none absolute top-0 left-0 w-[55vw] max-w-[600px] h-auto"
        viewBox="0 0 600 520"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMinYMin meet"
        aria-hidden="true"
      >
        <path
          d="M0 0 H600 C560 80 490 170 390 210 C280 255 210 340 130 370 C60 395 0 355 0 310 Z"
          fill="#0F2D6B"
        />
      </svg>

      {/* Light blue wave — bottom right, viewport-relative */}
      <svg
        className="pointer-events-none absolute bottom-0 right-0 w-[65vw] max-w-[800px] h-auto"
        viewBox="0 0 800 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMaxYMax meet"
        aria-hidden="true"
      >
        <path
          d="M0 500 C80 420 130 450 200 390 C290 315 330 130 440 160 C540 188 590 370 670 320 C740 275 770 110 800 160 L800 500 Z"
          fill="url(#waveGrad)"
        />
        <defs>
          <linearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5B9BD5" />
            <stop offset="100%" stopColor="#1B4685" />
          </linearGradient>
        </defs>
      </svg>

      {/* Card — centers on all screen sizes */}
      <div className="relative z-10 w-full max-w-[440px] mx-4 sm:mx-auto bg-white rounded-2xl shadow-xl border border-gray-100 px-6 py-8 sm:px-10 sm:py-10 flex flex-col items-center">

        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full border-2 border-[#1E3A8A] flex items-center justify-center bg-[#f8faff] shadow-sm overflow-hidden">
            <img
              src="/hrkonek-icon.png"
              alt="HRKonek"
              className="w-full h-full object-contain p-1.5"
            />
          </div>
          <span className="text-2xl font-bold text-gray-900 mt-3 tracking-wide">
            HRKonek
          </span>
          <span className="text-xs text-gray-400 mt-0.5 tracking-widest uppercase">
            Human Resource Information System
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
          <h2 className="text-lg sm:text-xl font-semibold text-[#1E3A8A]">
            HR Portal Login
          </h2>

          {/* Email / Username */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Email or Username
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all"
              placeholder="Enter your email or username"
              required
            />
          </div>

          {/* Password */}
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-gray-700">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 pr-10 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#1E3A8A] focus:ring-[#1E3A8A] cursor-pointer"
              />
              Remember me
            </label>
            <a
              href="#"
              className="text-sm text-blue-500 hover:text-blue-700 hover:underline transition-colors"
            >
              Forgot password?
            </a>
          </div>

          {/* Error message */}
          {loginError && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
              <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-red-600 text-sm">{loginError}</p>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#1E3A8A] hover:bg-[#152e6f] disabled:opacity-70 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg mt-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Users className="w-5 h-5 shrink-0" />
                Login to HR Portal
              </>
            )}
          </button>

          {/* Default credentials hint */}
          <p className="text-xs text-gray-400 text-center mt-2">
            Default: admin / 123
          </p>
        </form>

        {/* Divider */}
        <div className="w-full flex items-center gap-3 my-5">
          <div className="flex-1 border-t border-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 border-t border-gray-200" />
        </div>

        {/* Apply section */}
        <div className="w-full flex flex-col items-center gap-3">
          <p className="text-sm text-gray-500">Looking for a job?</p>
          <Link
            href="/apply"
            className="w-full bg-blue-500 hover:bg-blue-600 active:scale-[0.99] text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm hover:shadow-md"
          >
            <Briefcase className="w-5 h-5 shrink-0" />
            Apply for a Position
          </Link>
        </div>

      </div>
    </div>
  );
}