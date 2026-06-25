"use client";

import React, { useState, useTransition } from "react";
import { addTask, toggleTaskComplete, deleteTask } from "@/app/actions";

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

// 🐾 귀여운 말티즈 발바닥 아이콘 컴포넌트
function PawIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor">
      {/* 발바닥 큰 패드 */}
      <path d="M 12 11 C 9.2 11, 7.5 14.5, 9 17 C 10 18.5, 14 18.5, 15 17 C 16.5 14.5, 14.8 11, 12 11 Z" />
      {/* 발가락 패드 4개 */}
      <circle cx="7.2" cy="9.2" r="2.2" />
      <circle cx="10.4" cy="6.2" r="2.2" />
      <circle cx="13.6" cy="6.2" r="2.2" />
      <circle cx="16.8" cy="9.2" r="2.2" />
    </svg>
  );
}

function getDday(dueDate: Date | string | null): string | null {
  if (!dueDate) return null;
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff === 0) return "D-Day 🐾";
  if (diff > 0) return `D-${diff}`;
  return `D+${Math.abs(diff)}`;
}

function getDdayColor(dueDate: Date | string | null): string {
  if (!dueDate) return "";
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return "text-rose-500 bg-rose-500/5 dark:bg-rose-500/10";
  if (diff === 0) return "text-rose-600 bg-rose-500/10 dark:text-rose-400 dark:bg-rose-500/10";
  if (diff <= 3) return "text-amber-500 bg-amber-500/5 dark:bg-amber-500/5";
  return "text-[#4a6b57] bg-[#4a6b57]/5 dark:text-emerald-400 dark:bg-emerald-500/10";
}

interface TodayFocusProps {
  tasks: Task[];
}

