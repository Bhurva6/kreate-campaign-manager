"use client";
import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface CompanyData {
  companyName: string;
  companyWebsite?: string;
  industry: string;
  companySize: string;
  companyDescription?: string;
  primaryColor: string;
  secondaryColor: string;
  userId: string;
  userEmail?: string;
  createdAt: string;
}

interface EnterpriseDashboardProps {
  companyData: CompanyData;
}

export default function EnterpriseDashboard({ companyData }: EnterpriseDashboardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview" | "brandKit" | "settings">("overview");
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [editData, setEditData] = useState(companyData);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditData({ ...editData, [name]: value });
  };

  const saveChanges = () => {
    // In a real implementation, this would update the data in Firebase
    // For now, we'll just update localStorage
    localStorage.setItem(`enterprise_${user?.uid}`, JSON.stringify(editData));
    setIsEditingCompany(false);
    
    // Force a refresh of the page to show updated data
    router.refresh();
  };

  const resetOnboarding = () => {
    if (confirm("Are you sure you want to reset your onboarding? This will delete all your company data.")) {
      localStorage.removeItem(`enterprise_${user?.uid}`);
      router.refresh();
    }
  };

  return (
    <div>
      {/* Header with company name and branding */}
      <div 
        className="p-6 rounded-lg mb-6 text-white"
        style={{ backgroundColor: companyData.primaryColor }}
      >
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">{companyData.companyName}</h1>
          <div className="flex space-x-3">
            <button 
              onClick={() => setActiveTab("settings")} 
              className="px-4 py-2 bg-white bg-opacity-20 rounded-md hover:bg-opacity-30 transition"
            >
              Settings
            </button>
          </div>
        </div>
        {companyData.companyDescription && (
          <p className="mt-2 text-white text-opacity-90">{companyData.companyDescription}</p>
        )}
        {companyData.companyWebsite && (
          <a 
            href={companyData.companyWebsite.startsWith("http") ? companyData.companyWebsite : `https://${companyData.companyWebsite}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mt-3 text-white underline"
          >
            Visit Website
          </a>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab("overview")}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === "overview"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("brandKit")}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === "brandKit"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Brand Kit
          </button>
          <button
            onClick={() => setActiveTab("settings")}
            className={`py-4 px-1 font-medium text-sm border-b-2 ${
              activeTab === "settings"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            Settings
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
        {activeTab === "overview" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Company Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-3">Company Details</h3>
                <div className="space-y-3">
                  <div>
                    <span className="block text-sm text-gray-500">Company Name</span>
                    <span className="block mt-1">{companyData.companyName}</span>
                  </div>
                  
                  <div>
                    <span className="block text-sm text-gray-500">Industry</span>
                    <span className="block mt-1">{companyData.industry}</span>
                  </div>
                  
                  <div>
                    <span className="block text-sm text-gray-500">Company Size</span>
                    <span className="block mt-1">{companyData.companySize}</span>
                  </div>
                  
                  {companyData.companyWebsite && (
                    <div>
                      <span className="block text-sm text-gray-500">Website</span>
                      <a 
                        href={companyData.companyWebsite.startsWith("http") ? companyData.companyWebsite : `https://${companyData.companyWebsite}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block mt-1 text-blue-600 hover:underline"
                      >
                        {companyData.companyWebsite}
                      </a>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Activity</h3>
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md">
                  <p>Your company was registered on {new Date(companyData.createdAt).toLocaleDateString()}</p>
                  {/* In a real implementation, you would show recent activity here */}
                  <p className="mt-3">No recent activity.</p>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-3">Getting Started</h3>
                  <ul className="list-disc list-inside space-y-2">
                    <li>Complete your brand kit profile</li>
                    <li>Create your first image campaign</li>
                    <li>Invite team members to collaborate</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "brandKit" && (
          <div>
            <h2 className="text-2xl font-semibold mb-4">Brand Kit</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium mb-3">Brand Colors</h3>
                <div className="flex space-x-4 mb-6">
                  <div>
                    <div 
                      className="w-24 h-24 rounded-md"
                      style={{ backgroundColor: companyData.primaryColor }}
                    ></div>
                    <span className="block text-sm mt-2">Primary Color</span>
                    <span className="block text-xs text-gray-500">{companyData.primaryColor}</span>
                  </div>
                  
                  <div>
                    <div 
                      className="w-24 h-24 rounded-md"
                      style={{ backgroundColor: companyData.secondaryColor }}
                    ></div>
                    <span className="block text-sm mt-2">Secondary Color</span>
                    <span className="block text-xs text-gray-500">{companyData.secondaryColor}</span>
                  </div>
                </div>
                
                <h3 className="text-lg font-medium mb-3 mt-8">Color Palette</h3>
                <div className="flex space-x-2 mb-6">
                  {[100, 200, 300, 400, 500, 600, 700, 800].map((shade) => (
                    <div key={shade}>
                      <div 
                        className="w-10 h-10 rounded"
                        style={{ 
                          backgroundColor: companyData.primaryColor,
                          opacity: shade / 1000
                        }}
                      ></div>
                      <span className="block text-xs text-center mt-1">{shade}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-3">Brand Preview</h3>
                <div className="border rounded-lg p-4">
                  <div 
                    className="p-4 rounded-md mb-4"
                    style={{ backgroundColor: companyData.primaryColor }}
                  >
                    <h4 className="text-xl font-bold text-white">{companyData.companyName}</h4>
                    {companyData.companyDescription && (
                      <p className="text-white text-opacity-90 mt-2">{companyData.companyDescription}</p>
                    )}
                  </div>
                  
                  <div className="mb-4">
                    <h5 className="font-medium mb-2">Buttons</h5>
                    <div className="flex flex-wrap gap-4">
                      <button
                        className="px-4 py-2 rounded text-white"
                        style={{ backgroundColor: companyData.primaryColor }}
                      >
                        Primary Button
                      </button>
                      
                      <button
                        className="px-4 py-2 rounded text-white"
                        style={{ backgroundColor: companyData.secondaryColor }}
                      >
                        Secondary Button
                      </button>
                      
                      <button
                        className="px-4 py-2 rounded border"
                        style={{ 
                          borderColor: companyData.primaryColor,
                          color: companyData.primaryColor
                        }}
                      >
                        Outline Button
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Cards</h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="border rounded-md p-3">
                        <div 
                          className="h-2 w-full mb-2 rounded"
                          style={{ backgroundColor: companyData.primaryColor }}
                        ></div>
                        <h6 className="font-medium">Card Title</h6>
                        <p className="text-sm text-gray-600">This is a sample card with your brand colors.</p>
                      </div>
                      
                      <div className="border rounded-md p-3">
                        <div 
                          className="h-2 w-full mb-2 rounded"
                          style={{ backgroundColor: companyData.secondaryColor }}
                        ></div>
                        <h6 className="font-medium">Card Title</h6>
                        <p className="text-sm text-gray-600">This is a sample card with your brand colors.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 border-t pt-6">
              <h3 className="text-lg font-medium mb-3">Brand Images</h3>
              <div className="bg-gray-50 dark:bg-gray-700 p-8 rounded-lg text-center">
                <p className="mb-4">Upload your brand logo and images to enhance your brand kit.</p>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Upload Images
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div>
            <h2 className="text-2xl font-semibold mb-6">Company Settings</h2>
            
            {isEditingCompany ? (
              <div className="border rounded-lg p-6">
                <h3 className="text-lg font-medium mb-4">Edit Company Details</h3>
                
                <div className="space-y-4">
                  <div>
                    <label htmlFor="edit-companyName" className="block text-sm font-medium">
                      Company Name
                    </label>
                    <input
                      type="text"
                      id="edit-companyName"
                      name="companyName"
                      value={editData.companyName}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-companyWebsite" className="block text-sm font-medium">
                      Company Website
                    </label>
                    <input
                      type="text"
                      id="edit-companyWebsite"
                      name="companyWebsite"
                      value={editData.companyWebsite || ""}
                      onChange={handleInputChange}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="edit-companyDescription" className="block text-sm font-medium">
                      Company Description
                    </label>
                    <textarea
                      id="edit-companyDescription"
                      name="companyDescription"
                      value={editData.companyDescription || ""}
                      onChange={handleInputChange}
                      rows={4}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="edit-primaryColor" className="block text-sm font-medium">
                        Primary Color
                      </label>
                      <div className="flex mt-1">
                        <input
                          type="color"
                          id="edit-primaryColor"
                          name="primaryColor"
                          value={editData.primaryColor}
                          onChange={handleInputChange}
                          className="h-10 w-10"
                        />
                        <input
                          type="text"
                          value={editData.primaryColor}
                          onChange={handleInputChange}
                          name="primaryColor"
                          className="ml-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="edit-secondaryColor" className="block text-sm font-medium">
                        Secondary Color
                      </label>
                      <div className="flex mt-1">
                        <input
                          type="color"
                          id="edit-secondaryColor"
                          name="secondaryColor"
                          value={editData.secondaryColor}
                          onChange={handleInputChange}
                          className="h-10 w-10"
                        />
                        <input
                          type="text"
                          value={editData.secondaryColor}
                          onChange={handleInputChange}
                          name="secondaryColor"
                          className="ml-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsEditingCompany(false)}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveChanges}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border rounded-lg p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Company Details</h3>
                    <button
                      onClick={() => setIsEditingCompany(true)}
                      className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
                    >
                      Edit
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div>
                        <span className="block text-sm text-gray-500">Company Name</span>
                        <span className="block mt-1">{companyData.companyName}</span>
                      </div>
                      
                      <div>
                        <span className="block text-sm text-gray-500">Industry</span>
                        <span className="block mt-1">{companyData.industry}</span>
                      </div>
                      
                      <div>
                        <span className="block text-sm text-gray-500">Company Size</span>
                        <span className="block mt-1">{companyData.companySize}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      {companyData.companyWebsite && (
                        <div>
                          <span className="block text-sm text-gray-500">Website</span>
                          <a 
                            href={companyData.companyWebsite.startsWith("http") ? companyData.companyWebsite : `https://${companyData.companyWebsite}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block mt-1 text-blue-600 hover:underline"
                          >
                            {companyData.companyWebsite}
                          </a>
                        </div>
                      )}
                      
                      {companyData.companyDescription && (
                        <div>
                          <span className="block text-sm text-gray-500">Description</span>
                          <span className="block mt-1">{companyData.companyDescription}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="border rounded-lg p-6 bg-red-50">
                  <h3 className="text-lg font-medium text-red-800 mb-3">Danger Zone</h3>
                  <p className="mb-4 text-red-700">
                    These actions cannot be undone. Please proceed with caution.
                  </p>
                  <button
                    onClick={resetOnboarding}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Reset Onboarding
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
