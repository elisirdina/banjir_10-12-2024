// Fetch data from the API through our proxy server
async function fetchData() {
    try {
        console.log('Fetching data from proxy server...');
        const response = await fetch('http://localhost:3000/api/flood-data');
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('Raw data structure:', data);
        return Array.isArray(data) ? data : (data.data || []); // Handle possible data wrapper
    } catch (error) {
        console.error('Error fetching data:', error);
        document.querySelector('.dashboard').innerHTML = `
            <div style="background-color: #f8d7da; color: #721c24; padding: 20px; text-align: center; margin-bottom: 20px; border-radius: 4px;">
                <h2>⚠️ Error Loading Data</h2>
                <p>Unable to connect to the server. Please make sure the Node.js server is running.</p>
                <p>Error details: ${error.message}</p>
            </div>
        `;
        return null;
    }
}

// Process and transform data
function processData(data) {
    if (!data || !Array.isArray(data)) {
        console.error('Invalid data format:', data);
        return {
            totalPPS: 0,
            totalVictims: 0,
            byState: []
        };
    }

    try {
        // Group data by state using vanilla JS instead of d3.group
        const stateMap = new Map();
        
        data.forEach(item => {
            const state = item.negeri || 'Unknown';
            if (!stateMap.has(state)) {
                stateMap.set(state, {
                    state: state,
                    ppsCount: 0,
                    victims: 0,
                    ppsList: []
                });
            }
            
            const stateData = stateMap.get(state);
            stateData.ppsCount++;
            stateData.victims += parseInt(item.jumlah_mangsa || 0);
            stateData.ppsList.push(item.nama_pps);
        });

        const statistics = {
            totalPPS: data.length,
            totalVictims: Array.from(stateMap.values()).reduce((sum, state) => sum + state.victims, 0),
            byState: Array.from(stateMap.values())
        };

        console.log('Processed statistics:', statistics);
        return statistics;
    } catch (error) {
        console.error('Error processing data:', error);
        return {
            totalPPS: 0,
            totalVictims: 0,
            byState: []
        };
    }
}

// Update statistics display
function updateStats(stats) {
    if (!stats) return;

    const totalPPS = d3.select('#total-pps')
        .html('')  // Clear existing content
        .append('div')
        .attr('class', 'stat-box');

    totalPPS.append('h3')
        .text('Total PPS');
    
    totalPPS.append('p')
        .text(stats.totalPPS.toLocaleString());

    const totalVictims = d3.select('#total-victims')
        .html('')  // Clear existing content
        .append('div')
        .attr('class', 'stat-box');

    totalVictims.append('h3')
        .text('Total Victims');
    
    totalVictims.append('p')
        .text(stats.totalVictims.toLocaleString());
}

// Create bar chart for states
function createStateChart(data) {
    if (!data || !data.byState || !data.byState.length) {
        console.error('Invalid data for chart:', data);
        return;
    }

    // Clear existing chart
    d3.select('#state-chart').html('');

    const margin = {top: 30, right: 30, bottom: 90, left: 60};
    const width = 600 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select('#state-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

    // Sort states by PPS count
    const sortedData = [...data.byState].sort((a, b) => b.ppsCount - a.ppsCount);

    const x = d3.scaleBand()
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .range([height, 0]);

    x.domain(sortedData.map(d => d.state));
    y.domain([0, d3.max(sortedData, d => d.ppsCount)]);

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

    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .style('font-size', '16px')
        .text('PPS Count by State');

    // Add bars
    svg.selectAll('.bar')
        .data(sortedData)
        .enter()
        .append('rect')
        .attr('class', 'bar')
        .attr('x', d => x(d.state))
        .attr('width', x.bandwidth())
        .attr('y', d => y(d.ppsCount))
        .attr('height', d => height - y(d.ppsCount))
        .on('mouseover', function(event, d) {
            d3.select(this).style('opacity', 0.8);
            // Add tooltip if needed
        })
        .on('mouseout', function(event, d) {
            d3.select(this).style('opacity', 1);
        });
}

// Create table with detailed information
function createTable(data) {
    if (!data || !data.byState) return;

    // Clear existing table
    const tableContainer = d3.select('#table-container').html('');

    const table = tableContainer.append('table');
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
        .text(d => d.ppsCount.toLocaleString());
    rows.append('td')
        .text(d => d.victims.toLocaleString());
}

// Initialize dashboard
async function initDashboard() {
    const rawData = await fetchData();
    if (!rawData) {
        console.error('No data available');
        return;
    }

    const processedData = processData(rawData);
    console.log('Final processed data:', processedData);
    
    updateStats(processedData);
    createStateChart(processedData);
    createTable(processedData);
}

// Start the dashboard
initDashboard();
