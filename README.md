# ISP Platform

A Next.js full-stack application for processing and scoring internship stipend applications. Upload CSV files, validate data, clean location/hours information using OpenAI, and calculate scores based on configurable scales.

## Quick Start

### Prerequisites
- Node.js 16+, OpenAI API key

### Setup
1. **Install Dependencies**: `npm install`
2. **Environment**: Create `.env.local` with `OPENAI_API_KEY=your_key_here`
3. **Run Development Server**: `npm run dev`
4. **Access**: Open `http://localhost:3000`

### Basic Usage
1. **Upload CSV** - Click "Upload File" and select your CSV
2. **Configure Scale** - Click "Set Your Scale" to adjust scoring weights
3. **View Results** - Click student cards to see detailed breakdowns
4. **Refresh Scores** - Modify scale and click "Refresh for a different scale"

## Configuration

### Adding New CSV Columns
Edit `app/csv_config.json`:
```json
{
  "csv_format_2025": {
    "columns": {
      "new_field": "New Column Name in CSV",
      "existing_field": "Existing Column Name"
    },
    "renamed_columns": {
      "New Column Name in CSV": "new_field",
      "Existing Column Name": "existing_field"
    },
    "validations": {
      "new_field": {
        "valid_values": ["Option1", "Option2"],
        "required": true
      }
    }
  }
}
```

### Adding New Scoring Categories
1. **Update Scale Component** (`app/components/Scale.js`):
   - Add new state variables for your category
   - Create UI inputs for scoring values
   - Include in `currentScale` object

2. **Update Backend Scoring** (`app/api/utils/processData.js`):
   - Add scoring logic in `processData()` function
   - Map CSV values to scale keys
   - Calculate scores and add to `score_breakdown`

3. **Update Frontend Display** (`app/components/Result.js`):
   - Add new category to the breakdown table
   - Include in score calculation display

### Example: Adding "Work Experience" Category
```javascript
// In Scale.js - Add state
const [workExperience, setWorkExperience] = useState({
  none: 0,
  partTime: 2,
  fullTime: 4
});

// In processData.js - Add scoring
if (cleanRecord.work_experience) {
    const expType = String(cleanRecord.work_experience).toLowerCase();
    const expScore = scale.work_experience[expType] || 0;
    scoreBreakdown.work_experience = expScore;
    score += expScore;
}
```

## Technical Documentation

### Architecture
- **Backend**: Next.js API routes with Node.js for data processing, OpenAI for location cleaning
- **Frontend**: React with context management, responsive design
- **Data Flow**: CSV upload → validation → cleaning → scoring → display

### Key Components

#### Backend (`app/api/`)
- **`extract/route.js`**: Main data extraction endpoint that processes CSV files
- **`upload/route.js`**: Handles CSV file uploads with validation
- **`file/route.js`**: Retrieves current uploaded file information
- **`scale/route.js`**: Saves scoring scale configuration
- **`utils/processData.js`**: Core data processing logic
  - **File Upload**: Handles CSV uploads with validation
  - **Data Cleaning**: LLM-powered location cleaning, hours standardization
  - **Scoring Engine**: Configurable scoring based on multiple criteria
  - **Caching**: Location cleaning cache to reduce API calls

#### Frontend Components
- **Upload.js**: File selection and upload interface
- **Scale.js**: Dynamic scoring configuration UI
- **Result.js**: Interactive results display with expandable cards
- **File.js**: Current file information display

### API Endpoints
- `GET /api/file` - Current file info
- `POST /api/upload` - Upload CSV
- `POST /api/extract` - Process and score data
- `POST /api/scale` - Save scale configuration

### Data Processing Pipeline
1. **Validation**: Check required columns and data formats
2. **Cleaning**: Standardize locations (OpenAI LLM) and hours (regex)
3. **Scoring**: Calculate scores based on configurable scales
4. **Display**: Show results with validation warnings

### Score Calculation
- **FAFSA Need**: 0-5 points (very high: 5, high: 4, moderate: 3, low: 2, none: 0)
- **Paid Status**: 4-5 points (paid: 4, unpaid: 5)
- **Internship Type**: 0-5 points (in-person: 5, hybrid: 4, virtual: 0)
- **Cost of Living**: 1-5 points (tier1: 1, tier2: 3, tier3: 5)

### Customization Points
- **CSV Format**: Modify `app/csv_config.json` for new column structures
- **Scoring Logic**: Update `processData()` function in `app/api/utils/processData.js` for new scoring categories
- **Data Cleaning**: Add new cleaning functions following existing patterns
- **UI Components**: Extend React components for new features

### Troubleshooting
- **File Upload**: Verify CSV format matches config, check 10MB limit
- **Scoring Errors**: Ensure scale keys match between frontend/backend
- **LLM Issues**: Verify OpenAI API key and rate limits
- **File Not Found**: Check that files are uploaded to `public/uploads` (local) or `/tmp/uploads` (Vercel)

### Performance Features
- **Location Caching**: Reduces OpenAI API calls by caching cleaned locations
- **Batch Processing**: Processes locations in batches of 5 to optimize API usage
- **Flexible Layout**: Responsive design for different screen sizes
- **Real-time Updates**: Context-based state management

For detailed setup instructions and advanced configuration, see the technical sections above.
