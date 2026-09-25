<!-- Design System -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AEGIS_OS | Dashboard</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&amp;family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<style>
        @font-face {
            font-family: 'Monospaced';
            src: local('ui-monospace'), local('Cascadia Code'), local('Source Code Pro'), local('Menlo');
        }
        body {
            background-color: #0b1326;
            color: #dae2fd;
            overflow: hidden;
        }
        .glow-blue-500\/20 {
            text-shadow: 0 0 10px rgba(75, 142, 255, 0.2);
        }
        .terminal-scroll::-webkit-scrollbar {
            width: 4px;
        }
        .terminal-scroll::-webkit-scrollbar-track {
            background: #060e20;
        }
        .terminal-scroll::-webkit-scrollbar-thumb {
            background: #2d3449;
        }
        .scan-line {
            background: linear-gradient(to bottom, transparent, rgba(78, 222, 163, 0.05) 50%, transparent);
            background-size: 100% 4px;
        }
    </style>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "primary-fixed": "#d8e2ff",
                        "on-background": "#dae2fd",
                        "surface-dim": "#0b1326",
                        "on-tertiary": "#472a00",
                        "surface-variant": "#2d3449",
                        "on-primary": "#002e69",
                        "outline-variant": "#414755",
                        "inverse-primary": "#005bc1",
                        "surface-tint": "#adc6ff",
                        "secondary": "#4edea3",
                        "error": "#ffb4ab",
                        "surface-container": "#171f33",
                        "primary-container": "#4b8eff",
                        "secondary-fixed-dim": "#4edea3",
                        "surface-container-highest": "#2d3449",
                        "on-error": "#690005",
                        "inverse-surface": "#dae2fd",
                        "on-tertiary-fixed": "#2a1700",
                        "on-tertiary-container": "#3e2400",
                        "on-secondary": "#003824",
                        "inverse-on-surface": "#283044",
                        "primary": "#adc6ff",
                        "on-primary-container": "#00285c",
                        "surface": "#0b1326",
                        "surface-container-high": "#222a3d",
                        "on-surface-variant": "#c1c6d7",
                        "on-error-container": "#ffdad6",
                        "on-primary-fixed-variant": "#004493",
                        "secondary-fixed": "#6ffbbe",
                        "tertiary": "#ffb95f",
                        "surface-container-low": "#131b2e",
                        "tertiary-container": "#ca8100",
                        "tertiary-fixed": "#ffddb8",
                        "surface-bright": "#31394d",
                        "error-container": "#93000a",
                        "background": "#0b1326",
                        "tertiary-fixed-dim": "#ffb95f",
                        "primary-fixed-dim": "#adc6ff",
                        "on-surface": "#dae2fd",
                        "on-secondary-fixed-variant": "#005236",
                        "secondary-container": "#00a572",
                        "surface-container-lowest": "#060e20",
                        "on-tertiary-fixed-variant": "#653e00",
                        "on-secondary-container": "#00311f",
                        "outline": "#8b90a0",
                        "on-secondary-fixed": "#002113",
                        "on-primary-fixed": "#001a41"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.125rem",
                        "lg": "0.25rem",
                        "xl": "0.5rem",
                        "full": "0.75rem"
                    },
                    "fontFamily": {
                        "display-xl": ["Space Grotesk"],
                        "body-md": ["Inter"],
                        "h1-heading": ["Space Grotesk"],
                        "ui-label-sm": ["Inter"],
                        "terminal-text": ["Monospaced"]
                    }
                }
            }
        }
    </script>
</head>
<body class="bg-background text-on-background font-body-md text-body-md">
<!-- TopAppBar Shell -->
<header class="flex justify-between items-center px-6 h-14 w-full fixed top-0 z-[60] bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-[0_0_15px_rgba(0,122,255,0.05)]">
<div class="flex items-center gap-6">
<span class="text-blue-500 font-bold tracking-widest text-base font-['Space_Grotesk']">AEGIS_SYSTEM_CORE</span>
<div class="h-4 w-px bg-slate-800"></div>
<div class="flex items-center gap-4">
<span class="text-slate-400 py-4 font-['Space_Grotesk'] text-sm tracking-tight font-medium hover:text-blue-300 transition-colors cursor-pointer">Network</span>
<span class="text-slate-400 py-4 font-['Space_Grotesk'] text-sm tracking-tight font-medium hover:text-blue-300 transition-colors cursor-pointer">Threats</span>
<span class="text-blue-400 border-b-2 border-blue-500 py-4 font-['Space_Grotesk'] text-sm tracking-tight font-medium">Deployment</span>
</div>
</div>
<div class="flex items-center gap-4">
<div class="flex items-center gap-2 px-3 py-1 bg-secondary-container/10 border border-secondary/20 rounded">
<span class="material-symbols-outlined text-secondary text-xs" style="font-variation-settings: 'FILL' 1;">verified_user</span>
<span class="text-[10px] font-['Space_Grotesk'] font-bold text-secondary tracking-widest">SECURE CONNECTION</span>
</div>
<div class="flex items-center gap-2 px-3 py-1 bg-primary-container/10 border border-primary/20 rounded">
<span class="material-symbols-outlined text-primary text-xs">dns</span>
<span class="text-[10px] font-['Space_Grotesk'] font-bold text-primary tracking-widest">UBUNTU MODE ACTIVE</span>
</div>
<div class="h-4 w-px bg-slate-800 mx-2"></div>
<button class="text-slate-400 hover:text-blue-300 transition-colors"><span class="material-symbols-outlined">security</span></button>
<button class="text-slate-400 hover:text-blue-300 transition-colors relative">
<span class="material-symbols-outlined">notifications_active</span>
<span class="absolute top-0 right-0 w-2 h-2 bg-error rounded-full ring-2 ring-slate-950"></span>
</button>
<button class="bg-primary-container text-on-primary-container px-4 py-1.5 text-[11px] font-bold tracking-tighter uppercase font-['Space_Grotesk'] hover:opacity-90 active:scale-[0.99] transition-all">TERMINATE_ALL</button>
</div>
</header>
<!-- SideNavBar Shell -->
<aside class="flex flex-col h-screen fixed left-0 top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800 w-64 pt-14">
<div class="p-6">
<div class="flex items-center gap-3 mb-8">
<div class="w-10 h-10 bg-surface-container-highest border border-slate-700 flex items-center justify-center relative">
<img alt="Sentinel AI Node" class="w-full h-full object-cover" data-alt="abstract digital intelligence node with glowing blue circuits and symmetrical geometric patterns on dark background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCZAAtvBRamrJK3QYebQJM9Mhg7I8vzZYn3Pq873FK9jkgJYVrKsyLlM5g4SREMtv4zkGIkZrxIOWD_-ykm7WArExgBwkNOzGYsqU6vuWYknYl9Z4dSKUOhdfnOKcK0OCgLW15pSEXEBZSuPnf_zlTu2Yt97KWBMJB6EtHqQKZAY8r_X1iCk1wE7dNfQo40IkMQJBGTbsFzz74Hb0OwdXYPe30ZKkVoN4rb1FG-OPN6Q9r4piHvsS7fEN-dBlhkIs7jPR7gs3-Z04A"/>
<div class="absolute -bottom-1 -right-1 w-3 h-3 bg-secondary rounded-full border-2 border-slate-950"></div>
</div>
<div>
<h2 class="text-blue-500 font-black tracking-tighter text-lg glow-blue-500/20 font-['Space_Grotesk']">AEGIS_OS</h2>
<p class="text-[9px] text-slate-500 font-bold tracking-widest font-['Space_Grotesk']">VIGILANT_MODE</p>
</div>
</div>
<nav class="space-y-1">
<a class="text-slate-500 hover:text-slate-300 hover:bg-slate-900/50 flex items-center gap-3 px-6 py-4 transition-colors font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold -mx-6" href="#">
<span class="material-symbols-outlined">terminal</span> Debian
                </a>
<a class="text-blue-400 bg-blue-500/10 border-r-2 border-blue-500 flex items-center gap-3 px-6 py-4 font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold -mx-6" href="#">
<span class="material-symbols-outlined">dns</span> Ubuntu
                </a>
<a class="text-slate-500 hover:text-slate-300 hover:bg-slate-900/50 flex items-center gap-3 px-6 py-4 transition-colors font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold -mx-6" href="#">
<span class="material-symbols-outlined">settings_input_component</span> NixOS
                </a>
<a class="text-slate-500 hover:text-slate-300 hover:bg-slate-900/50 flex items-center gap-3 px-6 py-4 transition-colors font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold -mx-6" href="#">
<span class="material-symbols-outlined">account_tree</span> Orchestrator
                </a>
<a class="text-slate-500 hover:text-slate-300 hover:bg-slate-900/50 flex items-center gap-3 px-6 py-4 transition-colors font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold -mx-6" href="#">
<span class="material-symbols-outlined">settings</span> Settings
                </a>
</nav>
</div>
<div class="mt-auto p-6 border-t border-slate-800/50">
<button class="w-full bg-slate-900 border border-slate-800 text-blue-400 font-['Space_Grotesk'] text-[10px] font-bold tracking-widest py-3 mb-6 hover:border-blue-500 transition-all uppercase">
                INITIALIZE_NODE
            </button>
<div class="space-y-2">
<a class="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-[10px] font-bold tracking-widest font-['Space_Grotesk'] uppercase transition-colors" href="#">
<span class="material-symbols-outlined text-sm">description</span> Docs
                </a>
<a class="flex items-center gap-2 text-slate-500 hover:text-slate-300 text-[10px] font-bold tracking-widest font-['Space_Grotesk'] uppercase transition-colors" href="#">
<span class="material-symbols-outlined text-sm">history</span> Logs
                </a>
</div>
</div>
</aside>
<!-- Main Content Stage -->
<main class="ml-64 mt-14 h-[calc(100vh-3.5rem)] flex bg-surface-container-lowest">
<!-- Left Pane: AI Chat Interface -->
<section class="w-1/2 flex flex-col border-r border-slate-800/50">
<div class="h-12 border-b border-slate-800/50 flex items-center justify-between px-4 bg-slate-900/20">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-blue-500 text-sm">smart_toy</span>
<span class="font-['Space_Grotesk'] text-[11px] font-bold tracking-widest text-slate-300">AEGIS_CORE_AI</span>
</div>
<div class="flex items-center gap-1">
<span class="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
<span class="text-[9px] font-['Space_Grotesk'] text-secondary font-bold">READY</span>
</div>
</div>
<div class="flex-1 overflow-y-auto p-6 space-y-6">
<!-- User Message -->
<div class="flex flex-col items-end gap-2">
<div class="bg-surface-container-high border border-slate-700 p-4 max-w-[85%] rounded-lg">
<p class="text-sm font-['Inter'] leading-relaxed">Set up a FastAPI server with Docker support, PostgreSQL integration, and basic health check endpoints.</p>
</div>
<span class="text-[10px] text-slate-500 font-mono">09:42:15_UTC</span>
</div>
<!-- AI Message -->
<div class="flex flex-col items-start gap-2">
<div class="bg-primary-container/5 border border-primary/20 p-4 max-w-[85%] rounded-lg relative overflow-hidden">
<div class="scan-line absolute inset-0 pointer-events-none opacity-20"></div>
<p class="text-sm font-['Inter'] leading-relaxed mb-4">Understood. Initializing deployment sequence for <span class="text-blue-400 font-bold">FastAPI-Docker-Stack</span>. I will configure the environment, install dependencies, and spin up the container orchestrator.</p>
<div class="bg-slate-950 p-3 rounded border border-slate-800 font-['Monospaced'] text-xs text-blue-300 mb-2">
<span class="text-slate-500">// Task Breakdown</span><br/>
                            1. Generate main.py &amp; requirements.txt<br/>
                            2. Create Dockerfile &amp; docker-compose.yml<br/>
                            3. Initialize local PostgreSQL node<br/>
                            4. Verify system health
                        </div>
