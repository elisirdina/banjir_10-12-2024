// Sample data structure for testing when API is unavailable
const sampleData = [
    { negeri: "KELANTAN", jumlah_mangsa: "150", nama_pps: "PPS 1" },
    { negeri: "TERENGGANU", jumlah_mangsa: "200", nama_pps: "PPS 2" },
    { negeri: "PAHANG", jumlah_mangsa: "175", nama_pps: "PPS 3" },
    // Add more sample data as needed
];

// Fetch data from the API through our proxy server
async function fetchData() {
    try {
        console.log('Fetching data from proxy server...');
        const response = await fetch('http://localhost:3000/api/flood-data');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Data received:', data);
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
        
        // Display error message
        document.querySelector('.dashboard').innerHTML = `
            <div style="background-color: #f8d7da; color: #721c24; padding: 20px; text-align: center; margin-bottom: 20px; border-radius: 4px;">
                <h2>⚠️ Error Loading Data</h2>
                <p>Unable to connect to the server. Please make sure the Node.js server is running.</p>
                <p>Error details: ${error.message}</p>
                <p>To start the server:</p>
                <ol style="text-align: left; max-width: 500px; margin: 0 auto;">
                    <li>Open terminal in the project directory</li>
                    <li>Run: npm install</li>
                    <li>Run: npm start</li>
                </ol>
            </div>
        `;
        return null;
    }
}

// Process and transform data
function processData(data) {
    if (!data) return null;

    // Group data by state
    const stateData = d3.group(data, d => d.negeri);
    
    // Calculate statistics
    const statistics = {
        totalPPS: data.length,
        totalVictims: d3.sum(data, d => parseInt(d.jumlah_mangsa) || 0),
        byState: Array.from(stateData, ([state, values]) => ({
            state,
            ppsCount: values.length,
            victims: d3.sum(values, d => parseInt(d.jumlah_mangsa) || 0)
        }))
    };

    return statistics;
}

// Update statistics display
function updateStats(stats) {
    const totalPPS = d3.select('#total-pps')
        .append('div')
        .attr('class', 'stat-box');

    totalPPS.append('h3')
        .text('Total PPS');
    
    totalPPS.append('p')
        .text(stats.totalPPS);

    const totalVictims = d3.select('#total-victims')
        .append('div')
        .attr('class', 'stat-box');

    totalVictims.append('h3')
        .text('Total Victims');
    
    totalVictims.append('p')
        .text(stats.totalVictims);
}

// Create bar chart for states
function createStateChart(data) {
    const margin = {top: 20, right: 20, bottom: 60, left: 60};
    const width = 500 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select('#state-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .range([height, 0]);

    x.domain(data.byState.map(d => d.state));
    y.domain([0, d3.max(data.byState, d => d.ppsCount)]);

    // Add X axis
    svg.append('g')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)');

    // Add Y axis
    svg.append('g')
        .call(d3.axisLeft(y));

    // Add bars
    svg.selectAll('.bar')
        .data(data.byState)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.state))
        .attr('width', x.bandwidth())
        .attr('y', d => y(d.ppsCount))
        .attr('height', d => height - y(d.ppsCount));

    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 0)
        .attr('text-anchor', 'middle')
        .text('PPS Count by State');
}

// Create table with detailed information
function createTable(data) {
    const table = d3.select('#table-container')
        .append('table');

    const headers = ['State', 'PPS Count', 'Total Victims'];

    table.append('thead')
        .append('tr')
        .selectAll('th')
        .data(headers)
        .enter()
        .append('th')
        .text(d => d);

    const tbody = table.append('tbody');

    const rows = tbody.selectAll('tr')
        .data(data.byState)
        .enter()
        .append('tr');

    rows.append('td')
        .text(d => d.state);
    rows.append('td')
        .text(d => d.ppsCount);
    rows.append('td')
        .text(d => d.victims);
}

// Initialize dashboard
async function initDashboard() {
    const rawData = await fetchData();
    if (!rawData) {
        console.error('Failed to load data');
        return;
    }

    const processedData = processData(rawData);
    updateStats(processedData);
    createStateChart(processedData);
    createTable(processedData);
}

// Start the dashboard
initDashboard();
