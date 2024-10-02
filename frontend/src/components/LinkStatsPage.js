import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, Area, PieChart, Pie, Cell } from 'recharts';
import { DatePicker, Button, Table } from 'antd';
import dayjs from 'dayjs';
import 'antd/dist/reset.css';
import './LinkStatsPage.css';

const LinkStatsPage = () => {
    const { shortLink } = useParams();
    const navigate = useNavigate();
    const [chartData, setChartData] = useState([]);
    const [referrerData, setReferrerData] = useState([]);
    const [startDate, setStartDate] = useState(dayjs().subtract(1, 'day').format());
    const [endDate, setEndDate] = useState(dayjs().format());
    const [firstClickDate, setFirstClickDate] = useState(null);
    const [totalClicks, setTotalClicks] = useState(0);
    const [destinationLink, setDestinationLink] = useState(''); // State für den Ziel-Link

    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4444';

    const processChartData = useCallback((data) => {
        const clickDetails = data.clickDetails.map(d => ({
            timestamp: new Date(d.timestamp),
            referrer: d.referrer || 'Unknown'
        }));

        if (clickDetails.length > 0) {
            const earliestClick = clickDetails.reduce((min, current) => (current.timestamp < min ? current.timestamp : min), clickDetails[0].timestamp);
            setFirstClickDate(earliestClick);
        } else {
            setFirstClickDate(dayjs('2024-09-08').toDate());
        }

        const start = startDate ? new Date(startDate) : new Date(0);
        const end = endDate ? new Date(endDate) : new Date();

        const filteredDetails = clickDetails.filter(d => d.timestamp >= start && d.timestamp <= end);

        // Calculate the total number of clicks in the filtered period
        setTotalClicks(filteredDetails.length);

        const diffInMinutes = (new Date(endDate) - new Date(startDate)) / (1000 * 60);
        const groupBy = diffInMinutes <= 60 ? 'minute' : (diffInMinutes <= 24 * 60 ? 'hour' : 'day');
        const timeFormat = groupBy === 'minute' ? 'YYYY-MM-DDTHH:mm' : (groupBy === 'hour' ? 'YYYY-MM-DDTHH' : 'YYYY-MM-DD');

        const timeMap = new Map();

        const timeStep = groupBy === 'minute' ? 1 : (groupBy === 'hour' ? 60 : 24 * 60);
        for (let ts = new Date(start); ts <= end; ts.setMinutes(ts.getMinutes() + timeStep)) {
            const formattedTime = dayjs(ts).format(timeFormat);
            timeMap.set(formattedTime, 0);
        }

        filteredDetails.forEach(({ timestamp }) => {
            const timeKey = dayjs(timestamp).format(timeFormat);
            timeMap.set(timeKey, (timeMap.get(timeKey) || 0) + 1);
        });

        setChartData([...timeMap.entries()].map(([time, clicks]) => ({ time, clicks })));

        const referrerCounts = filteredDetails.reduce((acc, curr) => {
            if (!acc[curr.referrer]) {
                acc[curr.referrer] = 0;
            }
            acc[curr.referrer]++;
            return acc;
        }, {});

        setReferrerData(Object.entries(referrerCounts).map(([referrer, count]) => ({ referrer, count })));
    }, [startDate, endDate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await fetch(API_URL + `/api/stats/${shortLink}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                if (!response.ok) throw new Error('Failed to fetch data');
                const result = await response.json();

                // Set the destination link from the API response
                setDestinationLink(result.destinationLink || 'No destination link available');

                processChartData(result);
            } catch (error) {
                console.error(error);
            }
        };
        fetchData();
    }, [shortLink, startDate, endDate, processChartData]);

    const handleDateRangeChange = (dates) => {
        if (dates) {
            const [start, end] = dates;
            const now = dayjs();

            let adjustedEnd = end;
            if (adjustedEnd.isAfter(now)) {
                adjustedEnd = now;
            }

            setStartDate(start ? start.format() : null);
            setEndDate(adjustedEnd ? adjustedEnd.format() : null);
        }
    };

    const disableFutureDates = (current) => {
        return current && current > dayjs().endOf('day');
    };

    const handleAllTime = () => {
        const earliestDate = firstClickDate ? dayjs(firstClickDate).format() : dayjs('2024-09-06').format();
        setStartDate(earliestDate);
        setEndDate(dayjs().format());
    };

    const columns = [
        {
            title: 'Referrer',
            dataIndex: 'referrer',
            key: 'referrer',
            sorter: (a, b) => a.referrer.localeCompare(b.referrer),
            render: (text) => <span className="referrer-cell">{text}</span>
        },
        {
            title: 'Click Count',
            dataIndex: 'count',
            key: 'count',
            sorter: (a, b) => b.count - a.count,
        },
    ];

    return (
        <div className="link-stats-page">
            <h1>Stats for /{shortLink} -&gt; {destinationLink}</h1>

            <div className="filter-container">
                <span>Period:</span>
                <Button onClick={() => { setStartDate(dayjs().subtract(30, 'minutes').format()); setEndDate(dayjs().format()); }}>Last 30 Minutes</Button>
                <Button onClick={() => { setStartDate(dayjs().subtract(1, 'day').format()); setEndDate(dayjs().format()); }}>Last 24 Hours</Button>
                <Button onClick={() => { setStartDate(dayjs().subtract(7, 'day').format()); setEndDate(dayjs().format()); }}>Last 7 Days</Button>
                <Button onClick={() => { setStartDate(dayjs().subtract(30, 'day').format()); setEndDate(dayjs().format()); }}>Last 30 Days</Button>
                <Button onClick={handleAllTime}>All Time</Button>
                <DatePicker.RangePicker
                    showTime
                    format="DD.MM.YYYY HH:mm:ss"
                    onChange={handleDateRangeChange}
                    value={startDate && endDate ? [dayjs(startDate), dayjs(endDate)] : []}
                    disabledDate={disableFutureDates}
                />
            </div>

            {/* Display total number of clicks */}
            <div className="total-clicks-container">
                <h2>Total clicks in the selected period: {totalClicks}</h2>
            </div>

            <div className="charts-container">
                <div className="chart">
                    <h2>Clicks Over Time</h2>
                    <AreaChart width={600} height={400} data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" tickFormatter={(tick) => dayjs(tick).format('DD.MM.YYYY HH:mm')} />
                        <YAxis />
                        <Tooltip />
                        <Area type="monotone" dataKey="clicks" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                </div>

                <div className="chart">
                    <h2>Top Referrers</h2>
                    <PieChart width={600} height={400}>
                        <Pie data={referrerData} dataKey="count" nameKey="referrer" outerRadius={150} fill="#8884d8">
                            {referrerData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index % 4]} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value} clicks`} />
                    </PieChart>
                </div>
            </div>

            <div className="referrer-container">
                <h2>Referrer List</h2>
                <Table
                    columns={columns}
                    dataSource={referrerData}
                    rowKey="referrer"
                    pagination={false}
                    className="referrer-table"
                />
            </div>

            <Button className="dashboard-button" onClick={() => navigate('/dashboard')}>
                Back to Dashboard
            </Button>
        </div>
    );
};

export default LinkStatsPage;
