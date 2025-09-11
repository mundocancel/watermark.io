import React, { useState } from 'react';

const App = () => {
  const [activeTab, setActiveTab] = useState('watermark');
  const [currentMode, setCurrentMode] = useState('text');
  const [originalImage, setOriginalImage] = useState(null);
  const [watermarkLogo, setWatermarkLogo] = useState(null);
  const [bgImage, setBgImage] = useState(null);

  // State for form controls
  const [formData, setFormData] = useState({
    watermarkText: '© mundocancel',
    textPosition: 'bottom-right',
    textOpacity: 0.7,
    fontSize: 40,
    textColor: '#ffffff',
    logoPosition: 'bottom-right',
    logoOpacity: 0.8,
    logoScale: 25,
    tileType: 'text',
    tileSpacing: 150,
    tileOpacity: 0.3,
    tileAngle: -30,
    tolerance: 30
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        if (type === 'image') {
          setOriginalImage(img);
          if ((currentMode === 'text' && formData.watermarkText) || 
              (currentMode === 'logo' && watermarkLogo) || 
              currentMode === 'tile') {
            applyWatermark();
          }
        } else if (type === 'logo') {
          setWatermarkLogo(img);
          if (originalImage) applyWatermark();
        } else if (type === 'convert') {
          convertToPng(img);
        } else if (type === 'bg') {
          setBgImage(img);
          const bgCanvas = document.getElementById('bgCanvas');
          const bgCtx = bgCanvas.getContext('2d');
          
          const maxWidth = 500;
          const maxHeight = 400;
          let { width, height } = img;
          
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }
          
          bgCanvas.width = width;
          bgCanvas.height = height;
          bgCtx.drawImage(img, 0, 0, width, height);
        }
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const applyWatermark = () => {
    if (!originalImage) {
      alert("⚠️ Por favor, sube una imagen primero.");
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = originalImage.width;
    canvas.height = originalImage.height;

    // Draw original image
    ctx.drawImage(originalImage, 0, 0);

    // Apply watermark based on mode
    if (currentMode === 'text') {
      applyTextWatermark(ctx);
    } else if (currentMode === 'logo' && watermarkLogo) {
      applyLogoWatermark(ctx);
    } else if (currentMode === 'tile') {
      applyTiledWatermark(ctx);
    } else {
      alert("⚠️ Configuración de marca de agua incompleta.");
      return;
    }

    // Show preview
    const preview = document.getElementById('preview');
    preview.src = canvas.toDataURL('image/png');
    
    // Set download link
    const downloadLink = document.getElementById('downloadLink');
    downloadLink.href = preview.src;
    downloadLink.download = 'imagen-con-marca-de-agua.png';
    downloadLink.style.display = 'block';
  };

  const applyTextWatermark = (ctx) => {
    const text = formData.watermarkText || "© Watermark";
    const opacity = parseFloat(formData.textOpacity);
    const fontSize = parseInt(formData.fontSize);
    const color = formData.textColor;
    const position = formData.textPosition;
    
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = color;
    ctx.globalAlpha = opacity;
    
    const padding = 20;
    const textWidth = ctx.measureText(text).width;
    const textHeight = fontSize;
    
    let x, y;
    switch (position) {
      case 'bottom-right':
        x = ctx.canvas.width - textWidth - padding;
        y = ctx.canvas.height - padding;
        break;
      case 'bottom-left':
        x = padding;
        y = ctx.canvas.height - padding;
        break;
      case 'top-right':
        x = ctx.canvas.width - textWidth - padding;
        y = padding + textHeight;
        break;
      case 'top-left':
        x = padding;
        y = padding + textHeight;
        break;
      case 'center':
        x = (ctx.canvas.width - textWidth) / 2;
        y = (ctx.canvas.height + textHeight) / 2;
        break;
    }
    
    ctx.fillText(text, x, y);
    ctx.globalAlpha = 1.0;
  };

  const applyLogoWatermark = (ctx) => {
    const opacity = parseFloat(formData.logoOpacity);
    const scale = parseInt(formData.logoScale) / 100;
    const position = formData.logoPosition;
    
    const logoWidth = watermarkLogo.width * scale;
    const logoHeight = watermarkLogo.height * scale;
    
    const padding = 20;
    let x, y;
    
    switch (position) {
      case 'bottom-right':
        x = ctx.canvas.width - logoWidth - padding;
        y = ctx.canvas.height - logoHeight - padding;
        break;
      case 'bottom-left':
        x = padding;
        y = ctx.canvas.height - logoHeight - padding;
        break;
      case 'top-right':
        x = ctx.canvas.width - logoWidth - padding;
        y = padding;
        break;
      case 'top-left':
        x = padding;
        y = padding;
        break;
      case 'center':
        x = (ctx.canvas.width - logoWidth) / 2;
        y = (ctx.canvas.height - logoHeight) / 2;
        break;
    }
    
    ctx.globalAlpha = opacity;
    ctx.drawImage(watermarkLogo, x, y, logoWidth, logoHeight);
    ctx.globalAlpha = 1.0;
  };

  const applyTiledWatermark = (ctx) => {
    const tileType = formData.tileType;
    const spacing = parseInt(formData.tileSpacing);
    const opacity = parseFloat(formData.tileOpacity);
    const angle = parseFloat(formData.tileAngle) * Math.PI / 180;
    
    ctx.globalAlpha = opacity;
    
    if (tileType === 'text') {
      const text = formData.watermarkText || "©";
      const fontSize = parseInt(formData.fontSize) || 40;
      const color = formData.textColor || "#ffffff";
      
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = color;
      
      ctx.save();
      ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
      ctx.rotate(angle);
      ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
      
      for (let x = -spacing; x < ctx.canvas.width + spacing; x += spacing) {
        for (let y = -spacing; y < ctx.canvas.height + spacing; y += spacing) {
          ctx.fillText(text, x, y);
        }
      }
      
      ctx.restore();
    } else if (tileType === 'logo' && watermarkLogo) {
      const scale = parseInt(formData.logoScale) / 100;
      const logoWidth = watermarkLogo.width * scale;
      const logoHeight = watermarkLogo.height * scale;
      
      ctx.save();
      ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
      ctx.rotate(angle);
      ctx.translate(-ctx.canvas.width / 2, -ctx.canvas.height / 2);
      
      for (let x = -spacing; x < ctx.canvas.width + spacing; x += spacing) {
        for (let y = -spacing; y < ctx.canvas.height + spacing; y += spacing) {
          ctx.drawImage(watermarkLogo, x, y, logoWidth, logoHeight);
        }
      }
      
      ctx.restore();
    }
    
    ctx.globalAlpha = 1.0;
  };

  const convertToPng = (img) => {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const pngUrl = canvas.toDataURL('image/png');
    const link = document.getElementById('downloadPngLink');
    link.href = pngUrl;
    link.download = 'imagen-convertida.png';
    link.style.display = 'block';
  };

  const processBackgroundRemoval = (targetR, targetG, targetB) => {
    const tolerance = parseInt(formData.tolerance);
    const bgCanvas = document.getElementById('bgCanvas');
    const bgCtx = bgCanvas.getContext('2d');
    
    const imageData = bgCtx.getImageData(0, 0, bgCanvas.width, bgCanvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      const distance = Math.sqrt(
        Math.pow(r - targetR, 2) +
        Math.pow(g - targetG, 2) +
        Math.pow(b - targetB, 2)
      );
      
      if (distance < tolerance) {
        data[i + 3] = 0; // Make transparent
      }
    }
    
    bgCtx.putImageData(imageData, 0, 0);
    
    const link = document.getElementById('downloadTransparentLink');
    link.href = bgCanvas.toDataURL('image/png');
    link.download = 'imagen-sin-fondo.png';
    link.style.display = 'block';
  };

  const handleCanvasClick = (e) => {
    if (!bgImage) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) * (e.currentTarget.width / rect.width));
    const y = Math.floor((e.clientY - rect.top) * (e.currentTarget.height / rect.height));
    
    const bgCtx = e.currentTarget.getContext('2d');
    const pixel = bgCtx.getImageData(x, y, 1, 1).data;
    const targetR = pixel[0];
    const targetG = pixel[1];
    const targetB = pixel[2];
    
    processBackgroundRemoval(targetR, targetG, targetB);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">Watermark</h1>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-gray-600">by</span>
              <div className="w-12 h-12 flex items-center justify-center">
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-gray-800">
                  <path d="M12 4L12 20M12 20L8 16M12 20L16 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M8 8H16M8 12H16M8 16H16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-xl font-semibold text-gray-800">mundocancel</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
            <div className="flex justify-center space-x-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('watermark')}
                className={`px-6 py-3 rounded-md transition-all duration-200 ${
                  activeTab === 'watermark'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M17 7h.01M7 12h.01M17 12h.01M7 17h.01M17 17h.01M7 22h.01M17 22h.01" />
                  </svg>
                  <span>Watermark Tools</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('converter')}
                className={`px-6 py-3 rounded-md transition-all duration-200 ${
                  activeTab === 'converter'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.356-2m15.356 2H15" />
                  </svg>
                  <span>Image Conversion</span>
                </div>
              </button>
              <button
                onClick={() => setActiveTab('background-remover')}
                className={`px-6 py-3 rounded-md transition-all duration-200 ${
                  activeTab === 'background-remover'
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  <span>Background Removal</span>
                </div>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            {activeTab === 'watermark' && (
              <div className="space-y-6">
                {/* Upload Section */}
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    Subir Imagen
                  </h2>
                  <label htmlFor="imageUpload" className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona una imagen para agregar marca de agua
                  </label>
                  <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'image')}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                {/* Mode Toggle */}
                <div className="flex gap-4">
                  <button
                    onClick={() => setCurrentMode('text')}
                    className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                      currentMode === 'text'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                    <span>Texto</span>
                  </button>
                  <button
                    onClick={() => setCurrentMode('logo')}
                    className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                      currentMode === 'logo'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Logo</span>
                  </button>
                  <button
                    onClick={() => setCurrentMode('tile')}
                    className={`flex-1 py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 ${
                      currentMode === 'tile'
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    <span>Mosaico</span>
                  </button>
                </div>

                {/* Options */}
                {currentMode === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="watermarkText" className="block text-sm font-medium text-gray-700 mb-2">
                        Texto de marca de agua
                      </label>
                      <input
                        type="text"
                        id="watermarkText"
                        name="watermarkText"
                        value={formData.watermarkText}
                        onChange={handleInputChange}
                        placeholder="© Tu marca"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="textPosition" className="block text-sm font-medium text-gray-700 mb-2">
                        Posición
                      </label>
                      <select
                        id="textPosition"
                        name="textPosition"
                        value={formData.textPosition}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="bottom-right">Abajo a la derecha</option>
                        <option value="bottom-left">Abajo a la izquierda</option>
                        <option value="top-right">Arriba a la derecha</option>
                        <option value="top-left">Arriba a la izquierda</option>
                        <option value="center">Centro</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="textOpacity" className="block text-sm font-medium text-gray-700 mb-2">
                        Opacidad
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          id="textOpacity"
                          name="textOpacity"
                          min="0.1"
                          max="1.0"
                          step="0.1"
                          value={formData.textOpacity}
                          onChange={handleInputChange}
                          className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600">{Math.round(formData.textOpacity * 100)}%</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="fontSize" className="block text-sm font-medium text-gray-700 mb-2">
                        Tamaño de fuente
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          id="fontSize"
                          name="fontSize"
                          min="10"
                          max="100"
                          value={formData.fontSize}
                          onChange={handleInputChange}
                          className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600">{formData.fontSize}px</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="textColor" className="block text-sm font-medium text-gray-700 mb-2">
                        Color del texto
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="color"
                          id="textColor"
                          name="textColor"
                          value={formData.textColor}
                          onChange={handleInputChange}
                          className="w-12 h-12 rounded border border-gray-300 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600">{formData.textColor}</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentMode === 'logo' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="logoUpload" className="block text-sm font-medium text-gray-700 mb-2">
                        Subir logo (PNG con transparencia recomendado)
                      </label>
                      <input
                        type="file"
                        id="logoUpload"
                        accept="image/*"
                        onChange={(e) => handleFileChange(e, 'logo')}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                    </div>
                    <div>
                      <label htmlFor="logoPosition" className="block text-sm font-medium text-gray-700 mb-2">
                        Posición
                      </label>
                      <select
                        id="logoPosition"
                        name="logoPosition"
                        value={formData.logoPosition}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="bottom-right">Abajo a la derecha</option>
                        <option value="bottom-left">Abajo a la izquierda</option>
                        <option value="top-right">Arriba a la derecha</option>
                        <option value="top-left">Arriba a la izquierda</option>
                        <option value="center">Centro</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="logoOpacity" className="block text-sm font-medium text-gray-700 mb-2">
                        Opacidad
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          id="logoOpacity"
                          name="logoOpacity"
                          min="0.1"
                          max="1.0"
                          step="0.1"
                          value={formData.logoOpacity}
                          onChange={handleInputChange}
                          className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600">{Math.round(formData.logoOpacity * 100)}%</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="logoScale" className="block text-sm font-medium text-gray-700 mb-2">
                        Escala
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          id="logoScale"
                          name="logoScale"
                          min="5"
                          max="100"
                          value={formData.logoScale}
                          onChange={handleInputChange}
                          className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600">{formData.logoScale}%</span>
                      </div>
                    </div>
                  </div>
                )}

                {currentMode === 'tile' && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="tileType" className="block text-sm font-medium text-gray-700 mb-2">
                        Tipo
                      </label>
                      <select
                        id="tileType"
                        name="tileType"
                        value={formData.tileType}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="text">Texto</option>
                        <option value="logo">Logo</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="tileSpacing" className="block text-sm font-medium text-gray-700 mb-2">
                        Espaciado
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          id="tileSpacing"
                          name="tileSpacing"
                          min="50"
                          max="300"
                          value={formData.tileSpacing}
                          onChange={handleInputChange}
                          className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600">{formData.tileSpacing}px</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="tileOpacity" className="block text-sm font-medium text-gray-700 mb-2">
                        Opacidad
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          id="tileOpacity"
                          name="tileOpacity"
                          min="0.1"
                          max="1.0"
                          step="0.1"
                          value={formData.tileOpacity}
                          onChange={handleInputChange}
                          className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600">{Math.round(formData.tileOpacity * 100)}%</span>
                      </div>
                    </div>
                    <div>
                      <label htmlFor="tileAngle" className="block text-sm font-medium text-gray-700 mb-2">
                        Ángulo
                      </label>
                      <div className="flex items-center space-x-4">
                        <input
                          type="range"
                          id="tileAngle"
                          name="tileAngle"
                          min="-180"
                          max="180"
                          value={formData.tileAngle}
                          onChange={handleInputChange}
                          className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                        />
                        <span className="text-sm font-medium text-gray-600">{formData.tileAngle}°</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    onClick={applyWatermark}
                    disabled={!originalImage}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Aplicar Marca de Agua</span>
                  </button>
                  
                  <div className="flex-1">
                    <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <img
                        id="preview"
                        src=""
                        alt="Vista previa"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 text-center">
                  <a
                    id="downloadLink"
                    href=""
                    className="hidden bg-green-600 hover:bg-green-700 text-white py-3 px-6 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Descargar Imagen</span>
                  </a>
                </div>
              </div>
            )}

            {activeTab === 'converter' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.356-2m15.356 2H15" />
                    </svg>
                    Conversor de Imágenes
                  </h2>
                  <label htmlFor="convertUpload" className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona una imagen para convertir a PNG
                  </label>
                  <input
                    type="file"
                    id="convertUpload"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'convert')}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    onClick={() => {
                      const fileInput = document.getElementById('convertUpload');
                      if (!fileInput.files[0]) {
                        alert("⚠️ Por favor, selecciona una imagen primero.");
                        return;
                      }
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.356-2m15.356 2H15" />
                    </svg>
                    <span>Convertir a PNG</span>
                  </button>
                  
                  <a
                    id="downloadPngLink"
                    href=""
                    className="hidden bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Descargar PNG</span>
                  </a>
                </div>
              </div>
            )}

            {activeTab === 'background-remover' && (
              <div className="space-y-6">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Eliminación de Fondo
                  </h2>
                  <label htmlFor="bgRemoveUpload" className="block text-sm font-medium text-gray-700 mb-2">
                    Selecciona una imagen para eliminar el fondo
                  </label>
                  <input
                    type="file"
                    id="bgRemoveUpload"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'bg')}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                </div>

                <div>
                  <label htmlFor="tolerance" className="block text-sm font-medium text-gray-700 mb-2">
                    Tolerancia de color
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      id="tolerance"
                      name="tolerance"
                      min="0"
                      max="255"
                      value={formData.tolerance}
                      onChange={handleInputChange}
                      className="flex-1 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-sm font-medium text-gray-600">{formData.tolerance}</span>
                  </div>
                </div>

                <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                  <p className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">
                    Haz clic en el fondo de la imagen para seleccionar el color a eliminar
                  </p>
                  <canvas
                    id="bgCanvas"
                    width="500"
                    height="400"
                    onClick={handleCanvasClick}
                    className="w-full h-full cursor-crosshair"
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    onClick={() => {
                      alert("🖱️ Haz clic en el área de fondo de la imagen para seleccionar el color a eliminar.");
                    }}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-all duration-200 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Eliminar Fondo</span>
                  </button>
                  
                  <a
                    id="downloadTransparentLink"
                    href=""
                    className="hidden bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    <span>Descargar PNG Transparente</span>
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8 text-gray-600 text-sm">
            <p>Watermark by mundocancel - Procesamiento 100% en tu navegador. Tus imágenes nunca se envían a servidores externos.</p>
            <p className="mt-1">© 2023 - Todos los derechos reservados</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;