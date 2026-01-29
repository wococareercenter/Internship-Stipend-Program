/**
 * Data Processing Utilities
 * 
 * This module handles the core data processing pipeline for CSV files:
 * - CSV parsing and validation
 * - Location cleaning using OpenAI GPT-4o-mini
 * - Hours standardization
 * - Data validation
 * - Score calculation based on configurable scales
 * 
 * @module processData
 */

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import OpenAI from 'openai';

/**
 * Global cache for cleaned locations
 * Reduces OpenAI API calls by storing previously cleaned location values
 * Format: { "original_location": "cleaned_state_name" }
 */
let locationCache = {};

/**
 * Load CSV configuration file
 * 
 * Reads the CSV configuration JSON file that defines:
 * - Expected column names
 * - Column renaming mappings
 * - Validation rules
 * - Default scoring scale
 * 
 * @returns {object} Configuration object with csv_format_2025 and default_scale
 * @throws {Error} If config file cannot be read or parsed
 */
export function loadCsvConfig() {
    try {
        const configPath = path.join(process.cwd(), 'app', 'csv_config.json');
        const configContent = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(configContent);
    } catch (error) {
        throw new Error(`Failed to load CSV config: ${error.message}`);
    }
}

/**
 * Clean location column using OpenAI GPT-4o-mini
 * 
 * Extracts and standardizes state names from location strings.
 * Uses caching to avoid redundant API calls for previously processed locations.
 * Processes locations in batches of 5 to optimize API usage.
 * 
 * @param {Array<object>} df - Array of data row objects
 * @param {string} apiKey - OpenAI API key (optional, skips cleaning if not provided)
 * @returns {Promise<Array<object>>} Data array with cleaned location values
 * 
 * @example
 * // Input: [{ location: "New York, NY" }, { location: "Los Angeles, CA" }]
 * // Output: [{ location: "NewYork" }, { location: "California" }]
 */
export async function cleanLocationColumn(df, apiKey) {
    // Skip cleaning if API key is not provided
    if (!apiKey) {
        console.log("Warning: OPENAI_API_KEY not found, skipping location cleaning");
        return df;
    }
    
    const client = new OpenAI({ apiKey });
    
    /**
     * Get cleaned location from OpenAI
     * Extracts state name from location string
     * 
     * @param {string} location - Original location string
     * @returns {Promise<string>} Cleaned state name (e.g., "NewYork", "California")
     */
    async function getLocation(location) {
        try {
            const response = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{
                    role: "user",
                    content: `
                        Extract the state from this location: '${location}'
                        Return only the state name with no spaces (e.g., 'NewYork', 'California', 'Texas')
                        For District of Columbia, return 'DistrictOfColumbia' (not 'DC' or 'Washington')
                        If no state is found, return 'Unknown'
                        Examples:
                        - 'New York, NY' -> 'NewYork'
                        - 'Los Angeles, CA' -> 'California'
                        - 'South Carolina' -> 'SouthCarolina'
                        - 'Washington, DC' -> 'DistrictOfColumbia'
                        - 'District of Columbia' -> 'DistrictOfColumbia'
                        - 'DC' -> 'DistrictOfColumbia'`
                }]
            });
            let cleaned = response.choices[0].message.content.trim();
            
            // Normalize District of Columbia variations
            const dcVariations = ['DC', 'D.C.', 'District of Columbia', 'district of columbia', 'Washington DC', 'Washington, DC', 'Washington D.C.'];
            if (dcVariations.some(variation => location.toLowerCase().includes(variation.toLowerCase())) || 
                cleaned.toLowerCase().includes('dc') || 
                cleaned.toLowerCase().includes('district')) {
                cleaned = 'DistrictOfColumbia';
            }
            
            return cleaned;
        } catch (error) {
            console.error(`Error cleaning location '${location}': ${error}`);
            // Fallback: check if it's DC-related
            const locationLower = location.toLowerCase();
            if (locationLower.includes('dc') || locationLower.includes('district of columbia') || locationLower.includes('washington, dc')) {
                return 'DistrictOfColumbia';
            }
            return "Unknown";
        }
    }
    
    // Create a copy of the data array to avoid mutating the original
    const cleanDf = [...df];
    
    // Get unique location values (filter out null/undefined/empty)
    const locations = [...new Set(df.map(row => row.location).filter(loc => loc))];
    
    // Build location mapping: check cache first, then queue new locations for cleaning
    const locationMapping = {};
    const locationsToClean = [];
    
    for (const loc of locations) {
        if (locationCache[loc]) {
            // Use cached value if available
            locationMapping[loc] = locationCache[loc];
        } else {
            // Queue for OpenAI cleaning
            locationsToClean.push(loc);
        }
    }
    
    // Clean new locations in batches of 5 to optimize API usage and avoid rate limits
    if (locationsToClean.length > 0) {
        const batchSize = 5;
        for (let i = 0; i < locationsToClean.length; i += batchSize) {
            const batch = locationsToClean.slice(i, i + batchSize);
            
            // Process batch in parallel
            const promises = batch.map(loc => getLocation(loc));
            const results = await Promise.all(promises);
            
            // Store results in mapping and cache
            batch.forEach((loc, idx) => {
                const cleanedLoc = results[idx];
                locationMapping[loc] = cleanedLoc;
                locationCache[loc] = cleanedLoc; // Cache for future use
            });
        }
    }
    
    // Normalize location names to match scale keys
    function normalizeLocation(location) {
        if (!location) return "Unknown";
        
        const loc = String(location).trim();
        const locLower = loc.toLowerCase();
        
        // Handle District of Columbia variations
        if (locLower.includes('dc') || 
            locLower.includes('district of columbia') || 
            locLower === 'd.c.' ||
            locLower === 'washington dc' ||
            locLower === 'washington, dc') {
            return 'DistrictOfColumbia';
        }
        
        // Return as-is if already normalized
        return loc;
    }
    
    // Apply the location mapping to all rows and normalize
    return cleanDf.map(row => {
        const mappedLocation = locationMapping[row.location] || row.location || "Unknown";
        return {
            ...row,
            location: normalizeLocation(mappedLocation)
        };
    });
}

