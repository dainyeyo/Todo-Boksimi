"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { 
  toggleTaskComplete, 
  deleteTask, 
  updateTask, 
  addTask 
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


interface CalendarViewProps {
  tasks: Task[];
}

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

// 🐾 강아지 발바닥 아이콘
function PawIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      <path d="M 12 11 C 9.2 11, 7.5 14.5, 9 17 C 10 18.5, 14 18.5, 15 17 C 16.5 14.5, 14.8 11, 12 11 Z" />
      <circle cx="7.2" cy="9.2" r="2.2" />
      <circle cx="10.4" cy="6.2" r="2.2" />
      <circle cx="13.6" cy="6.2" r="2.2" />
      <circle cx="16.8" cy="9.2" r="2.2" />
    </svg>
  );
}

export default function CalendarView({ tasks }: CalendarViewProps) {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // 📅 선택된 특정 날짜 (데일리 ToDo 모달 제어용)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // 모달 내 할 일 생성/수정 상태
  const [newTodoText, setNewTodoText] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleGoToday = () => {
    setCurrentDate(new Date());
  };

  const getDays = () => {
    const days = [];
    const firstDayIndex = new Date(year, month, 1).getDay();
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    const currentMonthLastDate = new Date(year, month + 1, 0).getDate();

    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthLastDate - i),
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= currentMonthLastDate; i++) {
      days.push({
        date: new Date(year, month, i),
        isCurrentMonth: true,
      });
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false,
      });
    }

    return days;
  };

  const calendarDays = getDays();

  // 특정 날짜의 할 일을 추출하는 함수
  const getTasksForDate = (date: Date) => {
    // 내 일정
    const myTasks = tasks
      .filter((task) => {
        if (task.dueDate) {
          const d = new Date(task.dueDate);
          return (
            d.getFullYear() === date.getFullYear() &&
            d.getMonth() === date.getMonth() &&
            d.getDate() === date.getDate()
          );
        }
        if (task.createdAt) {
          const c = new Date(task.createdAt);
          return (
            c.getFullYear() === date.getFullYear() &&
            c.getMonth() === date.getMonth() &&
            c.getDate() === date.getDate()
          );
        }
        return false;
      })
      .map((t) => ({ ...t, userEmail: "me" as string }));

    return myTasks;
  };

  // 날짜 박스 클릭 시 데일리 모달 열기
  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setNewTodoText("");
    setEditingTaskId(null);
  };

  // 모달 내 완료 토글
  const handleToggleComplete = (taskId: string) => {
    startTransition(async () => {
      await toggleTaskComplete(taskId);
      router.refresh();
    });
  };

  // 모달 내 할 일 생성
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoText.trim() || !selectedDate) return;

    startTransition(async () => {
      // 선택된 날짜의 YYYY-MM-DD 스트링 파싱하여 dueDate 설정
      const formattedDate = selectedDate.toISOString();
      const res = await addTask(newTodoText, false, formattedDate);
      if (res.error) {
        setError(res.error);
        setTimeout(() => setError(null), 3000);
      } else {
        setNewTodoText("");
        router.refresh();
      }
    });
  };

  // 모달 내 할 일 수정 시작
  const startEdit = (taskId: string, currentText: string) => {
    setEditingTaskId(taskId);
    setEditText(currentText);
  };

  // 모달 내 할 일 수정 저장
  const handleSaveEdit = (taskId: string) => {
    if (!editText.trim()) return;
    startTransition(async () => {
      await updateTask(taskId, { text: editText });
      setEditingTaskId(null);
      router.refresh();
    });
  };

  // 모달 내 할 일 삭제
  const handleDeleteTask = (taskId: string, text: string) => {
    if (confirm(`"${text}" 항목을 삭제하시겠습니까?`)) {
      startTransition(async () => {
        await deleteTask(taskId);
        router.refresh();
      });
    }
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  // 선택된 날짜의 일정 목록 계산
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];

  return (
    <div className="w-full bg-gradient-to-br from-white/50 to-white/10 dark:from-[#1b1e1c]/40 dark:to-[#121514]/20 backdrop-blur-xl border border-white/50 dark:border-charcoal-850/40 rounded-[32px] p-6 shadow-[0_16px_50px_rgba(15,23,42,0.04)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.2)] relative overflow-hidden">
      {/* 🎈 우측 상단 비누방울 복심이 데코 */}
      <img 
        src="/boksimi_bubble.png" 
        alt="비누방울 복심이" 
        className="absolute -top-3 -right-2.5 w-28 h-28 pointer-events-none select-none opacity-80 dark:opacity-70 hidden md:block hover:scale-105 transition-transform duration-500" 
      />
      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 bg-rose-500 text-white px-4 py-2.5 rounded-xl text-[10px] font-bold shadow-md border border-rose-450/20 dark:bg-rose-950/90">
          {error}
        </div>
      )}

      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-7 pb-4 border-b border-charcoal-100/30 dark:border-charcoal-800/30 select-none">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-serif-title font-bold text-sky-600 dark:text-sky-400 tracking-wider">
            {year}년 {month + 1}월
          </h2>
          <button
            onClick={handleGoToday}
            className="px-3.5 py-1.5 text-[11px] font-bold bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 dark:text-sky-400 rounded-xl transition-colors duration-300 uppercase tracking-widest flex items-center gap-1.5"
          >
            <PawIcon className="w-3.5 h-3.5" /> Today
          </button>
        </div>

        <div className="flex gap-1.5 self-end md:self-auto">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-white/50 dark:hover:bg-charcoal-800/50 rounded-xl text-charcoal-600 dark:text-sage-350 transition-colors border border-white/30 dark:border-charcoal-800/45"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-white/50 dark:hover:bg-charcoal-800/50 rounded-xl text-charcoal-600 dark:text-sage-350 transition-colors border border-white/30 dark:border-charcoal-800/45"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Weekdays Grid */}
      <div className="grid grid-cols-7 gap-1.5 text-center mb-3 select-none">
        {WEEKDAYS.map((day, index) => (
          <div
            key={day}
            className={`text-[13px] tracking-wider font-bold py-1.5 uppercase ${
              index === 0
                ? "text-rose-500/80"
                : index === 6
                ? "text-cyan-500/80"
                : "text-charcoal-400 dark:text-sage-400/70"
            }`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5">
        {calendarDays.map(({ date, isCurrentMonth }, index) => {
          const dayTasks = getTasksForDate(date);
          const isSun = date.getDay() === 0;
          const isSat = date.getDay() === 6;
          const todayFlag = isToday(date);

          return (
            <div
              key={index}
              onClick={() => isCurrentMonth && handleDayClick(date)}
              className={`min-h-[115px] p-3 flex flex-col justify-between border border-white/30 dark:border-charcoal-850/15 rounded-2.5xl transition-all duration-350 cursor-pointer ${
                isCurrentMonth
                  ? "bg-white/40 dark:bg-charcoal-950/15"
                  : "bg-white/5 dark:bg-charcoal-950/5 opacity-30 pointer-events-none"
              } ${
                todayFlag 
                  ? "ring-1.5 ring-sky-500/40 dark:ring-sky-450/35 bg-sky-500/[0.03] dark:bg-sky-500/[0.02]" 
                  : "hover:bg-white/70 dark:hover:bg-[#181c19]/25 hover:shadow-[0_4px_16px_rgba(15,23,42,0.02)] hover:-translate-y-[0.5px]"
              }`}
            >
              {/* Date Number with Maltese Paw Print if Today */}
              <div className="flex justify-between items-center mb-1.5 select-none pointer-events-none">
                <div className="relative w-7.5 h-7.5 flex items-center justify-center">
                  {todayFlag && (
                    <PawIcon className="absolute inset-0 text-sky-500/25 dark:text-sky-400/20 w-7.5 h-7.5 animate-pulse" />
                  )}
                  <span
                    className={`text-[12.5px] font-extrabold inline-flex items-center justify-center w-6.5 h-6.5 rounded-full z-10 ${
                      todayFlag
                        ? "bg-sky-500 text-white shadow-sm"
                        : isSun
                        ? "text-rose-500"
                        : isSat
                        ? "text-cyan-500"
                        : "text-charcoal-700 dark:text-sage-350"
                    }`}
                  >
                    {date.getDate()}
                  </span>
                </div>
                {dayTasks.length > 0 && (
                  <span className="text-[11px] px-1.5 py-0.5 bg-sky-500/10 text-sky-600 dark:text-sky-400 font-bold rounded-md scale-90 origin-right">
                    {dayTasks.length}
                  </span>
                )}
              </div>

              {/* Tasks List (캘린더에서는 클릭이 Day로 리디렉션되므로, 내부 버튼의 pointer-events-none을 해줍니다) */}
              <div className="flex-1 flex flex-col gap-1 overflow-hidden justify-end pointer-events-none select-none">
                {dayTasks.slice(0, 3).map((task) => {
                  const isMine = !task.userEmail || task.userEmail === "me";

                  return (
                    <div
                      key={task.id}
                      className={`text-[10.5px] text-left truncate px-2 py-1 rounded-md ${
                        task.completed
                          ? "bg-charcoal-100/30 text-charcoal-400/65 line-through opacity-60"
                          : !isMine
                          ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-350 font-bold border-l-2 border-emerald-500"
                          : task.focus
                          ? "bg-sky-500/10 text-sky-700 dark:text-sky-350 font-bold border-l-2 border-sky-500"
                          : "bg-white/85 dark:bg-[#181c19]/60 text-charcoal-800 dark:text-sage-300 border border-white/40 dark:border-charcoal-800/40 font-bold"
                      }`}
                    >
                      {!isMine && <span className="mr-0.5 opacity-75">👥</span>}
                      {task.text}
                    </div>
                  );
                })}
                {dayTasks.length > 3 && (
                  <span className="text-[10px] text-center text-charcoal-400 dark:text-sage-500 font-bold mt-0.5">
                    +{dayTasks.length - 3}개 더보기
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= 🐾 Daily ToDo Management Modal ================= */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/45 dark:bg-black/70 backdrop-blur-md animate-fade-in select-none">
          <div className="bg-gradient-to-br from-white to-[#fcfaf5] dark:from-[#181c19] dark:to-[#121514] border border-[#e5d5be]/40 dark:border-charcoal-800/60 rounded-[32px] p-7 w-full max-w-lg shadow-2xl relative animate-scale-up">
            
            {/* 닫기 버튼 */}
            <button
              onClick={() => {
                setSelectedDate(null);
                setEditingTaskId(null);
              }}
              className="absolute top-6 right-6 p-2 rounded-full hover:bg-stone-100 dark:hover:bg-charcoal-800 text-charcoal-400 hover:text-charcoal-750 dark:text-sage-500 dark:hover:text-sage-200 transition-all focus:outline-none z-50"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 모달 헤더 */}
            <div className="mb-5 pb-3 border-b border-charcoal-100/30 dark:border-charcoal-800/30">
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-[0.2em] block mb-0.5">
                Daily Task Manager
              </span>
              <h3 className="text-lg font-serif-title font-bold text-charcoal-850 dark:text-sage-50 leading-snug">
                {selectedDate.getMonth() + 1}월 {selectedDate.getDate()}일 일정 관리 🐾
              </h3>
            </div>

            {/* 할 일 목록 출력 */}
            <div className="max-h-[220px] overflow-y-auto space-y-3.5 mb-6 pr-1.5">
              {selectedDateTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-6 border border-dashed border-slate-200 dark:border-charcoal-800/80 rounded-2xl select-none bg-slate-50/30 dark:bg-charcoal-900/10">
                  <img src="/boksimi_rolling.png" alt="뒹굴 복심이" className="w-16 h-16 object-contain mb-2.5 opacity-90 animate-pulse-slow" />
                  <p className="text-xs font-bold text-slate-400 dark:text-sage-400/70 text-center leading-relaxed">
                    등록된 일정이 없습니다.<br />아래에서 할 일을 추가해 주개! 🐶
                  </p>
                </div>
              ) : (
                selectedDateTasks.map((task) => {
                  const isMine = !task.userEmail || task.userEmail === "me";
                  const isEditingThis = editingTaskId === task.id;

                  return (
                    <div 
                      key={task.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all duration-300 ${
                        task.completed 
                          ? "bg-stone-50/30 border-stone-200/20 opacity-60 scale-[0.98]" 
                          : !isMine
                          ? "bg-emerald-500/[0.03] border-emerald-500/20"
                          : "bg-white/60 dark:bg-charcoal-950/20 border-white/40 dark:border-charcoal-900/30"
                      }`}
                    >
                      <div className="flex items-center gap-3.5 flex-1 pr-2">
                        {/* 발바닥 체크박스 */}
                        <button
                          onClick={() => isMine && handleToggleComplete(task.id)}
                          disabled={isPending || !isMine}
                          className={`group relative flex items-center justify-center w-6 h-6 rounded-full border-1.5 transition-colors duration-300 focus:outline-none flex-shrink-0 ${
                            task.completed
                              ? "bg-sky-500/10 border-sky-500 text-sky-600"
                              : isMine 
                              ? "border-sky-400/40 hover:border-sky-500 text-sky-500"
                              : "border-emerald-500/20 text-emerald-500/40"
                          }`}
                        >
                          <PawIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${
                            task.completed ? "scale-100 opacity-100" : "scale-0 opacity-0 group-hover:scale-100"
                          }`} />
                        </button>

                        <div className="flex-1 flex flex-col min-w-0">
                          {isEditingThis ? (
                            /* 인라인 수정 입력창 */
                            <div className="flex gap-1.5 w-full">
                              <input
                                type="text"
                                value={editText}
                                onChange={(e) => setEditText(e.target.value)}
                                className="flex-1 px-2.5 py-1.5 bg-white border border-stone-250 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-rose-500/30"
                                disabled={isPending}
                              />
                              <button
                                onClick={() => handleSaveEdit(task.id)}
                                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-lg text-xs"
                              >
                                저장
                              </button>
                              <button
                                onClick={() => setEditingTaskId(null)}
                                className="px-2.5 py-1.5 bg-stone-200 text-stone-600 rounded-lg text-xs"
                              >
                                취소
                              </button>
                            </div>
                          ) : (
                            /* 텍스트 렌더링 */
                            <span className={`text-[13.5px] font-bold leading-normal break-all truncate max-w-[280px] ${
                              task.completed 
                                ? "text-charcoal-400/70 line-through" 
                                : !isMine 
                                ? "text-emerald-700 dark:text-emerald-300"
                                : "text-charcoal-850 dark:text-sage-100"
                            }`}>
                              {task.text}
                            </span>
                          )}
                          {!isMine && (
                            <span className="text-[10.5px] font-extrabold text-emerald-600/80 uppercase mt-0.5 tracking-wider">
                              작성자: {task.userEmail.split("@")[0]} 👥
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 제어 버튼 (내 일정일 때만 노출) */}
                      {isMine && !isEditingThis && (
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <button
                            onClick={() => startEdit(task.id, task.text)}
                            className="p-1 text-stone-400 hover:text-stone-700 text-xs font-bold"
                          >
                            수정
                          </button>
                          <button
                            onClick={() => handleDeleteTask(task.id, task.text)}
                            disabled={isPending}
                            className="p-1 text-red-500 hover:text-red-600 text-xs font-bold"
                          >
                            삭제
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* 할 일 추가 인풋 (내 달력일 때만 노출) */}
            <form onSubmit={handleAddTask} className="pt-4 border-t border-charcoal-100/30">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  placeholder="이 날짜에 할 일을 추가하개..."
                  className="flex-1 px-4 py-2.5 bg-stone-50 dark:bg-charcoal-950 border border-stone-250 dark:border-charcoal-850 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-sky-500/25"
                  disabled={isPending}
                />
                <button
                  type="submit"
                  disabled={isPending || !newTodoText.trim()}
                  className="px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-extrabold rounded-xl text-sm disabled:opacity-40"
                >
                  추가
                </button>
              </div>
            </form>

          </div>
        </div>
      )}
    </div>
  );
}
