"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import EnterpriseOnboarding from "../../components/EnterpriseOnboarding";
import EnterpriseDashboard from "../../components/EnterpriseDashboard";
import UserDropdown from "../../components/UserDropdown";
import Link from "next/link";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import ThemeToggle from "../../components/ThemeToggle";
import SafeImage from "../../components/SafeImage";
// Import NoSSR wrapper to prevent server-side rendering of components that need client-side context
import NoSSR from "../../components/NoSSR";
// Import custom CSS for enterprise page
import "./enterprise.css";

// Define the steps for the enterprise process
const STEPS = [
  { id: 'information-input', label: 'Information Input' },
  { id: 'objective', label: 'Objective' },
  { id: 'generation', label: 'Generation Batch' },
  { id: 'confidence', label: 'Confidence' },
  { id: 'accept-reject', label: 'Accept & Reject Generations' }
];

// Create a client-only inner component that uses hooks
function EnterprisePageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  
  // Track the current step in the process
  const [currentStep, setCurrentStep] = useState(0);
  // Store user's business information input
  const [businessInfo, setBusinessInfo] = useState('');
  
  // Store objective data
  const [objectives, setObjectives] = useState<string[]>([]);
  const [customObjective, setCustomObjective] = useState('');
  const [geography, setGeography] = useState('global');
  const [specificLocation, setSpecificLocation] = useState('');
  const [ageGroups, setAgeGroups] = useState<string[]>([]);
  const [customerPersona, setCustomerPersona] = useState('');
  
  // Store generation batch data
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [postingFrequency, setPostingFrequency] = useState('daily');
  const [generationCount, setGenerationCount] = useState(5);
  
  // Store confidence scores
  const [overallConfidence, setOverallConfidence] = useState(0);
  const [objectiveConfidences, setObjectiveConfidences] = useState<{[key: string]: number}>({});
  
  // Store accept/reject generations data
  const [swiggyImages, setSwiggyImages] = useState<string[]>([]);
  const [acceptedImages, setAcceptedImages] = useState<string[]>([]);
  const [rejectedImages, setRejectedImages] = useState<string[]>([]);
  const [isPublished, setIsPublished] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  
  const [companyData, setCompanyData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Generate confidence scores when the user reaches the confidence step
  useEffect(() => {
    if (currentStep === 3 && overallConfidence === 0) {
      const overall = Math.floor(65 + Math.random() * 30);
      setOverallConfidence(overall);
      
      // Generate scores for each objective
      const objectiveScores: {[key: string]: number} = {};
      objectives.forEach(obj => {
        if (obj) objectiveScores[obj] = Math.floor(60 + Math.random() * 40);
      });
      if (customObjective) {
        objectiveScores[customObjective] = Math.floor(60 + Math.random() * 40);
      }
      setObjectiveConfidences(objectiveScores);
    }
  }, [currentStep, overallConfidence, objectives, customObjective]);
  
  // Load swiggy images when reaching the accept/reject step
  useEffect(() => {
    if (currentStep === 4) {
      // Use images from public folder for the demo
      const sampleImages = [
        '/1.png',
        '/2.png',
        '/3.png',
        '/4.png',
        '/5.png',
        '/6.png',
        '/7.png',
        '/8.png',
        '/9.png',
        '/10.png',
      ];
      
      setSwiggyImages(sampleImages);
      setAcceptedImages([]);
      setRejectedImages([]);
      setShowSuccess(false);
      setIsPublished(false);
    }
  }, [currentStep]);

  useEffect(() => {
    // Check if user is logged in
    if (!loading && !user) {
      router.push("/signin?redirect=/enterprise");
      return;
    }

    // If user is logged in, check if they have already completed onboarding
    if (user) {
      // TODO: Replace with actual Firebase fetch of company data
      // For now using mock check with localStorage
      try {
        const savedData = localStorage.getItem(`enterprise_${user.uid}`);
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          
          // Don't set companyData, so we stay in the multi-step flow instead of showing the dashboard
          // setCompanyData(parsedData);
          
          // If we're in the middle of a process, restore the current step and data
          if (parsedData.currentStep !== undefined) {
            setCurrentStep(parsedData.currentStep);
          }
          
          // Restore business info
          if (parsedData.businessInfo) {
            setBusinessInfo(parsedData.businessInfo);
          }
          
          // Restore objective data if it exists
          if (parsedData.objectiveData) {
            const { objectives = [], geography = 'global', specificLocation = '', ageGroups = [], customerPersona = '' } = parsedData.objectiveData;
            
            setObjectives(objectives.filter((obj: string) => obj !== ''));
            setGeography(geography);
            setSpecificLocation(specificLocation);
            setAgeGroups(ageGroups);
            setCustomerPersona(customerPersona);
            
            // Extract custom objective if it exists (as the last item in the array)
            if (objectives.length > 0) {
              const predefinedObjectives = [
                'Drive growth', 'Raise awareness', 'Increase engagement', 'Generate leads',
                'Boost conversions', 'Build brand loyalty', 'Launch new product', 'Event promotion'
              ];
              
              const customObjs = objectives.filter((obj: string) => !predefinedObjectives.includes(obj));
              if (customObjs.length > 0) {
                setCustomObjective(customObjs[0]);
              }
            }
          }
          
          // Restore generation batch data if it exists
          if (parsedData.generationData) {
            const { platforms = [], frequency = 'daily', count = 5 } = parsedData.generationData;
            
            setSelectedPlatforms(platforms);
            setPostingFrequency(frequency);
            setGenerationCount(count);
          }
          
          // Restore or generate confidence data
          if (parsedData.confidenceData) {
            setOverallConfidence(parsedData.confidenceData.overall);
            setObjectiveConfidences(parsedData.confidenceData.objectives || {});
          } else {
            // Generate random confidence scores if we're at step 3 or beyond
            if (parsedData.currentStep >= 3) {
              const overall = Math.floor(65 + Math.random() * 30);
              setOverallConfidence(overall);
              
              // Generate scores for each objective
              const objectiveScores: {[key: string]: number} = {};
              if (parsedData.objectiveData && parsedData.objectiveData.objectives) {
                parsedData.objectiveData.objectives.forEach((obj: string) => {
                  if (obj) objectiveScores[obj] = Math.floor(60 + Math.random() * 40);
                });
              }
              setObjectiveConfidences(objectiveScores);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching company data:", error);
      } finally {
        setIsLoading(false);
      }
    }
  }, [user, loading, router]);

  const handleOnboardingComplete = (data: any) => {
    // Save company data to localStorage for now
    // In a real implementation, this would save to Firebase
    if (user) {
      localStorage.setItem(`enterprise_${user.uid}`, JSON.stringify(data));
      setCompanyData(data);
    }
  };
  
  // Save business info to proceed to next step
  const saveBusinessInfo = () => {
    if (user && businessInfo.trim() !== '') {
      // Get any existing data
      const existingData = JSON.parse(localStorage.getItem(`enterprise_${user.uid}`) || '{}');
      
      const newCompanyData = {
        ...existingData,
        businessInfo,
        createdAt: new Date().toISOString(),
        currentStep: 1, // Moving to objective step
        userId: user.uid
      };
      
      localStorage.setItem(`enterprise_${user.uid}`, JSON.stringify(newCompanyData));
      
      // Just set the current step without updating companyData to avoid showing the dashboard
      setCurrentStep(1);
    }
  };
  
  // Handle the "Next" button click from information input to objective step
  const handleNextStep = () => {
    if (businessInfo.trim() === '') {
      alert('Please enter your business information before proceeding');
      return;
    }
    
    // Save business info and move to objective step
    saveBusinessInfo();
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  // Render content based on the current step
  const renderStepContent = () => {
    switch(currentStep) {
      case 0: // Information Input step
        return (
          <div className="step-content max-w-3xl mx-auto mt-8 px-8 py-10 bg-theme-background rounded-xl shadow-xl">
            <h3 className="text-2xl font-bold text-theme-foreground mb-2 text-center">
              Business Information
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-8 text-center max-w-xl mx-auto">
              Please provide any information you have about your business, website, app, or documents. 
              This will help us create tailored content for your enterprise.
            </p>
            
            <div className="mb-8">
              <div className="flex items-center mb-4 text-sm text-gray-500 dark:text-gray-400">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>You can enter a website URL, upload documents, or describe your business in detail</span>
              </div>
              
              <textarea 
                className="w-full h-64 p-4 border border-gray-300 dark:border-gray-700 rounded-lg 
                         focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
                         bg-white dark:bg-gray-800 text-theme-foreground text-base"
                placeholder="Enter website URL, describe your business, or paste relevant content..."
                value={businessInfo}
                onChange={(e) => setBusinessInfo(e.target.value)}
              ></textarea>
              
              <div className="mt-4 flex items-center text-sm text-gray-500">
                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a3 3 0 006 0V7a1 1 0 112 0v4a5 5 0 01-10 0V7a5 5 0 0110 0v1h-2V7a3 3 0 00-3-3z" clipRule="evenodd" />
                </svg>
                <span>Or drag and drop files here</span>
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <button 
                onClick={handleNextStep}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-medium rounded-lg 
                         transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                         shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Continue to Objective
              </button>
            </div>
          </div>
        );
      case 1: // Objective step with detailed options
        return (
          <div className="step-content max-w-3xl mx-auto mt-8 px-8 py-10 bg-theme-background rounded-xl shadow-xl">
            <h3 className="text-2xl font-bold text-theme-foreground mb-6 text-center">Define your objectives</h3>
            
            {/* Campaign Objectives */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-theme-foreground mb-3">What do you want the end result of the campaign to be?</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {['Drive growth', 'Raise awareness', 'Increase engagement', 'Generate leads', 
                  'Boost conversions', 'Build brand loyalty', 'Launch new product', 'Event promotion'].map((objective) => (
                  <div key={objective} className="flex items-center">
                    <input 
                      type="checkbox" 
                      id={objective.toLowerCase().replace(/\s+/g, '-')}
                      checked={objectives.includes(objective)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setObjectives([...objectives, objective]);
                        } else {
                          setObjectives(objectives.filter(obj => obj !== objective));
                        }
                      }}
                      className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                    />
                    <label htmlFor={objective.toLowerCase().replace(/\s+/g, '-')} className="ml-2 text-gray-700 dark:text-gray-300">
                      {objective}
                    </label>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <input 
                  type="text" 
                  value={customObjective}
                  onChange={(e) => setCustomObjective(e.target.value)}
                  placeholder="Other objective (specify)" 
                  className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg 
                           focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
                           bg-white dark:bg-gray-800 text-theme-foreground"
                />
              </div>
            </div>
            
            {/* Target Geography */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-theme-foreground mb-3">Geographic target</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="global" 
                    name="geography" 
                    value="global"
                    checked={geography === 'global'}
                    onChange={(e) => setGeography(e.target.value)}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <label htmlFor="global" className="ml-2 text-gray-700 dark:text-gray-300">
                    Global (worldwide)
                  </label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="country" 
                    name="geography" 
                    value="country"
                    checked={geography === 'country'}
                    onChange={(e) => setGeography(e.target.value)}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <label htmlFor="country" className="ml-2 text-gray-700 dark:text-gray-300">
                    Specific country (e.g., India)
                  </label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="city" 
                    name="geography" 
                    value="city"
                    checked={geography === 'city'}
                    onChange={(e) => setGeography(e.target.value)}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <label htmlFor="city" className="ml-2 text-gray-700 dark:text-gray-300">
                    Specific city
                  </label>
                </div>
                <div className="mt-3">
                  <input 
                    type="text" 
                    value={specificLocation}
                    onChange={(e) => setSpecificLocation(e.target.value)}
                    placeholder="Specify country or city" 
                    className={`w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg 
                             focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
                             bg-white dark:bg-gray-800 text-theme-foreground ${geography === 'global' ? 'opacity-50' : ''}`}
                    disabled={geography === 'global'}
                  />
                </div>
              </div>
            </div>
            
            {/* Age Group */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-theme-foreground mb-3">Target age groups</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Under 18', '18-24', '25-34', '35-44', '45-54', '55-64', '65 and above'].map((ageGroup) => (
                  <div key={ageGroup} className="flex items-center">
                    <input 
                      type="checkbox" 
                      id={ageGroup.toLowerCase().replace(/\s+/g, '-')} 
                      checked={ageGroups.includes(ageGroup)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setAgeGroups([...ageGroups, ageGroup]);
                        } else {
                          setAgeGroups(ageGroups.filter(age => age !== ageGroup));
                        }
                      }}
                      className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                    />
                    <label htmlFor={ageGroup.toLowerCase().replace(/\s+/g, '-')} className="ml-2 text-gray-700 dark:text-gray-300">
                      {ageGroup}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Custom Persona */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-theme-foreground mb-3">Custom target customer persona</h4>
              <textarea 
                value={customerPersona}
                onChange={(e) => setCustomerPersona(e.target.value)}
                className="w-full h-32 p-3 border border-gray-300 dark:border-gray-700 rounded-lg 
                         focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
                         bg-white dark:bg-gray-800 text-theme-foreground text-base"
                placeholder="Describe your ideal customer persona (e.g., 'Health-conscious urban professionals who exercise regularly and follow sustainable lifestyle practices')"
              ></textarea>
            </div>
            
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => {
                  // Save all objective data
                  const objectiveData = {
                    objectives: [...objectives, customObjective].filter(Boolean),
                    geography,
                    specificLocation,
                    ageGroups,
                    customerPersona
                  };
                  
                  // If user is logged in, save to localStorage or could be Firebase in production
                  if (user) {
                    const updatedData = {
                      ...JSON.parse(localStorage.getItem(`enterprise_${user.uid}`) || '{}'),
                      objectiveData,
                      currentStep: 2
                    };
                    localStorage.setItem(`enterprise_${user.uid}`, JSON.stringify(updatedData));
                  }
                  
                  // Move to next step
                  setCurrentStep(2);
                }}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-medium rounded-lg 
                         transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                         shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Continue to Generation Batch
              </button>
            </div>
          </div>
        );
      case 2: // Generation Batch step
        return (
          <div className="step-content max-w-3xl mx-auto mt-8 px-8 py-10 bg-theme-background rounded-xl shadow-xl">
            <h3 className="text-2xl font-bold text-theme-foreground mb-6 text-center">Generation Batch</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              Configure your content generation preferences to create tailored content for your campaign.
            </p>
            
            {/* Social Media Selection */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-theme-foreground mb-3">Select target social media platforms</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Instagram', 'Facebook', 'Twitter/X', 'LinkedIn', 'TikTok', 'Pinterest', 'YouTube', 'Snapchat'].map((platform) => (
                  <div key={platform} className="flex items-center">
                    <input 
                      type="checkbox" 
                      id={platform.toLowerCase().replace(/\s+/g, '-').replace('/', '-')}
                      checked={selectedPlatforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedPlatforms([...selectedPlatforms, platform]);
                        } else {
                          setSelectedPlatforms(selectedPlatforms.filter(p => p !== platform));
                        }
                      }}
                      className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                    />
                    <label htmlFor={platform.toLowerCase().replace(/\s+/g, '-').replace('/', '-')} className="ml-2 text-gray-700 dark:text-gray-300">
                      {platform}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Posting Frequency */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-theme-foreground mb-3">Posting frequency</h4>
              <div className="space-y-3">
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="daily" 
                    name="frequency" 
                    value="daily"
                    checked={postingFrequency === 'daily'}
                    onChange={(e) => setPostingFrequency(e.target.value)}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <label htmlFor="daily" className="ml-2 text-gray-700 dark:text-gray-300">
                    Daily (1 post per day)
                  </label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="multiple-daily" 
                    name="frequency" 
                    value="multiple-daily"
                    checked={postingFrequency === 'multiple-daily'}
                    onChange={(e) => setPostingFrequency(e.target.value)}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <label htmlFor="multiple-daily" className="ml-2 text-gray-700 dark:text-gray-300">
                    Multiple times daily (2-3 posts per day)
                  </label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="weekly" 
                    name="frequency" 
                    value="weekly"
                    checked={postingFrequency === 'weekly'}
                    onChange={(e) => setPostingFrequency(e.target.value)}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <label htmlFor="weekly" className="ml-2 text-gray-700 dark:text-gray-300">
                    Weekly (1-2 posts per week)
                  </label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="biweekly" 
                    name="frequency" 
                    value="biweekly"
                    checked={postingFrequency === 'biweekly'}
                    onChange={(e) => setPostingFrequency(e.target.value)}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <label htmlFor="biweekly" className="ml-2 text-gray-700 dark:text-gray-300">
                    Bi-weekly (1 post every two weeks)
                  </label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="monthly" 
                    name="frequency" 
                    value="monthly"
                    checked={postingFrequency === 'monthly'}
                    onChange={(e) => setPostingFrequency(e.target.value)}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <label htmlFor="monthly" className="ml-2 text-gray-700 dark:text-gray-300">
                    Monthly (1 post per month)
                  </label>
                </div>
                <div className="flex items-center">
                  <input 
                    type="radio" 
                    id="custom" 
                    name="frequency" 
                    value="custom"
                    checked={postingFrequency === 'custom'}
                    onChange={(e) => setPostingFrequency(e.target.value)}
                    className="w-4 h-4 text-orange-500 border-gray-300 focus:ring-orange-500"
                  />
                  <label htmlFor="custom" className="ml-2 text-gray-700 dark:text-gray-300">
                    Custom
                  </label>
                </div>
              </div>
            </div>
            
            {/* Number of Generations */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-theme-foreground mb-3">Number of content generations</h4>
              <div className="flex items-center">
                <input 
                  type="number" 
                  min="1" 
                  max="20" 
                  value={generationCount}
                  onChange={(e) => setGenerationCount(parseInt(e.target.value) || 1)}
                  className="w-20 p-2 border border-gray-300 dark:border-gray-700 rounded-lg 
                           focus:ring-2 focus:ring-orange-500 focus:border-orange-500 
                           bg-white dark:bg-gray-800 text-theme-foreground"
                />
                <span className="ml-3 text-gray-700 dark:text-gray-300">generations</span>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                We recommend 5-10 generations for optimal variety and quality.
              </p>
            </div>
            
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => {
                  // Validate input
                  if (selectedPlatforms.length === 0) {
                    alert('Please select at least one social media platform');
                    return;
                  }
                  
                  // Save generation batch data
                  const generationData = {
                    platforms: selectedPlatforms,
                    frequency: postingFrequency,
                    count: generationCount
                  };
                  
                  // If user is logged in, save to localStorage or could be Firebase in production
                  if (user) {
                    const updatedData = {
                      ...JSON.parse(localStorage.getItem(`enterprise_${user.uid}`) || '{}'),
                      generationData,
                      currentStep: 3
                    };
                    localStorage.setItem(`enterprise_${user.uid}`, JSON.stringify(updatedData));
                  }
                  
                  // Move to next step (confidence)
                  setCurrentStep(3);
                }}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-medium rounded-lg 
                         transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                         shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Generate Content
              </button>
            </div>
          </div>
        );
      
      case 3: // Confidence step
        return (
          <div className="step-content max-w-3xl mx-auto mt-8 px-8 py-10 bg-theme-background rounded-xl shadow-xl">
            <h3 className="text-2xl font-bold text-theme-foreground mb-6 text-center">Confidence Score</h3>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
              Based on your business information, objectives, and generation preferences, here&apos;s how well your content aligns with your goals.
            </p>
            
            {/* Overall Confidence Score */}
            <div className="mb-10">
              <h4 className="text-lg font-semibold text-theme-foreground mb-3 text-center">Overall Alignment Score</h4>
              
              {/* Score Circle */}
              <div className="flex justify-center mb-6">
                <div className="relative w-48 h-48">
                  {/* Circle background */}
                  <div className="absolute inset-0 rounded-full border-8 border-gray-200 dark:border-gray-700"></div>
                  
                  {/* Progress circle - using stored confidence score */}
                  <div 
                    className="absolute inset-0 rounded-full border-8 border-orange-500" 
                    style={{ 
                      clipPath: `polygon(50% 50%, 50% 0%, ${50 + 50 * Math.sin(2 * Math.PI * (overallConfidence / 100))}% ${50 - 50 * Math.cos(2 * Math.PI * (overallConfidence / 100))}%, ${overallConfidence > 75 ? '100% 0%, 100% 100%, 0% 100%, 0% 0%' : '0% 0%'})`
                    }}
                  ></div>
                  
                  {/* Score text */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <span className="text-4xl font-bold text-orange-500">{overallConfidence}</span>
                      <span className="text-xl text-gray-600 dark:text-gray-400">/100</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <p className="text-center text-gray-600 dark:text-gray-300">
                Your content strategy has a strong alignment with your business objectives.
              </p>
            </div>
            
            {/* Individual Objective Alignment */}
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-theme-foreground mb-4">Alignment with Individual Objectives</h4>
              
              <div className="space-y-4">
                {objectives.filter(Boolean).map((objective) => {
                  // Get the score from state, or generate one if it doesn't exist
                  const score = objectiveConfidences[objective] || Math.floor(60 + Math.random() * 40);
                  return (
                    <div key={objective} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-theme-foreground">{objective}</span>
                        <span className="text-orange-500 font-semibold">{score}%</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${score}%` }}></div>
                      </div>
                    </div>
                  );
                })}
                
                {customObjective && (
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium text-theme-foreground">{customObjective}</span>
                      <span className="text-orange-500 font-semibold">{objectiveConfidences[customObjective] || Math.floor(60 + Math.random() * 40)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div 
                        className="bg-orange-500 h-2.5 rounded-full" 
                        style={{ width: `${objectiveConfidences[customObjective] || Math.floor(60 + Math.random() * 40)}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Additional Insights */}
            <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-xl mb-8">
              <h4 className="text-lg font-semibold text-theme-foreground mb-3">AI-Generated Insights</h4>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-orange-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>Your content strategy is well-optimized for your target demographics.</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-orange-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>Your selected posting frequency aligns with best practices for your industry.</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-orange-500 mt-1 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                  </svg>
                  <span>The selected social platforms match where your target audience is most active.</span>
                </li>
              </ul>
            </div>
            
            <div className="mt-8 flex justify-center">
              <button 
                onClick={() => {
                  // Save confidence data
                  if (user) {
                    // If we don't already have confidence scores, generate them
                    if (overallConfidence === 0) {
                      const overall = Math.floor(65 + Math.random() * 30);
                      setOverallConfidence(overall);
                      
                      // Generate scores for each objective
                      const objectiveScores: {[key: string]: number} = {};
                      objectives.forEach(obj => {
                        if (obj) objectiveScores[obj] = Math.floor(60 + Math.random() * 40);
                      });
                      if (customObjective) {
                        objectiveScores[customObjective] = Math.floor(60 + Math.random() * 40);
                      }
                      setObjectiveConfidences(objectiveScores);
                      
                      // Save to localStorage
                      const updatedData = {
                        ...JSON.parse(localStorage.getItem(`enterprise_${user.uid}`) || '{}'),
                        confidenceData: {
                          overall,
                          objectives: objectiveScores
                        },
                        currentStep: 4
                      };
                      localStorage.setItem(`enterprise_${user.uid}`, JSON.stringify(updatedData));
                    } else {
                      // Just save the current step
                      const updatedData = {
                        ...JSON.parse(localStorage.getItem(`enterprise_${user.uid}`) || '{}'),
                        confidenceData: {
                          overall: overallConfidence,
                          objectives: objectiveConfidences
                        },
                        currentStep: 4
                      };
                      localStorage.setItem(`enterprise_${user.uid}`, JSON.stringify(updatedData));
                    }
                  }
                  
                  // Move to next step (accept/reject)
                  setCurrentStep(4);
                }}
                className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-medium rounded-lg 
                         transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                         shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Continue to Generated Content
              </button>
            </div>
          </div>
        );
      
      case 4: // Accept & Reject Generations step
        return (
          <div className="step-content max-w-4xl mx-auto mt-8 px-8 py-10 bg-theme-background rounded-xl shadow-xl">
            {!showSuccess ? (
              <>
                <h3 className="text-2xl font-bold text-theme-foreground mb-6 text-center">Review Generated Content</h3>
                <p className="text-gray-600 dark:text-gray-300 text-center mb-8">
                  Review and manage the generated content for your campaign. Accept, reject, modify or regenerate each piece.
                </p>
                
                {/* Table of generations */}
                <div className="overflow-hidden">
                  {swiggyImages.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">No images available to display.</p>
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-2">Found {swiggyImages.length} images to display.</p>
                  )}
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed bg-white dark:bg-gray-900 rounded-lg shadow">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-2/3">
                          Generations
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-1/3">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {swiggyImages.map((image, index) => (
                        <tr key={index} className={acceptedImages.includes(image) ? 'bg-green-50 dark:bg-green-900/20' : 
                              rejectedImages.includes(image) ? 'bg-red-50 dark:bg-red-900/20' : ''}>
                          <td className="px-6 py-8 border-b">
                            <div className="flex flex-col md:flex-row md:items-start gap-6">
                              <div className="flex-shrink-0 mb-4 md:mb-0 mx-auto md:mx-0">
                                <div className="w-full" style={{ maxWidth: '240px' }}>
                                  <SafeImage
                                    src={image}
                                    alt={`Generation ${index + 1}`}
                                    width={240}
                                    height={240}
                                    className="rounded-lg"
                                    style={{ 
                                      objectFit: 'contain', 
                                      width: '100%', 
                                      height: 'auto',
                                      maxHeight: '240px',
                                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                                    }}
                                    priority={index < 4} // This will be safely handled now
                                  />
                                </div>
                              </div>
                              <div className="md:mt-1">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  Generation {index + 1}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                  {acceptedImages.includes(image) ? 'Accepted' : 
                                   rejectedImages.includes(image) ? 'Rejected' : 'Pending review'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => {
                                  setAcceptedImages(prev => {
                                    if (prev.includes(image)) {
                                      return prev.filter(img => img !== image);
                                    } else {
                                      setRejectedImages(prev => prev.filter(img => img !== image));
                                      return [...prev, image];
                                    }
                                  });
                                }}
                                className={`px-3 py-2 text-xs font-medium rounded-md ${
                                  acceptedImages.includes(image) 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' 
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-green-100 hover:text-green-800 dark:hover:bg-green-800 dark:hover:text-green-100'
                                }`}
                              >
                                {acceptedImages.includes(image) ? 'Accepted' : 'Accept'}
                              </button>
                              
                              <button
                                onClick={() => {
                                  setRejectedImages(prev => {
                                    if (prev.includes(image)) {
                                      return prev.filter(img => img !== image);
                                    } else {
                                      setAcceptedImages(prev => prev.filter(img => img !== image));
                                      return [...prev, image];
                                    }
                                  });
                                }}
                                className={`px-3 py-2 text-xs font-medium rounded-md ${
                                  rejectedImages.includes(image)
                                    ? 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-red-100 hover:text-red-800 dark:hover:bg-red-800 dark:hover:text-red-100'
                                }`}
                              >
                                {rejectedImages.includes(image) ? 'Rejected' : 'Reject'}
                              </button>
                              
                              <button
                                className="px-3 py-2 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-blue-100 hover:text-blue-800 dark:hover:bg-blue-800 dark:hover:text-blue-100 rounded-md"
                              >
                                Modify
                              </button>
                              
                              <button
                                className="px-3 py-2 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-purple-100 hover:text-purple-800 dark:hover:bg-purple-800 dark:hover:text-purple-100 rounded-md"
                              >
                                Re-generate
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Publish button */}
                <div className="mt-8 flex justify-center">
                  <button 
                    onClick={() => {
                      // Show success message after publish
                      setIsPublished(true);
                      setShowSuccess(true);
                      
                      // Save accept/reject data
                      if (user) {
                        const updatedData = {
                          ...JSON.parse(localStorage.getItem(`enterprise_${user.uid}`) || '{}'),
                          acceptedImages,
                          rejectedImages,
                          isPublished: true,
                          currentStep: 4
                        };
                        localStorage.setItem(`enterprise_${user.uid}`, JSON.stringify(updatedData));
                      }
                    }}
                    className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white text-lg font-medium rounded-lg 
                           transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500
                           shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                    disabled={acceptedImages.length === 0}
                  >
                    Publish
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-16">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30">
                  <svg className="h-10 w-10 text-green-500 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-6 text-2xl font-semibold text-theme-foreground">Successfully Published!</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-300">
                  Your content has been published successfully and is now live.
                </p>
                <div className="mt-8">
                  <button
                    onClick={() => {
                      // Reset to first step for a new campaign
                      setCurrentStep(0);
                      setShowSuccess(false);
                      setIsPublished(false);
                      setAcceptedImages([]);
                      setRejectedImages([]);
                    }}
                    className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg 
                             transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Create New Campaign
                  </button>
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-theme-background text-theme-foreground">
      {/* Navbar */}
      <div className="w-full bg-theme-background border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-bold text-theme-foreground">
              GoLoco
            </Link>
            <div className="ml-8 hidden md:flex space-x-6">
              <Link href="/my-creations" className="text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400">
                My Creations
              </Link>
              <Link href="/enterprise" className="text-orange-500 dark:text-orange-400 font-medium">
                Enterprise
              </Link>
              <Link href="/pricing" className="text-gray-600 dark:text-gray-300 hover:text-orange-500 dark:hover:text-orange-400">
                Pricing
              </Link>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <ThemeToggle isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
            {user && <UserDropdown />}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 flex-grow bg-theme-background">
        {/* Always show the stepped process regardless of companyData */}
        <div>
          {/* Steps Timeline */}
          <div className="max-w-4xl mx-auto mb-12 pt-6">
            <div className="flex items-center justify-between px-4">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex flex-col items-center relative flex-1">
                  {/* Connecting Line */}
                  {index < STEPS.length - 1 && (
                    <div className={`absolute top-3 w-full h-1 step-line ${
                      index < currentStep ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'
                    }`} style={{ right: '-50%', zIndex: 0 }}></div>
                  )}
                  
                  {/* Circle */}
                  <div className={`step-circle z-10 rounded-full flex items-center justify-center ${
                    index < currentStep 
                      ? 'bg-orange-500 text-white' 
                      : index === currentStep 
                        ? 'bg-theme-background border-2 border-orange-500 text-orange-500' 
                        : 'bg-theme-background border-2 border-gray-400 text-gray-400'
                  }`}>
                    {index < currentStep ? (
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <span className="text-xs font-bold">{index + 1}</span>
                    )}
                  </div>
                  
                  {/* Label */}
                  <div className="mt-2 text-xs sm:text-sm text-center">
                    <span className={`font-medium ${
                      index <= currentStep ? 'text-orange-500 dark:text-orange-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Step Content */}
          {renderStepContent()}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="w-full bg-theme-background border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} GoLoco. All rights reserved.
            </div>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500">
                Terms of Service
              </a>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500">
                Privacy Policy
              </a>
              <a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-orange-500">
                Contact Us
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// Main export that wraps the content with NoSSR
export default function EnterprisePage() {
  return (
    <NoSSR fallback={
      <div className="min-h-screen flex items-center justify-center bg-theme-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    }>
      <EnterprisePageContent />
    </NoSSR>
  );
}
