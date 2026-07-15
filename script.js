const taskName = document.getElementById("taskName");
const taskTime = document.getElementById("taskTime");
const addTaskBtn = document.getElementById("addTaskBtn");
const taskList = document.getElementById("taskList");
const checkAllBtn = document.getElementById("checkAllBtn");
const clearBtn = document.getElementById("clearBtn");
const calendar = document.getElementById("calendar");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let completed = JSON.parse(localStorage.getItem("completed")) || {};
let selectedDate = new Date().toISOString().split("T")[0];

function saveData() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  localStorage.setItem("completed", JSON.stringify(completed));
}

function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission !== "granted") {
    Notification.requestPermission();
  }
}

function sendNotification(title, body) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body });
  }
}

function addTask() {
  const name = taskName.value.trim();
  const time = taskTime.value;

  if (!name || !time) {
    alert("Please enter task name and time.");
    return;
  }

  tasks.push({
    id: Date.now(),
    name,
    time,
    date: selectedDate,
    done: false
  });

  taskName.value = "";
  taskTime.value = "";
  saveData();
  renderTasks();
  renderCalendar();
}

function renderTasks() {
  taskList.innerHTML = "";

  const todayTasks = tasks.filter(t => t.date === selectedDate);

  if (todayTasks.length === 0) {
    taskList.innerHTML = "<li>No tasks for this date yet.</li>";
    return;
  }

  todayTasks.forEach(task => {
    const li = document.createElement("li");

    li.innerHTML = `
      <div class="task-info ${task.done ? "task-done" : ""}">
        <strong>${task.name}</strong>
        <small>${task.time}</small>
      </div>
      <div>
        <button class="complete-btn" onclick="toggleTask(${task.id})">
          ${task.done ? "Undo" : "Done"}
        </button>
        <button class="delete-btn" onclick="deleteTask(${task.id})">Delete</button>
      </div>
    `;

    taskList.appendChild(li);
  });
}

function toggleTask(id) {
  tasks = tasks.map(task => {
    if (task.id === id) {
      const newDone = !task.done;
      if (newDone) {
        sendNotification("Task Completed", `${task.name} marked complete.`);
      }
      return { ...task, done: newDone };
    }
    return task;
  });

  saveData();
  renderTasks();
  renderCalendar();
}

function deleteTask(id) {
  tasks = tasks.filter(task => task.id !== id);
  saveData();
  renderTasks();
  renderCalendar();
}

function markAllComplete() {
  tasks = tasks.map(task => {
    if (task.date === selectedDate) {
      return { ...task, done: true };
    }
    return task;
  });

  sendNotification("Great job!", "All tasks for today are marked complete.");
  saveData();
  renderTasks();
  renderCalendar();
}

function clearToday() {
  tasks = tasks.filter(task => task.date !== selectedDate);
  saveData();
  renderTasks();
  renderCalendar();
}

function getDayStatus(dateStr) {
  const dayTasks = tasks.filter(t => t.date === dateStr);
  if (dayTasks.length === 0) return "";

  const doneCount = dayTasks.filter(t => t.done).length;

  if (doneCount === 0) return "red";
  if (doneCount === dayTasks.length) return "green";
  return "orange";
}

function renderCalendar() {
  calendar.innerHTML = "";

  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < startDay; i++) {
    const empty = document.createElement("div");
    calendar.appendChild(empty);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(year, month, day);
    const dateStr = dateObj.toISOString().split("T")[0];
    const status = getDayStatus(dateStr);

    const div = document.createElement("div");
    div.className = `day ${status}`;
    div.innerHTML = `<strong>${day}</strong><small>${status || "no tasks"}</small>`;

    div.onclick = () => {
      selectedDate = dateStr;
      renderTasks();
    };

    calendar.appendChild(div);
  }
}

function setupAutoNotifications() {
  setInterval(() => {
    const now = new Date();
    const currentTime = now.toTimeString().slice(0, 5);
    const today = now.toISOString().split("T")[0];

    tasks.forEach(task => {
      if (task.date === today && task.time === currentTime && !task.notified) {
        sendNotification("Task Reminder", `Time to do: ${task.name}`);
        task.notified = true;
        saveData();
      }
    });
  }, 30000);
}

addTaskBtn.addEventListener("click", addTask);
checkAllBtn.addEventListener("click", markAllComplete);
clearBtn.addEventListener("click", clearToday);

requestNotificationPermission();
renderTasks();
renderCalendar();
setupAutoNotifications();