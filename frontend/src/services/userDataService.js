/**
 * User Data Service
 * 
 * Handles user data like saved articles and reading history using localStorage.
 * This is a client-side solution since we might not have a fully functioning backend user system.
 */

// Keys for localStorage
const SAVED_ARTICLES_KEY = 'news_recommendation_saved_articles';
const READING_HISTORY_KEY = 'news_recommendation_reading_history';

// Maximum number of reading history items to keep
const MAX_HISTORY_ITEMS = 50;

/**
 * Get all saved articles
 */
export const getSavedArticles = () => {
  try {
    const savedArticles = localStorage.getItem(SAVED_ARTICLES_KEY);
    return savedArticles ? JSON.parse(savedArticles) : [];
  } catch (error) {
    console.error('Error retrieving saved articles:', error);
    return [];
  }
};

/**
 * Save an article to localStorage
 * @param {Object} article - The article to save
 */
export const saveArticle = (article) => {
  try {
    if (!article || !article.id) {
      throw new Error('Invalid article data');
    }
    
    const savedArticles = getSavedArticles();
    
    // Check if article is already saved
    if (savedArticles.some(a => a.id === article.id)) {
      return { success: true, message: 'Article already saved' };
    }
    
    // Add saved timestamp
    const articleToSave = {
      ...article,
      savedAt: new Date().toISOString()
    };
    
    // Add to saved articles
    savedArticles.unshift(articleToSave);
    localStorage.setItem(SAVED_ARTICLES_KEY, JSON.stringify(savedArticles));
    
    return { success: true, message: 'Article saved successfully' };
  } catch (error) {
    console.error('Error saving article:', error);
    return { success: false, message: error.message || 'Failed to save article' };
  }
};

/**
 * Remove a saved article
 * @param {string} articleId - ID of the article to remove
 */
export const removeSavedArticle = (articleId) => {
  try {
    if (!articleId) {
      throw new Error('Article ID is required');
    }
    
    const savedArticles = getSavedArticles();
    const updatedArticles = savedArticles.filter(article => article.id !== articleId);
    
    localStorage.setItem(SAVED_ARTICLES_KEY, JSON.stringify(updatedArticles));
    
    return { success: true, message: 'Article removed successfully' };
  } catch (error) {
    console.error('Error removing saved article:', error);
    return { success: false, message: error.message || 'Failed to remove article' };
  }
};

/**
 * Check if an article is saved
 * @param {string} articleId - ID of the article to check
 */
export const isArticleSaved = (articleId) => {
  if (!articleId) return false;
  
  const savedArticles = getSavedArticles();
  return savedArticles.some(article => article.id === articleId);
};

/**
 * Get reading history
 */
export const getReadingHistory = () => {
  try {
    const readingHistory = localStorage.getItem(READING_HISTORY_KEY);
    return readingHistory ? JSON.parse(readingHistory) : [];
  } catch (error) {
    console.error('Error retrieving reading history:', error);
    return [];
  }
};

/**
 * Add article to reading history
 * @param {Object} article - The article to add to history
 */
export const addToReadingHistory = (article) => {
  try {
    if (!article || !article.id) {
      throw new Error('Invalid article data');
    }
    
    const readingHistory = getReadingHistory();
    
    // Remove this article if it's already in history (to avoid duplicates)
    const filteredHistory = readingHistory.filter(a => a.id !== article.id);
    
    // Add read timestamp
    const articleWithTimestamp = {
      ...article,
      readAt: new Date().toISOString()
    };
    
    // Add to beginning of array
    filteredHistory.unshift(articleWithTimestamp);
    
    // Limit history size
    const limitedHistory = filteredHistory.slice(0, MAX_HISTORY_ITEMS);
    
    localStorage.setItem(READING_HISTORY_KEY, JSON.stringify(limitedHistory));
    
    return { success: true, message: 'Added to reading history' };
  } catch (error) {
    console.error('Error adding to reading history:', error);
    return { success: false, message: error.message || 'Failed to update reading history' };
  }
};

/**
 * Clear reading history
 */
export const clearReadingHistory = () => {
  try {
    localStorage.removeItem(READING_HISTORY_KEY);
    return { success: true, message: 'Reading history cleared' };
  } catch (error) {
    console.error('Error clearing reading history:', error);
    return { success: false, message: error.message || 'Failed to clear reading history' };
  }
};
