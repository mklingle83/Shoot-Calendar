let events = JSON.parse(localStorage.getItem("events")) || [];
let currentDate = new Date();
let editingEventId = null;

const calendar = document.getElementById("calendar");
const monthYear = document.getElementById("monthYear");
const viewSelect = document.getElementById("viewSelect");

document.getElementById("prevBtn").onclick = () => changeDate(-1);
document.getElementById("nextBtn").onclick = () => changeDate(1);
document.getElementById("addEventBtn").onclick = () => openModal();
document.getElementById("cancelBtn").onclick = () => closeModal();
document.getElementById("saveEventBtn").onclick = saveEvent;
document.getElementById("deleteEventBtn").onclick = deleteEvent;
viewSelect.onchange = renderCalendar;

function saveEvents() {
  localStorage.setItem("events", JSON.stringify(events));
}

function changeDate(offset) {
  if (viewSelect.value === "month") {
    currentDate.setMonth(currentDate.getMonth() + offset);
  } else if (viewSelect.value === "week") {
    currentDate.setDate(currentDate.getDate() + offset * 7);
  } else {
    currentDate.setDate(currentDate.getDate() + offset);
  }
  renderCalendar();
}

function renderCalendar() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = "";

  const monthYear = document.getElementById("monthYear");
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  // Month + year label
  monthYear.textContent = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  // First day of month & how many days in month
  const firstDay = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Grid container
  const grid = document.createElement("div");
  grid.classList.add("calendar-grid");

  // Weekday labels
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  weekdays.forEach(day => {
    const wd = document.createElement("div");
    wd.classList.add("weekday");
    wd.textContent = day;
    grid.appendChild(wd);
  });

  // Blank cells before first day
  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.classList.add("day-cell", "empty");
    grid.appendChild(emptyCell);
  }

  // Fill days 1 → daysInMonth
  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement("div");
    cell.classList.add("day-cell");
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    cell.setAttribute("data-date", dateStr);

    cell.innerHTML = `<span class="date-label">${day}</span>`;

    // Click to add new event
    cell.addEventListener("click", () => {
      openEventForm(dateStr);
    });

    grid.appendChild(cell);
  }

  // Attach grid
  calendar.appendChild(grid);

  // Render events after grid is ready
  renderEvents();
}


function renderMonthView() {
  calendar.className = "month-view";
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  monthYear.textContent = currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement("div");
    calendar.appendChild(empty);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement("div");
    cell.className = "day-cell";
    cell.innerHTML = `<strong>${d}</strong>`;
    const dateStr = new Date(year, month, d).toISOString().split("T")[0];
    renderEvents(cell, dateStr);
    cell.onclick = () => openModal(null, dateStr);
    calendar.appendChild(cell);
  }
}

function renderWeekView() {
  calendar.className = "week-view";
  monthYear.textContent = "Week of " + currentDate.toDateString();
  for (let i = 0; i < 7; i++) {
    const day = new Date(currentDate);
    day.setDate(currentDate.getDate() - currentDate.getDay() + i);
    const dateStr = day.toISOString().split("T")[0];
    const cell = document.createElement("div");
    cell.className = "week-cell";
    cell.innerHTML = `<strong>${day.toDateString()}</strong>`;
    renderEvents(cell, dateStr);
    cell.onclick = () => openModal(null, dateStr);
    calendar.appendChild(cell);
  }
}

function renderDayView() {
  calendar.className = "day-view";
  monthYear.textContent = currentDate.toDateString();
  const dateStr = currentDate.toISOString().split("T")[0];
  const cell = document.createElement("div");
  cell.className = "day-view";
  renderEvents(cell, dateStr);
  calendar.appendChild(cell);
}

function renderAgendaView() {
  calendar.className = "agenda-view";
  monthYear.textContent = "Agenda";
  const upcoming = events.sort((a, b) => new Date(a.start) - new Date(b.start));
  upcoming.forEach(ev => {
    const item = document.createElement("div");
    item.className = "agenda-item";
    item.innerHTML = `<strong>${ev.title}</strong> (${ev.client})<br>${new Date(ev.start).toLocaleString()} - ${new Date(ev.end).toLocaleString()}`;
    item.onclick = () => openModal(ev.id);
    calendar.appendChild(item);
  });
}

