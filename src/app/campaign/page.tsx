'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../../lib/auth';
import AuthModal from '../../components/AuthModal';
import UserDropdown from '../../components/UserDropdown';
import PaymentModal from '../../components/PaymentModal';
import { useState } from 'react';
import { useCampaignStore } from '../../store/campaignStore';
import { useCredits } from '@/lib/credits';

export default function CampaignPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { imageGenerationsUsed, imageGenerationsLimit, imageEditsUsed, imageEditsLimit, isUnlimitedUser, canUseImageGeneration } = useCredits();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const setCampaignData = useCampaignStore(state => state.setCampaignData);
  const [companyName, setCompanyName] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);
  const [showIndustry, setShowIndustry] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [showCampaignType, setShowCampaignType] = useState(false);
  const [selectedCampaignType, setSelectedCampaignType] = useState('');
  const [showDemographic, setShowDemographic] = useState(false);
  const [selectedDemographic, setSelectedDemographic] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('');
  const [showAge, setShowAge] = useState(false);
  const [showCountry, setShowCountry] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [showRegion, setShowRegion] = useState(false);
  const [selectedState, setSelectedState] = useState('');
  const [showState, setShowState] = useState(false);
  const [selectedAges, setSelectedAges] = useState<string[]>([]);
  const [showSocialMedia, setShowSocialMedia] = useState(false);
  const [selectedSocialMedia, setSelectedSocialMedia] = useState('');
  const [numPosts, setNumPosts] = useState(1);
  const [wantCaption, setWantCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [campaignDescription, setCampaignDescription] = useState('');
  const [wantLogo, setWantLogo] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPosition, setLogoPosition] = useState('');
  const [showDemo, setShowDemo] = useState(false);
  const [festivalName, setFestivalName] = useState('');

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

  const regions = [
    'Asia',
    'North America',
    'South America',
    'Europe',
    'Africa',
    'Oceania',
    'Antarctica'
  ];

  const countryStates: { [key: string]: string[] } = {
    'United States': [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware', 'Florida', 'Georgia',
      'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland',
      'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey',
      'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina',
      'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
    ],
    'India': [
      'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand',
      'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
      'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
    ],
    'Canada': [
      'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador', 'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
      'Quebec', 'Saskatchewan', 'Yukon'
    ],
    'Australia': [
      'Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland', 'South Australia', 'Tasmania', 'Victoria', 'Western Australia'
    ],
    'United Kingdom': [
      'England', 'Scotland', 'Wales', 'Northern Ireland'
    ],
    'Germany': [
      'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern', 'North Rhine-Westphalia',
      'Rhineland-Palatinate', 'Saarland', 'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia'
    ],
    'France': [
      'Auvergne-Rhône-Alpes', 'Bourgogne-Franche-Comté', 'Brittany', 'Centre-Val de Loire', 'Corsica', 'Grand Est', 'Hauts-de-France', 'Île-de-France', 'Normandy', 'Nouvelle-Aquitaine',
      'Occitanie', 'Pays de la Loire', 'Provence-Alpes-Côte d\'Azur'
    ],
    'China': [
      'Anhui', 'Beijing', 'Chongqing', 'Fujian', 'Gansu', 'Guangdong', 'Guangxi', 'Guizhou', 'Hainan', 'Hebei',
      'Heilongjiang', 'Henan', 'Hong Kong', 'Hubei', 'Hunan', 'Inner Mongolia', 'Jiangsu', 'Jiangxi', 'Jilin', 'Liaoning',
      'Macau', 'Ningxia', 'Qinghai', 'Shaanxi', 'Shandong', 'Shanghai', 'Shanxi', 'Sichuan', 'Tianjin', 'Tibet',
      'Xinjiang', 'Yunnan', 'Zhejiang'
    ],
    'Japan': [
      'Aichi', 'Akita', 'Aomori', 'Chiba', 'Ehime', 'Fukui', 'Fukuoka', 'Fukushima', 'Gifu', 'Gunma',
      'Hiroshima', 'Hokkaido', 'Hyogo', 'Ibaraki', 'Ishikawa', 'Iwate', 'Kagawa', 'Kagoshima', 'Kanagawa', 'Kochi',
      'Kumamoto', 'Kyoto', 'Mie', 'Miyagi', 'Miyazaki', 'Nagano', 'Nagasaki', 'Nara', 'Niigata', 'Oita',
      'Okayama', 'Okinawa', 'Osaka', 'Saga', 'Saitama', 'Shiga', 'Shimane', 'Shizuoka', 'Tochigi', 'Tokushima',
      'Tokyo', 'Tottori', 'Toyama', 'Wakayama', 'Yamagata', 'Yamaguchi', 'Yamanashi'
    ],
    'Brazil': [
      'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal', 'Espírito Santo', 'Goiás', 'Maranhão',
      'Mato Grosso', 'Mato Grosso do Sul', 'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí', 'Rio de Janeiro', 'Rio Grande do Norte',
      'Rio Grande do Sul', 'Rondônia', 'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
    ],
    'Mexico': [
      'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche', 'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
      'Guerrero', 'Hidalgo', 'Jalisco', 'Mexico City', 'Michoacán', 'Morelos', 'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla',
      'Querétaro', 'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán',
      'Zacatecas'
    ]
  };

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
  const getAspectRatio = (media: string) => {
    if (media.includes('1:1')) return '1:1';
    if (media.includes('9:16')) return '9:16';
    if (media.includes('16:9')) return '16:9';
    if (media.includes('1.91:1')) return '16:9'; // Approximate to 16:9
    return '1:1'; // default
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };
    const dropdownUser = user ? {
    name: user.displayName || user.email || '',
    email: user.email || '',
    image: user.photoURL || '/google.svg',
  } : null;

  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Navbar */}
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
            {selectedCampaignType === 'Festive' && (
              <input
                type="text"
                value={festivalName}
                onChange={(e) => setFestivalName(e.target.value)}
                placeholder="Enter festival name (e.g., Diwali, Christmas)"
                className="w-full mt-4 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
            <div className="flex space-x-4 mt-12">
              <button
                onClick={() => {
                  setShowCampaignType(false);
                  setSelectedCampaignType('');
                  setFestivalName('');
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
            <h2 className="text-2xl font-bold mb-4 text-center">Select Demographics, Age Groups, Country, Region, and State</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <div className="relative">
                <button
                  onClick={() => setShowDemo(!showDemo)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
                >
                  Demographics ({selectedDemographic.length} selected)
                </button>
                {showDemo && (
                  <div className="absolute top-full mt-1 w-full bg-gray-800 text-white border border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    {demographics.map((demo) => (
                      <label key={demo} className="flex items-center px-4 py-2 hover:bg-gray-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedDemographic.includes(demo)}
                          onChange={() => {
                            setSelectedDemographic((prev) =>
                              prev.includes(demo)
                                ? prev.filter((d) => d !== demo)
                                : [...prev, demo]
                            );
                          }}
                          className="mr-2"
                        />
                        {demo}
                      </label>
                    ))}
                  </div>
                )}
              </div>
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
                            setShowAge(false);
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
              <div className="relative">
                <button
                  onClick={() => setShowRegion(!showRegion)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
                >
                  {selectedRegion || 'Select Region'}
                </button>
                {showRegion && (
                  <div className="absolute top-full mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    <div className="max-h-40 overflow-y-auto">
                      {regions.map((region) => (
                        <button
                          key={region}
                          onClick={() => {
                            setSelectedRegion(region);
                            setShowRegion(false);
                          }}
                          className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 focus:outline-none"
                        >
                          {region}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowState(!showState)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-left"
                  disabled={!selectedCountry}
                >
                  {selectedState || 'Select State/Province'}
                </button>
                {showState && selectedCountry && (
                  <div className="absolute top-full mt-1 w-full bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                    <div className="max-h-40 overflow-y-auto">
                      {countryStates[selectedCountry]?.map((state) => (
                        <button
                          key={state}
                          onClick={() => {
                            setSelectedState(state);
                            setShowState(false);
                          }}
                          className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 focus:outline-none"
                        >
                          {state}
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
                  setSelectedDemographic([]);
                  setSelectedAges([]);
                  setSelectedCountry('');
                  setCountrySearch('');
                  setSelectedRegion('');
                  setShowRegion(false);
                  setSelectedState('');
                  setShowState(false);
                  setShowDemo(false);
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 w-full">
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
              <select
                value={wantLogo}
                onChange={(e) => setWantLogo(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Include Logo?</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
            {wantLogo === 'yes' && (
              <div className="mt-4 flex gap-4 w-full max-w-2xl">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <select
                  value={logoPosition}
                  onChange={(e) => setLogoPosition(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select logo position</option>
                  <option value="top-left">Top Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="center">Center</option>
                </select>
              </div>
            )}
            <div className="flex space-x-4 mt-12">
              <button
                onClick={() => {
                  setShowSocialMedia(false);
                  setSelectedSocialMedia('');
                  setNumPosts(1);
                  setWantCaption('');
                  setWantLogo('');
                  setLogoFile(null);
                  setLogoPosition('');
                }}
                className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Back
              </button>
              <button
                onClick={async () => {
                  // Check if user has used their free generation and isn't unlimited
                  if (!isUnlimitedUser && imageGenerationsUsed >= 1) {
                    setShowPaymentModal(true);
                    return;
                  }
                  
                  setLoading(true);
                  const campaignId = crypto.randomUUID();
                  
                  // Convert logo to base64 if uploaded
                  let logoBase64 = '';
                  if (wantLogo === 'yes' && logoFile) {
                    try {
                      logoBase64 = await fileToBase64(logoFile);
                    } catch (error) {
                      console.error('Error converting logo to base64:', error);
                      alert('Error processing logo file.');
                      setLoading(false);
                      return;
                    }
                  }
                  
                  const prompt = `Generate a social media campaign for ${companyName} in the ${selectedIndustry} industry. Campaign type: ${selectedCampaignType}${selectedCampaignType === 'Festive' && festivalName ? ` - Festival: ${festivalName}` : ''}. Target audience: ${selectedDemographic.join(', ')} demographics, ages ${selectedAges.join(', ')}, located in ${selectedCountry}${selectedRegion ? `, ${selectedRegion} region` : ''}${selectedState ? `, ${selectedState} state/province` : ''}. Platform: ${selectedSocialMedia}.

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
                          body: JSON.stringify({ 
                            prompt: imgPrompt, 
                            sampleCount: 1, 
                            aspectRatio, 
                            campaignId, 
                            index: i,
                            logo: wantLogo === 'yes' && logoFile ? logoBase64 : undefined,
                            logoPosition: wantLogo === 'yes' && logoFile ? logoPosition : undefined
                          }),
                        });
                        const imgData = await res.json();
                        if (res.ok && imgData.success && imgData.images?.length > 0) {
                          console.log('Image generation successful:', imgData.images[0]); // Debug log
                          // Store the image data
                          imageKeys.push(imgData.images[0]);
                        } else {
                          console.error('Image generation error:', imgData); // Debug log
                          errors.push(`Image ${i + 1}: ${imgData.error || 'Unknown error'}`);
                        }
                      } catch (error) {
                        errors.push(`Image ${i + 1}: Network error - ${error instanceof Error ? error.message : 'Unknown error'}`);
                      }
                    }
                    // Debug log before setting campaign data
                    console.log('Setting campaign data:', {
                      description,
                      imageKeys,
                      campaignId,
                      errors,
                      captions,
                      logoBase64: logoBase64 ? 'present' : 'not present',
                      logoPosition,
                      selectedRegion,
                      selectedState
                    });
                    
                    // Set data in store with campaignId, keys, and errors
                    setCampaignData(description, imageKeys, campaignId, errors, captions, logoBase64, logoPosition, selectedRegion, selectedState);
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

      {/* Auth Modal */}
      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      
      {/* Payment Modal */}
      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} />
    </div>
  );
}
