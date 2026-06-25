"use client";

import React, { useState } from "react";
import { signIn, signUp } from "@/app/actions";

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const res = await signUp(email, password);
        if (res?.error) {
          setError(res.error);
        } else {
          window.location.href = "/";
        }
      } else {
        const res = await signIn(email, password);
        if (res?.error) {
          setError(res.error);
        } else {
          window.location.href = "/";
        }
      }
    } catch {
      setError("요청을 처리하는 도중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen flex items-center justify-center bg-gradient-to-tr from-stone-100 via-stone-50 to-stone-100 p-6 overflow-hidden transition-all duration-700">
      {/* 은은하게 움직이는 모드별 그라데이션 배경 원 */}
      <div 
        className={`absolute rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-in-out ${
          isSignUp 
            ? "top-[-5%] left-[-5%] w-[60vw] h-[60vw] bg-emerald-200/20 rotate-45" 
            : "top-[-15%] left-[-15%] w-[45vw] h-[45vw] bg-amber-100/20"
        }`} 
      />
      <div 
        className={`absolute rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-in-out ${
          isSignUp 
            ? "bottom-[-5%] right-[-5%] w-[60vw] h-[60vw] bg-teal-200/20 -rotate-45" 
            : "bottom-[-15%] right-[-15%] w-[45vw] h-[45vw] bg-rose-100/10"
        }`} 
      />

      <div className="w-full max-w-md backdrop-blur-xl bg-white/80 border border-stone-200/50 rounded-[32px] p-8 shadow-xl shadow-stone-150/40 relative z-10 transition-all duration-500 ease-in-out">
        
        {/* 모드 전환 탭 스위처 (상단 세그먼트 버튼) */}
        <div className="relative w-full flex bg-stone-100/80 p-1 border border-stone-200/30 rounded-2xl mb-8 select-none">
          {/* 슬라이딩 하이라이터 */}
          <div 
            className="absolute top-1 bottom-1 rounded-xl bg-white shadow-sm transition-all duration-500 ease-out border border-stone-200/10"
            style={{
              width: "calc(50% - 6px)",
              left: isSignUp ? "calc(50% + 2px)" : "4px"
            }}
          />

          <button
            type="button"
            onClick={() => { setIsSignUp(false); setError(""); }}
            className={`relative z-10 flex-1 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 ${
              !isSignUp ? "text-stone-850" : "text-stone-400 hover:text-stone-600"
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => { setIsSignUp(true); setError(""); }}
            className={`relative z-10 flex-1 py-3 rounded-xl text-xs font-bold tracking-wide transition-all duration-300 ${
              isSignUp ? "text-emerald-800" : "text-stone-400 hover:text-stone-600"
            }`}
          >
            회원가입
          </button>
        </div>

        {/* 헤더 안내문 */}
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-stone-800 tracking-tight transition-all duration-300">
            {isSignUp ? "새로운 마음가짐 등록" : "안정적인 집중 속으로"}
          </h2>
          <p className="text-xs text-stone-400 mt-1">
            {isSignUp ? "계정을 생성하여 개인 할 일 데이터를 보존하세요." : "로그인하고 오늘의 할 일에 몰입해 보세요."}
          </p>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 회원가입 모드일 때 브라우저 자동완성 강박증을 가로채기 위한 투명한 더미 인풋 */}
          {isSignUp && (
            <div className="opacity-0 absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
              <input type="text" name="fake_username_prevent_autofill" autoComplete="new-username" tabIndex={-1} />
              <input type="password" name="fake_password_prevent_autofill" autoComplete="new-password" tabIndex={-1} />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1.5 ml-1">이메일 주소</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete={isSignUp ? "new-email" : "email"}
              className="w-full px-4.5 py-3.5 rounded-2xl bg-stone-50/60 border border-stone-200/80 focus:border-stone-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-stone-400/5 transition-all text-stone-700 text-sm placeholder:text-stone-300"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-stone-500 mb-1.5 ml-1">비밀번호</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={isSignUp ? "new-password" : "current-password"}
              className="w-full px-4.5 py-3.5 rounded-2xl bg-stone-50/60 border border-stone-200/80 focus:border-stone-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-stone-400/5 transition-all text-stone-700 text-sm placeholder:text-stone-300"
              placeholder="••••••"
            />
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50/50 border border-rose-100 text-xs text-rose-600 text-center animate-fade-in">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl text-white font-medium text-sm transition-all duration-500 shadow-md focus:outline-none disabled:opacity-50 ${
              isSignUp 
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/10" 
                : "bg-gradient-to-r from-stone-700 to-stone-800 hover:from-stone-850 hover:to-stone-900 shadow-stone-800/10"
            }`}
          >
            {loading ? "불러오는 중..." : isSignUp ? "계정 만들고 시작하기" : "입장하기"}
          </button>
        </form>


      </div>
    </main>
  );
}
