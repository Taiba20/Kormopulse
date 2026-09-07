import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { contentService } from "../services/contentService";

function Companies() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Helper function to format address
  const formatAddress = (address) => {
    if (!address) return '';
    if (typeof address === 'string') return address;
    
    const parts = [];
    if (address.city) parts.push(address.city);
    if (address.state) parts.push(address.state);
    if (address.country) parts.push(address.country);
    return parts.join(', ');
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await contentService.getCompanies();
      console.log('Companies response:', response);
      
      // Ensure response is an array
      if (Array.isArray(response)) {
        setCompanies(response);
      } else if (response && Array.isArray(response.companies)) {
        setCompanies(response.companies);
      } else {
        setCompanies([]);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch companies');
      setCompanies([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyClick = (companyId) => {
    // Navigate to jobs filtered by this company
    navigate(`/jobs?company=${companyId}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-error">Error loading companies: {error}</p>
        <button 
          onClick={fetchCompanies}
          className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="pt-16"> {/* Add padding-top to account for fixed navbar */}
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Companies</h1>
          <p className="text-neutral-600">Discover companies that are actively hiring</p>
        </div>

      {companies.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-neutral-500 mb-4">
            <i className="fas fa-building text-6xl mb-4"></i>
            <p className="text-xl">No companies found</p>
            <p className="text-sm">Companies will appear here once they complete their onboarding.</p>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <p className="text-neutral-600">{companies.length} companies found</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <div
                key={company._id}
                onClick={() => handleCompanyClick(company._id)}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-neutral-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    {company.companyLogo ? (
                      <img
                        src={company.companyLogo}
                        alt={`${company.companyName} logo`}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-neutral-100 rounded-lg flex items-center justify-center">
                        <i className="fas fa-building text-neutral-400 text-2xl"></i>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-medium text-neutral-900 truncate">
                      {company.companyName}
                    </h3>
                    
                    {company.industry && (
                      <p className="text-sm text-neutral-600 mb-2">{company.industry}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-neutral-500">
                        {company.jobCount || 0} active jobs
                      </div>
                      
                      {company.companySize && (
                        <div className="text-sm text-neutral-500">
                          {company.companySize.from}-{company.companySize.to} employees
                        </div>
                      )}
                    </div>
                    
                    {company.address && (
                      <div className="text-sm text-neutral-500 mt-1">
                        <i className="fas fa-map-marker-alt mr-1"></i>
                        {formatAddress(company.address)}
                      </div>
                    )}
                    
                    {company.companyWebsite && (
                      <div className="text-sm text-primary mt-2">
                        <i className="fas fa-external-link-alt mr-1"></i>
                        Website
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Social profiles */}
                {company.companySocialProfiles && Object.keys(company.companySocialProfiles).length > 0 && (
                  <div className="mt-4 flex space-x-2">
                    {company.companySocialProfiles.linkedin && (
                      <a
                        href={company.companySocialProfiles.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:text-primary-dark"
                      >
                        <i className="fab fa-linkedin text-lg"></i>
                      </a>
                    )}
                    {company.companySocialProfiles.twitter && (
                      <a
                        href={company.companySocialProfiles.twitter}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary/70 hover:text-primary"
                      >
                        <i className="fab fa-twitter text-lg"></i>
                      </a>
                    )}
                    {company.companySocialProfiles.facebook && (
                      <a
                        href={company.companySocialProfiles.facebook}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-primary hover:text-primary-dark"
                      >
                        <i className="fab fa-facebook text-lg"></i>
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  );
}

export default Companies;