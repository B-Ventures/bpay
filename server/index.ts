import express from "express";
import cors from "cors";
import { createServer } from "http";
import { dirname, resolve, join } from "path";
import { fileURLToPath } from "url";
import { registerRoutes } from "./routes";

const __dirname = dirname(fileURLToPath(import.meta.url));
const clientPath = resolve(__dirname, "..", "client");
const publicPath = resolve(__dirname, "..", "public"); // Link directly to root /public folder
const distPath = resolve(__dirname, "..", "dist", "public");

// Create Express server
const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Add headers for development
app.use((req, res, next) => {
  res.header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.header('Surrogate-Control', 'no-store');
  // Add CSP header to allow inline styles
  res.header('Content-Security-Policy', "default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline';");
  next();
});

// Serve static files from the dist/public directory (built React app)
app.use(express.static(distPath, {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }
}));

// Serve files from the public directory
app.use(express.static(publicPath, {
  etag: false,
  lastModified: false,
  setHeaders: (res) => {
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  }
}));

// Special route for Simple CMS
app.get('/simple-cms', (req, res) => {
  res.sendFile(resolve(publicPath, 'simple-cms.html'));
});

// Setup API routes
const server = registerRoutes(app);

// Special routes for test and checkout pages
app.get('/test.html', (req, res) => {
  res.sendFile(resolve(clientPath, 'public', 'test.html'));
});

app.get('/checkout', (req, res) => {
  res.sendFile(resolve(clientPath, 'public', 'checkout.html'));
});

app.get('/checkout/success', (req, res) => {
  res.sendFile(resolve(clientPath, 'public', 'checkout', 'success.html'));
});

// Catch-all route to serve React app index.html for all client-side routes
app.get('*', (req, res) => {
  // For production, we use the built index.html
  if (process.env.NODE_ENV === 'production') {
    res.sendFile(resolve(distPath, 'index.html'));
  } else {
    // For development, we serve from the client folder
    res.sendFile(resolve(clientPath, 'index.html'));
  }
});

// Start the server
server.listen(Number(port), () => {
  console.log(`Server running on port ${port}`);
});