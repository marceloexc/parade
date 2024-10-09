interface RGB {
    r: number;
    g: number;
    b: number;
}

interface RYB {
    r: number;
    y: number;
    b: number;
}

interface HCV {
    h: number;
    c: number;
    v: number;
}

interface Chromaticity {
    x: number;
    y2: number;
}

const imageInput = document.getElementById('image-input') as HTMLInputElement;
const canvas = document.getElementById('vectorscope') as HTMLCanvasElement;
const canvasContext = canvas.getContext('2d')!;
const resultCanvas = document.getElementById('result') as HTMLCanvasElement;

const test = document.getElementById("test") as HTMLCanvasElement;
const testContext = test.getContext("2d")!;

imageInput.addEventListener('change', handleImage);

function handleImage(e: Event): void {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;

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

function getImageData(): void {
    drawVectorBackground();
    const imageData = canvasContext.getImageData(0, 0, canvas.width, canvas.height);
    
    const imageDataArray = imageData.data;   
    // the imageDataArray looks a bit like this: 
    
    // 0 70
    // 1 63
    // 2 47
    // 3 255
    // 4 40
    // 5 41
    // 6 39
    // 7 255
    
    // its doing this in the form of RGBA. Thus, to iterate over it, we have our index append itself by 4 everytime 

    for (let i = 0; i < imageDataArray.length; i += 4) {
        const r = imageDataArray[i];
        const g = imageDataArray[i+1];
        const b = imageDataArray[i+2];
        
        const ryb = convertToRYB(r, g, b);
        const chromaticity = getChromaticity(ryb.r, ryb.y, ryb.b);
        plotVectorscope(chromaticity.x, chromaticity.y2, r, g, b);
        // Alpha channel is totally ignored here.

    }
}

function convertToRYB(r: number, g: number, b: number): RYB {
  
    // white
    let w = Math.min(r, g, b);
    
    r -= w;
    g -= w;
    b -= w;
    
    const maxRgb = Math.max(r, g, b);
    
    let y = Math.min(r, g);
    r -= y;
    g -= y;
    
    // if green is still present, we remove it
    if (b > 0 && g > 0) {
        b /= 2;
        g /= 2;
    }
    
    y += g;
    b += g;
    
    const maxRyb = Math.max(r, y, b);
    if (maxRyb > 0) {
        const n = maxRgb / maxRyb;
        
        r *= n;
        y *= n;
        b *= n;
    }
    
    // add white back in
    r += w;
    y += w;
    b += w;
    
    return {r, y, b};
}

function RYBtoHCV(r: number, y: number, b: number): HCV {
    const max = Math.max(r, y, b);
    const min = Math.min(r, y, b);
    
    const chroma = max - min;
    
    let hue: number;
    if (chroma === 0) {
        hue = 0; // gray
    } else if (max === r) {
        hue = ((y - b) / chroma) % 6;
    } else if (max === y) {
        hue = ((b - r) / chroma) + 2;
    }
    else {
        hue = ((r - y) / chroma) + 4;
    }
    
    hue /= 6;
    
    return {h: hue, c: chroma, v: max};
}

function logarithmicScale(value: number, maxRadius: number): number {
    if (value === 0) return 0;
    
    const sign = Math.sign(value);
    const absValue = Math.abs(value);
    
    return sign * Math.log(1 + absValue) / Math.log(1 + maxRadius);
}

function getChromaticity(r: number, y: number, b: number): Chromaticity {
    const hcv = RYBtoHCV(r, y, b);
    
    const alpha = 2 * Math.PI * hcv.h;
    
    // scale down to [-1, 1]
    const scale = 0.0025;
    
    let x = Math.cos(alpha) * hcv.c * scale;
    // TODO i really dont like this variable name
    let y2 = Math.sin(alpha) * hcv.c * scale;
    
    const maxRadius = 1;
    
    x = logarithmicScale(x, maxRadius);
    y2 = logarithmicScale(y2, maxRadius);
    
    return {x, y2};
}

function plotVectorscope(x: number, y: number, r: number, g: number, b: number): void{
  
  // console.log("Plotting with " , x, " " , y);
  const centerX = test.width / 2;
  const centerY = test.height / 2;
  const radius = Math.min(centerX, centerY) * 0.9;
  
  x = Math.max(-1, Math.min(1, x));
  y = Math.max(-1, Math.min(1, y));
  
  const scaledX = (-x) * radius; // rotate it by 90*, similar to Darktable and make red north
  const scaledY = y * radius;
  
  const plotX = centerX - scaledX;
  const plotY = centerY - scaledY; // inverted
  
  // console.log("Plot coords: ", plotX, plotY);
  
  testContext.fillStyle = "rgba(" + r + "," + g + "," + b + ", 0.05 )"; 
  testContext.beginPath();
  testContext.arc(plotX, plotY, 1, 0, 2 * Math.PI);
  testContext.fill();
}

function drawVectorBackground(): void {
    const centerX = test.width / 2;
    const centerY = test.height / 2;
    const radius = Math.min(centerX, centerY) * 0.9;

    // clear prev canvas
    testContext.clearRect(0, 0, test.width, test.height);
    
    // circular boundary
    testContext.beginPath();
    testContext.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    testContext.strokeStyle = 'rgba(200, 200, 200, 0.5)';
    testContext.stroke();
    
    // draw axes
    testContext.beginPath();
    testContext.moveTo(centerX - radius, centerY);
    testContext.lineTo(centerX + radius, centerY);
    testContext.moveTo(centerX, centerY - radius);
    testContext.lineTo(centerX, centerY + radius);
    testContext.strokeStyle = 'rgba(150, 150, 150, 0.5)';
    testContext.stroke();
    
    // circle axes references
    testContext.beginPath();
    testContext.arc(centerX, centerY, radius * 0.75, 0, 2*Math.PI);
    testContext.stroke();
    
    testContext.beginPath();
    testContext.arc(centerX, centerY, radius * 0.5, 0, 2*Math.PI);
    testContext.stroke();
    
    testContext.beginPath();
    testContext.arc(centerX, centerY, radius * 0.25, 0, 2*Math.PI);
    testContext.stroke();
}
