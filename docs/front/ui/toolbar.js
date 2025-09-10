(function () {

    notebook.toolbar = {};
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
        
        // Set eraser config values
        notebook.Env.eraser.stroke = document.getElementById('eraser-stroke').checked;
        notebook.Env.eraser.picture = document.getElementById('eraser-picture').checked;
        notebook.Env.eraser.markdown = document.getElementById('eraser-markdown').checked;
        notebook.Env.eraser.radius = obj.width * 2;
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

        new UIButton('image', 'image', async () => {
            const url=(await notebook.file.upload_picture());
            notebook.Env.current_pen['pen'] = 'image_creator';
            notebook.Env.image_creator.url = url;
            
        }),
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
        window.addEventListener('keydown',(e)=>{
            if(e.key=='s'&&e.ctrlKey){
                e.preventDefault();
                notebook.file.save_file();
                notebook.tree.update();
            }
        });

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

        // Eraser checkboxes
        const eraserStroke = document.getElementById('eraser-stroke');
        const eraserPicture = document.getElementById('eraser-picture');
        const eraserMarkdown = document.getElementById('eraser-markdown');

        eraserStroke.addEventListener('change', () => {
            if (!notebook.Env.eraser) {
                notebook.Env.eraser = {};
            }
            notebook.Env.eraser.stroke = eraserStroke.checked;
        });

        eraserPicture.addEventListener('change', () => {
            if (!notebook.Env.eraser) {
                notebook.Env.eraser = {};
            }
            notebook.Env.eraser.picture = eraserPicture.checked;
        });

        eraserMarkdown.addEventListener('change', () => {
            if (!notebook.Env.eraser) {
                notebook.Env.eraser = {};
            }
            notebook.Env.eraser.markdown = eraserMarkdown.checked;
        });

        // Lasso
        const lassoBtn = document.getElementById('lasso-btn');
        const lassoUIButton = uiButtons.find(btn => btn.id === 'lasso');
        lassoBtn.addEventListener('click', () => {
            toolButtons.forEach(b => {
                if (!b.classList.contains('brush')) {
                    b.classList.remove('active');
                    if (b.id === 'eraser-btn') {
                        document.getElementById('eraser-config').classList.remove('show');
                    } else if (b.id === 'mode-btn') {
                        document.getElementById('mode-dropdown').classList.remove('show');
                    }
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
                if (!b.classList.contains('brush')) {
                    b.classList.remove('active');
                    if (b.id === 'eraser-btn') {
                        document.getElementById('eraser-config').classList.remove('show');
                    } else if (b.id === 'mode-btn') {
                        document.getElementById('mode-dropdown').classList.remove('show');
                    }
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
                if (!b.classList.contains('brush')) {
                    b.classList.remove('active');
                    if (b.id === 'eraser-btn') {
                        document.getElementById('eraser-config').classList.remove('show');
                    } else if (b.id === 'mode-btn') {
                        document.getElementById('mode-dropdown').classList.remove('show');
                    }
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
                if (!b.classList.contains('brush')) {
                    b.classList.remove('active');
                    if (b.id === 'eraser-btn') {
                        document.getElementById('eraser-config').classList.remove('show');
                    } else if (b.id === 'mode-btn') {
                        document.getElementById('mode-dropdown').classList.remove('show');
                    }
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
                if (!b.classList.contains('brush')) {
                    b.classList.remove('active');
                    if (b.id === 'eraser-btn') {
                        document.getElementById('eraser-config').classList.remove('show');
                    }
                }
            });
            modeBtn.classList.add('active');
            selectedTool = modeBtn;
            modeDropdown.classList.toggle('show');
            const rect = modeBtn.getBoundingClientRect();
            modeDropdown.style.top = `${rect.top}px`;
            modeUIButton.on_choose(null);
        });

        // Save Button
        const saveBtn = document.getElementById('save-btn');
        saveBtn.addEventListener('click', () => {
            notebook.file.save_file();
        });

        // SetScale Button
        const setscaleBtn = document.getElementById('setscale-btn');
        setscaleBtn.addEventListener('click', () => {
            if (notebook.canvas) {
                if(notebook.canvas.scale==1)return;
                var scale_loop=setInterval(()=>{
                    if(Math.abs(notebook.canvas.scale-1)<0.01){
                        clearInterval(scale_loop);
                        notebook.canvas.set_cale(1/notebook.canvas.scale);
                    }
                    notebook.canvas.set_scale(1+0.1*Math.sign(1-notebook.canvas.scale));
                },10);
            }
        });

        // Close dropdowns and panels when clicking outside
        document.addEventListener('click', (e) => {
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


    notebook.toolbar.manager = {
        get_brush(){
            // Find the currently active brush (if any)
            const activeBrush = document.querySelector('.brush.active');
            if (activeBrush) {
                return parseInt(activeBrush.dataset.brush) - 1;
            }
            // If no brush is active, return the first brush (default)
            return 0;
        },
        get_brush_style(id){
            const brush = document.querySelectorAll('.brush')[id];
            const color = brush.dataset.color;
            const width = document.getElementById(`brush-size-${id + 1}`).value;
            const dash = [];
            return {
                color,
                width,
                dash
            }
        },
        select_brush(id) {
            selectedTool = null;
            document.querySelectorAll('.brush')[id].click();
        },
        save() {
            const configs = [];
            document.querySelectorAll('.brush').forEach((brush, index) => {
                const brushIndex = index + 1;
                const brushSize = document.getElementById(`brush-size-${brushIndex}`);
                const color = brush.dataset.color;

                // Parse HSL color string to extract h, s, l values
                const hslMatch = color.match(/hsl\(([\d.]+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
                console.log(color);
                let hslColor = [0, 0, 0];
                if (hslMatch) {
                    hslColor = [
                        parseInt(hslMatch[1]),
                        parseInt(hslMatch[2]),
                        parseInt(hslMatch[3])
                    ];
                }

                configs.push({
                    color: hslColor,
                    width: parseInt(brushSize.value),
                    dash:[]
                });
            });
            return configs;
        },

        load(configs) {
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
    }


    function init_toolbar() {
        _init_toolbar();
        notebook.toolbar.manager.load([
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
})();