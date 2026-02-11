
import React, { useState, useEffect } from 'react';
import { db } from '../firebaseConfig';
import { doc, setDoc, getDoc, collection, query, where, getDocs, updateDoc, serverTimestamp, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Subject, BattleRoom, AppMode } from '../types';
import { AppUser } from '../users';
import { BattleArena } from './BattleArena';
import { QUESTIONS_SPS_FILTERED } from '../constants';

interface Props {
  currentUser: AppUser;
  subject: Subject;
  stats: any;
  onExit: () => void;
}

export const BattleManager: React.FC<Props> = ({ currentUser, subject, stats, onExit }) => {
  const [view, setView] = useState<'JOIN' | 'LOBBY' | 'ARENA'>('JOIN');
  const [roomCode, setRoomCode] = useState('');
  const [currentRoom, setCurrentRoom] = useState<BattleRoom | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (view === 'LOBBY' && currentRoom) {
      const unsub = onSnapshot(doc(db, "battles", currentRoom.id), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as BattleRoom;
          if (data.status === 'STARTING' || data.status === 'IN_PROGRESS') {
            setCurrentRoom(data);
            setView('ARENA');
          }
        }
      });
      return () => unsub();
    }
  }, [view, currentRoom]);

  const canCreate = () => {
    const today = new Date().toISOString().split('T')[0];
    if (stats?.lastBattleDate === today && (stats?.battlesPlayedToday || 0) >= 2) {
      return false;
    }
    return true;
  };

  const createRoom = async () => {
    if (!canCreate()) {
      setError("Dnes jsi už vytvořil 2 hry. Můžeš se už jen připojit ke kódům od kamarádů (to je neomezené)!");
      return;
    }

    setLoading(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const roomId = `room_${Date.now()}`;
    
    // Používáme filtrovaný seznam pro bitvu
    const shuffled = [...QUESTIONS_SPS_FILTERED].sort(() => 0.5 - Math.random()).slice(0, 20);
    const questionIds = shuffled.map(q => q.id);

    const newRoom: BattleRoom = {
      id: roomId,
      code,
      subject,
      status: 'WAITING',
      questions: questionIds,
      players: {
        [currentUser.uid]: {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          progress: 0,
          score: 0,
          finished: false,
          ready: true
        }
      },
      createdAt: serverTimestamp()
    };

    try {
      await setDoc(doc(db, "battles", roomId), newRoom);
      
      const userRef = doc(db, "users", currentUser.uid);
      const today = new Date().toISOString().split('T')[0];
      const newCount = stats?.lastBattleDate === today ? (stats?.battlesPlayedToday || 0) + 1 : 1;
      
      await setDoc(userRef, { 
        displayName: currentUser.displayName,
        statsSPS: {
          battlesPlayedToday: newCount,
          lastBattleDate: today
        }
      }, { merge: true });

      setCurrentRoom(newRoom);
      setView('LOBBY');
    } catch (e) {
      console.error(e);
      setError("Nepodařilo se vytvořit místnost.");
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!roomCode || roomCode.length !== 6) {
        setError("Zadej platný 6místný kód.");
        return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const q = query(collection(db, "battles"), where("code", "==", roomCode), where("status", "==", "WAITING"));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        setError("Kód neexistuje, místnost je plná nebo hra už začala.");
        setLoading(false);
        return;
      }

      const roomDoc = querySnapshot.docs[0];
      const roomData = roomDoc.data() as BattleRoom;

      const updatedPlayers = {
        ...roomData.players,
        [currentUser.uid]: {
          uid: currentUser.uid,
          displayName: currentUser.displayName,
          progress: 0,
          score: 0,
          finished: false,
          ready: true
        }
      };

      // Nastavíme čas vypršení na 30 minut od TEĎ
      const expiresAt = Date.now() + (30 * 60 * 1000);

      await updateDoc(doc(db, "battles", roomDoc.id), {
        players: updatedPlayers,
        status: 'STARTING',
        expiresAt
      });

      setCurrentRoom({ ...roomData, players: updatedPlayers, status: 'STARTING', expiresAt });
      setView('ARENA');
    } catch (e) {
      setError("Chyba při připojování.");
    } finally {
      setLoading(false);
    }
  };

  if (view === 'ARENA' && currentRoom) {
      return <BattleArena room={currentRoom} currentUser={currentUser} onExit={onExit} stats={stats} />;
  }

  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold text-center mb-2">1v1 Bitva SPS</h2>
      <p className="text-center text-gray-500 text-sm mb-6">Souboj v reálném čase</p>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {view === 'JOIN' ? (
        <div className="space-y-6">
          <button 
            onClick={createRoom}
            disabled={loading}
            className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 transition-all flex flex-col items-center justify-center"
          >
            <span>{loading ? "Vytvářím..." : "Vytvořit hru"}</span>
            {!loading && <span className="text-[10px] opacity-70 font-normal">Tato akce stojí 1 ze 2 denních pokusů</span>}
          </button>
          
          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink mx-4 text-gray-400 text-sm italic">nebo se připoj</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-400 uppercase text-center">Připojení ke kódu je ZDARMA</p>
            <input 
              type="text" 
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.replace(/\D/g,'').slice(0,6))}
              placeholder="000000"
              className="w-full p-4 border-2 border-gray-200 rounded-xl text-center text-3xl font-black tracking-[0.5em] focus:border-blue-500 outline-none transition-all"
            />
            <button 
              onClick={joinRoom}
              disabled={loading || roomCode.length !== 6}
              className="w-full py-4 bg-gray-900 text-white font-bold rounded-xl hover:bg-black disabled:opacity-50 transition-all shadow-md"
            >
              Vstoupit do boje
            </button>
          </div>

          <button onClick={onExit} className="w-full py-2 text-gray-400 text-sm hover:text-gray-600 transition-colors">
            Zpět do menu
          </button>
        </div>
      ) : (
        <div className="text-center space-y-6 animate-in fade-in duration-500">
          <div className="p-8 bg-blue-50 rounded-3xl border-2 border-dashed border-blue-200">
            <p className="text-blue-600 font-bold mb-2 uppercase text-xs tracking-widest">Tvůj kód bitvy</p>
            <h3 className="text-6xl font-black tracking-tighter text-blue-900">{currentRoom?.code}</h3>
          </div>
          <div className="space-y-2">
            <p className="text-gray-500 font-medium">Pošli kód soupeři...</p>
            <div className="flex justify-center gap-1">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-150"></div>
            </div>
          </div>
          <button 
            onClick={async () => {
                if (currentRoom) await deleteDoc(doc(db, "battles", currentRoom.id));
                setView('JOIN');
            }} 
            className="px-4 py-2 text-red-500 font-bold text-sm hover:bg-red-50 rounded-lg transition-all"
          >
            Zrušit místnost
          </button>
        </div>
      )}
    </div>
  );
};
