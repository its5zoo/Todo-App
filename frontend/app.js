const btn = document.querySelector("#Button");
const ul = document.querySelector("#taskList");
const inp = document.querySelector("#taskInput");
const stats = document.querySelector("#stats");

// Load tasks from LocalStorage
document.addEventListener("DOMContentLoaded", getTasks);

// Add task event listeners
btn.addEventListener("click", addTaskHandler);
inp.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
        addTaskHandler();
    }
});

// List interaction (delegate events for delete, check, edit)
ul.addEventListener("click", handleTaskAction);
ul.addEventListener("change", handleTaskCheck);

function updateStats() {
    const totalTasks = ul.children.length;
    const completedTasks = document.querySelectorAll(".task-checkbox:checked").length;
    const pendingTasks = totalTasks - completedTasks;

    if (totalTasks === 0) {
        stats.innerHTML = `<i class="fa-regular fa-face-smile"></i> No tasks yet. Make it a great day!`;
    } else {
        stats.innerHTML = `<span class="text-white fw-medium">${pendingTasks}</span> pending • <span class="text-white fw-medium">${completedTasks}</span> completed`;
    }
}

function createTaskElement(taskText, isCompleted = false, id = null) {
    const item = document.createElement("li");
    item.className = "list-group-item d-flex justify-content-between align-items-center py-3 px-4";
    item.dataset.id = id || Date.now().toString() + Math.random().toString(16).slice(2);

    const taskContent = document.createElement("div");
    taskContent.className = "d-flex align-items-center flex-grow-1 text-break me-3";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "task-checkbox me-3";
    checkbox.checked = isCompleted;

    const textSpan = document.createElement("span");
    textSpan.className = "task-text fs-6 fw-light";
    textSpan.innerText = taskText;

    taskContent.appendChild(checkbox);
    taskContent.appendChild(textSpan);

    const actionsDiv = document.createElement("div");
    actionsDiv.className = "d-flex gap-2";

    const editBtn = document.createElement("button");
    editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
    editBtn.className = "btn action-btn edit";
    editBtn.title = "Edit Task";

    const delBtn = document.createElement("button");
    delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
    delBtn.className = "btn action-btn delete";
    delBtn.title = "Delete Task";

    actionsDiv.appendChild(editBtn);
    actionsDiv.appendChild(delBtn);

    item.appendChild(taskContent);
    item.appendChild(actionsDiv);

    return item;
}

function addTaskHandler() {
    const taskText = inp.value.trim();

    if (taskText === "") {
        inp.style.animation = "shake 0.4s ease";
        setTimeout(() => inp.style.animation = "", 400);
        return;
    }

    addTask(taskText);
    inp.value = "";
    inp.focus();
}

function addTask(taskText, isCompleted = false, id = null) {
    const item = createTaskElement(taskText, isCompleted, id);
    // Append to top instead of bottom for a better feel
    ul.prepend(item);

    if (!id) {
        saveLocalTask({ id: item.dataset.id, text: taskText, completed: isCompleted });
    }
    updateStats();
}

function handleTaskAction(event) {
    const target = event.target;

    // Delete
    if (target.classList.contains("delete") || target.closest(".delete")) {
        const item = target.closest("li");
        item.classList.add("fall");
        removeLocalTask(item.dataset.id);

        item.addEventListener("animationend", function (e) {
            if (e.animationName === "fallOut") {
                item.remove();
                updateStats();
            }
        });
    }

    // Edit
    if (target.classList.contains("edit") || target.closest(".edit")) {
        const item = target.closest("li");
        const textSpan = item.querySelector(".task-text");
        const checkbox = item.querySelector(".task-checkbox");

        if (item.classList.contains("editing")) {
            // Save mode
            const editInput = item.querySelector(".edit-input");
            const newText = editInput.value.trim();

            if (newText !== "") {
                textSpan.innerText = newText;
                textSpan.style.display = "";
                checkbox.style.display = "";
                editInput.remove();
                item.classList.remove("editing");

                const editBtn = item.querySelector(".edit");
                editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                editBtn.style.background = "";
                editBtn.style.color = "";

                updateLocalTaskText(item.dataset.id, newText);
            } else {
                editInput.style.animation = "shake 0.4s ease";
                setTimeout(() => editInput.style.animation = "", 400);
            }
        } else {
            // Edit mode
            const currentText = textSpan.innerText;
            textSpan.style.display = "none";
            checkbox.style.display = "none";

            const taskContentContainer = item.querySelector(".flex-grow-1");
            const editInput = document.createElement("input");
            editInput.type = "text";
            editInput.className = "edit-input";
            editInput.value = currentText;

            taskContentContainer.appendChild(editInput);
            item.classList.add("editing");

            const editBtn = target.closest(".edit");
            editBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
            editBtn.style.background = "rgba(0, 225, 255, 0.2)";
            editBtn.style.color = "#00e1ff";

            editInput.focus();

            editInput.addEventListener("keypress", function (e) {
                if (e.key === "Enter") {
                    editBtn.click();
                }
            });
        }
    }
}

function handleTaskCheck(event) {
    if (event.target.classList.contains("task-checkbox")) {
        const item = event.target.closest("li");
        const isCompleted = event.target.checked;

        updateLocalTaskStatus(item.dataset.id, isCompleted);
        updateStats();
    }
}

// Keyframes for shake animation added directly via JS for ease
const style = document.createElement('style');
style.innerHTML = `
@keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-6px); }
    50% { transform: translateX(6px); }
    75% { transform: translateX(-6px); }
}`;
document.head.appendChild(style);

// --- Local Storage Functions ---

function getLocalTasks() {
    let tasks;
    if (localStorage.getItem("apnaTasksBS") === null) {
        tasks = [];
    } else {
        tasks = JSON.parse(localStorage.getItem("apnaTasksBS"));
    }
    return tasks;
}

function saveLocalTask(taskObj) {
    let tasks = getLocalTasks();
    tasks.push(taskObj); // Note: We push, but we prepend in the UI. For loading, we might want to reverse.
    localStorage.setItem("apnaTasksBS", JSON.stringify(tasks));
}

function getTasks() {
    let tasks = getLocalTasks();
    // Render in reverse so the newest loaded from storage (end of array) goes to the top
    const tasksToRender = [...tasks].reverse();
    tasksToRender.forEach(function (taskObj) {
        const item = createTaskElement(taskObj.text, taskObj.completed, taskObj.id);
        ul.appendChild(item); // Note: Since we reversed, appendChild actually preserves order correctly.
    });
    updateStats();
}

function removeLocalTask(id) {
    let tasks = getLocalTasks();
    tasks = tasks.filter(task => task.id !== id);
    localStorage.setItem("apnaTasksBS", JSON.stringify(tasks));
}

function updateLocalTaskStatus(id, isCompleted) {
    let tasks = getLocalTasks();
    tasks.forEach(task => {
        if (task.id === id) {
            task.completed = isCompleted;
        }
    });
    localStorage.setItem("apnaTasksBS", JSON.stringify(tasks));
}

function updateLocalTaskText(id, newText) {
    let tasks = getLocalTasks();
    tasks.forEach(task => {
        if (task.id === id) {
            task.text = newText;
        }
    });
    localStorage.setItem("apnaTasksBS", JSON.stringify(tasks));
}