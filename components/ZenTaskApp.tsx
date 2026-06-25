"use client";

import React, { useState, useEffect } from "react";
import ZenTherapy from "./ZenTherapy";
import CalendarView from "./CalendarView";
import { 
  signOut, 
  searchUsers, 
  toggleFollow, 
  getFollows, 
  sendBoksimiMessage, 
  markMessageAsRead 
} from "@/app/actions";

interface Task {
  id: string;
  text: string;
  memo: string | null;
  completed: boolean;
  focus: boolean;
  dueDate: Date | string | null;
  repeat: string | null;
  createdAt?: Date | string | null;
}

interface FollowedTask {
  id: string;
  text: string;
  memo: string | null;
  completed: boolean;
  focus: boolean;
  dueDate: Date | string | null;
  repeat: string | null;
  createdAt?: Date | string | null;
  userEmail: string;
}

interface BoksimiMessage {
  id: string;
  message: string;
  createdAt: string;
  senderEmail: string;
}

interface ZenTaskAppProps {
  tasks: Task[];
  followedTasks: FollowedTask[];
  initialUnreadMessages: BoksimiMessage[];
}

// 힐링 명언 데이터베이스
const HEALING_QUOTES = [
  "천천히 가도 괜찮개. 중요한 건 멈추지 않는 것이개. 🐾",
  "스스로에게 조그만 여유를 선물해 주개. 숨 한번 크게 들이마쉬개! 🧘",
  "지나간 걱정은 뼈다귀처럼 묻어두고, 지금 이 순간에 살개. 🐶",
  "주인님은 존재 자체로 충분히 우아하고 사랑스럽개! 💖",
  "오늘 하루도 복심이와 함께 무사히 마무리하개! 고맙개! ✨"
];

