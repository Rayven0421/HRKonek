"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import hrkonekIcon from "@/src/hrkonek-icon.png";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate login and navigate to dashboard
    router.push("/dashboard");
  };

  const handleApply = () => {
    // Navigate to apply page
    router.push("/apply");
  };

  return (
    <div className="relative min-h-screen w-full bg-white flex items-center justify-center overflow-hidden font-sans select-none">
      
      {/* 1. Dark Blue Blob - Top-Left Corner */}
      <div className="absolute top-0 left-0 w-[45vw] h-[45vw] min-w-[320px] max-w-[550px] -translate-x-[15%] -translate-y-[15%] pointer-events-none z-0">
        <svg className="w-full h-full text-[#0a4bb3]" viewBox="0 0 500 500" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0,0 L 500,0 C 470,120 420,240 320,270 C 220,300 180,410 100,420 C 40,430 0,380 0,350 Z" />
        </svg>
      </div>

      {/* 2. Lighter Blue Wave - Bottom-Right Corner */}
      <div className="absolute bottom-0 right-0 w-[65vw] h-[55vh] min-w-[450px] max-w-[900px] pointer-events-none z-0">
        <svg className="w-full h-full" viewBox="0 0 1000 600" fill="none" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M 150 600 C 220 520, 260 550, 310 500 C 380 430, 420 220, 520 250 C 620 280, 680 460, 760 410 C 840 360, 880 180, 1000 240 L 1000 600 Z" 
            fill="url(#wave-gradient)"
          />
          <defs>
            <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4386d9" />
              <stop offset="100%" stopColor="#1b4685" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 3. Centered Login Card */}
      <div className="w-full max-w-[420px] mx-4 bg-white rounded-xl shadow-lg border border-gray-100 p-8 z-10 flex flex-col items-center">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="relative w-24 h-24 flex items-center justify-center border-2 border-[#1E3A8A] rounded-full p-2 bg-white">
            {/* Fallback pure CSS/SVG HR Logo if the image is transparent/default */}
            <svg className="w-16 h-16 text-[#1E3A8A]" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M28 25 V75 M28 50 H52 M52 25 V75" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
              <path d="M52 25 H68 C78 25, 78 50, 68 50 H52 M68 50 L80 75" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            
            {/* The Image View overlaying the SVG */}
            <div className="absolute inset-0 w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white/5 backdrop-blur-[0.5px]">
              <Image 
                src={hrkonekIcon} 
                alt="HRKonek Icon" 
                fill
                className="object-contain p-2"
                priority
              />
            </div>
          </div>
          <span className="text-2xl font-bold text-[#111827] mt-3 tracking-wide">HRKonek</span>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="w-full flex flex-col">
          <h2 className="text-xl font-semibold text-[#1E3A8A] mb-5 text-left w-full">
            HR Portal Login
          </h2>

          {/* Email Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left w-full">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all"
              placeholder="Enter your email address"
              required
            />
          </div>

          {/* Password Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left w-full">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition-all"
              placeholder="Enter your password"
              required
            />
          </div>

          {/* Remember me & Forgot password */}
          <div className="flex items-center justify-between w-full mb-6">
            <label className="flex items-center text-sm text-gray-600 select-none cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#1E3A8A] focus:ring-[#1E3A8A] mr-2 cursor-pointer"
              />
              <span>Remember me</span>
            </label>
            <a href="#" className="text-sm text-[#3b82f6] hover:underline transition-all">
              Forgot password?
            </a>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="w-full bg-[#1E3A8A] hover:bg-[#152e6f] text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
          >
            {/* Users Icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span>Login to HR Portal</span>
          </button>
        </form>

        {/* Divider */}
        <div className="w-full border-t border-gray-200 my-6"></div>

        {/* Apply for job section */}
        <div className="w-full flex flex-col items-center">
          <p className="text-sm text-gray-500 mb-4 text-center">
            Looking for a job?
          </p>
          <button
            onClick={handleApply}
            type="button"
            className="w-full bg-[#4386d9] hover:bg-[#3273c4] text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99]"
          >
            {/* Briefcase Icon */}
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            <span>Apply for a Position</span>
          </button>
        </div>

      </div>
    </div>
  );
}