export default function TodayFocus({ tasks }: TodayFocusProps) {
  const [newTodo, setNewTodo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 미완료 항목이 위로, 완료 항목이 아래로 오도록 하되 생성일자 역순 정렬
  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    }
    return a.completed ? 1 : -1;
  });

  const completedTasksCount = tasks.filter((t) => t.completed).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    startTransition(async () => {
      const res = await addTask(newTodo, false);
      if (res.error) {
        setError(res.error);
        setTimeout(() => setError(null), 3000);
      } else {
        setNewTodo("");
      }
    });
  };

  const handleCheck = (id: string) => {
    startTransition(async () => {
      await toggleTaskComplete(id);
    });
  };

  const handleDelete = (id: string, text: string) => {
    const confirmDelete = window.confirm(`"${text}" 항목을 삭제하시겠습니까?`);
    if (!confirmDelete) return;

    startTransition(async () => {
      await deleteTask(id);
    });
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Today's Focus Cute Card */}
      <div className="bg-gradient-to-br from-white/50 to-white/10 dark:from-[#1b1e1c]/40 dark:to-[#121514]/20 backdrop-blur-xl border border-white/50 dark:border-charcoal-850/40 rounded-[32px] p-8 shadow-[0_16px_50px_rgba(230,200,200,0.07)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.2)] transition-all duration-500">
        
        {/* Card Title */}
        <div className="flex justify-between items-center mb-6.5 border-b border-charcoal-100/30 dark:border-charcoal-800/30 pb-4 select-none">
          <div>
            <h2 className="text-xl font-serif-title font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-700 via-rose-500 to-amber-700 dark:from-amber-200 dark:via-rose-300 dark:to-amber-200 tracking-wide">
              오늘의 할 일
            </h2>
            <p className="text-[9px] text-charcoal-400 dark:text-sage-400 mt-1 uppercase tracking-widest font-extrabold">
              {"Today's Tasks"} • {completedTasksCount} / {tasks.length} 완수
            </p>
          </div>
          <span className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-300 dark:bg-rose-500/5 rounded-xl text-[9px] font-extrabold tracking-widest uppercase flex items-center gap-1">
            <PawIcon className="w-2.5 h-2.5" /> Paw
          </span>
        </div>
 
        {/* Task List Container */}
        <div className="mb-7.5 min-h-[140px] flex flex-col justify-start space-y-3.5">
          {sortedTasks.length === 0 ? (
            <div className="text-center py-10 select-none border border-dashed border-charcoal-200/30 dark:border-charcoal-800/30 rounded-2.5xl bg-white/20 dark:bg-black/5">
              <p className="text-sm font-bold text-charcoal-500 dark:text-sage-400">
                오늘 할 일을 추가해 주개! 🐶
              </p>
              <p className="text-[10px] mt-2 text-charcoal-450 dark:text-sage-500 tracking-wide font-semibold">
                강아지 발바닥을 클릭하면 완료 처리되개!
              </p>
            </div>
          ) : (
            sortedTasks.map((task) => (
              <div
                key={task.id}
                className={`flex items-center justify-between p-4.5 rounded-2.5xl border shadow-[0_4px_16px_rgba(0,0,0,0.01)] transition-all duration-500 ${
                  task.completed
                    ? "bg-stone-50/30 dark:bg-charcoal-950/10 border-stone-200/20 dark:border-charcoal-900/10 opacity-60 scale-[0.99]"
                    : "bg-white/60 dark:bg-charcoal-950/20 border-white/40 dark:border-charcoal-900/30 hover:shadow-[0_6px_22px_rgba(230,180,180,0.08)] hover:-translate-y-[1.5px] scale-100"
                }`}
              >
                <div className="flex items-center gap-4.5 flex-1 pr-3">
                  {/* 발바닥 체크박스 */}
                  <button
                    onClick={() => handleCheck(task.id)}
                    disabled={isPending}
                    className={`group relative flex items-center justify-center w-6 h-6 rounded-full border-1.5 transition-colors duration-300 focus:outline-none flex-shrink-0 ${
                      task.completed
                        ? "bg-rose-500/10 border-rose-500 text-rose-600 dark:border-rose-450"
                        : "border-rose-450/40 hover:border-rose-450 text-rose-450 dark:border-rose-400/30 dark:hover:border-rose-400"
                    }`}
                  >
                    <PawIcon
                      className={`w-3.5 h-3.5 text-rose-450 dark:text-rose-300 transition-all duration-300 ${
                        task.completed ? "scale-100 opacity-100" : "scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100"
                      }`}
                    />
                  </button>
                  
                  <div className="flex flex-col">
                    <span
                      className={`text-sm select-none break-all font-bold leading-normal transition-all duration-300 ${
                        task.completed
                          ? "text-charcoal-400/70 dark:text-sage-500/50 line-through"
                          : "text-charcoal-850 dark:text-sage-100"
                      }`}
                    >
                      {task.text}
                    </span>
                    {task.dueDate && (
                      <div className="flex items-center gap-1.5 mt-1 select-none">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                            task.completed
                              ? "bg-stone-200/50 text-stone-500 dark:bg-charcoal-800 dark:text-sage-500"
                              : getDdayColor(task.dueDate)
                          }`}
                        >
                          {task.completed ? "완료됨" : getDday(task.dueDate)}
                        </span>
                        <span
                          className={`text-[9px] font-bold ${
                            task.completed
                              ? "text-stone-400 dark:text-sage-600"
                              : "text-charcoal-400 dark:text-sage-50"
                          }`}
                        >
                          {new Date(task.dueDate).toLocaleDateString("ko-KR", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 삭제 버튼 (쓰레기통 아이콘) */}
                <button
                  onClick={() => handleDelete(task.id, task.text)}
                  disabled={isPending}
                  title="할 일 삭제"
                  className={`p-1.5 hover:bg-rose-500/10 rounded-xl transition-colors duration-300 focus:outline-none flex-shrink-0 ${
                    task.completed
                      ? "text-charcoal-350 hover:text-rose-600 dark:text-sage-600 dark:hover:text-rose-400"
                      : "text-charcoal-400 hover:text-rose-600 dark:text-sage-500 dark:hover:text-rose-400"
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="relative">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTodo}
              onChange={(e) => setNewTodo(e.target.value)}
              placeholder="오늘 할 일을 추가해 주개..."
              disabled={isPending}
              className="flex-1 px-5 py-3.5 bg-white/80 dark:bg-[#151816] border border-white/40 dark:border-charcoal-900/60 rounded-2.5xl text-charcoal-900 dark:text-sage-50 placeholder-charcoal-400 dark:placeholder-sage-500/70 shadow-inner focus:outline-none focus:ring-2 focus:ring-stone-400/5 focus:border-stone-300 transition-all duration-300 text-xs font-semibold"
            />
            <button
              type="submit"
              disabled={isPending || !newTodo.trim()}
              className="px-5 py-3.5 bg-gradient-to-r from-rose-500 to-amber-600 dark:from-rose-450 dark:to-amber-500 hover:opacity-90 text-white rounded-2.5xl transition-all duration-300 font-extrabold shadow-md disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center justify-center flex-shrink-0"
            >
              추가
            </button>
          </div>
          
          {error && (
            <div className="absolute left-0 right-0 -bottom-11 bg-rose-550 dark:bg-rose-950/90 text-white dark:text-rose-250 text-[10px] font-bold py-2.5 px-4 rounded-xl text-center shadow-md border border-rose-400/20 backdrop-blur-sm z-10 transition-all duration-300">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
