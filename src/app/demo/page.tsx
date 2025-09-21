'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../lib/auth';
import Link from 'next/link';
import { useCreditManagement } from '@/hooks/useCreditManagement';

function ToggleButtons({ onToggle }: { onToggle?: (value: string) => void }) {
  const [selected, setSelected] = useState('generate');
  React.useEffect(() => {
    if (onToggle) onToggle(selected);
  }, [selected, onToggle]);
  return (
    <div style={{ position: 'relative', display: 'flex', gap: '0.5rem', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
      <button
        type="button"
        onClick={() => setSelected('generate')}
        style={{
          backgroundColor: selected === 'generate' ? '#191A1F' : 'transparent',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '0.5rem 1.2rem',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {selected === 'generate' && (
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '-8px',
            margin: '0 auto',
            width: '80%',
            height: '6px',
            background: '#23272F',
            borderRadius: '10px',
          }} />
        )}
        Generate
      </button>
      <button
        type="button"
        onClick={() => setSelected('reimagine')}
        style={{
          backgroundColor: selected === 'reimagine' ? '#191A1F' : 'transparent',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          padding: '0.5rem 1.2rem',
          cursor: 'pointer',
          position: 'relative',
        }}
      >
        {selected === 'reimagine' && (
          <div style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: '-8px',
            margin: '0 auto',
            width: '80%',
            height: '6px',
            background: '#23272F',
            borderRadius: '10px',
          }} />
        )}
        Reimagine
      </button>
    </div>
  );
}

