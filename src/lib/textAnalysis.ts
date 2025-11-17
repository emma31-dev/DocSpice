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

// New interfaces for improved query generation
export interface QueryGenerationConfig {
  weights: {
    keywordImportance: number;
    themeStrength: number;
    querySpecificity: number;
  };
  thresholds: {
    minRelevanceScore: number;
    maxQueries: number;
    minQueryWords: number;
  };
  genericTerms: string[];
  visualDescriptors: {
    colors: string[];
    moods: string[];
    settings: string[];
    lighting: string[];
  };
  contentTypeWeights: {
    narrative: number;
    technical: number;
    descriptive: number;
  };
}

export interface SearchQuery {
  query: string;
  relevanceScore: number;
  strategy: 'keyword' | 'theme' | 'entity' | 'combined' | 'contextual';
  components: {
    keywords?: string[];
    themes?: string[];
    entities?: string[];
    descriptors?: string[];
  };
}

export interface ContentTypeAnalysis {
  type: 'narrative' | 'technical' | 'descriptive' | 'mixed';
  confidence: number;
  indicators: {
    narrativeScore: number;
    technicalScore: number;
    descriptiveScore: number;
  };
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

// Configuration constants for improved query generation
export const DEFAULT_GENERIC_TERMS = [
  'thing', 'stuff', 'item', 'object', 'place', 'area', 'way', 'time',
  'person', 'people', 'work', 'life', 'world', 'day', 'year', 'part',
  'number', 'group', 'problem', 'fact', 'hand', 'eye', 'case', 'point'
];

export const DEFAULT_VISUAL_DESCRIPTORS = {
  colors: ['vibrant', 'muted', 'warm', 'cool', 'bright', 'dark', 'colorful', 'monochrome'],
  moods: ['peaceful', 'dramatic', 'energetic', 'calm', 'mysterious', 'serene', 'dynamic', 'contemplative'],
  settings: ['natural', 'urban', 'indoor', 'outdoor', 'minimal', 'rustic', 'modern', 'vintage'],
  lighting: ['sunset', 'sunrise', 'golden hour', 'soft light', 'dramatic light', 'natural light', 'backlit', 'silhouette']
};

export const DEFAULT_CONFIG: QueryGenerationConfig = {
  weights: {
    keywordImportance: 0.4,
    themeStrength: 0.3,
    querySpecificity: 0.3,
  },
  thresholds: {
    minRelevanceScore: 0.3,
    maxQueries: 8,
    minQueryWords: 2,
  },
  genericTerms: DEFAULT_GENERIC_TERMS,
  visualDescriptors: DEFAULT_VISUAL_DESCRIPTORS,
  contentTypeWeights: {
    narrative: 0.33,
    technical: 0.33,
    descriptive: 0.34,
  },
};

// Content type detection
export function detectContentType(analysis: TextAnalysis): ContentTypeAnalysis {
  const { keywords, sentences } = analysis;
  const fullText = sentences.join(' ').toLowerCase();
  
  // Narrative indicators
  const pastTensePatterns = /\b(was|were|had|did|went|came|saw|felt|thought|said|told|walked|ran|looked)\b/g;
  const emotionalAdjectives = /\b(happy|sad|angry|lonely|peaceful|anxious|excited|worried|joyful|fearful|hopeful|desperate)\b/g;
  const dialogueMarkers = /"[^"]*"|'[^']*'/g;
  
  const pastTenseMatches = (fullText.match(pastTensePatterns) || []).length;
  const emotionalMatches = (fullText.match(emotionalAdjectives) || []).length;
  const dialogueMatches = (fullText.match(dialogueMarkers) || []).length;
  const hasEntities = analysis.entities.length > 0;
  
  const narrativeScore = Math.min(1, (
    (pastTenseMatches / Math.max(1, sentences.length)) * 0.4 +
    (emotionalMatches / Math.max(1, sentences.length)) * 0.3 +
    (dialogueMatches / Math.max(1, sentences.length)) * 0.2 +
    (hasEntities ? 0.1 : 0)
  ));
  
  // Technical indicators
  const presentTensePatterns = /\b(is|are|can|will|should|must|enables|provides|allows|supports|implements)\b/g;
  const technicalTerms = /\b(system|process|method|function|algorithm|data|software|hardware|interface|protocol|framework|architecture)\b/g;
  const abstractConcepts = /\b(concept|principle|theory|approach|methodology|strategy|optimization|efficiency|performance)\b/g;
  
