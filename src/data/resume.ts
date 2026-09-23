// Single source of truth for portfolio content.
// Every theme renders this same data — only the presentation changes.

export const profile = {
  name: "Nithishkumar S",
  firstName: "Nithish",
  lastName: "Kumar",
  initials: "NK",
  role: "Full Stack Developer",
  tagline: "Python · React · ERP Systems",
  location: "Chennai, India",
  email: "snithish006@gmail.com",
  phone: "+91-9360167108",
  // Set to true if you want the phone number shown publicly.
  showPhone: false,
  summary:
    "Project Associate with 2+ years of experience architecting and delivering government-grade ERP, backend and security systems. Expertise across Python, PostgreSQL and REST API development with a strong focus on high-availability infrastructure (Patroni, ETCD) and microservices. Proven track record executing the full SDLC in Agile environments — robust production deployments and hardened system security.",
  shortSummary:
    "I architect government-grade ERP, backend and security systems — high-availability PostgreSQL, microservices and API integrations that stay up.",
};

export const stats = [
  { value: "2+", label: "Years building production systems" },
  { value: "99.9%", label: "Uptime via Patroni + Keepalived HA" },
  { value: "3", label: "Government API integrations (ULIP · VAHAN · SBI PG)" },
  { value: "2", label: "Government organisations served (C-DAC · STQC)" },
];

export type SkillGroup = { group: string; items: string[] };

export const skills: SkillGroup[] = [
  { group: "Languages", items: ["Python", "JavaScript", "C", "C++", "SQL"] },
  { group: "Frontend", items: ["React.js", "Angular", "HTML5", "CSS3", "XML"] },
  {
    group: "Backend & ERP",
    items: ["Node.js", "Odoo ERP", "REST APIs", "Microservices", "API Integration", "System Design"],
  },
  {
    group: "Database",
    items: ["PostgreSQL", "Query Optimization", "Replication", "Failover Configuration"],
  },
  { group: "Infrastructure", items: ["Linux Admin", "Nginx", "Patroni", "ETCD", "Keepalived"] },
  {
    group: "Security",
    items: ["Burp Suite", "AppScan", "WebInspect", "OWASP", "Vulnerability Assessment"],
  },
  { group: "Practices", items: ["Agile", "SDLC", "Performance Optimization"] },
];

export const allSkills = skills.flatMap((g) => g.items);

export type Experience = {
  id: string;
  role: string;
  org: string;
  orgFull: string;
  period: string;
  start: string;
  end: string;
  location: string;
  points: string[];
};

export const experience: Experience[] = [
  {
    id: "cdac",
    role: "Project Associate",
    org: "C-DAC",
    orgFull: "Centre for Development of Advanced Computing, Chennai",
    period: "Oct 2024 — Present",
    start: "2024-10",
    end: "present",
    location: "Chennai",
    points: [
      "Engineered scalable ERP and backend systems using Python and Odoo for government healthcare and education sectors.",
      "Lead developer for the Automated Port Access & Control System, built on Node.js and PostgreSQL.",
      "Optimized SQL queries to handle high-volume transactional data, improving system responsiveness.",
      "Integrated complex government APIs including ULIP, VAHAN and the SBI Payment Gateway for seamless data exchange.",
      "Developed microservices for workflow automation, significantly reducing manual data processing time.",
      "Implemented HA infrastructure with Patroni and Keepalived to ensure 99.9% system uptime.",
      "Authored technical documentation (SRS, FRS) and API references for internal teams and stakeholders.",
    ],
  },
  {
    id: "stqc",
    role: "Security Testing Trainee",
    org: "STQC — MeitY",
    orgFull: "Standardisation Testing and Quality Certification, MeitY, Government of India",
    period: "Oct 2023 — Sep 2024",
    start: "2023-10",
    end: "2024-09",
    location: "India",
    points: [
      "Conducted vulnerability assessments on high-profile systems such as GEPNIC using Burp Suite and WebInspect.",
      "Collaborated with development teams on OWASP compliance remediation within Agile sprint cycles.",
    ],
  },
];

export type Project = {
  slug: string;
  code: string;
  title: string;
  short: string;
  category: string;
  year: string;
  summary: string;
  stack: string[];
  role: string;
  challenge: string;
  approach: string[];
  outcome: string[];
  architecture: { label: string; detail: string }[];
  accent: { gta: string; illusion: string; hacker: string; pro: string };
};

