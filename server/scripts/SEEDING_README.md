# Codeforces Problem Seeding

This directory contains scripts to seed problems from Codeforces into your FloatPoint Online Judge database.

## 📁 Available Scripts

### 1. `seedCodeforcesProblems.js` - Full Featured Version
- **Purpose**: Complete problem seeding with detailed scraping
- **Features**:
  - Fetches real problem statements from Codeforces
  - Extracts actual test cases from problem pages
  - Gets time/memory limits from problem pages
  - Handles rate limiting and error recovery
  - Processes up to 100 problems by default

### 2. `seedCodeforcesSimple.js` - Quick Version
- **Purpose**: Fast seeding for testing and development
- **Features**:
  - Uses only Codeforces API (no web scraping)
  - Generates sample test cases based on difficulty
  - Creates basic problem statements
  - Processes up to 20 problems by default
  - Much faster execution

### 3. `seedProblems.js` - Original Script
- **Purpose**: Original seeding script (may have issues)
- **Features**: Basic problem fetching with Puppeteer

### 4. `clearProblems.js` - Cleanup Script
- **Purpose**: Remove all problems from database
- **Use**: Clean slate before seeding

## 🚀 Quick Start

### Prerequisites
1. **MongoDB running** on `localhost:27017` (or set `DATABASE_URL` env var)
2. **Node.js dependencies installed**:
   ```bash
   cd server
   npm install
   ```

### Basic Usage

#### Option 1: Simple Seeding (Recommended for testing)
```bash
cd server
npm run seed:codeforces:simple
```

#### Option 2: Full Seeding (Recommended for production)
```bash
cd server
npm run seed:codeforces
```

#### Option 3: Clear all problems first
```bash
cd server
npm run clear:problems
npm run seed:codeforces:simple
```

## ⚙️ Configuration

### Environment Variables
Create a `.env` file in the `server` directory:
```env
DATABASE_URL=mongodb://localhost:27017/FloatPoint
```

### Script Configuration
Edit the `CONFIG` object in the scripts:

```javascript
const CONFIG = {
  mongoURI: process.env.DATABASE_URL || 'mongodb://localhost:27017/FloatPoint',
  maxProblems: 100,        // Number of problems to fetch
  delayBetweenRequests: 1000, // Delay between requests (ms)
  headless: true,          // Run browser in headless mode
  userAgent: 'Mozilla/5.0...' // User agent for requests
};
```

## 📊 What Gets Seeded

Each problem includes:
- **Basic Info**: ID, name, tags, difficulty
- **Scoring**: Points based on Codeforces rating
- **Limits**: Time and memory limits
- **Statistics**: Submission and success counts
- **Content**: Full problem statement (HTML)
- **Test Cases**: Sample input/output pairs

### Difficulty Mapping
- **Easy**: Rating ≤ 1200
- **Medium**: Rating 1201-1800  
- **Hard**: Rating > 1800

### Points Calculation
- Points = max(100, min(2000, rating))
- Default: 100 points if no rating

## 🔧 Troubleshooting

### Common Issues

#### 1. MongoDB Connection Error
```
❌ MongoDB connection error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution**: Start MongoDB service
```bash
# Windows
net start MongoDB

# macOS/Linux
brew services start mongodb-community
# or
sudo systemctl start mongod
```

#### 2. Rate Limiting
```
❌ Error fetching problem: Request failed with status code 429
```
**Solution**: Increase delay between requests
```javascript
delayBetweenRequests: 3000, // 3 seconds
```

#### 3. Puppeteer Issues
```
❌ Error: Failed to launch the browser
```
**Solution**: Install Puppeteer dependencies
```bash
# Linux
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

#### 4. Memory Issues
```
❌ Error: Page crashed
```
**Solution**: Reduce maxProblems or add memory limits
```javascript
maxProblems: 50, // Reduce number of problems
```

### Debug Mode
Run with debug logging:
```bash
DEBUG=* npm run seed:codeforces:simple
```

## 📈 Performance Tips

### For Large Seeding (100+ problems)
1. **Use the simple script first** to test
2. **Increase delays** between requests
3. **Run during off-peak hours**
4. **Monitor system resources**

### For Production
1. **Use the full script** for complete data
2. **Set appropriate delays** (2-3 seconds)
3. **Monitor Codeforces rate limits**
4. **Have backup/rollback plan**

## 🔄 Batch Processing

For very large datasets, consider:
1. **Split into batches** (50 problems each)
2. **Run overnight** with longer delays
3. **Use database transactions** for consistency
4. **Implement resume functionality**

## 📝 Logs and Monitoring

The scripts provide detailed logging:
- ✅ Success operations
- ❌ Error conditions  
- ⏳ Progress updates
- 📊 Final statistics

Example output:
```
🚀 Starting Codeforces problem seeding...

✅ MongoDB connected successfully
📡 Fetching problems from Codeforces API...
✅ Found 100 problems from API

📝 Processing problem 1/100: 1A - Theatre Square
✅ Processed: Theatre Square (easy, 100 points, 2 test cases)
⏳ Waiting 1000ms before next request...

📊 Summary:
   ✅ Saved/Updated: 95
   ❌ Failed: 5
   📝 Total processed: 100

🎉 Codeforces problem seeding completed successfully!
```

## 🤝 Contributing

To improve the seeding scripts:
1. **Test with small datasets** first
2. **Add error handling** for edge cases
3. **Implement retry logic** for failed requests
4. **Add progress bars** for better UX
5. **Create unit tests** for critical functions

## 📚 API Reference

### Codeforces API
- **Endpoint**: `https://codeforces.com/api/problemset.problems`
- **Rate Limit**: ~100 requests per 5 minutes
- **Response**: JSON with problems and statistics

### Problem Schema
```javascript
{
  id: String,           // "1A"
  name: String,         // "Theatre Square"
  tags: [String],       // ["math", "implementation"]
  public: Boolean,      // true
  contest: [String],    // ["1"]
  point: Number,        // 100
  timeLimit: Number,    // 1 (seconds)
  memoryLimit: Number,  // 256 (MB)
  difficulty: String,   // "easy" | "medium" | "hard"
  noOfSubm: Number,     // 12345
  noOfSuccess: Number,  // 9876
  task: String,         // HTML problem statement
  testcase: [{
    stdin: String,      // "2 3 4"
    stdout: String      // "4"
  }]
}
```

---

**Happy Seeding! 🎉**
