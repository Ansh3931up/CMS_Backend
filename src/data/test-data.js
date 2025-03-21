// Test Data for Postman

// 1. Create Department/Branch (POST /api/college-admin/departments)
const createDepartmentData = {
  "name": "Computer Science",
  "code": "CSE",
  "totalSemesters": 8,
  "hodEmail": "alan.turing@university.edu",
  "curriculum": {
    "name": "CS 2023 v2.1",
    "version": "2.1",
    "lastUpdated": "2024-03-10"
  },
  "description": "Department of Computer Science and Engineering focuses on core computing concepts and software development."
};

// 2. Update Department (PUT /api/college-admin/departments/:id)
const updateDepartmentData = {
  "metrics": {
    "totalTeachers": 12,
    "totalStudents": 180,
    "passRate": 92
  },
  "performance": {
    "topPerformers": [
      {
        "student": "student_id_1", // Replace with actual MongoDB ID
        "score": 98
      },
      {
        "student": "student_id_2",
        "score": 97
      }
    ],
    "semesterData": [
      {
        "semester": "Spring 2024",
        "passRate": 90,
        "averageGrade": 85
      },
      {
        "semester": "Fall 2023",
        "passRate": 87,
        "averageGrade": 82
      }
    ]
  },
  "events": [
    {
      "title": "Technical Symposium",
      "date": "2024-03-15",
      "time": "10:00 AM",
      "location": "Main Auditorium",
      "description": "Annual technical symposium featuring guest lectures and student presentations",
      "type": "technical",
      "status": "upcoming"
    },
    {
      "title": "Workshop on AI",
      "date": "2024-04-02",
      "time": "2:00 PM",
      "location": "Lab Complex",
      "description": "Hands-on workshop on artificial intelligence and machine learning",
      "type": "workshop",
      "status": "upcoming"
    }
  ]
};

// 3. Create Batch (POST /api/hod/batches)
const createBatchData = {
  "branchId": "branch_id", // Replace with actual branch ID
  "year": 2023,
  "section": "A",
  "capacity": 60,
  "currentSemester": 2,
  "students": [], // Add student IDs here
  "metrics": {
    "averageGrade": 85,
    "passRate": 92
  }
};

// 4. Update Batch Performance (PUT /api/hod/batches/:batchId/performance)
const updateBatchPerformanceData = {
  "coursePerformance": [
    {
      "course": "subject_id_1", // Replace with actual subject ID
      "grade": 88,
      "semester": 2
    },
    {
      "course": "subject_id_2",
      "grade": 82,
      "semester": 2
    }
  ],
  "topPerformers": [
    {
      "student": "student_id_1", // Replace with actual student ID
      "grade": 95
    },
    {
      "student": "student_id_2",
      "grade": 93
    }
  ],
  "metrics": {
    "averageGrade": 85,
    "passRate": 92
  }
};

// 5. Create Subject (POST /api/hod/subjects)
const createSubjectData = {
  "name": "Data Structures",
  "code": "CS202",
  "branch": "branch_id", // Replace with actual branch ID
  "semester": 3,
  "credits": {
    "theory": 3,
    "practical": 1,
    "total": 4
  },
  "description": "This course covers fundamental data structures and their implementations in programming languages.",
  "instructor": "teacher_id", // Replace with actual teacher ID
  "topics": [
    "Introduction to Data Structures",
    "Arrays and Linked Lists",
    "Stacks and Queues",
    "Trees and Binary Search Trees",
    "Graphs and Graph Algorithms",
    "Hashing",
    "Sorting and Searching Algorithms"
  ]
};

// 6. Add Department Event (POST /api/college-admin/departments/:id/events)
const addEventData = {
  "title": "Technical Symposium",
  "date": "2024-03-15",
  "time": "10:00 AM",
  "location": "Main Auditorium",
  "description": "Annual technical symposium featuring guest lectures and student presentations",
  "type": "technical",
  "status": "upcoming"
};

// 7. Create Teacher (POST /api/college-admin/teachers)
const createTeacherData = {
  "name": "Dr. Jane Smith",
  "email": "jane.smith@university.edu",
  "branchId": "branch_id", // Replace with actual branch ID
  "subjects": [], // Add subject IDs here
  "profile": {
    "position": "Associate Professor",
    "specialization": "Data Structures and Algorithms",
    "phone": "+1 (555) 123-4567"
  }
};

// Example usage sequence:
/*
1. First create department
2. Create teachers for the department
3. Create subjects and assign teachers
4. Create batches
5. Add students to batches
6. Update performance metrics
7. Add events
*/

// Sample API Test Sequence for Postman:
const testSequence = {
  "1_create_department": {
    "method": "POST",
    "endpoint": "/api/college-admin/departments",
    "body": createDepartmentData
  },
  "2_create_teacher": {
    "method": "POST",
    "endpoint": "/api/college-admin/teachers",
    "body": createTeacherData
  },
  "3_create_subject": {
    "method": "POST",
    "endpoint": "/api/hod/subjects",
    "body": createSubjectData
  },
  "4_create_batch": {
    "method": "POST",
    "endpoint": "/api/hod/batches",
    "body": createBatchData
  },
  "5_update_department": {
    "method": "PUT",
    "endpoint": "/api/college-admin/departments/:id",
    "body": updateDepartmentData
  },
  "6_update_batch": {
    "method": "PUT",
    "endpoint": "/api/hod/batches/:batchId/performance",
    "body": updateBatchPerformanceData
  },
  "7_add_event": {
    "method": "POST",
    "endpoint": "/api/college-admin/departments/:id/events",
    "body": addEventData
  }
};

export const testData = {
  createDepartmentData,
  updateDepartmentData,
  createBatchData,
  updateBatchPerformanceData,
  createSubjectData,
  addEventData,
  createTeacherData,
  testSequence
}; 