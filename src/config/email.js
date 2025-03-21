import config from './config.js';

export const emailConfig = {
    service: 'gmail',
    auth: {
        user: config.email.auth.user,
        pass: config.email.auth.pass // Make sure this is your Gmail App Password
    },
    debug: true,
    tls: {
        rejectUnauthorized: false
    }
};

// Test configuration
console.log('Email Config (without sensitive data):', {
    service: emailConfig.service,
    user: emailConfig.auth.user
}); 