/**
 * Clean and standardize hours column
 * 
 * Converts various hour formats into standardized values:
 * - "Less than 30 Hours" - for part-time or < 30 hours
 * - "30+ Hours" - for full-time or >= 30 hours
 * - "Unknown" - for invalid or missing values
 * 
 * @param {Array<object>} df - Array of data row objects
 * @returns {Array<object>} Data array with standardized hours values
 * 
 * @example
 * // Input: [{ hours: "20-29" }, { hours: "40 hours" }, { hours: "part-time" }]
 * // Output: [{ hours: "Less than 30 Hours" }, { hours: "30+ Hours" }, { hours: "Less than 30 Hours" }]
 */
export function cleanHoursColumn(df) {
    /**
     * Standardize hours value to one of three categories
     * 
     * @param {string|number} hoursValue - Original hours value
     * @returns {string} Standardized hours value
     */
    function standardizeHours(hoursValue) {
        // Handle null, undefined, or string representations of null
        if (!hoursValue || hoursValue === 'null' || hoursValue === 'undefined') {
            return "Unknown";
        }
        
        const hoursStr = String(hoursValue).trim().toLowerCase();
        
        // Check for patterns indicating less than 30 hours
        if (['less than 30', 'under 30', '< 30', '0-29'].some(phrase => hoursStr.includes(phrase))) {
            return "Less than 30 Hours";
        } 
        // Check for patterns indicating 30+ hours
        else if (['30+', '30 or more', '30 and above', '30+ hours', '30 hours', '30 hrs', '30'].some(phrase => hoursStr.includes(phrase))) {
            return "30+ Hours";
        } 
        // Check for ranges that fall under 30 hours
        else if (['20-29', '20 to 29', '20-30'].some(phrase => hoursStr.includes(phrase))) {
            return "Less than 30 Hours";
        } 
        // Check for full-time or 40+ hour patterns
        else if (['40+', '40 hours', '40 hrs', 'full time'].some(phrase => hoursStr.includes(phrase))) {
            return "30+ Hours";
        } 
        // Check for part-time patterns
        else if (['part time', 'part-time', '10-20', '15-25'].some(phrase => hoursStr.includes(phrase))) {
            return "Less than 30 Hours";
        } 
        // Try to extract numeric value and categorize
        else {
            const numbers = hoursStr.match(/\d+/);
            if (numbers) {
                const hoursNum = parseInt(numbers[0]);
                return hoursNum >= 30 ? "30+ Hours" : "Less than 30 Hours";
            }
            return "Unknown";
        }
    }
    
    // Apply standardization to all rows
    return df.map(row => ({
        ...row,
        hours: row.hours ? standardizeHours(row.hours) : "Unknown"
    }));
}

