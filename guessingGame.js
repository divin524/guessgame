const readline = require("readline");
const bcrypt = require("bcrypt");
const connectDB = require("./db");
const User = require("./models/user");
const Score = require("./models/score");

const readLine = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

let currentUser = "";

async function startApp() {
  await connectDB();
  showAuthMenu();
}
startApp();


function isValidText(input) {
  return input && input.trim().length > 0;
}

function isValidNumber(input) {
  if (/^\d+$/.test(input)) return true; // whole number
  if (/^\d+\.\d+$/.test(input)) {
    console.log(` "${input}" is a decimal value. Enter a whole number between 1 and 100.`);
    return false;
  }
  console.log(` "${input}" is not a valid number. Enter a whole number between 1 and 100.`);
  return false;
}

// Auth
function showAuthMenu() {
  console.log("Welcome to Number Guessing Game");
  console.log("1. Register");
  console.log("2. Login");

  readLine.question("Choose an option: ", (choice) => {
    if (choice === "1") registerUser();
    else if (choice === "2") loginUser();
    else {
      console.log("Invalid choice!\n");
      showAuthMenu();
    }
  });
}

async function registerUser() {
  readLine.question("Enter username: ", async (username) => {
    if (!isValidText(username)) {
      console.log("Username cannot be empty\n");
      return showAuthMenu();
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      console.log("Username already exists\n");
      return showAuthMenu();
    }

    readLine.question("Enter password: ", async (password) => {
      if (!isValidText(password)) {
        console.log("Password cannot be empty\n");
        return showAuthMenu();
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      await User.create({ username, password: hashedPassword });

      console.log("Registration successful!\n");
      showAuthMenu();
    });
  });
}

async function loginUser() {
  readLine.question("Enter username: ", async (username) => {
    readLine.question("Enter password: ", async (password) => {
      const user = await User.findOne({ username });
      if (!user) {
        console.log("Invalid credentials\n");
        return showAuthMenu();
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        console.log("Invalid credentials\n");
        return showAuthMenu();
      }

      currentUser = username;
      console.log(`\nWelcome ${username}! Login successful.\n`);
      showLevelMenu();
    });
  });
}

// Level
function showLevelMenu() {
  console.log("1. Easy (10 chances)");
  console.log("2. Medium (5 chances)");
  console.log("3. Hard (3 chances)");
  console.log("4. Exit");

  readLine.question("Choice: ", (choice) => {
    let attempts, level;

    if (choice === "1") { attempts = 10; level = "Easy"; }
    else if (choice === "2") { attempts = 5; level = "Medium"; }
    else if (choice === "3") { attempts = 3; level = "Hard"; }
    else if (choice === "4") { return showCombinedLeaderboard(); }
    else { console.log("Invalid choice\n"); return showLevelMenu(); }

    startGame(attempts, level);
  });
}

// Game
function startGame(attemptsLeft, level) {
  const secret = Math.floor(Math.random() * 100) + 1;
  let used = 0;

  console.log(`\n🎮 ${level} Level | Guess between 1–100`);

  function askGuess() {
    if (attemptsLeft === 0) {
      console.log(`Game Over! Number was ${secret}\n`);
      saveScore(level, used); 
      return;
    }

    readLine.question("Enter your guess: ", (guess) => {
      if (!isValidNumber(guess)) return askGuess();

      const num = Number(guess);
      if (num < 1 || num > 100) {
        console.log(" Number must be between 1 and 100");
        return askGuess();
      }

      attemptsLeft--;
      used++;

      if (num === secret) {
        console.log(`🎉 You won in ${used} attempts!\n`);
        saveScore(level, used);
      } else {
        console.log(num > secret ? " Too high!" : " Too low!");
        askGuess();
      }
    });
  }

  askGuess();
}

// Score
async function saveScore(level, attempts) {
  try {
    const existing = await Score.findOne({ playerName: currentUser, level });

    
    if (!existing || attempts < existing.attempts) {
      await Score.findOneAndUpdate(
        { playerName: currentUser, level },
        { attempts },
        { upsert: true, new: true }
      );
    }

    showLeaderboard(level);
  } catch (err) {
    console.error("Error saving score:", err);
    readLine.close();
  }
}

// Level leaderboard
async function showLeaderboard(level) {
  try {
    const players = await Score.find({ level })
      .sort({ attempts: 1, createdAt: 1 })
      .limit(3);

    console.log(`\n🏆 ${level.toUpperCase()} LEADERBOARD`);
    if (players.length === 0) console.log("No players yet");
    else
      players.forEach((p, i) =>
        console.log(`${i + 1}. ${p.playerName} - ${p.attempts} attempts`)
      );

    console.log("");
    showLevelMenu();
  } catch (err) {
    console.error("Error fetching leaderboard:", err);
    readLine.close();
  }
}

// Final leaderboard
async function showCombinedLeaderboard() {
  try {
    const levels = ["Easy", "Medium", "Hard"];
    console.log("\nFINAL LEADERBOARDS");

    for (const level of levels) {
      const players = await Score.find({ level })
        .sort({ attempts: 1, createdAt: 1 })
        .limit(3);

      console.log(`\n${level}-level`);
      if (players.length === 0) console.log("No players yet");
      else
        players.forEach((p, i) =>
          console.log(`${i + 1}. ${p.playerName} - ${p.attempts}`)
        );
    }

    readLine.close();
  } catch (err) {
    console.error("Error fetching final leaderboard:", err);
    readLine.close();
  }
}




