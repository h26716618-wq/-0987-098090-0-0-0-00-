const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.resolve(__dirname)));

const gradeSchema = new mongoose.Schema(
  {
    subject: { type: String, default: '' },
    first: { type: Number, default: 0 },
    second: { type: Number, default: 0 }
  },
  { _id: false }
);

const certificateSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    registrationNumber: { type: String, required: true, index: true },
    studentName: { type: String, required: true },
    studentCategory: { type: String, default: 'غير محدد' },
    studentCenter: { type: String, default: '' },
    sigName: { type: String, default: '' },
    attendance: { type: Number, default: 0 },
    absence: { type: Number, default: 0 },
    grades: { type: [gradeSchema], default: [] },
    lang: { type: String, default: 'ar' },
    average: { type: Number, default: null },
    certification: { type: mongoose.Schema.Types.Mixed, default: {} },

    certificationNumber: String,
    certificationType: String,
    completionDate: String,
    certificateLink: String,
    grade: String,
    hours: String,

    image: { type: String }
  },
  {
    strict: false,
    timestamps: { createdAt: 'savedAt', updatedAt: 'updatedAt' }
  }
);

const Certificate = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);

const mongoURL = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/certificates';
mongoose.set('strictQuery', true);

async function connectToMongo() {
  try {
    await mongoose.connect(mongoURL);
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB connection failed:', err.message);
    setTimeout(connectToMongo, 5000);
  }
}

connectToMongo();

app.get('/api/health', (req, res) => {
  const mongo = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'ok', mongo });
});

function toText(value, fallback = '') {
  return typeof value === 'string' ? value.trim() : fallback;
}

function normalizeGrades(grades) {
  if (!Array.isArray(grades)) return [];
  return grades.map((g) => ({
    subject: toText(g && g.subject, ''),
    first: Number((g && g.first) || 0),
    second: Number((g && g.second) || 0)
  }));
}

app.post('/api/certificates/save', async (req, res) => {
  try {
    const { registrationNumber, studentName, studentCategory, studentCenter, certification, image, id } = req.body;

    if (!registrationNumber || !studentName) {
      return res.status(400).json({ error: 'Missing required fields: registrationNumber and studentName' });
    }

    const certId = id || Date.now().toString();
    const certificationPayload = certification && typeof certification === 'object' ? certification : {};

    const resolvedCategory =
      toText(studentCategory) ||
      toText(certificationPayload.studentCategory) ||
      'غير محدد';

    const resolvedCenter = toText(studentCenter) || toText(certificationPayload.studentCenter);

    const certData = {
      ...certificationPayload,
      certification: certificationPayload,
      registrationNumber: toText(registrationNumber),
      studentName: toText(studentName),
      studentCategory: resolvedCategory,
      studentCenter: resolvedCenter,
      grades: normalizeGrades(certificationPayload.grades),
      image: toText(image) || null,
      id: certId
    };

    const certificate = await Certificate.findOneAndUpdate(
      { id: certId },
      { $set: certData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      success: true,
      message: 'Certificate saved successfully',
      id: certId,
      certificate
    });
  } catch (error) {
    console.error('Save certificate error:', error);
    res.status(500).json({ error: 'Failed to save certificate' });
  }
});

app.get('/api/certificates/list', async (req, res) => {
  try {
    const certificates = await Certificate.find()
      .select('-image')
      .sort({ updatedAt: -1 });

    res.json(certificates);
  } catch (error) {
    console.error('List certificates error:', error);
    res.status(500).json({ error: 'Failed to list certificates' });
  }
});

app.get('/api/certificates/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ id: req.params.id });
    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }
    res.json(certificate);
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ error: 'Failed to get certificate' });
  }
});

app.get('/api/certificates/image/:id', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ id: req.params.id });

    if (!certificate || !certificate.image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const imageStr = certificate.image;
    if (imageStr.includes(',')) {
      const [meta, base64Data] = imageStr.split(',', 2);
      const mimeMatch = meta.match(/^data:(.*?);base64$/);
      const mime = mimeMatch ? mimeMatch[1] : 'image/png';
      const imageBuffer = Buffer.from(base64Data, 'base64');
      res.setHeader('Content-Type', mime);
      return res.send(imageBuffer);
    }

    const imageBuffer = Buffer.from(imageStr, 'base64');
    res.setHeader('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Get certificate image error:', error);
    res.status(500).json({ error: 'Failed to load certificate image' });
  }
});

app.get('/api/certificates/search/byRegNumber/:regNum', async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ registrationNumber: req.params.regNum });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json(certificate);
  } catch (error) {
    console.error('Search certificate error:', error);
    res.status(500).json({ error: 'Failed to search certificate' });
  }
});

app.delete('/api/certificates/:id', async (req, res) => {
  try {
    const result = await Certificate.deleteOne({ id: req.params.id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json({ success: true, message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error('Delete certificate error:', error);
    res.status(500).json({ error: 'Failed to delete certificate' });
  }
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`🎓 Certificate server listening on port ${PORT}`);
  console.log(`🗄️ MongoDB URI configured: ${mongoURL ? 'yes' : 'no'}`);
});
