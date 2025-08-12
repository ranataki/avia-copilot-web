require('dotenv').config();
const { writeFileSync, readFileSync, existsSync, mkdirSync } = require('fs');
const { join } = require('path');

// Basic auth middleware
const authenticate = (event) => {
  const auth = event.headers.authorization || '';
  const [type, credentials] = auth.split(' ');
  
  if (type !== 'Basic') return false;
  
  const [username, password] = Buffer.from(credentials, 'base64')
    .toString()
    .split(':');
    
  return username === process.env.ADMIN_USER && 
         password === process.env.ADMIN_PASS;
};

// Ensure data directory exists
const dataDir = join(process.cwd(), 'private/data');
const emailsFile = join(dataDir, 'emails.json');

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

if (!existsSync(emailsFile)) {
  writeFileSync(emailsFile, '[]', 'utf8');
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers };
  }

  try {
    // GET - List emails (requires auth)
    if (event.httpMethod === 'GET') {
      if (!authenticate(event)) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ error: 'Unauthorized' })
        };
      }

      const emails = JSON.parse(readFileSync(emailsFile, 'utf8'));
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(emails)
      };
    }

    // POST - Add new email
    if (event.httpMethod === 'POST') {
      const { email } = JSON.parse(event.body);
      
      if (!email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid email' })
        };
      }

      const emails = JSON.parse(fs.readFileSync(emailsFile, 'utf8'));
      
      if (emails.includes(email)) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ error: 'Email already registered' })
        };
      }

      emails.push(email);
      fs.writeFileSync(emailsFile, JSON.stringify(emails, null, 2));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'Email registered successfully' })
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
