const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    
    // Drop existing tables if they exist
    db.serialize(() => {
      db.run(`DROP TABLE IF EXISTS otps`);
      db.run(`DROP TABLE IF EXISTS users`);
      db.run(`DROP TABLE IF EXISTS escrow`);
      
      // Create tables with correct schema
      db.run(`
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          wallet_address TEXT,
          wallet_type TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      db.run(`
        CREATE TABLE IF NOT EXISTS otps (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          email TEXT NOT NULL,
          otp TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          expires_at DATETIME NOT NULL,
          is_used INTEGER DEFAULT 0
        )
      `);

      db.run(`
        CREATE TABLE IF NOT EXISTS escrow (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          beneficiary_email TEXT NOT NULL,
          beneficiary_name TEXT NOT NULL,
          amount TEXT NOT NULL,
          currency TEXT NOT NULL,
          sender_wallet_address TEXT NOT NULL,
          sender_wallet_type TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          claimed_at DATETIME,
          FOREIGN KEY (beneficiary_email) REFERENCES users(email)
        )
      `);
    });
  }
});

// Create a transporter for sending emails
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Generate a random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// API Routes

// 1. Send OTP to email
app.post('/api/send-otp', async (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10); // OTP expires in 10 minutes
    
    // Store OTP in database
    db.run(
      'INSERT INTO otps (email, otp, expires_at) VALUES (?, ?, ?)',
      [email, otp, expiresAt.toISOString()],
      function(err) {
        if (err) {
          console.error('Error storing OTP:', err);
          return res.status(500).json({ error: 'Failed to send OTP' });
        }
        
        // Send OTP via email
        const mailOptions = {
          from: 'your-email@gmail.com', // Replace with your email
          to: email,
          subject: 'Your Reppay Verification Code',
          text: `Your Reppay verification code is: ${otp}. This code will expire in 10 minutes.`
        };
        
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('Error sending email:', error);
            return res.status(500).json({ error: 'Failed to send OTP' });
          }
          
          console.log('Email sent:', info.response);
          res.json({ success: true, message: 'OTP sent successfully' });
        });
      }
    );
  } catch (error) {
    console.error('Error in send-otp:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 2. Verify OTP
app.post('/api/verify-otp', (req, res) => {
  const { email, otp } = req.body;
  
  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP are required' });
  }
  
  try {
    // Find the most recent OTP for this email
    db.get(
      `SELECT * FROM otps 
       WHERE email = ? AND otp = ? AND is_used = 0 AND expires_at > datetime('now')
       ORDER BY created_at DESC LIMIT 1`,
      [email, otp],
      (err, row) => {
        if (err) {
          console.error('Error verifying OTP:', err);
          return res.status(500).json({ error: 'Failed to verify OTP' });
        }
        
        if (!row) {
          return res.status(400).json({ error: 'Invalid or expired OTP' });
        }
        
        // Mark OTP as used
        db.run('UPDATE otps SET is_used = 1 WHERE id = ?', [row.id], (err) => {
          if (err) {
            console.error('Error updating OTP status:', err);
          }
        });
        
        res.json({ success: true, message: 'OTP verified successfully' });
      }
    );
  } catch (error) {
    console.error('Error in verify-otp:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 3. Connect wallet and complete signup
app.post('/api/connect-wallet', (req, res) => {
  const { email, name, walletAddress, walletType } = req.body;
  
  if (!email || !name || !walletAddress || !walletType) {
    return res.status(400).json({ error: 'Email, name, wallet address, and wallet type are required' });
  }
  
  try {
    // Check if user already exists
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) {
        console.error('Error checking user:', err);
        return res.status(500).json({ error: 'Failed to connect wallet' });
      }
      
      if (row) {
        // Update existing user
        db.run(
          'UPDATE users SET name = ?, wallet_address = ?, wallet_type = ? WHERE email = ?',
          [name, walletAddress, walletType, email],
          function(err) {
            if (err) {
              console.error('Error updating user:', err);
              return res.status(500).json({ error: 'Failed to connect wallet' });
            }
            
            res.json({ 
              success: true, 
              message: 'Wallet connected successfully',
              userId: row.id
            });
          }
        );
      } else {
        // Create new user
        db.run(
          'INSERT INTO users (email, name, wallet_address, wallet_type) VALUES (?, ?, ?, ?)',
          [email, name, walletAddress, walletType],
          function(err) {
            if (err) {
              console.error('Error creating user:', err);
              return res.status(500).json({ error: 'Failed to connect wallet' });
            }
            
            res.json({ 
              success: true, 
              message: 'Wallet connected successfully',
              userId: this.lastID
            });
          }
        );
      }
    });
  } catch (error) {
    console.error('Error in connect-wallet:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 4. Get user by email
app.get('/api/user/:email', (req, res) => {
  const { email } = req.params;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
      if (err) {
        console.error('Error getting user:', err);
        return res.status(500).json({ error: 'Failed to get user information' });
      }
      
      if (!row) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json({ 
        success: true, 
        user: {
          id: row.id,
          email: row.email,
          name: row.name,
          wallet_address: row.wallet_address,
          wallet_type: row.wallet_type
        }
      });
    });
  } catch (error) {
    console.error('Error in get user:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 5. Create escrow transfer
app.post('/api/escrow/create', (req, res) => {
  const { 
    beneficiaryEmail, 
    beneficiaryName, 
    amount, 
    currency,
    senderWalletAddress,
    senderWalletType 
  } = req.body;
  
  if (!beneficiaryEmail || !beneficiaryName || !amount || !currency || !senderWalletAddress || !senderWalletType) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  
  try {
    db.run(
      `INSERT INTO escrow (
        beneficiary_email, 
        beneficiary_name, 
        amount, 
        currency,
        sender_wallet_address,
        sender_wallet_type
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [beneficiaryEmail, beneficiaryName, amount, currency, senderWalletAddress, senderWalletType],
      function(err) {
        if (err) {
          console.error('Error creating escrow:', err);
          return res.status(500).json({ error: 'Failed to create escrow' });
        }
        
        res.json({ 
          success: true, 
          message: 'Escrow created successfully',
          escrowId: this.lastID
        });
      }
    );
  } catch (error) {
    console.error('Error in create escrow:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 6. Get escrow balance for a user
app.get('/api/escrow/balance/:email', (req, res) => {
  const { email } = req.params;
  
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  
  try {
    db.all(
      `SELECT * FROM escrow 
       WHERE beneficiary_email = ? AND status = 'pending'
       ORDER BY created_at DESC`,
      [email],
      (err, rows) => {
        if (err) {
          console.error('Error getting escrow balance:', err);
          return res.status(500).json({ error: 'Failed to get escrow balance' });
        }
        
        res.json({ 
          success: true, 
          escrowEntries: rows
        });
      }
    );
  } catch (error) {
    console.error('Error in get escrow balance:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// 7. Claim escrow
app.post('/api/escrow/claim/:id', (req, res) => {
  const { id } = req.params;
  const { beneficiaryEmail } = req.body;
  
  if (!id || !beneficiaryEmail) {
    return res.status(400).json({ error: 'Escrow ID and beneficiary email are required' });
  }
  
  try {
    // First verify that the escrow belongs to the beneficiary
    db.get(
      'SELECT * FROM escrow WHERE id = ? AND beneficiary_email = ? AND status = ?',
      [id, beneficiaryEmail, 'pending'],
      (err, row) => {
        if (err) {
          console.error('Error verifying escrow:', err);
          return res.status(500).json({ error: 'Failed to verify escrow' });
        }
        
        if (!row) {
          return res.status(404).json({ error: 'Escrow not found or already claimed' });
        }
        
        // Update escrow status to claimed
        db.run(
          'UPDATE escrow SET status = ?, claimed_at = datetime("now") WHERE id = ?',
          ['claimed', id],
          function(err) {
            if (err) {
              console.error('Error claiming escrow:', err);
              return res.status(500).json({ error: 'Failed to claim escrow' });
            }
            
            res.json({ 
              success: true, 
              message: 'Escrow claimed successfully',
              amount: row.amount,
              currency: row.currency
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Error in claim escrow:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 