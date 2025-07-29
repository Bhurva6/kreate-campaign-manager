"use client";
import { useState } from 'react';

interface PostingManagerProps {
  posts: any[];
  onPostingUpdate: (postId: string, status: 'success' | 'error', message?: string) => void;
}

export default function PostingManager({ posts, onPostingUpdate }: PostingManagerProps) {
  const [isPosting, setIsPosting] = useState(false);
  const [postingProgress, setPostingProgress] = useState<{ [key: string]: string }>({});

  const postContent = async (post: any) => {
    if (!post.account) {
      onPostingUpdate(post.id, 'error', 'No connected account for this platform');
      return;
    }

    setPostingProgress(prev => ({ ...prev, [post.id]: 'posting' }));

    try {
      const response = await fetch('/api/social-post', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: 'demo-user',
          platform: post.platform.toLowerCase(),
          accountId: post.account.id,
          content: {
            text: post.caption,
            imageUrl: post.image
          }
        })
      });

      if (response.ok) {
        const result = await response.json();
        setPostingProgress(prev => ({ ...prev, [post.id]: 'success' }));
        onPostingUpdate(post.id, 'success', `Posted successfully to @${result.account}`);
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to post');
      }
    } catch (error) {
      setPostingProgress(prev => ({ ...prev, [post.id]: 'error' }));
      onPostingUpdate(post.id, 'error', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const postAllScheduled = async () => {
    setIsPosting(true);
    
    // Filter posts for today that haven't been posted yet
    const today = new Date();
    const todaysPosts = posts.filter(post => {
      const postDate = new Date(post.date);
      return postDate.toDateString() === today.toDateString() && 
             !postingProgress[post.id] && 
             post.account; // Only posts with connected accounts
    });

    for (const post of todaysPosts) {
      await postContent(post);
      // Small delay between posts to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    setIsPosting(false);
  };

  const getPostingStatus = (postId: string) => {
    const status = postingProgress[postId];
    switch (status) {
      case 'posting':
        return { color: 'text-yellow-400', icon: '⏳', text: 'Posting...' };
      case 'success':
        return { color: 'text-green-400', icon: '✅', text: 'Posted' };
      case 'error':
        return { color: 'text-red-400', icon: '❌', text: 'Failed' };
      default:
        return { color: 'text-gray-400', icon: '⏰', text: 'Scheduled' };
    }
  };

  const hasScheduledPosts = posts.some(post => {
    const today = new Date();
    const postDate = new Date(post.date);
    return postDate.toDateString() === today.toDateString() && 
           !postingProgress[post.id] && 
           post.account;
  });

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 mb-8">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        📡 Posting Manager
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Live Posting Controls */}
        <div>
          <h4 className="text-lg font-semibold text-lime-400 mb-3">Live Posting</h4>
          {hasScheduledPosts ? (
            <div className="space-y-3">
              <p className="text-gray-300 text-sm">
                Ready to post today's scheduled content to your connected accounts.
              </p>
              <button
                onClick={postAllScheduled}
                disabled={isPosting}
                className={`w-full py-3 px-4 rounded-xl font-semibold transition ${
                  isPosting
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white'
                }`}
              >
                {isPosting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Posting in progress...
                  </div>
                ) : (
                  'Post All Scheduled Content'
                )}
              </button>
            </div>
          ) : (
            <div className="text-gray-400 text-sm">
              No scheduled posts for today, or all accounts need reconnection.
            </div>
          )}
        </div>

        {/* Posting Status */}
        <div>
          <h4 className="text-lg font-semibold text-lime-400 mb-3">Recent Activity</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {Object.keys(postingProgress).length > 0 ? (
              Object.entries(postingProgress).map(([postId, status]) => {
                const post = posts.find(p => p.id === postId);
                const statusInfo = getPostingStatus(postId);
                
                return (
                  <div key={postId} className="flex items-center gap-2 text-sm">
                    <span className={statusInfo.color}>{statusInfo.icon}</span>
                    <span className="text-gray-300">
                      {post?.platform} - {statusInfo.text}
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="text-gray-400 text-sm">
                No posting activity yet
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
