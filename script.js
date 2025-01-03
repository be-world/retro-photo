function downscaleImage(imageFile, targetPixels = 3_000_000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const originalWidth = img.width;
      const originalHeight = img.height;
      const originalPixels = originalWidth * originalHeight;

      // Calculate scaling factor to reach target pixels
      const scaleFactor = Math.sqrt(targetPixels / originalPixels);
      const targetWidth = Math.round(originalWidth * scaleFactor);
      const targetHeight = Math.round(originalHeight * scaleFactor);

      // Create a canvas to downscale the image
      const canvas = document.createElement("canvas");
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      // Draw the downscaled image onto the canvas
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      // Export the resized image as a blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ blob, canvas }); // Return both blob and canvas for further use
          } else {
            reject(new Error("Failed to create resized image blob."));
          }
        },
        "image/jpeg", // Save as JPEG format
        1 // Maximum quality
      );
    };

    img.onerror = (error) => reject(error);

    // Read the image file and set as the source for the image object
    const reader = new FileReader();
    reader.onload = () => (img.src = reader.result);
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(imageFile);
  });
}

// Usage Example
const inputElement = document.querySelector("#imageInput");
inputElement.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (file) {
    try {
      // Downscale the image to mimic the iPhone 3GS resolution (3 MP)
      const { blob, canvas } = await downscaleImage(file, 3_000_000);

      // Create a glfx.js canvas for image effects
      const fxCanvas = fx.canvas();
      const texture = fxCanvas.texture(canvas);

      // Apply effects to mimic iPhone 3GS camera
      fxCanvas
        .draw(texture)
        .brightnessContrast(-0.05, -0.05)
        // .curves(
        //   [
        //     [0, 0], // Shadows untouched
        //     [0.3, 0.28], // Darken midtones
        //     [0.7, 0.8], // Lighten highlights
        //     [1, 1], // Whites untouched
        //   ],
        //   [
        //     [0, 0], // Shadows untouched for green channel
        //     [0.3, 0.25], // Darken midtones slightly more for green
        //     [0.7, 0.78], // Soften highlights
        //     [1, 1], // Whites untouched
        //   ],
        //   [
        //     [0, 0], // Shadows untouched for blue channel
        //     [0.3, 0.3], // Neutralize midtones
        //     [0.7, 0.7], // Keep highlights the same
        //     [1, 1], // Whites untouched
        //   ]
        // )
        .hueSaturation(0, 0.2)
        .noise(0.1)
        .triangleBlur(2)
        .update();

      // Display the processed image on a new canvas
      const outputCanvas = document.createElement("canvas");
      outputCanvas.width = fxCanvas.width;
      outputCanvas.height = fxCanvas.height;
      const outputCtx = outputCanvas.getContext("2d");
      outputCtx.drawImage(fxCanvas, 0, 0);

      // Export the processed image as a blob
      outputCanvas.toBlob(
        (processedBlob) => {
          const processedUrl = URL.createObjectURL(processedBlob);
          const processedImg = document.createElement("img");
          processedImg.src = processedUrl;

          // Display the processed image
          const output = document.getElementById("output");
          output.innerHTML = ""; // Clear previous output
          output.appendChild(processedImg);
        },
        "image/jpeg",
        1 // Maximum quality
      );
    } catch (error) {
      console.error("Error resizing or processing image:", error);
    }
  }
});