<p class="text-sm font-['Inter'] leading-relaxed italic text-slate-400">Deploying to Ubuntu environment...</p>
</div>
<span class="text-[10px] text-blue-400/70 font-mono">09:42:18_UTC</span>
</div>
</div>
<div class="p-6 bg-slate-950/50 border-t border-slate-800/50">
<div class="relative group">
<textarea class="w-full bg-slate-950 border border-slate-800 rounded-none p-4 text-sm font-['Inter'] focus:ring-1 focus:ring-blue-500 focus:border-blue-500 placeholder:text-slate-600 transition-all resize-none pr-12" placeholder="AWAITING COMMANDS..." rows="1"></textarea>
<button class="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 hover:text-blue-300">
<span class="material-symbols-outlined">send</span>
</button>
</div>
<div class="mt-3 flex gap-2">
<span class="px-2 py-0.5 border border-slate-800 text-[10px] text-slate-500 font-bold tracking-widest uppercase hover:border-blue-500/50 cursor-pointer">Quick_Deploy</span>
<span class="px-2 py-0.5 border border-slate-800 text-[10px] text-slate-500 font-bold tracking-widest uppercase hover:border-blue-500/50 cursor-pointer">Security_Audit</span>
<span class="px-2 py-0.5 border border-slate-800 text-[10px] text-slate-500 font-bold tracking-widest uppercase hover:border-blue-500/50 cursor-pointer">Log_Dump</span>
</div>
</div>
</section>
<!-- Right Pane: Terminal Output -->
<section class="w-1/2 flex flex-col bg-slate-950">
<div class="h-12 border-b border-slate-800/50 flex items-center justify-between px-4 bg-slate-900/40">
<div class="flex items-center gap-4">
<div class="flex items-center gap-2">
<span class="material-symbols-outlined text-secondary text-sm">terminal</span>
<span class="font-['Space_Grotesk'] text-[11px] font-bold tracking-widest text-slate-300">AGENT_ORCHESTRATOR</span>
</div>
<div class="flex items-center gap-1 px-2 py-0.5 bg-secondary/10 rounded">
<span class="text-[9px] font-['Space_Grotesk'] text-secondary font-bold uppercase">LIVE</span>
</div>
</div>
<div class="flex items-center gap-3">
<div class="text-[10px] font-['Monospaced'] text-slate-500 flex items-center gap-2">
<span class="material-symbols-outlined text-[14px]">memory</span> 42%
                        <span class="material-symbols-outlined text-[14px]">speed</span> 1.2 GB/s
                    </div>
<span class="material-symbols-outlined text-slate-600 cursor-pointer hover:text-white">close</span>
</div>
</div>
<div class="flex-1 overflow-y-auto p-4 terminal-scroll font-['Monospaced'] text-terminal-text leading-relaxed">
<div class="space-y-1">
<p class="text-slate-500">[09:42:18] <span class="text-secondary">INFO</span> Initializing Aegis Deployment Engine v2.4.0...</p>
<p class="text-slate-500">[09:42:19] <span class="text-secondary">INFO</span> Environment: Ubuntu 22.04 LTS (HVM)</p>
<p class="text-slate-500">[09:42:19] <span class="text-secondary">INFO</span> Target: /home/admin/deployments/fastapi_server</p>
<p class="text-blue-400">root@aegis-vm:~$ docker-compose up -d --build</p>
<p class="text-slate-400">Building fastapi_app...</p>
<p class="text-slate-500">Step 1/7 : FROM python:3.9-slim</p>
<p class="text-slate-500"> ---&gt; 88e93892805</p>
<p class="text-slate-500">Step 2/7 : WORKDIR /app</p>
<p class="text-slate-500"> ---&gt; Using cache</p>
<p class="text-slate-500">Step 3/7 : COPY requirements.txt .</p>
<p class="text-slate-500"> ---&gt; Using cache</p>
<p class="text-slate-400">Step 4/7 : RUN pip install --no-cache-dir -r requirements.txt</p>
<div class="my-2 bg-slate-900 border border-slate-800 p-2">
<p class="text-[11px] text-slate-500">Downloading fastapi-0.68.1... [OK]</p>
<p class="text-[11px] text-slate-500">Downloading uvicorn-0.15.0... [OK]</p>
<p class="text-[11px] text-slate-500">Downloading psycopg2-binary-2.9.1... [OK]</p>
<div class="w-full h-1 bg-slate-800 mt-2">
<div class="h-full bg-blue-500 w-[78%] animate-pulse"></div>
</div>
</div>
<p class="text-slate-400">Step 5/7 : COPY . .</p>
<p class="text-slate-500">[09:42:25] <span class="text-secondary">INFO</span> Container [postgres_db] healthy</p>
<p class="text-slate-500">[09:42:25] <span class="text-secondary">INFO</span> Container [fastapi_app] starting...</p>
<p class="text-secondary-fixed animate-pulse">_</p>
</div>
</div>
<!-- Terminal Footer / Environment Gauge -->
<div class="h-24 bg-surface-container-low border-t border-slate-800/50 p-4 flex items-center justify-between">
<div class="flex items-center gap-6">
<div class="flex flex-col gap-1">
<span class="text-[9px] font-bold text-slate-500 tracking-widest uppercase font-['Space_Grotesk']">Security Integrity</span>
<div class="flex items-center gap-1">
<div class="w-1.5 h-3 bg-secondary"></div>
<div class="w-1.5 h-3 bg-secondary"></div>
<div class="w-1.5 h-3 bg-secondary"></div>
<div class="w-1.5 h-3 bg-secondary/30"></div>
<div class="w-1.5 h-3 bg-secondary/30"></div>
<span class="ml-2 text-xs text-secondary font-mono">98.4%</span>
</div>
</div>
<div class="flex flex-col gap-1">
<span class="text-[9px] font-bold text-slate-500 tracking-widest uppercase font-['Space_Grotesk']">Threat Level</span>
<div class="flex items-center gap-1">
<div class="w-1.5 h-3 bg-error/20"></div>
<div class="w-1.5 h-3 bg-error/20"></div>
<span class="ml-2 text-xs text-error font-mono">LOW</span>
</div>
</div>
</div>
<div class="flex items-center gap-4">
<div class="text-right">
<p class="text-[10px] font-bold text-slate-400 font-['Space_Grotesk']">AEGIS_NODE_01</p>
<p class="text-[9px] font-mono text-slate-600">IP: 192.168.1.105</p>
</div>
<div class="w-10 h-10 border border-slate-800 flex items-center justify-center">
<span class="material-symbols-outlined text-blue-500 text-lg">router</span>
</div>
</div>
</div>
</section>
</main>
<!-- Floating Security Gauge (Optional Enhancement) -->
<div class="fixed bottom-6 right-6 w-48 h-48 pointer-events-none opacity-40 mix-blend-screen">
<svg class="w-full h-full" viewbox="0 0 100 100">
<circle class="text-slate-800" cx="50" cy="50" fill="none" r="45" stroke="currentColor" stroke-width="0.5"></circle>
<circle class="text-blue-500/20" cx="50" cy="50" fill="none" r="35" stroke="currentColor" stroke-dasharray="10 5" stroke-width="4"></circle>
<path class="text-secondary" d="M 50 5 A 45 45 0 0 1 95 50" fill="none" stroke="currentColor" stroke-width="1"></path>
<text class="fill-blue-400 font-['Space_Grotesk'] text-[8px] font-bold tracking-widest" text-anchor="middle" x="50" y="55">MONITORING</text>
</svg>
</div>
</body></html>

<!-- Aegis Dashboard -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&amp;family=Inter:wght@400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "primary-fixed": "#d8e2ff",
                        "on-background": "#dae2fd",
                        "surface-dim": "#0b1326",
                        "on-tertiary": "#472a00",
                        "surface-variant": "#2d3449",
                        "on-primary": "#002e69",
                        "outline-variant": "#414755",
                        "inverse-primary": "#005bc1",
                        "surface-tint": "#adc6ff",
                        "secondary": "#4edea3",
                        "error": "#ffb4ab",
                        "surface-container": "#171f33",
                        "primary-container": "#4b8eff",
                        "secondary-fixed-dim": "#4edea3",
                        "surface-container-highest": "#2d3449",
                        "on-error": "#690005",
                        "inverse-surface": "#dae2fd",
                        "on-tertiary-fixed": "#2a1700",
                        "on-tertiary-container": "#3e2400",
                        "on-secondary": "#003824",
                        "inverse-on-surface": "#283044",
                        "primary": "#adc6ff",
                        "on-primary-container": "#00285c",
                        "surface": "#0b1326",
                        "surface-container-high": "#222a3d",
                        "on-surface-variant": "#c1c6d7",
                        "on-error-container": "#ffdad6",
                        "on-primary-fixed-variant": "#004493",
                        "secondary-fixed": "#6ffbbe",
                        "tertiary": "#ffb95f",
                        "surface-container-low": "#131b2e",
                        "tertiary-container": "#ca8100",
                        "tertiary-fixed": "#ffddb8",
                        "surface-bright": "#31394d",
                        "error-container": "#93000a",
                        "background": "#0b1326",
                        "tertiary-fixed-dim": "#ffb95f",
                        "primary-fixed-dim": "#adc6ff",
                        "on-surface": "#dae2fd",
                        "on-secondary-fixed-variant": "#005236",
                        "secondary-container": "#00a572",
                        "surface-container-lowest": "#060e20",
                        "on-tertiary-fixed-variant": "#653e00",
                        "on-secondary-container": "#00311f",
                        "outline": "#8b90a0",
                        "on-secondary-fixed": "#002113",
                        "on-primary-fixed": "#001a41"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.125rem",
                        "lg": "0.25rem",
                        "xl": "0.5rem",
                        "full": "0.75rem"
                    },
                    "spacing": {
                        "component-gap-md": "16px",
                        "container-padding": "24px",
                        "component-gap-sm": "8px",
                        "gutter": "16px",
                        "unit": "4px"
                    },
                    "fontFamily": {
                        "display-xl": ["Space Grotesk"],
                        "body-md": ["Inter"],
                        "h1-heading": ["Space Grotesk"],
                        "ui-label-sm": ["Inter"],
                        "terminal-text": ["Monospace"]
                    },
                    "fontSize": {
                        "display-xl": ["40px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                        "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                        "h1-heading": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                        "ui-label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
                        "terminal-text": ["13px", {"lineHeight": "18px", "fontWeight": "400"}]
                    }
                },
            },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glow-blue-500\/20 {
            box-shadow: 0 0 20px rgba(0, 122, 255, 0.2);
        }
        .scan-line {
            background: linear-gradient(to bottom, transparent 50%, rgba(0, 165, 114, 0.1) 50%);
            background-size: 100% 4px;
        }
    </style>
