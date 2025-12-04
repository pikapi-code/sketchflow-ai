
# SketchFlow AI

**SketchFlow AI** is an interactive whiteboard and diagramming application. Create beautiful hand-drawn style sketches, flowcharts, and diagrams with ease using intuitive drawing tools or AI-powered generation.

## Features

### 🎨 Drawing Tools
- **Shapes**: Rectangle, Ellipse, Diamond
- **Connectors**: Arrows and Lines
- **Freehand**: Scribble tool for natural drawing
- **Text**: Add labels and annotations
- **Eraser**: Remove unwanted elements

### 🤖 AI-Powered Generation
- Generate complete diagrams from text descriptions using Google Gemini
- Automatically creates flowcharts, system diagrams, and more
- Intelligent layout and element positioning

### ✨ Advanced Features
- **Hand-drawn Style**: Uses Rough.js for authentic sketch aesthetics
- **Selection & Editing**: Multi-select, move, resize, and customize elements
- **Undo/Redo**: Full history support for easy corrections
- **Pan & Zoom**: Navigate large canvases effortlessly
- **Properties Panel**: Customize colors, stroke width, fill styles, and more
- **Dark Mode**: Toggle between light and dark themes
- **Export**: Download your creations as images

### 🎯 Use Cases
- Flowcharts and process diagrams
- System architecture diagrams
- Wireframes and mockups
- Brainstorming and mind maps
- Technical documentation
- Educational diagrams

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

Automated deployment using GitHub Actions workflow.

#### Setup:

1. **Configure GitHub Secrets:**
   - Go to your repository → Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `VM_HOST`: Your VM's IP address or hostname
     - `VM_USERNAME`: SSH username (e.g., `ubuntu`, `root`)
     - `VM_SSH_KEY`: Private SSH key for authentication
     - `VM_PORT`: SSH port (default: 22, optional)
     - `GEMINI_API_KEY`: Your Gemini API key

2. **Setup VM:**
   ```bash
   # On your VM, install nginx
   sudo apt update
   sudo apt install -y nginx
   
   # Create deployment directory
   sudo mkdir -p /var/www/sketchflow-ai
   sudo chown -R $USER:$USER /var/www/sketchflow-ai
   
   # Copy deploy script
   sudo mkdir -p /opt/sketchflow-ai
   sudo cp deploy.sh /opt/sketchflow-ai/
   sudo chmod +x /opt/sketchflow-ai/deploy.sh
   ```

3. **Configure Nginx:**
   ```bash
   sudo nano /etc/nginx/sites-available/sketchflow-ai
   ```
   
   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;  # Replace with your domain or IP
       
       root /var/www/sketchflow-ai;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
   }
   ```
   
   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/sketchflow-ai /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

4. **Deploy:**
   - Push to `main` branch, or
   - Manually trigger workflow from Actions tab

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
   - Open `http://your-vm-ip` in your browser

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

- **502 Bad Gateway**: Check nginx logs: `sudo tail -f /var/log/nginx/error.log`
- **Permission denied**: Ensure www-data owns the files: `sudo chown -R www-data:www-data /var/www/sketchflow-ai`
- **API errors**: Verify `GEMINI_API_KEY` is correctly set and valid