/**
 * Extract month string from a date
 * 
 * Converts a date string or Date object into a month name string.
 * Returns the full month name (e.g., "January", "February", etc.)
 * 
 * @param {string|Date} dateValue - Date string or Date object
 * @returns {string} Month name (e.g., "January") or "Unknown" if invalid
 * 
 * @example
 * getMonthString("2025-03-15") // Returns "March"
 * getMonthString(new Date()) // Returns current month name
 */
export function getMonthKey(dateString) {
    if  (!dateString) return 'Unknown';

    const date = new Date(dateString)

    if (isNaN(date.getTime())) {
        return 'Unknown'
    }

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const month = monthNames[date.getMonth()]
    return `${month}`;
}

/**
 * Internal pipeline: column mapping, cleaning, validation, scoring.
 * Shared by processData and processDataFromRecords.
 * @param {Array<object>} df - Array of row objects (keys normalized to lowercase for lookup)
 * @param {object} csvFormat - config.csv_format_2025
 * @param {object} scale - Scoring scale
 * @returns {Promise<object>} { data, warnings, total_records, columns }
 */
async function processRecordsPipeline(df, csvFormat, scale) {
    const columns = csvFormat.columns;
    const renamedColumns = csvFormat.renamed_columns;

    const expectedColumns = Object.values(columns).map(col => col.trim().toLowerCase());
    const availableColumns = Object.keys(df[0] || {}).map(col => col.trim().toLowerCase());
    const columnsToProcess = expectedColumns.filter(col => availableColumns.includes(col));

    if (columnsToProcess.length === 0) {
        throw new Error("No matching columns found between data and config.");
    }

    const columnMapping = {};
    Object.entries(renamedColumns).forEach(([original, renamed]) => {
        columnMapping[original.trim().toLowerCase()] = renamed;
    });

    df = df.map(row => {
        const newRow = {};
        columnsToProcess.forEach(col => {
            const renamed = columnMapping[col] || col;
            newRow[renamed] = row[col] ?? null;
        });
        return newRow;
    });

    const apiKey = process.env.OPENAI_API_KEY;
    df = await cleanLocationColumn(df, apiKey);
    df = cleanHoursColumn(df);

    const warnings = [];
    const validationConfig = csvFormat.validations;

    for (const [field, validation] of Object.entries(validationConfig)) {
        if (!df[0] || !(field in df[0])) continue;
        const validValues = validation.valid_values;
        if (validValues === "any") continue;
        const validValuesList = Array.isArray(validValues)
            ? validValues.map(v => String(v).trim().toLowerCase())
            : [String(validValues).trim().toLowerCase()];
        const invalidValues = [];
        for (const row of df) {
            if (row[field]) {
                const value = String(row[field]).trim().toLowerCase();
                if (!validValuesList.includes(value) && !invalidValues.includes(value)) {
                    invalidValues.push(value);
                }
            }
        }
        if (invalidValues.length > 0) {
            warnings.push(`Invalid ${field} values: [${invalidValues.join(', ')}]`);
        }
    }

    const records = df.map(record => {
        const cleanRecord = {};
        Object.entries(record).forEach(([key, value]) => {
            cleanRecord[key] = (value === null || value === undefined || value === '') ? null : value;
        });
        let score = 0;
        const scoreBreakdown = {};
        if (cleanRecord.need_level) {
            const needLevel = String(cleanRecord.need_level).toLowerCase().replace(/\s+/g, '');
            const needMapping = { 'veryhighneed': 'very_high_need', 'highneed': 'high_need', 'moderateneed': 'moderate_need', 'lowneed': 'low_need', 'noneed': 'no_need' };
            const scaleKey = needMapping[needLevel] || needLevel;
            const needScore = scale.fafsa_scale[scaleKey] || 0;
            scoreBreakdown.need_level = needScore;
            score += needScore;
        }
        if (cleanRecord.paid_internship) {
            const paidStatus = String(cleanRecord.paid_internship).toLowerCase();
            scoreBreakdown.paid_internship = scale.paid[paidStatus] || 0;
            score += scoreBreakdown.paid_internship;
        }
        if (cleanRecord.internship_type) {
            const internshipType = String(cleanRecord.internship_type).toLowerCase().replace(/-/g, '');
            const typeMapping = { 'inperson': 'in_person', 'hybrid': 'hybrid', 'virtual': 'virtual' };
            const typeScore = scale.internship_type[typeMapping[internshipType] || internshipType] || 0;
            scoreBreakdown.internship_type = typeScore;
            score += typeScore;
        }
        if (cleanRecord.location) {
            let location = cleanRecord.location;
            const locationLower = String(location).toLowerCase();
            if (locationLower.includes('dc') || locationLower.includes('district of columbia') || locationLower === 'd.c.' || locationLower === 'washington dc' || locationLower === 'washington, dc') {
                location = 'DistrictOfColumbia';
            }
            let locationScore = 0;
            for (const tier of Object.values(scale.cost_of_living)) {
                if (tier[location]) { locationScore = tier[location]; break; }
            }
            if (locationScore === 0 && (locationLower.includes('dc') || locationLower.includes('district'))) {
                for (const tier of Object.values(scale.cost_of_living)) {
                    if (tier['DistrictOfColumbia']) { locationScore = tier['DistrictOfColumbia']; break; }
                }
            }
            scoreBreakdown.location = locationScore;
            score += locationScore;
        }
        cleanRecord.score = score;
        cleanRecord.score_breakdown = scoreBreakdown;
        if (cleanRecord.month) cleanRecord.month = getMonthKey(cleanRecord.month);
        return cleanRecord;
    });

    return {
        data: records,
        warnings,
        total_records: records.length,
        columns: Object.keys(records[0] || {})
    };
}