export const projects: Project[] = [
  {
    slug: "apacs",
    code: "APACS",
    title: "Automated Port Access & Control System",
    short: "Port gate automation",
    category: "Microservices · Government Integration",
    year: "2024 —",
    summary:
      "A microservices-based platform for gate automation. React.js frontend on a Node.js backend, wired to multiple government API gateways and shipped through Docker with a CI/CD pipeline.",
    stack: ["React.js", "Node.js", "PostgreSQL", "Microservices", "Docker", "CI/CD", "REST APIs"],
    role: "Lead Developer",
    challenge:
      "Port gates move people, vehicles and cargo continuously. Every entry needs to be validated against external government systems in real time, while the platform itself must never become the bottleneck at the gate.",
    approach: [
      "Decomposed gate workflows into independent microservices so validation, access decisions and audit logging scale and fail independently.",
      "Integrated a React.js operator interface with the Node.js service layer and multiple government API gateways.",
      "Modelled high-volume transactional data in PostgreSQL and tuned the hot queries for gate-time responsiveness.",
      "Containerised every service with Docker and automated delivery through a CI/CD pipeline.",
    ],
    outcome: [
      "Automated gate access flow replacing manual verification steps.",
      "Repeatable, containerised deployments through CI/CD.",
      "A service architecture that isolates failures in third-party gateways from the gate itself.",
    ],
    architecture: [
      { label: "Client", detail: "React.js operator console" },
      { label: "Gateway", detail: "Node.js API layer" },
      { label: "Services", detail: "Access · Validation · Audit microservices" },
      { label: "External", detail: "Government API gateways" },
      { label: "Data", detail: "PostgreSQL" },
      { label: "Delivery", detail: "Docker · CI/CD" },
    ],
    accent: { gta: "#ff2e88", illusion: "#7c5cff", hacker: "#00ff9c", pro: "#1f3a5f" },
  },
  {
    slug: "tb-xray",
    code: "TBX",
    title: "Chest X-Ray TB Diagnosis System",
    short: "ML-assisted diagnosis",
    category: "Healthcare · Machine Learning",
    year: "Healthcare",
    summary:
      "An ML-assisted tuberculosis detection tool built in Python, with a hardened Linux/Apache production deployment and an architecture designed for healthcare reliability.",
    stack: ["Python", "Machine Learning", "Linux", "Apache", "System Architecture"],
    role: "Developer · Deployment",
    challenge:
      "Clinical tools have to be dependable before they can be useful. A detection model is only half the product — the other half is a deployment clinicians can trust to be available and secure.",
    approach: [
      "Built the ML-assisted detection pipeline in Python.",
      "Designed the system architecture around healthcare reliability requirements.",
      "Hardened the Linux/Apache production environment for secure, stable operation.",
    ],
    outcome: [
      "A working ML-assisted screening tool for chest X-rays.",
      "A hardened production deployment designed for reliability.",
    ],
    architecture: [
      { label: "Input", detail: "Chest X-ray images" },
      { label: "Model", detail: "Python ML pipeline" },
      { label: "Serve", detail: "Apache on hardened Linux" },
      { label: "Output", detail: "Assisted diagnosis for clinicians" },
    ],
    accent: { gta: "#00e5ff", illusion: "#ff5ca8", hacker: "#39ff14", pro: "#2d4a3e" },
  },
  {
    slug: "school-erp",
    code: "SERP",
    title: "School ERP System",
    short: "Full-stack Odoo ERP",
    category: "ERP · High Availability",
    year: "Education",
    summary:
      "A full-stack Odoo implementation with database replication and failover strategies — owned end to end across the SDLC, from requirements gathering to production deployment.",
    stack: ["Odoo ERP", "Python", "PostgreSQL", "Replication", "Failover", "Linux"],
    role: "Full-Stack Developer · SDLC Owner",
    challenge:
      "Schools run on their records. An ERP that holds admissions, academics and administration cannot lose data or go offline when a single database node fails.",
    approach: [
      "Gathered requirements with stakeholders and translated them into Odoo modules.",
      "Implemented the full stack on Odoo with Python and PostgreSQL.",
      "Designed database replication and failover strategies for continuity.",
      "Managed the complete SDLC through to production deployment.",
    ],
    outcome: [
      "A production ERP covering the school's operational workflows.",
      "Replicated PostgreSQL with a defined failover path.",
    ],
    architecture: [
      { label: "Users", detail: "Admin · Staff · Academic users" },
      { label: "App", detail: "Odoo ERP modules (Python)" },
      { label: "Primary", detail: "PostgreSQL primary" },
      { label: "Replica", detail: "Streaming replica + failover" },
    ],
    accent: { gta: "#ffb000", illusion: "#00d4c7", hacker: "#00ffd5", pro: "#5a3e1b" },
  },
];

export const education = [
  {
    degree: "B.Tech in Information Technology",
    school: "St. Joseph's Institute of Technology, Chennai",
    period: "2019 — 2023",
    score: "CGPA 7.67",
  },
  {
    degree: "HSC",
    school: "Sydai Sa Duraisamy Matric Hr Sec School",
    period: "2018 — 2019",
    score: "67%",
  },
  { degree: "SSLC", school: "Velammal Vidhyalaya CBSE School", period: "2016 — 2017", score: "82%" },
];

export const certifications = [
  { name: "CCNA", issuer: "Elysium Academy" },
  { name: "Python Programming", issuer: "NSIC" },
  { name: "Fundamentals of Digital Marketing", issuer: "Google" },
  { name: "UI/UX Design", issuer: "NSIC" },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);
