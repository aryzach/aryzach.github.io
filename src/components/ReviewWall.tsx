import { useEffect, useRef, useState } from "react";

type ReviewImg = { src: string; alt: string; aspect: number };

const IMAGES: ReviewImg[] = [
  { src: "/reviews/review-1.png", alt: "Customer review: That sauna is so great. It's really changed my life!", aspect: 358 / 724 },
  { src: "/reviews/review-2.png", alt: "Google review: I can not recommend this company enough!", aspect: 210 / 510 },
  { src: "/reviews/review-3.png", alt: "Google review: Life with Sauna is way better than life without.", aspect: 174 / 680 },
  { src: "/reviews/review-4.png", alt: "Google review: I love having a sauna at home!", aspect: 336 / 1540 },
  { src: "/reviews/review-5.png", alt: "Google review: this shit is hot. the guy was solid as well.", aspect: 186 / 488 },
  { src: "/reviews/review-6.png", alt: "Google review: Zach is incredibly kind and accommodating! 10/10 recommend!", aspect: 166 / 696 },
  { src: "/reviews/review-7.png", alt: "Google review: Zach is a great guy, extremely professional.", aspect: 318 / 1120 },
  { src: "/reviews/review-8.png", alt: "Customer review: Sauna has been such a wonderful life addition!", aspect: 154 / 1112 },
  { src: "/reviews/review-9.png", alt: "Google review: One of the best decisions I've made in a long time!", aspect: 216 / 1108 },
  { src: "/reviews/review-10.png", alt: "Customer review: the sauna is so easy with just a plug into one outlet.", aspect: 172 / 620 },
  { src: "/reviews/review-11.png", alt: "Google review: Zach is chill and professional, sauna is easy.", aspect: 1156 / 1206 },
  { src: "/reviews/review-12.png", alt: "Google review: The sauna is beautiful and easy to use.", aspect: 414 / 1330 },
  { src: "/reviews/review-13.png", alt: "Google review: Good sauna.", aspect: 224 / 462 },
  { src: "/reviews/review-14.png", alt: "Google review: This is the life upgrade I have been wanting.", aspect: 510 / 1194 },
  { src: "/reviews/review-15.png", alt: "Google review: Honestly amazing. Fits two people comfortably.", aspect: 464 / 1396 },
  { src: "/reviews/review-16.png", alt: "Google review: Great quality saunas. Get your rental asap!", aspect: 542 / 1179 },
];

type Pin = {
  id: string;
  imgIdx: number;
  xPct: number;
  yPct: number;
  rot: number;
  z: number;
  exiting?: boolean;
  touchesLeft?: boolean;
  touchesRight?: boolean;
};

let NEXT_Z = Date.now();

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const INITIAL_COUNT = 14;
const MAX_COUNT = IMAGES.length - 1;

const rand = (min: number, max: number) => Math.random() * (max - min) + min;

const getBaseWidth = () => {
  if (typeof window === "undefined") return 336;
  const w = window.innerWidth;
  if (w < 640) return 216;
  if (w < 768) return 288;
  return 336;
};

const getCardScale = (aspect: number) => (aspect < 0.32 ? 1.3 : 1);

const getCardWidth = (aspect: number) => getBaseWidth() * getCardScale(aspect);

const getContainerSize = () => {
  if (typeof window === "undefined") return { w: 1888, h: 570 };
  const w = window.innerWidth;
  const innerW = Math.max(0, w - 32);
  const innerH = w < 640 ? 252 : w < 768 ? 288 : 342;
  return { w: innerW, h: innerH };
};

const makePin = (opts?: { used?: Set<number>; forceLeft?: boolean; forceRight?: boolean }): Pin | null => {
  const used = opts?.used;
  const available = IMAGES.map((_, i) => i).filter((i) => !used?.has(i));
  if (available.length === 0) return null;

  const imgIdx = available[Math.floor(Math.random() * available.length)];
  const cardWidth = getCardWidth(IMAGES[imgIdx].aspect);
  const cardHeight = cardWidth * IMAGES[imgIdx].aspect;
  const rot = rand(-8, 8);
  const rotRad = Math.abs(rot) * (Math.PI / 180);

  const bboxH = cardWidth * Math.sin(rotRad) + cardHeight * Math.cos(rotRad);

  const { w: contW, h: contH } = getContainerSize();
  const hOverflow = 40;

  let left: number;
  if (opts?.forceLeft) {
    left = rand(-hOverflow, -hOverflow + 20);
  } else if (opts?.forceRight) {
    left = rand(contW - cardWidth + hOverflow - 20, contW - cardWidth + hOverflow);
  } else {
    left = rand(-hOverflow, contW - cardWidth + hOverflow);
  }

  const topMin = bboxH / 2 - cardHeight / 2;
  const topMax = contH - bboxH / 2 - cardHeight / 2;
  const top = rand(topMin, topMax);

  return {
    id: uid(),
    imgIdx,
    xPct: (left / contW) * 100,
    yPct: (top / contH) * 100,
    rot,
    z: NEXT_Z++,
    touchesLeft: opts?.forceLeft,
    touchesRight: opts?.forceRight,
  };
};

