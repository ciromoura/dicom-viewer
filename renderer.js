const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const cornerstone = require('cornerstone-core');
const cornerstoneWADOImageLoader = require('cornerstone-wado-image-loader');
const cornerstoneTools = require('cornerstone-tools');
const cornerstoneMath = require('cornerstone-math');
const dicomParser = require('dicom-parser');

// Inicialização do Cornerstone
cornerstone.events.addEventListener('cornerstoneimageloadprogress', (event) => {
    console.log('Image Load Progress:', event);
    document.querySelector('.loading').style.display = 'block';
});

cornerstone.events.addEventListener('cornerstoneimageloaded', (event) => {
    console.log('Image Loaded:', event);
    document.querySelector('.loading').style.display = 'none';
    updateImageInfo(event.detail.image);
});

cornerstone.events.addEventListener('cornerstoneimageloadfailed', (event) => {
    console.error('Image Load Failed:', event);
    document.querySelector('.loading').style.display = 'none';
    alert('Failed to load image');
});

// Inicialização do CornerstoneTools e suas dependências
cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = require('hammerjs');
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneTools.init();

// Configuração do WADO Image Loader
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

// Estado global
let currentImageIndex = 0;
let currentSeries = [];
let element = null;
let currentTool = 'Wwwc';

// Configuração do carregador de arquivos local
function loadLocalFile(filePath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (error, data) => {
            if (error) {
                reject(error);
                return;
            }
            const arrayBuffer = data.buffer.slice(
                data.byteOffset,
                data.byteOffset + data.byteLength
            );
            resolve(arrayBuffer);
        });
    });
}

// Registrar o carregador personalizado
cornerstoneWADOImageLoader.wadouri.fileManager.add = loadLocalFile;

// Função para atualizar informações da imagem
function updateImageInfo(image) {
    const imageInfo = document.getElementById('imageInfo');
    if (!image) {
        imageInfo.innerHTML = 'No image loaded';
        return;
    }

    const info = `
        <p><strong>Dimensions:</strong> ${image.columns} x ${image.rows}</p>
        <p><strong>Spacing:</strong> ${image.columnPixelSpacing?.toFixed(2) || 'N/A'} x ${image.rowPixelSpacing?.toFixed(2) || 'N/A'}</p>
        <p><strong>Window Center:</strong> ${image.windowCenter || 'N/A'}</p>
        <p><strong>Window Width:</strong> ${image.windowWidth || 'N/A'}</p>
        ${currentSeries.length > 1 ? `<p><strong>Image:</strong> ${currentImageIndex + 1}/${currentSeries.length}</p>` : ''}
    `;
    imageInfo.innerHTML = info;
}

// Função para carregar uma série de imagens
async function loadImageSeries(dirPath) {
    try {
        document.querySelector('.loading').style.display = 'block';
        
        const files = fs.readdirSync(dirPath)
            .filter(file => file.toLowerCase().endsWith('.dcm'))
            .sort()
            .map(file => path.join(dirPath, file));

        if (files.length === 0) {
            alert('No DICOM files found in the selected directory');
            document.querySelector('.loading').style.display = 'none';
            return;
        }

        currentSeries = files;
        currentImageIndex = 0;

        const seriesList = document.getElementById('seriesList');
        seriesList.innerHTML = files.map((file, index) => `
            <div class="series-item ${index === 0 ? 'active' : ''}" data-index="${index}">
                Image ${index + 1}
            </div>
        `).join('');

        seriesList.querySelectorAll('.series-item').forEach(item => {
            item.addEventListener('click', () => {
                currentImageIndex = parseInt(item.dataset.index);
                loadAndDisplayImage(currentSeries[currentImageIndex]);
                updateSeriesSelection();
            });
        });

        await loadAndDisplayImage(files[0]);
        
    } catch (error) {
        console.error('Error loading series:', error);
        alert('Error loading image series');
        document.querySelector('.loading').style.display = 'none';
    }
}

// Função para atualizar a seleção na lista de séries
function updateSeriesSelection() {
    document.querySelectorAll('.series-item').forEach((item, index) => {
        item.classList.toggle('active', index === currentImageIndex);
    });
}

// Função para carregar e exibir uma imagem
async function loadAndDisplayImage(filePath) {
    try {
        document.querySelector('.loading').style.display = 'block';
        
        const imageId = `wadouri:file://${filePath}`;
        const image = await cornerstone.loadAndCacheImage(imageId);
        
        const viewport = cornerstone.getDefaultViewportForImage(element, image);
        await cornerstone.loadImage(imageId).then(function (image) {
            cornerstone.displayImage(element, image, viewport);
          });
        
        updateImageInfo(image);
        updateSeriesSelection();
        
        document.querySelector('.loading').style.display = 'none';
    } catch (error) {
        console.error('Error loading/displaying image:', error);
        alert('Error loading image. Check the console for details.');
        document.querySelector('.loading').style.display = 'none';
    }
}

