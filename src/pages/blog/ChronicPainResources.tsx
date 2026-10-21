import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useSEO } from "@/hooks/useSEO";

const practitioners = [
  {
    "id": "sarah-day",
    "name": "Sarah Day",
    "subtitle": "A breakthrough for hip flexor tension",
    "url": "https://www.psoasbodywork.com/sarahday",
    "image": "https://static.wixstatic.com/media/526d7f_c5398d4348314085b264bce509651686~mv2.png/v1/crop/x_138,y_0,w_779,h_779/fill/w_500,h_500,al_c,q_85/24.png",
    "paragraphs": [
      "Sarah Day was the first person who was able to get one of my hip flexors to completely relax and feel like a normal person after two years of incredible hip flexor tension. Sometimes it would take me five minutes to stand up.",
      "Before this, I was demoralized and skeptical that I’d ever feel normal again. This massage felt like the clouds parted and there was a chance I’d be able to fully resolve this pain and tension. The day I got this massage, I went out dancing and felt the best I’d felt since I injured my back."
    ]
  },
  {
    "id": "joe-cicinelli",
    "name": "Dr. Joe Cicinelli",
    "subtitle": "Looking for the root cause",
    "url": "https://www.posturalrestoration.com/provider/joe-cicinelli/",
    "image": "https://cdn-space2.dbmgo.com/pri/wp-content/uploads/2023/08/01014612/Cicinelli2C20Joe20-20Square.jpg",
    "paragraphs": [
      "Dr. Joe Cicinelli was the first physical therapist I saw who’s addressed the root cause of my tension and pain. After three years of chronic tension, he was the first to suspect that my back pain and muscle tension stems from a constricted airway—tonsils and a deviated septum.",
      "He’s also helping me reshape my body and posture through strange breathing and floor movement exercises. I highly recommend Dr. Joe for any mysterious or long-standing muscle, neuro, posture, airway, or sleep-related issues."
    ]
  },
  {
    "id": "d-bacome",
    "name": "D Bacome",
    "subtitle": "A psoas release I hadn’t felt in years",
    "url": "https://www.fluidbody.net/about",
    "image": null,
    "paragraphs": [
      "D Bacome is a magician. D found a way to a trigger point near my spine by pressing on my belly, which gave my psoas a release I hadn’t felt in years. D has an incredible mental map of trigger points and is the most skilled practitioner of Active Release Technique I’ve worked with."
    ]
  },
  {
    "id": "ben-brewer",
    "name": "Ben Brewer",
    "subtitle": "Exploring neuromuscular retraining",
    "url": "https://www.psoasbodywork.com/benjaminbrewer",
    "image": "https://static.wixstatic.com/media/526d7f_d549e2bf074e4b45a3938562fa586e04~mv2.png/v1/crop/x_31,y_20,w_669,h_668/fill/w_500,h_500,al_c,q_85/12_edited.png",
    "paragraphs": [
      "Ben Brewer might’ve been one of the most interesting bodywork sessions I’ve had. He focused on neuromuscular retraining. I might have pain in my right knee, so he’ll do some manual therapy on my left ankle while having me look right with my eyes. This might help repattern something in my right hip which was affecting my knee.",
      "I didn’t notice much change after one session, but I’d be curious to explore this more to help some asymmetric muscle tightness that I suspect is caused by bad muscle memory patterns in my gait and such."
    ]
  },
  {
    "id": "sidney-silver",
    "name": "Sidney Silver",
    "subtitle": "A return to running, with a setback",
    "url": "https://silversportstherapy.com/",
    "image": "https://nebula.wsimg.com/6da32fba67e17a1b67a4be5758942020?AccessKeyId=03A37E5EEA66DC01E7B2&alloworigin=1&disposition=0",
    "paragraphs": [
      "I’ve had an ankle issue for two years which has prevented me from running. Before seeing Sidney, I’d done about four months of physical therapy which didn’t help. After one session with Sidney, the pain was resolved and I could run—though it did come back after about two weeks, and I can’t run again.",
      "After seeing him, that ankle is also way more flexible than the other, so I’ll have to go back to at least even it out."
    ]
  },
  {
    "id": "cat-butler",
    "name": "Cat Butler",
    "subtitle": "An intense experience with Rolfing",
    "url": "https://www.catbutlerbodywork.com/",
    "image": "https://images.squarespace-cdn.com/content/v1/5af8b7fd4cde7ab81c5283b4/1526250226104-0Z8UJSEL1GSEM8GJ0TMJ/Cat_headshot.jpg?format=500w",
    "paragraphs": [
      "Working with Cat was one of the most intense and painful two hours of my life. Her style is called Rolfing, which I experienced as an incredibly deep full-body massage. I don’t think it really helped me, but other friends swear by her technique."
    ]
  }
];

