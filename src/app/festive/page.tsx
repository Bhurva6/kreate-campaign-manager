'use client';

import { useState } from 'react';
import Link from "next/link";
import { useAuth } from '@/lib/auth';
import { useCredits } from '@/lib/credits';

export default function PricingPage() {
  const { user } = useAuth();
  const { imageGenerationsUsed, imageGenerationsLimit, imageEditsUsed, imageEditsLimit, isUnlimitedUser } = useCredits();

  const dropdownUser = user ? {
    name: user.displayName || user.email || '',
    email: user.email || '',
    image: user.photoURL || '/google.svg',
  } : null;

  // Form states
  const [brandName, setBrandName] = useState('');
  const [industry, setIndustry] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [references, setReferences] = useState<File[]>([]);
  const [festivals, setFestivals] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [industrySearch, setIndustrySearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<{festival: string, imageUrl: string}[]>([]);
  const [selectedImage, setSelectedImage] = useState<{festival: string, imageUrl: string} | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  const festivalOptions = [
    'Diwali', 'Holi', 'Eid', 'Christmas', 'New Year', 'Halloween', 'Thanksgiving', 'Easter',
    'Pongal', 'Baisakhi', 'Durga Puja', 'Ganesh Chaturthi', 'Raksha Bandhan',
    'Valentine\'s Day', 'Mother\'s Day', 'Father\'s Day', 'Independence Day', 'Republic Day',
    'Makar Sankranti', 'Maha Shivaratri', 'Ram Navami', 'Janmashtami', 'Navratri',
    'Onam', 'Vijayadashami', 'Karva Chauth', 'Tej', 'Guru Nanak Jayanti',
    'Mahavir Jayanti', 'Buddha Purnima', 'Good Friday', 'Boxing Day',
    'St. Patrick\'s Day', 'Cinco de Mayo', 'Bastille Day', 'Oktoberfest',
    'Hanukkah', 'Kwanzaa', 'Tet Nguyen Dan', 'Diwali (Overseas)', 'Holi (Overseas)'
  ];

  const industryOptions = [
    'Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Education',
    'Food & Beverage', 'Automotive', 'Real Estate', 'Entertainment', 'Agriculture',
    'Construction', 'Energy', 'Telecommunications', 'Transportation', 'Media',
    'Pharmaceuticals', 'Consulting', 'Legal Services', 'Hospitality', 'Other'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!industry) {
      setErrorMessage('Please select an industry');
      return;
    }
    if (festivals.length === 0) {
      setErrorMessage('Please select at least one festival');
      return;
    }
    if (!logo) {
      setErrorMessage('Please upload a logo');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setGeneratedImages([]);

    try {
      const results = [];
      for (const festival of festivals) {
        // Generate prompt using Perplexity
        const prompt = await generateFestivePrompt(brandName, industry, festival);
        
        // Generate image using your API
        const imageUrl = await generateFestiveImage(prompt, logo, references, festival);
        
        results.push({ festival, imageUrl });
      }
      setGeneratedImages(results);
    } catch (error) {
      console.error('Error generating images:', error);
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateFestivePrompt = async (brand: string, industry: string, festival: string): Promise<string> => {
    // Use Perplexity API to generate creative prompt
    const response = await fetch('/api/generate-prompt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        brand,
        industry,
        festival,
      }),
    });

    if (!response.ok) {
      let errorMessage = `Failed to generate prompt: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`;
        }
      } catch (e) {
        // Ignore if can't parse error
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.prompt;
  };

  const generateFestiveImage = async (prompt: string, logo: File, references: File[], festival: string): Promise<string> => {
    const formData = new FormData();
    formData.append('prompt', prompt);
    formData.append('logo', logo);
    formData.append('festival', festival);
    references.forEach((ref, index) => {
      formData.append(`reference_${index}`, ref);
    });

    const response = await fetch('/api/generate-festive-image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let errorMessage = `Failed to generate image: ${response.status} ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.message) {
          errorMessage += ` - ${errorData.message}`;
        }
      } catch (e) {
        // Ignore if can't parse error
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.imageUrl;
  };

  const downloadImage = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert(error instanceof Error ? error.message : 'Failed to download image. Please try again.');
    }
  };

  return (
    <>
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
        className="top-controls"
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
        }}
        className="credit-usage"
        >
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
          className="my-creations-btn"
        >
          My Creations
        </a>
        {/* Account Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }} className="account-dropdown">
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
        GoLoco
      </Link>
      {/* Festive Campaign Form */}
      <div className="min-h-screen bg-black flex items-center justify-center p-4 pt-24">
        <div className="bg-transparent rounded-lg p-8 max-w-6xl w-full">
          <h1 className="text-3xl font-bold mb-6 text-center text-white">Festive Campaign</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Top Row - Brand Name, Logo, Reference */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Brand Name */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Brand Name</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className="w-full p-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400"
                  placeholder="Enter your brand name"
                  required
                />
              </div>

              {/* Upload Logo */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Upload Logo</label>
                <input
                  type="file"
                  accept=".png,.jpg,.jpeg,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setLogo(file);
                    if (file) {
                      setLogoUrl(URL.createObjectURL(file));
                    } else {
                      setLogoUrl('');
                    }
                  }}
                  className="w-full p-3 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white file:bg-blue-600 file:text-white file:border-none file:rounded file:px-3 file:py-1 file:mr-3"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">Accepted formats: PNG, JPG, PDF (max 1 file)</p>
                {logoUrl && (
                  <div className="mt-4">
                    <p className="text-sm text-white mb-2">Logo Preview:</p>
                    <img
                      src={logoUrl}
                      alt="Logo Preview"
                      className="w-full h-auto rounded-lg border-2 border-blue-600"
                    />
                  </div>
                )}
              </div>            
            </div>

            {/* Bottom Row - Industry and Festivals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Industry */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Industry</label>
                <input
                  type="text"
                  placeholder="Search industries..."
                  value={industrySearch}
                  onChange={(e) => setIndustrySearch(e.target.value)}
                  className="w-full p-3 border border-gray-600 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400"
                />
                <div className="max-h-40 overflow-y-auto border border-gray-600 rounded-lg p-3 bg-gray-800">
                  {industryOptions
                    .filter(ind => ind.toLowerCase().includes(industrySearch.toLowerCase()))
                    .map(ind => (
                      <label key={ind} className="flex items-center mb-2 cursor-pointer hover:bg-gray-700 p-1 rounded">
                        <input
                          type="radio"
                          name="industry"
                          value={ind}
                          checked={industry === ind}
                          onChange={(e) => setIndustry(e.target.value)}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500 bg-gray-700"
                        />
                        <span className="text-sm text-white">{ind}</span>
                      </label>
                    ))}
                </div>
                {industry && (
                  <p className="text-xs text-gray-400 mt-2">Selected: {industry}</p>
                )}
              </div>

              {/* Festivals */}
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Festivals</label>
                <input
                  type="text"
                  placeholder="Search festivals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full p-3 border border-gray-600 rounded-lg mb-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-800 text-white placeholder-gray-400"
                />
                <div className="max-h-40 overflow-y-auto border border-gray-600 rounded-lg p-3 bg-gray-800">
                  {festivalOptions
                    .filter(festival => festival.toLowerCase().includes(search.toLowerCase()))
                    .map(festival => (
                      <label key={festival} className="flex items-center mb-2 cursor-pointer hover:bg-gray-700 p-1 rounded">
                        <input
                          type="checkbox"
                          checked={festivals.includes(festival)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFestivals([...festivals, festival]);
                            } else {
                              setFestivals(festivals.filter(f => f !== festival));
                            }
                          }}
                          className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500 rounded bg-gray-700"
                        />
                        <span className="text-sm text-white">{festival}</span>
                      </label>
                    ))}
                </div>
                {festivals.length > 0 && (
                  <p className="text-xs text-gray-400 mt-2">Selected: {festivals.join(', ')}</p>
                )}
              </div>
            </div>

            {/* Submit Button - Centered */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Generating...' : 'Create Festive Campaign'}
              </button>
            </div>
          </form>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="mt-6 p-4 bg-red-600 text-white rounded-lg text-center">
              <p className="font-semibold">Error:</p>
              <p>{errorMessage}</p>
            </div>
          )}

          {/* Generated Images Display */}
          {generatedImages.length > 0 && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold mb-6 text-center text-white">Generated Festive Images</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedImages.map((item, index) => (
                  <div key={index} className="relative bg-gray-800 rounded-lg overflow-hidden group">
                    <img
                      src={item.imageUrl}
                      alt={`Festive image for ${item.festival}`}
                      className="w-full h-64 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setSelectedImage(item)}
                    />
                    {/* Logo Overlay */}
                    {logoUrl && (
                      <img
                        src={logoUrl}
                        alt="Logo overlay"
                        className="absolute top-2 right-16 w-12 h-12 object-contain opacity-80"
                      />
                    )}
                    {/* Download Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        downloadImage(item.imageUrl, `festive-${item.festival.replace(/\s+/g, '-').toLowerCase()}.png`);
                      }}
                      className="absolute top-2 right-2 bg-black bg-opacity-50 hover:bg-opacity-70 text-white rounded-full w-10 h-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Download image"
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7,10 12,15 17,10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                    </button>
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2">
                      <p className="text-sm font-medium">{item.festival}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="mt-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <p className="text-white mt-2">Generating your festive images. This might take some time, please do not refresh.</p>
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-screen p-4" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage.imageUrl}
              alt={`Festive image for ${selectedImage.festival}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            {/* Logo Overlay */}
            {logoUrl && (
              <img
                src={logoUrl}
                alt="Logo overlay"
                className="absolute top-4 right-4 w-16 h-16 object-contain opacity-80"
              />
            )}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition-colors"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            {/* Download Button in Modal */}
            <button
              onClick={() => downloadImage(selectedImage.imageUrl, `festive-${selectedImage.festival.replace(/\s+/g, '-').toLowerCase()}.png`)}
              className="absolute top-2 right-14 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition-colors"
              title="Download image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7,10 12,15 17,10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
            </button>
            <div className="absolute bottom-2 left-2 bg-black bg-opacity-70 text-white px-3 py-1 rounded">
              <p className="text-sm font-medium">{selectedImage.festival}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

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