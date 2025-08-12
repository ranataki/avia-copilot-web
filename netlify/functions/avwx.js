const fetch = require('node-fetch');

exports.handler = async function(event) {
  const { icao } = event.queryStringParameters;
  console.log('AVWX request for:', icao);
  console.log('AVWX token:', process.env.AVWX_TOKEN);
  
  if (!icao || !/^K[A-Z]{3}$/.test(icao)) {
    console.log('Invalid ICAO code:', icao);
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid ICAO code' })
    };
  }

  try {
    const url = `https://avwx.rest/api/metar/${icao}?options=summary,translate`;
    console.log('Fetching from:', url);
    
    const response = await fetch(url, {
      headers: { 
        Authorization: `Bearer ${process.env.AVWX_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const text = await response.text();
      console.error('AVWX API error:', response.status, text);
      throw new Error(`AVWX API error: ${response.status} - ${text}`);
    }
    
    const data = await response.json();
    console.log('AVWX success for:', icao);
    return {
      statusCode: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('AVWX proxy error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message || 'Failed to fetch weather data' })
    };
  }
};
