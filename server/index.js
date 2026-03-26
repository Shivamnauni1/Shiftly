require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client')));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/users', require('./routes/users'));
app.use('/api/ratings', require('./routes/ratings'));

// Midnight cleanup — runs once at next midnight then every 24 hours
const Job = require('./models/Job');
const { markNoShows, markCompletedShifts } = require('./controllers/applicationController');

async function runMidnightTasks() {
  try {
    const now = new Date();
    console.log('Running midnight tasks at', now.toLocaleString());

    // 1. Mark no-shows and completed shifts
    await markNoShows();
    await markCompletedShifts();

    // 2. Mark expired jobs as completed
    await Job.updateMany(
      { shiftEndsAt: { $lt: now }, status: { $in: ['open', 'filling', 'full'] } },
      { status: 'completed' }
    );

    // 3. Delete jobs older than 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const result = await Job.deleteMany({ shiftEndsAt: { $lt: thirtyDaysAgo } });
    console.log(`Cleanup: removed ${result.deletedCount} old jobs`);
  } catch (err) {
    console.error('Midnight task error:', err.message);
  }
}

function scheduleMidnight() {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const msUntilMidnight = midnight - now;
  setTimeout(() => {
    runMidnightTasks();
    setInterval(runMidnightTasks, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
  console.log(`Midnight tasks scheduled in ${Math.round(msUntilMidnight / 60000)} minutes`);
}

scheduleMidnight();

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/index.html'));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
