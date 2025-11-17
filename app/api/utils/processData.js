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
                        If no state is found, return 'Unknown'
                        Examples:
                        - 'New York, NY' -> 'NewYork'
                        - 'Los Angeles, CA' -> 'California'
                        - 'South Carolina' -> 'SouthCarolina'`
                }]
            });
            return response.choices[0].message.content.trim();
        } catch (error) {
            console.error(`Error cleaning location '${location}': ${error}`);
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
    
    // Apply the location mapping to all rows
    return cleanDf.map(row => ({
        ...row,
        location: locationMapping[row.location] || row.location || "Unknown"
    }));
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
 * Main data processing function
 * 
 * Orchestrates the entire data processing pipeline:
 * 1. Loads CSV configuration
 * 2. Reads and parses the CSV file
 * 3. Validates required columns
 * 4. Maps and renames columns
 * 5. Cleans location data using OpenAI
 * 6. Standardizes hours data
 * 7. Validates data values
 * 8. Calculates scores for each record
 * 
 * @param {string} fileName - Name of the uploaded CSV file
 * @param {object|null} scale - Scoring scale configuration (uses default from config if not provided)
 * @returns {Promise<object>} Processed data with scores, warnings, and metadata
 * @throws {Error} If file not found, missing columns, or processing fails
 * 
 * @example
 * const result = await processData('data.csv', customScale);
 * // Returns: { data: [...], warnings: [...], total_records: 100, columns: [...] }
 */
export async function processData(fileName, scale = null) {
    try {
        // Load CSV configuration (column mappings, validations, default scale)
        const config = loadCsvConfig();
        const csvFormat = config.csv_format_2025;
        const defaultScale = config.default_scale;
        
        // Use provided scale or fall back to default from config
        if (!scale) {
            scale = defaultScale;
        }
        
        const columns = csvFormat.columns;
        const renamedColumns = csvFormat.renamed_columns;
        
        // Determine uploads directory based on environment
        // Vercel uses /tmp (ephemeral), local uses public/uploads
        const uploadsDir = process.env.VERCEL 
            ? '/tmp/uploads'
            : path.join(process.cwd(), 'public', 'uploads');
        
        const filePath = path.join(uploadsDir, fileName);
        
        // Verify file exists
        if (!fs.existsSync(filePath)) {
            throw new Error("File not found");
        }
        
        // Read and parse CSV file
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const parseResult = Papa.parse(fileContent, {
            header: true,              // First row contains headers
            skipEmptyLines: true,      // Skip completely empty lines
            transformHeader: (header) => header.trim().toLowerCase()  // Normalize headers
        });
        
        // Filter out completely empty rows
        let df = parseResult.data.filter(row => {
            return Object.values(row).some(val => val && val.trim() !== '');
        });
        
        if (df.length === 0) {
            throw new Error("CSV file is empty");
        }
        
        // Get expected columns from config (normalized to lowercase)
        const expectedColumns = Object.values(columns).map(col => col.trim().toLowerCase());
        
        // Check which required columns are missing
        const availableColumns = Object.keys(df[0] || {}).map(col => col.trim().toLowerCase());
        const missingColumns = expectedColumns.filter(col => !availableColumns.includes(col));
        
        if (missingColumns.length > 0) {
            throw new Error(`CSV file is missing required columns: ${missingColumns.join(', ')}`);
        }
        
        // Create column mapping from original CSV names to standardized field names
        const columnMapping = {};
        Object.entries(renamedColumns).forEach(([original, renamed]) => {
            columnMapping[original.trim().toLowerCase()] = renamed;
        });
        
        // Select only expected columns and rename them to standardized field names
        df = df.map(row => {
            const newRow = {};
            expectedColumns.forEach(col => {
                const renamed = columnMapping[col] || col;
                newRow[renamed] = row[col] || null;
            });
            return newRow;
        });
        
        // Clean location column using OpenAI (extracts state names)
        const apiKey = process.env.OPENAI_API_KEY;
        df = await cleanLocationColumn(df, apiKey);
        
        // Clean and standardize hours column
        df = cleanHoursColumn(df);
        
        // Validate data values against configuration rules
        const warnings = [];
        const validationConfig = csvFormat.validations;
        
        for (const [field, validation] of Object.entries(validationConfig)) {
            // Skip if field doesn't exist in data
            if (!df[0] || !(field in df[0])) continue;
            
            const validValues = validation.valid_values;
            // Skip validation if "any" value is allowed
            if (validValues === "any") continue;
            
            // Normalize valid values to lowercase for comparison
            const validValuesList = Array.isArray(validValues) 
                ? validValues.map(v => String(v).trim().toLowerCase())
                : [String(validValues).trim().toLowerCase()];
            
            // Collect invalid values (unique list)
            const invalidValues = [];
            for (const row of df) {
                if (row[field]) {
                    const value = String(row[field]).trim().toLowerCase();
                    if (!validValuesList.includes(value)) {
                        if (!invalidValues.includes(value)) {
                            invalidValues.push(value);
                        }
                    }
                }
            }
            
            // Add warning if invalid values found
            if (invalidValues.length > 0) {
                // Format warning to match frontend expectation: "Invalid field_name values: [value1, value2, ...]"
                warnings.push(`Invalid ${field} values: [${invalidValues.join(', ')}]`);
            }
        }
        
        // Calculate scores for each record based on the scoring scale
        const records = df.map(record => {
            // Clean record: replace null/undefined/empty with null for JSON serialization
            const cleanRecord = {};
            Object.entries(record).forEach(([key, value]) => {
                cleanRecord[key] = (value === null || value === undefined || value === '') ? null : value;
            });
            
            let score = 0;
            const scoreBreakdown = {};
            
            // FAFSA Need Level scoring (0-5 points)
            if (cleanRecord.need_level) {
                const needLevel = String(cleanRecord.need_level).toLowerCase().replace(/\s+/g, '');
                // Map CSV values to scale keys (e.g., "veryhighneed" -> "very_high_need")
                const needMapping = {
                    'veryhighneed': 'very_high_need',
                    'highneed': 'high_need',
                    'moderateneed': 'moderate_need',
                    'lowneed': 'low_need',
                    'noneed': 'no_need'
                };
                const scaleKey = needMapping[needLevel] || needLevel;
                const needScore = scale.fafsa_scale[scaleKey] || 0;
                scoreBreakdown.need_level = needScore;
                score += needScore;
            }
            
            // Paid/Unpaid Internship scoring (4-5 points)
            if (cleanRecord.paid_internship) {
                const paidStatus = String(cleanRecord.paid_internship).toLowerCase();
                const paidScore = scale.paid[paidStatus] || 0;
                scoreBreakdown.paid_internship = paidScore;
                score += paidScore;
            }
            
            // Internship Type scoring (0-5 points: in-person=5, hybrid=4, virtual=0)
            if (cleanRecord.internship_type) {
                const internshipType = String(cleanRecord.internship_type).toLowerCase().replace(/-/g, '');
                // Map CSV values to scale keys (e.g., "inperson" -> "in_person")
                const typeMapping = {
                    'inperson': 'in_person',
                    'hybrid': 'hybrid',
                    'virtual': 'virtual'
                };
                const scaleKey = typeMapping[internshipType] || internshipType;
                const typeScore = scale.internship_type[scaleKey] || 0;
                scoreBreakdown.internship_type = typeScore;
                score += typeScore;
            }
            
            // Location/Cost of Living scoring (1-5 points based on state tier)
            if (cleanRecord.location) {
                let locationScore = 0;
                const location = cleanRecord.location;
                const costOfLiving = scale.cost_of_living;
                
                // Look up location in cost of living tiers (tier1, tier2, tier3)
                for (const tier of Object.values(costOfLiving)) {
                    if (tier[location]) {
                        locationScore = tier[location];
                        break;
                    }
                }
                
                scoreBreakdown.location = locationScore;
                score += locationScore;
            }
            
            // Add calculated score and breakdown to record
            cleanRecord.score = score;
            cleanRecord.score_breakdown = scoreBreakdown;

            if (cleanRecord.month) {
                cleanRecord.month = getMonthKey(cleanRecord.month)
            }
            
            return cleanRecord;
        });
        
        // Return processed data with metadata
        return {
            data: records,                    // Array of scored records
            warnings: warnings,              // Validation warnings
            total_records: records.length,   // Total number of records
            columns: Object.keys(records[0] || {})  // Column names
        };
        
    } catch (error) {
        console.error('Error in processData:', error);
        throw error;
    }
}

