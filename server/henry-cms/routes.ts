import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pageManager, themeManager, mediaManager, configManager } from './adapter';

const router = Router();

// Set up file uploads for media
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'public/uploads/henry-cms');
    
    // Ensure the directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// API routes for pages
router.get('/pages', (req, res) => {
  try {
    const pages = pageManager.getAllPages();
    res.json(pages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pages/:slug', (req, res) => {
  try {
    const page = pageManager.getPageBySlug(req.params.slug);
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json(page);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/pages', (req, res) => {
  try {
    const { title, content, description, slug, tags, status } = req.body;
    
    if (!title || !content || !slug) {
      return res.status(400).json({ error: 'Title, content, and slug are required' });
    }
    
    const newPage = pageManager.createPage({
      title,
      content,
      description: description || '',
      slug,
      tags: tags || '',
      status: status || 'published'
    });
    
    res.status(201).json(newPage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/pages/:slug', (req, res) => {
  try {
    const { title, content, description, tags, status } = req.body;
    const { slug } = req.params;
    
    const updatedPage = pageManager.updatePage(slug, {
      title,
      content,
      description,
      tags,
      status
    });
    
    res.json(updatedPage);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/pages/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    pageManager.deletePage(slug);
    
    res.json({ success: true, message: 'Page deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API routes for themes
router.get('/themes', (req, res) => {
  try {
    const themes = themeManager.getAllThemes();
    res.json(themes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/themes/active', (req, res) => {
  try {
    const activeTheme = themeManager.getActiveTheme();
    res.json(activeTheme);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/themes/active', (req, res) => {
  try {
    const { themeId } = req.body;
    
    if (!themeId) {
      return res.status(400).json({ error: 'Theme ID is required' });
    }
    
    const updatedTheme = themeManager.setActiveTheme(themeId);
    res.json(updatedTheme);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API routes for media
router.get('/media', (req, res) => {
  try {
    const media = mediaManager.getAllMedia();
    res.json(media);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/media', upload.single('file'), (req, res) => {
  try {
    const file = req.file;
    
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const { title, altText } = req.body;
    
    const newMedia = mediaManager.addMedia({
      filename: file.filename,
      originalFilename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      url: `/uploads/henry-cms/${file.filename}`,
      title: title || file.originalname,
      altText: altText || ''
    });
    
    res.status(201).json(newMedia);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/media/:id', (req, res) => {
  try {
    const { id } = req.params;
    mediaManager.deleteMedia(id);
    
    res.json({ success: true, message: 'Media deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// API routes for configuration
router.get('/config', (req, res) => {
  try {
    const config = configManager.getConfig();
    
    // Don't send the admin password hash
    const { adminPasswordHash, ...safeConfig } = config;
    
    res.json(safeConfig);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/config', (req, res) => {
  try {
    const { siteTitle, siteDescription, siteKeywords, language, theme } = req.body;
    
    const updatedConfig = configManager.updateConfig({
      siteTitle,
      siteDescription,
      siteKeywords,
      language,
      theme
    });
    
    // Don't send the admin password hash
    const { adminPasswordHash, ...safeConfig } = updatedConfig;
    
    res.json(safeConfig);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;