const Lecturer = require('../models/Lecturer');
const Review = require('../models/Review');
const PastPaper = require('../models/PastPaper');

// POST /api/lecturers
// Creates a new lecturer profile in the database
const createLecturer = async (req, res) => {
  try {
    const { name, department } = req.body;
    if (!name || !department) {
      return res.status(400).json({ message: 'Name and department are required' });
    }

    // Creates the lecturer document in MongoDB
    const lecturer = await Lecturer.create({ name, department });
    res.status(201).json(lecturer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/lecturers
// Fetches all lecturers and dynamically calculates their rating averages
const getLecturers = async (req, res) => {
  try {
    const { q } = req.query;
    const filter = {};
    // Performs fuzzy text search on lecturer name if query is provided
    if (q) {
      filter.name = { $regex: q, $options: 'i' };
    }

    const lecturers = await Lecturer.find(filter).sort({ name: 1 });
    
    // Calculates rating summaries (average stars, recommend %) for each lecturer
    const summaries = await Promise.all(lecturers.map(async (l) => {
      const reviews = await Review.find({ lecturer: l._id });
      const total = reviews.length;
      // Calculates average of ratings using reduce array helper
      const avg = total > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : '0.0';
      // Calculates percentage of students who selected "would recommend"
      const recommendPercent = total > 0 ? Math.round((reviews.filter(r => r.recommend).length / total) * 100) : 0;
      
      return {
        ...l.toJSON(),
        averageRating: Number(avg),
        recommendPercentage: recommendPercent,
        totalReviews: total
      };
    }));

    res.json(summaries);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/lecturers/:id
// Fetches full detail metrics, reviews list, and exam papers for a lecturer
const getLecturerDetails = async (req, res) => {
  try {
    const lecturer = await Lecturer.findById(req.params.id);
    if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });

    // Parallel promise fetching reviews and past papers to save backend time
    const [reviews, papers] = await Promise.all([
      Review.find({ lecturer: req.params.id })
        .populate('student', 'username profilePhoto') // Join student details
        .sort({ createdAt: -1 }),
      PastPaper.find({ lecturer: req.params.id })
        .populate('uploadedBy', 'username') // Join uploader details
        .sort({ createdAt: -1 })
    ]);

    const total = reviews.length;
    const avg = total > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / total).toFixed(1) : '0.0';
    const recommendPercent = total > 0 ? Math.round((reviews.filter(r => r.recommend).length / total) * 100) : 0;

    res.json({
      lecturer,
      reviews,
      pastPapers: papers,
      averageRating: Number(avg),
      recommendPercentage: recommendPercent,
      totalReviews: total
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lecturers/:id/reviews
// Submits student rating feedback and stores it in MongoDB
const addReview = async (req, res) => {
  try {
    const { rating, recommend, comment, courseCode } = req.body;
    if (!rating || !comment || !courseCode) {
      return res.status(400).json({ message: 'Rating, comment, and course code are required' });
    }

    // Creates the review document linked to lecturer ID and logged-in user
    const review = await Review.create({
      lecturer: req.params.id,
      student: req.user._id,
      rating: Number(rating),
      recommend: recommend === 'true' || recommend === true,
      comment,
      courseCode
    });

    await review.populate('student', 'username profilePhoto');
    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/lecturers/:id/papers
// Saves uploader details and Cloudinary media link for revision documents
const uploadPastPaper = async (req, res) => {
  try {
    const { courseCode } = req.body;
    if (!req.file) return res.status(400).json({ message: 'Paper file is required' });
    if (!courseCode) return res.status(400).json({ message: 'Course code is required' });

    // Creates past paper record in MongoDB
    const paper = await PastPaper.create({
      lecturer: req.params.id,
      uploadedBy: req.user._id,
      courseCode,
      fileUrl: req.file.path, // Cloudinary file path/URL
      fileName: req.file.originalname
    });

    await paper.populate('uploadedBy', 'username');
    res.status(201).json(paper);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/lecturers/:id
// Updates lecturer profile information (name or department)
const updateLecturer = async (req, res) => {
  try {
    const { name, department } = req.body;
    const lecturer = await Lecturer.findById(req.params.id);
    if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });

    if (name) lecturer.name = name;
    if (department) lecturer.department = department;

    await lecturer.save();
    res.json(lecturer);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/lecturers/:id
// Wipes out lecturer profile, along with all associated reviews and papers (Cascading Delete)
const deleteLecturer = async (req, res) => {
  try {
    const lecturer = await Lecturer.findById(req.params.id);
    if (!lecturer) return res.status(404).json({ message: 'Lecturer not found' });

    // Promise.all deletes all linked reviews and papers simultaneously
    await Promise.all([
      Review.deleteMany({ lecturer: req.params.id }),
      PastPaper.deleteMany({ lecturer: req.params.id }),
      Lecturer.findByIdAndDelete(req.params.id)
    ]);

    res.json({ message: 'Lecturer and associated data deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/lecturers/review/:reviewId
// Allows authors (or admins) to edit their submitted reviews
const editReview = async (req, res) => {
  try {
    const { rating, recommend, comment, courseCode } = req.body;
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Authorization check: must be owner of review or administrator
    if (review.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to edit this review' });
    }

    if (rating !== undefined) review.rating = Number(rating);
    if (recommend !== undefined) review.recommend = recommend === 'true' || recommend === true;
    if (comment !== undefined) review.comment = comment;
    if (courseCode !== undefined) review.courseCode = courseCode;

    await review.save();
    await review.populate('student', 'username profilePhoto');
    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/lecturers/review/:reviewId
// Allows review authors (or admins) to delete comments
const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ message: 'Review not found' });

    // Authorization check: creator or administrator only
    if (review.student.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this review' });
    }

    await Review.findByIdAndDelete(req.params.reviewId);
    res.json({ message: 'Review deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/lecturers/paper/:paperId
// Allows paper uploaders (or admins) to delete document resources
const deletePastPaper = async (req, res) => {
  try {
    const pastPaper = await PastPaper.findById(req.params.paperId);
    if (!pastPaper) return res.status(404).json({ message: 'Past paper not found' });

    // Authorization check: owner or admin
    if (pastPaper.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this past paper' });
    }

    await PastPaper.findByIdAndDelete(req.params.paperId);
    res.json({ message: 'Past paper deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createLecturer,
  getLecturers,
  getLecturerDetails,
  addReview,
  uploadPastPaper,
  updateLecturer,
  deleteLecturer,
  editReview,
  deleteReview,
  deletePastPaper
};
