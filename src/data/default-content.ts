import { MATH_RESOURCES } from './resourcesData';

export const DEFAULT_CONTENT = {
  site: {
    clubName: "Josephite Math Club",
    logoUrl: "",
    eventMode: false,
    maintenanceMode: false,
    maintenanceMessage: "The site is currently under maintenance",
    announcements: [
      "Welcome to Josephite Math Club!",
      "New event starting soon - Register now!",
      "Check out our latest articles in the library."
    ],
    showAnnouncements: true
  },
  home: {
    heroTagline: "Est. 2015 * Excellence in Mathematics",
    heroTitle: "Josephite Math Club",
    heroSubtitle: "Where logic meets creativity to solve the world's most beautiful problems.",
    heroSubtitles: [
      "Where logic meets creativity to solve the world's most beautiful problems.",
      "Exploring the infinite boundaries of mathematical thought.",
      "Building a sanctuary for Josephite mathematicians.",
      "Innovating through the language of the universe."
    ],
    joinButtonText: "Join the Club",
    storyButtonText: "Our Story",
    memoriesTagline: "Visual Journey",
    memoriesTitle: "Our Memories",
    testimonialsTagline: "Voices of JMC",
    testimonialsTitle: "People About JMC",
    agendaTagline: "Our Mission",
    agendaTitle: "The Club Agenda",
    agendaDescription: "We aim to bridge the gap between theoretical mathematics and practical innovation through a series of structured programs.",
    agendaItems: [
      { title: "Weekly Workshops", icon: "Zap" },
      { title: "Monthly Competitions", icon: "Trophy" },
      { title: "Annual Math Festival", icon: "Star" },
      { title: "Research Projects", icon: "Lightbulb" }
    ],
    gallery: [],
    testimonials: [
      {
        id: "root-home-testimonials-0-j5tehjir4",
        name: "Anthony Prince Costa",
        role: "Chief Moderator",
        message: "As Chief Moderator, I take pride in guiding the Math Club, which reflects the spirit of our department. Our mission is to create a community where mathematics is not just about formulas but about critical thinking, curiosity, and teamwork. This club allows students to go beyond textbooks and experience the true beauty of numbers and logic.",
        imageUrl: "/images/members/anthony.png"
      },
      {
        id: "root-home-testimonials-1-er0ttx1ep",
        name: "Intesher Alam Manam",
        role: "Club President",
        message: "As the President of the Math Club, I feel honored to lead such a vibrant community. My vision is to make this club a hub for discovery, learning, and collaboration. Whether it's competitions, workshops, or friendly discussions, we want every member to feel inspired and motivated to see math not as pressure, but as passion.",
        imageUrl: "/images/members/panel_26/intesher_alam_manam.png"
      },
      {
        id: "root-home-testimonials-2-j621yhizn",
        name: "Shoumik Saha Raj",
        role: "General Secretary",
        message: "As General Secretary, my role is to keep our Math Club organized, active, and welcoming for everyone. I work to ensure smooth coordination of events, competitions, and activities so that each member has the chance to participate and grow. Together, we are creating a community where learning mathematics is not only meaningful but also enjoyable.",
        imageUrl: "/images/members/panel_26/shoumik_saha-raj.png"
      },
      {
        id: "root-home-testimonials-3-gd5aotk2o",
        name: "Monwar Rafat",
        role: "Deputy President",
        message: "Serving as Deputy President, I work alongside our president and members to ensure that the Math Club continues to grow with new initiatives. We aim to make mathematics a source of joy, exploration, and innovation for every student, giving them opportunities to learn and lead with confidence.",
        imageUrl: "/images/members/panel_26/monwar_rafat.png"
      },
      {
        id: "root-home-testimonials-4-2xng7rc2p",
        name: "Arefin Anwar",
        role: "Vice President",
        message: "As Vice President, I believe the true strength of our Math Club lies in teamwork and inclusiveness. We are building a community where students not only sharpen their problem-solving skills but also learn to innovate, collaborate, and enjoy mathematics as a lifelong journey of discovery.",
        imageUrl: "/images/members/panel_26/arefin_anwar.png"
      }
    ]
  },
  about: {
    title: "ABOUT US",
    subtitle: "THE JMC STORY",
    description: "The Josephite Math Club is a premier student organization dedicated to fostering mathematical excellence and innovation. Founded with a vision to make mathematics accessible and exciting, we provide a platform for students to explore the beauty of numbers and their applications in the real world.",
    stats: [
      { label: "Active Members", value: "500+" },
      { label: "Annual Events", value: "12+" },
      { label: "Years of Legacy", value: "9" },
      { label: "Awards Won", value: "50+" }
    ],
    objectives: [
      { title: "Mathematical Thinking", description: "Promote deep mathematical thinking and intuitive problem-solving skills.", icon: "Calculator", color: "text-purple-400" },
      { title: "Olympiad Spirit", description: "Organize competitions and workshops to prepare students for national and international stages.", icon: "Trophy", color: "text-amber-400" },
      { title: "Collaborative Growth", description: "Create a supportive and collaborative environment for math enthusiasts to thrive.", icon: "Heart", color: "text-rose-400" },
      { title: "Practical Math", description: "Bridge the gap between academic mathematics and its impactful real-world applications.", icon: "Lightbulb", color: "text-emerald-400" }
    ],
    visionSteps: [
      { title: "Discovery", desc: "Identifying mathematical potential in every student.", icon: "Target", color: "bg-gradient-to-br from-[var(--c-4-start)] to-[var(--c-4-end)]" },
      { title: "Nurturing", desc: "Providing the resources and mentorship to grow.", icon: "Zap", color: "bg-gradient-to-br from-[var(--c-5-start)] to-[var(--c-5-end)]" },
      { title: "Excellence", desc: "Achieving mastery through practice and competition.", icon: "Rocket", color: "bg-gradient-to-br from-[var(--c-2-start)] to-[var(--c-2-end)]" },
      { title: "Impact", desc: "Applying math to solve real-world global problems.", icon: "Globe", color: "bg-gradient-to-br from-[var(--c-3-start)] to-[var(--c-3-end)]" }
    ]
  },
  panel: {
    title: "OUR PANEL",
    subtitle: "LEADERSHIP",
    description: "Meet the dedicated individuals who lead the Josephite Math Club towards its goals of excellence and innovation.",
    moderatorsTitle: "Moderators",
    moderators: [
      { name: "Anthony Prince Costa", role: "Chief Moderator", imageUrl: "/images/members/anthony.png" }
    ],
    executiveTitle: "Executive Committee",
    executiveSubtitle: "The Core Leadership Team",
    executive: {
      current: {
        president: [{ name: "Intesher Alam Manam", role: "President", imageUrl: "/images/members/panel_26/intesher_alam_manam.png" }],
        deputyPresidents: [{ name: "Monwar Rafat", role: "Deputy President", imageUrl: "/images/members/panel_26/monwar_rafat.png" }],
        generalSecretary: [{ name: "Shoumik Saha Raj", role: "General Secretary", imageUrl: "/images/members/panel_26/shoumik_saha-raj.png" }],
        vicePresidents: [{ name: "Arefin Anwar", role: "Vice President", imageUrl: "/images/members/panel_26/arefin_anwar.png" }],
        departments: [
          { dept: "Internal Affairs", name: "Utkorsho Mistry Shouvik", imageUrl: "/images/members/panel_26/utkorsho_mistry_shouvik.png" },
          { dept: "External Affairs", name: "Mahatab Hossain Zihan", imageUrl: "/images/members/panel_26/mahatab_hossain_zihan.png" },
          { dept: "Photography", name: "Shirsha Roy", imageUrl: "/images/members/panel_26/shirsha_roy.png" },
          { dept: "Events", name: "Ahnaf Abeed", imageUrl: "/images/members/panel_26/ahnaf_abeed.png" },
          { dept: "Writings", name: "Shafayet Azmayeen", imageUrl: "/images/members/panel_26/shafayet_azmayeen.png" },
          { dept: "Equity", name: "Hosain Istiyake Antor", imageUrl: "/images/members/panel_26/hosain_istiyake_antor.png" },
          { dept: "Decoration", name: "Mahi Bareed Noor", imageUrl: "/images/members/panel_26/mahi_bareed_noor.png" }
        ],
        secretaries: { 
          asstGeneralSecretary: [], 
          jointSecretary: [], 
          organizingSecretary: [], 
          correspondingSecretary: [] 
        }
      },
      former: [
        {
          id: "panel-25",
          year: "Panel 25 (2024-2025)",
          president: [{ name: "Ziyad Mohammad", role: "President", imageUrl: "" }],
          generalSecretary: [],
          deputyPresidents: [],
          vicePresidents: [],
          departments: [],
          secretaries: { asstGeneralSecretary: [], jointSecretary: [], organizingSecretary: [], correspondingSecretary: [] }
        },
        {
          id: "panel-24",
          year: "Panel 24 (2023-2024)",
          president: [],
          generalSecretary: [],
          deputyPresidents: [],
          vicePresidents: [],
          departments: [],
          secretaries: { asstGeneralSecretary: [], jointSecretary: [], organizingSecretary: [], correspondingSecretary: [] }
        }
      ]
    }
  },
  gallery_page: {
    images: []
  },
  notices: {
    title: "NOTICE BOARD",
    subtitle: "ANNOUNCEMENTS",
    description: "Stay updated with the latest announcements, results, and important information from the Josephite Math Club.",
    notices: []
  },
  events: {
    title: "BEYOND NUMBERS",
    subtitle: "UPCOMING EVENTS",
    description: "Join us for a series of challenging competitions, insightful workshops, and engaging seminars designed to push your mathematical boundaries.",
    events: [
        {
          "id": "event-solo-1",
          "title": "Math Olympiad",
          "date": "TBA",
          "time": "TBA",
          "location": "TBA",
          "category": "Competition",
          "description": "Participate in the exciting Math Olympiad competition.",
          "registrationLink": "#",
          "isTeamEvent": false,
          "imageUrl": ""
        },
        {
          "id": "event-solo-2",
          "title": "IQ Test",
          "date": "TBA",
          "time": "TBA",
          "location": "TBA",
          "category": "Competition",
          "description": "Participate in the exciting IQ Test competition.",
          "registrationLink": "#",
          "isTeamEvent": false,
          "imageUrl": ""
        },
        {
          "id": "event-solo-3",
          "title": "Probability Pressure",
          "date": "TBA",
          "time": "TBA",
          "location": "TBA",
          "category": "Competition",
          "description": "Participate in the exciting Probability Pressure competition.",
          "registrationLink": "#",
          "isTeamEvent": false,
          "imageUrl": "/images/event_banner/PR-PR.jpg"
        },
        {
          "id": "event-solo-5",
          "title": "Human Calculator",
          "date": "TBA",
          "time": "TBA",
          "location": "TBA",
          "category": "Competition",
          "description": "Participate in the exciting Human Calculator competition.",
          "registrationLink": "#",
          "isTeamEvent": false,
          "imageUrl": "/images/event_banner/Human_Calc-segment.jpg"
        },
        {
          "id": "event-solo-6",
          "title": "Calculus Bee",
          "date": "TBA",
          "time": "TBA",
          "location": "TBA",
          "category": "Competition",
          "description": "Participate in the exciting Calculus Bee competition.",
          "registrationLink": "#",
          "isTeamEvent": false,
          "imageUrl": ""
        },
        {
          "id": "event-solo-7",
          "title": "Geometry Dash",
          "date": "TBA",
          "time": "TBA",
          "location": "TBA",
          "category": "Competition",
          "description": "Participate in the exciting Geometry Dash competition.",
          "registrationLink": "#",
          "isTeamEvent": false,
          "imageUrl": "/images/event_banner/Geo-Dash.jpg"
        },
        {
          "id": "event-solo-8",
          "title": "Rubik's Cube",
          "date": "TBA",
          "time": "TBA",
          "location": "TBA",
          "category": "Competition",
          "description": "Participate in the exciting Rubik's Cube competition.",
          "registrationLink": "#",
          "isTeamEvent": false,
          "imageUrl": ""
        },
        {
          "id": "event-solo-9",
          "title": "Sudoku",
          "date": "TBA",
          "time": "TBA",
          "location": "TBA",
          "category": "Competition",
          "description": "Participate in the exciting Sudoku competition.",
          "registrationLink": "#",
          "isTeamEvent": false,
          "imageUrl": "/images/event_banner/Sudoku.jpg"
        },
        {
          "id": "event-solo-10",
          "title": "Cryptomania",
          "date": "TBA",
          "time": "TBA",
          "location": "TBA",
          "category": "Competition",
          "description": "Participate in the exciting Cryptomania competition.",
          "registrationLink": "#",
          "isTeamEvent": false,
          "imageUrl": ""
        },
        {
          "id": "event-solo-11",
          "title": "Singularity",
          "date": "TBA",
          "time": "TBA",
          "location": "TBA",
          "category": "Competition",
          "description": "Participate in the exciting Singularity competition.",
          "registrationLink": "#",
          "isTeamEvent": false,
          "imageUrl": "/images/event_banner/Singularity-segment.jpg"
        },
        {
          "id": "event-team-12",
          "title": "Escape Room",
          "date": "TBA",
          "time": "TBA",
          "location": "TBA",
          "category": "Competition",
          "description": "A thrilling team event (Escape Room) where logic and teamwork matter.",
          "registrationLink": "#",
          "isTeamEvent": true,
          "teamSize": 3,
          "imageUrl": "/images/event_banner/Escape-Room.jpg"
        },
        {
          "id": "event-team-15",
          "title": "Tic-Tac-Toe",
          "date": "TBA",
          "time": "TBA",
          "location": "TBA",
          "category": "Competition",
          "description": "A tactical grid match where math formulas and patterns meet board-game maneuvers. Exclusive to Primary and Junior categories.",
          "registrationLink": "#",
          "isTeamEvent": true,
          "teamSize": 3,
          "imageUrl": "/images/event_banner/tic-tac-toe.jpg"
        }
      ]
  },
  members_list: {
    title: "OUR MEMBERS",
    subtitle: "COMMUNITY",
    description: "The heartbeat of Josephite Math Club - our diverse and passionate community of mathematicians.",
    members: []
  },
  registration: {
    fee: "200 BDT",
    bkashNumber: "01712345678",
    declaration: "I am willing to join the Josephite Math Club, I promise to perform my duties with honesty, respect the club values, and work for its development",
    registrationOpen: true,
    registrationClosedMessage: "Registration for the current intra-events is currently closed. Please stay tuned for future updates.",
    instructions: [
      "Go to your bKash app or dial *247#",
      "Select \"Send Money\" and enter the number above",
      "Enter the registration fee amount",
      "Copy the Transaction ID (TrxID) and enter it below"
    ],
    cashInstructions: "Please pay your registration fee to the club treasurer."
  },
  interSegments: [
    { id: "Math Olympiad (Find-based)", name: "Math Olympiad (Find-based)", tagline: "Solve numeric mysteries and discover deep hidden structural patterns.", category: "Solo track", icon: "Trophy", isTeamEvent: false, teamSize: 1, isFree: true, bannerUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80", description: "Test your numeric intuition and mathematical pattern recognition under time constraints. Find exact numerical values without writing long proofs." },
    { id: "Math Olympiad (Proof-based)", name: "Math Olympiad (Proof-based)", tagline: "Draft elegant formal proofs and logically sound explanations.", category: "Solo track", icon: "FileText", isTeamEvent: false, teamSize: 1, isFree: true, bannerUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80", description: "Demonstrate rigorous logical deduction and mathematical elegance by constructing full formal proofs across geometry, number theory, and algebra." },
    { id: "IQ Test", name: "IQ Test", tagline: "Race against the clock in analytical speed reasoning.", category: "Solo track", icon: "Brain", isTeamEvent: false, teamSize: 1, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80", description: "A rapid-fire series of spatial, visual, and analytical logic puzzles designed to evaluate fluid intelligence and cognitive processing speed." },
    { id: "Human Calculator", name: "Human Calculator", tagline: "Unleash super-speed mental arithmetic and calculation loops.", category: "Solo track", icon: "Zap", isTeamEvent: false, teamSize: 1, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&w=1200&q=80", description: "Battle time and mental fatigue in rapid mental math playoffs! Calculate complex multiplications, square roots, and percentages without scratch paper." },
    { id: "Genesis", name: "Genesis", tagline: "Interactive math design and scientific origin-based discovery.", category: "Solo track", icon: "Sparkles", isTeamEvent: false, teamSize: 1, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80", description: "Explore the origin stories of fundamental mathematical constants, geometric theorems, and historical mathematical breakthroughs." },
    { id: "Geometry Dash", name: "Geometry Dash", tagline: "Navigate space calculations, angle proofs, and vector mazes.", category: "Solo track", icon: "Compass", isTeamEvent: false, teamSize: 1, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1509228627152-72ae946807b1?auto=format&fit=crop&w=1200&q=80", description: "Navigate spatial reasoning, coordinate plane geometry, circle theorems, and 3D vector geometry problems in a high-octane quiz format." },
    { id: "Probability Pressure", name: "Probability Pressure", tagline: "Calculate rapid-fire odds and stochastic outcomes under stress.", category: "Solo track", icon: "Timer", isTeamEvent: false, teamSize: 1, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1200&q=80", description: "Calculate odds, permutations, combinations, and conditional probabilities under intense countdown timer pressure." },
    { id: "Murder Mystery", name: "Murder Mystery", tagline: "Deduce clues and crack mathematical murder mystery cases.", category: "Team / Solo track", icon: "Eye", isTeamEvent: true, teamSize: 3, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=1200&q=80", description: "Channel your inner mathematical detective! Use cryptanalysis, logic grids, and probability elimination to solve a fictional crime scene case." },
    { id: "Crack the Code", name: "Crack the Code", tagline: "Deconstruct cryptographic ciphers and decode encrypted strings.", category: "Solo track", icon: "Lock", isTeamEvent: false, teamSize: 1, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80", description: "Decrypt complex ciphers, frequency analysis substitution puzzles, binary strings, and modular arithmetic cryptography." },
    { id: "Complex Calamity", name: "Complex Calamity", tagline: "Grapple with complex numbers, imaginary axes, and fractals.", category: "Solo track", icon: "HelpCircle", isTeamEvent: false, teamSize: 1, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=1200&q=80", description: "A specialized solo challenge tackling imaginary axes, Euler's formula, polar coordinates, and complex plane transformations." },
    { id: "Sudoku", name: "Sudoku", tagline: "Solve grid placement challenges with extreme speed precision.", category: "Solo track", icon: "Grid", isTeamEvent: false, teamSize: 1, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80", description: "Compete in speed-solving custom high-difficulty Sudoku grids, testing spatial placement and structural constraint solving." },
    { id: "Rubik’s Cube Showdown", name: "Rubik’s Cube Showdown", tagline: "Manipulate cubic modules and solve cubes in record times.", category: "Solo track", icon: "Layers", isTeamEvent: false, teamSize: 1, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=1200&q=80", description: "Speedcubing tournament for 3x3, 4x4, and custom puzzle cubes. Speed, finger tricks, and algorithmic muscle memory win the day." },
    { id: "5 min Professor", name: "5 min Professor", tagline: "Deliver a lightning lecture explaining abstract concepts simply.", category: "Solo track", icon: "Award", isTeamEvent: false, teamSize: 1, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1200&q=80", description: "Prepare and deliver a 5-minute concise presentation explaining an advanced or abstract mathematical topic to a panel of judges." },
    { id: "Calculus Bee", name: "Calculus Bee", tagline: "Solve derivatives and integral equations in real-time playoffs.", category: "Solo track", icon: "Activity", isTeamEvent: false, teamSize: 1, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1200&q=80", description: "Live playoff competition calculating derivatives, definite integrals, differential equations, and limits on a whiteboard." },
    { id: "Escape Room", name: "Escape Room", tagline: "Team physical & mental escape room challenge.", category: "Team track", icon: "Users", isTeamEvent: true, teamSize: 3, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1519074069444-1ba4eff56022?auto=format&fit=crop&w=1200&q=80", description: "Team physical & mental escape room challenge. Solve locked chests, hidden mathematical ciphers, and physical puzzle locks to escape within 30 minutes." },
    { id: "Combi Verse", name: "Combi Verse", tagline: "Deep dive into graph theory networks, pigeonhole principle.", category: "Solo track", icon: "Layers", isTeamEvent: false, teamSize: 1, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1509228627152-72ae946807b1?auto=format&fit=crop&w=1200&q=80", description: "Deep dive into graph theory networks, pigeonhole principle, recurrence relations, and combinatorial game strategy." },
    { id: "Math Memes", name: "Math Memes", tagline: "Unleash your humor and witty mathematical intellect!", category: "Solo track", icon: "Smile", isTeamEvent: false, teamSize: 1, isFree: true, bannerUrl: "https://images.unsplash.com/photo-1531403009284-440f080d1e12?auto=format&fit=crop&w=1200&q=80", description: "Unleash your humor and witty mathematical intellect! Create hilarious, high-concept memes blending popular culture with mathematical theory." },
    { id: "Math Article", name: "Math Article", tagline: "Write and submit an insightful research or expository paper.", category: "Solo track", icon: "FileText", isTeamEvent: false, teamSize: 1, isFree: true, bannerUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1200&q=80", description: "Write and submit an insightful research or expository paper highlighting a fascinating mathematical application or historical theorem." },
    { id: "Math Vision", name: "Math Vision", tagline: "Digital graphic design competition.", category: "Solo track", icon: "ImageIcon", isTeamEvent: false, teamSize: 1, isFree: true, bannerUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&q=80", description: "Digital graphic design competition. Create stunning digital artwork illustrating mathematical fractals, golden spirals, or geometric art." },
    { id: "Math Drawing", name: "Math Drawing", tagline: "Hand-drawn artistic competition.", category: "Solo track", icon: "Edit", isTeamEvent: false, teamSize: 1, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=1200&q=80", description: "Hand-drawn artistic competition. Sketch pristine artwork illustrating mathematical concepts, tessellations, or non-Euclidean geometry." },
    { id: "Truss", name: "Truss", tagline: "Engineering team competition! Build high-load bridge trusses.", category: "Team track", icon: "Construction", isTeamEvent: true, teamSize: 3, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80", description: "Engineering team competition! Build high-load structurally sound physical bridge trusses using popsicles and glue to withstand maximum mechanical weights." },
    { id: "Wall Magazine Display", name: "Wall Magazine Display", tagline: "Design an informative physical wall poster/magazine.", category: "Team track", icon: "Layout", isTeamEvent: true, teamSize: 3, isFree: false, bannerUrl: "https://images.unsplash.com/photo-1526721940322-10fb6e3ae94a?auto=format&fit=crop&w=1200&q=80", description: "Design an informative, visually captivating physical wall poster/magazine showcasing mathematical discoveries, history, or modern research." }
  ],
  festivalCalendar: {
    title: "10th Josephite National Math Festival",
    location: "St. Joseph Higher Secondary School, 97 Asad Avenue, Mohammadpur, Dhaka-1207",
    events: [
      { day: "Day 1", dateStr: "24 Sept 2026", isoDate: "2026-09-24", title: "10th Josephite National Math Festival - Day 1 (Solo Segments)", description: "Solo Math Olympiad, Speed Math, Rubik's Cube, Sudoku & IQ Test. Venue: St. Joseph Higher Secondary School campus.", location: "St. Joseph Higher Secondary School, 97 Asad Avenue, Mohammadpur, Dhaka-1207" },
      { day: "Day 2", dateStr: "25 Sept 2026", isoDate: "2026-09-25", title: "10th Josephite National Math Festival - Day 2 (Team Mania & Workshops)", description: "Team Math Mania, Game of Games, Math Quiz, Escape Room & Interactive Math Workshops.", location: "St. Joseph Higher Secondary School, 97 Asad Avenue, Mohammadpur, Dhaka-1207" },
      { day: "Day 3", dateStr: "26 Sept 2026", isoDate: "2026-09-26", title: "10th Josephite National Math Festival - Grand Finale & Awards", description: "Grand Finale, Exhibition, Closing Ceremony & Prize Distribution. St. Joseph Campus.", location: "St. Joseph Higher Secondary School, 97 Asad Avenue, Mohammadpur, Dhaka-1207" }
    ]
  },
  handouts: {
    title: "Session Handouts",
    description: "Access official handouts, session notes, and resources compiled by the club moderators.",
    sessions: [
      {
        id: "default-session-1",
        name: "Day One",
        description: "Introduction to basic problem-solving, arithmetic principles, and club orientation details.",
        fileUrl: "",
        date: "July 19, 2026"
      }
    ]
  },
  resources: MATH_RESOURCES
};
