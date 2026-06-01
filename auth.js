/* Prathibha High School LMS - Role-Based Authentication Layer */

const SESSION_KEY = "prathibha_session";

const auth = {
  // Login method supporting three roles: Principal, Teacher, Student
  login(email, password) {
    email = email.toLowerCase().trim();
    
    // 1. Check Principal (Static Admin)
    if (email === "principal@prathibha.com" && password === "admin123") {
      const session = {
        token: "mock-jwt-principal-" + Date.now(),
        user: {
          id: "principal",
          name: "Dr. K. S. Rao (Principal)",
          email: "principal@prathibha.com",
          role: "principal"
        }
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { success: true, user: session.user };
    }

    // 2. Check Teachers Collection in Database
    const teacher = window.db.teachers.findOne({ email: email, password: password });
    if (teacher) {
      if (teacher.status !== "Active") {
        return { success: false, message: "Your teacher account is deactivated. Please contact the Principal." };
      }
      const session = {
        token: "mock-jwt-teacher-" + teacher.id + "-" + Date.now(),
        user: {
          id: teacher.id,
          name: teacher.name,
          email: teacher.email,
          role: "teacher",
          assignedClasses: teacher.assignedClasses,
          assignedSubjects: teacher.assignedSubjects
        }
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { success: true, user: session.user };
    }

    // 3. Check Students Collection in Database
    const student = window.db.students.findOne({ email: email, password: password });
    if (student) {
      const session = {
        token: "mock-jwt-student-" + student.id + "-" + Date.now(),
        user: {
          id: student.id,
          name: student.name,
          email: student.email,
          role: "student",
          classNum: student.classNum
        }
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { success: true, user: session.user };
    }

    return { success: false, message: "Invalid email or password. Please try again." };
  },

  // Logout method
  logout() {
    localStorage.removeItem(SESSION_KEY);
    return true;
  },

  // Get active user details
  getCurrentUser() {
    const sessionData = localStorage.getItem(SESSION_KEY);
    if (!sessionData) return null;
    try {
      const session = JSON.parse(sessionData);
      return session.user;
    } catch (e) {
      this.logout();
      return null;
    }
  },

  // Helper validation checks
  isAuthenticated() {
    return this.getCurrentUser() !== null;
  },

  isPrincipal() {
    const user = this.getCurrentUser();
    return user && user.role === "principal";
  },

  isTeacher() {
    const user = this.getCurrentUser();
    return user && user.role === "teacher";
  },

  isStudent() {
    const user = this.getCurrentUser();
    return user && user.role === "student";
  }
};

// Export to window for global access
window.auth = auth;