  const presentTenseMatches = (fullText.match(presentTensePatterns) || []).length;
  const technicalMatches = (fullText.match(technicalTerms) || []).length;
  const abstractMatches = (fullText.match(abstractConcepts) || []).length;
  
  const technicalScore = Math.min(1, (
    (presentTenseMatches / Math.max(1, sentences.length)) * 0.3 +
    (technicalMatches / Math.max(1, sentences.length)) * 0.4 +
    (abstractMatches / Math.max(1, sentences.length)) * 0.3
  ));
  
  // Descriptive indicators
  const sensoryWords = /\b(bright|dark|soft|rough|smooth|loud|quiet|warm|cold|sweet|bitter|fragrant|colorful|vivid)\b/g;
  const measurements = /\b\d+\s*(feet|meters|inches|cm|mm|miles|km|pounds|kg|degrees|celsius|fahrenheit)\b/g;
  const locationWords = /\b(above|below|beside|near|far|left|right|front|back|top|bottom|inside|outside|north|south|east|west)\b/g;
  
  const sensoryMatches = (fullText.match(sensoryWords) || []).length;
  const measurementMatches = (fullText.match(measurements) || []).length;
  const locationMatches = (fullText.match(locationWords) || []).length;
  
  // Calculate adjective-to-noun ratio (approximate)
  const adjectivePatterns = /\b(beautiful|large|small|old|new|good|bad|great|little|long|short|high|low|big|young)\b/g;
  const adjectiveMatches = (fullText.match(adjectivePatterns) || []).length;
  const nounCount = keywords.length;
  const adjectiveRatio = nounCount > 0 ? adjectiveMatches / nounCount : 0;
  
  const descriptiveScore = Math.min(1, (
    (sensoryMatches / Math.max(1, sentences.length)) * 0.3 +
    (measurementMatches / Math.max(1, sentences.length)) * 0.2 +
    (locationMatches / Math.max(1, sentences.length)) * 0.2 +
    Math.min(0.3, adjectiveRatio * 0.3)
  ));
  
  // Determine primary content type
  const scores = {
    narrative: narrativeScore,
    technical: technicalScore,
    descriptive: descriptiveScore
  };
  
  const maxScore = Math.max(narrativeScore, technicalScore, descriptiveScore);
  const totalScore = narrativeScore + technicalScore + descriptiveScore;
  
  let type: 'narrative' | 'technical' | 'descriptive' | 'mixed';
  let confidence: number;
  
  if (maxScore < 0.3 || totalScore === 0) {
    type = 'mixed';
    confidence = 0.5;
  } else {
    confidence = maxScore / Math.max(0.01, totalScore);
    
    if (narrativeScore === maxScore) {
      type = 'narrative';
    } else if (technicalScore === maxScore) {
      type = 'technical';
    } else {
      type = 'descriptive';
    }
    
    // If scores are close, mark as mixed
    const secondMax = Object.values(scores).sort((a, b) => b - a)[1];
    if (maxScore - secondMax < 0.15) {
      type = 'mixed';
      confidence = 0.6;
    }
  }
  
  return {
    type,
    confidence,
    indicators: {
      narrativeScore,
      technicalScore,
      descriptiveScore
    }
  };
}

// Query construction helper functions
function getRandomDescriptor(descriptors: string[]): string {
  return descriptors[Math.floor(Math.random() * descriptors.length)];
}

export function buildEnhancedKeywordQuery(
  keyword: string,
  visualDescriptors: QueryGenerationConfig['visualDescriptors']
): string {
  const allDescriptors = [
    ...visualDescriptors.colors,
    ...visualDescriptors.moods,
    ...visualDescriptors.settings
  ];
  const descriptor = getRandomDescriptor(allDescriptors);
  return `${descriptor} ${keyword}`;
}

export function buildThemeKeywordQuery(theme: string, keyword: string): string {
  return `${theme} ${keyword}`;
}

export function buildEntityContextQuery(
  entity: string,
  context: string
): string {
  return `${entity} ${context}`;
}

export function buildDescriptiveQuery(
  keyword: string,
  descriptor: string,
  setting: string
): string {
  return `${descriptor} ${keyword} ${setting}`;
}

