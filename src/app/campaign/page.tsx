'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth';
import AuthModal from '../../components/AuthModal';
import UserDropdown from '../../components/UserDropdown';
import { useState } from 'react';
import { useCampaignStore } from '../../store/campaignStore';

export default function CampaignPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const setCampaignData = useCampaignStore(state => state.setCampaignData);
  const [companyName, setCompanyName] = useState('');
  const [showIndustry, setShowIndustry] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [showCampaignType, setShowCampaignType] = useState(false);
  const [selectedCampaignType, setSelectedCampaignType] = useState('');
  const [showDemographic, setShowDemographic] = useState(false);
  const [selectedDemographic, setSelectedDemographic] = useState('');
  const [showAge, setShowAge] = useState(false);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [showSocialMedia, setShowSocialMedia] = useState(false);
  const [selectedSocialMedia, setSelectedSocialMedia] = useState('');
  const [numPosts, setNumPosts] = useState(1);
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [campaignDescription, setCampaignDescription] = useState('');

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Retail',
    'Manufacturing',
    'Education',
    'Energy',
    'Transportation',
    'Real Estate',
    'Entertainment',
    'Agriculture',
    'Construction',
    'Telecommunications',
    'Pharmaceuticals',
    'Automotive',
    'Food & Beverage',
    'Media & Publishing',
    'Consulting',
    'Legal Services',
    'Non-Profit'
  ];

  const campaignTypes = [
    'Festive',
    'Seasonal',
    'Product Launch',
    'Brand Awareness',
    'Promotional',
    'Event-based',
    'Rebranding',
    'Customer Acquisition',
    'Retention',
    'Educational'
  ];

  const demographics = [
    'All',
    'Male',
    'Female',
    'Urban',
    'Rural',
    'High Income',
    'Middle Income',
    'Low Income'
  ];

  const ageGroups = [
    '18-24',
    '25-34',
    '35-44',
    '45-54',
    '55-64',
    '65+'
  ];

  const socialMediaOptions = [
    'Instagram Post (1:1)',
    'Instagram Story (9:16)',
    'Instagram Reel (9:16)',
    'Facebook Post (1:1)',
    'Twitter Post (16:9)',
    'LinkedIn Post (1.91:1)',
    'TikTok Video (9:16)',
    'YouTube Thumbnail (16:9)'
  ];

  const getAspectRatio = (media: string) => {
    if (media.includes('1:1')) return '1:1';
    if (media.includes('9:16')) return '9:16';
    if (media.includes('16:9')) return '16:9';
    if (media.includes('1.91:1')) return '16:9'; // Approximate to 16:9
    return '1:1'; // default
  };

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navbar */}
      <div className="flex flex-row justify-between items-center w-full p-3 sm:p-4 md:p-6 bg-black z-[999999]">
        <Link href="/">
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white cursor-pointer">
            GoLoco
          </div>
        </Link>
      </div>

      {/* Company Name Input */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 pt-20">
        {!showIndustry ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center">Enter Company Name</h2>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter your company name"
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />
            <button
              onClick={() => setShowIndustry(true)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Next
            </button>
          </>
        ) : !showCampaignType ? (
          <div className="w-full max-w-md flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-center">Select Industry</h2>
            <select
              value={selectedIndustry}
              onChange={(e) => setSelectedIndustry(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Industry</option>
              {industries.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
            <div className="flex space-x-4 mt-12">
              <button
                onClick={() => {
                  setShowIndustry(false);
                  setSelectedIndustry('');
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Back
              </button>
              <button
                onClick={() => setShowCampaignType(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Next
              </button>
            </div>
          </div>
        ) : !showDemographic ? (
          <div className="w-full max-w-md flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-center">Select Campaign Type</h2>
            <select
              value={selectedCampaignType}
              onChange={(e) => setSelectedCampaignType(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Campaign Type</option>
              {campaignTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <div className="flex space-x-4 mt-12">
              <button
                onClick={() => {
                  setShowCampaignType(false);
                  setSelectedCampaignType('');
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Back
              </button>
              <button
                onClick={() => {
                  setShowDemographic(true);
                  setShowAge(true);
                }}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Next
              </button>
            </div>
          </div>
        ) : !showSocialMedia ? (
          <div className="w-full max-w-2xl flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-center">Select Demographics and Age Groups</h2>
            <div className="flex space-x-4 w-full">
              <select
                value={selectedDemographic}
                onChange={(e) => setSelectedDemographic(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Demographic</option>
                {demographics.map((demo) => (
                  <option key={demo} value={demo}>
                    {demo}
                  </option>
                ))}
              </select>
              <div className="flex-1 relative">
                <button
                  onClick={() => setShowAge(!showAge)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
                >
                  Select Age Groups ({selectedAges.length} selected)
                </button>
                {showAge && (
                  <div className="absolute top-full mt-1 w-full bg-gray-800 text-white border border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {ageGroups.map((age) => (
                      <label key={age} className="flex items-center px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedAges.includes(age)}
                          onChange={() => {
                            setSelectedAges((prev) =>
                              prev.includes(age)
                                ? prev.filter((a) => a !== age)
                                : [...prev, age]
                            );
                          }}
                          className="mr-2"
                        />
                        {age}
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-4 mt-54">
              <button
                onClick={() => {
                  setShowDemographic(false);
                  setShowAge(false);
                  setSelectedDemographic('');
                  setSelectedAges([]);
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Back
              </button>
              <button
                onClick={() => setShowSocialMedia(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Next
              </button>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-2xl flex flex-col items-center">
            <h2 className="text-2xl font-bold mb-4 text-center">Select Social Media Type and Number of Posts</h2>
            <div className="flex space-x-4 w-full">
              <select
                value={selectedSocialMedia}
                onChange={(e) => setSelectedSocialMedia(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Social Media Type</option>
                {socialMediaOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <input
                type="number"
                min="1"
                max="20"
                value={numPosts}
                onChange={(e) => setNumPosts(Number(e.target.value))}
                placeholder="Number of posts"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex space-x-4 mt-12">
              <button
                onClick={() => {
                  setShowSocialMedia(false);
                  setSelectedSocialMedia('');
                  setNumPosts(1);
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Back
              </button>
              <button
                onClick={async () => {
                  setLoading(true);
                  const campaignId = crypto.randomUUID();
                  const prompt = `Generate a social media campaign for ${companyName} in the ${selectedIndustry} industry. Campaign type: ${selectedCampaignType}. Target audience: ${selectedDemographic} demographics, ages ${selectedAges.join(', ')}. Platform: ${selectedSocialMedia}.

Provide the response as a valid JSON object with the following structure:

{
  "description": "A short campaign description in 2-3 sentences",
  "imagePrompts": ["Detailed prompt for image 1", "Detailed prompt for image 2", ..., "Detailed prompt for image ${numPosts}"]
}

Ensure the JSON is valid and the imagePrompts array has exactly ${numPosts} items. Make prompts creative, brand-aligned, and varied.`;

                  try {
                    const response = await fetch('/api/perplexity', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ prompt }),
                    });
                    const data = await response.json();
                    const content = data.choices[0].message.content;

                    // Parse content as JSON, stripping markdown if present
                    let jsonString = content.trim();
                    const jsonStart = jsonString.indexOf('```json');
                    if (jsonStart !== -1) {
                      jsonString = jsonString.substring(jsonStart + 7).replace(/\s*```$/, '');
                    } else {
                      const codeStart = jsonString.indexOf('```');
                      if (codeStart !== -1) {
                        jsonString = jsonString.substring(codeStart + 3).replace(/\s*```$/, '');
                      }
                    }
                    let parsed;
                    try {
                      parsed = JSON.parse(jsonString);
                    } catch (e) {
                      console.error('Failed to parse JSON:', e, 'Content:', content);
                      alert('Error parsing campaign data.');
                      return;
                    }
                    const description = parsed.description || '';
                    const imagePrompts = parsed.imagePrompts?.slice(0, numPosts) || [];

                    // Generate images
                    const imageKeys: string[] = [];
                    const aspectRatio = getAspectRatio(selectedSocialMedia);
                    for (let i = 0; i < imagePrompts.length; i++) {
                      const imgPrompt = imagePrompts[i];
                      if (!imgPrompt.trim()) continue; // Skip empty prompts
                      const res = await fetch('/api/generate-image', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ prompt: imgPrompt, sampleCount: 1, aspectRatio, campaignId, index: i }),
                      });
                      const imgData = await res.json();
                      if (res.ok && imgData.key) {
                        imageKeys.push(imgData.key);
                      }
                    }
                    // Set data in store with campaignId and keys
                    setCampaignData(description, imageKeys, campaignId);
                    // Navigate to results page
                    router.push('/campaign/results');
                  } catch (error) {
                    console.error(error);
                    alert('Error generating campaign.');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Submit
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Display Results */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold">Generating your campaign...</p>
            <p className="text-sm text-gray-600 mt-2">This may take a few moments</p>
          </div>
        </div>
      )}
    </div>
  );
}
