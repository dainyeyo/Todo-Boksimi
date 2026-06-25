"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminDeleteUser, signOut } from "@/app/actions";

interface User {
  id: string;
  email: string;
  role: string;
  createdAt: Date | string;
  _count: {
    tasks: number;
  };
}

interface Stats {
  totalUsers: number;
  totalTasks: number;
  completionRate: number;
}

interface AdminDashboardProps {
  initialStats: Stats;
  initialUsers: User[];
  currentUserId: string | null;
}

export default function AdminDashboard({
  initialStats,
  initialUsers,
  currentUserId,
}: AdminDashboardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSignOut = async () => {
    const res = await signOut();
    if (res.success) {
      router.push("/login");
    }
  };

  const handleDeleteUser = async (userId: string, email: string) => {
    if (userId === currentUserId) {
      alert("자기 자신은 탈퇴 처리할 수 없습니다.");
      return;
    }

    const confirmDelete = window.confirm(
      `"${email}" 회원을 강제 탈퇴 처리하시겠습니까?\n이 회원이 등록한 모든 할 일 데이터도 함께 영구 삭제됩니다.`
    );

    if (!confirmDelete) return;

    setDeletingId(userId);
    setErrorMessage(null);

    startTransition(async () => {
      const res = await adminDeleteUser(userId);
      setDeletingId(null);
      if (res?.error) {
        setErrorMessage(res.error);
        alert(res.error);
      } else {
        alert("회원 강제 탈퇴 처리가 완료되었습니다.");
        router.refresh();
      }
    });
  };

  // 가입일자 포맷팅 헬퍼
  const formatDate = (dateValue: Date | string) => {
    const date = new Date(dateValue);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    const hh = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
  };

  return (
    <div className="min-h-screen flex flex-col justify-start items-center py-10 px-4 lg:px-8 z-10 relative w-full max-w-7xl mx-auto">
      
      {/* 🧼 감성 비누방울 플로팅 배경 패턴 */}
      <div className="bubble-bg select-none pointer-events-none">
        <div className="floating-bubble" style={{ left: "8%", width: "90px", height: "90px", animationDelay: "0s", animationDuration: "16s" }} />
        <div className="floating-bubble" style={{ left: "22%", width: "50px", height: "50px", animationDelay: "3s", animationDuration: "12s" }} />
        <div className="floating-bubble" style={{ left: "45%", width: "110px", height: "110px", animationDelay: "1.5s", animationDuration: "20s" }} />
        <div className="floating-bubble" style={{ left: "68%", width: "70px", height: "70px", animationDelay: "6s", animationDuration: "14s" }} />
        <div className="floating-bubble" style={{ left: "82%", width: "40px", height: "40px", animationDelay: "4s", animationDuration: "11s" }} />
        <div className="floating-bubble" style={{ left: "93%", width: "85px", height: "85px", animationDelay: "8s", animationDuration: "18s" }} />
      </div>

      {/* 🐾 Premium Header Zone */}
      <div className="flex flex-col items-center mb-8 select-none relative w-full text-center">
        {/* 상단 액션 링크 및 버튼 */}
        <div className="absolute top-0 right-0 flex items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="px-3.5 py-1.5 rounded-xl bg-white/40 dark:bg-black/10 border border-[#f3c6cb]/20 dark:border-pink-900/10 hover:bg-stone-50/70 hover:border-[#f3c6cb]/40 transition-all text-stone-600 dark:text-stone-300 hover:text-stone-850 text-xs font-semibold backdrop-blur-md shadow-sm"
          >
            할 일 목록으로 이동
          </button>
          <button
            onClick={handleSignOut}
            className="px-3.5 py-1.5 rounded-xl bg-white/40 dark:bg-black/10 border border-[#f3c6cb]/20 dark:border-pink-900/10 hover:bg-stone-50/70 hover:border-[#f3c6cb]/40 transition-all text-stone-500 hover:text-stone-700 text-xs font-semibold backdrop-blur-md shadow-sm"
          >
            로그아웃
          </button>
        </div>

        {/* App Title styled as a Logo Emblem */}
        <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-white/70 dark:bg-[#201718]/80 border border-[#f3c6cb]/40 dark:border-pink-900/30 shadow-sm mb-2 backdrop-blur-md">
          <span className="text-base select-none">🔑</span>
          <h1 className="text-3xl font-serif-title font-bold text-transparent bg-clip-text bg-gradient-to-r from-rose-500 via-amber-600 to-rose-500 dark:from-rose-300 dark:via-amber-200 dark:to-rose-300 drop-shadow-[0_2px_8px_rgba(255,190,200,0.35)] tracking-wide">
            관리자 대시보드
          </h1>
          <span className="text-base select-none">🔑</span>
        </div>
        
        <p className="text-xs tracking-widest text-amber-800/60 dark:text-amber-200/50 mt-1 font-bold">
          전체 가입자 통계 및 가입된 회원들의 목록을 관리합니다
        </p>
      </div>

      {/* 📊 통계 지표 위젯 카드 섹션 */}
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 select-none">
        
        {/* 카드 1. 총 가입 유저 수 */}
        <div className="bg-gradient-to-br from-white/50 to-white/10 dark:from-[#1b1e1c]/40 dark:to-[#121514]/20 backdrop-blur-xl border border-white/50 dark:border-charcoal-850/40 rounded-[28px] p-6 shadow-[0_16px_50px_rgba(230,200,200,0.04)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.15)] flex flex-col justify-between min-h-[140px]">
          <div>
            <span className="text-[9px] font-extrabold text-amber-600 dark:text-amber-450 uppercase tracking-[0.25em] block mb-1">
              Total Members
            </span>
            <h3 className="text-sm font-serif-title font-bold text-charcoal-850 dark:text-sage-100">
              총 가입 유저 수
            </h3>
          </div>
          <div className="text-right">
            <span className="text-4xl font-serif-title font-extrabold text-amber-905 dark:text-amber-200">
              {initialStats.totalUsers}
            </span>
            <span className="text-xs font-bold text-charcoal-450 dark:text-sage-400 ml-1">
              명
            </span>
          </div>
        </div>

        {/* 카드 2. 전체 등록된 할 일 수 */}
        <div className="bg-gradient-to-br from-white/50 to-white/10 dark:from-[#1b1e1c]/40 dark:to-[#121514]/20 backdrop-blur-xl border border-white/50 dark:border-charcoal-850/40 rounded-[28px] p-6 shadow-[0_16px_50px_rgba(230,200,200,0.04)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.15)] flex flex-col justify-between min-h-[140px]">
          <div>
            <span className="text-[9px] font-extrabold text-rose-500 dark:text-rose-450 uppercase tracking-[0.25em] block mb-1">
              Total Todo Tasks
            </span>
            <h3 className="text-sm font-serif-title font-bold text-charcoal-850 dark:text-sage-100">
              전체 등록된 할 일 수
            </h3>
          </div>
          <div className="text-right">
            <span className="text-4xl font-serif-title font-extrabold text-rose-505 dark:text-rose-300">
              {initialStats.totalTasks}
            </span>
            <span className="text-xs font-bold text-charcoal-450 dark:text-sage-400 ml-1">
              개
            </span>
          </div>
        </div>

        {/* 카드 3. 평균 할 일 달성률 */}
        <div className="bg-gradient-to-br from-white/50 to-white/10 dark:from-[#1b1e1c]/40 dark:to-[#121514]/20 backdrop-blur-xl border border-white/50 dark:border-charcoal-850/40 rounded-[28px] p-6 shadow-[0_16px_50px_rgba(230,200,200,0.04)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.15)] flex flex-col justify-between min-h-[140px]">
          <div>
            <span className="text-[9px] font-extrabold text-[#4a6b57] dark:text-[#528d70] uppercase tracking-[0.25em] block mb-1">
              Task Achievement
            </span>
            <h3 className="text-sm font-serif-title font-bold text-charcoal-850 dark:text-sage-100">
              평균 미션 수행 달성률
            </h3>
          </div>
          <div>
            <div className="w-full bg-charcoal-200/50 dark:bg-charcoal-850/50 h-2 rounded-full overflow-hidden mb-2">
              <div 
                className="bg-gradient-to-r from-rose-500 to-amber-600 h-full rounded-full transition-all duration-700" 
                style={{ width: `${initialStats.completionRate}%` }}
              />
            </div>
            <div className="text-right">
              <span className="text-3xl font-serif-title font-extrabold text-[#4a6b57] dark:text-emerald-300">
                {initialStats.completionRate}
              </span>
              <span className="text-xs font-bold text-charcoal-450 dark:text-sage-400 ml-1">
                %
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* 🛠️ 회원 관리 테이블 */}
      <div className="w-full bg-gradient-to-br from-white/50 to-white/10 dark:from-[#1b1e1c]/40 dark:to-[#121514]/20 backdrop-blur-xl border border-white/50 dark:border-charcoal-850/40 rounded-[32px] p-6 lg:p-8 shadow-[0_16px_50px_rgba(230,200,200,0.06)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.2)]">
        <div className="flex justify-between items-center mb-6 select-none">
          <div>
            <span className="text-[8px] font-extrabold text-rose-500 dark:text-rose-450 uppercase tracking-[0.25em] block mb-1">
              User List Management
            </span>
            <h2 className="text-lg font-serif-title font-bold text-charcoal-850 dark:text-sage-100">
              가입 회원 목록
            </h2>
          </div>
          <span className="text-xs font-bold text-charcoal-450 dark:text-sage-400">
            총 {initialUsers.length}개 계정
          </span>
        </div>

        {errorMessage && (
          <div className="mb-4 p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-xs font-bold text-rose-650 dark:text-rose-350">
            ⚠ {errorMessage}
          </div>
        )}

        <div className="overflow-x-auto rounded-2xl border border-stone-200/40 dark:border-charcoal-800/40">
          <table className="w-full text-left border-collapse text-xs font-medium text-stone-700 dark:text-stone-300">
            <thead>
              <tr className="bg-white/40 dark:bg-charcoal-900/40 border-b border-stone-200/50 dark:border-charcoal-800/50 text-stone-500 dark:text-sage-400 select-none">
                <th className="py-3 px-4 font-bold">이메일 계정</th>
                <th className="py-3 px-4 font-bold text-center">권한</th>
                <th className="py-3 px-4 font-bold text-center">가입일시</th>
                <th className="py-3 px-4 font-bold text-center">작성된 할 일</th>
                <th className="py-3 px-4 font-bold text-center">관리 액션</th>
              </tr>
            </thead>
            <tbody>
              {initialUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-stone-400 font-medium">
                    가입된 회원이 없습니다.
                  </td>
                </tr>
              ) : (
                initialUsers.map((user) => {
                  const isSelf = user.id === currentUserId;
                  const isAdmin = user.role === "ADMIN";

                  return (
                    <tr 
                      key={user.id} 
                      className="border-b border-stone-200/30 dark:border-charcoal-800/30 hover:bg-white/20 dark:hover:bg-charcoal-900/10 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold break-all max-w-[200px]">
                        {user.email}
                        {isSelf && (
                          <span className="ml-1.5 text-[10px] bg-stone-200/70 text-stone-600 dark:bg-stone-850 dark:text-stone-400 px-2 py-0.5 rounded-md font-extrabold select-none">
                            나
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center select-none">
                        {isAdmin ? (
                          <span className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 px-2.5 py-0.5 rounded-full font-extrabold">
                            ADMIN
                          </span>
                        ) : (
                          <span className="text-[10px] bg-stone-100 dark:bg-[#1f2321] text-stone-500 px-2.5 py-0.5 rounded-full font-bold">
                            USER
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center text-stone-500 dark:text-stone-400 font-mono">
                        {formatDate(user.createdAt)}
                      </td>
                      <td className="py-3.5 px-4 text-center font-bold text-stone-800 dark:text-stone-250">
                        {user._count.tasks} 개
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {isSelf ? (
                          <span className="text-stone-400 dark:text-stone-600 text-[10px] font-bold select-none">
                            탈퇴 불가
                          </span>
                        ) : (
                          <button
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            disabled={deletingId !== null || isPending}
                            className="px-3 py-1 bg-gradient-to-r from-rose-450 to-rose-500 hover:from-rose-500 hover:to-rose-600 text-white rounded-xl text-[10px] font-bold transition-all shadow-sm disabled:opacity-40 disabled:scale-95"
                          >
                            {deletingId === user.id ? "처리 중..." : "강제 탈퇴"}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="text-[8px] tracking-widest text-amber-800/40 dark:text-amber-200/30 mt-16 select-none font-bold uppercase flex items-center gap-1.5 justify-center">
        Zen Task Admin Dashboard • Secure Operations 🔑
      </div>
    </div>
  );
}