export function buildContextualQuery(
  keyword1: string,
  keyword2: string,
  descriptor: string
): string {
  return `${keyword1} ${keyword2} ${descriptor}`;
}

// Strategy-specific query generators
export function generateNarrativeQueries(
  analysis: TextAnalysis,
  config: QueryGenerationConfig
): SearchQuery[] {
  const queries: SearchQuery[] = [];
  const { keywords, themes, entities } = analysis;
  const { visualDescriptors } = config;
  
  // Emotional and atmospheric queries
  const emotionalDescriptors = [...visualDescriptors.moods, ...visualDescriptors.lighting];
  
  // Combine top keywords with emotional descriptors
  keywords.slice(0, 2).forEach(kw => {
    const descriptor = getRandomDescriptor(emotionalDescriptors);
    queries.push({
      query: `${descriptor} ${kw.word}`,
      relevanceScore: 0,
      strategy: 'contextual',
      components: {
        keywords: [kw.word],
        descriptors: [descriptor]
      }
    });
  });
  
  // Entity-based emotional queries
  if (entities.length > 0 && themes.length > 0) {
    const descriptor = getRandomDescriptor(visualDescriptors.moods);
    queries.push({
      query: `${descriptor} ${entities[0]} ${themes[0]}`,
      relevanceScore: 0,
      strategy: 'entity',
      components: {
        entities: [entities[0]],
        themes: [themes[0]],
        descriptors: [descriptor]
      }
    });
  }
  
  // Atmospheric theme queries
  themes.forEach(theme => {
    const lighting = getRandomDescriptor(visualDescriptors.lighting);
    queries.push({
      query: `${theme} ${lighting}`,
      relevanceScore: 0,
      strategy: 'theme',
      components: {
        themes: [theme],
        descriptors: [lighting]
      }
    });
  });
  
  return queries;
}

export function generateTechnicalQueries(
  analysis: TextAnalysis,
  config: QueryGenerationConfig
): SearchQuery[] {
  const queries: SearchQuery[] = [];
  const { keywords, themes } = analysis;
  const { visualDescriptors } = config;
  
  const professionalModifiers = ['modern', 'minimal', 'abstract', 'clean', 'professional', 'conceptual'];
  
  // Clean, professional keyword queries
  keywords.slice(0, 2).forEach(kw => {
    const modifier = professionalModifiers[Math.floor(Math.random() * professionalModifiers.length)];
    queries.push({
      query: `${modifier} ${kw.word}`,
      relevanceScore: 0,
      strategy: 'keyword',
      components: {
        keywords: [kw.word],
        descriptors: [modifier]
      }
    });
  });
  
  // Theme-based technical queries
  themes.forEach(theme => {
    const setting = visualDescriptors.settings.includes('minimal') ? 'minimal' : 'modern';
    queries.push({
      query: `${setting} ${theme}`,
      relevanceScore: 0,
      strategy: 'theme',
      components: {
        themes: [theme],
        descriptors: [setting]
      }
    });
  });
  
  // Abstract concept combinations
  if (keywords.length >= 2) {
    queries.push({
      query: `abstract ${keywords[0].word} ${keywords[1].word}`,
      relevanceScore: 0,
      strategy: 'combined',
      components: {
        keywords: [keywords[0].word, keywords[1].word],
        descriptors: ['abstract']
      }
    });
  }
  
  return queries;
}

export function generateDescriptiveQueries(
  analysis: TextAnalysis,
  config: QueryGenerationConfig
): SearchQuery[] {
  const queries: SearchQuery[] = [];
  const { keywords, themes, entities } = analysis;
  const { visualDescriptors } = config;
  
  // Specific object and scene queries with colors and settings
  keywords.slice(0, 3).forEach(kw => {
    const color = getRandomDescriptor(visualDescriptors.colors);
    const setting = getRandomDescriptor(visualDescriptors.settings);
    queries.push({
      query: `${color} ${kw.word} ${setting}`,
      relevanceScore: 0,
      strategy: 'contextual',
      components: {
        keywords: [kw.word],
        descriptors: [color, setting]
      }
    });
  });
  
  // Entity with setting
  if (entities.length > 0) {
    const setting = getRandomDescriptor(visualDescriptors.settings);
    queries.push({
      query: `${entities[0]} ${setting}`,
      relevanceScore: 0,
      strategy: 'entity',
      components: {
        entities: [entities[0]],
        descriptors: [setting]
      }
    });
  }
  
  // Theme with specific visual details
  themes.forEach(theme => {
    const color = getRandomDescriptor(visualDescriptors.colors);
    const lighting = getRandomDescriptor(visualDescriptors.lighting);
    queries.push({
      query: `${color} ${theme} ${lighting}`,
      relevanceScore: 0,
      strategy: 'theme',
      components: {
        themes: [theme],
        descriptors: [color, lighting]
      }
    });
  });
  
  return queries;
}

