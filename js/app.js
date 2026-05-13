document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Essential Engine State
    hljs.highlightAll();
    window.viewMode = 'optimized';
    window.digitalTwinData = Array.from({length: 6}, (_, i) => ({
        id: i + 1, temp: 22 + Math.random() * 3, energy: 150 + Math.random() * 40, occupancy: Math.random() > 0.6
    }));

    // 2. Asset Loading (3ds Max & Rooms)
    const bgImage = new Image();
    bgImage.src = 'assets/3dsmax_render.png';
    let bgLoaded = false;
    bgImage.onload = () => { bgLoaded = true; };

    const spaceData = [
        { name: "Living Room", img: 'assets/room_01_living.png', stats: {light:92, air:88} },
        { name: "Kitchen", img: 'assets/room_02_kitchen.png', stats: {light:85, air:94} },
        { name: "Bedroom", img: 'assets/room_03_bedroom.png', stats: {light:78, air:96} },
        { name: "Bathroom", img: 'assets/room_04_bathroom.png', stats: {light:80, air:90} }
    ];

    // --- Dynamic Climate Data Integration (Seoul Focused) ---
    async function updateClimateDashboard() {
        try {
            const response = await fetch('climate_build_spec.json');
            if (!response.ok) throw new Error('Climate spec not found');
            const data = await response.json();

            const elements = {
                'current-city': data.city ? data.city.toUpperCase() : 'SEOUL',
                'insulation-val': data.physics_metrics.insulation_thickness_mm + 'mm',
                'ceiling-height-val': data.physics_metrics.ceiling_height_mm + 'mm',
                'topography-val': data.physics_metrics.topography_focus.replace(/_/g, ' '),
                'shading-val': data.physics_metrics.overhang_depth_mm + 'mm',
                'wwr-val': (data.physics_metrics.window_to_wall_ratio * 100) + '%',
                'hvac-val': data.physics_metrics.hvac_priority.replace(/_/g, ' ')
            };

            for (const [id, value] of Object.entries(elements)) {
                const el = document.getElementById(id);
                if (el) el.innerText = value;
            }

            // Sync Hillside Visuals
            const slopeEl = document.querySelector('.slope-line');
            if (slopeEl) slopeEl.style.transform = 'rotate(-15deg)'; // Seoul Hillside Mode
        } catch (error) {
            console.log("Waiting for Seoul climate data...");
        }
    }
    updateClimateDashboard();

    // --- AI Optimization Heatmap (View Analysis) ---
    const optCanvas = document.getElementById('optCanvas');
    if (optCanvas) {
        const octx = optCanvas.getContext('2d');
        function drawHeatmap() {
            octx.clearRect(0,0,optCanvas.width, optCanvas.height);
            octx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
            octx.lineWidth = 1;
            // View Analysis Rays (Namsan Direction)
            const cx = optCanvas.width/2, cy = optCanvas.height/2;
            for(let a = -30; a <= 30; a += 5) {
                const rad = (a - 90) * Math.PI / 180;
                octx.beginPath(); octx.moveTo(cx, cy);
                octx.lineTo(cx + Math.cos(rad)*250, cy + Math.sin(rad)*250);
                octx.stroke();
            }
            requestAnimationFrame(drawHeatmap);
        }
        drawHeatmap();
    }

    // 3. High-Definition 3D Dashboard Engine
    const canvas3D = document.getElementById('canvas3D');
    if (canvas3D) {
        const ctx3D = canvas3D.getContext('2d');
        const dpr = window.devicePixelRatio || 2;
        const upscale = 2; 
        let angle3D = 0;

        function setupCanvas() {
            const rect = canvas3D.getBoundingClientRect();
            canvas3D.width = rect.width * dpr * upscale;
            canvas3D.height = rect.height * dpr * upscale;
            ctx3D.setTransform(1,0,0,1,0,0);
            ctx3D.scale(dpr * upscale, dpr * upscale);
        }
        setupCanvas();
        window.addEventListener('resize', setupCanvas);

        function project(x, y, z, cx, cy, scale) {
            const rotX = x * Math.cos(angle3D) - z * Math.sin(angle3D);
            const rotZ = x * Math.sin(angle3D) + z * Math.cos(angle3D);
            const perspective = 1000 / (1000 + rotZ);
            return { x: cx + rotX * scale * perspective, y: cy + (y * scale - rotZ * 0.3) * perspective };
        }

        function draw3D() {
            const w = canvas3D.width / (dpr * upscale), h = canvas3D.height / (dpr * upscale);
            ctx3D.clearRect(0,0,w,h);
            if (bgLoaded) {
                ctx3D.drawImage(bgImage, 0, 0, w, h);
                ctx3D.fillStyle = 'rgba(15, 23, 42, 0.4)'; ctx3D.fillRect(0,0,w,h);
            } else {
                ctx3D.fillStyle = '#020617'; ctx3D.fillRect(0,0,w,h);
            }
            const cx = w/2, cy = h/2;
            const isComplex = window.viewMode === 'complex';
            if (isComplex) {
                for(let i=0; i<6; i++) {
                    const row = Math.floor(i/3), col = i % 3;
                    const ox = (col-1)*160, oz = (row-0.5)*200, oy = row*60;
                    const color = window.digitalTwinData[i].temp > 24 ? '#ef4444' : '#06b6d4';
                    ctx3D.strokeStyle = color; ctx3D.lineWidth = 1.5;
                    const cube = [[-50+ox,-30+oy,-40+oz],[50+ox,-30+oy,-40+oz],[50+ox,30+oy,-40+oz],[-50+ox,30+oy,-40+oz],[-50+ox,-30+oy,40+oz],[50+ox,-30+oy,40+oz],[50+ox,30+oy,40+oz],[-50+ox,-30+oy,40+oz]];
                    const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
                    edges.forEach(e => {
                        const p1 = project(...cube[e[0]], cx, cy, 2.5), p2 = project(...cube[e[1]], cx, cy, 2.5);
                        ctx3D.beginPath(); ctx3D.moveTo(p1.x, p1.y); ctx3D.lineTo(p2.x, p2.y); ctx3D.stroke();
                    });
                }
            } else {
                ctx3D.strokeStyle = '#a855f7'; ctx3D.lineWidth = 2;
                const cube = [[-100,-60,-80],[100,-60,-80],[100,60,-80],[-100,60,-80],[-100,-60,80],[100,-60,80],[100,60,80],[-100,-60,80]];
                const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
                edges.forEach(e => {
                    const p1 = project(...cube[e[0]], cx, cy, 3), p2 = project(...cube[e[1]], cx, cy, 3);
                    ctx3D.beginPath(); ctx3D.moveTo(p1.x, p1.y); ctx3D.lineTo(p2.x, p2.y); ctx3D.stroke();
                });
            }
            angle3D += 0.003;
            requestAnimationFrame(draw3D);
        }
        draw3D();
    }

    // --- Space Visualization Engine ---
    const spaceCanvas = document.getElementById('spaceCanvas');
    if (spaceCanvas) {
        const sc = spaceCanvas.getContext('2d');
        window.currentSpace = 0;
        window.setSpace = (idx) => {
            window.currentSpace = idx;
            document.getElementById('space-main-img').src = spaceData[idx].img;
            updateSpaceTabs();
        };
        function updateSpaceTabs() {
            const container = document.getElementById('space-tabs-ui');
            if (!container) return;
            let html = '';
            spaceData.forEach((s, i) => html += `<button class="room-tab ${window.currentSpace === i ? 'active' : ''}" onclick="setSpace(${i})">${s.name}</button>`);
            container.innerHTML = html;
        }
        updateSpaceTabs();
        function drawSpaceFX() {
            sc.clearRect(0, 0, spaceCanvas.width, spaceCanvas.height);
            sc.strokeStyle = 'rgba(6, 182, 212, 0.05)';
            for(let i=0; i<spaceCanvas.height; i+=5) {
                sc.beginPath(); sc.moveTo(0, i); sc.lineTo(spaceCanvas.width, i); sc.stroke();
            }
            requestAnimationFrame(drawSpaceFX);
        }
        drawSpaceFX();
    }
});
