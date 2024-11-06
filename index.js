import express from 'express';
const app = express();
const PORT = 3000;
import cors from 'cors';
import path from 'path';

app.use(cors({
  origin: '*'
}));


app.use(express.json());

const dataFilePath = path.join(__dirname, 'data.json');
let data = JSON.parse(fs.readFileSync(dataFilePath, 'utf8'));


function generatePetStats(type, personality) {
  const baseStats = {
    happiness: 50,
    health: 70,
    energy: 70,
    favorability: 0
  };

  const personalityStats = {
    playful: { happiness: 60, energy: 85 },
    lazy: { health: 85, energy: 50 },
    loyal: { happiness: 70, favorability: 15 },
    bold: { happiness: 55, health: 90 }
  };

  const typeStats = {
    cat: { favorability: 10 },
    dog: { health: 80 },
    dragon: { health: 90, energy: 70 }
  };

  return {
    ...baseStats,
    ...personalityStats[personality],
    ...typeStats[type]
  };
}

function logInteraction(petId, interactionType, result, stats) {
  if (!data.interactions[petId]) data.interactions[petId] = [];
  data.interactions[petId].push({
    timestamp: new Date(),
    type: interactionType,
    result: result,
    stats: { ...stats }
  });
  saveData();
}

function saveData() {
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf8');
}


app.post('/adopt', (req, res) => {
  const { id, type, name, personality } = req.body;
  if (data.pets.some(p => p.id === id)) {
    return res.status(400).json({ error: "Pet ID already exists" });
  }
  const stats = generatePetStats(type, personality);
  
  const newPet = {
    id: id.toString(),
    name: name || "Pet",
    type: type || "cat",
    personality: personality || "playful",
    stats: stats,
    adopted_date: new Date()
  };
  data.pets.push(newPet);
  saveData();
  
  res.status(201).json({ message: `Successfully adopted ${newPet.name}!`, pet: newPet });
});

app.post('/feed', (req, res) => {
  const { pet_id, food } = req.body;
  const pet = data.pets.find(p => p.id === pet_id);
  if (!pet) return res.status(404).json({ error: "Pet not found" });

  let reaction;
  if ((food === "fish" && pet.type === "cat") || (food === "bone" && pet.type === "dog")) {
    pet.stats.happiness += 10;
    pet.stats.energy += 5;
    reaction = "like it";
  } else if (food === "ice cream" && pet.personality === "playful") {
    pet.stats.happiness += 15;
    pet.stats.energy -= 5;
    reaction = "love it";
  } else {
    pet.stats.happiness -= 5;
    reaction = "not like it";
  }
  
  logInteraction(pet_id, "feed", reaction, pet.stats);
  res.json({ message: `${pet.name} was fed with ${food}.`, stats: pet.stats, reaction: reaction });
});

app.post('/play', (req, res) => {
  const { pet_id, activity } = req.body;
  const pet = data.pets.find(p => p.id === pet_id);
  if (!pet) return res.status(404).json({ error: "Pet not found" });

  let reaction;
  if ((activity === "use_laser_pointer" && pet.type === "cat") || (activity === "fetch" && pet.type === "dog")) {
    pet.stats.happiness += 15;
    pet.stats.favorability += 5;
    reaction = "love it";
  } else if (activity === "fly" && pet.type === "dragon") {
    pet.stats.happiness += 20;
    pet.stats.energy -= 10;
    reaction = "excited";
  } else {
    pet.stats.happiness -= 5;
    reaction = "not like it";
  }
  
  logInteraction(pet_id, "play", reaction, pet.stats);
  res.json({ message: `${pet.name} played with ${activity}.`, stats: pet.stats, reaction: reaction });
});

app.get('/status/:pet_id', (req, res) => {
  const pet = data.pets.find(p => p.id === req.params.pet_id);
  if (!pet) return res.status(404).json({ error: "Pet not found" });

  const recentInteractions = data.interactions[pet.id] ? data.interactions[pet.id].slice(-5) : [];
  res.json({ pet: pet, recent_interactions: recentInteractions });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
