// Get directory for pdfs
let directory;
document.getElementById("addToFolder").addEventListener("click", async () => {
  try {
    directory = await window.showDirectoryPicker({
      startIn: "documents",
    });

    document.getElementById("addToFolder").style.display = "none";
    var folderInfo = document.getElementById("folderInfo");
    for await (const entry of directory.values()) {
      if (entry.kind == "file" && entry.name.includes(".pdf")) {
        const li = document.createElement("li");
        li.innerText = `${entry.name}`;
        li.addEventListener("click", (event) => {
          linkToPDF(event.target.innerHTML);
        });
        userList.appendChild(li);
        folderInfo.append(li);
      }
    }
  } catch (e) {
    console.log(e);
  }
});

// PDF open function
function linkToPDF(name) {
  directory.getFileHandle(name).then((pdfFile) => {
    pdfFile.getFile().then((pdfStream) => {
      PDFStart(URL.createObjectURL(pdfStream));
    });
  });
}

// PDF Viewer
var PDFTimestamp;
const PDFStart = (nameRoute) => {
  const newCanvas = () => {
    document.getElementById("cnv").remove();
    let elem = document.createElement("canvas");
    elem.id = "cnv";
    document.getElementById("canvasCont").appendChild(elem);
    return elem;
  };

  let loadingTask = pdfjsLib.getDocument(nameRoute),
    pdfDoc = null,
    canvas = newCanvas(),
    ctx = canvas.getContext("2d", { willReadFrequently: true }),
    scale = 1.5,
    numPage = 1;

  const GeneratePDF = (numPage) => {
    pdfDoc.getPage(numPage).then((page) => {
      let viewport = page.getViewport({ scale: scale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const pageTimestamp = new Date().getTime();
      PDFTimestamp = pageTimestamp;

      let renderContext = {
        canvasContext: ctx,
        viewport: viewport,
      };

      if (this.renderTask && PDFTimestamp != pageTimestamp) {
        this.renderTask.cancel();
      }

      this.renderTask = page.render(renderContext);
    });
    document.querySelector("#npages").innerHTML = numPage;
  };

  const PrevPage = () => {
    if (numPage === 1) {
      return;
    }
    numPage--;
    GeneratePDF(numPage);
  };

  const NextPage = () => {
    if (numPage >= pdfDoc.numPages) {
      return;
    }
    numPage++;
    GeneratePDF(numPage);
  };

  socket.on("control", (message) => {
    if (message.text == "shake") {
      NextPage();
    }
  });

  document.querySelector("#prev").addEventListener("click", PrevPage);
  document.querySelector("#next").addEventListener("click", NextPage);

  let touchstartX = 0;
  let touchendX = 0;

  function checkDirection() {
    if (Math.abs(touchstartX - touchendX) > 50) {
      if (touchendX < touchstartX) {
        // console.log("swiped left!");
        NextPage();
      }
      if (touchendX > touchstartX) {
        // console.log("swiped right!");
        PrevPage();
      }
    }
  }

  document.addEventListener("touchstart", (e) => {
    touchstartX = e.changedTouches[0].screenX;
  });

  document.addEventListener("touchend", (e) => {
    touchendX = e.changedTouches[0].screenX;
    checkDirection();
  });

  loadingTask.promise.then((pdfDoc_) => {
    pdfDoc = pdfDoc_;
    document.querySelector("#npages").innerHTML = pdfDoc.numPages;
    GeneratePDF(numPage);
  });
};
