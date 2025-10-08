# API Integration Guide

## Environment Setup

The app uses environment variables to configure the API endpoint. The configuration is stored in `.env`:

```
API_BASE_URL=http://localhost:8077
```

### Configuration
- **API_BASE_URL**: Base URL for the transaction analysis API (default: `http://localhost:8077`)

## DeepSeek Transaction Analysis API

### Endpoint
`POST /analyze-transactions`

### Request
```json
{
  "text": "coffee $5"
}
```

### Response
```json
[
  {
    "name": "Makan",
    "amount": 5000,
    "category": "food",
    "type": "outcome"
  }
]
```

**Response Fields:**
- `name` (string): Description of the transaction
- `amount` (number): Transaction amount
- `category` (string): Category in lowercase (food, shopping, transport, etc.)
- `type` (string): Transaction type - `"outcome"` for expenses, `"income"` for income
```

### Integration Flow

1. **User Input**: User types a message in the chat (e.g., "Makan 5000")
2. **API Call**: App sends POST request to `/analyze-transactions` with the text
3. **AI Processing**: DeepSeek API analyzes the text and extracts transaction details
4. **Response Handling**: App receives array of transaction objects
   - Maps `"outcome"` → `"expense"` for internal use
   - Capitalizes category names (e.g., "food" → "Food")
   - Uses `name` field as transaction description
5. **Transaction Creation**: App adds transaction to financial data
6. **User Feedback**: Shows formatted confirmation in chat with emojis
7. **Fallback**: If API fails or returns empty array, app uses local heuristic parsing

### Error Handling

The AIService includes robust error handling:
- **Network Errors**: Falls back to local parsing if API is unreachable
- **Invalid Responses**: Falls back if API returns unexpected data
- **Timeout**: Uses local parsing as backup

### Local Fallback Parsing

If the API is unavailable, the app uses built-in heuristic rules to parse:
- Amount extraction from text (e.g., "$5", "5", "5.00")
- Category detection from keywords (shopping, food, transport, etc.)
- Transaction type inference (expense, income, reminder, budget)

## Usage Example

```typescript
import AIService from '../services/AIService';

// Parse user input
const command = await AIService.parseNaturalLanguage("Makan 5000");

// Command structure returned:
// {
//   type: 'expense',
//   action: 'add_expense',
//   data: {
//     amount: 5000,
//     category: 'Food',
//     description: 'Makan'
//   }
// }

// Chat assistant will show:
// "✅ Logged expense: Makan
//  💰 Amount: $5,000
//  📁 Category: Food"
```

## Development

### Testing with Local API

1. Start your backend server on `http://localhost:8077`
2. Ensure `/analyze-transactions` endpoint is available
3. Launch the app with `npm start`
4. Test by entering transactions in the chat

### Testing Fallback Mode

To test the fallback parsing without the API:
1. Stop the backend server
2. The app will automatically use local parsing
3. Check console for: `Error calling analyze-transactions API`

## Environment Variables Setup

### For Development
1. Ensure `.env` file exists in project root
2. Set `API_BASE_URL=http://localhost:8077`
3. Restart Metro bundler after changing `.env`

### For Production
1. Update `.env` with production API URL
2. Rebuild the app
3. Ensure production API is accessible from the device/emulator

## Security Notes

- API calls use standard `fetch` API
- No authentication implemented (add as needed)
- HTTPS recommended for production
- Consider adding user_id query parameter for multi-user support

## Future Enhancements

- [ ] Add authentication headers
- [ ] Implement request retry logic
- [ ] Add request/response caching
- [ ] Support batch transaction analysis
- [ ] Add user_id parameter for personalized analysis