function Portrait({ person }: { person: (typeof practitioners)[number] }) {
  const [failed, setFailed] = useState(false);
  return <figure className="w-32 sm:w-44 md:w-52 shrink-0">
    {person.image && !failed ? <img src={person.image} alt={person.name} width={208} height={208} loading="lazy" onError={() => setFailed(true)} className="aspect-square w-full rounded-lg object-cover object-top bg-muted" /> : <div className="aspect-square w-full rounded-lg bg-muted flex items-center justify-center text-3xl text-muted-foreground" aria-label={`${person.name} portrait unavailable`}>{person.name.replace("Dr. ", "").split(" ").map(word => word[0]).join("")}</div>}
    {person.image && !failed && <figcaption className="mt-2 text-xs text-muted-foreground"><a href={person.id === "sidney-silver" ? "https://silversportstherapy.com/sidney-silver.html" : person.id === "cat-butler" ? "https://www.catbutlerbodywork.com/about" : person.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">Photo: practitioner’s website</a></figcaption>}
  </figure>;
}

export default function ChronicPainResources() {
  useSEO({ title: "Reviews of sport massage and physical therapists in the SF Bay Area | SF Sauna", description: "Personal reviews of six SF Bay Area massage, bodywork, and physical therapy practitioners from my experience navigating chronic pain.", canonical: "https://www.sfsaunarental.com/blog/chronic-pain-resources-sf" });
  return <div className="min-h-screen bg-background text-foreground">
    <Header />
    <main className="pt-28 md:pt-36 pb-20 px-5 sm:px-8">
      <article className="max-w-4xl mx-auto">
        <Link to="/learn" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-10"><ArrowLeft size={16} /> Back to the blog</Link>
        <header className="max-w-3xl">
          <p className="text-sm font-medium tracking-widest uppercase text-muted-foreground mb-5">Chronic pain resources · SF Bay Area</p>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight tracking-tight mb-6">Reviews of sport massage and physical therapists in the SF Bay Area</h1>
          <p className="text-lg leading-relaxed text-muted-foreground">My experiences with six practitioners while navigating years of chronic pain, muscle tension, and injuries. What helped, what didn’t, and what I’d explore again.</p>
          <p className="text-sm text-muted-foreground mt-5">By Zach · Personal experiences</p>
        </header>
        <nav aria-label="In this article" className="my-10 rounded-lg border border-border bg-card p-6">
          <h2 className="text-sm font-semibold mb-4">In this article</h2>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-3">{practitioners.map((person, index) => <li key={person.id}><a href={`#${person.id}`} className="text-sm hover:underline underline-offset-4"><span className="text-muted-foreground mr-3">0{index + 1}</span>{person.name}</a></li>)}</ul>
        </nav>
        <div className="divide-y divide-border">{practitioners.map((person, index) => <section key={person.id} id={person.id} aria-labelledby={`${person.id}-heading`} className="scroll-mt-28 py-10 md:py-12 flex flex-col md:flex-row gap-6 md:gap-10">
          <Portrait person={person} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium tracking-widest uppercase text-muted-foreground mb-2">0{index + 1} / {person.subtitle}</p>
            <h2 id={`${person.id}-heading`} className="text-2xl sm:text-3xl font-semibold mb-5">{person.name}</h2>
            <div className="space-y-4 text-base sm:text-lg leading-relaxed">{person.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}</div>
            <a href={person.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-6 font-medium text-primary underline underline-offset-4">Visit {person.name}’s website<ArrowUpRight size={16} /></a>
          </div>
        </section>)}</div>
        <aside className="border-t border-border pt-6 mt-4 text-sm leading-relaxed text-muted-foreground">These reviews reflect my own experiences, not medical advice or a promise of results. Everyone’s body and experience is different.</aside>
      </article>
    </main>
    <Footer />
  </div>;
}
