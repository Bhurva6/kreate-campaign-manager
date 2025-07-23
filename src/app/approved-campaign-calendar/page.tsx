"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";

function ApprovedCampaignCalendarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentDate] = useState(new Date());
  const [viewingMonth, setViewingMonth] = useState(new Date());
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [editText, setEditText] = useState("");
  
  // Get campaign data from URL params (if available)
  const platforms = searchParams.get('platforms')?.split(',') || [];
  const frequency = searchParams.get('frequency') || '';
  const focusAreas = searchParams.get('focusAreas')?.split(',') || [];

  // Sample images for the calendar posts - Using images from panache-white-text-5 folder
  const sampleImages = [
    "/panache-white-text-5/post_3+local+1753258339+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258340+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258341+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258342+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258343+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258344+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258346+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258347+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258348+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258349+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258350+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258351+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258352+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258353+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258354+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258355+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258356+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258357+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258358+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg",
    "/panache-white-text-5/post_3+local+1753258359+3565d538-fc7a-4283-87d6-de848eb75aaf.jpg"
  ];

  // Sample captions for posts
  const sampleCaptions = [
    "🌱 Building a sustainable future with Panache Greens! Our eco-friendly materials are revolutionizing construction. #SustainableBuilding #EcoFriendly",
    "✨ Quality meets sustainability in every Panache Greens product. Experience the difference green building materials make! #GreenConstruction #Innovation",
    "🏗️ Transform your projects with our premium sustainable building materials. Better for you, better for the planet! #EcoConstruction #QualityFirst",
    "🌍 At Panache Greens, we believe in creating homes that care for the environment. Join the green revolution! #SustainableLiving #PanacheGreens",
    "💚 Discover the beauty of sustainable architecture with Panache Greens materials. Building tomorrow, today! #Architecture #Sustainability",
    "🔧 Professional builders trust Panache Greens for quality and sustainability. Make the smart choice for your next project! #ProfessionalGrade #EcoBuilding",
    "🏡 Every sustainable home starts with the right materials. Choose Panache Greens for a greener future! #SustainableHomes #EcoMaterials",
    "⚡ Innovation in every product - Panache Greens leads the way in sustainable building solutions! #Innovation #GreenTech"
  ];

  // Generate approval status (all approved for this page)
  const getApprovalInfo = () => {
    const approvers = ["Sarah Johnson (Marketing Director)", "Mike Chen (Brand Manager)", "Lisa Patel (Campaign Lead)", "David Kumar (Creative Director)"];
    return {
      approver: approvers[Math.floor(Math.random() * approvers.length)],
      status: "Approved",
      approvedAt: "2 hours ago"
    };
  };

  // Generate calendar posts based on frequency
  const generateCalendarPosts = () => {
    const posts = [];
    const startDate = new Date(viewingMonth.getFullYear(), viewingMonth.getMonth(), 1);
    const endDate = new Date(viewingMonth.getFullYear(), viewingMonth.getMonth() + 1, 0);
    
    let imageIndex = 0;
    let captionIndex = 0;
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const dayOfWeek = date.getDay();
      let shouldPost = false;
      
      // Determine if we should post on this date based on frequency
      switch (frequency) {
        case "Once a day":
          shouldPost = true;
          break;
        case "Twice a day":
          shouldPost = true;
          break;
        case "Every other day":
          shouldPost = date.getDate() % 2 === 1;
          break;
        case "3 times a week":
          shouldPost = dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5; // Mon, Wed, Fri
          break;
        case "Once a week":
          shouldPost = dayOfWeek === 1; // Monday
          break;
        case "Twice a week":
          shouldPost = dayOfWeek === 1 || dayOfWeek === 4; // Monday, Thursday
          break;
        default:
          shouldPost = Math.random() > 0.7; // Random fallback
      }
      
      if (shouldPost) {
        const postCount = frequency === "Twice a day" ? 2 : 1;
        for (let i = 0; i < postCount; i++) {
          const approval = getApprovalInfo();
          const postTime = i === 0 ? "09:00 AM" : "06:00 PM";
          const timeSlot = i === 0 ? "Morning" : "Evening";
          
          posts.push({
            id: `${date.getTime()}-${i}`,
            date: new Date(date),
            image: sampleImages[imageIndex % sampleImages.length],
            platform: platforms[Math.floor(Math.random() * platforms.length)] || "Instagram",
            focusArea: focusAreas[Math.floor(Math.random() * focusAreas.length)] || "Brand awareness",
            timeSlot: timeSlot,
            postTime: postTime,
            caption: sampleCaptions[captionIndex % sampleCaptions.length],
            approval: approval
          });
          imageIndex++;
          captionIndex++;
        }
      }
    }
    
    return posts;
  };

  const posts = generateCalendarPosts();
  
  // Calendar grid generation
  const generateCalendarGrid = () => {
    const year = viewingMonth.getFullYear();
    const month = viewingMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay()); // Start from Sunday
    
    const calendar = [];
    const today = new Date();
    
    for (let week = 0; week < 6; week++) {
      const weekDays = [];
      for (let day = 0; day < 7; day++) {
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + (week * 7) + day);
        
        const isCurrentMonth = date.getMonth() === month;
        const isToday = date.toDateString() === today.toDateString();
        const dayPosts = posts.filter(post => 
          post.date.toDateString() === date.toDateString()
        );
        
        weekDays.push({
          date,
          isCurrentMonth,
          isToday,
          posts: dayPosts
        });
      }
      calendar.push(weekDays);
      
      // Stop if we've covered the whole month
      if (weekDays[6].date > lastDay) break;
    }
    
    return calendar;
  };

  const calendarGrid = generateCalendarGrid();
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    setViewingMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const handleImageClick = (post: any) => {
    setSelectedPost(post);
    setEditText("");
  };

  const closeModal = () => {
    setSelectedPost(null);
    setEditText("");
  };

  const handleEdit = () => {
    if (!editText.trim()) {
      alert("Please enter your edit request");
      return;
    }
    
    // Here you would normally send the edit request to your backend
    console.log("Edit request for post:", selectedPost.id, "Edit:", editText);
    alert("Edit request submitted successfully!");
    closeModal();
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getPlatformIcon = (platform: string) => {
    const icons: { [key: string]: string } = {
      "Instagram": "📷",
      "Twitter": "🐦", 
      "LinkedIn": "💼",
      "Emailer": "📧",
      "Offline Hoarding": "🏢",
      "Facebook": "📘"
    };
    return icons[platform] || "📱";
  };

  return (
    <div className="min-h-screen bg-[#111] flex flex-col">
      {/* Header */}
      <div className="flex flex-row justify-between items-center w-full p-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/campaign-calendar")}
            className="text-white hover:text-lime-400 transition"
          >
            ← Back to Campaign Setup
          </button>
          <Image src="/logo.png" alt="Juicebox Logo" width={48} height={48} />
        </div>
        <div className="flex gap-4">
          <button
            className="px-6 py-2 rounded-lg bg-white/20 text-white font-semibold hover:bg-white/30 transition"
            onClick={() => router.push("/signin")}
          >
            Sign In
          </button>
          <button
            className="px-6 py-2 rounded-lg bg-lime-400 text-black font-semibold hover:bg-lime-300 transition"
            onClick={() => router.push("/signup")}
          >
            Sign Up
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white text-center mb-4">
            Approved Campaign Calendar
          </h1>
          <p className="text-lg text-gray-300 text-center mb-8">
            Your approved Panache Greens content schedule
          </p>

          {/* Campaign Summary */}
          {(platforms.length > 0 || frequency || focusAreas.length > 0) && (
            <div className="mb-8 p-6 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl">
              <h3 className="text-xl font-bold text-white mb-4 text-center">Campaign Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                {platforms.length > 0 && (
                  <div>
                    <div className="text-lime-400 font-semibold mb-1">Platforms</div>
                    <div className="text-gray-300 text-sm">{platforms.join(", ")}</div>
                  </div>
                )}
                {frequency && (
                  <div>
                    <div className="text-lime-400 font-semibold mb-1">Frequency</div>
                    <div className="text-gray-300 text-sm">{frequency}</div>
                  </div>
                )}
                {focusAreas.length > 0 && (
                  <div>
                    <div className="text-lime-400 font-semibold mb-1">Focus Areas</div>
                    <div className="text-gray-300 text-sm">{focusAreas.slice(0, 2).join(", ")}{focusAreas.length > 2 ? "..." : ""}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Calendar Navigation */}
          <div className="flex justify-between items-center mb-8">
            <button
              onClick={() => navigateMonth('prev')}
              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition border border-white/20"
            >
              ← Previous
            </button>
            <h2 className="text-2xl md:text-3xl font-bold text-white">
              {monthNames[viewingMonth.getMonth()]} {viewingMonth.getFullYear()}
            </h2>
            <button
              onClick={() => navigateMonth('next')}
              className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-xl transition border border-white/20"
            >
              Next →
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-2 mb-4">
              {dayNames.map(day => (
                <div key={day} className="text-center text-gray-400 font-semibold py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Days */}
            {calendarGrid.map((week, weekIndex) => (
              <div key={weekIndex} className="grid grid-cols-7 gap-2 mb-2">
                {week.map((day, dayIndex) => (
                  <div
                    key={dayIndex}
                    className={`min-h-[120px] p-2 rounded-lg border transition-all ${
                      day.isCurrentMonth
                        ? day.isToday
                          ? "bg-lime-400/20 border-lime-400 shadow-lg"
                          : "bg-white/5 border-white/10 hover:bg-white/10"
                        : "bg-gray-800/30 border-gray-700/50"
                    }`}
                  >
                    <div className={`text-sm font-semibold mb-2 ${
                      day.isCurrentMonth
                        ? day.isToday
                          ? "text-lime-400"
                          : "text-white"
                        : "text-gray-500"
                    }`}>
                      {day.date.getDate()}
                      {day.isToday && (
                        <span className="ml-1 text-xs bg-lime-400 text-black px-1 rounded">
                          Today
                        </span>
                      )}
                    </div>
                    
                    {/* Posts for this day */}
                    <div className="space-y-1">
                      {day.posts.map((post, postIndex) => (
                        <div
                          key={postIndex}
                          className="relative group cursor-pointer"
                          onClick={() => handleImageClick(post)}
                        >
                          <img
                            src={post.image}
                            alt="Campaign post"
                            className="w-full h-16 object-cover rounded border border-white/20 group-hover:border-lime-400/50 transition-all"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                            <div className="text-xs text-white text-center">
                              <div className="font-semibold">{post.platform}</div>
                              <div className="text-lime-400">{post.timeSlot}</div>
                              <div className="text-green-400 text-xs">✅ Approved</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <button
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-semibold px-8 py-3 rounded-xl shadow-lg transition"
              onClick={() => {
                alert("Campaign is now live and scheduled for posting!");
              }}
            >
              Go Live
            </button>
            <button
              className="bg-white/10 hover:bg-white/20 text-white font-semibold px-8 py-3 rounded-xl transition border border-white/20 hover:border-white/40"
              onClick={() => router.push("/campaign-calendar")}
            >
              Back to Review
            </button>
          </div>

        </div>
      </div>

      {/* Modal for Post Details */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-[#111] border border-white/20 rounded-2xl p-6 max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">Approved Post Details</h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition text-2xl"
              >
                ×
              </button>
            </div>

            {/* Landscape Layout: Image on Left, Details on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Left Side - Post Image */}
              <div className="flex flex-col">
                <img
                  src={selectedPost.image}
                  alt="Campaign post"
                  className="w-full h-80 lg:h-96 object-cover rounded-xl border border-white/20"
                />
                
                {/* Edit Section moved under image */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10 mt-4">
                  <h4 className="text-lg font-semibold text-white mb-3">🎨 Request Edit</h4>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      placeholder="Describe what you'd like to edit in this image..."
                      className="flex-1 bg-[#222] text-white rounded-lg px-4 py-3 outline-none border border-white/20 focus:border-lime-400 placeholder:text-gray-400"
                    />
                    <button
                      onClick={handleEdit}
                      className="bg-lime-400 hover:bg-lime-300 text-black font-semibold px-6 py-3 rounded-lg transition"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">
                    Describe changes like &quot;Make the background blue&quot; or &quot;Add company logo&quot; 
                  </p>
                </div>
              </div>

              {/* Right Side - Post Information */}
              <div className="space-y-4">
                {/* Publishing Details */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-3">📅 Publishing Schedule</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-lime-400 font-semibold">Date:</span>
                      <div className="text-gray-300">{formatDate(selectedPost.date)}</div>
                    </div>
                    <div>
                      <span className="text-lime-400 font-semibold">Time:</span>
                      <div className="text-gray-300">{selectedPost.postTime} ({selectedPost.timeSlot})</div>
                    </div>
                    <div>
                      <span className="text-lime-400 font-semibold">Platform:</span>
                      <div className="text-gray-300">{getPlatformIcon(selectedPost.platform)} {selectedPost.platform}</div>
                    </div>
                    <div>
                      <span className="text-lime-400 font-semibold">Focus Area:</span>
                      <div className="text-gray-300">{selectedPost.focusArea}</div>
                    </div>
                  </div>
                </div>

                {/* Caption */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-3">✏️ Caption</h4>
                  <p className="text-gray-300 leading-relaxed">{selectedPost.caption}</p>
                </div>

                {/* Approval Status */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                  <h4 className="text-lg font-semibold text-white mb-3">✅ Approval Status</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                        {selectedPost.approval.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-300">
                      <span className="text-lime-400 font-semibold">Approved by:</span> {selectedPost.approval.approver}
                    </div>
                    <div className="text-sm text-gray-300">
                      <span className="text-lime-400 font-semibold">Approved:</span> {selectedPost.approval.approvedAt}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={closeModal}
                className="bg-white/10 hover:bg-white/20 text-white font-semibold px-6 py-3 rounded-lg transition border border-white/20"
              >
                Close
              </button>
              <button
                onClick={() => {
                  // Could handle post modification
                  console.log("Modify post:", selectedPost.id);
                }}
                className="bg-gradient-to-r from-lime-400 to-green-500 hover:from-lime-300 hover:to-green-400 text-black font-semibold px-6 py-3 rounded-lg transition"
              >
                Modify Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="w-full flex flex-col items-center justify-center py-8 text-gray-400 text-sm">
        <div className="flex items-center gap-2">
          <span>Built in India</span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </footer>
    </div>
  );
}

// Loading component for Suspense fallback
function ApprovedCampaignCalendarLoading() {
  return (
    <div className="min-h-screen bg-[#111] flex flex-col items-center justify-center">
      <div className="text-white text-xl">Loading approved campaign calendar...</div>
      <div className="mt-4 animate-spin rounded-full h-8 w-8 border-b-2 border-lime-400"></div>
    </div>
  );
}

// Main component with Suspense boundary
export default function ApprovedCampaignCalendarPage() {
  return (
    <Suspense fallback={<ApprovedCampaignCalendarLoading />}>
      <ApprovedCampaignCalendarContent />
    </Suspense>
  );
}