</head>
<body class="bg-background text-on-background font-body-md selection:bg-primary-container selection:text-on-primary-container">
<!-- TopAppBar -->
<header class="flex justify-between items-center px-6 h-14 w-full fixed top-0 z-[60] bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-[0_0_15px_rgba(0,122,255,0.05)]">
<div class="flex items-center gap-8">
<span class="text-blue-500 font-bold tracking-widest text-base font-display-xl">AEGIS_SYSTEM_CORE</span>
<div class="hidden md:flex gap-6">
<a class="text-slate-400 py-4 font-ui-label-sm text-ui-label-sm hover:text-blue-300 transition-colors duration-200" href="#">Network</a>
<a class="text-slate-400 py-4 font-ui-label-sm text-ui-label-sm hover:text-blue-300 transition-colors duration-200" href="#">Threats</a>
<a class="text-blue-400 border-b-2 border-blue-500 py-4 font-ui-label-sm text-ui-label-sm" href="#">Deployment</a>
</div>
</div>
<div class="flex items-center gap-4">
<button class="px-4 py-1.5 border border-outline-variant text-ui-label-sm font-ui-label-sm hover:border-primary transition-colors">DEPLOY_AGENT</button>
<button class="px-4 py-1.5 bg-error-container text-on-error-container text-ui-label-sm font-ui-label-sm hover:bg-error transition-colors">TERMINATE_ALL</button>
<div class="flex gap-3 ml-4">
<span class="material-symbols-outlined text-slate-400 cursor-pointer hover:text-primary">security</span>
<span class="material-symbols-outlined text-slate-400 cursor-pointer hover:text-primary">notifications_active</span>
<img alt="Admin Node 01" class="w-6 h-6 rounded-full border border-slate-700" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC_Saeq-ENVOkl706Ddb1_1Msal4-t03O737Ze4gh-W6FbEdN9KD3Oyd-lX97Egoc6p8mCN-gBcPq1QcJiQw52gaXgVFVO7V5Uaw5ChKHnwihOBHo_HtJEhcFPLY8mSR6sXYsH4Lo7PVf5sy-6nPZ4SwGLROH7khz56Q30EWjOLeIggcggAFMSbCOaAYM9R4sRSSxeXhr7bJ8XjXqo4F3enAybJlnuPK1NJ9MTD7CmYYLsciC8Pb_Vil4ne6jV9rii3cC0y5FbcMyM"/>
</div>
</div>
</header>
<!-- SideNavBar -->
<nav class="flex flex-col h-screen fixed left-0 top-0 z-50 bg-slate-950/80 backdrop-blur-xl docked left-0 h-full w-64 border-r border-slate-800 border-r border-slate-800/50">
<div class="p-6 mb-4">
<div class="flex items-center gap-3">
<img alt="Sentinel AI Node" class="w-8 h-8 rounded border border-blue-500/50" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDiBGzltPqDHGvT2fLGaJvnclUl7m1G2YNSoKYal-KB9m87L56BqIZiZpDj6fJvlUOFYXISKqC7lD7C7y3Bs_DalA2YIxlHzMLQdPGaux-OUwyvbLla8P0VuUtsOw_L7m8whE-uOuYFkk3-cZ67o04QKvdA66zyCAF1oVIaaPMawC-5Nx89pA8SpFyxPUPr6NXHslXKLqwDGQTAiCQE1faYzsUXxoYpuazK14evzHF8S99LdYccpEcqfxh7jx2PXegaHUVjPh4nMPE"/>
<div>
<h2 class="text-blue-500 font-black tracking-tighter text-lg glow-blue-500/20 font-display-xl">AEGIS_OS</h2>
<p class="text-[10px] tracking-[0.2em] text-blue-400/70 font-bold">VIGILANT_MODE</p>
</div>
</div>
</div>
<div class="flex-1 overflow-y-auto">
<div class="px-3 mb-2 text-slate-600 font-['Space_Grotesk'] tracking-wider uppercase text-[10px] font-bold">CORE_INSTANCES</div>
<a class="text-blue-400 bg-blue-500/10 border-r-2 border-blue-500 flex items-center gap-3 px-6 py-4 font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold transition-colors" href="#">
<span class="material-symbols-outlined" data-icon="terminal">terminal</span>
<span>Debian</span>
</a>
<a class="text-slate-500 hover:text-slate-300 flex items-center gap-3 px-6 py-4 font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold transition-colors hover:bg-slate-900/50" href="#">
<span class="material-symbols-outlined" data-icon="dns">dns</span>
<span>Ubuntu</span>
</a>
<a class="text-slate-500 hover:text-slate-300 flex items-center gap-3 px-6 py-4 font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold transition-colors hover:bg-slate-900/50" href="#">
<span class="material-symbols-outlined" data-icon="settings_input_component">settings_input_component</span>
<span>NixOS</span>
</a>
<a class="text-slate-500 hover:text-slate-300 flex items-center gap-3 px-6 py-4 font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold transition-colors hover:bg-slate-900/50" href="#">
<span class="material-symbols-outlined" data-icon="account_tree">account_tree</span>
<span>Orchestrator</span>
</a>
<a class="text-slate-500 hover:text-slate-300 flex items-center gap-3 px-6 py-4 font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold transition-colors hover:bg-slate-900/50" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span>
<span>Settings</span>
</a>
</div>
<div class="mt-auto p-4 border-t border-slate-800/50 space-y-2">
<button class="w-full py-2 bg-blue-600 text-white font-['Space_Grotesk'] tracking-wider uppercase text-[10px] font-black hover:bg-blue-500 transition-all active:scale-95 duration-100 mb-4">INITIALIZE_NODE</button>
<a class="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-300 font-['Space_Grotesk'] tracking-wider uppercase text-[10px] font-bold" href="#">
<span class="material-symbols-outlined text-sm" data-icon="description">description</span>
<span>Docs</span>
</a>
<a class="flex items-center gap-3 px-4 py-2 text-slate-500 hover:text-slate-300 font-['Space_Grotesk'] tracking-wider uppercase text-[10px] font-bold" href="#">
<span class="material-symbols-outlined text-sm" data-icon="history">history</span>
<span>Logs</span>
</a>
</div>
</nav>
<!-- Main Content Stage -->
<main class="ml-64 mt-14 p-container-padding min-h-screen scan-line">
<div class="max-w-7xl mx-auto space-y-8">
<!-- Header Section -->
<div class="flex justify-between items-end">
<div>
<h1 class="font-h1-heading text-h1-heading text-on-background mb-2">Container Manager</h1>
<p class="text-outline font-body-md text-body-md max-w-xl">Centralized orchestration for core system nodes. Monitor resource allocation and runtime status across virtualized environments.</p>
</div>
<button class="px-6 py-2.5 bg-secondary-container text-on-secondary-container font-display-xl text-sm font-bold tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center gap-2">
<span class="material-symbols-outlined text-sm">power_settings_new</span>
                    INITIALIZE ALL NODES
                </button>
</div>
<!-- Bento Grid of System Modes -->
<div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
<!-- Debian - Active -->
<div class="bg-surface-container border border-primary/30 p-6 relative overflow-hidden group">
<div class="absolute top-0 right-0 p-3">
<span class="flex items-center gap-1.5 px-2 py-0.5 bg-secondary/10 text-secondary border border-secondary/20 text-[10px] font-bold uppercase tracking-tighter">
<span class="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                            ACTIVE_SAFE
                        </span>
</div>
<div class="mb-8">
<h3 class="font-display-xl text-xl text-primary mb-1">Debian</h3>
<p class="text-[10px] text-outline font-bold tracking-widest uppercase">System Core / Safe Mode</p>
</div>
<!-- Visual Gauge Placeholder -->
<div class="aspect-video bg-slate-950/50 border border-slate-800 mb-6 flex items-center justify-center relative">
<div class="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-transparent"></div>
<div class="text-center">
<span class="block font-display-xl text-4xl text-primary">0.42</span>
<span class="text-[10px] text-outline uppercase font-bold">LOAD_AVERAGE</span>
</div>
</div>
<div class="grid grid-cols-2 gap-4 mb-8">
<div class="space-y-1">
<span class="text-[10px] text-outline uppercase font-bold block">CPU_USAGE</span>
<div class="h-1.5 w-full bg-slate-900 overflow-hidden">
<div class="h-full bg-primary w-[14%]"></div>
</div>
<span class="text-xs font-terminal-text text-primary">14.2%</span>
</div>
<div class="space-y-1">
<span class="text-[10px] text-outline uppercase font-bold block">RAM_USAGE</span>
<div class="h-1.5 w-full bg-slate-900 overflow-hidden">
<div class="h-full bg-primary w-[38%]"></div>
</div>
<span class="text-xs font-terminal-text text-primary">3.1 / 8 GB</span>
</div>
</div>
<div class="flex items-center justify-between border-t border-slate-800 pt-6 mt-4">
<div class="space-y-0.5">
<span class="text-[10px] text-outline uppercase font-bold block">UPTIME</span>
<span class="text-sm font-terminal-text text-on-background">142:22:11</span>
</div>
<button class="px-4 py-2 border border-primary/40 text-primary text-xs font-bold uppercase tracking-widest hover:bg-primary/10 transition-colors">Open Terminal</button>
</div>
</div>
<!-- Ubuntu - Idle -->
<div class="bg-surface-container-low border border-slate-800 p-6 relative overflow-hidden group">
<div class="absolute top-0 right-0 p-3">
<span class="flex items-center gap-1.5 px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700 text-[10px] font-bold uppercase tracking-tighter">
<span class="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
                            DEV_IDLE
                        </span>