export default function DemoPage() {
  const { user } = useAuth(); // Get the signed-in user
  const { imageGenerationsUsed, imageGenerationsLimit, imageEditsUsed, imageEditsLimit, isUnlimitedUser } = useCreditManagement();
  const [toggleState, setToggleState] = useState('generate');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [moveBox, setMoveBox] = useState(false);
  const [imgBottom, setImgBottom] = useState<number | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [showTitle, setShowTitle] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(file => {
        const reader = new FileReader();
        reader.onload = function (ev) {
          setUploadedImages(prev => [...prev, ev.target?.result as string]);
          setMoveBox(true);
          setShowTitle(false);
        };
        reader.readAsDataURL(file);
      });
    }
  };
  const handleSend = async () => {
    setMoveBox(true);
    setShowTitle(false);
    setLoading(true);
    setGeneratedImage(null); // Clear previous image so loader is shown immediately
    try {
      if (toggleState === 'generate' && prompt.trim()) {
        const res = await fetch('/api/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, sampleCount: 1, aspectRatio: '1:1' }),
        });
        const data = await res.json();
        if (res.ok && data.images && data.images.length > 0) {
          const url = data.images[0].r2?.publicUrl || data.images[0].url;
          setGeneratedImage(url);
        }
      } else if (toggleState === 'reimagine' && uploadedImages.length > 0 && prompt.trim()) {
        const res = await fetch('/api/edit-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, input_image: uploadedImages[0] }),
        });
        const data = await res.json();
        if (res.ok && (data.image || (data.result && data.result.sample))) {
          const url = data.image || (data.result && data.result.sample);
          setGeneratedImage(url);
        }
      }
    } catch (err) {
      // Optionally handle error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (imgRef.current) {
      const rect = imgRef.current.getBoundingClientRect();
      setImgBottom(rect.bottom);
    }
  }, [uploadedImages]);

  // Ensure input box stays below when any image (generated or edited) is shown
  useEffect(() => {
    if (generatedImage) {
      setMoveBox(true);
    }
  }, [generatedImage]);

  // Map Firebase user to expected props
  const dropdownUser = user
    ? {
        name: user.displayName || user.email || '',
        email: user.email || '',
        image: user.photoURL || '/google.svg',
      }
    : null;

  useEffect(() => {
    // If the user has reached the free limit, show pricing screen
    if (!isUnlimitedUser && (
      imageGenerationsUsed >= imageGenerationsLimit || imageEditsUsed >= imageEditsLimit
    )) {
      window.location.href = '/pricing';
    }
  }, [imageGenerationsUsed, imageGenerationsLimit, imageEditsUsed, imageEditsLimit, isUnlimitedUser]);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#191A1F',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
        fontFamily: 'Aventa, sans-serif',
      }}
    >
      {/* Top-right controls container */}
      <div
        style={{
          position: 'absolute',
          top: 32,
          right: 32,
          zIndex: 40,
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          gap: '24px',
          width: 'auto',
        }}
      >
        {/* Credit usage display */}
        <div style={{
          background: '#23272F',
          color: 'white',
          borderRadius: '16px',
          padding: '0.6rem 1.5rem',
          fontWeight: 'bold',
          fontSize: '1.1rem',
          letterSpacing: '1px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          minWidth: '180px',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {isUnlimitedUser
            ? 'Generations: Unlimited | Edits: Unlimited'
            : `Generations: ${imageGenerationsUsed}/${imageGenerationsLimit} | Edits: ${imageEditsUsed}/${imageEditsLimit}`}
        </div>
        {/* My Creations Button */}
        <a
          href="/my-creations"
          style={{
            border: '2px solid white',
            borderRadius: '100px',
            color: 'white',
            background: 'transparent',
            fontSize: '1.2rem',
            fontWeight: 'bold',
            textDecoration: 'none',
            letterSpacing: '1px',
            cursor: 'pointer',
            padding: '0.5rem 2rem',
            minWidth: '120px',
            textAlign: 'center',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          My Creations
        </a>
        {/* Account Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AccountDropdown user={dropdownUser} />
        </div>
      </div>
      <Link href="/" style={{
          position: 'absolute',
          top: 32,
          left: 32,
          color: 'white',
          textDecoration: 'none',
          fontSize: '2rem',
          fontWeight: 'bold',
          letterSpacing: '2px',
          zIndex: 10,
        }}>
        goloco
      </Link>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <img
          ref={imgRef}
          src="/bg1.jpeg"
          alt="Centered"
          style={{
            borderRadius: '50px',
            maxWidth: '80vw',
            maxHeight: '80vh',
            display: 'block',
            position: 'relative',
          }}
        />
        {/* Go Pro button on top right of bg1.jpeg */}
        <div
          style={{
            position: 'absolute',
            top: '32px',
            right: 30, // Align Go Pro button flush to the right edge
            background: '#0E1C39',
            color: 'white',
            padding: '0.6rem 2rem',
            borderRadius: '24px',
            fontWeight: 'bold',
            fontSize: '1.2rem',
            letterSpacing: '1px',
            zIndex: 50,
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            cursor: 'pointer',
          }}
          onClick={() => { window.location.href = '/pricing'; }}
        >
          Go pro 
        </div>
        {uploadedImages.length > 0 && (
          <div
            style={{
              position: 'absolute',
              top: '3%',
              left: '50%',
              transform: 'translate(-50%, 0)',
              zIndex: 25,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              width: '90%',
              height: '60%',
              gap: '24px',
              flexWrap: 'nowrap',
              overflowX: 'auto',
            }}
          >
            {uploadedImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Uploaded ${idx + 1}`}
                style={{
                  borderRadius: '10px',
                  maxWidth: '300px',
                  maxHeight: '100%',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
                  objectFit: 'cover',
                }}
              />
            ))}
          </div>
        )}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: moveBox && imgBottom ? `calc(${imgRef.current?.offsetHeight}px - 225px)` : '50%',
            transform: moveBox ? 'translate(-50%, 0)' : 'translate(-50%, -50%)',
            width: moveBox ? '1150px' : '600px',
            height: '200px',
            zIndex: 30,
            transition: 'top 0.6s cubic-bezier(0.4,0,0.2,1), transform 0.6s cubic-bezier(0.4,0,0.2,1), width 0.6s cubic-bezier(0.4,0,0.2,1)',
            padding: moveBox ? '32px 32px 32px 32px' : '0',
          }}
        >
          {showTitle && (
            <div style={{
              position: 'absolute',
              top: '-128px',
              left: '50%', // Center horizontally
              transform: 'translateX(-50%)', // Center horizontally
              width: 'auto', // Only as wide as needed
              textAlign: 'center',
              color: 'white',
              fontSize: '3rem',
              fontWeight: 'bold',
              letterSpacing: '1px',
              zIndex: 40,
              whiteSpace: 'nowrap',
            }}>
              Ready to see what you can do?
            </div>
          )}
          <textarea
            placeholder="What are you thinking of creating?"
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              backgroundColor: '#211D20',
              border: 'none',
              borderRadius: '20px',
              padding: '2rem 2rem',
              fontSize: '1rem',
              color: 'white',
              outline: 'none',
              width: '100%',
              height: '100%',
              boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
              resize: 'none',
              fontFamily: 'Aventa, sans-serif',
              zIndex: 20,
            }}
            className="custom-input"
          />
          <div
            style={{
              position: 'absolute',
              left: 20,
              bottom: 20,
              backgroundColor: '#23272F',
              borderRadius: '10px',
              padding: '0.1rem 0.5rem',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'center',
              minWidth: '120px',
              zIndex: 30,
              width: '250px',
              height: '60px',
              boxSizing: 'border-box',
              overflow: 'hidden',
            }}
          >
            <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              <ToggleButtons onToggle={setToggleState} />
            </div>
          </div>
          <div style={{ position: 'absolute', right: 20, bottom: 20, display: 'flex', gap: '0.5rem', zIndex: 30 }}>
            {toggleState === 'reimagine' && (
              <>
                <input
                  type="file"
                  accept="image/*"
                  id="image-upload"
                  style={{ display: 'none' }}
                  multiple
                  onChange={handleImageUpload}
                />
                <button
                  type="button"
                  onClick={() => { document.getElementById('image-upload')?.click(); setShowTitle(false); }}
                  style={{
                    width: '48px',
                    height: '48px',
                    backgroundColor: '#23272F',
                    border: 'none',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="3" width="18" height="18" rx="4" stroke="white" strokeWidth="2"/>
                    <path d="M7 17L10.5 13.5L13 16L17 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="8.5" cy="8.5" r="1.5" fill="white"/>
                  </svg>
                </button>
              </>
            )}
            <button
              type="button"
              onClick={handleSend}
              style={{
                width: '48px',
                height: '48px',
                backgroundColor: '#713995',
                border: 'none',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 12L20 12" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 6L20 12L14 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        {/* Show generated image if available, else show uploaded images */}
        {(generatedImage || uploadedImages.length > 0) && (
          <div
            style={{
              position: 'absolute',
              top: '3%',
              left: '50%',
              transform: 'translate(-50%, 0)',
              zIndex: 25,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'flex-start',
              width: '90%',
              height: '60%',
              gap: '24px',
              flexWrap: 'nowrap',
              overflowX: 'auto',
            }}
          >
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                <span style={{ color: '#fff', fontSize: '2rem', fontWeight: 'bold', marginRight: '12px' }}>Generating...</span>
                <div style={{ width: 32, height: 32, border: '4px solid #713995', borderTop: '4px solid #fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
              </div>
            )}
            {!loading && generatedImage && (
              <div style={{ position: 'relative', display: 'inline-block' }}>
                {/* Download and Remove Icons */}
                <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: '12px', zIndex: 100 }}>
                  {/* Download Icon */}
                  <button
                    type="button"
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = generatedImage;
                      link.download = 'image.png';
                      link.click();
                    }}
                    style={{
                      background: '#23272F',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M12 3v12m0 0l-4-4m4 4l4-4" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><rect x="4" y="17" width="16" height="4" rx="2" stroke="#fff" strokeWidth="2"/></svg>
                  </button>
                  {/* Remove Icon */}
                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedImage(null);
                      setMoveBox(false);
                      setPrompt("");
                    }}
                    style={{
                      background: '#F53057',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M6 6l12 12M6 18L18 6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
                <img
                  src={generatedImage}
                  alt="Generated"
                  style={{
                    borderRadius: '10px',
                    maxWidth: '300px',
                    maxHeight: '100%',
                    boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}
            {!loading && !generatedImage && uploadedImages.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`Uploaded ${idx + 1}`}
                style={{
                  borderRadius: '10px',
                  maxWidth: '300px',
                  maxHeight: '100%',
                  boxShadow: '0 2px 16px rgba(0,0,0,0.15)',
                  objectFit: 'cover',
                }}
              />
            ))}
          </div>
        )}
      </div>
      <style>{`
        .custom-input::placeholder {
          color: #b0b0b0;
          text-align: left;
        }
        @media (max-width: 600px) {
          body, html {
            width: 100vw;
            min-width: 0;
            overflow-x: hidden;
          }
          .custom-input {
            font-size: 0.95rem !important;
            padding: 1rem 1rem !important;
          }
          [style*='minHeight: 100vh'] {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 0 !important;
          }
          a[href='/'] {
            font-size: 1.3rem !important;
            left: 12px !important;
            top: 12px !important;
            padding: 0 !important;
          }
          a[href='/my-creations'] {
            right: 90px !important;
            top: 12px !important;
            padding: 0.4rem 1rem !important;
            font-size: 1rem !important;
          }
          .account-dropdown {
            right: 12px !important;
            top: 12px !important;
            padding: 0.4rem 1rem !important;
            font-size: 1rem !important;
          }
          [style*='maxWidth: 80vw'] {
            max-width: 98vw !important;
            max-height: 40vh !important;
            border-radius: 20px !important;
          }
          [style*='width: 1150px'], [style*='width: 600px'] {
            width: 98vw !important;
            min-width: 0 !important;
            left: 50% !important;
            transform: translate(-50%, 0) !important;
            padding: 0.5rem !important;
          }
          [style*='height: 200px'] {
            height: 120px !important;
          }
          [style*='fontSize: 3rem'] {
            font-size: 1.3rem !important;
            top: -60px !important;
          }
          [style*='padding: 0.6rem 2rem'] {
            padding: 0.4rem 1rem !important;
            font-size: 1rem !important;
          }
          [style*='borderRadius: 24px'] {
            border-radius: 16px !important;
          }
          [style*='width: 48px'], [style*='height: 48px'] {
            width: 38px !important;
            height: 38px !important;
          }
          [style*='width: 300px'] {
            max-width: 90vw !important;
          }
          [style*='gap: 24px'] {
            gap: 10px !important;
          }
          [style*='padding: 32px 32px 32px 32px'] {
            padding: 0.5rem !important;
          }
          [style*='top: 32px'] {
            top: 12px !important;
          }
          [style*='right: 30'] {
            right: 12px !important;
          }
          [style*='right: 32'] {
            right: 12px !important;
          }
          [style*='minWidth: 220'] {
            min-width: 160px !important;
          }
          [style*='padding: 1rem'] {
            padding: 0.5rem !important;
          }
          [style*='width: 250px'] {
            width: 120px !important;
          }
          [style*='height: 60px'] {
            height: 38px !important;
          }
        }
      `}</style>
    </div>
  );
}

// Update AccountDropdown to remove absolute positioning and use relative for dropdown
function AccountDropdown({ user }: { user: { name: string; email: string; image: string } | null }) {
  const [open, setOpen] = useState(false);
  if (!user) return null;
  return (
    <div style={{ position: 'relative', zIndex: 20 }}>
      <div
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '100px',
          padding: '0.5rem 2rem',
          fontSize: '1.2rem',
          fontWeight: 'bold',
          letterSpacing: '1px',
          border: '2px solid transparent',
          height: 'auto',
          minHeight: 'unset',
        }}
      >
        {/* My Account Icon */}
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ marginRight: 8 }}>
          <circle cx="12" cy="8" r="4" stroke="#fff" strokeWidth="2" />
          <path d="M4 20c0-3.333 2.667-6 8-6s8 2.667 8 6" stroke="#fff" strokeWidth="2" />
        </svg>
        <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem', letterSpacing: '1px' }}>{user.name}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '110%', right: 0, background: '#23272F', borderRadius: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', minWidth: 220, padding: '1rem', color: 'white' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <img src={user.image || '/google.svg'} alt="Google" style={{ width: 32, height: 32, borderRadius: '50%' }} />
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '1rem' }}>{user.name}</div>
              <div style={{ fontSize: '0.9rem', opacity: 0.7 }}>{user.email}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => { /* Add your logout logic here */ }}
            style={{ width: '100%', background: '#F53057', color: 'white', border: 'none', borderRadius: '8px', padding: '0.6rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}