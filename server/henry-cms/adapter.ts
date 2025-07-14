import fs from 'fs';
import path from 'path';
import * as process from 'process';

// Use a regular path approach instead of import.meta.url
const dataDir = path.join(process.cwd(), 'data/henry-cms');

// Ensure our data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// File paths for our data storage
const pagesFile = path.join(dataDir, 'pages.json');
const themesFile = path.join(dataDir, 'themes.json');
const mediaFile = path.join(dataDir, 'media.json');
const configFile = path.join(dataDir, 'config.json');

// Initialize files if they don't exist
function initDataFiles() {
  // Initialize pages
  if (!fs.existsSync(pagesFile)) {
    fs.writeFileSync(pagesFile, JSON.stringify({
      pages: [
        {
          id: '1',
          slug: 'home',
          title: 'Welcome to getBPay',
          description: 'Modern digital tipping and payment splitting platform',
          content: '# Welcome to getBPay\n\nA modern digital tipping and payment splitting platform that empowers service workers with flexible financial tools and seamless integration across multiple ecosystems.\n\n## Key Features\n\n- Virtual tipping cards\n- Multi-platform payment allocation\n- WordPress plugin integration\n- Chrome browser extension',
          tags: 'home,welcome,payment',
          datetime: new Date().toISOString(),
          status: 'published'
        },
        {
          id: '2',
          slug: 'about',
          title: 'About getBPay',
          description: 'Learn more about our mission and team',
          content: '# About getBPay\n\nFounded in 2023, getBPay is dedicated to revolutionizing the tipping economy by providing service workers with modern financial tools that work across all platforms.\n\n## Our Mission\n\nTo empower service workers with flexible, simple payment solutions that integrate seamlessly with their existing workflows.',
          tags: 'about,mission,team',
          datetime: new Date().toISOString(),
          status: 'published'
        }
      ]
    }, null, 2), 'utf8');
  }

  // Initialize themes
  if (!fs.existsSync(themesFile)) {
    fs.writeFileSync(themesFile, JSON.stringify({
      themes: [
        {
          id: '1',
          name: 'Default',
          directory: 'default',
          isActive: true
        },
        {
          id: '2',
          name: 'Jumbotron',
          directory: 'jumbotron',
          isActive: false
        }
      ]
    }, null, 2), 'utf8');
  }

  // Initialize media
  if (!fs.existsSync(mediaFile)) {
    fs.writeFileSync(mediaFile, JSON.stringify({
      media: []
    }, null, 2), 'utf8');
  }

  // Initialize config
  if (!fs.existsSync(configFile)) {
    fs.writeFileSync(configFile, JSON.stringify({
      siteTitle: 'getBPay',
      siteDescription: 'Modern digital tipping and payment splitting platform',
      siteKeywords: 'tipping, payments, service workers, digital payments',
      language: 'en',
      theme: 'default',
      adminUsername: 'admin',
      adminPasswordHash: '$2b$10$EncryptedPasswordHashHereXYZ', // This would be a properly hashed password in production
    }, null, 2), 'utf8');
  }
}

// Initialize data files on module load
initDataFiles();

// Helper function to read JSON files
function readJsonFile(filePath: string) {
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw new Error(`Failed to read data from ${filePath}`);
  }
}

// Helper function to write JSON files
function writeJsonFile(filePath: string, data: any) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Error writing to file ${filePath}:`, error);
    throw new Error(`Failed to write data to ${filePath}`);
  }
}

// Page management
export const pageManager = {
  // Get all pages
  getAllPages: () => {
    const data = readJsonFile(pagesFile);
    return data.pages;
  },

  // Get a page by slug
  getPageBySlug: (slug: string) => {
    const data = readJsonFile(pagesFile);
    return data.pages.find((page: any) => page.slug === slug);
  },

  // Create a new page
  createPage: (pageData: any) => {
    const data = readJsonFile(pagesFile);
    const newPage = {
      id: Date.now().toString(),
      ...pageData,
      datetime: new Date().toISOString()
    };
    
    data.pages.push(newPage);
    writeJsonFile(pagesFile, data);
    
    return newPage;
  },

  // Update a page
  updatePage: (slug: string, updates: any) => {
    const data = readJsonFile(pagesFile);
    const pageIndex = data.pages.findIndex((page: any) => page.slug === slug);
    
    if (pageIndex === -1) {
      throw new Error(`Page with slug "${slug}" not found`);
    }
    
    data.pages[pageIndex] = {
      ...data.pages[pageIndex],
      ...updates,
      datetime: new Date().toISOString()
    };
    
    writeJsonFile(pagesFile, data);
    
    return data.pages[pageIndex];
  },

  // Delete a page
  deletePage: (slug: string) => {
    const data = readJsonFile(pagesFile);
    const pageIndex = data.pages.findIndex((page: any) => page.slug === slug);
    
    if (pageIndex === -1) {
      throw new Error(`Page with slug "${slug}" not found`);
    }
    
    data.pages.splice(pageIndex, 1);
    writeJsonFile(pagesFile, data);
    
    return { success: true };
  }
};

// Theme management
export const themeManager = {
  // Get all themes
  getAllThemes: () => {
    const data = readJsonFile(themesFile);
    return data.themes;
  },

  // Get active theme
  getActiveTheme: () => {
    const data = readJsonFile(themesFile);
    return data.themes.find((theme: any) => theme.isActive);
  },

  // Set active theme
  setActiveTheme: (themeId: string) => {
    const data = readJsonFile(themesFile);
    
    // Deactivate all themes
    data.themes.forEach((theme: any) => {
      theme.isActive = false;
    });
    
    // Activate the selected theme
    const themeIndex = data.themes.findIndex((theme: any) => theme.id === themeId);
    
    if (themeIndex === -1) {
      throw new Error(`Theme with ID "${themeId}" not found`);
    }
    
    data.themes[themeIndex].isActive = true;
    writeJsonFile(themesFile, data);
    
    return data.themes[themeIndex];
  }
};

// Media management
export const mediaManager = {
  // Get all media
  getAllMedia: () => {
    const data = readJsonFile(mediaFile);
    return data.media;
  },

  // Add new media item
  addMedia: (mediaData: any) => {
    const data = readJsonFile(mediaFile);
    const newMedia = {
      id: Date.now().toString(),
      ...mediaData,
      uploadedAt: new Date().toISOString()
    };
    
    data.media.push(newMedia);
    writeJsonFile(mediaFile, data);
    
    return newMedia;
  },

  // Delete media item
  deleteMedia: (mediaId: string) => {
    const data = readJsonFile(mediaFile);
    const mediaIndex = data.media.findIndex((media: any) => media.id === mediaId);
    
    if (mediaIndex === -1) {
      throw new Error(`Media with ID "${mediaId}" not found`);
    }
    
    data.media.splice(mediaIndex, 1);
    writeJsonFile(mediaFile, data);
    
    return { success: true };
  }
};

// Site configuration
export const configManager = {
  // Get site configuration
  getConfig: () => {
    return readJsonFile(configFile);
  },

  // Update site configuration
  updateConfig: (updates: any) => {
    const config = readJsonFile(configFile);
    const updatedConfig = {
      ...config,
      ...updates
    };
    
    writeJsonFile(configFile, updatedConfig);
    
    return updatedConfig;
  }
};