import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Copy, Check } from 'lucide-react';
import { getSummaryFromUrl } from '../services/newsService';

const SummaryCard = ({ url }) => {
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchSummary = async () => {
      if (!url) return;
      
      try {
        setLoading(true);
        const summaryText = await getSummaryFromUrl(url);
        setSummary(summaryText);
        setError(null);
      } catch (err) {
        console.error('Error fetching summary:', err);
        setError('Failed to generate summary. Please try again later.');
        setSummary('');
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, [url]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-medium text-gray-900">TLDR Summary</h3>
          <div className="flex items-center space-x-2">
            {summary && (
              <button 
                onClick={copyToClipboard} 
                className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                title="Copy summary"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            )}
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="p-1 text-blue-600 hover:text-blue-800 transition-colors"
              title="View original article"
            >
              <ArrowUpRight size={16} />
            </a>
          </div>
        </div>
        
        {loading ? (
          <div className="animate-pulse flex flex-col space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        ) : error ? (
          <p className="text-red-600 text-sm">{error}</p>
        ) : (
          <div>
            <p className="text-gray-700 text-sm">{summary}</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800 hover:underline"
            >
              Read full article
            </a>
          </div>
        )}
      </div>
    </div>
  );
};

export default SummaryCard;
