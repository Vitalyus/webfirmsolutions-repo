const fs = require('fs');
const { createCanvas } = require('canvas');

function generateFavicon(size, filename) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Create gradient
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#1976d2');
    gradient.addColorStop(1, '#42a5f5');
    
    // Draw circle background
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Draw WF text
    ctx.fillStyle = 'white';
    ctx.font = `bold ${Math.floor(size * 0.45)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('WF', size/2, size/2 + size * 0.02);
    
    // Save to file
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(filename, buffer);
    console.log(`✓ Generated ${filename}`);
}

// Generate all required sizes
try {
    generateFavicon(16, '../favicon-16x16.png');
    generateFavicon(32, '../favicon-32x32.png');
    generateFavicon(180, '../apple-touch-icon.png');
    generateFavicon(192, '../android-chrome-192x192.png');
    generateFavicon(512, '../android-chrome-512x512.png');
    console.log('\n✓ All favicons generated successfully!');
} catch (error) {
    console.error('Error:', error.message);
    console.log('\nNote: This requires the "canvas" package. Install it with:');
    console.log('npm install canvas --save-dev');
}
