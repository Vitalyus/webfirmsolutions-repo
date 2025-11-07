const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const NODE_ENV = process.env.NODE_ENV || 'development';
const ADMIN_KEY = process.env.ADMIN_KEY || 'webfirm_admin_2024';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');

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
  origin: NODE_ENV === 'production' ? [CORS_ORIGIN] : ['http://localhost:4200', 'http://localhost:4201'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parser middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Ensure data directory exists
async function ensureDataDirectory() {
  try {
    await fs.access(DATA_DIR);
  } catch (error) {
    await fs.mkdir(DATA_DIR, { recursive: true });
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

// Simple in-memory captcha store (in production, use Redis or similar)
const captchaStore = new Map();

// Generate mathematical captcha
function generateCaptcha() {
  const operations = [
    { symbol: '+', operation: (a, b) => a + b },
    { symbol: '-', operation: (a, b) => a - b },
    { symbol: '*', operation: (a, b) => a * b }
  ];

  const num1 = Math.floor(Math.random() * 10) + 1;
  const num2 = Math.floor(Math.random() * 10) + 1;
  const operation = operations[Math.floor(Math.random() * operations.length)];
  
  let firstNum = num1;
  let secondNum = num2;
  if (operation.symbol === '-' && num1 < num2) {
    firstNum = num2;
    secondNum = num1;
  }
  
  if (operation.symbol === '*') {
    firstNum = Math.floor(Math.random() * 5) + 1;
    secondNum = Math.floor(Math.random() * 5) + 1;
  }

  const answer = operation.operation(firstNum, secondNum);
  const question = `${firstNum} ${operation.symbol} ${secondNum}`;
  const id = Math.random().toString(36).substring(2, 15);

  captchaStore.set(id, { answer, timestamp: Date.now() });
  
  // Clean old captchas (older than 10 minutes)
  setTimeout(() => captchaStore.delete(id), 10 * 60 * 1000);

  return { question, id };
}

// Validate captcha
function validateCaptcha(captchaId, userAnswer) {
  const stored = captchaStore.get(captchaId);
  if (!stored) {
    return false;
  }
  
  // Check if captcha is expired (10 minutes)
  if (Date.now() - stored.timestamp > 10 * 60 * 1000) {
    captchaStore.delete(captchaId);
    return false;
  }
  
  const numericAnswer = parseInt(userAnswer, 10);
  const isValid = !isNaN(numericAnswer) && numericAnswer === stored.answer;
  
  // Remove captcha after validation attempt
  captchaStore.delete(captchaId);
  
  return isValid;
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

// Generate captcha
app.get('/api/captcha', (req, res) => {
  try {
    const captcha = generateCaptcha();
    res.json({
      success: true,
      captcha
    });
  } catch (error) {
    console.error('Captcha generation error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate captcha'
    });
  }
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
    
    const { name, email, message, captcha, captchaId } = req.body;
    
    // Validate captcha if provided
    if (captcha && captchaId) {
      if (!validateCaptcha(captchaId, captcha)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid or expired captcha. Please try again.'
        });
      }
    }
    
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
    if (adminKey !== ADMIN_KEY) {
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
    if (adminKey !== ADMIN_KEY) {
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