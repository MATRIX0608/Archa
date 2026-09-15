(() => {
  const video = document.getElementById("cameraVideo");
  const preview = document.getElementById("imagePreview");
  const placeholder = document.getElementById("scanPlaceholder");
  const fileInput = document.getElementById("fileInput");
  const shutter = document.getElementById("shutterBtn");
  const status = document.getElementById("scanStatus");

  let stream = null;
  let selectedImage = null;
  let mode = "camera";
  let captured = false;

  const API_BASE =
    window.CHAT_API_BASE || "https://archa-production-1508.up.railway.app";

  function msg(text) {
    if (status) status.textContent = text;
  }

  function stopCamera() {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }
  }

  // =========================
  // CAMERA
  // =========================

  async function startCamera() {
    stopCamera();

    selectedImage = null;
    captured = false;

    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" }
        },
        audio: false
      });

      video.srcObject = stream;

      video.style.display = "block";
      preview.style.display = "none";
      placeholder.style.display = "none";

      msg("Camera ready.");
    } catch (error) {
      console.error("Camera error:", error);
      msg("Camera permission denied. Choose Upload Image.");
    }
  }

  // =========================
  // SHOW UPLOADED/CAPTURED IMAGE
  // =========================

  function showImage(file) {
    stopCamera();

    selectedImage = file;
    captured = true;

    preview.src = URL.createObjectURL(file);

    preview.style.display = "block";
    video.style.display = "none";
    placeholder.style.display = "none";

    msg("Image ready. Press the button to analyze.");
  }

  // =========================
  // CAMERA / UPLOAD SWITCH
  // =========================

  document.querySelectorAll(".mode-btn").forEach(button => {

    button.addEventListener("click", () => {

      const selectedMode = button.dataset.mode;

      console.log("Mode selected:", selectedMode);

      document.querySelectorAll(".mode-btn").forEach(btn => {
        btn.classList.remove("active");
      });

      button.classList.add("active");

      mode = selectedMode;

      // =========================
      // UPLOAD MODE
      // =========================

      if (mode === "upload") {

        stopCamera();

        captured = false;
        selectedImage = null;

        video.style.display = "none";
        preview.style.display = "none";
        placeholder.style.display = "none";

        // Open file picker
        fileInput.click();

        return;
      }

      // =========================
      // CAMERA MODE
      // =========================

      if (mode === "camera") {
        startCamera();
      }

    });

  });

  // =========================
  // FILE SELECTED
  // =========================

  fileInput.addEventListener("change", event => {

    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    console.log("Uploaded file:", file.name);
    console.log("Current mode:", mode);

    // IMPORTANT:
    // Stay in upload mode
    mode = "upload";

    // Keep Upload button active
    document.querySelectorAll(".mode-btn").forEach(btn => {
      btn.classList.toggle(
        "active",
        btn.dataset.mode === "upload"
      );
    });

    showImage(file);

  });

  // =========================
  // FILE → BASE64
  // =========================

  function fileToBase64(file) {

    return new Promise((resolve, reject) => {

      const reader = new FileReader();

      reader.onload = () => {

        const result = reader.result;

        const base64 = result.split(",")[1];

        resolve(base64);

      };

      reader.onerror = reject;

      reader.readAsDataURL(file);

    });

  }

  // =========================
  // SHOW RESULT
  // =========================

  function showResult(data) {

    const empty = document.getElementById("resultEmpty");
    const filled = document.getElementById("resultFilled");

    if (empty) {
      empty.style.display = "none";
    }

    if (filled) {
      filled.style.display = "block";
    }

    document.getElementById("resultName").textContent =
      data.name || "Unknown";

    document.getElementById("resultFrom").textContent =
      data.fromState || "Unknown";

    document.getElementById("resultAbout").textContent =
      data.about || "Unknown";

    document.getElementById("resultImportance").textContent =
      data.whyImportant || "Unknown";

    document.getElementById("resultRepresents").textContent =
      data.whatItRepresents || "Unknown";

    document.getElementById("resultCategory").textContent =
      data.category || "Unknown";

    document.getElementById("resultState").textContent =
      data.fromState || "Unknown";

    document.getElementById("resultPlace").textContent =
      data.place || "Unknown";

    document.getElementById("resultPeriod").textContent =
      data.period || "Unknown";

  }

  // =========================
  // ANALYZE IMAGE
  // =========================

  async function analyze() {

    if (!selectedImage) {

      msg("Please choose or capture an image first.");

      return;
    }

    msg("Analyzing image...");

    console.log("Analyzing:", selectedImage);
    console.log("Mode:", mode);

    try {

      const base64Image =
        await fileToBase64(selectedImage);

      const response = await fetch(
        `${API_BASE}/api/scan`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            image: base64Image,
            mimeType:
              selectedImage.type || "image/jpeg"
          })
        }
      );

      const data = await response.json();

      console.log("Gemini result:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Analysis failed."
        );
      }

      showResult(data);

      msg("Analysis complete ✓");

      // KEEP IMAGE VISIBLE
      preview.style.display = "block";
      video.style.display = "none";

    } catch (error) {

      console.error("Scan error:", error);

      msg(
        error.message ||
        "Could not analyze the image."
      );

    }

  }

  // =========================
  // MAIN SCAN BUTTON
  // =========================

  shutter.addEventListener("click", async (event) => {

  event.preventDefault();

  // ================================
  // UPLOAD MODE
  // ================================
  if (mode === "upload") {

    if (!selectedImage) {
      fileInput.click();
      return;
    }

    await analyze();
    return;
  }


  // ================================
  // CAMERA MODE
  // ================================

  // IMPORTANT:
  // If photo has already been captured,
  // analyze it FIRST.
  if (captured && selectedImage) {

    await analyze();
    return;
  }


  // Start camera if it is not running
  if (!stream) {

    await startCamera();
    return;
  }


  // ================================
  // CAPTURE PHOTO
  // ================================

  const canvas = document.createElement("canvas");

  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");

  context.drawImage(
    video,
    0,
    0,
    canvas.width,
    canvas.height
  );


  canvas.toBlob((blob) => {

    if (!blob) {
      msg("Could not capture photo.");
      return;
    }


    selectedImage = new File(
      [blob],
      "camera-capture.jpg",
      {
        type: "image/jpeg"
      }
    );


    preview.src = URL.createObjectURL(selectedImage);

    preview.style.display = "block";
    video.style.display = "none";
    placeholder.style.display = "none";


    captured = true;

    stopCamera();


    msg("Photo captured. Press the button again to analyze.");

  }, "image/jpeg", 0.9);

});
  // =========================
  // ENTER KEY
  // =========================

  document.addEventListener("keydown", event => {

    if (event.key === "Enter") {

      const active =
        document.activeElement;

      if (
        active &&
        (
          active.tagName === "BUTTON" ||
          active.tagName === "INPUT"
        )
      ) {

        event.preventDefault();

      }

    }

  });

  // =========================
  // INITIAL STATE
  // =========================

if (mode === "camera") {
  startCamera();
}
})();