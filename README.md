# Carbon Clash - Sustainable Monopoly Game

Carbon Clash is a multiplayer Monopoly-inspired game with an environmental theme, combining economic development and ecological protection. Players must balance economic profit, carbon emissions, and sustainability, experiencing the challenges of sustainable growth.

---

## Key Features

### Core Gameplay
- Classic 40-tile Monopoly-style board
- Building system with three types: factories, housing, and green buildings, each with distinct economic and environmental effects
- Upgrade mechanics that enhance building performance
- Random event system to influence game progress
- Policy choices that require strategic decision-making

### AI Opponents
- Business AI: prioritizes profit maximization with smart investment strategies
- Environmental AI: prioritizes sustainable choices and environmental protection
- AI agents analyze the game state to make rational building and policy decisions

### Game Objectives
Players must balance three key indicators:
- Money: economic profit and financial management
- CO2: carbon emission control
- Ecology: contribution to environmental protection

---

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/YuxuanSun123/HCI-Carbon-Clash.git
cd HCI-Carbon-Clash
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open the browser at:
```
http://localhost:5173
```

---

## Optional: AI Integration (DeepSeek)

To enable intelligent AI opponents, you can configure the DeepSeek API.

1. Obtain an API Key:
   - Register on [DeepSeek Platform](https://platform.deepseek.com/)
   - Retrieve your API key

2. Create a `.env` file:
```bash
VITE_DEEPSEEK_API_KEY=your_api_key_here
```

3. Restart the server:
```bash
npm run dev
```

See [DEEPSEEK_SETUP.md](./DEEPSEEK_SETUP.md) for detailed instructions.

---

## Game Rules

### Basic Rules
1. Turn-based dice rolling and movement
2. Build structures on available tiles
3. Earn income from buildings each turn
4. Buildings affect both CO2 emissions and ecology
5. Random events can impact all players

### Building Types

| Type       | Characteristics     | Upgrade Effects                |
|------------|---------------------|--------------------------------|
| Factory    | High income, high CO2 | Increased income and emissions |
| Housing    | Balanced             | Overall improvements           |
| Green Bldg | Eco-friendly         | Higher ecology and some income |

### Winning Conditions
The player with the highest final score wins. Scores are calculated based on:
- Total money
- Environmental impact (CO2 vs ecology)
- Building asset value

---

## Technology Stack

### Frontend
- React 19
- TypeScript
- Vite

### Styling
- Tailwind CSS
- Responsive design
- Modern UI with gradients, shadows, and animations

### AI Integration
- DeepSeek API
- Secure API key management with environment variables

---

## Project Structure

```
src/
├── components/          # React components
│   ├── GameMap.tsx      # Game board
│   ├── DiceRoller.tsx   # Dice roller
│   ├── BuildMenu.tsx    # Building selection
│   └── ...
├── hooks/               # Custom React hooks
│   ├── useGameState.ts
│   └── useMultiPlayerGameState.ts
├── data/                # Static game data
│   ├── buildings.ts
│   └── events.ts
├── services/            # External integrations
│   └── deepseekApi.ts
└── utils/               # Utility functions
    └── path.ts
```

---

## UI Design Highlights

- 3D-inspired board layout
- Interactive animations on hover and click
- Clean color scheme blending green and blue tones
- Responsive layout for desktop and mobile
- Intuitive icons for buildings and stats

---

## Development Commands

```bash
# Run in development mode
npm run dev

# Build for production
npm run build

# Lint code
npm run lint

# Preview production build
npm run preview
```

---

## Contribution Guide

1. Fork the project
2. Create a feature branch (`git checkout -b feature/FeatureName`)
3. Commit changes (`git commit -m 'Add new feature'`)
4. Push to branch (`git push origin feature/FeatureName`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Roadmap

- Multi-language support
- Additional building types
- Online multiplayer
- Achievement system
- Data analytics dashboard
- Customizable rule sets

---

**Begin your sustainable development journey in Carbon Clash—find the balance between growth and protection.**
