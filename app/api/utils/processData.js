import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import OpenAI from 'openai';

// Global cache for cleaned locations
let locationCache = {};

// Load CSV config
export function loadCsvConfig() {
    try {
        const configPath = path.join(process.cwd(), 'app', 'csv_config.json');
        const configContent = fs.readFileSync(configPath, 'utf-8');
        return JSON.parse(configContent);
    } catch (error) {
        throw new Error(`Failed to load CSV config: ${error.message}`);
    }
}

// Clean location column using OpenAI
export async function cleanLocationColumn(df, apiKey) {
    if (!apiKey) {
        console.log("Warning: OPENAI_API_KEY not found, skipping location cleaning");
        return df;
    }
    
    const client = new OpenAI({ apiKey });
    
    async function getLocation(location) {
        try {
            const response = await client.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{
                    role: "user",
                    content: `Extract the state from this location: '${location}'
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
    
    const cleanDf = [...df];
    const locations = [...new Set(df.map(row => row.location).filter(loc => loc))];
    
    // Check cache first
    const locationMapping = {};
    const locationsToClean = [];
    
    for (const loc of locations) {
        if (locationCache[loc]) {
            locationMapping[loc] = locationCache[loc];
        } else {
            locationsToClean.push(loc);
        }
    }
    
    // Clean new locations in parallel (limit to 5 concurrent)
    if (locationsToClean.length > 0) {
        const batchSize = 5;
        for (let i = 0; i < locationsToClean.length; i += batchSize) {
            const batch = locationsToClean.slice(i, i + batchSize);
            const promises = batch.map(loc => getLocation(loc));
            const results = await Promise.all(promises);
            
            batch.forEach((loc, idx) => {
                const cleanedLoc = results[idx];
                locationMapping[loc] = cleanedLoc;
                locationCache[loc] = cleanedLoc;
            });
        }
    }
    
    // Apply mapping
    return cleanDf.map(row => ({
        ...row,
        location: locationMapping[row.location] || row.location || "Unknown"
    }));
}

// Clean hours column
export function cleanHoursColumn(df) {
    function standardizeHours(hoursValue) {
        if (!hoursValue || hoursValue === 'null' || hoursValue === 'undefined') {
            return "Unknown";
        }
        
        const hoursStr = String(hoursValue).trim().toLowerCase();
        
        if (['less than 30', 'under 30', '< 30', '0-29'].some(phrase => hoursStr.includes(phrase))) {
            return "Less than 30 Hours";
        } else if (['30+', '30 or more', '30 and above', '30+ hours', '30 hours', '30 hrs', '30'].some(phrase => hoursStr.includes(phrase))) {
            return "30+ Hours";
        } else if (['20-29', '20 to 29', '20-30'].some(phrase => hoursStr.includes(phrase))) {
            return "Less than 30 Hours";
        } else if (['40+', '40 hours', '40 hrs', 'full time'].some(phrase => hoursStr.includes(phrase))) {
            return "30+ Hours";
        } else if (['part time', 'part-time', '10-20', '15-25'].some(phrase => hoursStr.includes(phrase))) {
            return "Less than 30 Hours";
        } else {
            const numbers = hoursStr.match(/\d+/);
            if (numbers) {
                const hoursNum = parseInt(numbers[0]);
                return hoursNum >= 30 ? "30+ Hours" : "Less than 30 Hours";
            }
            return "Unknown";
        }
    }
    
    return df.map(row => ({
        ...row,
        hours: row.hours ? standardizeHours(row.hours) : "Unknown"
    }));
}

// Process data
export async function processData(fileName, scale = null) {
    try {
        const config = loadCsvConfig();
        const csvFormat = config.csv_format_2025;
        const defaultScale = config.default_scale;
        
        if (!scale) {
            scale = defaultScale;
        }
        
        const columns = csvFormat.columns;
        const renamedColumns = csvFormat.renamed_columns;
        
        // Determine uploads directory
        const uploadsDir = process.env.VERCEL 
            ? '/tmp/uploads'
            : path.join(process.cwd(), 'public', 'uploads');
        
        const filePath = path.join(uploadsDir, fileName);
        
        if (!fs.existsSync(filePath)) {
            throw new Error("File not found");
        }
        
        // Read and parse CSV
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const parseResult = Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            transformHeader: (header) => header.trim().toLowerCase()
        });
        
        let df = parseResult.data.filter(row => {
            // Remove completely empty rows
            return Object.values(row).some(val => val && val.trim() !== '');
        });
        
        if (df.length === 0) {
            throw new Error("CSV file is empty");
        }
        
        // Get expected columns (lowercase)
        const expectedColumns = Object.values(columns).map(col => col.trim().toLowerCase());
        
        // Check which columns are missing
        const availableColumns = Object.keys(df[0] || {}).map(col => col.trim().toLowerCase());
        const missingColumns = expectedColumns.filter(col => !availableColumns.includes(col));
        
        if (missingColumns.length > 0) {
            throw new Error(`CSV file is missing required columns: ${missingColumns.join(', ')}`);
        }
        
        // Create column mapping
        const columnMapping = {};
        Object.entries(renamedColumns).forEach(([original, renamed]) => {
            columnMapping[original.trim().toLowerCase()] = renamed;
        });
        
        // Select and rename columns
        df = df.map(row => {
            const newRow = {};
            expectedColumns.forEach(col => {
                const renamed = columnMapping[col] || col;
                newRow[renamed] = row[col] || null;
            });
            return newRow;
        });
        
        // Clean location column
        const apiKey = process.env.OPENAI_API_KEY;
        df = await cleanLocationColumn(df, apiKey);
        
        // Clean hours column
        df = cleanHoursColumn(df);
        
        // Validate data
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
                    if (!validValuesList.includes(value)) {
                        if (!invalidValues.includes(value)) {
                            invalidValues.push(value);
                        }
                    }
                }
            }
            
            if (invalidValues.length > 0) {
                // Format warning to match frontend expectation: "Invalid field_name values: [value1, value2, ...]"
                warnings.push(`Invalid ${field} values: [${invalidValues.join(', ')}]`);
            }
        }
        
        // Calculate scores
        const records = df.map(record => {
            // Replace null/undefined with null for JSON
            const cleanRecord = {};
            Object.entries(record).forEach(([key, value]) => {
                cleanRecord[key] = (value === null || value === undefined || value === '') ? null : value;
            });
            
            let score = 0;
            const scoreBreakdown = {};
            
            // Need Level scoring
            if (cleanRecord.need_level) {
                const needLevel = String(cleanRecord.need_level).toLowerCase().replace(/\s+/g, '');
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
            
            // Paid/Unpaid scoring
            if (cleanRecord.paid_internship) {
                const paidStatus = String(cleanRecord.paid_internship).toLowerCase();
                const paidScore = scale.paid[paidStatus] || 0;
                scoreBreakdown.paid_internship = paidScore;
                score += paidScore;
            }
            
            // Internship Type scoring
            if (cleanRecord.internship_type) {
                const internshipType = String(cleanRecord.internship_type).toLowerCase().replace(/-/g, '');
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
            
            // Location scoring
            if (cleanRecord.location) {
                let locationScore = 0;
                const location = cleanRecord.location;
                const costOfLiving = scale.cost_of_living;
                
                for (const tier of Object.values(costOfLiving)) {
                    if (tier[location]) {
                        locationScore = tier[location];
                        break;
                    }
                }
                
                scoreBreakdown.location = locationScore;
                score += locationScore;
            }
            
            cleanRecord.score = score;
            cleanRecord.score_breakdown = scoreBreakdown;
            
            return cleanRecord;
        });
        
        return {
            data: records,
            warnings: warnings,
            total_records: records.length,
            columns: Object.keys(records[0] || {})
        };
        
    } catch (error) {
        console.error('Error in processData:', error);
        throw error;
    }
}

