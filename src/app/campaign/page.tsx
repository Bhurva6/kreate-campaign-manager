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
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [showIndustry, setShowIndustry] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [showCampaignType, setShowCampaignType] = useState(false);
  const [selectedCampaignType, setSelectedCampaignType] = useState('');
  const [showDemographic, setShowDemographic] = useState(false);
  const [selectedDemographic, setSelectedDemographic] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showAge, setShowAge] = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [showSocialMedia, setShowSocialMedia] = useState(false);
  const [selectedSocialMedia, setSelectedSocialMedia] = useState('');
  const [numPosts, setNumPosts] = useState(1);
  const [wantCaption, setWantCaption] = useState('');
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

  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
    'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
    'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
    'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
    'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
    'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
    'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana', 'Haiti',
    'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan',
    'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia',
    'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta',
    'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco',
    'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea',
    'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland',
    'Portugal', 'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines',
    'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore',
    'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka',
    'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo',
    'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates',
    'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
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
        {!showAdditionalInfo ? (
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
              onClick={() => setShowAdditionalInfo(true)}
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Next
            </button>
          </>
        ) : !showIndustry ? (
          <>
            <h2 className="text-2xl font-bold mb-4 text-center">Additional Information (Optional)</h2>
            <textarea
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              placeholder="Enter any relevant links, websites, or additional context about your company (e.g., website URL, social media handles, brand guidelines, etc.)"
              rows={4}
              className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
            />
            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowAdditionalInfo(false);
                  setAdditionalInfo('');
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Back
              </button>
              <button
                onClick={() => setShowIndustry(true)}
                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Next
              </button>
            </div>
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
                  setShowAdditionalInfo(true);
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
            <h2 className="text-2xl font-bold mb-4 text-center">Select Demographics, Age Groups, and Country</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <select
                value={selectedDemographic}
                onChange={(e) => setSelectedDemographic(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Demographic</option>
                {demographics.map((demo) => (
                  <option key={demo} value={demo}>
                    {demo}
                  </option>
                ))}
              </select>
              <div className="relative">
                <button
                  onClick={() => setShowAge(!showAge)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
                >
                  Age Groups ({selectedAges.length} selected)
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
              <div className="relative">
                <button
                  onClick={() => setShowCountry(!showCountry)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
                >
                  {selectedCountry || 'Select Country'}
                </button>
                {showCountry && (
                  <div className="absolute top-full mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    <input
                      type="text"
                      placeholder="Search countries..."
                      value={countrySearch}
                      onChange={(e) => setCountrySearch(e.target.value)}
                      className="w-full px-3 py-2 border-b border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:outline-none"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="max-h-40 overflow-y-auto">
                      {countries
                        .filter(country => country.toLowerCase().includes(countrySearch.toLowerCase()))
                        .map((country) => (
                          <button
                            key={country}
                            onClick={() => {
                              setSelectedCountry(country);
                              setShowCountry(false);
                              setCountrySearch('');
                            }}
                            className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 focus:outline-none"
                          >
                            {country}
                          </button>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="flex space-x-4 mt-54">
              <button
                onClick={() => {
                  setShowDemographic(false);
                  setShowAge(false);
                  setShowCountry(false);
                  setSelectedDemographic('');
                  setSelectedAges([]);
                  setSelectedCountry('');
                  setCountrySearch('');
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
            <h2 className="text-2xl font-bold mb-4 text-center">Select Social Media Type, Number of Posts, and Caption</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <select
                value={selectedSocialMedia}
                onChange={(e) => setSelectedSocialMedia(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <select
                value={wantCaption}
                onChange={(e) => setWantCaption(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Do you want captions?</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            <div className="flex space-x-4 mt-12">
              <button
                onClick={() => {
                  setShowSocialMedia(false);
                  setSelectedSocialMedia('');
                  setNumPosts(1);
                  setWantCaption('');
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Back
              </button>
              <button
                onClick={async () => {
                  setLoading(true);
                  const campaignId = crypto.randomUUID();
                  const prompt = `Generate a social media campaign for ${companyName} in the ${selectedIndustry} industry. Campaign type: ${selectedCampaignType}. Target audience: ${selectedDemographic} demographics, ages ${selectedAges.join(', ')}, located in ${selectedCountry}. Platform: ${selectedSocialMedia}.

${additionalInfo ? `Additional information: ${additionalInfo}` : ''}

Provide the response as a valid JSON object with the following structure:

{
  "description": "A short campaign description in 2-3 sentences",
  "imagePrompts": ["Detailed prompt for image 1", "Detailed prompt for image 2", ..., "Detailed prompt for image ${numPosts}"]${wantCaption === 'yes' ? `,
  "captions": ["Engaging caption for image 1", "Engaging caption for image 2", ..., "Engaging caption for image ${numPosts}"]` : ''}
}

Ensure the JSON is valid and the imagePrompts array has exactly ${numPosts} items. Make prompts creative, brand-aligned, and varied.${wantCaption === 'yes' ? ' Also provide engaging, platform-appropriate captions for each image.' : ''}`;

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
                    const captions = wantCaption === 'yes' ? (parsed.captions?.slice(0, numPosts) || []) : [];

                    // Generate images
                    const imageKeys: string[] = [];
                    const errors: string[] = [];
                    const aspectRatio = getAspectRatio(selectedSocialMedia);
                    for (let i = 0; i < imagePrompts.length; i++) {
                      const imgPrompt = imagePrompts[i];
                      if (!imgPrompt.trim()) {
                        errors.push(`Image ${i + 1}: Empty prompt`);
                        continue;
                      }
                      try {
                        const res = await fetch('/api/generate-image', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ prompt: imgPrompt, sampleCount: 1, aspectRatio, campaignId, index: i }),
                        });
                        const imgData = await res.json();
                        if (res.ok && imgData.key) {
                          imageKeys.push(imgData.key);
                        } else {
                          errors.push(`Image ${i + 1}: ${imgData.error || 'Unknown error'}`);
                        }
                      } catch (error) {
                        errors.push(`Image ${i + 1}: Network error - ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    }
                    // Set data in store with campaignId, keys, and errors
                    setCampaignData(description, imageKeys, campaignId, errors, captions);
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
          <div className="bg-gray-800 p-8 rounded-lg shadow-lg text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-lg font-semibold text-white">Generating your campaign...</p>
            <p className="text-sm text-white mt-2">This may take a few moments</p>
          </div>
        </div>
      )}
    </div>
  );
}
