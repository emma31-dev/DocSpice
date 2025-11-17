# Implementation Plan

- [x] 1. Create configuration system and interfaces


  - Define QueryGenerationConfig interface with weights, thresholds, and term lists
  - Define SearchQuery interface with relevance score and strategy metadata
  - Define ContentTypeAnalysis interface for content type detection
  - Create DEFAULT_CONFIG constant with default values for all configuration parameters
  - Create DEFAULT_GENERIC_TERMS array with common words to filter
  - Create DEFAULT_VISUAL_DESCRIPTORS object with colors, moods, settings, and lighting categories
  - _Requirements: 5.1, 5.5_




- [ ] 2. Implement content type detection
  - [ ] 2.1 Create detectContentType function
    - Write function that analyzes TextAnalysis data to determine content type
    - Implement narrative indicator detection (past tense patterns, emotional adjectives, dialogue markers)
    - Implement technical indicator detection (present tense, technical terms, abstract concepts)
    - Implement descriptive indicator detection (adjective-to-noun ratio, sensory words, specific details)

    - Calculate confidence scores for each content type


    - Return ContentTypeAnalysis with type, confidence, and indicator scores
    - _Requirements: 4.1_

- [ ] 3. Implement query generation strategies
  - [ ] 3.1 Create query construction helper functions
    - Write buildEnhancedKeywordQuery function for pattern: [descriptor] + [keyword]


    - Write buildThemeKeywordQuery function for pattern: [theme] + [keyword]
    - Write buildEntityContextQuery function for pattern: [entity] + [theme/keyword]
    - Write buildDescriptiveQuery function for pattern: [descriptor] + [keyword] + [setting]
    - Write buildContextualQuery function for pattern: [keyword1] + [keyword2] + [descriptor]

    - _Requirements: 1.1, 1.3, 1.4_



  - [ ] 3.2 Implement strategy-specific query generators
    - Write generateNarrativeQueries function that creates emotional and atmospheric queries
    - Write generateTechnicalQueries function that creates clean, professional, conceptual queries
    - Write generateDescriptiveQueries function that creates specific object and scene queries
    - Each function should use appropriate visual descriptors and query patterns


    - _Requirements: 4.2, 4.3, 4.4_

- [x] 4. Implement relevance scoring system

  - [x] 4.1 Create calculateRelevanceScore function


    - Implement keyword importance calculation from query components
    - Implement theme strength calculation based on theme matches
    - Implement query specificity calculation based on word count
    - Apply weighted formula: keywordImportance * weight + themeStrength * weight + querySpecificity * weight
    - Normalize score to 0-1 range
    - _Requirements: 2.1_




  - [ ] 4.2 Create query filtering and ranking logic
    - Write filterGenericQueries function to exclude single-word generic terms
    - Write enhanceGenericQuery function to add descriptors to queries with generic terms
    - Implement query deduplication logic
    - _Requirements: 3.1, 3.2, 3.5_

- [ ] 5. Implement main query optimizer
  - [ ] 5.1 Create optimizeSearchQueries function
    - Accept array of SearchQuery objects and configuration

    - Calculate relevance score for each query using calculateRelevanceScore


    - Filter out queries below minRelevanceScore threshold
    - Sort queries by relevance score in descending order
    - Handle tie-breaking for similar scores using query specificity
    - Limit results to maxQueries from configuration

    - _Requirements: 2.2, 2.3, 2.4, 2.5_



- [ ] 6. Implement enhanced query generation function
  - [ ] 6.1 Create generateOptimizedImageSearchQueries function
    - Accept TextAnalysis data and optional QueryGenerationConfig
    - Detect content type using detectContentType function


    - Generate queries using all strategy functions based on content type


    - Apply appropriate strategy to at least 60% of queries based on content type
    - Create diverse query set using all construction patterns
    - Build SearchQuery objects with metadata for each generated query
    - Pass queries through optimizeSearchQueries for scoring and filtering
    - Return final array of 6-10 optimized query strings
    - Add logging for generated queries and relevance scores
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 3.3, 3.4, 4.5, 5.4_

- [ ] 7. Integrate with existing API route
  - [ ] 7.1 Update generate route to use new query function
    - Import generateOptimizedImageSearchQueries in src/app/api/generate/route.ts
    - Replace call to generateImageSearchQueries with generateOptimizedImageSearchQueries
    - Keep existing generateImageSearchQueries as fallback for error cases
    - Maintain backward compatibility with existing response format
    - _Requirements: All requirements (integration point)_

- [ ] 8. Add error handling and fallbacks
  - [ ] 8.1 Implement robust error handling
    - Add try-catch blocks around content type detection with fallback to 'mixed' type
    - Handle empty query generation by falling back to basic keyword queries
    - Implement threshold retry logic: if all queries filtered, lower threshold by 0.1 and retry once
    - Add validation for configuration values with fallback to defaults
    - Log warnings for invalid configuration or generation failures
    - _Requirements: 5.5_

- [ ] 9. Add configuration management
  - [ ] 9.1 Create configuration loader and validator
    - Write loadQueryConfig function that returns QueryGenerationConfig
    - Implement configuration validation with type checking
    - Add support for partial config override (merge with defaults)
    - Ensure runtime configuration updates are supported
    - Add logging for configuration loading and validation
    - _Requirements: 5.1, 5.2, 5.3, 5.5_
