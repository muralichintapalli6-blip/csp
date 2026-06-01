/* Prathibha High School LMS - LocalStorage-backed MongoDB-like Database Layer */

const DB_PREFIX = "prathibha_lms_v2_";

// --- SEED DATA ---
const DEFAULT_TEACHERS = [
  {
    id: "t_suresh",
    name: "Suresh Kumar",
    email: "suresh.maths@prathibha.com",
    password: "teacher123",
    assignedClasses: ["8", "9", "10"],
    assignedSubjects: ["Mathematics", "Computer Science"],
    status: "Active"
  },
  {
    id: "t_geetha",
    name: "Geetha Rani",
    email: "geetha.science@prathibha.com",
    password: "teacher123",
    assignedClasses: ["6", "7", "8"],
    assignedSubjects: ["Science"],
    status: "Active"
  },
  {
    id: "t_ramesh",
    name: "Ramesh Sharma",
    email: "ramesh.english@prathibha.com",
    password: "teacher123",
    assignedClasses: ["1", "2", "3", "4", "5", "6"],
    assignedSubjects: ["English", "Social Studies"],
    status: "Active"
  }
];

const DEFAULT_MATERIALS = [];

const DEFAULT_VIDEOS = [];

const DEFAULT_QUIZZES = [
  {
    id: "q_1",
    title: "Class 10 - Trigonometric Identities Quiz",
    subject: "Mathematics",
    classNum: "10",
    questions: [
      {
        question: "What is the value of sin²θ + cos²θ?",
        options: ["0", "1", "-1", "2"],
        correctAnswer: "1"
      },
      {
        question: "If sin θ = 3/5, what is the value of cos θ?",
        options: ["4/5", "3/4", "5/3", "2/5"],
        correctAnswer: "4/5"
      },
      {
        question: "What is 1 + tan²θ equal to?",
        options: ["sin²θ", "cos²θ", "sec²θ", "cosec²θ"],
        correctAnswer: "sec²θ"
      }
    ],
    createdBy: "t_suresh",
    isApproved: true
  },
  {
    id: "q_2",
    title: "Class 8 - Plant Cell & Animal Cell Anatomy Quiz",
    subject: "Science",
    classNum: "8",
    questions: [
      {
        question: "Which organelle is known as the powerhouse of the cell?",
        options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi Apparatus"],
        correctAnswer: "Mitochondria"
      },
      {
        question: "Which of the following is present ONLY in plant cells?",
        options: ["Cell Membrane", "Cell Wall", "Cytoplasm", "Nucleus"],
        correctAnswer: "Cell Wall"
      },
      {
        question: "What green pigment is responsible for photosynthesis?",
        options: ["Chlorophyll", "Hemoglobin", "Carotene", "Xanthophyll"],
        correctAnswer: "Chlorophyll"
      }
    ],
    createdBy: "t_geetha",
    isApproved: true
  },
  {
    id: "q_3",
    title: "Class 6 - Perfect Tenses Comprehension",
    subject: "English",
    classNum: "6",
    questions: [
      {
        question: "Choose the correct Present Perfect form: 'She ______ her homework already.'",
        options: ["finish", "finished", "has finished", "had finished"],
        correctAnswer: "has finished"
      },
      {
        question: "Identify the tense: 'By next week, we will have lived here for five years.'",
        options: ["Future Perfect", "Present Perfect", "Past Perfect", "Simple Future"],
        correctAnswer: "Future Perfect"
      }
    ],
    createdBy: "t_ramesh",
    isApproved: true
  }
];

const DEFAULT_ANNOUNCEMENTS = [
  {
    id: "a_1",
    title: "Welcome to Prathibha High School Digital Learning Hub",
    description: "In alignment with United Nations SDG 4 (Quality Education), our school is proud to introduce our centralized portal. Students can now access high-quality study notes, interactive video sessions, and assignments, while Teachers and the Principal manage all resources seamlessly. Let's learn today and lead tomorrow!",
    createdBy: "Principal (Admin)",
    date: "2026-06-01",
    classNum: "All"
  },
  {
    id: "a_2",
    title: "First Term Examination Timetable Released",
    description: "The term-end examinations for Classes 1 to 10 are scheduled to begin from June 15, 2026. Detailed schedules for each class have been uploaded. Please consult your respective subject teachers for revision worksheets and doubt clearing.",
    createdBy: "Principal (Admin)",
    date: "2026-06-01",
    classNum: "All"
  },
  {
    id: "a_3",
    title: "Mathematics Revision Session for Class 10",
    description: "A special online live doubt-clearing session for Class 10 Trigonometry will take place this Thursday at 4:00 PM. Please complete the quiz on trigonometric identities before joining the session.",
    createdBy: "Suresh Kumar",
    date: "2026-05-29",
    classNum: "10"
  },
  {
    id: "a_4",
    title: "Science Lab Project: Cell Models Submission",
    description: "All Class 8 students must upload photo submissions of their 3D animal/plant cell models in the study materials section by Saturday. Late entries will not be recorded in internal grades.",
    createdBy: "Geetha Rani",
    date: "2026-05-30",
    classNum: "8"
  }
];

