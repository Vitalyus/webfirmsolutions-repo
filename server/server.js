const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const MESSAGES_FILE = path.join(__dirname, 'data', 'messages.json');

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to contact endpoint
app.use('/api/contact', limiter);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:4200', 'https://webfirmsolutions.com'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Ensure data directory exists
async function ensureDataDirectory() {
  const dataDir = path.join(__dirname, 'data');
  try {
    await fs.access(dataDir);
  } catch (error) {
    await fs.mkdir(dataDir, { recursive: true });
  }
  
  // Initialize messages file if it doesn't exist
  try {
    await fs.access(MESSAGES_FILE);
  } catch (error) {
    await fs.writeFile(MESSAGES_FILE, JSON.stringify([], null, 2));
  }
}

// Load messages from file
async function loadMessages() {
  try {
    const data = await fs.readFile(MESSAGES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading messages:', error);
    return [];
  }
}

// Save messages to file
async function saveMessages(messages) {
  try {
    await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving messages:', error);
    return false;
  }
}

// Validate contact form data
function validateContactData(data) {
  const { name, email, message } = data;
  
  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long' };
  }
  
  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return { valid: false, error: 'Valid email address is required' };
  }
  
  if (!message || typeof message !== 'string' || message.trim().length < 10) {
    return { valid: false, error: 'Message must be at least 10 characters long' };
  }
  
  return { valid: true };
}

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'Web Firm Solutions Backend'
  });
});

// Submit contact form
app.post('/api/contact', async (req, res) => {
  try {
    // Validate input
    const validation = validateContactData(req.body);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error
      });
    }
    
    const { name, email, message } = req.body;
    
    // Create message object
    const newMessage = {
      id: Date.now().toString(),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      timestamp: new Date().toISOString(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      status: 'new'
    };
    
    // Load existing messages
    const messages = await loadMessages();
    
    // Add new message
    messages.push(newMessage);
    
    // Save messages
    const saved = await saveMessages(messages);
    
    if (saved) {
      console.log(`New message received from ${name} (${email}) at ${new Date().toISOString()}`);
      
      res.json({
        success: true,
        message: 'Message received successfully',
        id: newMessage.id
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to save message'
      });
    }
    
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Admin route - get all messages (simple auth with query param)
app.get('/api/admin/messages', async (req, res) => {
  try {
    // Simple authentication - in production use proper auth
    const adminKey = req.query.key;
    if (adminKey !== 'webfirm_admin_2024') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    const messages = await loadMessages();
    
    res.json({
      success: true,
      messages: messages.reverse(), // Show newest first
      total: messages.length
    });
    
  } catch (error) {
    console.error('Admin messages error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load messages'
    });
  }
});

// Admin route - mark message as read
app.post('/api/admin/messages/:id/read', async (req, res) => {
  try {
    const adminKey = req.query.key;
    if (adminKey !== 'webfirm_admin_2024') {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }
    
    const messageId = req.params.id;
    const messages = await loadMessages();
    
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Message not found'
      });
    }
    
    messages[messageIndex].status = 'read';
    messages[messageIndex].readAt = new Date().toISOString();
    
    const saved = await saveMessages(messages);
    
    if (saved) {
      res.json({
        success: true,
        message: 'Message marked as read'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to update message'
      });
    }
    
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Serve static files from Angular build
app.use(express.static(path.join(__dirname, '../dist/webfirmsolutions-angular/browser')));

// Catch-all handler for Angular routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/webfirmsolutions-angular/browser/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Start server
async function startServer() {
  try {
    await ensureDataDirectory();
    
    app.listen(PORT, () => {
      console.log(`🚀 Web Firm Solutions server running on port ${PORT}`);
      console.log(`📧 Contact API: http://localhost:${PORT}/api/contact`);
      console.log(`👨‍💼 Admin panel: http://localhost:${PORT}/api/admin/messages?key=webfirm_admin_2024`);
      console.log(`💾 Messages stored in: ${MESSAGES_FILE}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;