export default function ZenTaskApp({ 
  tasks, 
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  followedTasks = [], 
  initialUnreadMessages = [] 
}: ZenTaskAppProps) {
  // 1. 기본 활성 탭: 달력 보기("calendar")
  const [activeTab, setActiveTab] = useState<"calendar" | "social" | "therapy">("calendar");

  // --- A. 복심이 아지트 상태 관리 ---
  const [cozyPhase, setCozyPhase] = useState<"idle" | "eat" | "pet">("idle");
  const [cozyText, setCozyText] = useState("안녕하개! 복심이 아지트에 오신 걸 환영하개! 🐾");
  const [waterCups, setWaterCups] = useState(0);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // --- B. 우정의 방문 및 편지 상태 ---
  const [unreadMessages, setUnreadMessages] = useState<BoksimiMessage[]>(initialUnreadMessages);
  const [isMailboxOpen, setIsMailboxOpen] = useState(false);
  const [visitingUser, setVisitingUser] = useState<{ id: string; email: string } | null>(null);
  
  // 개껌 선물 폼 입력값
  const [giftMessage, setGiftMessage] = useState("");
  const [isSendingGift, setIsSendingGift] = useState(false);

  // --- C. 소셜 친구 목록 상태 (인라인 탭 내장) ---
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; email: string; isFollowing: boolean }[]>([]);
  const [followingList, setFollowingList] = useState<{ id: string; email: string }[]>([]);
  const [followersList, setFollowersList] = useState<{ id: string; email: string }[]>([]);

  // 명언 교체 루프
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % HEALING_QUOTES.length);
    }, 15000);
    return () => clearInterval(timer);
  }, []);

  // 소셜 탭 진입 시 친구 목록 가져오기
  useEffect(() => {
    if (activeTab === "social") {
      const loadFollows = async () => {
        const res = await getFollows();
        setFollowingList(res.following);
        setFollowersList(res.followers);
      };
      loadFollows();
    }
  }, [activeTab]);

  // 안 읽은 메시지가 있을 시 복심이 말풍선 오버라이드
  useEffect(() => {
    if (visitingUser) {
      setCozyText(`여기는 ${visitingUser.email.split("@")[0]}님의 복심이 아지트이개! 🍖 개껌을 선물하고 가개!`);
    } else if (unreadMessages.length > 0) {
      setCozyText(`주인님! 읽지 않은 우정의 개껌 편지가 ${unreadMessages.length}통 도착했개! 얼른 읽어보개! 💌`);
    } else {
      setCozyText("안녕하개! 복심이 아지트에 오신 걸 환영하개! 🐾");
    }
  }, [unreadMessages, visitingUser]);

  // 로그아웃
  const handleSignOut = async () => {
    const res = await signOut();
    if (res.success) {
      window.location.href = "/login";
    }
  };

  // 물 마시기 (최대 8컵)
  const handleDrinkWater = () => {
    setWaterCups(prev => (prev < 8 ? prev + 1 : 0));
  };

  // 개껌 주기
  const handleFeedSnack = () => {
    if (cozyPhase !== "idle") return;
    setCozyPhase("eat");
    setCozyText("냠냠! 뼈다귀 개껌 너무 맛있개! 복심이 꼬리 폭풍 흔드는 중! 🍖");
    setTimeout(() => {
      setCozyPhase("idle");
      setCozyText("더 줄 수 있개? 꼬르륵...🐶");
    }, 3000);
  };

  // 쓰다듬기
  const handlePetBoksimi = () => {
    if (cozyPhase !== "idle") return;
    setCozyPhase("pet");
    setCozyText("주인님의 다정한 손길에 기분이 너무 날아갈 것 같개! 헤헤...🐾");
    setTimeout(() => {
      setCozyPhase("idle");
      setCozyText("또 쓰다듬어 주개! 멍멍! 🥰");
    }, 3000);
  };

  // --- 소셜 제어 로직 ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const res = await searchUsers(searchQuery);
    setSearchResults(res);
  };

  const handleFollowToggle = async (userId: string) => {
    const res = await toggleFollow(userId);
    if (res.error) {
      alert(res.error);
    } else {
      // 리스트 갱신
      setSearchResults(prev =>
        prev.map(u => (u.id === userId ? { ...u, isFollowing: res.isFollowing ?? false } : u))
      );
      const updatedFollows = await getFollows();
      setFollowingList(updatedFollows.following);
      setFollowersList(updatedFollows.followers);
    }
  };

  // 친구 아지트 방문
  const handleVisitFriend = (friend: { id: string; email: string }) => {
    setVisitingUser(friend);
  };

  // 개껌 선물 전송
  const handleSendGift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitingUser || !giftMessage.trim()) return;
    setIsSendingGift(true);

    const res = await sendBoksimiMessage(visitingUser.id, giftMessage);
    setIsSendingGift(false);

    if (res.error) {
      alert(res.error);
    } else {
      alert(`🍖 ${visitingUser.email.split("@")[0]}님 복심이에게 개껌과 함께 응원 편지를 전달했개!`);
      setGiftMessage("");
      setVisitingUser(null); // 내 아지트로 리셋
    }
  };

  // 편지 읽음 및 읽음 처리
  const handleReadMessage = async (msgId: string) => {
    const res = await markMessageAsRead(msgId);
    if (!res.error) {
      setUnreadMessages(prev => prev.filter(m => m.id !== msgId));
    }
  };

  // 오늘의 미션 완수율 계산
  const totalTasks = tasks.length;
  const completedTasksCount = tasks.filter(t => t.completed).length;
  const achievementRate = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  const isWideLayout = activeTab === "calendar" || activeTab === "social" || activeTab === "therapy";

  return (
    <>
      {/* 🧼 감성 비누방울 플로팅 배경 패턴 */}
      <div className="bubble-bg select-none pointer-events-none">
        <div className="floating-bubble" style={{ left: "5%", width: "70px", height: "70px", animationDelay: "0s", animationDuration: "10s" }} />
        <div className="floating-bubble" style={{ left: "12%", width: "40px", height: "40px", animationDelay: "4s", animationDuration: "8s" }} />
        <div className="floating-bubble" style={{ left: "20%", width: "85px", height: "85px", animationDelay: "2s", animationDuration: "12s" }} />
        <div className="floating-bubble" style={{ left: "28%", width: "55px", height: "55px", animationDelay: "6s", animationDuration: "9s" }} />
        <div className="floating-bubble" style={{ left: "38%", width: "95px", height: "95px", animationDelay: "1s", animationDuration: "11s" }} />
        <div className="floating-bubble" style={{ left: "46%", width: "35px", height: "35px", animationDelay: "5s", animationDuration: "7s" }} />
        <div className="floating-bubble" style={{ left: "55%", width: "75px", height: "75px", animationDelay: "3s", animationDuration: "10s" }} />
        <div className="floating-bubble" style={{ left: "62%", width: "45px", height: "45px", animationDelay: "8s", animationDuration: "8s" }} />
        <div className="floating-bubble" style={{ left: "70%", width: "90px", height: "90px", animationDelay: "0.5s", animationDuration: "13s" }} />
        <div className="floating-bubble" style={{ left: "77%", width: "50px", height: "50px", animationDelay: "4.5s", animationDuration: "9s" }} />
        <div className="floating-bubble" style={{ left: "85%", width: "80px", height: "80px", animationDelay: "2.5s", animationDuration: "11s" }} />
        <div className="floating-bubble" style={{ left: "92%", width: "40px", height: "40px", animationDelay: "7s", animationDuration: "7.5s" }} />
        <div className="floating-bubble" style={{ left: "15%", width: "60px", height: "60px", animationDelay: "9s", animationDuration: "11s" }} />
        <div className="floating-bubble" style={{ left: "80%", width: "65px", height: "65px", animationDelay: "11s", animationDuration: "10s" }} />
      </div>

      <div className="min-h-screen flex flex-col justify-start items-center py-10 px-4 lg:px-8 z-10 relative w-full max-w-7xl mx-auto">
      
        {/* 🐶 Premium Header Zone */}
        <div className="flex flex-col items-center mb-8 select-none relative w-full text-center">
          
          {/* 우측 상단 로그아웃 버튼 */}
          <div className="absolute top-0 right-0">
            <button
              onClick={handleSignOut}
              className="px-3.5 py-1.5 rounded-xl bg-white/40 dark:bg-black/10 border border-slate-200/50 dark:border-slate-800/10 hover:bg-stone-50/70 hover:border-slate-200 transition-all text-slate-500 hover:text-slate-700 text-xs font-semibold backdrop-blur-md shadow-sm"
            >
              로그아웃
            </button>
          </div>

          {/* App Title styled as a Logo Emblem */}
          <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-white/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800/30 shadow-sm mb-2 backdrop-blur-md">
            <span className="text-base select-none">🐾</span>
            <h1 className="text-3xl font-serif-title font-bold text-slate-900 dark:text-slate-100 tracking-wide">
              복심이와 ToDo 리스트
            </h1>
            <span className="text-base select-none">🐾</span>
          </div>
        </div>

        {/* 🛠️ PC 2-Column 혹은 1-Column 동적 그리드 레이아웃 */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ================= 좌측 컬럼 (그리드 너비 동적 조절) ================= */}
          <div className={`flex flex-col items-center space-y-6 w-full ${
            isWideLayout ? "lg:col-span-12" : "lg:col-span-7 xl:col-span-8"
          }`}>
            
            {/* Main Tab Switcher */}
            <div className="relative w-full flex bg-white/30 dark:bg-charcoal-900/15 backdrop-blur-md p-1 border border-white/40 dark:border-charcoal-800/20 rounded-2xl shadow-sm select-none">
              {/* Sliding Underlay */}
              <div 
                className="absolute top-1 bottom-1 rounded-xl bg-white/95 dark:bg-[#1a1e1b] shadow-sm transition-all duration-500 ease-out border border-slate-200/40 dark:border-charcoal-800/50"
                style={{
                  width: "calc(33.333% - 6px)",
                  left: activeTab === "calendar" 
                    ? "5px" 
                    : activeTab === "social" 
                    ? "calc(33.333% + 3px)" 
                    : "calc(66.666% + 1px)"
                }}
              />

              <button
                onClick={() => setActiveTab("calendar")}
                className={`relative z-10 flex-1 py-2.5 rounded-xl text-sm font-extrabold tracking-wide transition-all duration-300 ${
                  activeTab === "calendar"
                    ? "text-slate-800 dark:text-slate-200"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                달력 보기
              </button>
              <button
                onClick={() => setActiveTab("social")}
                className={`relative z-10 flex-1 py-2.5 rounded-xl text-sm font-extrabold tracking-wide transition-all duration-300 ${
                  activeTab === "social"
                    ? "text-slate-800 dark:text-slate-200"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                소셜 친구
              </button>
              <button
                onClick={() => setActiveTab("therapy")}
                className={`relative z-10 flex-1 py-2.5 rounded-xl text-sm font-extrabold tracking-wide transition-all duration-300 ${
                  activeTab === "therapy"
                    ? "text-slate-800 dark:text-slate-200"
                    : "text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
              >
                복심이 테라피
              </button>
            </div>

            {/* Dynamic Tools Renderer */}
            <div className="w-full transition-all duration-500">
              {activeTab === "calendar" ? (
                <div className="w-full animate-fade-in">
                  <CalendarView tasks={tasks} />
                </div>
              ) : activeTab === "social" ? (
                /* 👥 소셜 친구 찾기 인라인 패널 */
                <div className="w-full animate-fade-in bg-gradient-to-br from-white/50 to-white/10 dark:from-[#1b1e1c]/40 dark:to-[#121514]/20 backdrop-blur-xl border border-white/50 dark:border-charcoal-850/40 rounded-[32px] p-8 shadow-[0_16px_50px_rgba(15,23,42,0.04)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.2)]">
                  <div className="w-full text-left mb-6 select-none border-b border-charcoal-100/30 dark:border-charcoal-800/30 pb-4">
                    <span className="text-[8px] font-extrabold text-sky-600 dark:text-sky-400 uppercase tracking-[0.25em] block mb-1">
                      Social Network
                    </span>
                    <h2 className="text-xl font-serif-title font-bold text-slate-800 dark:text-slate-200 tracking-wide">
                      소셜 친구 관리
                    </h2>
                    <p className="text-[10px] text-charcoal-450 dark:text-sage-400 mt-1.5">
                      친구의 이메일을 검색하여 팔로우하고, 친구의 아지트에 방문해 보세요!
                    </p>
                  </div>

                  {/* 사용자 검색 */}
                  <form onSubmit={handleSearch} className="flex gap-2.5 mb-8">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="친구의 이메일 계정을 입력하세요..."
                      className="flex-1 px-5 py-3.5 bg-white/80 dark:bg-[#151816] border border-white/40 dark:border-charcoal-900/60 rounded-2.5xl text-charcoal-900 dark:text-sage-50 placeholder-charcoal-400 dark:placeholder-sage-500/70 shadow-inner focus:outline-none focus:ring-2 focus:ring-stone-400/5 focus:border-stone-300 transition-all duration-300 text-xs font-semibold"
                    />
                    <button
                      type="submit"
                      className="px-5 py-3.5 bg-sky-500 hover:bg-sky-600 dark:bg-sky-600 dark:hover:bg-sky-700 text-white rounded-2.5xl transition-all duration-300 font-extrabold shadow-md text-xs"
                    >
                      검색
                    </button>
                  </form>

                  {/* 검색 결과 */}
                  {searchResults.length > 0 && (
                    <div className="mb-8 animate-fade-in">
                      <h4 className="text-[10px] font-extrabold text-stone-400 mb-3.5 uppercase tracking-wider select-none">🔍 검색 결과</h4>
                      <div className="space-y-2 border border-stone-200/30 rounded-2.5xl p-4 bg-white/20">
                        {searchResults.map((user) => (
                          <div key={user.id} className="flex justify-between items-center text-xs font-semibold p-2 rounded-xl hover:bg-white/20 transition-colors">
                            <span className="truncate max-w-[240px] text-charcoal-850 dark:text-sage-200 font-bold">{user.email}</span>
                            <button
                              onClick={() => handleFollowToggle(user.id)}
                              className={`px-3.5 py-1.5 rounded-xl text-[10px] font-bold transition-all shadow-sm ${
                                user.isFollowing
                                  ? "bg-slate-200 text-slate-600"
                                  : "bg-sky-500 hover:bg-sky-600 text-white"
                              }`}
                            >
                              {user.isFollowing ? "언팔로우" : "팔로우"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 친구 리스트 2열 그리드 배치 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* 내 팔로잉 목록 */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider select-none">
                        👥 내가 팔로우하는 친구 ({followingList.length})
                      </h4>
                      {followingList.length === 0 ? (
                        <p className="text-[11px] text-center text-stone-400 py-8 border border-dashed border-stone-200/40 rounded-2.5xl">
                          팔로우한 친구가 없습니다. 🐶
                        </p>
                      ) : (
                        <div className="max-h-[300px] overflow-y-auto space-y-2 border border-stone-200/30 rounded-2.5xl p-3 bg-white/10 shadow-inner">
                          {followingList.map((friend) => (
                            <div key={friend.id} className="flex justify-between items-center text-xs font-semibold p-2 hover:bg-white/30 dark:hover:bg-charcoal-900/10 rounded-xl transition-colors">
                              <span className="truncate max-w-[120px] text-charcoal-850 dark:text-sage-200 font-bold">{friend.email.split("@")[0]}</span>
                              <div className="flex gap-1.5">
                                <button
                                  onClick={() => handleVisitFriend(friend)}
                                  className="px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 rounded-lg text-[9px] font-extrabold"
                                >
                                  방문 🐾
                                </button>
                                <button
                                  onClick={() => handleFollowToggle(friend.id)}
                                  className="px-2 py-1 bg-stone-200/60 text-stone-500 hover:text-stone-700 rounded-lg text-[9px]"
                                >
                                  해제
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 나를 팔로우하는 구독자 목록 */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-extrabold text-stone-400 uppercase tracking-wider select-none">
                        🔔 나를 팔로우하는 친구 ({followersList.length})
                      </h4>
                      {followersList.length === 0 ? (
                        <p className="text-[11px] text-center text-stone-400 py-8 border border-dashed border-stone-200/40 rounded-2.5xl">
                          나를 구독한 친구가 없습니다. 🐾
                        </p>
                      ) : (
                        <div className="max-h-[300px] overflow-y-auto space-y-2 border border-stone-200/30 rounded-2.5xl p-3 bg-white/10 shadow-inner">
                          {followersList.map((follower) => (
                            <div key={follower.id} className="flex justify-between items-center text-xs font-semibold p-2 hover:bg-white/30 dark:hover:bg-charcoal-900/10 rounded-xl transition-colors">
                              <span className="truncate max-w-[165px] text-charcoal-850 dark:text-sage-200 font-bold">{follower.email}</span>
                              <span className="text-[9px] bg-sky-500/10 border border-sky-500/20 text-sky-600 dark:text-sky-400 px-2 py-0.5 rounded-md font-extrabold select-none">
                                구독 중
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              ) : (
                <div className="w-full animate-fade-in">
                  <ZenTherapy />
                </div>
              )}
            </div>
          </div>

          {/* ================= 우측 컬럼 (와이드 레이아웃이 아닐 때만 노출) ================= */}
          {!isWideLayout && (
            <div className="lg:col-span-5 xl:col-span-4 space-y-6 w-full animate-fade-in">
              
              {/* 1. Boksimi's Playground Card */}
              <div className="bg-gradient-to-br from-white/50 to-white/10 dark:from-[#1b1e1c]/40 dark:to-[#121514]/20 backdrop-blur-xl border border-white/50 dark:border-charcoal-850/40 rounded-[32px] p-6 shadow-[0_16px_50px_rgba(15,23,42,0.04)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.2)] text-center flex flex-col items-center relative overflow-hidden">
                
                <div className="w-full text-left mb-4 select-none">
                  <span className="text-xs font-extrabold text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.25em] block mb-1">
                    {visitingUser ? "Visiting Friend" : "Interactive Oasis"}
                  </span>
                  <h3 className="text-base font-serif-title font-bold text-charcoal-850 dark:text-sage-100">
                    {visitingUser ? `${visitingUser.email.split("@")[0]}님의 아지트 🐾` : "복심이 아지트 🐾"}
                  </h3>
                </div>

                {/* Speach bubble */}
                <div className="relative bg-white dark:bg-[#151917] border border-slate-200 dark:border-charcoal-800/40 px-4 py-2.5 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-350 shadow-sm max-w-[240px] mb-5 cozy-bubble leading-relaxed">
                  {cozyText}
                </div>

                {/* Maltese Interactive Custom Character */}
                <div className="w-32 h-32 flex items-center justify-center select-none relative mb-5">
                  <img
                    src="/boksimi.png"
                    alt="복심이 놀이터"
                    className={`w-28 h-28 object-contain transform transition-all duration-500 ${
                      cozyPhase === "eat" 
                        ? "scale-110 animate-bounce" 
                        : cozyPhase === "pet" 
                        ? "scale-95 animate-pulse rotate-3" 
                        : "hover:rotate-3"
                    }`}
                    onClick={() => {
                      if (!visitingUser && unreadMessages.length > 0) {
                        setIsMailboxOpen(true);
                      } else if (!visitingUser) {
                        handlePetBoksimi();
                      }
                    }}
                  />
                  
                  {/* 🦴 안 읽은 우정의 개껌 편지 알림 배지 */}
                  {!visitingUser && unreadMessages.length > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 z-20">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-5 w-5 bg-sky-500 border border-white text-white text-[9px] font-bold items-center justify-center">
                        !
                      </span>
                    </span>
                  )}

                  {/* 🍖 개껌 주기 피드백 이펙트 */}
                  {cozyPhase === "eat" && (
                    <span className="absolute -top-2 right-4 text-2xl animate-ping select-none">🍖</span>
                  )}
                  {/* 💖 쓰다듬기 피드백 이펙트 */}
                  {cozyPhase === "pet" && (
                    <span className="absolute -top-2 right-4 text-2xl animate-bounce select-none">💖</span>
                  )}
                </div>

                {/* Play Actions / 친구 아지트 선물 폼 분기 */}
                {!visitingUser ? (
                  /* 내 복심이 아지트 액션 */
                  <div className="flex gap-3 w-full select-none">
                    <button
                      onClick={handleFeedSnack}
                      disabled={cozyPhase !== "idle"}
                      className="flex-1 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-2xl text-sm font-extrabold transition-all shadow-md disabled:opacity-40 disabled:scale-95 flex items-center justify-center gap-1"
                    >
                      <span>🍖 개껌 주기</span>
                    </button>
                    <button
                      onClick={handlePetBoksimi}
                      disabled={cozyPhase !== "idle"}
                      className="flex-1 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 rounded-2xl text-sm font-extrabold transition-all shadow-md disabled:opacity-40 disabled:scale-95 flex items-center justify-center gap-1"
                    >
                      <span>👋 쓰다듬기</span>
                    </button>
                  </div>
                ) : (
                  /* 친구 복심이 아지트 방문 선물 폼 */
                  <form onSubmit={handleSendGift} className="w-full space-y-3">
                    <input
                      type="text"
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="개껌과 함께 응원 한마디를 적어보개..."
                      className="w-full px-4 py-2 text-xs bg-white dark:bg-charcoal-950 border border-stone-200 dark:border-charcoal-850 rounded-xl focus:outline-none"
                      disabled={isSendingGift}
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={isSendingGift || !giftMessage.trim()}
                        className="flex-1 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all shadow-sm disabled:opacity-45"
                      >
                        {isSendingGift ? "선물 전달 중..." : "🍖 개껌 선물하기"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisitingUser(null)}
                        className="px-3.5 py-2 bg-stone-200 text-stone-600 rounded-xl text-xs font-bold transition-all"
                      >
                        돌아가기
                      </button>
                    </div>
                  </form>
                )}
                
                {/* 📬 편지함 열기 바로가기 */}
                {!visitingUser && unreadMessages.length > 0 && (
                  <button
                    onClick={() => setIsMailboxOpen(true)}
                    className="mt-3.5 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
                  >
                    편지함 열기 💌 ({unreadMessages.length}통)
                  </button>
                )}
              </div>

              {/* 2. Water Hydration Tracker */}
              <div className="bg-gradient-to-br from-white/50 to-white/10 dark:from-[#1b1e1c]/40 dark:to-[#121514]/20 backdrop-blur-xl border border-white/50 dark:border-charcoal-850/40 rounded-[32px] p-6 shadow-[0_16px_50px_rgba(15,23,42,0.04)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.2)] relative overflow-hidden">
                <div className="flex justify-between items-start mb-4 select-none">
                  <div>
                    <span className="text-xs font-extrabold text-[#4a7a8c] dark:text-[#528d9c] uppercase tracking-[0.25em] block mb-1">Hydration Guide</span>
                    <h3 className="text-base font-serif-title font-bold text-charcoal-850 dark:text-sage-100">오늘의 물 마시기 🥛</h3>
                    <p className="text-xs text-charcoal-450 dark:text-sage-400 mt-0.5">하루 8컵을 권장하개! ({waterCups} / 8)</p>
                  </div>
                  <button
                    onClick={handleDrinkWater}
                    className="w-10 h-10 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 border border-sky-500/20 transition-all flex items-center justify-center font-bold text-sm focus:outline-none"
                  >
                    +
                  </button>
                </div>

                {/* Elegant Horizontal Progress Wave or Dots */}
                <div className="flex gap-2.5 justify-center py-2 select-none">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div 
                      key={index}
                      className={`w-7.5 h-10 rounded-xl border flex flex-col justify-end overflow-hidden transition-all duration-500 ${
                        index < waterCups
                          ? "border-sky-500/40 bg-sky-50 dark:bg-sky-950/20"
                          : "border-charcoal-200 dark:border-charcoal-800 bg-white/20 dark:bg-charcoal-900/10"
                      }`}
                    >
                      {index < waterCups && (
                        <div className="w-full bg-gradient-to-t from-sky-400 to-sky-300 dark:from-sky-600 dark:to-sky-500 h-[75%] rounded-b-xl relative animate-pulse-slow" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Healing & Achievement Widget */}
              <div className="bg-gradient-to-br from-white/50 to-white/10 dark:from-[#1b1e1c]/40 dark:to-[#121514]/20 backdrop-blur-xl border border-white/50 dark:border-charcoal-850/40 rounded-[32px] p-6 shadow-[0_16px_50px_rgba(15,23,42,0.04)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.2)]">
                {/* Completion Gauge */}
                <div className="mb-5 select-none">
                  <span className="text-xs font-extrabold text-[#4a6b57] uppercase tracking-[0.25em] block mb-1">Core Progress</span>
                  <h3 className="text-base font-serif-title font-bold text-charcoal-850 dark:text-sage-100 mb-2">할 일 달성도 🎯</h3>
                  <div className="w-full bg-charcoal-200/50 dark:bg-charcoal-850/50 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-sky-500 h-full rounded-full transition-all duration-700" 
                      style={{ width: `${achievementRate}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-charcoal-450 dark:text-sage-400 mt-1.5 font-bold">
                    <span>오늘 미션 완수율</span>
                    <span>{achievementRate}% ({completedTasksCount}/{totalTasks} 완수)</span>
                  </div>
                </div>

                {/* Healing Quotes widget */}
                <div className="bg-white/40 dark:bg-charcoal-950/20 border border-charcoal-100/30 dark:border-charcoal-850/40 p-4 rounded-2xl shadow-inner min-h-[60px] flex items-center justify-center">
                  <p className="text-[11px] font-bold text-charcoal-650 dark:text-sage-350 leading-relaxed text-center select-none italic">
                    “ {HEALING_QUOTES[quoteIndex]} ”
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="text-[8px] tracking-widest text-slate-400/50 dark:text-slate-500/40 mt-16 select-none font-bold uppercase flex items-center gap-1.5 justify-center">
          Designed for a peaceful daily work flow • local SQLite storage 🐾
        </div>
      </div>

      {/* ================= 💌 3-2. 복심이 개껌 편지함 모달 팝업 ================= */}
      {isMailboxOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/45 dark:bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="bg-gradient-to-br from-white to-[#fcfaf5] dark:from-[#181c19] dark:to-[#121514] border border-slate-200/60 dark:border-charcoal-800/60 rounded-[32px] p-7 w-full max-w-sm shadow-2xl relative animate-scale-up select-none">
            
            <button
              onClick={() => setIsMailboxOpen(false)}
              className="absolute top-5 right-5 text-charcoal-400 hover:text-charcoal-700 dark:text-sage-500 dark:hover:text-sage-200 p-1.5 transition-colors focus:outline-none"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <span className="text-[8px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-[0.2em] block mb-1">
              {"Friend's Messages"}
            </span>
            <h3 className="text-base font-serif-title font-bold text-charcoal-850 dark:text-sage-50 leading-snug mb-5">
              우정의 개껌 편지함 💌
            </h3>

            <div className="max-h-[300px] overflow-y-auto space-y-4 pr-1.5">
              {unreadMessages.map((msg) => (
                <div 
                  key={msg.id} 
                  className="bg-white/70 dark:bg-charcoal-950/30 border border-stone-200/50 dark:border-charcoal-850/40 rounded-2xl p-4 shadow-sm relative overflow-hidden"
                >
                  {/* 발신인 */}
                  <div className="flex justify-between items-center text-[9px] font-bold text-indigo-650 dark:text-indigo-350 mb-2 border-b border-stone-200/20 pb-1.5">
                    <span>보낸 이: {msg.senderEmail.split("@")[0]}</span>
                    <span className="text-[8px] text-stone-400 font-mono">
                      {new Date(msg.createdAt).toLocaleDateString("ko-KR", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                  {/* 내용 */}
                  <p className="text-xs text-charcoal-700 dark:text-sage-350 leading-relaxed whitespace-pre-wrap italic">
                    “ {msg.message} ”
                  </p>
                  
                  {/* 읽음 처리 버튼 */}
                  <div className="mt-3 text-right">
                    <button
                      onClick={() => handleReadMessage(msg.id)}
                      className="px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-[9px] font-bold shadow-sm"
                    >
                      편지 확인 🍖
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center pt-4 border-t border-charcoal-100/30 mt-4">
              <button
                onClick={() => setIsMailboxOpen(false)}
                className="px-5 py-2 bg-stone-250 text-stone-600 rounded-xl text-xs font-bold"
              >
                닫기
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
