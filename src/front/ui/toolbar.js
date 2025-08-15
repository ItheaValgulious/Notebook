(function () {

    // UIButton class
    class UIButton {
        constructor(id, type, on_choose, on_config) {
            this.id = id;
            this.type = type;
            this.on_choose = on_choose || (() => { });
            this.on_config = on_config || (() => { });
        }
    }

    function set_brush(obj) {
        notebook.Env.current_pen['pen'] = 'pencil';
        var style = notebook.stroke_styles.get_style(obj.color, obj.width, obj.dash);
        notebook.Env.current_style = style;
    }

    function set_eraser(obj) {
        notebook.Env.current_pen['pen'] = 'eraser';
        notebook.Env.eraser_radius = obj.width * 2;
    }


    // Initialize UI buttons
    const uiButtons = [
        new UIButton('brush-1', 'brush', set_brush, set_brush),
        new UIButton('brush-2', 'brush', set_brush, set_brush),
        new UIButton('brush-3', 'brush', set_brush, set_brush),
        new UIButton('brush-4', 'brush', set_brush, set_brush),
        new UIButton('brush-5', 'brush', set_brush, set_brush),
        new UIButton('eraser', 'eraser', set_eraser, set_eraser),

        new UIButton('lasso', 'lasso', () => { notebook.Env.current_pen['pen'] = 'selector'; }),

        new UIButton('image', 'image'),
        new UIButton('markdown', 'markdown', () => { notebook.Env.current_pen['pen'] = 'markdown_creator'; }),

        new UIButton('setting', 'setting'),
        new UIButton('mode', 'mode')
    ];


    // Linear mapping for brush preview size
    function getPreviewSize(width) {
        // Map width (1-10) to size (2-30)
        return 2 + (width - 1) * (28 / 9);
    }

    // Update brush preview sizes
    function updateBrushPreviewSize(brushIndex, width) {
        const brush = document.querySelector(`.brush[data-brush="${brushIndex}"]`);
        const preview = brush.querySelector('.brush-preview');
        const size = getPreviewSize(width);
        preview.style.width = `${size}px`;
        preview.style.height = `${size}px`;
    }

    // Update slider label
    function updateSliderLabel(sliderId, labelId, prefix, value) {
        const label = document.getElementById(labelId);
        label.textContent = `${prefix}: ${value}`;
    }

    let selectedTool = null;

    //init all
    function _init_toolbar() {

        // Create a single off-screen canvas for color wheel
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = 300;
        offscreenCanvas.height = 300;

        // Draw HSL Color Wheel (once, reused for all canvases)
        function drawColorWheel() {
            const ctx = offscreenCanvas.getContext('2d');
            const width = offscreenCanvas.width;
            const height = offscreenCanvas.height;
            const centerX = width / 2;
            const centerY = height / 2;
            const radius = width / 2;

            ctx.clearRect(0, 0, width, height);
            const imageData = ctx.createImageData(width, height);

            for (let x = 0; x < width; x++) {
                for (let y = 0; y < height; y++) {
                    const dx = x - centerX;
                    const dy = y - centerY;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    const angle = Math.atan2(dy, dx) * 180 / Math.PI + 180;
                    const hue = angle;
                    const saturation = (distance / radius) * 100;
                    const lightness = 50; // Default lightness

                    if (distance <= radius) {
                        const pixelIndex = (y * width + x) * 4;
                        const [r, g, b] = hslToRgb(hue / 360, saturation / 100, lightness / 100);
                        imageData.data[pixelIndex] = r;
                        imageData.data[pixelIndex + 1] = g;
                        imageData.data[pixelIndex + 2] = b;
                        imageData.data[pixelIndex + 3] = 255;
                    }
                }
            }
            ctx.putImageData(imageData, 0, 0);
        }

        // HSL to RGB conversion
        function hslToRgb(h, s, l) {
            let r, g, b;
            if (s === 0) {
                r = g = b = l;
            } else {
                const hue2rgb = (p, q, t) => {
                    if (t < 0) t += 1;
                    if (t > 1) t -= 1;
                    if (t < 1 / 6) return p + (q - p) * 6 * t;
                    if (t < 1 / 2) return q;
                    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
                    return p;
                };
                const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
                const p = 2 * l - q;
                r = hue2rgb(p, q, h + 1 / 3);
                g = hue2rgb(p, q, h);
                b = hue2rgb(p, q, h - 1 / 3);
            }
            return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
        }

        // Draw the color wheel once
        drawColorWheel();

        // Copy off-screen canvas to all color wheels
        document.querySelectorAll('.color-wheel').forEach(canvas => {
            const ctx = canvas.getContext('2d');
            ctx.drawImage(offscreenCanvas, 0, 0, canvas.width, canvas.height);
        });

        // Initialize brush preview sizes and slider labels
        document.querySelectorAll('.brush').forEach(brush => {
            const brushIndex = brush.dataset.brush;
            const brushSize = document.getElementById(`brush-size-${brushIndex}`);
            const lightnessSlider = document.getElementById(`lightness-${brushIndex}`);
            updateBrushPreviewSize(brushIndex, brushSize.value);
            updateSliderLabel(`brush-size-${brushIndex}`, `brush-size-label-${brushIndex}`, 'Width', brushSize.value);
            updateSliderLabel(`lightness-${brushIndex}`, `lightness-label-${brushIndex}`, 'Lightness', lightnessSlider.value);
        });

        // Initialize eraser slider label
        updateSliderLabel('eraser-size', 'eraser-size-label', 'Width', document.getElementById('eraser-size').value);


        // File Dropdown
        const fileBtn = document.getElementById('file-btn');
        const fileDropdown = document.getElementById('file-dropdown');
        fileBtn.addEventListener('click', () => {
            fileDropdown.classList.toggle('show');
            const rect = fileBtn.getBoundingClientRect();
            fileDropdown.style.top = `${rect.top}px`;
        });
        fileDropdown.addEventListener('click', (e) => {
            fileDropdown.classList.toggle('show');
        });


        // Tree Panel
        const treeBtn = document.getElementById('tree-btn');
        const treePanelDom = document.getElementById('tree-panel');
        const collapseBtn = treePanelDom.querySelector('.collapse-btn');
        treeBtn.addEventListener('click', () => {
            treePanelDom.classList.toggle('show');
        });
        collapseBtn.addEventListener('click', () => {
            treePanelDom.classList.remove('show');
        });

        // Tool Buttons (Brush, Eraser, Lasso, Image, Markdown, Setting, Mode)

        const toolButtons = [
            ...document.querySelectorAll('.brush'),
            document.getElementById('eraser-btn'),
            document.getElementById('lasso-btn'),
            document.getElementById('image-btn'),
            document.getElementById('markdown-btn'),
            document.getElementById('setting-btn'),
            document.getElementById('mode-btn')
        ];
        selectedTool = null;

        // Brush Buttons
        const brushes = document.querySelectorAll('.brush');
        brushes.forEach((brush, index) => {
            const brushIndex = brush.dataset.brush;
            const configPanel = document.getElementById(`brush-config-${brushIndex}`);
            const colorWheel = configPanel.querySelector('.color-wheel');
            const brushSize = document.getElementById(`brush-size-${brushIndex}`);
            const lightnessSlider = document.getElementById(`lightness-${brushIndex}`);
            const uiButton = uiButtons.find(btn => btn.id === `brush-${brushIndex}`);

            brush.addEventListener('click', (e) => {
                const rect = brush.getBoundingClientRect();
                if (selectedTool === brush) {
                    configPanel.classList.toggle('show');
                    configPanel.style.top = `${rect.top}px`;
                } else {
                    toolButtons.forEach(b => {
                        b.classList.remove('active');
                        if (b.classList.contains('brush')) {
                            document.getElementById(`brush-config-${b.dataset.brush}`).classList.remove('show');
                        } else if (b.id === 'eraser-btn') {
                            document.getElementById('eraser-config').classList.remove('show');
                        } else if (b.id === 'mode-btn') {
                            document.getElementById('mode-dropdown').classList.remove('show');
                        }
                    });
                    brush.classList.add('active');
                    selectedTool = brush;
                    configPanel.classList.remove('show');
                    uiButton.on_choose({ color: brush.dataset.color, width: parseInt(brushSize.value) });
                }
            });

            colorWheel.addEventListener('click', (e) => {
                const rect = colorWheel.getBoundingClientRect();
                const x = e.clientX - rect.left - rect.width / 2;
                const y = e.clientY - rect.top - rect.height / 2;
                const distance = Math.sqrt(x * x + y * y);
                const angle = Math.atan2(y, x) * 180 / Math.PI + 180;
                const hue = angle / 360;
                const saturation = Math.min(distance / (rect.width / 2), 1);
                const lightness = lightnessSlider.value / 100;
                const color = `hsl(${hue * 360}, ${saturation * 100}%, ${lightness * 100}%)`;
                brush.dataset.color = color;
                brush.querySelector('.brush-preview').style.backgroundColor = color;
                uiButton.on_config({ color, width: parseInt(brushSize.value) });
            });

            brushSize.addEventListener('input', () => {
                const color = brush.dataset.color;
                const width = parseInt(brushSize.value);
                updateBrushPreviewSize(brushIndex, width);
                updateSliderLabel(`brush-size-${brushIndex}`, `brush-size-label-${brushIndex}`, 'Width', width);
                uiButton.on_config({ color, width });
            });

            lightnessSlider.addEventListener('input', () => {
                const hue = parseFloat(brush.dataset.color.match(/hsl\((\d+)/)?.[1] || 0) / 360;
                const saturation = parseFloat(brush.dataset.color.match(/, (\d+)%/)?.[1] || 100) / 100;
                const lightness = lightnessSlider.value / 100;
                const color = `hsl(${hue * 360}, ${saturation * 100}%, ${lightness * 100}%)`;
                brush.dataset.color = color;
                brush.querySelector('.brush-preview').style.backgroundColor = color;
                updateSliderLabel(`lightness-${brushIndex}`, `lightness-label-${brushIndex}`, 'Lightness', lightnessSlider.value);
                uiButton.on_config({ color, width: parseInt(brushSize.value) });
            });
        });

        // Eraser
        const eraserBtn = document.getElementById('eraser-btn');
        const eraserConfig = document.getElementById('eraser-config');
        const eraserSize = document.getElementById('eraser-size');
        const eraserUIButton = uiButtons.find(btn => btn.id === 'eraser');
        eraserBtn.addEventListener('click', () => {
            const rect = eraserBtn.getBoundingClientRect();
            if (selectedTool === eraserBtn) {
                eraserConfig.classList.toggle('show');
                eraserConfig.style.top = `${rect.top}px`;
            } else {
                toolButtons.forEach(b => {
                    b.classList.remove('active');
                    if (b.classList.contains('brush')) {
                        document.getElementById(`brush-config-${b.dataset.brush}`).classList.remove('show');
                    } else if (b.id === 'eraser-btn') {
                        document.getElementById('eraser-config').classList.remove('show');
                    } else if (b.id === 'mode-btn') {
                        document.getElementById('mode-dropdown').classList.remove('show');
                    }
                });
                eraserBtn.classList.add('active');
                selectedTool = eraserBtn;
                eraserConfig.classList.remove('show');
                eraserUIButton.on_choose({ width: parseInt(eraserSize.value) });
            }
        });

        eraserSize.addEventListener('input', () => {
            const width = parseInt(eraserSize.value);
            updateSliderLabel('eraser-size', 'eraser-size-label', 'Width', width);
            eraserUIButton.on_config({ width });
        });

        // Lasso
        const lassoBtn = document.getElementById('lasso-btn');
        const lassoUIButton = uiButtons.find(btn => btn.id === 'lasso');
        lassoBtn.addEventListener('click', () => {
            toolButtons.forEach(b => {
                b.classList.remove('active');
                if (b.classList.contains('brush')) {
                    document.getElementById(`brush-config-${b.dataset.brush}`).classList.remove('show');
                } else if (b.id === 'eraser-btn') {
                    document.getElementById('eraser-config').classList.remove('show');
                } else if (b.id === 'mode-btn') {
                    document.getElementById('mode-dropdown').classList.remove('show');
                }
            });
            lassoBtn.classList.add('active');
            selectedTool = lassoBtn;
            lassoUIButton.on_choose(null);
        });

        // Insert Image
        const imageBtn = document.getElementById('image-btn');
        const imageUIButton = uiButtons.find(btn => btn.id === 'image');
        imageBtn.addEventListener('click', () => {
            toolButtons.forEach(b => {
                b.classList.remove('active');
                if (b.classList.contains('brush')) {
                    document.getElementById(`brush-config-${b.dataset.brush}`).classList.remove('show');
                } else if (b.id === 'eraser-btn') {
                    document.getElementById('eraser-config').classList.remove('show');
                } else if (b.id === 'mode-btn') {
                    document.getElementById('mode-dropdown').classList.remove('show');
                }
            });
            imageBtn.classList.add('active');
            selectedTool = imageBtn;
            imageUIButton.on_choose(null);
        });

        // Insert Markdown
        const markdownBtn = document.getElementById('markdown-btn');
        const markdownUIButton = uiButtons.find(btn => btn.id === 'markdown');
        markdownBtn.addEventListener('click', () => {
            toolButtons.forEach(b => {
                b.classList.remove('active');
                if (b.classList.contains('brush')) {
                    document.getElementById(`brush-config-${b.dataset.brush}`).classList.remove('show');
                } else if (b.id === 'eraser-btn') {
                    document.getElementById('eraser-config').classList.remove('show');
                } else if (b.id === 'mode-btn') {
                    document.getElementById('mode-dropdown').classList.remove('show');
                }
            });
            markdownBtn.classList.add('active');
            selectedTool = markdownBtn;
            markdownUIButton.on_choose(null);
        });

        // Setting
        const settingBtn = document.getElementById('setting-btn');
        const settingUIButton = uiButtons.find(btn => btn.id === 'setting');
        settingBtn.addEventListener('click', () => {
            toolButtons.forEach(b => {
                b.classList.remove('active');
                if (b.classList.contains('brush')) {
                    document.getElementById(`brush-config-${b.dataset.brush}`).classList.remove('show');
                } else if (b.id === 'eraser-btn') {
                    document.getElementById('eraser-config').classList.remove('show');
                } else if (b.id === 'mode-btn') {
                    document.getElementById('mode-dropdown').classList.remove('show');
                }
            });
            settingBtn.classList.add('active');
            selectedTool = settingBtn;
            settingUIButton.on_choose(null);
        });

        // Mode Dropdown
        const modeBtn = document.getElementById('mode-btn');
        const modeDropdown = document.getElementById('mode-dropdown');
        const modeUIButton = uiButtons.find(btn => btn.id === 'mode');
        modeBtn.addEventListener('click', () => {
            toolButtons.forEach(b => {
                b.classList.remove('active');
                if (b.classList.contains('brush')) {
                    document.getElementById(`brush-config-${b.dataset.brush}`).classList.remove('show');
                } else if (b.id === 'eraser-btn') {
                    document.getElementById('eraser-config').classList.remove('show');
                }
            });
            modeBtn.classList.add('active');
            selectedTool = modeBtn;
            modeDropdown.classList.toggle('show');
            const rect = modeBtn.getBoundingClientRect();
            modeDropdown.style.top = `${rect.top}px`;
            modeUIButton.on_choose(null);
        });

        // Close dropdowns and panels when clicking outside
        document.addEventListener('click', (e) => {
            if (!fileBtn.contains(e.target) && !fileDropdown.contains(e.target)) {
                fileDropdown.classList.remove('show');
            }
            if (!modeBtn.contains(e.target) && !modeDropdown.contains(e.target)) {
                modeDropdown.classList.remove('show');
            }
            if (!eraserBtn.contains(e.target) && !eraserConfig.contains(e.target)) {
                eraserConfig.classList.remove('show');
            }
            brushes.forEach((b) => {
                const configPanel = document.getElementById(`brush-config-${b.dataset.brush}`);
                if (!b.contains(e.target) && !configPanel.contains(e.target)) {
                    configPanel.classList.remove('show');
                }
            });
        });
    }

    // Initialize brushes function
    function init_brushes(configs) {
        configs.forEach((config, index) => {
            const brushIndex = index + 1;
            const brush = document.querySelector(`.brush[data-brush="${brushIndex}"]`);

            const brushSize = document.getElementById(`brush-size-${brushIndex}`);
            const lightnessSlider = document.getElementById(`lightness-${brushIndex}`);

            const brushSizeLabel = document.getElementById(`brush-size-label-${brushIndex}`);
            const lightnessLabel = document.getElementById(`lightness-label-${brushIndex}`);


            const color_str = `hsl(${config.color[0]},${config.color[1]}%,${config.color[2]}%)`;


            if (brush && config.color) {
                brush.dataset.color = color_str;
                brush.querySelector('.brush-preview').style.backgroundColor = color_str;
            }

            if (brushSize && config.width) {
                brushSize.value = config.width;
                updateBrushPreviewSize(brushIndex, config.width);
                brushSizeLabel.innerText = "Width: " + config.width;
            }

            if (lightnessSlider && config.color[2] !== undefined) {
                lightnessSlider.value = config.color[2];
                updateSliderLabel(`lightness-${brushIndex}`, `lightness-label-${brushIndex}`, "Lightness", config.color[2]);

            }
        });
    }

    function init_dom() {
        var html_content = `
            <button id = "file-btn" title = "File" > <i class="fas fa-file"></i></button>
        <div class="dropdown" id="file-dropdown">
            <div onclick="notebook.toolbar.events.new_file()"><i class="fas fa-file"></i> New</div>
            <div onclick="notebook.toolbar.events.open_file()"><i class="fas fa-folder-open"></i> Open</div>
            <div onclick="notebook.toolbar.events.save_file()"><i class="fas fa-save"></i> Save</div>
            <div onclick="notebook.toolbar.events.open_folder()"><i class="fas fa-folder"></i> Open Folder</div>
        </div>
        <button id="tree-btn" title="Tree"><i class="fas fa-sitemap"></i></button>
        <div class="tree-panel" id="tree-panel">
            <button class="collapse-btn"><i class="fas fa-times"></i></button>
            <div id="file-info"></div>
            <div id="tree-content"></div>
        </div>
        <button id="setting-btn" data-brush="setting" title="Setting" style="display: none;">
            <i class="fas fa-gear"></i>
        </button>
        <button id="mode-btn" data-brush="mode" title="Mode" style="display:none"><i class="fas fa-tools"></i></button>
        <div class="dropdown" id="mode-dropdown">
            <div onclick="notebook.toolbar.events.set_mode('page')"><i class="fas fa-file"></i> Page Mode</div>
            <div onclick="notebook.toolbar.events.set_mode('board')"><i class="fas fa-folder-open"></i> Board Mode</div>
            <div onclick="notebook.toolbar.events.set_mode('document')"><i class="fas fa-save"></i> Document Mode</div>
        </div>
        <div class="divider"></div>
        <button class="brush" data-brush="1" title="Brush 1"><span class="brush-preview"></span></button>
        <div class="config-panel" id="brush-config-1">
            <canvas class="color-wheel" data-brush="1"></canvas>
            <div class="slider-container">
                <input type="range" class="slider" data-brush="1" id="brush-size-1" min="1" max="10" value="5">
                <span class="slider-label" id="brush-size-label-1">Width: 5</span>
            </div>
            <div class="slider-container">
                <input type="range" class="slider" data-brush="1" id="lightness-1" min="0" max="100" value="50">
                <span class="slider-label" id="lightness-label-1">Lightness: 50</span>
            </div>
        </div>
        <button class="brush" data-brush="2" title="Brush 2"><span class="brush-preview"></span></button>
        <div class="config-panel" id="brush-config-2">
            <canvas class="color-wheel" data-brush="2"></canvas>
            <div class="slider-container">
                <input type="range" class="slider" data-brush="2" id="brush-size-2" min="1" max="10" value="5">
                <span class="slider-label" id="brush-size-label-2">Width: 5</span>
            </div>
            <div class="slider-container">
                <input type="range" class="slider" data-brush="2" id="lightness-2" min="0" max="100" value="50">
                <span class="slider-label" id="lightness-label-2">Lightness: 50</span>
            </div>
        </div>
        <button class="brush" data-brush="3" title="Brush 3"><span class="brush-preview"></span></button>
        <div class="config-panel" id="brush-config-3">
            <canvas class="color-wheel" data-brush="3"></canvas>
            <div class="slider-container">
                <input type="range" class="slider" data-brush="3" id="brush-size-3" min="1" max="10" value="5">
                <span class="slider-label" id="brush-size-label-3">Width: 5</span>
            </div>
            <div class="slider-container">
                <input type="range" class="slider" data-brush="3" id="lightness-3" min="0" max="100" value="50">
                <span class="slider-label" id="lightness-label-3">Lightness: 50</span>
            </div>
        </div>
        <button class="brush" data-brush="4" title="Brush 4"><span class="brush-preview"></span></button>
        <div class="config-panel" id="brush-config-4">
            <canvas class="color-wheel" data-brush="4"></canvas>
            <div class="slider-container">
                <input type="range" class="slider" data-brush="4" id="brush-size-4" min="1" max="10" value="5">
                <span class="slider-label" id="brush-size-label-4">Width: 5</span>
            </div>
            <div class="slider-container">
                <input type="range" class="slider" data-brush="4" id="lightness-4" min="0" max="100" value="50">
                <span class="slider-label" id="lightness-label-4">Lightness: 50</span>
            </div>
        </div>
        <button class="brush" data-brush="5" title="Brush 5"><span class="brush-preview"></span></button>
        <div class="config-panel" id="brush-config-5">
            <canvas class="color-wheel" data-brush="5"></canvas>
            <div class="slider-container">
                <input type="range" class="slider" data-brush="5" id="brush-size-5" min="1" max="10" value="5">
                <span class="slider-label" id="brush-size-label-5">Width: 5</span>
            </div>
            <div class="slider-container">
                <input type="range" class="slider" data-brush="5" id="lightness-5" min="0" max="100" value="50">
                <span class="slider-label" id="lightness-label-5">Lightness: 50</span>
            </div>
        </div>
        <button id="eraser-btn" data-brush="eraser" title="Eraser"><i class="fas fa-eraser"></i></button>
        <div class="config-panel" id="eraser-config">
            <div class="slider-container">
                <input type="range" class="slider" id="eraser-size" min="1" max="10" value="5">
                <span class="slider-label" id="eraser-size-label">Width: 5</span>
            </div>
        </div>
        <button id="lasso-btn" data-brush="lasso" title="Lasso"><i class="fas fa-draw-polygon"></i></button>
        <div class="divider"></div>
        <button id="image-btn" data-brush="image" title="Insert Image"><i class="fas fa-image"></i></button>
        <button id="markdown-btn" data-brush="markdown" title="Insert Markdown"><i class="fas fa-code"></i></button>
        `;
        var dom = document.createElement('div');
        dom.innerHTML = html_content;
        dom.classList.add('toolbar');

        document.body.appendChild(dom);
    }

    function init_toolbar() {
        init_dom();
        _init_toolbar();
        init_brushes([
            {
                color: [0, 0, 0],
                width: 3
            },
            {
                color: [233, 100, 35],
                width: 3
            },
            {
                color: [237, 49, 70],
                width: 3
            },
            {
                color: [112, 61, 70],
                width: 6
            },
            {
                color: [59, 43, 75],
                width: 6
            }
        ]);
        document.querySelectorAll('.brush')[0].click();
    }

    notebook.init_toolbar = init_toolbar;
    notebook.toolbar = {}
    notebook.toolbar.events = {
        open_file: async () => {
            if (notebook.canvas.objects.length) await notebook.file.save_file();
            await notebook.file.open_file();
            notebook.toolbar.manager.select_brush(0);
        },
        new_file: async () => {
            if (notebook.canvas.objects.length) await notebook.file.save_file();
            await notebook.file.new_file();
            notebook.toolbar.manager.select_brush(0);
        },
        save_file: notebook.file.save_file,
        open_folder: notebook.file.open_folder,
        set_mode(mode) { }
    }
    notebook.toolbar.manager = {
        select_brush(id) {
            selectedTool = null;
            document.querySelectorAll('.brush')[id].click();
        }
    }
})();