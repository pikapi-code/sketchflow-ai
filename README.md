
# SketchFlow AI

**SketchFlow AI** is an interactive whiteboard and diagramming application. Create beautiful hand-drawn style sketches, flowcharts, and diagrams with ease using intuitive drawing tools or AI-powered generation.

## Features

> 📖 For detailed feature documentation, see [FEATURES.md](FEATURES.md)

### 🎨 Drawing Tools
- **Shapes** (R, O, D): Rectangle, Ellipse, Diamond with hand-drawn aesthetics
- **Connectors** (A, L): Arrows and Lines with smart sticky bindings
- **Freehand** (P): Scribble tool for natural drawing with smooth strokes
- **Text** (T): Add labels and annotations with multiple font options
- **Eraser** (E): Remove unwanted elements
- **Selection** (V): Multi-select, move, and resize with handles

### 🤖 AI-Powered Generation
- **Text-to-Diagram**: Generate complete diagrams from natural language descriptions
- **Powered by Google Gemini**: Advanced AI for intelligent diagram creation
- **Auto-Layout**: Automatically creates flowcharts, system diagrams, and more
- **Smart Centering**: AI-generated diagrams appear centered in your viewport

### ⌨️ Keyboard Shortcuts
- **Full Keyboard Control**: Every tool and action has a keyboard shortcut
- **Shortcuts Panel**: Built-in reference guide (toggle with keyboard icon)
- **Quick Tools**: V, R, D, O, A, L, P, T, E for instant tool switching
- **Standard Actions**: Ctrl+Z undo, Ctrl+A select all, Delete/Backspace to remove

### 🎨 Styling & Customization
- **Properties Panel**: Comprehensive styling controls for all elements
- **Colors**: 9 preset colors + custom color picker for stroke and fill
- **Fill Styles**: Solid, Hachure, Cross-hatch, Zigzag, Dots, None
- **Stroke Width**: Adjustable 1-5 pixels with slider
- **Roughness**: Control hand-drawn "sketchiness" (0-3 levels)
- **Opacity**: 0-100% transparency support
- **Text Fonts**: 10+ font families including Sans, Serif, Monospace, and more

### 📐 Canvas Navigation
- **Pan & Zoom**: Smooth navigation with scroll/pinch gestures
- **Zoom to Cursor**: Ctrl/Cmd + Scroll zooms toward mouse position
- **Zoom Range**: 10% to 2000% zoom levels
- **MiniMap**: Optional movable/resizable overview map (toggle on/off)
- **Viewport Info**: Real-time element count and zoom percentage

### 🎯 Smart Features
- **Sticky Line Bindings**: Lines/arrows automatically attach to shapes
- **Persistent Connections**: Lines follow shapes when moved
- **Snap-to-Shape**: Automatic endpoint snapping for clean diagrams
- **Double-Click Edit**: Quickly edit text on any element
- **Selection Handles**: 8-point handles for shapes, 2-point for lines
- **Smart Box Selection**: Drag box to select multiple elements
- **Pending Draw System**: Only creates elements when you drag 5+ pixels

### 🔄 History & Editing
- **Unlimited Undo/Redo**: Full history with Ctrl+Z and Ctrl+Shift+Z
- **Multi-Selection**: Shift/Ctrl + Click or drag box to select multiple
- **Bulk Operations**: Move, style, or delete multiple elements at once
- **Text Editing**: Add text to any element, not just text objects
- **Auto-Cleanup**: Empty text elements removed automatically

### 🌓 Themes & Export
- **Light & Dark Mode**: Toggle with theme button
- **Theme-Aware Export**: PNG exports respect current theme
- **High Quality**: Full resolution canvas export
- **Timestamped Files**: Automatic naming for easy organization

### 🎨 Visual Design
- **Neomorphic UI**: Modern shadow-based design system
- **Hand-drawn Aesthetic**: Rough.js powered rendering for sketch look
- **Dotted Canvas**: Subtle grid background that adapts to theme
- **Professional Polish**: Balances casual sketch style with precision