/**
 * Process in-memory records (e.g. from GET /api/file). Normalizes row keys to lowercase for config matching.
 * @param {Array<object>} records - Array of row objects
 * @param {object|null} scale - Optional scoring scale
 * @returns {Promise<object>} { data, warnings, total_records, columns }
 */
export async function processDataFromRecords(records, scale = null) {
    const config = loadCsvConfig();
    const csvFormat = config.csv_format_2025;
    if (!scale) scale = config.default_scale;

    const df = records.map(row => {
        const normalized = {};
        Object.entries(row).forEach(([k, v]) => {
            normalized[String(k).trim().toLowerCase()] = v;
        });
        return normalized;
    });

    if (!df.length) {
        throw new Error("Data array is empty.");
    }

    return processRecordsPipeline(df, csvFormat, scale);
}

/**
 * Main data processing function (file or in-memory payload with .data array).
 * @param {object} data - { data: Array<object> } (in-memory rows)
 * @param {object|null} scale - Optional scoring scale
 * @returns {Promise<object>} { data, warnings, total_records, columns }
 */
export async function processData(data, scale = null) {
    try {
        const config = loadCsvConfig();
        const csvFormat = config.csv_format_2025;
        if (!scale) scale = config.default_scale;

        let df = data?.data;
        if (!df || !Array.isArray(df) || df.length === 0) {
            throw new Error("Data must be an object with a non-empty 'data' array.");
        }
        df = df.map(row => {
            const normalized = {};
            Object.entries(row).forEach(([k, v]) => {
                normalized[String(k).trim().toLowerCase()] = v;
            });
            return normalized;
        });

        return await processRecordsPipeline(df, csvFormat, scale);
    } catch (error) {
        console.error('Error in processData:', error);
        throw error;
    }
}

