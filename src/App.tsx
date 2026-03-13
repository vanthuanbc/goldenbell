import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { 
  Trophy, 
  Users, 
  Play, 
  Settings, 
  Plus, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Bell,
  ArrowRight,
  RefreshCw,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// --- Components ---

const Button = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }: any) => {
  const baseStyles = "px-6 py-3 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants: any = {
    primary: "bg-amber-500 text-white hover:bg-amber-600 shadow-lg shadow-amber-500/20",
    secondary: "bg-slate-800 text-white hover:bg-slate-900",
    outline: "border-2 border-slate-200 text-slate-600 hover:border-amber-500 hover:text-amber-500",
    danger: "bg-red-500 text-white hover:bg-red-600",
    success: "bg-emerald-500 text-white hover:bg-emerald-600",
  };
  
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyles} ${variants[variant]} ${className}`}>
      {children}
    </button>
  );
};

const Card = ({ children, className = '' }: any) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 ${className}`}>
    {children}
  </div>
);

const BellAnimation = ({ active }: { active: boolean }) => (
  <AnimatePresence>
    {active && (
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.5 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none bg-red-500/20 backdrop-blur-sm"
      >
        <motion.div
          animate={{ 
            rotate: [0, -20, 20, -20, 20, 0],
            scale: [1, 1.2, 1.2, 1.2, 1.2, 1]
          }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="bg-white p-12 rounded-full shadow-2xl border-8 border-amber-500"
        >
          <Bell size={120} className="text-amber-500 fill-amber-500" />
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-center mt-4"
          >
            <h2 className="text-4xl font-black text-red-600 italic">BẠN ĐÃ BỊ LOẠI!</h2>
          </motion.div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// --- Pages ---

const HomePage = () => {
  const [joinCode, setJoinCode] = useState('');
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center space-y-8"
      >
        <div className="space-y-2">
          <div className="w-20 h-20 bg-amber-500 rounded-3xl flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
            <Bell className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900">EduGoldenBell</h1>
          <p className="text-slate-500">Nền tảng Rung Chuông Vàng trực tuyến</p>
        </div>

        <Card className="space-y-4">
          <div className="space-y-2 text-left">
            <label className="text-sm font-semibold text-slate-700">Mã phòng chơi</label>
            <input 
              type="text" 
              placeholder="Ví dụ: AB1234"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none uppercase font-mono text-center text-2xl tracking-widest"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
            />
          </div>
          <Button 
            className="w-full" 
            onClick={() => navigate(`/play/${joinCode}`)}
            disabled={!joinCode}
          >
            Tham gia ngay <ArrowRight size={20} />
          </Button>
        </Card>

        <div className="pt-4">
          <Link to="/admin" className="text-amber-600 font-semibold hover:underline flex items-center justify-center gap-2">
            <LayoutDashboard size={18} /> Dành cho Giáo viên
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

const AdminDashboard = () => {
  const [games, setGames] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/games')
      .then(res => res.json())
      .then(setGames);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Quản lý trò chơi</h1>
            <p className="text-slate-500">Tạo và điều hành các buổi Rung Chuông Vàng</p>
          </div>
          <Button onClick={() => navigate('/admin/create')}>
            <Plus size={20} /> Tạo trò chơi mới
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <Card key={game.id} className="hover:shadow-md transition-shadow cursor-pointer group" onClick={() => navigate(`/admin/game/${game.id}`)}>
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <BookOpen className="text-amber-600" size={24} />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                    game.status === 'playing' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {game.status}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">{game.title}</h3>
                  <p className="text-slate-500 text-sm">{game.subject} • Khối {game.grade}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-500 pt-2 border-t border-slate-50">
                  <div className="flex items-center gap-1">
                    <Clock size={16} /> {game.time_limit}s
                  </div>
                  <div className="flex items-center gap-1">
                    <Users size={16} /> Mã: <span className="font-mono font-bold text-slate-900">{game.join_code}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

const CreateGamePage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: 'Tiếng Anh',
    grade: '11',
    time_limit: 15,
    content: '',
    count: 10
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const game = await res.json();
      
      if (formData.content) {
        await fetch(`/api/games/${game.id}/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ content: formData.content, count: formData.count })
        });
      }
      
      navigate(`/admin/game/${game.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <form onSubmit={handleSubmit} className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Tạo trò chơi mới</h2>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Tên trò chơi</label>
                <input 
                  required
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                  placeholder="Ví dụ: Rung Chuông Vàng - Unit 1"
                  value={formData.title}
                  onChange={e => setFormData({...formData, title: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Môn học</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                    value={formData.subject}
                    onChange={e => setFormData({...formData, subject: e.target.value})}
                  >
                    <option>Tiếng Anh</option>
                    <option>Toán học</option>
                    <option>Ngữ văn</option>
                    <option>Vật lý</option>
                    <option>Hóa học</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Khối lớp</label>
                  <select 
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                    value={formData.grade}
                    onChange={e => setFormData({...formData, grade: e.target.value})}
                  >
                    {[10, 11, 12].map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Nội dung ôn tập (AI sẽ tạo câu hỏi từ đây)</label>
                <textarea 
                  className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500 h-32"
                  placeholder="Nhập kiến thức trọng tâm, từ vựng hoặc đoạn văn..."
                  value={formData.content}
                  onChange={e => setFormData({...formData, content: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Số câu hỏi</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                    value={formData.count}
                    onChange={e => setFormData({...formData, count: parseInt(e.target.value)})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Thời gian (giây)</label>
                  <input 
                    type="number"
                    className="w-full px-4 py-2 rounded-lg border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500"
                    value={formData.time_limit}
                    onChange={e => setFormData({...formData, time_limit: parseInt(e.target.value)})}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => navigate('/admin')}>Hủy</Button>
              <Button type="submit" className="flex-1" disabled={loading}>
                {loading ? <RefreshCw className="animate-spin" /> : 'Tạo trò chơi'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

const TeacherGameControl = () => {
  const { id } = useParams();
  const [game, setGame] = useState<any>(null);
  const [players, setPlayers] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [rescueQuestion, setRescueQuestion] = useState<any>(null);
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [eliminatedThisTurn, setEliminatedThisTurn] = useState<string[]>([]);

  useEffect(() => {
    fetch(`/api/games/${id}`)
      .then(res => res.json())
      .then(data => {
        setGame(data);
        setGameState(data.status);
      });

    const newSocket = io();
    setSocket(newSocket);

    newSocket.emit('teacher_join', id);

    newSocket.on('sync_players', (syncedPlayers) => {
      setPlayers(syncedPlayers);
      // Check for newly eliminated players to show bell
      const newlyEliminated = syncedPlayers
        .filter((p: any) => p.status === 'eliminated')
        .map((p: any) => p.id);
      
      setEliminatedThisTurn(prev => {
        const diff = newlyEliminated.filter(id => !prev.includes(id));
        if (diff.length > 0) {
          setTimeout(() => setEliminatedThisTurn([]), 3000);
          return [...prev, ...diff];
        }
        return prev;
      });
    });
    newSocket.on('player_joined', (player) => {
      setPlayers(prev => [...prev, { ...player, status: 'active' }]);
    });
    newSocket.on('game_started', ({ question }) => {
      setCurrentQuestion(question);
      setGameState('playing');
    });
    newSocket.on('new_question', ({ question }) => {
      setCurrentQuestion(question);
      setRescueQuestion(null);
    });
    newSocket.on('rescue_question', ({ question }) => {
      setRescueQuestion(question);
    });
    newSocket.on('players_rescued', () => {
      setRescueQuestion(null);
      // Teacher needs to re-sync players to see who was rescued
      newSocket.emit('teacher_join', id);
    });
    newSocket.on('game_finished', () => {
      setGameState('finished');
    });

    return () => { newSocket.close(); };
  }, [id]);

  const handleStart = () => {
    socket?.emit('start_game', id);
  };

  const handleNext = () => {
    socket?.emit('next_question', id);
  };

  const handleRescue = () => {
    socket?.emit('trigger_rescue_mission', id);
  };

  const handleFullRescue = () => {
    socket?.emit('rescue_players', id);
  };

  if (!game) return null;

  const activePlayers = players.filter(p => p.status === 'active');

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{game.title}</h1>
              <p className="text-slate-400">Mã tham gia: <span className="text-amber-500 font-mono text-2xl font-bold">{game.join_code}</span></p>
            </div>
            <div className="flex gap-4">
              {gameState === 'waiting' && <Button onClick={handleStart} variant="primary"><Play size={20} /> Bắt đầu</Button>}
              {gameState === 'playing' && (
                <>
                  <Button onClick={handleRescue} variant="outline" className="text-white border-white/20"><RefreshCw size={20} /> Thử thách cứu trợ</Button>
                  <Button onClick={handleFullRescue} variant="outline" className="text-white border-white/20">Cứu tất cả</Button>
                  <Button onClick={handleNext} variant="primary">Câu tiếp theo <ArrowRight size={20} /></Button>
                </>
              )}
            </div>
          </div>

          {gameState === 'playing' && rescueQuestion && (
            <Card className="bg-amber-500 border-none text-white p-10 animate-pulse">
              <div className="space-y-6 text-center">
                <h2 className="text-4xl font-black italic">NHIỆM VỤ CỨU TRỢ!</h2>
                <p className="text-xl">Đang có một câu hỏi phụ dành cho các bạn đang thi đấu...</p>
                <div className="bg-white/20 p-6 rounded-2xl">
                  <p className="text-2xl font-bold">{rescueQuestion.text}</p>
                </div>
              </div>
            </Card>
          )}

          {gameState === 'playing' && currentQuestion && !rescueQuestion && (
            <Card className="bg-slate-800 border-none text-white p-10">
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <span className="text-amber-500 font-bold uppercase tracking-widest">Câu hỏi {currentQuestion.sort_order + 1}</span>
                  <div className="flex items-center gap-2 text-2xl font-mono">
                    <Clock className="text-amber-500" /> {game.time_limit}s
                  </div>
                </div>
                <h2 className="text-3xl font-bold leading-tight">{currentQuestion.text}</h2>
                <div className="grid grid-cols-2 gap-4">
                  {currentQuestion.options.map((opt: string, i: number) => (
                    <div key={i} className={`p-4 rounded-xl border-2 ${opt === currentQuestion.correct_answer ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700'}`}>
                      <span className="font-bold mr-2">{String.fromCharCode(65 + i)}.</span> {opt}
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          {gameState === 'waiting' && (
            <div className="h-96 flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-3xl space-y-4">
              <Users size={64} className="text-slate-700" />
              <p className="text-slate-500 text-xl">Đang chờ học sinh tham gia...</p>
              <p className="text-4xl font-bold text-amber-500">{players.length}</p>
            </div>
          )}

          {gameState === 'finished' && (
            <div className="text-center space-y-6 py-20">
              <Trophy size={80} className="text-amber-500 mx-auto" />
              <h2 className="text-5xl font-bold">TRÒ CHƠI KẾT THÚC</h2>
              <div className="text-2xl text-slate-400">
                Chúc mừng các bạn đã Rung Chuông Vàng!
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-slate-800 border-none text-white">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users size={20} /> Người chơi ({activePlayers.length}/{players.length})
            </h3>
            <div className="grid grid-cols-5 gap-2 max-h-[500px] overflow-y-auto pr-2">
              {players.map((p) => (
                <div 
                  key={p.id} 
                  title={p.name}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all duration-500 relative ${
                    p.status === 'active' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-red-500/20 text-red-500 border border-red-500/30'
                  }`}
                >
                  {p.name.substring(0, 2).toUpperCase()}
                  {eliminatedThisTurn.includes(p.id) && (
                    <motion.div
                      animate={{ rotate: [-20, 20, -20, 20, 0] }}
                      className="absolute -top-2 -right-2 bg-amber-500 text-white p-1 rounded-full shadow-lg"
                    >
                      <Bell size={12} />
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

const StudentPlayPage = () => {
  const { code } = useParams();
  const [playerName, setPlayerName] = useState('');
  const [isJoined, setIsJoined] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameInfo, setGameInfo] = useState<any>(null);
  const [currentQuestion, setCurrentQuestion] = useState<any>(null);
  const [rescueQuestion, setRescueQuestion] = useState<any>(null);
  const [status, setStatus] = useState<'active' | 'eliminated'>('active');
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showBell, setShowBell] = useState(false);

  useEffect(() => {
    const newSocket = io();
    setSocket(newSocket);

    newSocket.on('joined', (data) => {
      setIsJoined(true);
      setGameInfo(data);
      localStorage.setItem('playerId', data.playerId);
    });

    newSocket.on('game_started', ({ question }) => {
      setCurrentQuestion(question);
      setSelectedAnswer(null);
      setResult(null);
      setTimeLeft(15); // Default time
    });

    newSocket.on('new_question', ({ question }) => {
      setCurrentQuestion(question);
      setSelectedAnswer(null);
      setResult(null);
      setTimeLeft(15);
    });

    newSocket.on('answer_result', (data) => {
      setResult(data);
      if (!data.isCorrect) {
        setStatus('eliminated');
        setShowBell(true);
        setTimeout(() => setShowBell(false), 3000);
      }
    });

    newSocket.on('players_rescued', (data) => {
      setRescueQuestion(null);
      setResult(null);
      
      const myId = localStorage.getItem('playerId');
      if (data?.rescuedIds?.includes(myId)) {
        setStatus('active');
        alert(`Chúc mừng! Bạn đã được cứu bởi ${data.rescuerName}!`);
      } else if (data?.count > 0) {
        alert(`${data.count} bạn đã được cứu bởi ${data.rescuerName}!`);
      } else {
        alert(`Nhiệm vụ cứu trợ kết thúc bởi ${data.rescuerName}!`);
      }
    });

    newSocket.on('error', (msg) => alert(msg));

    return () => { newSocket.close(); };
  }, []);

  useEffect(() => {
    if (timeLeft > 0 && currentQuestion && !result) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [timeLeft, currentQuestion, result]);

  const handleJoin = () => {
    if (!playerName) return;
    socket?.emit('join_game', { joinCode: code, playerName });
  };

  const handleAnswer = (answer: string) => {
    if (status === 'eliminated' && !rescueQuestion) return;
    if (result || timeLeft === 0) return;
    
    setSelectedAnswer(answer);
    
    if (rescueQuestion) {
      socket?.emit('submit_rescue_answer', {
        gameId: gameInfo.gameId,
        playerId: gameInfo.playerId,
        answer,
        correctAnswer: rescueQuestion.correct_answer
      });
    } else {
      socket?.emit('submit_answer', { 
        gameId: gameInfo.gameId, 
        playerId: gameInfo.playerId, 
        answer 
      });
    }
  };

  if (!isJoined) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">Tham gia phòng {code}</h1>
            <p className="text-slate-500">Nhập tên của bạn để bắt đầu</p>
          </div>
          <input 
            className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-amber-500 text-center text-xl font-bold"
            placeholder="Tên của bạn"
            value={playerName}
            onChange={e => setPlayerName(e.target.value)}
          />
          <Button className="w-full" onClick={handleJoin} disabled={!playerName}>Vào phòng</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <BellAnimation active={showBell} />
      <header className="bg-white border-b border-slate-100 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-white font-bold">
            <Bell size={20} />
          </div>
          <div>
            <h2 className="font-bold text-slate-900">{gameInfo.gameTitle}</h2>
            <p className="text-xs text-slate-500">{playerName} • {status === 'active' ? 'Đang thi đấu' : 'Đã bị loại'}</p>
          </div>
        </div>
        <div className={`px-4 py-1 rounded-full font-bold text-sm ${status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
          {status === 'active' ? 'ACTIVE' : 'OUT'}
        </div>
      </header>

      <main className="flex-1 p-6 flex flex-col items-center justify-center max-w-2xl mx-auto w-full space-y-8">
        {rescueQuestion ? (
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full space-y-6"
          >
            <div className="bg-amber-500 p-6 rounded-3xl text-white text-center shadow-xl shadow-amber-500/20">
              <h2 className="text-2xl font-black italic mb-2">THỬ THÁCH CỨU TRỢ!</h2>
              <p className="opacity-90">Trả lời đúng để cứu 10 bạn bị loại!</p>
            </div>
            
            <Card className="space-y-6">
              <h3 className="text-2xl font-bold text-center">{rescueQuestion.text}</h3>
              <div className="grid grid-cols-1 gap-3">
                {rescueQuestion.options.map((opt: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => handleAnswer(opt)}
                    disabled={!!selectedAnswer}
                    className={`p-4 rounded-xl border-2 text-left font-bold transition-all ${
                      selectedAnswer === opt ? 'bg-amber-500 text-white border-amber-500' : 'border-slate-100 hover:border-amber-500'
                    }`}
                  >
                    {String.fromCharCode(65 + i)}. {opt}
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>
        ) : !currentQuestion ? (
          <div className="text-center space-y-4">
            <div className="animate-bounce">
              <Clock size={48} className="text-amber-500 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Đang chờ giáo viên bắt đầu...</h2>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div 
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full space-y-8"
            >
              <div className="text-center space-y-2">
                <div className="text-amber-600 font-bold tracking-widest uppercase">Câu {currentQuestion.sort_order + 1}</div>
                <h2 className="text-3xl font-bold text-slate-900">{currentQuestion.text}</h2>
              </div>

              <div className="flex justify-center">
                <div className={`w-20 h-20 rounded-full border-4 flex items-center justify-center text-3xl font-bold ${
                  timeLeft <= 5 ? 'border-red-500 text-red-500 animate-pulse' : 'border-amber-500 text-amber-500'
                }`}>
                  {timeLeft}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options.map((opt: string, i: number) => {
                  let bgColor = 'bg-white';
                  let borderColor = 'border-slate-200';
                  
                  if (selectedAnswer === opt) {
                    bgColor = 'bg-amber-50';
                    borderColor = 'border-amber-500';
                  }

                  if (result) {
                    if (opt === result.correctAnswer) {
                      bgColor = 'bg-emerald-500 text-white';
                      borderColor = 'border-emerald-500';
                    } else if (selectedAnswer === opt && !result.isCorrect) {
                      bgColor = 'bg-red-500 text-white';
                      borderColor = 'border-red-500';
                    }
                  }

                  return (
                    <button
                      key={i}
                      disabled={status === 'eliminated' || !!result || timeLeft === 0}
                      onClick={() => handleAnswer(opt)}
                      className={`w-full p-5 rounded-2xl border-2 text-left text-lg font-semibold transition-all duration-200 flex items-center gap-4 ${bgColor} ${borderColor} shadow-sm active:scale-95`}
                    >
                      <span className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-amber-500 group-hover:text-white">
                        {String.fromCharCode(65 + i)}
                      </span>
                      {opt}
                    </button>
                  );
                })}
              </div>

              {result && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className={`p-6 rounded-2xl text-center space-y-2 ${result.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                >
                  <div className="flex justify-center">
                    {result.isCorrect ? <CheckCircle size={48} /> : <XCircle size={48} />}
                  </div>
                  <h3 className="text-2xl font-bold">{result.isCorrect ? 'Chính xác!' : 'Rất tiếc...'}</h3>
                  <p>{result.isCorrect ? 'Bạn được tiếp tục thi đấu.' : 'Bạn đã bị loại khỏi sàn thi đấu.'}</p>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/create" element={<CreateGamePage />} />
        <Route path="/admin/game/:id" element={<TeacherGameControl />} />
        <Route path="/play/:code" element={<StudentPlayPage />} />
      </Routes>
    </Router>
  );
}