// Função para mudar a ferramenta ativa
function setActiveTool(toolName) {
    // Desativar todas as ferramentas primeiro
    const allTools = [
        'Wwwc',
        'Pan',
        'Zoom',
        'Length',
        'Angle',
        'RectangleRoi',
        'EllipticalRoi',
        'ArrowAnnotate'
    ];
    
    allTools.forEach(tool => {
        cornerstoneTools.setToolDisabled(tool);
    });

    // Ativar a nova ferramenta
    cornerstoneTools.setToolActive(toolName, { mouseButtonMask: 1 });
    currentTool = toolName;

    // Atualizar visual dos botões
    document.querySelectorAll('.tool-button').forEach(button => {
        button.classList.remove('active');
        if (button.dataset.tool === toolName) {
            button.classList.add('active');
        }
    });
}

// Função para inicializar as ferramentas
function initializeTools() {
    // Adicionar ferramentas básicas
    cornerstoneTools.addTool(cornerstoneTools.WwwcTool);
    cornerstoneTools.addTool(cornerstoneTools.PanTool);
    cornerstoneTools.addTool(cornerstoneTools.ZoomTool, {
        configuration: {
            invert: false,
            preventZoomOutsideImage: false,
            minScale: 0.1,
            maxScale: 20.0
        }
    });
    cornerstoneTools.addTool(cornerstoneTools.StackScrollMouseWheelTool);

    // Adicionar ferramentas de anotação
    cornerstoneTools.addTool(cornerstoneTools.LengthTool, {
        configuration: {
            drawHandles: true,
            drawHandlesOnHover: false,
            hideHandlesIfMoving: false,
            renderDashed: false
        }
    });
    cornerstoneTools.addTool(cornerstoneTools.AngleTool, {
        configuration: {
            drawHandles: true,
            drawHandlesOnHover: false,
            hideHandlesIfMoving: false
        }
    });
    cornerstoneTools.addTool(cornerstoneTools.RectangleRoiTool);
    cornerstoneTools.addTool(cornerstoneTools.EllipticalRoiTool);
    cornerstoneTools.addTool(cornerstoneTools.ArrowAnnotateTool);

    // Configurar ferramentas padrão
    cornerstoneTools.setToolActive('Wwwc', { mouseButtonMask: 1 });
    cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 2 });
    cornerstoneTools.setToolActive('Zoom', { mouseButtonMask: 4 });
    cornerstoneTools.setToolActive('StackScrollMouseWheel', {});

    // Adicionar botões de ferramentas
    const toolButtons = [
        { name: 'Wwwc', label: 'Window/Level', icon: '🔆' },
        { name: 'Pan', label: 'Pan', icon: '✋' },
        { name: 'Zoom', label: 'Zoom', icon: '🔍' },
        { name: 'Length', label: 'Length', icon: '📏' },
        { name: 'Angle', label: 'Angle', icon: '📐' },
        { name: 'RectangleRoi', label: 'Rectangle', icon: '⬜' },
        { name: 'EllipticalRoi', label: 'Ellipse', icon: '⭕' },
        { name: 'ArrowAnnotate', label: 'Arrow', icon: '➡️' }
    ];

    const toolsContainer = document.getElementById('toolsContainer');
    toolsContainer.innerHTML = ''; // Limpar container existente
    toolButtons.forEach(tool => {
        const button = document.createElement('button');
        button.className = 'tool-button';
        button.dataset.tool = tool.name;
        button.innerHTML = `${tool.icon} ${tool.label}`;
        button.onclick = () => setActiveTool(tool.name);
        toolsContainer.appendChild(button);
    });

    // Ativar a primeira ferramenta por padrão
    setActiveTool('Wwwc');
}

// Inicialização quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async function() {
    element = document.getElementById('dicomImage');
    const loadSingleButton = document.getElementById('loadSingleButton');
    const loadSeriesButton = document.getElementById('loadSeriesButton');

    if (!element || !loadSingleButton || !loadSeriesButton) {
        console.error('Required elements not found');
        return;
    }

    // Habilitar o elemento para o Cornerstone
    cornerstone.enable(element);

    // Inicializar ferramentas
    initializeTools();

    // Event listeners para os botões
    loadSingleButton.addEventListener('click', () => {
        ipcRenderer.send('open-file-dialog', 'single');
    });

    loadSeriesButton.addEventListener('click', () => {
        ipcRenderer.send('open-directory-dialog');
    });

    // Event listeners para respostas do processo principal
    ipcRenderer.on('file-selected', async (event, filePath) => {
        currentSeries = [filePath];
        currentImageIndex = 0;
        await loadAndDisplayImage(filePath);
    });

    ipcRenderer.on('directory-selected', async (event, dirPath) => {
        await loadImageSeries(dirPath);
    });
}); 