</div>
<div class="mb-8">
<h3 class="font-display-xl text-xl text-on-surface-variant mb-1">Ubuntu</h3>
<p class="text-[10px] text-outline font-bold tracking-widest uppercase">Toolchain / Dev Mode</p>
</div>
<div class="aspect-video bg-slate-950/20 border border-slate-800/50 mb-6 flex items-center justify-center">
<div class="text-center opacity-40">
<span class="block font-display-xl text-4xl text-outline">--</span>
<span class="text-[10px] text-outline uppercase font-bold">LOAD_AVERAGE</span>
</div>
</div>
<div class="grid grid-cols-2 gap-4 mb-8">
<div class="space-y-1">
<span class="text-[10px] text-outline uppercase font-bold block">CPU_USAGE</span>
<div class="h-1.5 w-full bg-slate-900 overflow-hidden">
<div class="h-full bg-slate-700 w-[2%]"></div>
</div>
<span class="text-xs font-terminal-text text-slate-500">0.8%</span>
</div>
<div class="space-y-1">
<span class="text-[10px] text-outline uppercase font-bold block">RAM_USAGE</span>
<div class="h-1.5 w-full bg-slate-900 overflow-hidden">
<div class="h-full bg-slate-700 w-[12%]"></div>
</div>
<span class="text-xs font-terminal-text text-slate-500">1.9 / 16 GB</span>
</div>
</div>
<div class="flex items-center justify-between border-t border-slate-800 pt-6 mt-4">
<div class="space-y-0.5">
<span class="text-[10px] text-outline uppercase font-bold block">UPTIME</span>
<span class="text-sm font-terminal-text text-slate-500">00:00:00</span>
</div>
<button class="px-4 py-2 border border-slate-700 text-slate-500 text-xs font-bold uppercase tracking-widest hover:border-outline hover:text-on-surface-variant transition-colors">Open Terminal</button>
</div>
</div>
<!-- NixOS - Standby -->
<div class="bg-surface-container-low border border-slate-800 p-6 relative overflow-hidden group">
<div class="absolute top-0 right-0 p-3">
<span class="flex items-center gap-1.5 px-2 py-0.5 bg-tertiary/10 text-tertiary border border-tertiary/20 text-[10px] font-bold uppercase tracking-tighter">
<span class="w-1.5 h-1.5 rounded-full bg-tertiary"></span>
                            STANDBY_DECLARATIVE
                        </span>
</div>
<div class="mb-8">
<h3 class="font-display-xl text-xl text-on-surface-variant mb-1">NixOS</h3>
<p class="text-[10px] text-outline font-bold tracking-widest uppercase">Infrastructure / Standby</p>
</div>
<div class="aspect-video bg-slate-950/20 border border-slate-800/50 mb-6 flex items-center justify-center">
<div class="text-center opacity-40">
<span class="block font-display-xl text-4xl text-outline">--</span>
<span class="text-[10px] text-outline uppercase font-bold">LOAD_AVERAGE</span>
</div>
</div>
<div class="grid grid-cols-2 gap-4 mb-8">
<div class="space-y-1">
<span class="text-[10px] text-outline uppercase font-bold block">CPU_USAGE</span>
<div class="h-1.5 w-full bg-slate-900 overflow-hidden">
<div class="h-full bg-slate-700 w-0"></div>
</div>
<span class="text-xs font-terminal-text text-slate-500">0.0%</span>
</div>
<div class="space-y-1">
<span class="text-[10px] text-outline uppercase font-bold block">RAM_USAGE</span>
<div class="h-1.5 w-full bg-slate-900 overflow-hidden">
<div class="h-full bg-slate-700 w-[5%]"></div>
</div>
<span class="text-xs font-terminal-text text-slate-500">0.4 / 32 GB</span>
</div>
</div>
<div class="flex items-center justify-between border-t border-slate-800 pt-6 mt-4">
<div class="space-y-0.5">
<span class="text-[10px] text-outline uppercase font-bold block">UPTIME</span>
<span class="text-sm font-terminal-text text-slate-500">00:00:00</span>
</div>
<button class="px-4 py-2 border border-slate-700 text-slate-500 text-xs font-bold uppercase tracking-widest hover:border-outline hover:text-on-surface-variant transition-colors">Open Terminal</button>
</div>
</div>
</div>
<!-- Global Status Pane -->
<div class="grid grid-cols-1 md:grid-cols-4 gap-gutter">
<div class="bg-surface-container-high p-4 border border-slate-800">
<span class="text-[10px] text-outline uppercase font-bold block mb-2">Total System Load</span>
<div class="flex items-end gap-2">
<span class="text-2xl font-display-xl text-primary">12.4%</span>
<span class="text-secondary text-xs font-terminal-text pb-1">▼ 2.1%</span>
</div>
</div>
<div class="bg-surface-container-high p-4 border border-slate-800">
<span class="text-[10px] text-outline uppercase font-bold block mb-2">Network Throughput</span>
<div class="flex items-end gap-2">
<span class="text-2xl font-display-xl text-on-background">482 Mb/s</span>
<span class="text-error text-xs font-terminal-text pb-1">▲ 4%</span>
</div>
</div>
<div class="bg-surface-container-high p-4 border border-slate-800">
<span class="text-[10px] text-outline uppercase font-bold block mb-2">Active Sessions</span>
<div class="flex items-end gap-2">
<span class="text-2xl font-display-xl text-on-background">14</span>
<span class="text-slate-500 text-xs font-terminal-text pb-1">--</span>
</div>
</div>
<div class="bg-surface-container-high p-4 border border-slate-800">
<span class="text-[10px] text-outline uppercase font-bold block mb-2">Threat Vector Level</span>
<div class="flex items-end gap-2">
<span class="text-2xl font-display-xl text-secondary">LOW</span>
<span class="text-secondary text-xs font-terminal-text pb-1">SAFE</span>
</div>
</div>
</div>
<!-- Log Stream (Refined Brutalism Terminal) -->
<div class="bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
<div class="bg-slate-900/50 px-4 py-2 border-b border-slate-800 flex justify-between items-center">
<div class="flex items-center gap-2">
<div class="flex gap-1.5">
<div class="w-3 h-3 rounded-full bg-slate-700"></div>
<div class="w-3 h-3 rounded-full bg-slate-700"></div>
<div class="w-3 h-3 rounded-full bg-slate-700"></div>
</div>
<span class="ml-4 text-[10px] font-bold text-outline tracking-widest uppercase">System Orchestrator Logs</span>
</div>
<span class="text-[10px] text-primary/50 font-terminal-text">Connected: AES-256-GCM</span>
</div>
<div class="p-4 h-48 overflow-y-auto font-terminal-text text-terminal-text space-y-1">
<p class="text-slate-500"><span class="text-secondary">[14:22:01]</span> <span class="text-primary">CORE_SYSTEM:</span> Node [Debian] heartbeat signal verified.</p>
<p class="text-slate-500"><span class="text-secondary">[14:22:05]</span> <span class="text-primary">NET_DISPATCH:</span> Routing table updated for subnet 10.0.4.x.</p>
<p class="text-slate-500"><span class="text-secondary">[14:22:12]</span> <span class="text-tertiary">WARN:</span> Node [Ubuntu] resource allocation below threshold (IDLE_STATE).</p>
<p class="text-slate-500"><span class="text-secondary">[14:22:15]</span> <span class="text-primary">SYSCALL:</span> Kernel integrity check completed. 0 vulnerabilities found.</p>
<p class="text-slate-500"><span class="text-secondary">[14:23:01]</span> <span class="text-primary">CORE_SYSTEM:</span> Syncing state with Declarative Node [NixOS].</p>
<p class="text-slate-400 animate-pulse">_</p>
</div>
</div>
</div>
</main>
<!-- Visual Background Element -->
<div class="fixed bottom-0 right-0 w-1/3 h-1/3 opacity-10 pointer-events-none z-[-1] overflow-hidden">
<svg class="w-full h-full text-blue-500 fill-current" viewbox="0 0 100 100">
<path d="M0 100 L100 100 L100 0 Z"></path>
</svg>
</div>
</body></html>

<!-- Container Manager -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>AEGIS_OS | Policy &amp; Safety Engine</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&amp;family=Inter:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glow-blue-500\/20 {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
        }
        ::-webkit-scrollbar {
            width: 4px;
            height: 4px;
        }
        ::-webkit-scrollbar-track {
            background: #0b1326;
        }
        ::-webkit-scrollbar-thumb {
            background: #2d3449;
            border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #414755;
        }
    </style>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "primary-fixed": "#d8e2ff",
                      "on-background": "#dae2fd",
                      "surface-dim": "#0b1326",
                      "on-tertiary": "#472a00",
                      "surface-variant": "#2d3449",
                      "on-primary": "#002e69",
                      "outline-variant": "#414755",
                      "inverse-primary": "#005bc1",
                      "surface-tint": "#adc6ff",
                      "secondary": "#4edea3",
                      "error": "#ffb4ab",
                      "surface-container": "#171f33",
                      "primary-container": "#4b8eff",
                      "secondary-fixed-dim": "#4edea3",
                      "surface-container-highest": "#2d3449",
                      "on-error": "#690005",
                      "inverse-surface": "#dae2fd",
                      "on-tertiary-fixed": "#2a1700",
                      "on-tertiary-container": "#3e2400",
                      "on-secondary": "#003824",
                      "inverse-on-surface": "#283044",
                      "primary": "#adc6ff",
                      "on-primary-container": "#00285c",
                      "surface": "#0b1326",
                      "surface-container-high": "#222a3d",
                      "on-surface-variant": "#c1c6d7",
                      "on-error-container": "#ffdad6",
                      "on-primary-fixed-variant": "#004493",
                      "secondary-fixed": "#6ffbbe",
                      "tertiary": "#ffb95f",
                      "surface-container-low": "#131b2e",
                      "tertiary-container": "#ca8100",
                      "tertiary-fixed": "#ffddb8",
                      "surface-bright": "#31394d",
                      "error-container": "#93000a",
                      "background": "#0b1326",
                      "tertiary-fixed-dim": "#ffb95f",
                      "primary-fixed-dim": "#adc6ff",
                      "on-surface": "#dae2fd",
                      "on-secondary-fixed-variant": "#005236",
                      "secondary-container": "#00a572",
                      "surface-container-lowest": "#060e20",
                      "on-tertiary-fixed-variant": "#653e00",
                      "on-secondary-container": "#00311f",
                      "outline": "#8b90a0",
                      "on-secondary-fixed": "#002113",
                      "on-primary-fixed": "#001a41"
              },
              "borderRadius": {
                      "DEFAULT": "0.125rem",
                      "lg": "0.25rem",
                      "xl": "0.5rem",
                      "full": "0.75rem"
              },
              "spacing": {
                      "component-gap-md": "16px",
                      "container-padding": "24px",
                      "component-gap-sm": "8px",
                      "gutter": "16px",
                      "unit": "4px"
              },
              "fontFamily": {
                      "display-xl": ["Space Grotesk"],
                      "body-md": ["Inter"],
                      "h1-heading": ["Space Grotesk"],
                      "ui-label-sm": ["Inter"],
                      "terminal-text": ["Monospaced"]
              },
              "fontSize": {
                      "display-xl": ["40px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                      "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                      "h1-heading": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                      "ui-label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
                      "terminal-text": ["13px", {"lineHeight": "18px", "fontWeight": "400"}]
              }
            },
          },
        }
    </script>
