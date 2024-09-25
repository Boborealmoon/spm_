"use client";

import React, { useState } from "react";
import {
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  MenuItem,
  Select,
  FormControl,
  InputLabel
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { addMonths, subMonths } from "date-fns"; // Importing date functions

export default function RecurringArrangementForm() {
    const [staffId, setStaffId] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [dayOfWeek, setDayOfWeek] = useState('');
    const [reason, setReason] = useState('');

  // Current date and date restrictions
  const today = new Date(); // Current date
  const minDate = subMonths(today, 2); // 2 months back
  const maxDate = addMonths(today, 3); // 3 months in front

  // Handles form submission
  const handleSubmit = async () => {

    // Prepare payload to match the backend schema
    const payload = {
      staff_id: staffId,
      start_date: startDate,
      end_date: endDate,
      day_of_week: dayOfWeek,
      reason: reason // WFH request reason
    };

    console.log(payload); // For debugging purposes

    try {
      const response = await fetch('http://localhost:4000/wfh_recurring_request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload), // Send the payload
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Request successful:", data);
      } else {
        console.error("Request failed:", response.statusText);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Handles form cancellation
  const handleCancel = () => {
    setStaffId('');
    setStartDate(null);
    setEndDate(null);
    setDayOfWeek('');
    setReason('');
    console.log("Form cancelled");
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Paper elevation={3} sx={{ padding: 4, width: "100%", maxWidth: 600 }}>
        <Typography variant="h6" gutterBottom>
          WFH Recurring Request Application
        </Typography>

        <form noValidate autoComplete="off">
          <TextField
            label="Staff ID"
            value={staffId}
            onChange={(e) => setStaffId(e.target.value)}
            fullWidth
            margin="normal"
            required
          />

          <DatePicker
            label="Start Date"
            value={startDate}
            onChange={(newValue) => setStartDate(newValue)}
            renderInput={(params) => (
              <TextField {...params} fullWidth margin="normal" required />
            )}
          />

          <DatePicker
            label="End Date"
            value={endDate}
            onChange={(newValue) => setEndDate(newValue)}
            renderInput={(params) => (
              <TextField {...params} fullWidth margin="normal" required />
            )}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Day of the Week</InputLabel>
            <Select
              value={dayOfWeek}
              onChange={(e) => setDayOfWeek(e.target.value)}
              label="Day of the Week"
            >
              <MenuItem value={1}>Monday</MenuItem>
              <MenuItem value={2}>Tuesday</MenuItem>
              <MenuItem value={3}>Wednesday</MenuItem>
              <MenuItem value={4}>Thursday</MenuItem>
              <MenuItem value={5}>Friday</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            multiline
            rows={4}
            margin="normal"
            required
          />

          <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2, marginTop: 2 }}>
            <Button variant="outlined" color="secondary" onClick={handleCancel}>
              Cancel
            </Button>
            <Button variant="contained" color="primary" onClick={handleSubmit}>
              Submit
            </Button>
          </Box>
        </form>
      </Paper>
    </LocalizationProvider>
  );
}
