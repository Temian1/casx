import { Suspense } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { gameById } from "../games/registry.jsx";
import { store, useStore } from "../store/store.js";
import { resume, ui } from "../audio/synth.js";
import { Back, SoundOn, SoundOff, Home as HomeIcon } from "../components/Icons.jsx";
import "./play.css";

/* Shell around every game: back link, shared sound + volume controls. */
export default function Play() {
  const { id } = useParams();
  const game = gameById(id);
  const { sound, volume } = useStore();
  if (!game) return <Navigate to="/" replace />;
  const Game = game.component;

  const toggleSound = () => {
    const next = !sound;
    store.setSound(next);
    if (next) { resume(); ui.toggle(true); }
  };

  return (
    <div className="play">
      <nav className="play-bar">
        <Link to="/" className="play-back" onClick={() => ui.click()}><Back size={16} /> Lobby</Link>
        <span className="play-name"><HomeIcon size={13} /> {game.title}</span>
        <div className="play-audio">
          <button className="ghost icon" aria-pressed={sound ? "true" : "false"} onClick={toggleSound} aria-label={sound ? "Mute sound" : "Unmute sound"} title={sound ? "Sound on" : "Sound off"}>{sound ? <SoundOn size={16} /> : <SoundOff size={16} />}<span className="play-sound-label">{sound ? "On" : "Off"}</span></button>
          <label className="play-vol">
            <span>Vol</span>
            <input type="range" min="0" max="100" value={Math.round(volume * 100)} aria-label="Volume"
              onChange={(e) => store.setVolume(Number(e.target.value) / 100)} onPointerUp={() => ui.click()} />
          </label>
        </div>
      </nav>
      <Suspense fallback={<div className="play-loading">Loading {game.title}…</div>}>
        <Game key={game.id} />
      </Suspense>
    </div>
  );
}
