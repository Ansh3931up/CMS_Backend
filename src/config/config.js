import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get directory name in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Email configuration
const config = {
    email: {
        host: process.env.SMTP_HOST || 'smtp.example.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true' || false,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD
        },
        tls:{
            rejectUnauthorized: false
        },
        senderName: process.env.SMTP_SENDER_NAME || 'College Management System'
    }
};
console.log("config", config.email);

// Log configuration (but not in production)
if (process.env.NODE_ENV !== 'production') {
    console.log('Email Configuration:', {
        auth: {
            user: config.email.auth.user,
            password: '****'
        },
        senderName: config.email.senderName
    });
}

export default config; 