// Relevance scoring system
export function calculateRelevanceScore(
  searchQuery: SearchQuery,
  analysis: TextAnalysis,
  config: QueryGenerationConfig
): number {
  const { components } = searchQuery;
  const { weights } = config;
  
  // Calculate keyword importance (average importance of keywords in query)
  let keywordImportance = 0;
  if (components.keywords && components.keywords.length > 0) {
    const keywordScores = components.keywords.map(kw => {
      const found = analysis.keywords.find(k => k.word === kw);
      return found ? found.importance : 0;
    });
    keywordImportance = keywordScores.reduce((sum, score) => sum + score, 0) / keywordScores.length;
  }
  
  // Normalize keyword importance to 0-1 range (typical importance values are 0-0.5)
  keywordImportance = Math.min(1, keywordImportance * 2);
  
  // Calculate theme strength (ratio of matching themes)
  let themeStrength = 0;
  if (components.themes && components.themes.length > 0 && analysis.themes.length > 0) {
    const matchingThemes = components.themes.filter(t => analysis.themes.includes(t)).length;
    themeStrength = matchingThemes / analysis.themes.length;
  }
  
  // Calculate query specificity based on word count
  const wordCount = searchQuery.query.split(' ').length;
  const querySpecificity = Math.min(1, (wordCount - 1) / 4);
  
  // Apply weighted formula
  const relevanceScore = (
    keywordImportance * weights.keywordImportance +
    themeStrength * weights.themeStrength +
    querySpecificity * weights.querySpecificity
  );
  
  return Math.max(0, Math.min(1, relevanceScore));
}

// Query filtering and ranking logic
export function filterGenericQueries(
  queries: SearchQuery[],
  genericTerms: string[]
): SearchQuery[] {
  return queries.filter(sq => {
    const words = sq.query.toLowerCase().split(' ');
    
    // Exclude single-word queries that are generic
    if (words.length === 1 && genericTerms.includes(words[0])) {
      return false;
    }
    
    return true;
  });
}

export function enhanceGenericQuery(
  query: string,
  genericTerms: string[],
  visualDescriptors: QueryGenerationConfig['visualDescriptors']
): string {
  const words = query.toLowerCase().split(' ');
  const hasGeneric = words.some(w => genericTerms.includes(w));
  
  if (hasGeneric && words.length < 3) {
    // Add a descriptor to make it more specific
    const allDescriptors = [
      ...visualDescriptors.colors,
      ...visualDescriptors.moods,
      ...visualDescriptors.settings
    ];
    const descriptor = getRandomDescriptor(allDescriptors);
    return `${descriptor} ${query}`;
  }
  
  return query;
}

export function deduplicateQueries(queries: SearchQuery[]): SearchQuery[] {
  const seen = new Set<string>();
  return queries.filter(sq => {
    const normalized = sq.query.toLowerCase().trim();
    if (seen.has(normalized)) {
      return false;
    }
    seen.add(normalized);
    return true;
  });
}

// Main query optimizer
export function optimizeSearchQueries(
  queries: SearchQuery[],
  analysis: TextAnalysis,
  config: QueryGenerationConfig
): SearchQuery[] {
  // Calculate relevance scores for all queries
  const scoredQueries = queries.map(sq => ({
    ...sq,
    relevanceScore: calculateRelevanceScore(sq, analysis, config)
  }));
  
  // Filter out queries below minimum threshold
  const filtered = scoredQueries.filter(
    sq => sq.relevanceScore >= config.thresholds.minRelevanceScore
  );
  
  // Sort by relevance score (descending)
  filtered.sort((a, b) => {
    // Primary sort by relevance score
    if (Math.abs(a.relevanceScore - b.relevanceScore) > 0.1) {
      return b.relevanceScore - a.relevanceScore;
    }
    
    // Tie-breaking: prefer queries with more words (higher specificity)
    const aWordCount = a.query.split(' ').length;
    const bWordCount = b.query.split(' ').length;
    return bWordCount - aWordCount;
  });
  
  // Limit to maxQueries
  return filtered.slice(0, config.thresholds.maxQueries);
}