### 🎯 Use Cases
- **Software Development**: System architecture, flowcharts, component diagrams
- **Business**: Process flows, workflows, organizational charts
- **Education**: Teaching diagrams, visual notes, concept mapping
- **Design**: Wireframes, mockups, storyboards
- **Documentation**: Technical diagrams, annotated visuals
- **Brainstorming**: Mind maps, idea exploration, collaborative whiteboarding

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to VM

This project supports multiple deployment methods:

### Option 1: GitHub Actions (Recommended)

Automated deployment using GitHub Actions workflow with Docker.

#### Setup:

1. **Configure GitHub Secrets:**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `VM_HOST`: Your VM's IP address or hostname
     - `VM_USERNAME`: SSH username (e.g., `ubuntu`, `root`)
     - `VM_SSH_KEY`: Private SSH key for authentication
     - `VM_PORT`: SSH port (default: 22, optional)
     - `GEMINI_API_KEY`: Your Gemini API key

2. **Setup VM (one-time setup):**
   ```bash
   # Install Docker and Docker Compose
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo apt install -y docker-compose-plugin
   
   # Add your user to docker group (optional, to run docker without sudo)
   sudo usermod -aG docker $USER
   ```
   
   **Note:** The GitHub Actions workflow will automatically create `/opt/sketchflow-ai` and handle all deployment files. You don't need to manually create directories or configure nginx.

3. **Configure Firewall:**
   ```bash
   # Allow HTTP traffic on port 8000 (or your chosen port)
   gcloud compute firewall-rules create allow-http-8000 \
       --allow tcp:8000 \
       --source-ranges 0.0.0.0/0 \
       --priority 1000
   ```

4. **Deploy:**
   - Push to `main` branch, or
   - Manually trigger workflow from Actions tab
   
   The workflow will automatically:
   - Build the application
   - Deploy to `/opt/sketchflow-ai` on your VM
   - Create/update `.env` file with your API key
   - Build and restart the Docker container
   
5. **Access your app:**
   - Open `http://your-vm-ip:8000` in your browser

### Option 2: Docker Deployment

Deploy using Docker containers.

#### On your VM:

1. **Install Docker and Docker Compose:**
   ```bash
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   sudo apt install -y docker-compose-plugin
   ```

2. **Clone repository:**
   ```bash
   git clone <your-repo-url> /opt/sketchflow-ai
   cd /opt/sketchflow-ai
   ```

3. **Create `.env` file:**
   ```bash
   echo "GEMINI_API_KEY=your-api-key-here" > .env
   ```

4. **Build and run:**
   ```bash
   docker compose up -d --build
   ```

5. **Access your app:**
   - Open `http://your-vm-ip:8000` in your browser

### Option 3: Manual Deployment

Deploy manually without automation.

1. **Build locally:**
   ```bash
   npm install
   npm run build
   ```

2. **Transfer to VM:**
   ```bash
   scp -r dist/* user@your-vm-ip:/var/www/sketchflow-ai/
   ```

3. **On VM, set permissions:**
   ```bash
   sudo chown -R www-data:www-data /var/www/sketchflow-ai
   sudo systemctl reload nginx
   ```

### Environment Variables

The app requires `GEMINI_API_KEY` to be set. For production:

- **GitHub Actions**: Set as a GitHub secret
- **Docker**: Set in `.env` file or `docker-compose.yml`
- **Manual**: Set in `.env.local` before building, or configure at runtime

### Troubleshooting

- **502 Bad Gateway / Can't access app**: 
  - Check if Docker container is running: `docker ps`
  - Check container logs: `docker logs sketchflow-ai-sketchflow-ai-1`
  - Verify firewall rule allows your port: `gcloud compute firewall-rules list`
- **Permission denied**: 
  - Ensure your user can run docker: `sudo usermod -aG docker $USER` (then logout/login)
  - Check directory permissions: `ls -la /opt/sketchflow-ai`
- **API errors**: 
  - Verify `GEMINI_API_KEY` is correctly set in GitHub secrets
  - Check `.env` file on VM: `cat /opt/sketchflow-ai/.env`
  - Restart container: `cd /opt/sketchflow-ai && docker compose restart`