const ReviewWall = () => {
  const [pins, setPins] = useState<Pin[]>(() => {
    const used = new Set<number>();
    const initialPins: Pin[] = [];

    const leftPin = makePin({ used, forceLeft: true });
    if (leftPin) {
      used.add(leftPin.imgIdx);
      initialPins.push(leftPin);
    }

    const rightPin = makePin({ used, forceRight: true });
    if (rightPin) {
      used.add(rightPin.imgIdx);
      initialPins.push(rightPin);
    }

    for (let i = initialPins.length; i < INITIAL_COUNT; i++) {
      const pin = makePin({ used });
      if (!pin) break;
      used.add(pin.imgIdx);
      initialPins.push(pin);
    }
    return initialPins;
  });

  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const schedule = () => {
      const delay = 2000 + Math.random() * 2000;
      timeoutRef.current = window.setTimeout(() => {
        setPins((prev) => {
          const used = new Set(prev.map((p) => p.imgIdx));
          const hasLeft = prev.some((p) => p.touchesLeft && !p.exiting);
          const hasRight = prev.some((p) => p.touchesRight && !p.exiting);

          let newPin: Pin | null;
          if (!hasLeft) {
            newPin = makePin({ used, forceLeft: true });
          } else if (!hasRight) {
            newPin = makePin({ used, forceRight: true });
          } else {
            newPin = makePin({ used });
          }
          if (!newPin) return prev;

          const next = [...prev, newPin];
          if (next.length > MAX_COUNT) {
            const oldest = next.find((p) => !p.exiting && !p.touchesLeft && !p.touchesRight) || next.find((p) => !p.exiting);
            if (oldest) {
              window.setTimeout(() => {
                setPins((curr) => curr.filter((p) => p.id !== oldest.id));
              }, 900);
              return next.map((p) => (p.id === oldest.id ? { ...p, exiting: true } : p));
            }
          }
          return next;
        });
        schedule();
      }, delay);
    };
    schedule();
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  return (
    <section aria-label="Customer reviews" className="relative z-10 w-full bg-secondary overflow-visible py-[14px] md:py-[22px]">
      <div className="relative mx-auto w-full h-[252px] sm:h-[288px] md:h-[342px] px-4 overflow-visible">
        {pins.map((pin) => (
          <PinCard key={pin.id} pin={pin} />
        ))}
      </div>
    </section>
  );
};

const PinCard = ({ pin }: { pin: Pin }) => {
  const [mounted, setMounted] = useState(false);
  const img = IMAGES[pin.imgIdx];

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const visible = mounted && !pin.exiting;
  const scale = getCardScale(img.aspect);
  const scaledWidth = scale > 1 ? getBaseWidth() * scale : undefined;

  return (
    <div
      className="group absolute will-change-transform"
      style={{
        left: `${pin.xPct}%`,
        top: `${pin.yPct}%`,
        zIndex: pin.z,
        opacity: visible ? 1 : 0,
        transform: `translateY(${visible ? 0 : -10}px) scale(${visible ? 1 : 0.95})`,
        transition: "opacity 800ms ease-out, transform 800ms cubic-bezier(0.22, 1, 0.36, 1)",
      }}
    >
      <div
        className="hover:!z-[9999] transition-transform duration-300 ease-out group-hover:-translate-y-1"
        style={{ transform: `rotate(${pin.rot}deg)` }}
      >
        <img
          src={img.src}
          alt={img.alt}
          loading="lazy"
          decoding="async"
          draggable={false}
          width={1000}
          height={Math.round(1000 * img.aspect)}
          className="block w-[216px] sm:w-[288px] md:w-[336px] h-auto bg-white select-none transition-shadow duration-300 group-hover:shadow-[0_18px_40px_rgba(0,0,0,0.22)]"
          style={{ width: scaledWidth, borderRadius: "0px", boxShadow: "0 10px 30px rgba(0,0,0,0.12)" }}
        />
      </div>
    </div>
  );
};

export default ReviewWall;
