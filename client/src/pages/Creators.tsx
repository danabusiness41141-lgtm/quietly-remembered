import React from "react";
import { ArrowUpRight, Code2, Heart, Instagram, Send, Sparkles } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "../contexts/LanguageContext";

type SiteLanguage = "en" | "ar" | "ku";

type CreatorsCopy = {
  kicker: string;
  title: React.ReactNode;
  intro: string;
  protocol: string;
  people: string;
  peopleTitle: React.ReactNode;
  missionKicker: string;
  missionTitle: React.ReactNode;
  missionBody: string;
  connectKicker: string;
  connectTitle: string;
  telegram: string;
  instagram: string;
  creatorLabel: string;
  back: string;
  write: string;
  yearNote: string;
};

type CreatorEntry = {
  name: string;
  statement: string;
};

const copy: Record<SiteLanguage, CreatorsCopy> = {
  en: {
    kicker: "NOVATECH KRD / INDEPENDENT MAKERS",
    title: <>Meet the minds<br /><em>behind the signal.</em></>,
    intro: "Quietly Remembered is an emotional experiment by NovaTech KRD\u2014a small, curious team crafting digital spaces with a human touch.",
    protocol: "COMMUNITY_PROTOCOL / OPEN",
    people: "THE PEOPLE",
    peopleTitle: <>Three perspectives.<br /><em>One open signal.</em></>,
    missionKicker: "OUR NORTH STAR",
    missionTitle: <>Useful things<br /><em>should belong to everyone.</em></>,
    missionBody: "We strive to build a community where everything is free and meaningful. Quietly Remembered is a small, emotional glimpse of that vision: a gentle space where a few words can still truly matter.",
    connectKicker: "FIND THE SIGNAL",
    connectTitle: "Follow NovaTech KRD",
    telegram: "Telegram channel",
    instagram: "Instagram page",
    creatorLabel: "CREATOR",
    back: "Back to the collection",
    write: "Write a note",
    yearNote: "© 2026 NovaTech KRD — Kurdistan, Iraq",
  },
  ar: {
    kicker: "نوفا تك كرد / صُنّاع مستقلون",
    title: <>تعرّف إلى العقول<br /><em>خلف الإشارة.</em></>,
    intro: "\u201cQuietly Remembered\u201d تجربة وجدانية من NovaTech KRD؛ فريق صغير وشغوف يبتكر مساحات رقمية تنبض بلمسة إنسانية.",
    protocol: "بروتوكول المجتمع / مفتوح",
    people: "الأشخاص",
    peopleTitle: <>ثلاثة منظورات.<br /><em>إشارة واحدة مفتوحة.</em></>,
    missionKicker: "بوصلتنا",
    missionTitle: <>الأشياء المفيدة<br /><em>يجب أن تكون للجميع.</em></>,
    missionBody: "نسعى لبناء مجتمع يكون فيه كل شيء مجانياً وذو فائدة. \u201cQuietly Remembered\u201d هي نموذج صغير ووجداني لتلك الفكرة؛ مساحة هادئة حيث لا تزال لبعض الكلمات قيمتها وأثرها.",
    connectKicker: "اعثر على الإشارة",
    connectTitle: "تابع NovaTech KRD",
    telegram: "قناة تيليغرام",
    instagram: "صفحة إنستغرام",
    creatorLabel: "المبدع",
    back: "العودة إلى المجموعة",
    write: "اكتب رسالة",
    yearNote: "© 2026 نوفاتك كرد — كردستان، العراق",
  },
  ku: {
    kicker: "نۆڤاتێک کورد / دروستکەرانی سەربەخۆ",
    title: <>بە دروستکەرەکانمان بناسە<br /><em>لە پشت ئەم نیشانەیە.</em></>,
    intro: "\u00abQuietly Remembered\u00bb ئەزموونێکی هەستەکییە لەلایەن NovaTech KRD؛ تیمێکی بچووک و ووردبین کە شوێنە دیجیتاڵییەکان بە گیانێکی مرۆڤانەوە دروست دەکەن.",
    protocol: "پرۆتۆکۆڵی کۆمەڵگا / کراوە",
    people: "کەسەکان",
    peopleTitle: <>سێ بینایی<br /><em>یەک نیشانە.</em></>,
    missionKicker: "ئاڕاستەکەمان",
    missionTitle: <>شتە بەسوودەکان<br /><em>دەبێت بۆ هەمووان بن.</em></>,
    missionBody: "ئێمە هەوڵ دەدەین کۆمەڵگەیەک بنیات بنێین کە تێیدا هەموو شتێک بەخۆڕایی و بەسوود بێت. \u00abQuietly Remembered\u00bb نموونەیەکی بچووک و سۆزدار تەعبیر لەو بیرۆکەیە دەکات؛ شوێنێکی هێمن کە چەند وشەیەک تێیدا هێشتا بەهای خۆیان هەبێت.",
    connectKicker: "نیشانەکە بدۆزەرەوە",
    connectTitle: "شوێنکەوتنی NovaTech KRD",
    telegram: "کەناڵی تەلەگرام",
    instagram: "پەڕەی ئینستاگرام",
    creatorLabel: "دروستکەر",
    back: "گەڕانەوە بۆ کۆمەڵەکە",
    write: "نامەیەک بنووسە",
    yearNote: "© 2026 نۆڤاتەک کورد — کوردستان، عێراق",
  },
};

