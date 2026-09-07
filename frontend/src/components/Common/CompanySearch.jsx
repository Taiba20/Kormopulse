import React, { useState } from 'react';

const CompanySearch = ({ handleDropdown, width }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [companies] = useState([
    { name: 'Google', logo: 'https://logo.clearbit.com/google.com', domain: 'google.com' },
    { name: 'Microsoft', logo: 'https://logo.clearbit.com/microsoft.com', domain: 'microsoft.com' },
    { name: 'Amazon', logo: 'https://logo.clearbit.com/amazon.com', domain: 'amazon.com' },
    { name: 'Apple', logo: 'https://logo.clearbit.com/apple.com', domain: 'apple.com' },
    { name: 'Meta', logo: 'https://logo.clearbit.com/meta.com', domain: 'meta.com' },
    { name: 'Netflix', logo: 'https://logo.clearbit.com/netflix.com', domain: 'netflix.com' },
    { name: 'Tesla', logo: 'https://logo.clearbit.com/tesla.com', domain: 'tesla.com' },
    { name: 'Uber', logo: 'https://logo.clearbit.com/uber.com', domain: 'uber.com' },
  ]);

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCompanySelect = (company) => {
    handleDropdown(company);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${width}`}>
      <input
        type="text"
        placeholder="Search for company..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-3 text-base border border-neutral-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition duration-200 bg-background text-text-primary placeholder-text-secondary/60"
      />
      {searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          {filteredCompanies.map((company, index) => (
            <div
              key={index}
              className="flex items-center p-4 hover:bg-primary/5 cursor-pointer transition-colors border-b border-neutral-100 last:border-b-0"
              onClick={() => handleCompanySelect(company)}
            >
              <img
                src={company.logo}
                alt={company.name}
                className="w-10 h-10 rounded-full mr-4 border-2 border-primary/20"
                onError={(e) => {
                  e.target.src = 'https://photos.wellfound.com/startups/i/267839-22e9550a168c9834c67a3e55e2577688-medium_jpg.jpg?buster=1677467708';
                }}
              />
              <span className="text-text-primary font-medium">{company.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CompanySearch;