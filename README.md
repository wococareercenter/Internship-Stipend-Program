# ISP Platform

A FastAPI backend and React frontend application for processing and scoring internship stipend applications. Upload CSV files, validate data, clean location/hours information, and calculate scores based on configurable scales.

## Quick Start

### Prerequisites
- Python 3.8+, Node.js 16+, OpenAI API key

### Setup
1. **Backend**: `cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload`
2. **Frontend**: `cd frontend && npm install && npm run dev`
3. **Environment**: Create `backend/.env` with `OPENAI_API_KEY=your_key_here`
4. **Access**: Open `http://localhost:3000`

### Basic Usage
1. **Upload CSV** - Click "Upload File" and select your CSV
2. **Configure Scale** - Click "Set Your Scale" to adjust scoring weights
3. **View Results** - Click student cards to see detailed breakdowns
4. **Refresh Scores** - Modify scale and click "Refresh for a different scale"

## Configuration

### Adding New CSV Columns
Edit `backend/csv_config.json`:
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
1. **Update Scale Component** (`frontend/app/components/Scale.js`):
   - Add new state variables for your category
   - Create UI inputs for scoring values
   - Include in `currentScale` object

2. **Update Backend Scoring** (`backend/app/main.py`):
   - Add scoring logic in `process_data()` function
   - Map CSV values to scale keys
   - Calculate scores and add to `score_breakdown`

3. **Update Frontend Display** (`frontend/app/components/Result.js`):
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

// In main.py - Add scoring
if record.get('work_experience'):
    exp_type = record['work_experience'].lower()
    exp_scores = scale['work_experience']
    exp_score = exp_scores.get(exp_type, 0)
    score_breakdown['work_experience'] = exp_score
    score += exp_score
```

## Technical Documentation

### Architecture
- **Backend**: FastAPI with pandas for data processing, OpenAI for location cleaning
- **Frontend**: React with context management, responsive design
- **Data Flow**: CSV upload → validation → cleaning → scoring → display

### Key Components

#### Backend (`backend/app/main.py`)
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
- `GET/DELETE /api/cache` - Location cache management

### Data Processing Pipeline
1. **Validation**: Check required columns and data formats
2. **Cleaning**: Standardize locations (LLM) and hours (regex)
3. **Scoring**: Calculate scores based on configurable scales
4. **Display**: Show results with validation warnings

### Score Calculation
- **FAFSA Need**: 0-5 points (very high: 5, high: 4, moderate: 3, low: 2, none: 0)
- **Paid Status**: 4-5 points (paid: 4, unpaid: 5)
- **Internship Type**: 0-5 points (in-person: 5, hybrid: 4, virtual: 0)
- **Cost of Living**: 1-5 points (tier1: 1, tier2: 3, tier3: 5)

### Customization Points
- **CSV Format**: Modify `csv_config.json` for new column structures
- **Scoring Logic**: Update `process_data()` function for new scoring categories
- **Data Cleaning**: Add new cleaning functions following existing patterns
- **UI Components**: Extend React components for new features

### Troubleshooting
- **Backend Connection**: Check port 8000 and CORS settings
- **File Upload**: Verify CSV format matches config, check 10MB limit
- **Scoring Errors**: Ensure scale keys match between frontend/backend
- **LLM Issues**: Verify OpenAI API key and rate limits

### Performance Features
- **Location Caching**: Reduces OpenAI API calls
- **Async Processing**: ThreadPoolExecutor for location cleaning
- **Flexible Layout**: Responsive design for different screen sizes
- **Real-time Updates**: Context-based state management

For detailed setup instructions and advanced configuration, see the technical sections above.
