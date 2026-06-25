"use client";

import React, { useState, useTransition } from "react";
import {
  addTask,
  updateTask,
  toggleTaskComplete,
  toggleTaskFocus,
  deleteTask,
  clearCompletedTasks,
} from "@/app/actions";

interface Task {
  id: string;
  text: string;
  memo: string | null;
  completed: boolean;
  focus: boolean;
  dueDate: Date | string | null;
  repeat: string | null;
}

interface TaskInboxProps {
  tasks: Task[];
}

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

const REPEAT_OPTIONS = [
  { value: "", label: "반복 없음" },
  { value: "daily", label: "매일 반복" },
  { value: "weekly", label: "매주 반복" },
  { value: "monthly", label: "매월 반복" },
];

const REPEAT_LABEL: Record<string, string> = {
  daily: "매일",
  weekly: "매주",
  monthly: "매월",
};

export default function TaskInbox({ tasks }: TaskInboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newTodo, setNewTodo] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [newMemo, setNewMemo] = useState("");
  const [newRepeat, setNewRepeat] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"inbox" | "completed">("inbox");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [editMemo, setEditMemo] = useState("");
  const [editDueDate, setEditDueDate] = useState("");
  const [editRepeat, setEditRepeat] = useState("");

  const inboxTasks = tasks.filter((t) => !t.focus && !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);
  const activeFocusCount = tasks.filter((t) => t.focus && !t.completed).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    startTransition(async () => {
      const res = await addTask(newTodo, false, newDueDate || null, newMemo || null, newRepeat || null);
      if (res.error) {
        setError(res.error);
        setTimeout(() => setError(null), 3000);
      } else {
        setNewTodo("");
        setNewDueDate("");
        setNewMemo("");
        setNewRepeat("");
        setShowAddForm(false);
      }
    });
  };

  const handlePin = async (id: string) => {
    if (activeFocusCount >= 5) {
      setError("오늘의 집중 할 일은 최대 5개까지만 등록할 수 있습니다.");
      setTimeout(() => setError(null), 3000);
      return;
    }
    startTransition(async () => { await toggleTaskFocus(id); });
  };

  const handleCheck = async (id: string) => {
    startTransition(async () => { await toggleTaskComplete(id); });
  };

  const handleDelete = async (id: string) => {
    if (confirm("이 할 일을 삭제하시겠습니까?")) {
      startTransition(async () => { await deleteTask(id); });
    }
  };

  const handleClearCompleted = async () => {
    if (confirm("완료된 모든 일정을 삭제하시겠습니까?")) {
      startTransition(async () => { await clearCompletedTasks(); });
    }
  };

  const startEdit = (task: Task) => {
    setEditingId(task.id);
    setEditText(task.text);
    setEditMemo(task.memo || "");
    setEditDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    setEditRepeat(task.repeat || "");
  };

  const handleEditSave = async (id: string) => {
    startTransition(async () => {
      await updateTask(id, {
        text: editText,
        memo: editMemo || null,
        dueDate: editDueDate || null,
        repeat: editRepeat || null,
      });
      setEditingId(null);
    });
  };

  return (
    <div className="w-full max-w-xl mx-auto mt-2">
      {/* Toggle Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-7 py-4.5 bg-white/30 dark:bg-charcoal-900/15 backdrop-blur-md border border-white/40 dark:border-charcoal-800/40 rounded-2.5xl hover:bg-white/40 dark:hover:bg-charcoal-900/30 hover:-translate-y-[1px] transition-all duration-350 shadow-sm focus:outline-none select-none"
      >
        <span className="text-xs font-bold text-amber-900 dark:text-amber-250 tracking-wide uppercase flex items-center gap-2">
          {isOpen ? "보관함 닫개 🐶" : "보관함 및 완료 목록 열개 🐾"}
          <span className="px-2 py-0.5 bg-rose-500/10 text-rose-600 dark:text-rose-300 rounded-lg font-bold text-[9px] tracking-normal">
            {inboxTasks.length + completedTasks.length}
          </span>
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 text-charcoal-500 dark:text-sage-400 transition-transform duration-500 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.4} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded Panel */}
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? "max-h-[1000px] opacity-100 mt-4" : "max-h-0 opacity-0 pointer-events-none"
        }`}
      >
        <div className="bg-gradient-to-br from-white/50 to-white/10 dark:from-[#1b1e1c]/40 dark:to-[#121514]/20 backdrop-blur-xl border border-white/50 dark:border-charcoal-850/40 rounded-[32px] p-6 shadow-[0_16px_50px_rgba(230,200,200,0.06)] dark:shadow-[0_16px_50px_rgba(0,0,0,0.2)]">
          
          {/* Sub-Tabs */}
          <div className="flex bg-white/20 dark:bg-charcoal-950/20 p-1 border border-white/30 dark:border-charcoal-900/30 rounded-xl mb-5 select-none">
            <button
              onClick={() => setActiveTab("inbox")}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all duration-300 relative z-10 ${
                activeTab === "inbox"
                  ? "bg-white dark:bg-charcoal-900 text-rose-650 dark:text-rose-300 shadow-sm"
                  : "text-charcoal-500 dark:text-sage-400 hover:text-charcoal-700"
              }`}
            >
              할 일 보관함 ({inboxTasks.length})
            </button>
            <button
              onClick={() => setActiveTab("completed")}
              className={`flex-1 text-center py-2 text-xs font-bold rounded-lg transition-all duration-300 relative z-10 ${
                activeTab === "completed"
                  ? "bg-white dark:bg-charcoal-900 text-rose-650 dark:text-rose-300 shadow-sm"
                  : "text-charcoal-500 dark:text-sage-400 hover:text-charcoal-700"
              }`}
            >
              완료된 일정 ({completedTasks.length})
            </button>
          </div>

          {/* ── Inbox Tab ── */}
          {activeTab === "inbox" && (
            <div className="space-y-4">
              {/* Add Task Button */}
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/10 rounded-xl transition-all duration-300 text-xs font-bold uppercase tracking-wider"
              >
                <span>{showAddForm ? "− Close Form" : "+ Add New Schedule"}</span>
              </button>

              {/* Add Form */}
              {showAddForm && (
                <form onSubmit={handleSubmit} className="space-y-3 bg-white/40 dark:bg-[#121514]/20 border border-white/20 dark:border-charcoal-900/40 rounded-2.5xl p-4.5 shadow-inner">
                  <input
                    type="text"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    placeholder="할 일 제목 *"
                    disabled={isPending}
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-[#151816] border border-white/30 dark:border-charcoal-900/60 rounded-xl text-charcoal-900 dark:text-sage-50 placeholder-charcoal-400 dark:placeholder-sage-500/70 text-xs font-semibold focus:outline-none focus:ring-1.5 focus:ring-rose-400/20"
                  />
                  <textarea
                    value={newMemo}
                    onChange={(e) => setNewMemo(e.target.value)}
                    placeholder="메모를 입력해 주개 (선택)"
                    rows={2}
                    disabled={isPending}
                    className="w-full px-4 py-2.5 bg-white/70 dark:bg-[#151816] border border-white/30 dark:border-charcoal-900/60 rounded-xl text-charcoal-900 dark:text-sage-50 placeholder-charcoal-400 dark:placeholder-sage-500/70 text-xs font-semibold focus:outline-none focus:ring-1.5 focus:ring-rose-400/20 resize-none"
                  />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-[9px] text-charcoal-400 dark:text-sage-500 uppercase tracking-widest font-bold mb-1 block">마감일</label>
                      <input
                        type="date"
                        value={newDueDate}
                        onChange={(e) => setNewDueDate(e.target.value)}
                        disabled={isPending}
                        className="w-full px-3 py-2 bg-white/70 dark:bg-[#151816] border border-white/30 dark:border-charcoal-900/60 rounded-xl text-charcoal-900 dark:text-sage-50 text-xs focus:outline-none focus:ring-1.5 focus:ring-rose-400/20"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[9px] text-charcoal-400 dark:text-sage-500 uppercase tracking-widest font-bold mb-1 block">반복 설정</label>
                      <select
                        value={newRepeat}
                        onChange={(e) => setNewRepeat(e.target.value)}
                        disabled={isPending}
                        className="w-full px-3 py-2 bg-white/70 dark:bg-[#151816] border border-white/30 dark:border-charcoal-900/60 rounded-xl text-charcoal-900 dark:text-sage-50 text-xs focus:outline-none focus:ring-1.5 focus:ring-rose-400/20"
                      >
                        {REPEAT_OPTIONS.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={isPending || !newTodo.trim()}
                    className="w-full py-2.5 bg-gradient-to-r from-rose-500 to-amber-600 text-white rounded-xl text-xs font-bold hover:opacity-95 transition-all shadow-md disabled:opacity-40"
                  >
                    보관함에 저장하개 🐾
                  </button>
                </form>
              )}

              {/* Task List */}
              <div className="max-h-[380px] overflow-y-auto space-y-2.5 pr-1">
                {inboxTasks.length === 0 ? (
                  <p className="text-center py-10 text-xs font-bold text-charcoal-400 dark:text-sage-500 select-none">
                    보관함이 비어있개! 일정을 채워주개 🐶
                  </p>
                ) : (
                  inboxTasks.map((task) =>
                    editingId === task.id ? (
                      <div key={task.id} className="p-4.5 bg-white/60 dark:bg-charcoal-950/40 rounded-2.5xl border border-rose-500/25 space-y-2.5 shadow-md">
                        <input
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-[#151816] border border-charcoal-200 dark:border-charcoal-850 rounded-xl text-xs text-charcoal-900 dark:text-sage-50 focus:outline-none"
                        />
                        <textarea
                          value={editMemo}
                          onChange={(e) => setEditMemo(e.target.value)}
                          rows={2}
                          placeholder="메모"
                          className="w-full px-3 py-2 bg-white dark:bg-[#151816] border border-charcoal-200 dark:border-charcoal-850 rounded-xl text-xs text-charcoal-900 dark:text-sage-50 focus:outline-none resize-none"
                        />
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={(e) => setEditDueDate(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white dark:bg-[#151816] border border-charcoal-200 dark:border-charcoal-850 rounded-xl text-xs text-charcoal-900 dark:text-sage-50 focus:outline-none"
                          />
                          <select
                            value={editRepeat}
                            onChange={(e) => setEditRepeat(e.target.value)}
                            className="flex-1 px-3 py-2 bg-white dark:bg-[#151816] border border-charcoal-200 dark:border-charcoal-850 rounded-xl text-xs text-charcoal-900 dark:text-sage-50 focus:outline-none"
                          >
                            {REPEAT_OPTIONS.map((o) => (
                              <option key={o.value} value={o.value}>{o.label}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditSave(task.id)}
                            disabled={isPending}
                            className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold transition-all"
                          >저장</button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex-1 py-2 bg-black/5 dark:bg-white/5 rounded-xl text-xs font-bold transition-all text-charcoal-700 dark:text-sage-300"
                          >취소</button>
                        </div>
                      </div>
                    ) : (
                      <div
                        key={task.id}
                        className="flex items-start justify-between p-4.5 bg-white/60 dark:bg-[#181c19]/30 rounded-2.5xl border border-white/40 dark:border-charcoal-900/30 hover:bg-white/70 dark:hover:bg-[#181c19]/55 hover:shadow-[0_4px_16px_rgba(230,180,180,0.04)] transition-all duration-300 gap-2"
                      >
                        <div className="flex items-start gap-3.5 min-w-0 flex-1">
                          
                          {/* 🐾 Maltese Paw Checkbox in list */}
                          <button
                            onClick={() => handleCheck(task.id)}
                            disabled={isPending}
                            className="group relative flex items-center justify-center w-5.5 h-5.5 rounded-full border border-rose-400/40 hover:border-rose-450 dark:border-rose-400/35 dark:hover:border-rose-400 transition-colors focus:outline-none flex-shrink-0 mt-0.5"
                          >
                            <PawIcon className="w-3.5 h-3.5 text-rose-450 dark:text-rose-350 scale-0 group-hover:scale-100 transition-transform duration-300" />
                          </button>
                          
                          <div className="min-w-0 flex-1">
                            <span className="text-sm font-bold text-charcoal-850 dark:text-sage-100 select-none break-words leading-relaxed">
                              {task.text}
                            </span>
                            {task.memo && (
                              <p className="text-xs text-charcoal-450 dark:text-sage-450 mt-1 break-words leading-relaxed whitespace-pre-wrap">
                                {task.memo}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5 flex-wrap select-none">
                              {task.dueDate && (
                                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${getDdayColor(task.dueDate)}`}>
                                  {getDday(task.dueDate)}
                                </span>
                              )}
                              {task.repeat && (
                                <span className="text-[9px] font-bold px-1.5 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 rounded-md">
                                  🔁 {REPEAT_LABEL[task.repeat] ?? task.repeat}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0 select-none">
                          <button
                            onClick={() => startEdit(task)}
                            title="편집"
                            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-charcoal-400 hover:text-charcoal-700 dark:text-sage-500 dark:hover:text-sage-200 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handlePin(task.id)}
                            disabled={isPending}
                            title="오늘의 집중 등록"
                            className="p-1.5 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg text-amber-600 hover:text-amber-700 dark:text-amber-450 dark:hover:text-amber-300 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M5 15l7-7 7 7" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(task.id)}
                            disabled={isPending}
                            title="삭제"
                            className="p-1.5 hover:bg-rose-500/10 rounded-lg text-rose-450 hover:text-rose-600 transition-colors"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          )}

          {/* ── Completed Tab ── */}
          {activeTab === "completed" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 select-none">
                <span className="text-[10px] text-charcoal-400 dark:text-sage-400 uppercase tracking-widest font-bold">
                  Completed Schedules ({completedTasks.length})
                </span>
                {completedTasks.length > 0 && (
                  <button
                    onClick={handleClearCompleted}
                    disabled={isPending}
                    className="text-xs text-rose-500 hover:text-rose-600 font-bold focus:outline-none transition-colors"
                  >
                    완료목록 전체 삭제
                  </button>
                )}
              </div>

              <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1">
                {completedTasks.length === 0 ? (
                  <p className="text-center py-10 text-xs font-bold text-charcoal-400 dark:text-sage-500 select-none">
                    완료된 일정이 없개! 힘내서 끝마치개 🐾
                  </p>
                ) : (
                  completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-3.5 bg-black/5 dark:bg-white/5 rounded-xl border border-transparent opacity-65 hover:opacity-100 transition-all"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <button
                          onClick={() => handleCheck(task.id)}
                          disabled={isPending}
                          className="w-5 h-5 rounded-full bg-rose-500/80 border border-rose-550 text-white flex items-center justify-center focus:outline-none flex-shrink-0"
                        >
                          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3.4} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <span className="text-sm line-through text-charcoal-500 dark:text-sage-400 truncate select-none font-bold">
                          {task.text}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(task.id)}
                        disabled={isPending}
                        className="p-1 hover:bg-rose-500/10 rounded-lg text-rose-450 hover:text-rose-600 transition-colors flex-shrink-0"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 bg-rose-550 dark:bg-rose-950/80 text-white dark:text-rose-200 text-[10px] font-bold py-2.5 px-4 rounded-xl text-center shadow-md">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