</head>
<body class="bg-background text-on-background font-body-md text-body-md overflow-hidden">
<!-- TopAppBar -->
<header class="flex justify-between items-center px-6 h-14 w-full fixed top-0 z-[60] bg-slate-950/90 backdrop-blur-md border-b border-slate-800 shadow-[0_0_15px_rgba(0,122,255,0.05)]">
<div class="flex items-center gap-8">
<span class="text-blue-500 font-bold tracking-widest text-base font-display-xl uppercase">AEGIS_SYSTEM_CORE</span>
<nav class="hidden md:flex items-center gap-6">
<a class="text-slate-400 py-4 font-ui-label-sm text-ui-label-sm hover:text-blue-300 transition-colors duration-200" href="#">Network</a>
<a class="text-blue-400 border-b-2 border-blue-500 py-4 font-ui-label-sm text-ui-label-sm uppercase" href="#">Threats</a>
<a class="text-slate-400 py-4 font-ui-label-sm text-ui-label-sm hover:text-blue-300 transition-colors duration-200" href="#">Deployment</a>
</nav>
</div>
<div class="flex items-center gap-4">
<div class="flex items-center gap-2 mr-4">
<button class="p-2 text-slate-400 hover:text-blue-400 transition-colors">
<span class="material-symbols-outlined" data-icon="security">security</span>
</button>
<button class="p-2 text-slate-400 hover:text-blue-400 transition-colors relative">
<span class="material-symbols-outlined" data-icon="notifications_active">notifications_active</span>
<span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full"></span>
</button>
</div>
<button class="bg-surface-variant text-on-surface px-4 py-1.5 rounded text-ui-label-sm font-ui-label-sm hover:bg-slate-700 transition-all active:opacity-80 active:scale-[0.99]">DEPLOY_AGENT</button>
<button class="bg-error-container text-on-error-container px-4 py-1.5 rounded text-ui-label-sm font-ui-label-sm hover:bg-red-900 transition-all active:opacity-80 active:scale-[0.99]">TERMINATE_ALL</button>
<div class="ml-2 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
<img alt="Admin Node 01" class="w-full h-full object-cover" data-alt="abstract cybersecurity avatar with circuitry patterns and neon blue accents minimalist digital art" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAq3-j89iuNgWDYebpJtIAyqPtAZ55MKcC9IKJakf2inRoZY2Mrj90BZ0izmIkPAeixg69A7L6fxlVndO6mxEhTWoIuBtlGVrDRlxjw9bZuxVgk94lG6TY0kAftFXCN9oCbzXtiNXfIjHTPrhKp5aKMMu_HVb4ox2uDo2poNiE1pOkVj7ThSQ8-feQ36RqSyoTiKUku8XknLrTVLFgHxh90qau1JVmwaGKN8-jckSP8CRbpQ5inqHpv3bfdd35h8jXaZaW9gyK_mpM"/>
</div>
</div>
</header>
<!-- SideNavBar -->
<aside class="flex flex-col h-screen fixed left-0 top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800 w-64 pt-14">
<div class="p-6 border-b border-slate-800/50">
<div class="flex items-center gap-3 mb-1">
<span class="text-blue-500 font-black tracking-tighter text-lg glow-blue-500/20 font-display-xl">AEGIS_OS</span>
<span class="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-bold tracking-widest">V0.4.2</span>
</div>
<p class="font-['Space_Grotesk'] tracking-wider uppercase text-[10px] font-bold text-slate-500">VIGILANT_MODE</p>
</div>
<nav class="flex-1 overflow-y-auto py-4">
<a class="text-slate-500 hover:text-slate-300 flex items-center gap-3 px-6 py-4 transition-colors font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold hover:bg-slate-900/50" href="#">
<span class="material-symbols-outlined" data-icon="terminal">terminal</span> Debian
            </a>
<a class="text-slate-500 hover:text-slate-300 flex items-center gap-3 px-6 py-4 transition-colors font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold hover:bg-slate-900/50" href="#">
<span class="material-symbols-outlined" data-icon="dns">dns</span> Ubuntu
            </a>
<a class="text-slate-500 hover:text-slate-300 flex items-center gap-3 px-6 py-4 transition-colors font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold hover:bg-slate-900/50" href="#">
<span class="material-symbols-outlined" data-icon="settings_input_component">settings_input_component</span> NixOS
            </a>
<a class="text-blue-400 bg-blue-500/10 border-r-2 border-blue-500 flex items-center gap-3 px-6 py-4 font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold" href="#">
<span class="material-symbols-outlined" data-icon="account_tree">account_tree</span> Orchestrator
            </a>
<a class="text-slate-500 hover:text-slate-300 flex items-center gap-3 px-6 py-4 transition-colors font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold hover:bg-slate-900/50" href="#">
<span class="material-symbols-outlined" data-icon="settings">settings</span> Settings
            </a>
</nav>
<div class="p-4 mt-auto">
<button class="w-full bg-blue-500 text-on-primary py-3 rounded text-xs font-bold tracking-widest uppercase hover:bg-blue-400 transition-all font-['Space_Grotesk']">
                INITIALIZE_NODE
            </button>
</div>
<div class="border-t border-slate-800/50 py-2">
<a class="text-slate-500 hover:text-slate-300 flex items-center gap-3 px-6 py-3 transition-colors font-['Space_Grotesk'] tracking-wider uppercase text-[10px] font-bold" href="#">
<span class="material-symbols-outlined text-sm" data-icon="description">description</span> Docs
            </a>
<a class="text-slate-500 hover:text-slate-300 flex items-center gap-3 px-6 py-3 transition-colors font-['Space_Grotesk'] tracking-wider uppercase text-[10px] font-bold" href="#">
<span class="material-symbols-outlined text-sm" data-icon="history">history</span> Logs
            </a>
