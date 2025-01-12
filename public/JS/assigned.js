        // Fetch proctor and student data when the page loads
        document.addEventListener('DOMContentLoaded', async () => {
          try {
              // Fetch the proctor's information and assigned students
              const response = await fetch('/api/getAssignedStudents');
              const data = await response.json();

              // Display proctor info
              document.getElementById('proctor-info').textContent = `${data.proctor.name}, ${data.proctor.designation}`;

              // Display list of students
              const studentList = document.getElementById('student-list');
              data.students.forEach(student => {
                  const li = document.createElement('li');
                  li.textContent = `${student.name} (ID: ${student.student_id})`;
                  studentList.appendChild(li);
              });
          } catch (error) {
              console.error('Error loading assigned students:', error);
              alert('Could not load assigned students.');
          }
      });