"use client";
import React, { useState } from "react";
import { useAuth } from "@/lib/auth";

// List of industries for the dropdown
const industries = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "Manufacturing",
  "Retail",
  "Media & Entertainment",
  "Real Estate",
  "Transportation & Logistics",
  "Energy & Utilities",
  "Food & Beverage",
  "Hospitality & Tourism",
  "Construction",
  "Agriculture",
  "Consulting",
  "Other"
];

// Company size options
const companySizes = [
  "1-10 employees",
  "11-50 employees",
  "51-200 employees",
  "201-500 employees",
  "501-1000 employees",
  "1000+ employees"
];

interface EnterpriseOnboardingProps {
  onComplete: (data: any) => void;
}

export default function EnterpriseOnboarding({ onComplete }: EnterpriseOnboardingProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: "",
    companyWebsite: "",
    industry: "",
    companySize: "",
    companyDescription: "",
    primaryColor: "#3b82f6", // Default blue color
    secondaryColor: "#10b981" // Default green color
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validateStep = (currentStep: number) => {
    const newErrors: Record<string, string> = {};
    
    if (currentStep === 1) {
      if (!formData.companyName.trim()) {
        newErrors.companyName = "Company name is required";
      }
      
      if (formData.companyWebsite) {
        try {
          new URL(formData.companyWebsite.startsWith('http') ? formData.companyWebsite : `https://${formData.companyWebsite}`);
        } catch (err) {
          newErrors.companyWebsite = "Please enter a valid URL";
        }
      }
    }
    
    if (currentStep === 2) {
      if (!formData.industry) {
        newErrors.industry = "Please select an industry";
      }
      
      if (!formData.companySize) {
        newErrors.companySize = "Please select your company size";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) return;
    
    setIsSubmitting(true);
    
    try {
      // In a real implementation, you would save this data to Firebase
      // For now we'll just pass it to the parent component
      onComplete({
        ...formData,
        userId: user?.uid,
        userEmail: user?.email,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error submitting enterprise data:", error);
      setErrors({
        submit: "There was an error processing your request. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white dark:bg-black rounded-lg shadow-md p-6 border dark:border-gray-800">
      <h1 className="text-3xl font-bold text-center mb-4 text-gray-900 dark:text-white">Enterprise Onboarding</h1>
      
      <p className="text-center text-gray-600 dark:text-gray-300 mb-6">
        Join leading companies transforming their visual content workflow
      </p>
      
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {[1, 2, 3].map((stepNumber) => (
            <div key={stepNumber} className="flex flex-col items-center">
              <div 
                className={`w-10 h-10 flex items-center justify-center rounded-full 
                ${step >= stepNumber ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
              >
                {stepNumber}
              </div>
              <div className="text-xs mt-2 text-gray-600 dark:text-gray-300">
                {stepNumber === 1 && "Company Details"}
                {stepNumber === 2 && "Industry & Size"}
                {stepNumber === 3 && "Branding"}
              </div>
            </div>
          ))}
        </div>
        <div className="relative h-2 bg-gray-200 dark:bg-gray-700 mt-4 rounded-full">
          <div 
            className="absolute top-0 left-0 h-full bg-blue-500 rounded-full transition-all duration-300"
            style={{ width: `${((step - 1) / 2) * 100}%` }}
          ></div>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium">
                Company Name*
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm 
                  ${errors.companyName ? 'border-red-500' : 'border-gray-300'} 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="Enter your company name"
              />
              {errors.companyName && (
                <p className="mt-1 text-sm text-red-500">{errors.companyName}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="companyWebsite" className="block text-sm font-medium">
                Company Website (optional)
              </label>
              <input
                type="text"
                id="companyWebsite"
                name="companyWebsite"
                value={formData.companyWebsite}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm 
                  ${errors.companyWebsite ? 'border-red-500' : 'border-gray-300'} 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                placeholder="https://www.yourcompany.com"
              />
              {errors.companyWebsite && (
                <p className="mt-1 text-sm text-red-500">{errors.companyWebsite}</p>
              )}
            </div>
            
            <div className="flex justify-end pt-4">
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="industry" className="block text-sm font-medium">
                Industry*
              </label>
              <select
                id="industry"
                name="industry"
                value={formData.industry}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm 
                  ${errors.industry ? 'border-red-500' : 'border-gray-300'} 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="">Select your industry</option>
                {industries.map((industry) => (
                  <option key={industry} value={industry}>
                    {industry}
                  </option>
                ))}
              </select>
              {errors.industry && (
                <p className="mt-1 text-sm text-red-500">{errors.industry}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="companySize" className="block text-sm font-medium">
                Company Size*
              </label>
              <select
                id="companySize"
                name="companySize"
                value={formData.companySize}
                onChange={handleInputChange}
                className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm 
                  ${errors.companySize ? 'border-red-500' : 'border-gray-300'} 
                  focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
              >
                <option value="">Select company size</option>
                {companySizes.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              {errors.companySize && (
                <p className="mt-1 text-sm text-red-500">{errors.companySize}</p>
              )}
            </div>
            
            <div>
              <label htmlFor="companyDescription" className="block text-sm font-medium">
                Company Description (optional)
              </label>
              <textarea
                id="companyDescription"
                name="companyDescription"
                value={formData.companyDescription}
                onChange={handleInputChange}
                rows={4}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Briefly describe what your company does..."
              />
            </div>
            
            <div className="flex justify-between pt-4">
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Back
              </button>
              <button
                type="button"
                onClick={nextStep}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Next Step
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label htmlFor="primaryColor" className="block text-sm font-medium">
                Primary Brand Color
              </label>
              <div className="flex mt-1">
                <input
                  type="color"
                  id="primaryColor"
                  name="primaryColor"
                  value={formData.primaryColor}
                  onChange={handleInputChange}
                  className="h-10 w-10"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={handleInputChange}
                  name="primaryColor"
                  className="ml-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div>
              <label htmlFor="secondaryColor" className="block text-sm font-medium">
                Secondary Brand Color
              </label>
              <div className="flex mt-1">
                <input
                  type="color"
                  id="secondaryColor"
                  name="secondaryColor"
                  value={formData.secondaryColor}
                  onChange={handleInputChange}
                  className="h-10 w-10"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={handleInputChange}
                  name="secondaryColor"
                  className="ml-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="font-medium text-lg">Preview</h3>
              <div className="mt-3 p-5 border rounded-lg">
                <div 
                  className="p-4 rounded-lg"
                  style={{ backgroundColor: formData.primaryColor, color: '#fff' }}
                >
                  <h2 className="text-xl font-bold">{formData.companyName || 'Your Company'}</h2>
                  <p>{formData.companyDescription || 'Your company description will appear here.'}</p>
                </div>
                
                <div className="mt-4 flex items-center space-x-4">
                  <button
                    type="button"
                    style={{ backgroundColor: formData.primaryColor }}
                    className="px-4 py-2 text-white rounded-md"
                  >
                    Primary Button
                  </button>
                  <button
                    type="button"
                    style={{ backgroundColor: formData.secondaryColor }}
                    className="px-4 py-2 text-white rounded-md"
                  >
                    Secondary Button
                  </button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between pt-6">
              <button
                type="button"
                onClick={prevStep}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  "Complete Setup"
                )}
              </button>
            </div>
            
            {errors.submit && (
              <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                {errors.submit}
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
