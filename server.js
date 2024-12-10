const express = require('express');
const cors = require('cors');
const axios = require('axios');
const app = express();

// Enable CORS for all routes
app.use(cors());

// Serve static files from the current directory
app.use(express.static('./'));

// Proxy endpoint
app.get('/api/flood-data', async (req, res) => {
    try {
        console.log('Fetching data from JKM API...');
        const response = await axios.get('https://infobencanajkmv2.jkm.gov.my/api/data-dashboard-table-pps.php', {
            params: {
                a: 0,
                b: 0,
                seasonmain_id: 208,
                seasonnegeri_id: ''
            },
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            },
            timeout: 10000 // 10 second timeout
        });

        console.log('Response status:', response.status);
        console.log('Response data type:', typeof response.data);
        
        // Ensure we're sending an array
        const data = Array.isArray(response.data) ? response.data : 
                    (response.data.data ? response.data.data : []);
        
        console.log(`Processed ${data.length} records`);
        res.json(data);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        if (error.response) {
            console.error('Error response:', error.response.data);
        }
        res.status(500).json({ 
            error: 'Failed to fetch data',
            message: error.message,
            details: error.response ? error.response.data : null
        });
    }
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