</div>
</aside>
<!-- Main Stage -->
<main class="ml-64 mt-14 h-[calc(100vh-3.5rem)] flex overflow-hidden">
<!-- Center Content: Validated Actions Log -->
<section class="flex-1 flex flex-col min-w-0 bg-surface-container-lowest relative">
<div class="p-6 border-b border-slate-800/50 bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
<div class="flex justify-between items-end mb-4">
<div>
<h1 class="font-h1-heading text-h1-heading text-on-surface mb-1">Policy &amp; Safety Engine</h1>
<p class="text-slate-500 text-xs font-mono">Live Validation Stream // <span class="text-secondary">ACTIVE_SCANNING</span></p>
</div>
<div class="flex gap-2">
<div class="bg-surface-container border border-outline-variant rounded px-3 py-1.5 flex items-center gap-2">
<span class="material-symbols-outlined text-sm text-slate-400" data-icon="search">search</span>
<input class="bg-transparent border-none focus:ring-0 text-xs text-on-surface-variant w-40 p-0" placeholder="Filter Actions..." type="text"/>
</div>
<button class="bg-surface-container border border-outline-variant p-1.5 rounded hover:bg-slate-800">
<span class="material-symbols-outlined text-base" data-icon="filter_list">filter_list</span>
</button>
</div>
</div>
<div class="grid grid-cols-4 gap-4">
<div class="bg-surface-container-low p-3 border border-slate-800/50 rounded flex flex-col">
<span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Total Actions</span>
<span class="text-xl font-display-xl text-on-surface">1,248</span>
</div>
<div class="bg-surface-container-low p-3 border border-slate-800/50 rounded flex flex-col">
<span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Safe Pass</span>
<span class="text-xl font-display-xl text-secondary">1,212</span>
</div>
<div class="bg-surface-container-low p-3 border border-slate-800/50 rounded flex flex-col">
<span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">Blocked Violations</span>
<span class="text-xl font-display-xl text-error">36</span>
</div>
<div class="bg-surface-container-low p-3 border border-slate-800/50 rounded flex flex-col">
<span class="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">System Health</span>
<span class="text-xl font-display-xl text-primary-fixed">99.8%</span>
</div>
</div>
</div>
<!-- Table -->
<div class="flex-1 overflow-y-auto px-6 py-4">
<table class="w-full text-left border-separate border-spacing-y-2">
<thead>
<tr class="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
<th class="px-4 py-2">Timestamp</th>
<th class="px-4 py-2">Validated Action / Command</th>
<th class="px-4 py-2">Container Source</th>
<th class="px-4 py-2 text-right">Status</th>
</tr>
</thead>
<tbody class="font-mono text-[12px]">
<!-- Entry 1 -->
<tr class="group hover:bg-slate-900/40 transition-colors">
<td class="px-4 py-3 text-slate-500 border-y border-l border-slate-800/50 bg-surface-container-low rounded-l">14:20:01:04</td>
<td class="px-4 py-3 text-blue-300 border-y border-slate-800/50 bg-surface-container-low">apt-get update -y</td>
<td class="px-4 py-3 text-slate-400 border-y border-slate-800/50 bg-surface-container-low">debian_node_01</td>
<td class="px-4 py-3 text-right border-y border-r border-slate-800/50 bg-surface-container-low rounded-r">
<span class="bg-secondary/10 text-secondary border border-secondary/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">Safe</span>
</td>
</tr>
<!-- Entry 2 -->
<tr class="group hover:bg-slate-900/40 transition-colors">
<td class="px-4 py-3 text-slate-500 border-y border-l border-slate-800/50 bg-surface-container-low rounded-l">14:19:55:12</td>
<td class="px-4 py-3 text-error border-y border-slate-800/50 bg-surface-container-low">sudo rm -rf /etc/ssh</td>
<td class="px-4 py-3 text-slate-400 border-y border-slate-800/50 bg-surface-container-low">nixos_worker_3</td>
<td class="px-4 py-3 text-right border-y border-r border-slate-800/50 bg-surface-container-low rounded-r">
<span class="bg-error/10 text-error border border-error/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">Blocked</span>
</td>
</tr>
<!-- Entry 3 -->
<tr class="group hover:bg-slate-900/40 transition-colors">
<td class="px-4 py-3 text-slate-500 border-y border-l border-slate-800/50 bg-surface-container-low rounded-l">14:18:42:01</td>
<td class="px-4 py-3 text-blue-300 border-y border-slate-800/50 bg-surface-container-low">curl -sSf https://agent.aegis.io/install</td>
<td class="px-4 py-3 text-slate-400 border-y border-slate-800/50 bg-surface-container-low">ubuntu_master</td>
<td class="px-4 py-3 text-right border-y border-r border-slate-800/50 bg-surface-container-low rounded-r">
<span class="bg-secondary/10 text-secondary border border-secondary/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">Safe</span>
</td>
</tr>
<!-- Entry 4 -->
<tr class="group hover:bg-slate-900/40 transition-colors">
<td class="px-4 py-3 text-slate-500 border-y border-l border-slate-800/50 bg-surface-container-low rounded-l">14:17:10:55</td>
<td class="px-4 py-3 text-error border-y border-slate-800/50 bg-surface-container-low">nmap -sn 192.168.1.0/24</td>
<td class="px-4 py-3 text-slate-400 border-y border-slate-800/50 bg-surface-container-low">untrusted_pod_x</td>
<td class="px-4 py-3 text-right border-y border-r border-slate-800/50 bg-surface-container-low rounded-r">
<span class="bg-error/10 text-error border border-error/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">Blocked</span>
</td>
</tr>
<!-- Entry 5 -->
<tr class="group hover:bg-slate-900/40 transition-colors">
<td class="px-4 py-3 text-slate-500 border-y border-l border-slate-800/50 bg-surface-container-low rounded-l">14:15:22:11</td>
<td class="px-4 py-3 text-blue-300 border-y border-slate-800/50 bg-surface-container-low">systemctl restart aegis-vanguard</td>
<td class="px-4 py-3 text-slate-400 border-y border-slate-800/50 bg-surface-container-low">debian_node_01</td>
<td class="px-4 py-3 text-right border-y border-r border-slate-800/50 bg-surface-container-low rounded-r">
<span class="bg-secondary/10 text-secondary border border-secondary/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">Safe</span>
</td>
</tr>
<!-- Entry 6 -->
<tr class="group hover:bg-slate-900/40 transition-colors">
<td class="px-4 py-3 text-slate-500 border-y border-l border-slate-800/50 bg-surface-container-low rounded-l">14:12:01:44</td>
<td class="px-4 py-3 text-blue-300 border-y border-slate-800/50 bg-surface-container-low">ps aux | grep node</td>
<td class="px-4 py-3 text-slate-400 border-y border-slate-800/50 bg-surface-container-low">orchestrator_core</td>
<td class="px-4 py-3 text-right border-y border-r border-slate-800/50 bg-surface-container-low rounded-r">
<span class="bg-secondary/10 text-secondary border border-secondary/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-widest uppercase">Safe</span>
</td>
</tr>
</tbody>
</table>
</div>
</section>
<!-- Side Panel: Deterministic Rules -->
<aside class="w-80 bg-surface-container border-l border-slate-800 flex flex-col">
<div class="p-6 border-b border-slate-800/50">
<div class="flex items-center gap-2 mb-1">
<span class="material-symbols-outlined text-primary-fixed text-lg" data-icon="policy">policy</span>
<h2 class="font-h1-heading text-lg tracking-tight text-on-surface">Deterministic Rules</h2>
</div>
<p class="text-[11px] text-slate-500 uppercase tracking-widest font-bold">Policy Enforcement Engine</p>
</div>
<div class="flex-1 overflow-y-auto p-4 space-y-4">
<!-- Rule 1 -->
<div class="bg-surface-container-high p-4 border border-slate-700/50 rounded-lg group">
<div class="flex justify-between items-start mb-3">
<div>
<h3 class="text-xs font-bold text-on-surface uppercase tracking-wider mb-1">Block Root Access</h3>
<p class="text-[10px] text-slate-400 font-mono leading-relaxed">Prevents all containers from executing commands with UID 0.</p>
</div>
<div class="relative inline-flex items-center cursor-pointer">
<input checked="" class="sr-only peer" type="checkbox"/>
<div class="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-container"></div>
</div>
</div>
<div class="flex gap-2">
<span class="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-mono uppercase">Critical</span>
<span class="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded font-mono uppercase">L1 Policy</span>
</div>
</div>
<!-- Rule 2 -->
<div class="bg-surface-container-high p-4 border border-slate-700/50 rounded-lg group">
<div class="flex justify-between items-start mb-3">
<div>
<h3 class="text-xs font-bold text-on-surface uppercase tracking-wider mb-1">Restrict Network Outbound</h3>
<p class="text-[10px] text-slate-400 font-mono leading-relaxed">Deny egress traffic to IPs not listed in global_allow_list.</p>
</div>
<div class="relative inline-flex items-center cursor-pointer">
<input checked="" class="sr-only peer" type="checkbox"/>
<div class="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-container"></div>
</div>
</div>
<div class="flex gap-2">
<span class="text-[9px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-mono uppercase">High</span>
<span class="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded font-mono uppercase">Network</span>
</div>
</div>
<!-- Rule 3 -->
<div class="bg-surface-container-high p-4 border border-slate-700/50 rounded-lg group">
<div class="flex justify-between items-start mb-3">
<div>
<h3 class="text-xs font-bold text-on-surface uppercase tracking-wider mb-1">Prevent File Extraction</h3>
<p class="text-[10px] text-slate-400 font-mono leading-relaxed">Monitoring scp, rsync, and ftp commands across all nodes.</p>
</div>
<div class="relative inline-flex items-center cursor-pointer">
<input class="sr-only peer" type="checkbox"/>
<div class="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-container"></div>
</div>
</div>
<div class="flex gap-2">
<span class="text-[9px] bg-primary-fixed/10 text-primary-fixed border border-primary-fixed/20 px-1.5 py-0.5 rounded font-mono uppercase">Medium</span>
<span class="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded font-mono uppercase">Storage</span>
</div>
</div>
<!-- Rule 4 -->
<div class="bg-surface-container-high p-4 border border-slate-700/50 rounded-lg group">
<div class="flex justify-between items-start mb-3">
<div>
<h3 class="text-xs font-bold text-on-surface uppercase tracking-wider mb-1">Kernel Integrity Lock</h3>
<p class="text-[10px] text-slate-400 font-mono leading-relaxed">Prevents loading of unsigned kernel modules (LSM Enabled).</p>
</div>
<div class="relative inline-flex items-center cursor-pointer">
<input checked="" class="sr-only peer" type="checkbox"/>
<div class="w-8 h-4 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary-container"></div>
</div>
</div>
<div class="flex gap-2">
<span class="text-[9px] bg-red-500/10 text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded font-mono uppercase">Critical</span>
<span class="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded font-mono uppercase">System</span>
</div>
</div>
</div>
<div class="p-6 border-t border-slate-800 bg-surface-container-lowest">
<button class="w-full bg-slate-800 border border-slate-700 text-slate-300 py-2.5 rounded text-[10px] font-bold tracking-widest uppercase hover:bg-slate-700 transition-all flex items-center justify-center gap-2">
<span class="material-symbols-outlined text-sm" data-icon="add">add</span> Create New Rule
                </button>
</div>
</aside>
</main>
<!-- Contextual HUD/FAB Overlay -->
<div class="fixed bottom-6 right-[22rem] z-[70] hidden xl:flex flex-col gap-3">
<div class="bg-slate-900/90 backdrop-blur-md border border-blue-500/30 p-4 rounded-xl shadow-2xl w-64">
<div class="flex items-center justify-between mb-2">
<span class="text-[10px] text-blue-400 font-bold uppercase tracking-widest">AI Sentinel Status</span>
<span class="flex h-2 w-2 relative">
<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
<span class="relative inline-flex rounded-full h-2 w-2 bg-secondary"></span>
</span>
</div>
<div class="space-y-2">
<div class="flex justify-between items-center text-[11px]">
<span class="text-slate-400 font-mono">Cognitive Load:</span>
<span class="text-on-surface font-mono">14%</span>
</div>
<div class="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
<div class="bg-blue-500 h-full w-[14%]"></div>
</div>
<div class="flex justify-between items-center text-[11px]">
<span class="text-slate-400 font-mono">Detection Latency:</span>
<span class="text-on-surface font-mono">0.02ms</span>
</div>
</div>
</div>
</div>
</body></html>

<!-- Policy & Safety Engine -->
<!DOCTYPE html>