// Enhanced query generation function
export function generateOptimizedImageSearchQueries(
  analysis: TextAnalysis,
  customConfig?: Partial<QueryGenerationConfig>
): string[] {
  // Load and validate configuration
  const config = loadQueryConfig(customConfig);
  
  try {
    // Detect content type with error handling
    let contentType: ContentTypeAnalysis;
    try {
      contentType = detectContentType(analysis);
      console.log(`Detected content type: ${contentType.type} (confidence: ${contentType.confidence.toFixed(2)})`);
    } catch (error) {
      console.warn('Error detecting content type, defaulting to mixed:', error);
      contentType = {
        type: 'mixed',
        confidence: 0.5,
        indicators: { narrativeScore: 0.33, technicalScore: 0.33, descriptiveScore: 0.34 }
      };
    }
    
    // Generate queries using all strategies
    let allQueries: SearchQuery[] = [];
    
    // Generate strategy-specific queries based on content type
    const narrativeQueries = generateNarrativeQueries(analysis, config);
    const technicalQueries = generateTechnicalQueries(analysis, config);
    const descriptiveQueries = generateDescriptiveQueries(analysis, config);
    
    // Apply appropriate strategy based on content type (at least 60% from primary type)
    if (contentType.type === 'narrative') {
      allQueries = [
        ...narrativeQueries,
        ...technicalQueries.slice(0, Math.ceil(technicalQueries.length * 0.3)),
        ...descriptiveQueries.slice(0, Math.ceil(descriptiveQueries.length * 0.3))
      ];
    } else if (contentType.type === 'technical') {
      allQueries = [
        ...technicalQueries,
        ...narrativeQueries.slice(0, Math.ceil(narrativeQueries.length * 0.3)),
        ...descriptiveQueries.slice(0, Math.ceil(descriptiveQueries.length * 0.3))
      ];
    } else if (contentType.type === 'descriptive') {
      allQueries = [
        ...descriptiveQueries,
        ...narrativeQueries.slice(0, Math.ceil(narrativeQueries.length * 0.3)),
        ...technicalQueries.slice(0, Math.ceil(technicalQueries.length * 0.3))
      ];
    } else {
      // Mixed: use all strategies equally
      allQueries = [...narrativeQueries, ...technicalQueries, ...descriptiveQueries];
    }
    
    // Add some basic queries for diversity
    analysis.keywords.slice(0, 2).forEach(kw => {
      allQueries.push({
        query: kw.word,
        relevanceScore: 0,
        strategy: 'keyword',
        components: { keywords: [kw.word] }
      });
    });
    
    // Filter generic queries
    allQueries = filterGenericQueries(allQueries, config.genericTerms);
    
    // Enhance remaining generic queries
    allQueries = allQueries.map(sq => ({
      ...sq,
      query: enhanceGenericQuery(sq.query, config.genericTerms, config.visualDescriptors)
    }));
    
    // Deduplicate
    allQueries = deduplicateQueries(allQueries);
    
    // Optimize and score queries
    let optimizedQueries = optimizeSearchQueries(allQueries, analysis, config);
    
    // If all queries were filtered out, retry with lower threshold
    if (optimizedQueries.length === 0) {
      console.warn('All queries filtered out, retrying with lower threshold');
      const lowerThresholdConfig = {
        ...config,
        thresholds: {
          ...config.thresholds,
          minRelevanceScore: Math.max(0, config.thresholds.minRelevanceScore - 0.1)
        }
      };
      optimizedQueries = optimizeSearchQueries(allQueries, analysis, lowerThresholdConfig);
    }
    
    // If still no queries, fall back to basic keywords
    if (optimizedQueries.length === 0) {
      console.warn('No optimized queries generated, falling back to basic keywords');
      return analysis.keywords.slice(0, 6).map(k => k.word);
    }
    
    // Extract query strings and ensure we have 6-10 queries
    const finalQueries = optimizedQueries.map(sq => sq.query);
    const queryCount = Math.max(6, Math.min(10, finalQueries.length));
    const result = finalQueries.slice(0, queryCount);
    
    // Log results
    console.log(`Generated ${result.length} optimized queries:`);
    optimizedQueries.slice(0, queryCount).forEach(sq => {
      console.log(`  - "${sq.query}" (score: ${sq.relevanceScore.toFixed(3)}, strategy: ${sq.strategy})`);
    });
    
    return result;
    
  } catch (error) {
    console.error('Error generating optimized queries:', error);
    // Fall back to basic query generation
    return generateImageSearchQueries(analysis);
  }
}

