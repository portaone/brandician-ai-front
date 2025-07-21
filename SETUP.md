# Setup Guide

## Environment Configuration

### API Connection

The frontend needs to connect to the backend API. By default, it tries to connect to `http://localhost:8000`.

If your backend is running on a different port (like 8089), create a `.env` file in the root directory:

```bash
# .env
VITE_API_URL=http://localhost:8089
VITE_DEBUG=true
```

### Troubleshooting Connection Issues

If you see "Unable to connect to the server" errors:

1. **Check if the backend server is running**
   - Make sure your backend API is started and listening on the correct port

2. **Verify the port number**
   - Check what port your backend is running on
   - Update the `VITE_API_URL` in your `.env` file accordingly

3. **Enable debug mode**
   - Set `VITE_DEBUG=true` in your `.env` file
   - Check the browser console for detailed connection information

4. **Common API URLs**
   - Local development: `http://localhost:8000` (default)
   - Alternative port: `http://localhost:8089`
   - Docker setup: `http://localhost:PORT` (check your docker-compose)

### Development Server

After configuring the environment:

```bash
npm run dev
```

The frontend will automatically use the configured API URL.

### API Response Format

When saving a survey, the API should return a `SubmissionLink` object with the following structure:

```json
{
  "url": "https://example.com/survey/submission-link",
  "expires_at": "2024-12-31T23:59:59Z",
  "created_at": "2024-01-01T00:00:00Z"
}
```

The frontend will extract the `url` field and display it to the user for sharing the survey. 