<html class="dark" lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&amp;family=Inter:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<script id="tailwind-config">
        tailwind.config = {
          darkMode: "class",
          theme: {
            extend: {
              "colors": {
                      "primary-fixed": "#d8e2ff",
                      "on-background": "#dae2fd",
                      "surface-dim": "#0b1326",
                      "on-tertiary": "#472a00",
                      "surface-variant": "#2d3449",
                      "on-primary": "#002e69",
                      "outline-variant": "#414755",
                      "inverse-primary": "#005bc1",
                      "surface-tint": "#adc6ff",
                      "secondary": "#4edea3",
                      "error": "#ffb4ab",
                      "surface-container": "#171f33",
                      "primary-container": "#4b8eff",
                      "secondary-fixed-dim": "#4edea3",
                      "surface-container-highest": "#2d3449",
                      "on-error": "#690005",
                      "inverse-surface": "#dae2fd",
                      "on-tertiary-fixed": "#2a1700",
                      "on-tertiary-container": "#3e2400",
                      "on-secondary": "#003824",
                      "inverse-on-surface": "#283044",
                      "primary": "#adc6ff",
                      "on-primary-container": "#00285c",
                      "surface": "#0b1326",
                      "surface-container-high": "#222a3d",
                      "on-surface-variant": "#c1c6d7",
                      "on-error-container": "#ffdad6",
                      "on-primary-fixed-variant": "#004493",
                      "secondary-fixed": "#6ffbbe",
                      "tertiary": "#ffb95f",
                      "surface-container-low": "#131b2e",
                      "tertiary-container": "#ca8100",
                      "tertiary-fixed": "#ffddb8",
                      "surface-bright": "#31394d",
                      "error-container": "#93000a",
                      "background": "#0b1326",
                      "tertiary-fixed-dim": "#ffb95f",
                      "primary-fixed-dim": "#adc6ff",
                      "on-surface": "#dae2fd",
                      "on-secondary-fixed-variant": "#005236",
                      "secondary-container": "#00a572",
                      "surface-container-lowest": "#060e20",
                      "on-tertiary-fixed-variant": "#653e00",
                      "on-secondary-container": "#00311f",
                      "outline": "#8b90a0",
                      "on-secondary-fixed": "#002113",
                      "on-primary-fixed": "#001a41"
              },
              "borderRadius": {
                      "DEFAULT": "0.125rem",
                      "lg": "0.25rem",
                      "xl": "0.5rem",
                      "full": "0.75rem"
              },
              "spacing": {
                      "component-gap-md": "16px",
                      "container-padding": "24px",
                      "component-gap-sm": "8px",
                      "gutter": "16px",
                      "unit": "4px"
              },
              "fontFamily": {
                      "display-xl": ["Space Grotesk"],
                      "body-md": ["Inter"],
                      "h1-heading": ["Space Grotesk"],
                      "ui-label-sm": ["Inter"],
                      "terminal-text": ["Monospace"]
              },
              "fontSize": {
                      "display-xl": ["40px", {"lineHeight": "1.1", "letterSpacing": "-0.02em", "fontWeight": "700"}],
                      "body-md": ["14px", {"lineHeight": "20px", "fontWeight": "400"}],
                      "h1-heading": ["24px", {"lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600"}],
                      "ui-label-sm": ["12px", {"lineHeight": "16px", "letterSpacing": "0.05em", "fontWeight": "600"}],
                      "terminal-text": ["13px", {"lineHeight": "18px", "fontWeight": "400"}]
              }
            },
          },
        }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .glow-blue { box-shadow: 0 0 15px rgba(0, 122, 255, 0.3); }
        .glow-green { box-shadow: 0 0 15px rgba(78, 222, 163, 0.3); }
        .node-connector { background: repeating-linear-gradient(90deg, #414755 0, #414755 4px, transparent 4px, transparent 8px); }
        .scanline { background: linear-gradient(to bottom, transparent 50%, rgba(0, 122, 255, 0.05) 50%); background-size: 100% 4px; }
    </style>
</head>
<body class="bg-background text-on-background font-body-md selection:bg-primary-container selection:text-on-primary-container">
<!-- SIDEBAR NAVIGATION -->
<aside class="flex flex-col h-screen fixed left-0 top-0 z-50 bg-slate-950/80 backdrop-blur-xl docked left-0 h-full w-64 border-r border-slate-800 border-r border-slate-800/50">
<div class="p-6 border-b border-slate-800/50">
<div class="flex items-center gap-3">
<div class="w-8 h-8 rounded-sm bg-primary-container flex items-center justify-center">
<span class="material-symbols-outlined text-on-primary-container" style="font-variation-settings: 'FILL' 1;">shield</span>
</div>
<div>
<h1 class="text-blue-500 font-black tracking-tighter text-lg glow-blue-500/20 font-['Space_Grotesk']">AEGIS_OS</h1>
<p class="font-['Space_Grotesk'] tracking-wider uppercase text-[10px] font-bold text-slate-500">VIGILANT_MODE</p>
</div>
</div>
</div>
<nav class="flex-1 py-4">
<div class="font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold text-slate-600 px-6 py-2">Infrastructure</div>
<a class="text-slate-500 hover:text-slate-300 flex items-center gap-3 px-6 py-4 transition-colors hover:bg-slate-900/50" href="#">
<span class="material-symbols-outlined">terminal</span>
<span class="font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold">Debian</span>
</a>
<a class="text-slate-500 hover:text-slate-300 flex items-center gap-3 px-6 py-4 transition-colors hover:bg-slate-900/50" href="#">
<span class="material-symbols-outlined">dns</span>
<span class="font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold">Ubuntu</span>
</a>
<a class="text-slate-500 hover:text-slate-300 flex items-center gap-3 px-6 py-4 transition-colors hover:bg-slate-900/50" href="#">
<span class="material-symbols-outlined">settings_input_component</span>
<span class="font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold">NixOS</span>
</a>
<a class="text-blue-400 bg-blue-500/10 border-r-2 border-blue-500 flex items-center gap-3 px-6 py-4" href="#">
<span class="material-symbols-outlined" style="font-variation-settings: 'FILL' 1;">account_tree</span>
<span class="font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold">Orchestrator</span>
</a>
<a class="text-slate-500 hover:text-slate-300 flex items-center gap-3 px-6 py-4 transition-colors hover:bg-slate-900/50" href="#">
<span class="material-symbols-outlined">settings</span>
<span class="font-['Space_Grotesk'] tracking-wider uppercase text-xs font-bold">Settings</span>
</a>
</nav>
<div class="mt-auto border-t border-slate-800/50 p-4">
<button class="w-full bg-blue-500 text-on-primary font-['Space_Grotesk'] font-bold text-xs py-3 rounded-sm tracking-widest active:scale-95 duration-100 uppercase">
                INITIALIZE_NODE
            </button>
<div class="flex gap-4 mt-4 px-2">
<a class="text-slate-500 hover:text-slate-300 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" href="#">
<span class="material-symbols-outlined text-sm">description</span> Docs
                </a>
<a class="text-slate-500 hover:text-slate-300 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest" href="#">
<span class="material-symbols-outlined text-sm">history</span> Logs
                </a>
</div>
</div>
</aside>
<!-- TOP BAR -->
<header class="flex justify-between items-center px-6 h-14 w-full fixed top-0 z-[60] bg-slate-950/90 backdrop-blur-md docked full-width top-0 border-b border-slate-800 shadow-[0_0_15px_rgba(0,122,255,0.05)] ml-64 w-[calc(100%-16rem)]">
<div class="flex items-center gap-8">
<span class="text-blue-500 font-bold tracking-widest text-base font-['Space_Grotesk']">AEGIS_SYSTEM_CORE</span>
<div class="flex items-center gap-6">
<a class="text-slate-400 py-4 font-['Space_Grotesk'] text-sm tracking-tight font-medium hover:text-blue-300 transition-colors duration-200" href="#">Network</a>
<a class="text-slate-400 py-4 font-['Space_Grotesk'] text-sm tracking-tight font-medium hover:text-blue-300 transition-colors duration-200" href="#">Threats</a>
<a class="text-blue-400 border-b-2 border-blue-500 py-4 font-['Space_Grotesk'] text-sm tracking-tight font-medium" href="#">Deployment</a>
</div>
</div>
<div class="flex items-center gap-4">
<div class="flex items-center gap-2">
<button class="p-2 text-slate-400 hover:text-blue-400">
<span class="material-symbols-outlined">security</span>
</button>
<button class="p-2 text-slate-400 hover:text-blue-400 relative">
<span class="material-symbols-outlined">notifications_active</span>
<span class="absolute top-2 right-2 w-2 h-2 bg-error rounded-full animate-pulse"></span>
</button>
</div>
<div class="h-6 w-[1px] bg-slate-800 mx-2"></div>
<button class="bg-error/10 border border-error/50 text-error px-3 py-1 rounded-sm text-[10px] font-bold tracking-widest uppercase hover:bg-error/20 transition-all active:scale-95">
                TERMINATE_ALL
            </button>
<div class="flex items-center gap-2 ml-2 pl-4 border-l border-slate-800">
<div class="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 overflow-hidden">
<img alt="Admin Node 01" class="w-full h-full object-cover" data-alt="Cyber-security specialist profile avatar stylized as a digital blueprint or data-grid representation in blue tones" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAdqK1ICyBx0hKev-sM3XOdlO824adPiLUuVNALpsD10zTLgGvT1DXntRJaPbFBxQpLx1kXfqMOjff2qVF6rPfKXF-KnSFVnrk_scK_ul2e1iJph4d9f6UY5DG9U0TUrX2M-uzJnz9bJwUNWGb7XEHEU4ig5jotHtlKTyQNZj0tExiDJsmk5j5YaCOTSiG5pbtrCHxOYV-eqt-KVwQzm6F4PO3BfZcsYQYDZSmJ9B2jXoyRQLlxbynrYcnPZaF3w0fOctcqfOyH8KU"/>
</div>
</div>
</div>
</header>
<!-- MAIN STAGE -->
<main class="ml-64 pt-14 h-screen overflow-hidden flex flex-col bg-surface-container-lowest">
<!-- Orchestration Stage (Grid/Graph Area) -->
<section class="flex-1 p-container-padding relative overflow-hidden scanline">
<!-- Grid Background Overlay -->
<div class="absolute inset-0 pointer-events-none opacity-10" style="background-image: linear-gradient(#414755 1px, transparent 1px), linear-gradient(90deg, #414755 1px, transparent 1px); background-size: 32px 32px;"></div>
<div class="h-full flex flex-col">
<header class="mb-gutter flex justify-between items-start z-10">
<div>
<h2 class="text-h1-heading font-h1-heading text-on-background flex items-center gap-3">
<span class="material-symbols-outlined text-primary" style="font-variation-settings: 'FILL' 1;">hub</span>
                            AGENT_ORCHESTRATOR_V09
                        </h2>
<div class="flex items-center gap-4 mt-2">
<span class="text-ui-label-sm font-ui-label-sm text-secondary bg-secondary/10 px-2 py-0.5 rounded-sm border border-secondary/20">STATUS: ACTIVE</span>
<span class="text-ui-label-sm font-ui-label-sm text-outline">REQUEST_ID: 0x9f2a_44c1</span>
<span class="text-ui-label-sm font-ui-label-sm text-outline">LATENCY: 42ms</span>
</div>
</div>
<div class="flex gap-2">
<button class="bg-surface-container-high border border-outline-variant p-2 rounded-sm hover:border-primary transition-colors">
<span class="material-symbols-outlined text-on-surface-variant">zoom_in</span>
</button>
<button class="bg-surface-container-high border border-outline-variant p-2 rounded-sm hover:border-primary transition-colors">
<span class="material-symbols-outlined text-on-surface-variant">zoom_out</span>
</button>
<button class="bg-surface-container-high border border-outline-variant p-2 rounded-sm hover:border-primary transition-colors">
<span class="material-symbols-outlined text-on-surface-variant">refresh</span>
</button>
</div>
</header>
<!-- FLOW CHART CANVAS -->
<div class="flex-1 flex items-center justify-center relative">
<div class="flex items-center w-full max-w-5xl justify-between relative">
<!-- Connecting Lines Background -->
<div class="absolute inset-x-0 h-[2px] node-connector top-1/2 -translate-y-1/2 z-0 opacity-50"></div>
<!-- Reasoning Node -->
<div class="relative z-10 group">
<div class="w-48 bg-surface-container border border-outline-variant p-4 rounded-lg shadow-xl hover:border-primary transition-all group-active:scale-95 border-primary/50 glow-blue">
<div class="flex justify-between items-center mb-3">
<span class="text-[10px] font-bold text-primary font-['Space_Grotesk'] tracking-widest uppercase">Phase 01</span>
<span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings: 'FILL' 1;">psychology</span>
</div>
<h3 class="font-['Space_Grotesk'] font-bold text-sm text-on-surface mb-1">REASONING</h3>
<p class="text-[11px] text-outline leading-tight">Deconstructing natural language payload into logic primitives.</p>
<div class="mt-3 h-1 w-full bg-surface-variant rounded-full overflow-hidden">
<div class="h-full bg-primary w-[85%]"></div>
</div>
</div>
<div class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-mono text-secondary">COMPLETE (850ms)</div>
</div>
<!-- Planning Node -->
<div class="relative z-10 group">
<div class="w-48 bg-surface-container border border-outline-variant p-4 rounded-lg shadow-xl hover:border-primary transition-all group-active:scale-95 border-primary glow-blue">
<div class="flex justify-between items-center mb-3">
<span class="text-[10px] font-bold text-primary font-['Space_Grotesk'] tracking-widest uppercase">Phase 02</span>
<span class="material-symbols-outlined text-primary text-sm" style="font-variation-settings: 'FILL' 1;">list_alt</span>
</div>
<h3 class="font-['Space_Grotesk'] font-bold text-sm text-on-surface mb-1">PLANNING</h3>
<p class="text-[11px] text-outline leading-tight">Generating multi-step execution DAG for target nodes.</p>
<div class="mt-3 h-1 w-full bg-surface-variant rounded-full overflow-hidden">
<div class="h-full bg-primary w-1/2 animate-pulse"></div>
</div>
</div>
<div class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-mono text-primary animate-pulse">PROCESSING...</div>
</div>
<!-- Policy Check Node -->
<div class="relative z-10 group">
<div class="w-48 bg-surface-container border border-outline-variant p-4 rounded-lg shadow-xl hover:border-primary transition-all opacity-60">
<div class="flex justify-between items-center mb-3">
<span class="text-[10px] font-bold text-outline font-['Space_Grotesk'] tracking-widest uppercase">Phase 03</span>
<span class="material-symbols-outlined text-outline text-sm">gavel</span>
</div>
<h3 class="font-['Space_Grotesk'] font-bold text-sm text-on-surface mb-1">POLICY_CHECK</h3>
<p class="text-[11px] text-outline leading-tight">Validating commands against AEGIS security protocols.</p>
<div class="mt-3 h-1 w-full bg-surface-variant rounded-full overflow-hidden">
<div class="h-full bg-primary w-0"></div>
</div>
</div>
<div class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-mono text-outline">QUEUED</div>
</div>
<!-- Execution Node -->
<div class="relative z-10 group">
<div class="w-48 bg-surface-container border border-outline-variant p-4 rounded-lg shadow-xl hover:border-primary transition-all opacity-60">
<div class="flex justify-between items-center mb-3">
<span class="text-[10px] font-bold text-outline font-['Space_Grotesk'] tracking-widest uppercase">Phase 04</span>
<span class="material-symbols-outlined text-outline text-sm">rocket_launch</span>
</div>
<h3 class="font-['Space_Grotesk'] font-bold text-sm text-on-surface mb-1">EXECUTION</h3>
<p class="text-[11px] text-outline leading-tight">Dispatching instructions to terminal deployment nodes.</p>
<div class="mt-3 h-1 w-full bg-surface-variant rounded-full overflow-hidden">
<div class="h-full bg-primary w-0"></div>
</div>
</div>
<div class="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] font-mono text-outline">QUEUED</div>
</div>
</div>
</div>
</div>
</section>
<!-- TERMINAL PANE (THOUGHT PROCESS) -->
<section class="h-1/3 bg-surface-container-lowest border-t border-slate-800 flex flex-col">
<div class="flex items-center justify-between px-6 py-2 bg-slate-950/50 border-b border-slate-800">
<div class="flex items-center gap-4">
<div class="flex gap-1.5">
<div class="w-3 h-3 rounded-full bg-red-500/50"></div>
<div class="w-3 h-3 rounded-full bg-amber-500/50"></div>
<div class="w-3 h-3 rounded-full bg-emerald-500/50"></div>
</div>
<span class="text-ui-label-sm font-ui-label-sm text-primary flex items-center gap-2">
<span class="material-symbols-outlined text-sm">terminal</span>
                        LOG_STREAM::THOUGHT_PROCESS
                    </span>
</div>
<div class="flex items-center gap-4">
<span class="text-[10px] font-mono text-secondary px-2 border border-secondary/30 rounded-sm">LLM_CORE_V4</span>
<button class="text-slate-500 hover:text-white transition-colors">
<span class="material-symbols-outlined text-sm">download</span>
</button>
<button class="text-slate-500 hover:text-white transition-colors">
<span class="material-symbols-outlined text-sm">clear_all</span>
</button>
</div>
</div>
<div class="flex-1 overflow-y-auto p-4 font-mono text-[13px] leading-relaxed selection:bg-primary/20">
<div class="flex gap-4 mb-1">
<span class="text-slate-600 shrink-0">[14:20:01.03]</span>
<span class="text-blue-400 shrink-0">INFO:</span>
<span class="text-on-surface">Incoming orchestrator request received. Payload: "Scale cluster-04 to 12 nodes if CPU &gt; 80%"</span>
</div>
<div class="flex gap-4 mb-1">
<span class="text-slate-600 shrink-0">[14:20:01.04]</span>
<span class="text-tertiary shrink-0">REASONING:</span>
<span class="text-slate-400 italic">"I need to identify which environment cluster-04 belongs to. Cross-referencing NixOS configuration files... Found. cluster-04 is in the production-east-1 region. The request is conditional on CPU metrics."</span>
</div>
<div class="flex gap-4 mb-1">
<span class="text-slate-600 shrink-0">[14:20:01.08]</span>
<span class="text-blue-400 shrink-0">INFO:</span>
<span class="text-on-surface">Sub-task created: Fetch current CPU metrics for cluster-04.</span>
</div>
<div class="flex gap-4 mb-1">
<span class="text-slate-600 shrink-0">[14:20:01.12]</span>
<span class="text-blue-400 shrink-0">INFO:</span>
<span class="text-on-surface">Metrics received: current_avg_cpu = 84.2%. Condition met.</span>
</div>
<div class="flex gap-4 mb-1">
<span class="text-slate-600 shrink-0">[14:20:01.15]</span>
<span class="text-tertiary shrink-0">PLANNING:</span>
<span class="text-slate-400 italic">"Step 1: Authenticate with Kubernetes API. Step 2: Patch horizontalpodautoscaler/cluster-04-hpa. Step 3: Wait for replica roll-out. Step 4: Verify health status of new pods."</span>
</div>
<div class="flex gap-4 mb-1">
<span class="text-slate-600 shrink-0">[14:20:01.20]</span>
<span class="text-blue-400 shrink-0">PLAN:</span>
<span class="text-on-surface">DAG generated with 4 sequential steps and 1 contingency fallback.</span>
</div>
<div class="flex gap-4 mb-1">
<span class="text-slate-600 shrink-0">[14:20:01.25]</span>
<span class="text-secondary shrink-0">SYSTEM:</span>
<span class="text-secondary">Initiating Policy Check on generated plan...</span>
</div>
<div class="flex gap-4 animate-pulse">
<span class="text-slate-600 shrink-0">[14:20:01.30]</span>
<span class="text-primary shrink-0">PROMPT:</span>
<span class="text-primary">Waiting for policy auditor response... <span class="bg-primary w-2 h-4 inline-block align-middle ml-1"></span></span>
</div>
</div>
</section>
</main>
<!-- FAB: Contextual Action (Book/Initialize) - Hidden on Orchestrator as per instructions -->
<!-- METRICS SIDEBAR (RIGHT) -->
<aside class="fixed right-0 top-14 w-64 h-[calc(100vh-3.5rem)] bg-surface-container border-l border-slate-800 p-6 flex flex-col gap-6 z-40">
<div>
<h4 class="font-['Space_Grotesk'] text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-4">Node Resources</h4>
<div class="space-y-4">
<div>
<div class="flex justify-between text-[11px] font-mono mb-1">
<span class="text-outline">CPU_LOAD</span>
<span class="text-primary">84.2%</span>
</div>
<div class="h-1 bg-slate-800 rounded-full overflow-hidden">
<div class="h-full bg-primary w-[84%]"></div>
</div>
</div>
<div>
<div class="flex justify-between text-[11px] font-mono mb-1">
<span class="text-outline">MEM_USAGE</span>
<span class="text-secondary">6.4GB</span>
</div>
<div class="h-1 bg-slate-800 rounded-full overflow-hidden">
<div class="h-full bg-secondary w-[64%]"></div>
</div>
</div>
<div>
<div class="flex justify-between text-[11px] font-mono mb-1">
<span class="text-outline">THREAT_LEVEL</span>
<span class="text-error">LOW</span>
</div>
<div class="h-1 bg-slate-800 rounded-full overflow-hidden">
<div class="h-full bg-error w-[12%]"></div>
</div>
</div>
</div>
</div>
<div class="flex-1">
<h4 class="font-['Space_Grotesk'] text-[10px] font-bold tracking-[0.2em] text-slate-500 uppercase mb-4">Active Agents</h4>
<div class="space-y-3">
<div class="flex items-center gap-3 p-2 bg-slate-950/30 border border-slate-800/50 rounded-sm">
<div class="w-2 h-2 bg-secondary rounded-full"></div>
<div class="flex-1">
<div class="text-[11px] font-bold">REASONER_ALPHA</div>
<div class="text-[9px] text-outline font-mono">PID: 2844</div>
</div>
</div>
<div class="flex items-center gap-3 p-2 bg-slate-950/30 border border-slate-800/50 rounded-sm">
<div class="w-2 h-2 bg-primary animate-pulse rounded-full"></div>
<div class="flex-1">
<div class="text-[11px] font-bold">PLANNER_BRAVO</div>
<div class="text-[9px] text-outline font-mono">PID: 2901</div>
</div>
</div>
<div class="flex items-center gap-3 p-2 bg-slate-950/30 border border-slate-800/50 rounded-sm opacity-50">
<div class="w-2 h-2 bg-slate-600 rounded-full"></div>
<div class="flex-1">
<div class="text-[11px] font-bold">EXECUTOR_DELTA</div>
<div class="text-[9px] text-outline font-mono">IDLE</div>
</div>
</div>
</div>
</div>
<div class="mt-auto border-t border-slate-800 pt-4">
<div class="bg-primary/5 border border-primary/20 p-4 rounded-sm">
<div class="flex items-center gap-2 mb-2">
<span class="material-symbols-outlined text-primary text-sm">security_update_good</span>
<span class="text-[10px] font-bold uppercase tracking-widest text-primary">System Integrity</span>
</div>
<p class="text-[11px] text-on-surface-variant leading-relaxed">
                    All nodes are synchronized. No drifting detected in agent policy files.
                </p>
</div>
</div>
</aside>
</body></html>

<!-- Agent Orchestrator -->
# AegisOS — Agent Operating System (AI Runtime Environment)

AegisOS is an AI-native agent environment where a local LLM controls isolated execution containers through a secure orchestration layer.

## Core Concept
Instead of replacing an operating system, AegisOS runs inside one as an application (Next.js/Node.js/Docker/Ollama).

## System Modes
- **Debian Mode (Safe Execution):** Restricted, stable.
- **Ubuntu Mode (Development / AI):** Full dev stack, prototyping.
- **NixOS Mode (Declarative State):** Configuration-based, reproducible.

## Interface Design
Split interface:
- Left panel: Chat (LLM interaction)
- Right panel: Terminal output (execution stream)

## Safety Features
- Sandbox-first execution
- No direct root access for LLMs
- Full audit logging
- Deterministic policy validation layer

## Roadmap
1. Phase 1: Web Application (MVP)
2. Phase 2: Desktop AI Platform (Electron/Tauri)
3. Phase 3: AI Runtime Platform (Cloud/Hybrid)
4. Phase 4: AI Operating System Layer (Bootable Image)