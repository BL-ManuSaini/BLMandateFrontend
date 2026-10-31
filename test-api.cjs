const axios = require('axios');

const emails = ['am@bl.com', 'hoe@demo.bridgelabz.com', 'shubham.chaudhari@bridgelabz.com'];
const passwords = ['password', 'admin', 'admin123', 'password123', '123456', '12345678'];

async function test() {
  for (const email of emails) {
    for (const password of passwords) {
      try {
        console.log(`Trying ${email} with ${password}...`);
        const res = await axios.post('https://bluprint-mandate.onrender.com/api/auth/login', {
          email,
          password
        });
        console.log('Login Success!');
        const token = res.data.data ? res.data.data.token : res.data.token;
        
        // Fetch tech-stacks
        const tsRes = await axios.get('https://bluprint-mandate.onrender.com/api/lookups/tech-stacks?activeOnly=true&limit=10', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Tech Stacks lookup response:', JSON.stringify(tsRes.data, null, 2));

        // Fetch locations
        const locRes = await axios.get('https://bluprint-mandate.onrender.com/api/lookups/locations?activeOnly=true&limit=50', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Locations lookup response:', JSON.stringify(locRes.data, null, 2));
        return;
      } catch (err) {
        console.log('Error:', err.response ? err.response.data : err.message);
      }
    }
  }
}

test();
