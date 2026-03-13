import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import db from "./src/database.ts";
import { v4 as uuidv4 } from "uuid";
import { generateQuestions, generateRescueQuestion } from "./src/geminiService.ts";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  app.use(express.json());

  // API Routes
  app.post("/api/games", (req, res) => {
    const { title, subject, grade, time_limit } = req.body;
    const id = uuidv4();
    const join_code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    db.prepare("INSERT INTO games (id, title, subject, grade, join_code, time_limit) VALUES (?, ?, ?, ?, ?, ?)")
      .run(id, title, subject, grade, join_code, time_limit || 10);
    
    res.json({ id, join_code });
  });

  app.get("/api/games", (req, res) => {
    const games = db.prepare("SELECT * FROM games ORDER BY created_at DESC").all();
    res.json(games);
  });

  app.get("/api/games/:id", (req, res) => {
    const game = db.prepare("SELECT * FROM games WHERE id = ?").get(req.params.id) as any;
    const questions = db.prepare("SELECT * FROM questions WHERE game_id = ? ORDER BY sort_order ASC").all(req.params.id) as any[];
    res.json({ ...game, questions: questions.map(q => ({ ...q, options: JSON.parse(q.options) })) });
  });

  app.post("/api/games/:id/generate", async (req, res) => {
    const { content, count } = req.body;
    const game = db.prepare("SELECT subject, grade FROM games WHERE id = ?").get(req.params.id) as any;
    
    try {
      const questions = await generateQuestions({
        subject: game.subject,
        grade: game.grade,
        content,
        count: count || 10
      });

      const insert = db.prepare("INSERT INTO questions (id, game_id, text, type, options, correct_answer, explanation, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      
      db.transaction(() => {
        questions.forEach((q: any, index: number) => {
          insert.run(uuidv4(), req.params.id, q.text, q.type, JSON.stringify(q.options), q.correct_answer, q.explanation || "", index);
        });
      })();

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to generate questions" });
    }
  });

  // Socket.io Logic
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join_game", ({ joinCode, playerName }) => {
      const game = db.prepare("SELECT * FROM games WHERE join_code = ?").get(joinCode) as any;
      if (!game) {
        socket.emit("error", "Game not found");
        return;
      }

      const playerId = uuidv4();
      db.prepare("INSERT INTO players (id, game_id, socket_id, name) VALUES (?, ?, ?, ?)")
        .run(playerId, game.id, socket.id, playerName);

      socket.join(game.id);
      socket.emit("joined", { playerId, gameId: game.id, gameTitle: game.title });
      
      // Notify teacher
      io.to(game.id).emit("player_joined", { id: playerId, name: playerName });
    });

    socket.on("teacher_join", (gameId) => {
      socket.join(gameId);
      const players = db.prepare("SELECT id, name, status FROM players WHERE game_id = ?").all(gameId);
      socket.emit("sync_players", players);
    });

    socket.on("start_game", (gameId) => {
      db.prepare("UPDATE games SET status = 'playing', current_question_index = 0 WHERE id = ?").run(gameId);
      const question = db.prepare("SELECT * FROM questions WHERE game_id = ? AND sort_order = 0").get(gameId) as any;
      
      if (question) {
        io.to(gameId).emit("game_started", { 
          question: { ...question, options: JSON.parse(question.options) },
          index: 0 
        });
      }
    });

    socket.on("submit_answer", ({ gameId, playerId, answer }) => {
      const game = db.prepare("SELECT current_question_index FROM games WHERE id = ?").get(gameId) as any;
      const question = db.prepare("SELECT correct_answer FROM questions WHERE game_id = ? AND sort_order = ?")
        .get(gameId, game.current_question_index) as any;

      const isCorrect = answer === question.correct_answer;
      
      if (!isCorrect) {
        db.prepare("UPDATE players SET status = 'eliminated', eliminated_at_question = ? WHERE id = ?")
          .run(game.current_question_index, playerId);
      } else {
        db.prepare("UPDATE players SET score = score + 1 WHERE id = ?").run(playerId);
      }

      socket.emit("answer_result", { isCorrect, correctAnswer: question.correct_answer });
    });

    socket.on("next_question", (gameId) => {
      const game = db.prepare("SELECT current_question_index FROM games WHERE id = ?").get(gameId) as any;
      const nextIndex = game.current_question_index + 1;
      
      const question = db.prepare("SELECT * FROM questions WHERE game_id = ? AND sort_order = ?")
        .get(gameId, nextIndex) as any;

      if (question) {
        db.prepare("UPDATE games SET current_question_index = ? WHERE id = ?").run(nextIndex, gameId);
        io.to(gameId).emit("new_question", { 
          question: { ...question, options: JSON.parse(question.options) },
          index: nextIndex 
        });
      } else {
        db.prepare("UPDATE games SET status = 'finished' WHERE id = ?").run(gameId);
        const winners = db.prepare("SELECT name FROM players WHERE game_id = ? AND status = 'active'").all(gameId);
        io.to(gameId).emit("game_finished", { winners });
      }
    });

    socket.on("rescue_players", (gameId) => {
      db.prepare("UPDATE players SET status = 'active' WHERE game_id = ? AND status = 'eliminated'").run(gameId);
      io.to(gameId).emit("players_rescued");
    });

    socket.on("trigger_rescue_mission", async (gameId) => {
      const game = db.prepare("SELECT subject, grade FROM games WHERE id = ?").get(gameId) as any;
      try {
        const question = await generateRescueQuestion(game.subject, game.grade);
        io.to(gameId).emit("rescue_question", { question });
      } catch (error) {
        console.error(error);
      }
    });

    socket.on("submit_rescue_answer", ({ gameId, playerId, answer, correctAnswer }) => {
      if (answer === correctAnswer) {
        // Rescue 10 random players
        const eliminated = db.prepare("SELECT id FROM players WHERE game_id = ? AND status = 'eliminated'").all(gameId) as any[];
        const toRescue = eliminated.sort(() => 0.5 - Math.random()).slice(0, 10);
        
        const rescuedIds = toRescue.map(p => p.id);
        if (rescuedIds.length > 0) {
          const placeholders = rescuedIds.map(() => '?').join(',');
          db.prepare(`UPDATE players SET status = 'active' WHERE id IN (${placeholders})`)
            .run(...rescuedIds);
        }

        const rescuer = db.prepare("SELECT name FROM players WHERE id = ?").get(playerId) as any;
        
        io.to(gameId).emit("players_rescued", { 
          count: rescuedIds.length, 
          rescuerName: rescuer?.name || "Một người bạn",
          rescuedIds: rescuedIds
        });
      }
    });

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  const PORT = 3000;
  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
