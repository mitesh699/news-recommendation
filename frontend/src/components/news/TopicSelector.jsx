import React, { useState } from 'react';

const TopicSelector = ({ topics, onSelectTopic }) => {
  const [selectedTopic, setSelectedTopic] = useState(null);

  const handleTopicClick = (topicId) => {
    setSelectedTopic(topicId);
    onSelectTopic(topicId);
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex space-x-3 min-w-max">
        {topics.map((topic) => (
          <button
            key={topic.id}
            onClick={() => handleTopicClick(topic.id)}
            className={`
              flex items-center px-5 py-3 rounded-full transition-all
              ${selectedTopic === topic.id 
                ? 'bg-blue-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }
            `}
          >
            <span className="mr-2">{topic.icon}</span>
            <span className="font-medium">{topic.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TopicSelector;