const creatorsCopy: Record<SiteLanguage, CreatorEntry[]> = {
  en: [
    { name: "Dana Gailan", statement: "We build quiet things because the loudest tools forget who they're for." },
    { name: "Amad Shekha", statement: "A good interface disappears. What stays is how it made you feel." },
    { name: "Hazim Ali", statement: "Simple systems, honest code, and enough room for people to breathe." },
  ],
  ar: [
    { name: "Dana Gailan", statement: "نبني أشياء هادئة، لأن الأدوات الأكثر صخباً تنسى لأجل من صُمّمت." },
    { name: "Amad Shekha", statement: "الواجهة الجيدة تتوارى عن الأنظار، وما يبقى حقاً هو الإحساس الذي تتركه فيك." },
    { name: "Hazim Ali", statement: "أنظمة بسيطة، كود صادق، ومساحة كافية ليتمكن الناس من التنفس." },
  ],
  ku: [
    { name: "Dana Gailan", statement: "ئێمە شتی هێمن دروست دەکەین، چونکە ئامرازە هەرە دەنگەبەرزەکان لەبیریان دەچێتەوە بۆ کێ دروست کراون." },
    { name: "Amad Shekha", statement: "ناوبەستێکی (Interface) باش وندەبێت؛ ئەوەی دەمێنێتەوە ئەوەیە کە چ احساسێکی پێ بەخشیویت." },
    { name: "Hazim Ali", statement: "سیستەمی سادە، کۆدی ڕاستگۆیانە، و بۆشاییەکی بەس بۆ ئەوەی مرۆڤەکان هەناسە بدەن." },
  ],
};

export default function Creators() {
  const { language } = useLanguage();
  const t = copy[language];
  const people = creatorsCopy[language];

  return (
    <section className="creators-page">
      <div className="creators-grid-lines" aria-hidden="true" />
      <div className="creators-noise" aria-hidden="true" />
      <div className="creators-shell container">
        <Link href="/" className="creators-back"><span>←</span> {t.back}</Link>

        <div className="creators-hero">
          <div className="creators-hero-copy">
            <div className="creators-kicker"><span className="creators-kicker-line" />{t.kicker}</div>
            <h1>{t.title}</h1>
            <p>{t.intro}</p>
            <div className="creators-protocol"><span className="protocol-dot" />{t.protocol}</div>
          </div>
          <div className="creators-orb" aria-hidden="true">
            <div className="orb-ring orb-ring-one" />
            <div className="orb-ring orb-ring-two" />
            <div className="orb-core"><Sparkles size={24} /></div>
            <span className="orb-label">NTKRD<br /><b>01—03</b></span>
          </div>
        </div>

        <section className="creators-people" aria-labelledby="creators-people-title">
          <div className="creators-section-head">
            <span className="creators-index">01</span>
            <div>
              <span className="creators-section-label">{t.people}</span>
              <h2 id="creators-people-title">{t.peopleTitle}</h2>
            </div>
            <Code2 size={21} aria-hidden="true" />
          </div>
          <div className="creator-list">
            {people.map((person, index) => (
              <article className={`creator-card creator-card-${index + 1}`} key={person.name}>
                <div className="creator-card-top"><span>0{index + 1}</span><span>{t.creatorLabel}</span></div>
                <div className="creator-avatar" aria-hidden="true"><span>{person.name.split(" ").map((part) => part[0]).join("")}</span></div>
                <h3>{person.name}</h3>
                <p className="creator-statement">{person.statement}</p>
                <div className="creator-card-foot"><span>NTKRD / 2026</span><span className="creator-star">✦</span></div>
              </article>
            ))}
          </div>
        </section>

        <section className="creators-mission" aria-labelledby="creators-mission-title">
          <div className="mission-scanline" aria-hidden="true" />
          <div className="creators-index">02</div>
          <div className="mission-copy">
            <span className="creators-section-label">{t.missionKicker}</span>
            <h2 id="creators-mission-title">{t.missionTitle}</h2>
            <p>{t.missionBody}</p>
          </div>
          <div className="mission-heart" aria-hidden="true"><Heart size={28} /><span>FREE<br />USEFUL<br />HUMAN</span></div>
        </section>

        <section className="creators-connect" aria-labelledby="creators-connect-title">
          <div className="creators-connect-copy">
            <span className="creators-section-label">{t.connectKicker}</span>
            <h2 id="creators-connect-title">{t.connectTitle}</h2>
          </div>
          <div className="creators-socials">
            <a href="https://t.me/NovaTechKrdd" target="_blank" rel="noreferrer" className="creator-social-link">
              <span className="social-icon"><Send size={17} /></span><span>{t.telegram}</span><ArrowUpRight size={15} />
            </a>
            <a href="https://www.instagram.com/novatech.krd/" target="_blank" rel="noreferrer" className="creator-social-link">
              <span className="social-icon"><Instagram size={17} /></span><span>{t.instagram}</span><ArrowUpRight size={15} />
            </a>
          </div>
        </section>

        <footer className="creators-footer-row">
          <span>{t.yearNote}</span>
          <Link href="/write" className="creators-write-link">{t.write} <ArrowUpRight size={15} /></Link>
        </footer>
      </div>
    </section>
  );
}
