const express = require('express');
const router = express.Router();
const client = require('../databasepg');

// Get all recurring requests
router.get('/', async (req, res) => {
    try{
        const result = await client.query(`
            SELECT * FROM recurring_request
        `);
        console.log(result.rows)
        res.status(200).json(result.rows)
    }catch(error){
        console.error('Error retreiving all recurring_request:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});

// Insert recurring WFH request
router.post('/submit', async (req, res) => {
    const { staff_id, start_date, end_date, day_of_week, request_reason, timeslot } = req.body;

    // Validate required fields
    if (!staff_id || !start_date || !end_date || !day_of_week || !request_reason || !timeslot) {
        return res.status(400).json({ message: 'Staff ID, start date, end date, day of week, request reason, and timeslot are required.' });
    }

    // Check if the day_of_week is valid (1-5)
    if (day_of_week < 1 || day_of_week > 5) {
        return res.status(400).json({ message: 'Day of week must be between 1 (Monday) and 5 (Friday).' });
    }

    // Check if the timeslot is valid
    if (!['AM', 'PM', 'FD'].includes(timeslot)) {
        return res.status(400).json({ message: 'Timeslot must be either AM, PM, or FD (Full Day).' });
    }

    // Calculate wfh_dates
    const wfh_dates = [];
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    const targetDay = (day_of_week % 7); // Convert 1-5 to 0-4 (Monday to Friday)

    for (let date = startDate; date <= endDate; date.setDate(date.getDate() + 1)) {
        if (date.getDay() === targetDay) {
            wfh_dates.push(date.toISOString().split('T')[0]); // Store date as YYYY-MM-DD
        }
    }

    try {
        // Fetch existing dates from recurring_request and wfh_records table
        const existingDatesResult = await client.query(`
            SELECT unnest(wfh_dates) AS date FROM recurring_request
            UNION ALL
            SELECT wfh_date FROM wfh_records; 
        `);

        // Convert existing dates to a Set
        const existingDates = new Set(existingDatesResult.rows.map(row => row.date));

        console.log('Existing Dates:', Array.from(existingDates)); // Debugging: Log existing dates
        console.log('Calculated wfh_dates:', wfh_dates); // Debugging: Log calculated wfh_dates

        // Check for overlaps
        const overlaps = wfh_dates.some(date => existingDates.has(date));
        if (overlaps) {
            return res.status(409).json({ message: 'One or more requested WFH dates overlap with existing dates.' });
        }

        // Insert into recurring_request table
        const result = await client.query(
            `
            INSERT INTO recurring_request (staff_id, start_date, end_date, day_of_week, request_reason, timeslot, wfh_dates, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'Pending')
            RETURNING requestID;
            `,
            [staff_id, start_date, end_date, day_of_week, request_reason, timeslot, wfh_dates]
        );

        const requestID = result.rows[0].requestID;

        res.status(201).json({ message: 'Recurring WFH request submitted successfully', requestID });
    } catch (error) {
        console.error('Error submitting recurring WFH request:', error);
        res.status(500).json({ message: 'Please fill up the form. ' + error.message });
    }
});

// Delete recurring WFH request
router.delete('/:requestID', async (req, res) => {
    const { requestID } = req.params;

    // Validate requestID
    if (!requestID) {
        return res.status(400).json({ message: 'Request ID is required.' });
    }

    try {
        // Delete from recurring_request table
        const result = await client.query(
            `
            DELETE FROM recurring_request
            WHERE requestID = $1
            RETURNING requestID;
            `,
            [requestID]
        );

        // Check if any rows were deleted
        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'Request not found.' });
        }

        res.status(200).json({ message: 'Recurring WFH request deleted successfully', requestID });
    } catch (error) {
        console.error('Error deleting recurring WFH request:', error);
        res.status(500).json({ message: 'Internal server error. ' + error.message });
    }
});


module.exports = router;