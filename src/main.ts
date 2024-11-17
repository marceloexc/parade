import { getImageData } from "./scopes/vectorscope_dt.ts";

const imageInput = document.getElementById('image-input') as HTMLInputElement;
const canvas = document.getElementById('image') as HTMLCanvasElement;
const canvasContext = canvas.getContext('2d')!;

const scopeCanvas = document.getElementById("vectorscope") as HTMLCanvasElement;
const scopeCtx = scopeCanvas.getContext("2d")!;

imageInput.addEventListener('change', handleInputFile);

const refreshButton = document.getElementById('refresh');
const cursorButton = document.getElementById('cursor_test');
refreshButton.addEventListener("click", getImageData);
cursorButton.addEventListener("click", representAsThinking);

let dropArea = document.getElementById('drop-area');
    dropArea.addEventListener('dragenter', handleImage, false);
dropArea.addEventListener('dragleave', handleImage, false);
dropArea.addEventListener('dragover', handleImage, false);
dropArea.addEventListener('drop', handleImage, false);

const imageThumbnailFilename = document.getElementById('image_thumbnail_filename');

['dragenter', 'dragleave', 'dragover', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, preventDefaults, false)
});

['dragover', 'dragenter'].forEach(eventName => {
    dropArea.addEventListener(eventName, highlight, false)
});

['dragleave', 'drop'].forEach(eventName => {
    dropArea.addEventListener(eventName, deselect_highlight, false)
});

dropArea.addEventListener('drop', handleDrop, false);

function preventDefaults(e: any): void {
    e.preventDefault();
    e.stopPropagation();
}

function highlight(): void {
    dropArea.classList.add('highlight')
}

function deselect_highlight(): void {
    dropArea.classList.remove('highlight')
}

function handleDrop(e: DragEvent): void {
    let dt = e.dataTransfer;
    if (dt) {
        const file = dt.files[0];
        updateImageFilename(dt.files[0].name)
        handleImage(file);
    }
}

function handleInputFile(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    updateImageFilename(file.name)
    handleImage(file)
}

function handleImage(file: File): void {
    const reader = new FileReader();
    
    reader.onload = function(event: ProgressEvent<FileReader>) {
        const img = new Image();
        
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            
            canvasContext.drawImage(img, 0, 0);
            
            getImageData();
        }
        
        img.src = event.target?.result as string;
    }
    reader.readAsDataURL(file);
}

function updateImageFilename(filename: string): void {
    imageThumbnailFilename.textContent = filename;
}

function representAsThinking() :void {
    document.body.style.cursor = "wait";
}
