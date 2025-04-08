import React, { useState } from 'react';
import SummaryCard from './SummaryCard';
import { Link } from 'lucide-react';

const UrlSummaryTool = () => {
  const [url, setUrl] = useState('');
  const [submittedUrl, setSubmittedUrl] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic URL validation
    if (!url) {
      setError('Please enter a URL');
      return;
    }
    
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }
    
    setError('');
    setSubmittedUrl(url);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-4">
          <Link size={20} className="text-blue-600" />
          <h3 className="text-lg font-medium">Article Summary Tool</h3>
        </div>
        <p className="text-gray-600 text-sm mb-4">
          Get a quick summary of any news article. Just paste the URL below.
        </p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="flex-1 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Summarize
          </button>
        </form>
        
        {error && (
          <p className="text-red-600 text-sm mt-2">{error}</p>
        )}
      </div>
      
      {submittedUrl && (
        <div className="p-5">
          <SummaryCard url={submittedUrl} />
        </div>
      )}
    </div>
  );
};

export default UrlSummaryTool;