// Render events inside calendar cells
function renderEvents() {
  const calendarCells = document.querySelectorAll(".day-cell");
  calendarCells.forEach(cell => {
    const date = cell.getAttribute("data-date");
    const dayEvents = events.filter(ev => ev.date === date);

    cell.innerHTML = `<span class="date-label">${new Date(date).getDate()}</span>`;

    dayEvents.forEach(ev => {
      const eventEl = document.createElement("div");
      eventEl.classList.add("event", ev.category); // category class
      eventEl.textContent = ev.title;
      eventEl.addEventListener("click", () => openEventModal(ev));
      cell.appendChild(eventEl);
    });
  });
}

// Show event details in the new details modal
function openEventModal(event) {
  const detailsModal = document.getElementById("eventDetailsModal");
  const detailsContainer = document.getElementById("eventDetailsContainer");

  // Format event details
  detailsContainer.innerHTML = `
    <p><strong>Title:</strong> ${event.title}</p>
    <p><strong>Category:</strong> ${event.category}</p>
    <p><strong>Client:</strong> ${event.client || "N/A"}</p>
    <p><strong>Start:</strong> ${new Date(event.start).toLocaleString()}</p>
    <p><strong>End:</strong> ${new Date(event.end).toLocaleString()}</p>
    <p><strong>Total Cost:</strong> $${event.cost || 0}</p>
    <p><strong>Deposit:</strong> $${event.deposit || 0}</p>
  `;

  // Show modal
  detailsModal.classList.remove("hidden");
}

// Close details modal
document.getElementById("closeDetailsBtn").addEventListener("click", () => {
  document.getElementById("eventDetailsModal").classList.add("hidden");
});


function openModal(eventId = null, dateStr = null) {
  document.getElementById("eventModal").classList.remove("hidden");
  editingEventId = eventId;
  if (eventId) {
    const ev = events.find(e => e.id === eventId);
    document.getElementById("modalTitle").textContent = "Edit Event";
    document.getElementById("eventTitle").value = ev.title;
    document.getElementById("eventCategory").value = ev.category;
    document.getElementById("eventClient").value = ev.client;
    document.getElementById("eventStart").value = ev.start;
    document.getElementById("eventEnd").value = ev.end;
    document.getElementById("eventCost").value = ev.cost;
    document.getElementById("eventDeposit").value = ev.deposit;
    document.getElementById("deleteEventBtn").style.display = "inline-block";
  } else {
    document.getElementById("modalTitle").textContent = "Add Event";
    document.querySelectorAll("#eventModal input, #eventModal select").forEach(input => input.value = "");
    if (dateStr) {
      document.getElementById("eventStart").value = dateStr + "T09:00";
      document.getElementById("eventEnd").value = dateStr + "T10:00";
    }
    document.getElementById("deleteEventBtn").style.display = "none";
  }
}

function closeModal() {
  document.getElementById("eventModal").classList.add("hidden");
}

function saveEvent() {
  const ev = {
    id: editingEventId || Date.now(),
    title: document.getElementById("eventTitle").value,
    category: document.getElementById("eventCategory").value,
    client: document.getElementById("eventClient").value,
    start: document.getElementById("eventStart").value,
    end: document.getElementById("eventEnd").value,
    cost: document.getElementById("eventCost").value,
    deposit: document.getElementById("eventDeposit").value
  };
  if (editingEventId) {
    events = events.map(e => e.id === editingEventId ? ev : e);
  } else {
    events.push(ev);
  }
  saveEvents();
  closeModal();
  renderCalendar();
}

function deleteEvent() {
  events = events.filter(e => e.id !== editingEventId);
  saveEvents();
  closeModal();
  renderCalendar();
}

renderCalendar();
