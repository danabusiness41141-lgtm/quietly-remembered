/* Paper Lantern direction: personalization stays gentle, with shared paper tones and one optional custom color. */
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Check, RotateCcw } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { isCustomPaperColor, paperTones } from "../lib/paper";

function applyPaperPreference(value: string) {
  const root = document.documentElement;
  localStorage.setItem("qr-paper", value);
  if (isCustomPaperColor(value)) {
    root.dataset.paper = "custom";
    root.style.setProperty("--paper", value);
    root.style.setProperty("--paper-deep", `color-mix(in srgb, ${value} 78%, #efe3d6)`);
  } else {
    root.dataset.paper = value;
    root.style.removeProperty("--paper");
    root.style.removeProperty("--paper-deep");
  }
}

export default function Customize() {
  const { t } = useLanguage();
  const [paper, setPaper] = useState("parchment");
  const [customColor, setCustomColor] = useState("#c8b4a7");

  useEffect(() => {
    const saved = localStorage.getItem("qr-paper") || "parchment";
    setPaper(saved);
    if (isCustomPaperColor(saved)) setCustomColor(saved);
    applyPaperPreference(saved);
  }, []);

  const choose = (value: string) => {
    setPaper(value);
    if (isCustomPaperColor(value)) setCustomColor(value);
    applyPaperPreference(value);
  };

  return <section className="subpage customize-page container">
    <Link href="/" className="back-link">← {t.back}</Link>
    <div className="subpage-heading">
      <div className="section-kicker">{t.makeKicker}</div>
      <h1>{t.makeTitle}</h1>
      <p>{t.makeDesc}</p>
    </div>
    <div className="customize-panel">
      <div className="customize-group">
        <div className="group-label">{t.paperTone}</div>
        <div className="paper-options">
          {paperTones.map(tone => <button key={tone.key} type="button" className={`paper-swatch ${paper === tone.key ? "selected" : ""}`} onClick={() => choose(tone.key)} aria-label={String((t as any)[tone.key] || tone.key)} aria-pressed={paper === tone.key} style={{ background: tone.color }}><span>{paper === tone.key && <Check size={15} />}</span><small>{(t as any)[tone.key] || tone.key}</small></button>)}
          <label className={`paper-swatch custom-paper-swatch ${isCustomPaperColor(paper) ? "selected" : ""}`} style={{ background: customColor }}>
            <input type="color" value={customColor} onChange={event => { setCustomColor(event.target.value); choose(event.target.value); }} aria-label={String((t as any).customPaper || "Custom paper color")} />
            <span>{isCustomPaperColor(paper) && <Check size={15} />}</span>
            <small>{(t as any).customPaper || "Custom paper color"}</small>
          </label>
        </div>
      </div>
      <div className="custom-font-note"><span className="typewriter-sample">Aa</span><div><strong>{t.lettering}: {t.serif}</strong><p>{t.serifNote}</p></div></div>
      <button className="reset-button" type="button" onClick={() => choose("parchment")}><RotateCcw size={14} /> {t.reset}</button>
    </div>
  </section>;
}
