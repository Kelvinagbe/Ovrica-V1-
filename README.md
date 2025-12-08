<div align="center">

# 🌟 Ovrica-V1 🌟

<img src="assets/app.png" alt="Ovrica-V1 Logo" width="250"/>

### 💎 **Advanced WhatsApp Bot** 💎

<p align="center">
  <img src="https://img.shields.io/badge/version-1.0.0-blueviolet?style=for-the-badge&logo=semantic-release" />
  <img src="https://img.shields.io/badge/license-MIT-success?style=for-the-badge&logo=open-source-initiative" />
  <img src="https://img.shields.io/badge/node-%3E%3D16.0.0-green?style=for-the-badge&logo=node.js" />
  <img src="https://img.shields.io/badge/WebSocket-Enabled-orange?style=for-the-badge&logo=socketdotio" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=flat-square" />
  <img src="https://img.shields.io/badge/Maintained-Yes-cyan?style=flat-square" />
  <img src="https://img.shields.io/badge/Made%20with-JavaScript-yellow?style=flat-square&logo=javascript" />
  <img src="https://img.shields.io/badge/Platform-WhatsApp-25D366?style=flat-square&logo=whatsapp" />
</p>

---

### 🚀 **[Installation](#-installation)** • **[Features](#-features)** • **[Commands](#-usage)** • **[Support](#-support)**

---

</div>

## 📋 **Overview**

> **Ovrica-V1** is a powerful and feature-rich WhatsApp bot built to enhance your messaging experience with cutting-edge technology and seamless integration.

<div align="center">

```ascii
╔═══════════════════════════════════════╗
║  🎯 Built for Performance             ║
║  🔐 Secured with Best Practices       ║
║  ⚡ Lightning Fast Response Times     ║
║  🎨 Highly Customizable               ║
╚═══════════════════════════════════════╝
```

</div>

## ✨ **Features**

<table>
<tr>
<td width="50%">

### 🤖 **Core Features**
- 💬 Smart automated responses
- ⚡ Lightning-fast command execution
- 🔒 Enterprise-grade security
- 📊 Advanced media handling
- 🎯 Custom command creation

</td>
<td width="50%">

### 🎨 **Advanced Features**
- 👥 Group management system
- 🌐 WebSocket connectivity
- 💾 Session persistence
- 🔄 Auto-reconnect capability
- 📝 Detailed logging system

</td>
</tr>
</table>

## 🚀 **Installation**

### **Prerequisites**

```bash
📦 Node.js >= 16.0.0
📦 npm or yarn
📦 Git
```

### **Setup Steps**

<details>
<summary><b>👉 Click to expand installation guide</b></summary>

**1️⃣ Clone the repository**
```bash
git clone https://github.com/kelvinagbe/Ovrica-V1.git
cd Ovrica-V1
```

**2️⃣ Install dependencies**
```bash
npm install
```

**3️⃣ Configure environment**
```bash
cp .env.example .env
# Edit .env with your configuration
```

**4️⃣ Start the bot**
```bash
npm start
```

</details>

---

## 🔌 **Pairing & Connection**

> 🎯 Ovrica-V1 uses **WebSocket** technology for secure and fast pairing

<div align="center">

### **🔗 Connection Process**

```mermaid
graph LR
    A[🚀 Start Bot] --> B[📡 WebSocket Opens]
    B --> C[🔢 Pairing Code Generated]
    C --> D[📱 Enter Code in WhatsApp]
    D --> E[✅ Connected!]
```

</div>

### **📋 Step-by-Step Guide**

<table>
<tr>
<td width="5%">1️⃣</td>
<td width="95%">

**Start the bot**
```bash
npm start
```
</td>
</tr>
<tr>
<td>2️⃣</td>
<td>

**Watch the terminal** - A WebSocket connection will be established and a pairing code will be displayed
```
🔗 WebSocket Connected
🔢 Your Pairing Code: XXXX-XXXX
```
</td>
</tr>
<tr>
<td>3️⃣</td>
<td>

**Open WhatsApp** on your phone
- Go to **⚙️ Settings** → **📱 Linked Devices**
- Tap **🔗 Link a Device**
- Select **📞 Link with phone number instead**
</td>
</tr>
<tr>
<td>4️⃣</td>
<td>

**Enter the pairing code** shown in your terminal
</td>
</tr>
<tr>
<td>5️⃣</td>
<td>

**Success!** ✅ Your bot is now connected and ready
```
✅ Successfully Connected!
🤖 Ovrica-V1 is now active
```
</td>
</tr>
</table>

### **🎯 Connection Features**

<div align="center">

| Feature | Description |
|---------|-------------|
| 🚫 **No QR Code** | Direct pairing code method |
| 🔌 **WebSocket** | Secure and fast protocol |
| 🔄 **Auto Reconnect** | Maintains stable connection |
| 💾 **Session Saved** | Stays logged in after restart |

</div>

---

## 📖 **Usage**

### **🎮 Basic Commands**

<div align="center">