const DEFAULT_SETTINGS = {
  schoolName: "Prathibha High School",
  motto: "Learn Today, Lead Tomorrow",
  address: "Plot 45-48, Education Enclave, Near Science Center, Hyderabad, TS, India",
  phone: "+91 40 2345 6789",
  email: "info@prathibhaschool.edu.in",
  logoText: "PHS",
  visitorCount: 1248
};

const DEFAULT_STUDENTS = [
  {
    id: "st_anil",
    name: "Anil Reddy",
    email: "anil@student.com",
    password: "student123",
    classNum: "10",
    quizScores: [
      {
        quizId: "q_1",
        quizTitle: "Trigonometric Identities Quiz",
        score: 3,
        totalQuestions: 3,
        date: "2026-06-01"
      }
    ]
  }
];

const DEFAULT_FEEDBACK = [
  {
    id: "f_1",
    name: "Rajesh Varma",
    classNum: "10",
    email: "rajesh.parent@gmail.com",
    message: "This portal is a fantastic initiative! It has helped my son revise for the Class 10 board exams extremely effectively. The quizzes give instant feedback, which is super helpful.",
    date: "2026-06-01"
  }
];

// --- DATABASE ACCESS API (LokiJS/Mongoose style) ---
class LocalCollection {
  constructor(name, defaultData = []) {
    this.key = DB_PREFIX + name;
    if (!localStorage.getItem(this.key)) {
      this._save(defaultData);
    }
  }

  _get() {
    return JSON.parse(localStorage.getItem(this.key) || "[]");
  }

  _save(data) {
    localStorage.setItem(this.key, JSON.stringify(data));
  }

  // Find multiple records matching query criteria
  find(criteria = {}) {
    const records = this._get();
    return records.filter(item => {
      for (let key in criteria) {
        // Support array matches (e.g. assignedClasses.includes(val))
        if (Array.isArray(item[key])) {
          if (!item[key].includes(criteria[key])) return false;
        } else if (item[key] !== criteria[key]) {
          return false;
        }
      }
      return true;
    });
  }

  // Find a single record matching criteria
  findOne(criteria = {}) {
    const matches = this.find(criteria);
    return matches.length > 0 ? matches[0] : null;
  }

  // Insert a single record
  insertOne(doc) {
    const records = this._get();
    // Auto increment / dynamic ID generation if not provided
    if (!doc.id) {
      doc.id = "id_" + Math.random().toString(36).substr(2, 9);
    }
    records.push(doc);
    this._save(records);
    return doc;
  }

  // Update records matching criteria
  updateOne(criteria, updates) {
    const records = this._get();
    let updatedCount = 0;
    const nextRecords = records.map(item => {
      let isMatch = true;
      for (let key in criteria) {
        if (item[key] !== criteria[key]) {
          isMatch = false;
          break;
        }
      }
      if (isMatch) {
        updatedCount++;
        return { ...item, ...updates };
      }
      return item;
    });
    this._save(nextRecords);
    return updatedCount;
  }

  // Delete records matching criteria
  deleteOne(criteria) {
    const records = this._get();
    const filtered = records.filter(item => {
      let isMatch = true;
      for (let key in criteria) {
        if (item[key] !== criteria[key]) {
          isMatch = false;
          break;
        }
      }
      return !isMatch; // Keep items that DO NOT match
    });
    const deletedCount = records.length - filtered.length;
    this._save(filtered);
    return deletedCount;
  }

  // Get raw list
  getRaw() {
    return this._get();
  }
}

// --- DATABASE INSTANTIATION ---
const db = {
  teachers: new LocalCollection("teachers", DEFAULT_TEACHERS),
  materials: new LocalCollection("materials", DEFAULT_MATERIALS),
  videos: new LocalCollection("videos", DEFAULT_VIDEOS),
  quizzes: new LocalCollection("quizzes", DEFAULT_QUIZZES),
  announcements: new LocalCollection("announcements", DEFAULT_ANNOUNCEMENTS),
  students: new LocalCollection("students", DEFAULT_STUDENTS),
  feedback: new LocalCollection("feedback", DEFAULT_FEEDBACK),
  
  // School Settings (Single Document Key-Value)
  settings: {
    get() {
      const data = localStorage.getItem(DB_PREFIX + "settings");
      if (!data) {
        localStorage.setItem(DB_PREFIX + "settings", JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return JSON.parse(data);
    },
    update(updates) {
      const current = this.get();
      const next = { ...current, ...updates };
      localStorage.setItem(DB_PREFIX + "settings", JSON.stringify(next));
      return next;
    },
    incrementVisitor() {
      const current = this.get();
      current.visitorCount = (current.visitorCount || 0) + 1;
      localStorage.setItem(DB_PREFIX + "settings", JSON.stringify(current));
      return current.visitorCount;
    }
  }
};

// Export to window for global access
window.db = db;
