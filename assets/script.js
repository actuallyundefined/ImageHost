document.getElementById("upload-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    document.getElementById("success-message").innerHTML = '';
    const formData = new FormData(event.target);
    const response = await fetch("/", {
        method: "POST",
        body: formData
    });
    const result = await response.json();
    if (response.ok) {
        document.getElementById("success-message").innerHTML = `
            <div class="notification is-success">
                <button class="delete" onclick="removeNotification(this)"></button>
                ${result.message + ` Access it at: <a href="${result.imageUrl}">${result.imageUrl}</a>`}
            </div>
        `;
    } else {
        document.getElementById("success-message").innerHTML = `
            <div class="notification is-danger">
                <button class="delete" onclick="removeNotification(this)"></button>
                Error: ${result.message}
            </div>
        `;
    }
    resetDropZone();
});

function initTurnstile() {
    fetch("/turnstileSiteKey", {
        method: "GET"
    })
    .then(response => {
        data = response.json();
        documemt.getElementById("turnstile").innerHTML = `
            <div class="cf-turnstile" data-sitekey="${data.key}"></div>
        `;
    })
}

function resetDropZone() {
    document.getElementById("drop-zone").innerHTML = `
        <div class="drop-zone" >
            <span class="drop-zone__prompt">Drag & drop your image here or click to upload</span>
            <input type="file" name="image" accept="image/*" class="drop-zone__input" required>
        </div>
    `

    document.querySelectorAll(".drop-zone__input").forEach((inputElement) => {
        const dropZoneElement = inputElement.closest(".drop-zone");
    
        dropZoneElement.addEventListener("click", (e) => {
            inputElement.click();
        });
    
        inputElement.addEventListener("change", (e) => {
            if (inputElement.files.length) {
            updateThumbnail(dropZoneElement, inputElement.files[0]);
            }
        });
    
        dropZoneElement.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropZoneElement.classList.add("drop-zone--over");
        });
    
        ["dragleave", "dragend"].forEach((type) => {
            dropZoneElement.addEventListener(type, (e) => {
            dropZoneElement.classList.remove("drop-zone--over");
            });
        });
    
        dropZoneElement.addEventListener("drop", (e) => {
            e.preventDefault();
    
            if (e.dataTransfer.files.length) {
            inputElement.files = e.dataTransfer.files;
            updateThumbnail(dropZoneElement, e.dataTransfer.files[0]);
            }
    
            dropZoneElement.classList.remove("drop-zone--over");
        });
        });
    
        /**
         * Updates the thumbnail on a drop zone element.
         *
         * @param {HTMLElement} dropZoneElement
         * @param {File} file
         */
        function updateThumbnail(dropZoneElement, file) {
        let thumbnailElement = dropZoneElement.querySelector(".drop-zone__thumb");
    
        // First time - remove the prompt
        if (dropZoneElement.querySelector(".drop-zone__prompt")) {
            dropZoneElement.querySelector(".drop-zone__prompt").remove();
        }
    
        // First time - there is no thumbnail element, so lets create it
        if (!thumbnailElement) {
            thumbnailElement = document.createElement("div");
            thumbnailElement.classList.add("drop-zone__thumb");
            dropZoneElement.appendChild(thumbnailElement);
        }
    
        thumbnailElement.dataset.label = file.name;
    
        // Show thumbnail for image files
        if (file.type.startsWith("image/")) {
            const reader = new FileReader();
    
            reader.readAsDataURL(file);
            reader.onload = () => {
            thumbnailElement.style.backgroundImage = `url('${reader.result}')`;
            };
        } else {
            thumbnailElement.style.backgroundImage = null;
        }
    }
}

document.addEventListener("DOMContentLoaded", (event) => {
    resetDropZone();
    //initTurnstile();
});

function removeNotification(element) {
    const parentDiv = element.closest('.notification');
    if (parentDiv) {
      parentDiv.remove();
    }
}