| Command | Description | Example |
|---------|-------------|---------|
| `!help` | 📚 Display all commands | `!help` |
| `!ping` | 🏓 Check response time | `!ping` |
| `!info` | ℹ️ Get bot information | `!info` |
| `!menu` | 📋 Show command menu | `!menu` |
| `!status` | 📊 Check bot status | `!status` |

</div>

### **⚙️ Configuration**

Edit `config.js` to customize:

```javascript
{
  prefix: '!',           // 🎯 Command prefix
  botName: 'Ovrica-V1',  // 🤖 Bot name
  owner: 'YourName',     // 👤 Owner info
  autoRead: true,        // 📖 Auto-read messages
  selfReply: false       // 💬 Reply to own messages
}
```

---

## 🛠️ **Development**

### **📁 Project Structure**

```
🌳 Ovrica-V1/
├── 📂 assets/           # 🖼️ Images and media files
├──          # ⚡ Command modules
├── 📂            # ⚙️ Configuration files
├── 📂 utils/         # 🎯 Event handlers
├── 📂 lib/              # 🔧 Utility functions
├── 📂 node_modules/     # 📦 Dependencies
├── 📄 .env              # 🔐 Environment variables
├── 📄 .gitignore        # 🚫 Git ignore file
├── 📄 config.js         # ⚙️ Main configuration
├── 📄 index.js          # 🚀 Entry point
├── 📄 package.json      # 📦 Project metadata
└── 📄 README.md         # 📖 Documentation
```

### **➕ Adding New Commands**

Create a new file in `commands/` directory:

```javascript
module.exports = {
  name: '✨ commandname',
  category: '📚 category',
  description: '📝 Command description',
  usage: '💡 !commandname <args>',
  
  execute: async (client, message, args) => {
    // 🎯 Your command logic here
    await message.reply('✅ Command executed!');
  }
};
```

---

## 🤝 **Contributing**

<div align="center">

### **We 💜 Contributions!**

Contributions make the open-source community amazing. Any contributions are **greatly appreciated**!

</div>

**🔧 How to Contribute:**

1. 🍴 Fork the repository
2. 🌿 Create your feature branch
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. 💾 Commit your changes
   ```bash
   git commit -m '✨ Add some AmazingFeature'
   ```
4. 📤 Push to the branch
   ```bash
   git push origin feature/AmazingFeature
   ```
5. 🎉 Open a Pull Request

---

## 📝 **License**

<div align="center">

This project is licensed under the **MIT License**

See [LICENSE](LICENSE) for more information

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

</div>

---

## 👨‍💻 **Author**

<div align="center">

### **Kelvin Agbe** 👨‍💻

[![GitHub](https://img.shields.io/badge/GitHub-kelvinagbe-181717?style=for-the-badge&logo=github)](https://github.com/kelvinagbe)
[![Repository](https://img.shields.io/badge/Repository-Ovrica--V1-blueviolet?style=for-the-badge&logo=github)](https://github.com/kelvinagbe/Ovrica-V1)
[![WhatsApp](https://img.shields.io/badge/WhatsApp-Contact-25D366?style=for-the-badge&logo=whatsapp)](https://wa.me/yourphonenumber)

</div>

---

## 🙏 **Acknowledgments**

<div align="center">

💚 Thanks to the **WhatsApp Web.js** community

⭐ All **contributors** who help improve this project

🎯 Open source **libraries** that made this possible

</div>

---

## 📞 **Support**

<div align="center">

### **Need Help?** 🤔

[![Issues](https://img.shields.io/badge/Report-Issues-red?style=for-the-badge&logo=github)](https://github.com/kelvinagbe/Ovrica-V1/issues)
[![WhatsApp Group](https://img.shields.io/badge/Join-WhatsApp%20Group-25D366?style=for-the-badge&logo=whatsapp)](https://chat.whatsapp.com/yourlink)
[![Contact](https://img.shields.io/badge/Contact-Developer-blue?style=for-the-badge&logo=telegram)](https://t.me/yourhandle)

</div>

---

## ⚠️ **Disclaimer**

<div align="center">

> ⚡ This bot is **not affiliated** with WhatsApp or Meta.
> 
> 📜 Use at your own risk. Comply with WhatsApp's Terms of Service.
> 
> 🔒 Always respect user privacy and data protection laws.

</div>

---

## 🔄 **Updates & Changelog**

<div align="center">

### **Stay Updated!** 📣

⭐ Star this repository • 👀 Watch for releases • 📢 Follow for updates

</div>

<details>
<summary><b>📋 Version History</b></summary>

### **v1.0.0** (Current)
- ✅ Initial release
- ✅ WebSocket pairing system
- ✅ Core command system
- ✅ Group management features
- ✅ Auto-reconnect functionality

</details>

---

<div align="center">

### 💖 **Made with Love by Ovrica-V1 Team** 💖

```ascii
╔══════════════════════════════════════╗
║                                      ║
║     ⭐ Star us on GitHub! ⭐        ║
║                                      ║
║   Thank you for using Ovrica-V1!    ║
║                                      ║
╔══════════════════════════════════════╝
```

**[⬆ Back to Top](#-ovrica-v1-)**

---

![Footer](https://capsule-render.vercel.app/api?type=waving&color=gradient&height=100&section=footer)

</div>