// Configuration management
export function validateQueryConfig(config: Partial<QueryGenerationConfig>): boolean {
  try {
    // Validate weights
    if (config.weights) {
      const { keywordImportance, themeStrength, querySpecificity } = config.weights;
      if (
        typeof keywordImportance !== 'number' || keywordImportance < 0 || keywordImportance > 1 ||
        typeof themeStrength !== 'number' || themeStrength < 0 || themeStrength > 1 ||
        typeof querySpecificity !== 'number' || querySpecificity < 0 || querySpecificity > 1
      ) {
        console.warn('Invalid weight values, must be numbers between 0 and 1');
        return false;
      }
    }
    
    // Validate thresholds
    if (config.thresholds) {
      const { minRelevanceScore, maxQueries, minQueryWords } = config.thresholds;
      if (
        (minRelevanceScore !== undefined && (typeof minRelevanceScore !== 'number' || minRelevanceScore < 0 || minRelevanceScore > 1)) ||
        (maxQueries !== undefined && (typeof maxQueries !== 'number' || maxQueries < 1)) ||
        (minQueryWords !== undefined && (typeof minQueryWords !== 'number' || minQueryWords < 1))
      ) {
        console.warn('Invalid threshold values');
        return false;
      }
    }
    
    // Validate arrays
    if (config.genericTerms && !Array.isArray(config.genericTerms)) {
      console.warn('genericTerms must be an array');
      return false;
    }
    
    if (config.visualDescriptors) {
      const { colors, moods, settings, lighting } = config.visualDescriptors;
      if (
        (colors && !Array.isArray(colors)) ||
        (moods && !Array.isArray(moods)) ||
        (settings && !Array.isArray(settings)) ||
        (lighting && !Array.isArray(lighting))
      ) {
        console.warn('visualDescriptors properties must be arrays');
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error validating config:', error);
    return false;
  }
}

export function loadQueryConfig(customConfig?: Partial<QueryGenerationConfig>): QueryGenerationConfig {
  console.log('Loading query generation configuration');
  
  // If no custom config, return defaults
  if (!customConfig) {
    console.log('Using default configuration');
    return DEFAULT_CONFIG;
  }
  
  // Validate custom config
  if (!validateQueryConfig(customConfig)) {
    console.warn('Invalid custom configuration provided, using defaults');
    return DEFAULT_CONFIG;
  }
  
  // Merge custom config with defaults (deep merge for nested objects)
  const mergedConfig: QueryGenerationConfig = {
    weights: {
      ...DEFAULT_CONFIG.weights,
      ...customConfig.weights
    },
    thresholds: {
      ...DEFAULT_CONFIG.thresholds,
      ...customConfig.thresholds
    },
    genericTerms: customConfig.genericTerms || DEFAULT_CONFIG.genericTerms,
    visualDescriptors: {
      colors: customConfig.visualDescriptors?.colors || DEFAULT_CONFIG.visualDescriptors.colors,
      moods: customConfig.visualDescriptors?.moods || DEFAULT_CONFIG.visualDescriptors.moods,
      settings: customConfig.visualDescriptors?.settings || DEFAULT_CONFIG.visualDescriptors.settings,
      lighting: customConfig.visualDescriptors?.lighting || DEFAULT_CONFIG.visualDescriptors.lighting
    },
    contentTypeWeights: {
      ...DEFAULT_CONFIG.contentTypeWeights,
      ...customConfig.contentTypeWeights
    }
  };
  
  console.log('Configuration loaded successfully');
  return mergedConfig;
}
