"use client";
import React, { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";

// Placeholder scheduled posts data
const scheduledPosts = [
  {
    date: "2024-06-10",
    image: "/public/blue-cereal.png",
    title: "LinkedIn Post",
    platform: "LinkedIn",
  },
  {
    date: "2024-06-12",
    image: "/public/bright-cereal.png",
    title: "Instagram Story",
    platform: "Instagram",
  },
  // Dummy static post for today
  {
    date: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`,
    image: "/public/girl1.jpeg",
    title: "Instagram Post",
    platform: "Instagram",
    caption: "Excited to launch our new campaign! #marketing #launch #success",
    time: "15:30",
  },
];

const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function CampaignSchedulePage() {
  const today = new Date();
  const [calendarDate, setCalendarDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [modalPost, setModalPost] = useState<typeof scheduledPosts[0] | null>(null);

  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOfWeek = getFirstDayOfWeek(year, month);

  // Map date string to post
  const postsByDate: { [date: string]: typeof scheduledPosts[0] } = {};
  scheduledPosts.forEach(post => {
    postsByDate[post.date] = post;
  });

  // Calendar grid: fill with empty slots before the 1st
  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarCells.push(day);
  }

  // Month navigation
  const handlePrevMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };
  const handleNextMonth = () => {
    setCalendarDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-[#111] flex flex-col items-center py-12 px-2">
      <div className="w-full max-w-3xl bg-[#181818] rounded-2xl shadow-lg p-8 flex flex-col items-center">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">Campaign Schedule</h1>
        {/* Month Navigation */}
        <div className="flex items-center justify-between w-full mb-4">
          <button
            className="bg-[#222] text-white px-4 py-2 rounded hover:bg-[#333] transition"
            onClick={handlePrevMonth}
          >
            &lt; Prev
          </button>
          <span className="text-white font-semibold text-lg">
            {calendarDate.toLocaleString("default", { month: "long" })} {year}
          </span>
          <button
            className="bg-[#222] text-white px-4 py-2 rounded hover:bg-[#333] transition"
            onClick={handleNextMonth}
          >
            Next &gt;
          </button>
        </div>
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 w-full mb-2">
          {daysOfWeek.map(day => (
            <div key={day} className="text-center text-gray-400 font-semibold">{day}</div>
          ))}
        </div>
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2 w-full mb-8">
          {calendarCells.map((cell, idx) => {
            if (cell === null) {
              return <div key={"empty-" + idx} className="" />;
            }
            const day = cell;
            const dateStr = `${year}-` + `${month + 1}`.padStart(2, "0") + `-` + `${day}`.padStart(2, "0");
            const post = postsByDate[dateStr];
            // Highlight current date
            const isToday =
              day === today.getDate() &&
              month === today.getMonth() &&
              year === today.getFullYear();
            return (
              <div
                key={day}
                className={`bg-[#222] rounded-lg p-2 flex flex-col items-center min-h-[80px] border border-[#333] relative ${isToday ? "border-blue-500 bg-blue-950" : ""}`}
              >
                <span className="text-xs text-gray-400 mb-1">{day}</span>
                {post && (
                  <button
                    className="mt-1 focus:outline-none"
                    onClick={() => setModalPost(post)}
                  >
                    <img
                      src={post.image}
                      alt={post.title}
                      className="w-12 h-12 object-contain rounded shadow border border-[#444]"
                    />
                  </button>
                )}
              </div>
            );
          })}
        </div>
        {/* Modal */}
        {modalPost && (
          <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
            <div className="bg-[#181818] rounded-2xl p-6 max-w-md w-full flex flex-col items-center">
              <h2 className="text-xl font-bold text-white mb-2 text-center">{modalPost.title}</h2>
              <img src={modalPost.image} alt="Scheduled Post" className="w-64 h-64 object-contain rounded mb-4" />
              {modalPost.caption && (
                <div className="text-white text-center mb-2">
                  <span className="font-semibold">Caption:</span> <span>{modalPost.caption}</span>
                </div>
              )}
              <div className="text-gray-300 text-sm mb-2">
                <span className="font-semibold">Date:</span> {modalPost.date}
                {modalPost.time && <span> &nbsp; <span className="font-semibold">Time:</span> {modalPost.time}</span>}
              </div>
              <div className="flex gap-3 mt-4">
                <button className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 transition">Approve</button>
                <button className="bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition">Reject</button>
                <button className="bg-yellow-500 text-white px-4 py-2 rounded-xl hover:bg-yellow-600 transition">Regenerate</button>
              </div>
              <button
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition"
                onClick={() => setModalPost(null)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
    </ProtectedRoute>
  );
} 