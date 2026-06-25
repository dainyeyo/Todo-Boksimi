"use client";

import React, { useState, useEffect, useRef } from "react";

export default function ZenTherapy() {
  // --- A. 호흡 명상 상태 ---
  const [breathState, setBreathState] = useState<"ready" | "inhale" | "hold" | "exhale" | "hold-empty">("ready");
  const [seconds, setSeconds] = useState(4);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // --- B. 쓰다듬기 & 스트레스 지수 ---
  const [stressLevel, setStressLevel] = useState(100);
  const [petPhase, setPetPhase] = useState<"idle" | "petting" | "happy">("idle");

  // 1. 호흡 루프 타이머 관리
  useEffect(() => {
    if (breathState === "ready") {
      setSeconds(4);
      return;
    }

    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        if (prev <= 1) {
          setBreathState((currentState) => {
            switch (currentState) {
              case "inhale":
                return "hold";
              case "hold":
                return "exhale";
              case "exhale":
                return "hold-empty";
              case "hold-empty":
                return "inhale";
              default:
                return "inhale";
            }
          });
          return 4; // 4초 리셋
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [breathState]);

  const handleStartBreath = () => {
    setBreathState("inhale");
    setSeconds(4);
  };

  const handleStopBreath = () => {
    setBreathState("ready");
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // 2. 복심이 쓰다듬기 핸들러
  const handlePetBoksimi = () => {
    if (breathState !== "ready") return; // 명상 중에는 쓰다듬기 잠금

    // 스트레스 지수 감소
    setStressLevel((prev) => {
      const nextVal = prev > 0 ? prev - 5 : 0;
      if (nextVal === 0) {
        setPetPhase("happy");
      }
      return nextVal;
    });

    if (stressLevel > 0) {
      setPetPhase("petting");

      // 1초 후 상태 복원
      setTimeout(() => {
        setPetPhase("idle");
      }, 1000);
    }
  };

  const handleResetStress = () => {
    setStressLevel(100);
    setPetPhase("idle");
  };

  // 호흡 주기에 따른 팽창/수축 트랜지션 계산
  const isBreathActive = breathState !== "ready";
  const breathStateLabel: Record<string, string> = {
    ready: "준비",
    inhale: "숨 들이마시기 🌊",
    hold: "숨 참기 🛑",
    exhale: "숨 내쉬기 🍃",
    "hold-empty": "비우고 참기 🛑",
  };
  let scaleClass = "scale-100";
  let ringScale = 1.0;
  let ringOpacity = 0.2;

  const transitionStyle = {
    transition: isBreathActive ? "transform 4000ms cubic-bezier(0.34, 1.56, 0.64, 1)" : "transform 1000ms ease-in-out",
  };

  if (isBreathActive) {
    switch (breathState) {
      case "inhale":
      case "hold":
        scaleClass = "scale-100"; // 복심이 자체의 스케일은 100%로 고정
        ringScale = 1.35; // 원이 복심이 바깥으로 크게 확장되도록 설정
        ringOpacity = 0.95;
        break;
      case "exhale":
      case "hold-empty":
        scaleClass = "scale-100"; // 복심이 자체의 스케일은 100%로 고정
        ringScale = 0.75; // 원이 수축되도록 설정
        ringOpacity = 0.35;
        break;
    }
  }

  // 👋 쓰다듬는 손 모양 이모티콘 커스텀 커서 스타일 (호환성 높은 이스케이프 포맷)
  const pettingCursorStyle = {
    cursor: `url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' style='font-size:32px'%3E%3Ctext y='36'%3E👋%3C/text%3E%3C/svg%3E") 16 16, auto`,
  };

  return (
    <div className="w-full max-w-2xl mx-auto select-none">
      
      {/* ================= 🐕 복심이 통합 힐링 오아시스 공간 ================= */}
      <div className="bg-gradient-to-br from-white/50 to-white/10 dark:from-[#1b1e1c]/40 dark:to-[#121514]/20 backdrop-blur-xl border border-white/50 dark:border-charcoal-850/40 rounded-[32px] p-8 shadow-[0_16px_50px_rgba(230,200,200,0.07)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.2)] text-center flex flex-col items-center relative overflow-hidden min-h-[640px] justify-between">
        
        {/* 상단 텍스트 헤더 */}
        <div className="w-full text-center border-b border-charcoal-100/30 dark:border-charcoal-800/30 pb-5">
          <h3 className="text-3xl font-serif-title font-bold text-charcoal-850 dark:text-sage-100 mb-2.5">
            복심이와의 힐링 테라피 공간
          </h3>
          <p className="text-sm text-charcoal-450 dark:text-sage-400 mt-2 leading-relaxed">
            중앙의 복심이를 쓰다듬거나 간식을 주며, 깊은 호흡 명상으로 마음을 진정시켜보개
          </p>
        </div>

        {/* 스트레스 게이지 */}
        <div className="w-full max-w-lg my-5">
          <div className="flex justify-between items-center text-xs font-bold text-charcoal-500 mb-2 px-1">
            <span>내 스트레스 지수</span>
            <span className={stressLevel === 0 ? "text-sky-500 font-extrabold text-sm" : "text-slate-500 text-sm"}>
              {stressLevel}% {stressLevel === 0 && "(완전 힐링! 🎉)"}
            </span>
          </div>
          <div className="w-full bg-charcoal-200/50 dark:bg-charcoal-850/50 h-3 rounded-full overflow-hidden shadow-inner">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                stressLevel === 0
                  ? "bg-sky-500"
                  : "bg-yellow-300 dark:bg-yellow-400/80"
              }`}
              style={{ width: `${stressLevel}%` }}
            />
          </div>
        </div>

        {/* 🧘 중앙 인터랙티브 복심이 존 */}
        <div className="w-96 h-96 flex items-center justify-center relative my-6">
          
          {/* 호흡 가이드 동그라미 원 1 (내측 채워진 원) */}
          <div
            style={{
              transform: `scale(${ringScale})`,
              opacity: ringOpacity,
              transition: isBreathActive 
                ? "transform 4000ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 4000ms ease-in-out, background-color 4000ms ease-in-out" 
                : "transform 1000ms ease-in-out, opacity 1000ms ease-in-out, background-color 1000ms ease-in-out"
            }}
            className={`absolute w-80 h-80 rounded-full pointer-events-none blur-[1px] ${
              breathState === "ready"
                ? "bg-stone-200/20 dark:bg-stone-800/10"
                : breathState === "inhale"
                ? "bg-sky-400/25 dark:bg-sky-500/20"
                : breathState === "hold" || breathState === "hold-empty"
                ? "bg-rose-500/25 dark:bg-rose-600/20"
                : "bg-emerald-500/25 dark:bg-emerald-600/20" // exhale
            }`}
          />
          {/* 호흡 가이드 동그라미 원 2 (외측 채워진 원) */}
          <div
            style={{
              transform: `scale(${ringScale * 1.15})`,
              opacity: ringOpacity * 0.5,
              transition: isBreathActive 
                ? "transform 4000ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 4000ms ease-in-out, background-color 4000ms ease-in-out" 
                : "transform 1000ms ease-in-out, opacity 1000ms ease-in-out, background-color 1000ms ease-in-out"
            }}
            className={`absolute w-80 h-80 rounded-full pointer-events-none blur-[3px] ${
              breathState === "ready"
                ? "bg-stone-200/10 dark:bg-stone-800/5"
                : breathState === "inhale"
                ? "bg-sky-400/15 dark:bg-sky-500/10"
                : breathState === "hold" || breathState === "hold-empty"
                ? "bg-rose-500/15 dark:bg-rose-600/10"
                : "bg-emerald-500/15 dark:bg-emerald-600/10" // exhale
            }`}
          />
          
          {/* 복심이 캐릭터 껍데기 */}
          <div
            onClick={handlePetBoksimi}
            style={isBreathActive ? { cursor: "default" } : pettingCursorStyle}
            className="w-80 h-80 flex items-center justify-center relative rounded-full transition-all duration-300 select-none"
            title={isBreathActive ? "명상 중에는 쓰다듬을 수 없습니다." : "복심이를 부드럽게 쓰다듬어 주개 (👋)"}
          >
            <img
              src="/boksimi.png"
              alt="힐링 복심이"
              style={transitionStyle}
              className={`w-72 h-72 object-contain transform origin-center transition-all ${scaleClass} ${
                petPhase === "petting"
                  ? "scale-[0.97] rotate-3 animate-pulse"
                  : petPhase === "happy"
                  ? "scale-[1.08] rotate-6 animate-bounce"
                  : "hover:scale-[1.03] hover:rotate-2"
              }`}
            />
          </div>

           {/* 호흡 가이드 텍스트 오버레이 (명상 중일 때만 노출) */}
          {isBreathActive && (
            <div className="absolute -bottom-6 px-5 py-2 rounded-2xl bg-white/95 dark:bg-charcoal-900/95 border border-stone-200/60 dark:border-charcoal-800 text-charcoal-800 dark:text-sage-100 shadow-md z-10 select-none animate-pulse-slow flex flex-col items-center min-w-[120px]">
              <span className="text-[10px] text-charcoal-450 dark:text-sage-400 font-extrabold uppercase tracking-wider mb-0.5">
                {breathStateLabel[breathState]}
              </span>
              <span className="text-lg font-black tracking-widest">{seconds}초</span>
            </div>
          )}
        </div>

        {/* 🛠️ 하단 인터랙션 제어 패널 */}
        <div className="w-full flex flex-col items-center gap-3.5 pt-6 border-t border-charcoal-100/30 dark:border-charcoal-800/30 mt-5">
          <div className="flex justify-center w-full max-w-sm">
            
            {/* 명상하기 버튼 단독 배치 (Premium Capsule Design) */}
            <button
              onClick={breathState === "ready" ? handleStartBreath : handleStopBreath}
              className={`w-full py-4 text-white rounded-full text-base font-bold tracking-wide transition-all duration-300 shadow-[0_4px_20px_rgba(14,165,233,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex items-center justify-center hover:scale-[1.02] active:scale-[0.98] ${
                breathState === "ready"
                  ? "bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700"
                  : "bg-slate-400 hover:bg-slate-500 dark:bg-slate-600 dark:hover:bg-slate-700 shadow-[0_4px_20px_rgba(100,100,100,0.15)]"
              }`}
            >
              명상하기
            </button>

          </div>

          {/* 스트레스 게이지 리셋 버튼 */}
          {stressLevel === 0 && (
            <button
              onClick={handleResetStress}
              className="px-3.5 py-1.5 rounded-xl bg-white/40 dark:bg-black/10 border border-stone-200 hover:bg-stone-50 text-[9px] font-bold text-stone-500 transition-all shadow-sm"
            >
              다시 지치기 (스트레스 리셋) 🔄
            </button>
          )}
        </div>

      </div>
      
    </div>
  );
}
