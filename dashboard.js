// Fetch data from the API
async function fetchData() {
    try {
        const response = await fetch('https://infobencanajkmv2.jkm.gov.my/api/data-dashboard-table-pps.php?a=0&b=0&seasonmain_id=208&seasonnegeri_id=');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching data:', error);
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
