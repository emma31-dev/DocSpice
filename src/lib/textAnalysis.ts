// Common stop words to filter out
const stopWords = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
  'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
  'above', 'below', 'between', 'among', 'this', 'that', 'these', 'those', 'i',
  'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours',
  'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers',
  'herself', 'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves',
  'what', 'which', 'who', 'whom', 'whose', 'this', 'that', 'these', 'those', 'am',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'having',
  'do', 'does', 'did', 'doing', 'will', 'would', 'could', 'should', 'may', 'might',
  'must', 'can', 'shall', 'very', 'really', 'just', 'too', 'only', 'now', 'then',
  'here', 'there', 'where', 'when', 'why', 'how', 'all', 'any', 'both', 'each',
  'few', 'more', 'most', 'other', 'some', 'such', 'than', 'so', 'also'
]);

export interface KeywordData {
  word: string;
  frequency: number;
  importance: number;
  context?: string;
}

export interface TextAnalysis {
  keywords: KeywordData[];
  themes: string[];
  entities: string[];
  sentences: string[];
}

export function extractKeywords(text: string, maxKeywords: number = 10): KeywordData[] {
  // Clean and prepare text
  const cleanText = text.toLowerCase().replace(/[^\w\s]/g, ' ');
  const words = cleanText.split(/\s+/).filter(word => 
    word.length > 2 && 
    !stopWords.has(word) &&
    !/^\d+$/.test(word) // Remove pure numbers
  );

  // Count word frequencies
  const wordFreq: { [key: string]: number } = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  // Calculate TF-IDF-like importance scores
  const totalWords = words.length;
  const uniqueWords = Object.keys(wordFreq).length;

  const keywords: KeywordData[] = Object.entries(wordFreq)
    .map(([word, freq]) => {
      const tf = freq / totalWords;
      const idf = Math.log(uniqueWords / (1 + freq)); // Inverse document frequency approximation
      const importance = tf * (1 + idf) * (word.length > 5 ? 1.2 : 1); // Boost longer words slightly
      
      return {
        word,
        frequency: freq,
        importance,
      };
    })
    .sort((a, b) => b.importance - a.importance)
    .slice(0, maxKeywords);

  return keywords;
}

export function extractEntities(text: string): string[] {
  // Simple named entity extraction using capitalization patterns
  const sentences = text.split(/[.!?]+/);
  const entities = new Set<string>();

  sentences.forEach(sentence => {
    // Look for capitalized words that aren't at the beginning of sentences
    const words = sentence.trim().split(/\s+/);
    words.forEach((word, index) => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (cleanWord.length > 2 && 
          /^[A-Z][a-z]+/.test(cleanWord) && 
          index > 0 && // Not the first word of the sentence
          !stopWords.has(cleanWord.toLowerCase())) {
        entities.add(cleanWord);
      }
    });

    // Look for multi-word proper nouns (consecutive capitalized words)
    let currentEntity = '';
    words.forEach(word => {
      const cleanWord = word.replace(/[^\w]/g, '');
      if (/^[A-Z][a-z]+/.test(cleanWord)) {
        currentEntity = currentEntity ? `${currentEntity} ${cleanWord}` : cleanWord;
      } else {
        if (currentEntity && currentEntity.includes(' ')) {
          entities.add(currentEntity);
        }
        currentEntity = '';
      }
    });
    
    if (currentEntity && currentEntity.includes(' ')) {
      entities.add(currentEntity);
    }
  });

  return Array.from(entities).slice(0, 5); // Limit to 5 entities
}

export function extractThemes(text: string, keywords: KeywordData[]): string[] {
  const themes: string[] = [];
  
  // Predefined theme categories with associated keywords
  const themeCategories = {
    'nature': ['tree', 'forest', 'mountain', 'river', 'ocean', 'sky', 'flower', 'animal', 'wildlife', 'landscape', 'sunset', 'sunrise'],
    'technology': ['computer', 'software', 'digital', 'internet', 'data', 'algorithm', 'artificial', 'intelligence', 'robot', 'innovation'],
    'business': ['company', 'market', 'finance', 'money', 'investment', 'strategy', 'growth', 'profit', 'economy', 'entrepreneur'],
    'health': ['medical', 'doctor', 'patient', 'treatment', 'medicine', 'hospital', 'fitness', 'nutrition', 'wellness', 'therapy'],
    'education': ['student', 'teacher', 'school', 'university', 'learning', 'knowledge', 'study', 'research', 'academic', 'course'],
    'travel': ['journey', 'destination', 'adventure', 'culture', 'country', 'city', 'explore', 'vacation', 'tourism', 'flight'],
    'food': ['cooking', 'recipe', 'restaurant', 'chef', 'ingredient', 'cuisine', 'meal', 'taste', 'flavor', 'dining'],
    'art': ['creative', 'design', 'painting', 'music', 'artist', 'gallery', 'exhibition', 'performance', 'cultural', 'aesthetic']
  };

  const textLower = text.toLowerCase();
  const keywordWords = keywords.map(k => k.word);

  Object.entries(themeCategories).forEach(([theme, themeWords]) => {
    const matches = themeWords.filter(word => 
      textLower.includes(word) || keywordWords.includes(word)
    );
    
    if (matches.length >= 2) {
      themes.push(theme);
    }
  });

  return themes.slice(0, 3); // Limit to 3 themes
}

export function analyzeText(text: string): TextAnalysis {
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const keywords = extractKeywords(text);
  const entities = extractEntities(text);
  const themes = extractThemes(text, keywords);

  return {
    keywords,
    themes,
    entities,
    sentences: sentences.slice(0, 10), // Limit to first 10 sentences
  };
}

export function generateImageSearchQueries(analysis: TextAnalysis): string[] {
  const queries: string[] = [];
  
  // Add top keywords
  analysis.keywords.slice(0, 3).forEach(keyword => {
    queries.push(keyword.word);
  });
  
  // Add themes
  analysis.themes.forEach(theme => {
    queries.push(theme);
  });
  
  // Add entities
  analysis.entities.slice(0, 2).forEach(entity => {
    queries.push(entity);
  });
  
  // Create combination queries for better results
  if (analysis.keywords.length >= 2) {
    const topKeywords = analysis.keywords.slice(0, 2).map(k => k.word);
    queries.push(topKeywords.join(' '));
  }
  
  if (analysis.themes.length >= 1 && analysis.keywords.length >= 1) {
    queries.push(`${analysis.themes[0]} ${analysis.keywords[0].word}`);
  }

  // Remove duplicates and return unique queries
  return [...new Set(queries)].slice(0, 6); // Limit to 6 queries
}