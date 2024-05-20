document.addEventListener("DOMContentLoaded", function () {
  const containerDiv = document.querySelector(".container.shadow.py-5.px-3.my-5.bg-body.rounded");

  const fileInput = document.createElement("input");
  fileInput.setAttribute("type", "file");
  fileInput.setAttribute("accept", "image/jpeg"); // Akceptuje tylko pliki JPEG
  fileInput.style.display = "block";
  fileInput.style.margin = "0 auto";
  fileInput.addEventListener("change", function () {
    const file = fileInput.files[0];
    if (file) {
      const fileReader = new FileReader();
      fileReader.onload = function (event) {
        const imageData = event.target.result;

        // Wyświetlenie zdjęcia (zmniejszonego do 1/6 oryginalnego rozmiaru)
        const img = document.createElement("img");
        img.src = imageData;
        img.classList.add("lightbox-image"); // Dodaj klasę do dostosowania wielkości w lightboxie
        img.style.display = "block";
        img.style.margin = "0 auto";
        img.style.maxWidth = "calc(100% / 6)"; // Mniejszy rozmiar - 1/6 oryginalnego
        containerDiv.appendChild(img);
      };
      fileReader.readAsDataURL(file);
    }
  });

  // Dodanie inputu do wyboru pliku do diva
  containerDiv.appendChild(fileInput);
});
