// ============================================================
// Digambar11 — Pre-Prod Environment
// Provides full dummy data for testing all features end-to-end
// Activated via ?env=preprod URL parameter (admin only)
// ============================================================

(function() {
  'use strict';

  // ====== DETECT PRE-PROD MODE ======
  const params = new URLSearchParams(window.location.search);
  if (params.get('env') !== 'preprod') return; // Exit silently in prod

  console.log('🧪 PRE-PROD MODE ACTIVE — All data is dummy/mock');

  // ====== VISUAL INDICATOR ======
  window.addEventListener('DOMContentLoaded', () => {
    const banner = document.createElement('div');
    banner.id = 'preprod-banner';
    banner.innerHTML = '🧪 PRE-PROD MODE — Dummy Data';
    banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;background:linear-gradient(90deg,#F59E0B,#D97706);color:#000;text-align:center;font-size:11px;font-weight:800;padding:3px 0;letter-spacing:0.5px;';
    document.body.prepend(banner);
    // Push the app down slightly
    const app = document.querySelector('.app');
    if (app) app.style.marginTop = '22px';
  });

  // ====== DUMMY USER ======
  const MOCK_USER = {
    id: 'preprod-user-001',
    email: 'bahetipiyush@gmail.com',
    name: 'Piyush (Test)',
    squadName: 'TestWarriors11',
    avatarUrl: null,
    walletBalance: 5000,
  };

  // ====== DUMMY MATCHES ======
  const now = new Date();
  const hr = (h) => { const d = new Date(now); d.setHours(d.getHours() + h); return d.toISOString(); };
  const ago = (h) => { const d = new Date(now); d.setHours(d.getHours() - h); return d.toISOString(); };

  const MOCK_MATCHES = [
    // Live match
    {
      id: 901, external_id: 'preprod_901', team_a: 'CSK', team_b: 'MI',
      team_a_name: 'Chennai', team_b_name: 'Mumbai',
      venue: 'MA Chidambaram Stadium, Chennai',
      starts_at: ago(1), status: 'live',
      score_a: '178/4 (18.2)', score_b: '95/3 (12.0)',
      result: null, innings: 2, updated_at: now.toISOString(),
    },
    // Upcoming matches
    {
      id: 902, external_id: 'preprod_902', team_a: 'RCB', team_b: 'KKR',
      team_a_name: 'Bangalore', team_b_name: 'Kolkata',
      venue: 'M. Chinnaswamy Stadium, Bengaluru',
      starts_at: hr(4), status: 'upcoming',
      score_a: '', score_b: '',
      result: null, innings: 0, updated_at: now.toISOString(),
    },
    {
      id: 903, external_id: 'preprod_903', team_a: 'DC', team_b: 'SRH',
      team_a_name: 'Delhi', team_b_name: 'Hyderabad',
      venue: 'Arun Jaitley Stadium, Delhi',
      starts_at: hr(28), status: 'upcoming',
      score_a: '', score_b: '',
      result: null, innings: 0, updated_at: now.toISOString(),
    },
    {
      id: 904, external_id: 'preprod_904', team_a: 'GT', team_b: 'RR',
      team_a_name: 'Gujarat', team_b_name: 'Rajasthan',
      venue: 'Narendra Modi Stadium, Ahmedabad',
      starts_at: hr(52), status: 'upcoming',
      score_a: '', score_b: '',
      result: null, innings: 0, updated_at: now.toISOString(),
    },
    {
      id: 905, external_id: 'preprod_905', team_a: 'PBKS', team_b: 'LSG',
      team_a_name: 'Punjab', team_b_name: 'Lucknow',
      venue: 'PCA Stadium, Mohali',
      starts_at: hr(76), status: 'upcoming',
      score_a: '', score_b: '',
      result: null, innings: 0, updated_at: now.toISOString(),
    },
    // Completed matches
    {
      id: 906, external_id: 'preprod_906', team_a: 'MI', team_b: 'RCB',
      team_a_name: 'Mumbai', team_b_name: 'Bangalore',
      venue: 'Wankhede Stadium, Mumbai',
      starts_at: ago(48), status: 'completed',
      score_a: '192/5 (20.0)', score_b: '188/8 (20.0)',
      result: 'Mumbai Indians won by 4 runs', innings: 2, updated_at: ago(44),
    },
    {
      id: 907, external_id: 'preprod_907', team_a: 'KKR', team_b: 'DC',
      team_a_name: 'Kolkata', team_b_name: 'Delhi',
      venue: 'Eden Gardens, Kolkata',
      starts_at: ago(72), status: 'completed',
      score_a: '210/3 (20.0)', score_b: '185/9 (20.0)',
      result: 'Kolkata Knight Riders won by 25 runs', innings: 2, updated_at: ago(68),
    },
  ];

  // ====== DUMMY PLAYERS (for all 10 teams) ======
  const MOCK_PLAYERS = {
    CSK: [
      { id: 'p001', name: 'MS Dhoni', team: 'CSK', role: 'WK', credit: 9.0, overseas: false, pts: 245, sel_pct: 78 },
      { id: 'p002', name: 'Ruturaj Gaikwad', team: 'CSK', role: 'BAT', credit: 10.0, overseas: false, pts: 412, sel_pct: 92 },
      { id: 'p003', name: 'Devon Conway', team: 'CSK', role: 'BAT', credit: 9.0, overseas: true, pts: 356, sel_pct: 68 },
      { id: 'p004', name: 'Shivam Dube', team: 'CSK', role: 'AR', credit: 8.5, overseas: false, pts: 298, sel_pct: 55 },
      { id: 'p005', name: 'Ravindra Jadeja', team: 'CSK', role: 'AR', credit: 9.5, overseas: false, pts: 378, sel_pct: 85 },
      { id: 'p006', name: 'Deepak Chahar', team: 'CSK', role: 'BWL', credit: 8.5, overseas: false, pts: 312, sel_pct: 62 },
      { id: 'p007', name: 'Matheesha Pathirana', team: 'CSK', role: 'BWL', credit: 8.0, overseas: true, pts: 289, sel_pct: 58 },
      { id: 'p008', name: 'Tushar Deshpande', team: 'CSK', role: 'BWL', credit: 7.0, overseas: false, pts: 198, sel_pct: 32 },
      { id: 'p009', name: 'Rachin Ravindra', team: 'CSK', role: 'AR', credit: 8.5, overseas: true, pts: 267, sel_pct: 48 },
      { id: 'p010', name: 'Shaik Rasheed', team: 'CSK', role: 'BAT', credit: 7.0, overseas: false, pts: 178, sel_pct: 25 },
      { id: 'p011', name: 'Noor Ahmad', team: 'CSK', role: 'BWL', credit: 7.5, overseas: true, pts: 234, sel_pct: 42 },
      { id: 'p012', name: 'R Ashwin', team: 'CSK', role: 'BWL', credit: 8.0, overseas: false, pts: 256, sel_pct: 45 },
    ],
    MI: [
      { id: 'p013', name: 'Ishan Kishan', team: 'MI', role: 'WK', credit: 8.5, overseas: false, pts: 312, sel_pct: 65 },
      { id: 'p014', name: 'Rohit Sharma', team: 'MI', role: 'BAT', credit: 10.5, overseas: false, pts: 445, sel_pct: 88 },
      { id: 'p015', name: 'Suryakumar Yadav', team: 'MI', role: 'BAT', credit: 10.0, overseas: false, pts: 423, sel_pct: 82 },
      { id: 'p016', name: 'Tilak Varma', team: 'MI', role: 'BAT', credit: 8.5, overseas: false, pts: 345, sel_pct: 72 },
      { id: 'p017', name: 'Hardik Pandya', team: 'MI', role: 'AR', credit: 9.5, overseas: false, pts: 389, sel_pct: 80 },
      { id: 'p018', name: 'Tim David', team: 'MI', role: 'BAT', credit: 8.0, overseas: true, pts: 267, sel_pct: 52 },
      { id: 'p019', name: 'Jasprit Bumrah', team: 'MI', role: 'BWL', credit: 11.0, overseas: false, pts: 478, sel_pct: 95 },
      { id: 'p020', name: 'Trent Boult', team: 'MI', role: 'BWL', credit: 9.0, overseas: true, pts: 356, sel_pct: 70 },
      { id: 'p021', name: 'Piyush Chawla', team: 'MI', role: 'BWL', credit: 7.0, overseas: false, pts: 189, sel_pct: 28 },
      { id: 'p022', name: 'Naman Dhir', team: 'MI', role: 'AR', credit: 7.5, overseas: false, pts: 212, sel_pct: 35 },
      { id: 'p023', name: 'Deepak Hooda', team: 'MI', role: 'AR', credit: 7.5, overseas: false, pts: 198, sel_pct: 30 },
      { id: 'p024', name: 'Will Jacks', team: 'MI', role: 'AR', credit: 8.5, overseas: true, pts: 278, sel_pct: 55 },
    ],
    RCB: [
      { id: 'p025', name: 'Dinesh Karthik', team: 'RCB', role: 'WK', credit: 8.0, overseas: false, pts: 210, sel_pct: 45 },
      { id: 'p026', name: 'Virat Kohli', team: 'RCB', role: 'BAT', credit: 11.0, overseas: false, pts: 480, sel_pct: 96 },
      { id: 'p027', name: 'Faf du Plessis', team: 'RCB', role: 'BAT', credit: 9.5, overseas: true, pts: 390, sel_pct: 78 },
      { id: 'p028', name: 'Glenn Maxwell', team: 'RCB', role: 'AR', credit: 9.0, overseas: true, pts: 345, sel_pct: 72 },
      { id: 'p029', name: 'Cameron Green', team: 'RCB', role: 'AR', credit: 8.5, overseas: true, pts: 290, sel_pct: 55 },
      { id: 'p030', name: 'Mohammed Siraj', team: 'RCB', role: 'BWL', credit: 9.0, overseas: false, pts: 367, sel_pct: 75 },
      { id: 'p031', name: 'Josh Hazlewood', team: 'RCB', role: 'BWL', credit: 8.5, overseas: true, pts: 310, sel_pct: 60 },
      { id: 'p032', name: 'Wanindu Hasaranga', team: 'RCB', role: 'BWL', credit: 8.0, overseas: true, pts: 280, sel_pct: 50 },
      { id: 'p033', name: 'Shahbaz Ahmed', team: 'RCB', role: 'AR', credit: 7.5, overseas: false, pts: 220, sel_pct: 35 },
      { id: 'p034', name: 'Rajat Patidar', team: 'RCB', role: 'BAT', credit: 8.0, overseas: false, pts: 260, sel_pct: 48 },
      { id: 'p035', name: 'Karn Sharma', team: 'RCB', role: 'BWL', credit: 6.5, overseas: false, pts: 170, sel_pct: 20 },
      { id: 'p036', name: 'Anuj Rawat', team: 'RCB', role: 'WK', credit: 6.5, overseas: false, pts: 150, sel_pct: 15 },
    ],
    KKR: [
      { id: 'p037', name: 'Phil Salt', team: 'KKR', role: 'WK', credit: 9.0, overseas: true, pts: 380, sel_pct: 80 },
      { id: 'p038', name: 'Shreyas Iyer', team: 'KKR', role: 'BAT', credit: 9.5, overseas: false, pts: 390, sel_pct: 82 },
      { id: 'p039', name: 'Nitish Rana', team: 'KKR', role: 'BAT', credit: 8.0, overseas: false, pts: 280, sel_pct: 52 },
      { id: 'p040', name: 'Andre Russell', team: 'KKR', role: 'AR', credit: 10.0, overseas: true, pts: 420, sel_pct: 90 },
      { id: 'p041', name: 'Sunil Narine', team: 'KKR', role: 'AR', credit: 9.5, overseas: true, pts: 400, sel_pct: 85 },
      { id: 'p042', name: 'Mitchell Starc', team: 'KKR', role: 'BWL', credit: 9.5, overseas: true, pts: 370, sel_pct: 78 },
      { id: 'p043', name: 'Varun Chakaravarthy', team: 'KKR', role: 'BWL', credit: 8.0, overseas: false, pts: 300, sel_pct: 60 },
      { id: 'p044', name: 'Harshit Rana', team: 'KKR', role: 'BWL', credit: 7.5, overseas: false, pts: 245, sel_pct: 40 },
      { id: 'p045', name: 'Rinku Singh', team: 'KKR', role: 'BAT', credit: 8.5, overseas: false, pts: 320, sel_pct: 70 },
      { id: 'p046', name: 'Venkatesh Iyer', team: 'KKR', role: 'AR', credit: 8.0, overseas: false, pts: 270, sel_pct: 48 },
      { id: 'p047', name: 'Anukul Roy', team: 'KKR', role: 'BWL', credit: 6.5, overseas: false, pts: 160, sel_pct: 18 },
      { id: 'p048', name: 'Ramandeep Singh', team: 'KKR', role: 'AR', credit: 7.0, overseas: false, pts: 190, sel_pct: 25 },
    ],
    DC: [
      { id: 'p049', name: 'Rishabh Pant', team: 'DC', role: 'WK', credit: 10.0, overseas: false, pts: 430, sel_pct: 90 },
      { id: 'p050', name: 'David Warner', team: 'DC', role: 'BAT', credit: 9.5, overseas: true, pts: 380, sel_pct: 76 },
      { id: 'p051', name: 'Prithvi Shaw', team: 'DC', role: 'BAT', credit: 7.5, overseas: false, pts: 240, sel_pct: 42 },
      { id: 'p052', name: 'Axar Patel', team: 'DC', role: 'AR', credit: 8.5, overseas: false, pts: 310, sel_pct: 65 },
      { id: 'p053', name: 'Mitchell Marsh', team: 'DC', role: 'AR', credit: 9.0, overseas: true, pts: 340, sel_pct: 68 },
      { id: 'p054', name: 'Anrich Nortje', team: 'DC', role: 'BWL', credit: 8.5, overseas: true, pts: 300, sel_pct: 58 },
      { id: 'p055', name: 'Kuldeep Yadav', team: 'DC', role: 'BWL', credit: 9.0, overseas: false, pts: 350, sel_pct: 74 },
      { id: 'p056', name: 'Ishant Sharma', team: 'DC', role: 'BWL', credit: 7.0, overseas: false, pts: 200, sel_pct: 30 },
      { id: 'p057', name: 'Abishek Porel', team: 'DC', role: 'WK', credit: 7.0, overseas: false, pts: 185, sel_pct: 22 },
      { id: 'p058', name: 'Tristan Stubbs', team: 'DC', role: 'BAT', credit: 7.5, overseas: true, pts: 230, sel_pct: 38 },
      { id: 'p059', name: 'Mukesh Kumar', team: 'DC', role: 'BWL', credit: 7.5, overseas: false, pts: 250, sel_pct: 42 },
      { id: 'p060', name: 'Lalit Yadav', team: 'DC', role: 'AR', credit: 6.5, overseas: false, pts: 165, sel_pct: 18 },
    ],
    SRH: [
      { id: 'p061', name: 'Heinrich Klaasen', team: 'SRH', role: 'WK', credit: 9.5, overseas: true, pts: 400, sel_pct: 85 },
      { id: 'p062', name: 'Travis Head', team: 'SRH', role: 'BAT', credit: 10.0, overseas: true, pts: 450, sel_pct: 92 },
      { id: 'p063', name: 'Abhishek Sharma', team: 'SRH', role: 'AR', credit: 8.5, overseas: false, pts: 320, sel_pct: 65 },
      { id: 'p064', name: 'Pat Cummins', team: 'SRH', role: 'BWL', credit: 9.5, overseas: true, pts: 380, sel_pct: 80 },
      { id: 'p065', name: 'Bhuvneshwar Kumar', team: 'SRH', role: 'BWL', credit: 8.0, overseas: false, pts: 290, sel_pct: 55 },
      { id: 'p066', name: 'T Natarajan', team: 'SRH', role: 'BWL', credit: 7.5, overseas: false, pts: 255, sel_pct: 45 },
      { id: 'p067', name: 'Rahul Tripathi', team: 'SRH', role: 'BAT', credit: 8.0, overseas: false, pts: 275, sel_pct: 50 },
      { id: 'p068', name: 'Aiden Markram', team: 'SRH', role: 'BAT', credit: 8.5, overseas: true, pts: 300, sel_pct: 58 },
      { id: 'p069', name: 'Washington Sundar', team: 'SRH', role: 'AR', credit: 7.5, overseas: false, pts: 240, sel_pct: 40 },
      { id: 'p070', name: 'Mayank Agarwal', team: 'SRH', role: 'BAT', credit: 7.0, overseas: false, pts: 210, sel_pct: 32 },
      { id: 'p071', name: 'Umran Malik', team: 'SRH', role: 'BWL', credit: 7.5, overseas: false, pts: 230, sel_pct: 38 },
      { id: 'p072', name: 'Marco Jansen', team: 'SRH', role: 'AR', credit: 8.0, overseas: true, pts: 265, sel_pct: 48 },
    ],
    GT: [
      { id: 'p073', name: 'Wriddhiman Saha', team: 'GT', role: 'WK', credit: 7.5, overseas: false, pts: 220, sel_pct: 38 },
      { id: 'p074', name: 'Shubman Gill', team: 'GT', role: 'BAT', credit: 10.0, overseas: false, pts: 440, sel_pct: 90 },
      { id: 'p075', name: 'Sai Sudharsan', team: 'GT', role: 'BAT', credit: 8.0, overseas: false, pts: 290, sel_pct: 55 },
      { id: 'p076', name: 'Rashid Khan', team: 'GT', role: 'BWL', credit: 10.0, overseas: true, pts: 420, sel_pct: 88 },
      { id: 'p077', name: 'Mohammed Shami', team: 'GT', role: 'BWL', credit: 9.0, overseas: false, pts: 360, sel_pct: 72 },
      { id: 'p078', name: 'Rahul Tewatia', team: 'GT', role: 'AR', credit: 8.0, overseas: false, pts: 280, sel_pct: 52 },
      { id: 'p079', name: 'Vijay Shankar', team: 'GT', role: 'AR', credit: 7.5, overseas: false, pts: 245, sel_pct: 42 },
      { id: 'p080', name: 'David Miller', team: 'GT', role: 'BAT', credit: 8.5, overseas: true, pts: 310, sel_pct: 62 },
      { id: 'p081', name: 'Kane Williamson', team: 'GT', role: 'BAT', credit: 8.5, overseas: true, pts: 290, sel_pct: 50 },
      { id: 'p082', name: 'Noor Ahmad', team: 'GT', role: 'BWL', credit: 7.0, overseas: true, pts: 220, sel_pct: 35 },
      { id: 'p083', name: 'Josh Little', team: 'GT', role: 'BWL', credit: 7.5, overseas: true, pts: 240, sel_pct: 40 },
      { id: 'p084', name: 'Darshan Nalkande', team: 'GT', role: 'BWL', credit: 6.5, overseas: false, pts: 170, sel_pct: 18 },
    ],
    RR: [
      { id: 'p085', name: 'Sanju Samson', team: 'RR', role: 'WK', credit: 9.5, overseas: false, pts: 410, sel_pct: 86 },
      { id: 'p086', name: 'Jos Buttler', team: 'RR', role: 'BAT', credit: 10.5, overseas: true, pts: 460, sel_pct: 94 },
      { id: 'p087', name: 'Yashasvi Jaiswal', team: 'RR', role: 'BAT', credit: 9.5, overseas: false, pts: 400, sel_pct: 84 },
      { id: 'p088', name: 'Shimron Hetmyer', team: 'RR', role: 'BAT', credit: 8.0, overseas: true, pts: 270, sel_pct: 50 },
      { id: 'p089', name: 'Ravichandran Ashwin', team: 'RR', role: 'AR', credit: 8.0, overseas: false, pts: 280, sel_pct: 52 },
      { id: 'p090', name: 'Trent Boult', team: 'RR', role: 'BWL', credit: 9.0, overseas: true, pts: 350, sel_pct: 70 },
      { id: 'p091', name: 'Yuzvendra Chahal', team: 'RR', role: 'BWL', credit: 8.5, overseas: false, pts: 330, sel_pct: 66 },
      { id: 'p092', name: 'Sandeep Sharma', team: 'RR', role: 'BWL', credit: 7.0, overseas: false, pts: 210, sel_pct: 30 },
      { id: 'p093', name: 'Riyan Parag', team: 'RR', role: 'AR', credit: 8.0, overseas: false, pts: 275, sel_pct: 50 },
      { id: 'p094', name: 'Dhruv Jurel', team: 'RR', role: 'WK', credit: 7.0, overseas: false, pts: 190, sel_pct: 25 },
      { id: 'p095', name: 'Navdeep Saini', team: 'RR', role: 'BWL', credit: 7.0, overseas: false, pts: 200, sel_pct: 28 },
      { id: 'p096', name: 'Rovman Powell', team: 'RR', role: 'BAT', credit: 7.5, overseas: true, pts: 230, sel_pct: 38 },
    ],
    PBKS: [
      { id: 'p097', name: 'Jonny Bairstow', team: 'PBKS', role: 'WK', credit: 9.0, overseas: true, pts: 360, sel_pct: 72 },
      { id: 'p098', name: 'Shikhar Dhawan', team: 'PBKS', role: 'BAT', credit: 8.5, overseas: false, pts: 310, sel_pct: 60 },
      { id: 'p099', name: 'Liam Livingstone', team: 'PBKS', role: 'AR', credit: 9.0, overseas: true, pts: 340, sel_pct: 68 },
      { id: 'p100', name: 'Sam Curran', team: 'PBKS', role: 'AR', credit: 9.0, overseas: true, pts: 350, sel_pct: 72 },
      { id: 'p101', name: 'Arshdeep Singh', team: 'PBKS', role: 'BWL', credit: 8.5, overseas: false, pts: 320, sel_pct: 65 },
      { id: 'p102', name: 'Kagiso Rabada', team: 'PBKS', role: 'BWL', credit: 9.5, overseas: true, pts: 380, sel_pct: 78 },
      { id: 'p103', name: 'Rahul Chahar', team: 'PBKS', role: 'BWL', credit: 7.5, overseas: false, pts: 240, sel_pct: 40 },
      { id: 'p104', name: 'Jitesh Sharma', team: 'PBKS', role: 'WK', credit: 7.0, overseas: false, pts: 200, sel_pct: 30 },
      { id: 'p105', name: 'Prabhsimran Singh', team: 'PBKS', role: 'BAT', credit: 7.0, overseas: false, pts: 210, sel_pct: 32 },
      { id: 'p106', name: 'Harpreet Brar', team: 'PBKS', role: 'AR', credit: 7.0, overseas: false, pts: 220, sel_pct: 35 },
      { id: 'p107', name: 'Nathan Ellis', team: 'PBKS', role: 'BWL', credit: 7.5, overseas: true, pts: 230, sel_pct: 38 },
      { id: 'p108', name: 'Sikandar Raza', team: 'PBKS', role: 'AR', credit: 7.5, overseas: true, pts: 225, sel_pct: 36 },
    ],
    LSG: [
      { id: 'p109', name: 'KL Rahul', team: 'LSG', role: 'WK', credit: 10.0, overseas: false, pts: 430, sel_pct: 88 },
      { id: 'p110', name: 'Quinton de Kock', team: 'LSG', role: 'WK', credit: 9.0, overseas: true, pts: 360, sel_pct: 72 },
      { id: 'p111', name: 'Marcus Stoinis', team: 'LSG', role: 'AR', credit: 9.0, overseas: true, pts: 340, sel_pct: 68 },
      { id: 'p112', name: 'Krunal Pandya', team: 'LSG', role: 'AR', credit: 8.0, overseas: false, pts: 275, sel_pct: 50 },
      { id: 'p113', name: 'Ravi Bishnoi', team: 'LSG', role: 'BWL', credit: 8.0, overseas: false, pts: 300, sel_pct: 58 },
      { id: 'p114', name: 'Mark Wood', team: 'LSG', role: 'BWL', credit: 8.5, overseas: true, pts: 310, sel_pct: 62 },
      { id: 'p115', name: 'Avesh Khan', team: 'LSG', role: 'BWL', credit: 7.5, overseas: false, pts: 245, sel_pct: 42 },
      { id: 'p116', name: 'Deepak Hooda', team: 'LSG', role: 'AR', credit: 7.5, overseas: false, pts: 230, sel_pct: 38 },
      { id: 'p117', name: 'Ayush Badoni', team: 'LSG', role: 'BAT', credit: 7.5, overseas: false, pts: 240, sel_pct: 40 },
      { id: 'p118', name: 'Kyle Mayers', team: 'LSG', role: 'BAT', credit: 8.0, overseas: true, pts: 270, sel_pct: 48 },
      { id: 'p119', name: 'Mohsin Khan', team: 'LSG', role: 'BWL', credit: 7.0, overseas: false, pts: 210, sel_pct: 30 },
      { id: 'p120', name: 'Devdutt Padikkal', team: 'LSG', role: 'BAT', credit: 7.5, overseas: false, pts: 235, sel_pct: 38 },
    ],
  };

  // ====== DUMMY CONTESTS ======
  const MOCK_CONTESTS = [
    {
      id: 'c001', match_id: 901, name: 'Friends League', created_by: MOCK_USER.id,
      entry_fee: 25, prize_pool: 250, max_entries: 20, invite_code: 'TESTFRNDS',
      contest_entries: [
        { user_id: 'u001', rank: 1, winnings: 100, profiles: { name: 'Rahul', squad_name: 'RahulXI' }, user_teams: { total_points: 156.5 } },
        { user_id: 'u002', rank: 2, winnings: 60, profiles: { name: 'Sneha', squad_name: 'QueenSneha' }, user_teams: { total_points: 142.0 } },
        { user_id: 'u003', rank: 3, winnings: 40, profiles: { name: 'Amit', squad_name: 'AmitStrikers' }, user_teams: { total_points: 138.5 } },
        { user_id: MOCK_USER.id, rank: 4, winnings: 25, profiles: { name: MOCK_USER.name, squad_name: MOCK_USER.squadName }, user_teams: { total_points: 130.0 } },
        { user_id: 'u004', rank: 5, winnings: 25, profiles: { name: 'Vikram', squad_name: 'VikramForce' }, user_teams: { total_points: 125.0 } },
      ],
    },
    {
      id: 'c002', match_id: 901, name: 'Mega Contest', created_by: 'u001',
      entry_fee: 50, prize_pool: 1000, max_entries: 50, invite_code: 'MEGA2026',
      contest_entries: [
        { user_id: 'u005', rank: 1, winnings: 500, profiles: { name: 'Priya', squad_name: 'PriyaPower' }, user_teams: { total_points: 180.0 } },
        { user_id: 'u006', rank: 2, winnings: 200, profiles: { name: 'Arjun', squad_name: 'ArjunWarriors' }, user_teams: { total_points: 165.5 } },
      ],
    },
    {
      id: 'c003', match_id: 902, name: 'RCB vs KKR League', created_by: MOCK_USER.id,
      entry_fee: 100, prize_pool: 500, max_entries: 10, invite_code: 'RCBKKR26',
      contest_entries: [
        { user_id: MOCK_USER.id, rank: null, winnings: 0, profiles: { name: MOCK_USER.name, squad_name: MOCK_USER.squadName }, user_teams: { total_points: 0 } },
        { user_id: 'u001', rank: null, winnings: 0, profiles: { name: 'Rahul', squad_name: 'RahulXI' }, user_teams: { total_points: 0 } },
      ],
    },
  ];

  // ====== DUMMY TRANSACTIONS ======
  const MOCK_TRANSACTIONS = [
    { id: 't001', user_id: MOCK_USER.id, type: 'deposit', amount: 1000, description: 'Added via UPI', balance_after: 5000, created_at: ago(24) },
    { id: 't002', user_id: MOCK_USER.id, type: 'entry_fee', amount: -25, description: 'Contest entry: Friends League (CSK vs MI)', balance_after: 4975, created_at: ago(20) },
    { id: 't003', user_id: MOCK_USER.id, type: 'winnings', amount: 50, description: 'Winnings: RR vs GT', balance_after: 5025, created_at: ago(48) },
    { id: 't004', user_id: MOCK_USER.id, type: 'entry_fee', amount: -100, description: 'Contest entry: RCB vs KKR League', balance_after: 4925, created_at: ago(12) },
    { id: 't005', user_id: MOCK_USER.id, type: 'deposit', amount: 500, description: 'Bonus: Welcome offer', balance_after: 5425, created_at: ago(96) },
    { id: 't006', user_id: MOCK_USER.id, type: 'winnings', amount: 150, description: 'Winnings: MI vs RCB Mega Contest', balance_after: 5575, created_at: ago(72) },
    { id: 't007', user_id: MOCK_USER.id, type: 'entry_fee', amount: -50, description: 'Contest entry: Mega Contest (CSK vs MI)', balance_after: 5525, created_at: ago(6) },
    { id: 't008', user_id: MOCK_USER.id, type: 'withdrawal', amount: -525, description: 'Withdrawal to bank', balance_after: 5000, created_at: ago(4) },
  ];

  // ====== DUMMY LEADERBOARD ======
  const MOCK_LEADERBOARD = [
    { total_points: 180.0, rank: 1, profiles: { name: 'Priya', squad_name: 'PriyaPower' } },
    { total_points: 165.5, rank: 2, profiles: { name: 'Arjun', squad_name: 'ArjunWarriors' } },
    { total_points: 156.5, rank: 3, profiles: { name: 'Rahul', squad_name: 'RahulXI' } },
    { total_points: 142.0, rank: 4, profiles: { name: 'Sneha', squad_name: 'QueenSneha' } },
    { total_points: 138.5, rank: 5, profiles: { name: 'Amit', squad_name: 'AmitStrikers' } },
    { total_points: 130.0, rank: 6, profiles: { name: MOCK_USER.name, squad_name: MOCK_USER.squadName } },
    { total_points: 125.0, rank: 7, profiles: { name: 'Vikram', squad_name: 'VikramForce' } },
    { total_points: 118.5, rank: 8, profiles: { name: 'Neha', squad_name: 'NehaBlasters' } },
    { total_points: 112.0, rank: 9, profiles: { name: 'Karan', squad_name: 'KaranKings' } },
    { total_points: 105.5, rank: 10, profiles: { name: 'Divya', squad_name: 'DivyaDynamos' } },
  ];

  // ====== DUMMY LIVE SCORES ======
  const MOCK_LIVE_SCORES = [
    { id: 'ls01', match_id: 901, player_id: 'p002', fantasy_pts: 78.5, players: { name: 'Ruturaj Gaikwad', team: 'CSK', role: 'BAT', credit: 10.0 } },
    { id: 'ls02', match_id: 901, player_id: 'p014', fantasy_pts: 65.0, players: { name: 'Rohit Sharma', team: 'MI', role: 'BAT', credit: 10.5 } },
    { id: 'ls03', match_id: 901, player_id: 'p005', fantasy_pts: 52.0, players: { name: 'Ravindra Jadeja', team: 'CSK', role: 'AR', credit: 9.5 } },
    { id: 'ls04', match_id: 901, player_id: 'p019', fantasy_pts: 48.5, players: { name: 'Jasprit Bumrah', team: 'MI', role: 'BWL', credit: 11.0 } },
    { id: 'ls05', match_id: 901, player_id: 'p001', fantasy_pts: 35.0, players: { name: 'MS Dhoni', team: 'CSK', role: 'WK', credit: 9.0 } },
    { id: 'ls06', match_id: 901, player_id: 'p017', fantasy_pts: 32.0, players: { name: 'Hardik Pandya', team: 'MI', role: 'AR', credit: 9.5 } },
    { id: 'ls07', match_id: 901, player_id: 'p006', fantasy_pts: 28.5, players: { name: 'Deepak Chahar', team: 'CSK', role: 'BWL', credit: 8.5 } },
    { id: 'ls08', match_id: 901, player_id: 'p015', fantasy_pts: 25.0, players: { name: 'Suryakumar Yadav', team: 'MI', role: 'BAT', credit: 10.0 } },
  ];

  // ====== DUMMY MY TEAM ======
  const MOCK_MY_TEAM = {
    id: 'ut001', user_id: MOCK_USER.id, match_id: 901, total_points: 130.0,
    captain_id: 'p002', vice_captain_id: 'p019',
    user_team_players: [
      { player_id: 'p001', players: { id: 'p001', name: 'MS Dhoni', team: 'CSK', role: 'WK', credit: 9.0 } },
      { player_id: 'p002', players: { id: 'p002', name: 'Ruturaj Gaikwad', team: 'CSK', role: 'BAT', credit: 10.0 } },
      { player_id: 'p003', players: { id: 'p003', name: 'Devon Conway', team: 'CSK', role: 'BAT', credit: 9.0 } },
      { player_id: 'p005', players: { id: 'p005', name: 'Ravindra Jadeja', team: 'CSK', role: 'AR', credit: 9.5 } },
      { player_id: 'p006', players: { id: 'p006', name: 'Deepak Chahar', team: 'CSK', role: 'BWL', credit: 8.5 } },
      { player_id: 'p007', players: { id: 'p007', name: 'Matheesha Pathirana', team: 'CSK', role: 'BWL', credit: 8.0 } },
      { player_id: 'p014', players: { id: 'p014', name: 'Rohit Sharma', team: 'MI', role: 'BAT', credit: 10.5 } },
      { player_id: 'p015', players: { id: 'p015', name: 'Suryakumar Yadav', team: 'MI', role: 'BAT', credit: 10.0 } },
      { player_id: 'p017', players: { id: 'p017', name: 'Hardik Pandya', team: 'MI', role: 'AR', credit: 9.5 } },
      { player_id: 'p019', players: { id: 'p019', name: 'Jasprit Bumrah', team: 'MI', role: 'BWL', credit: 11.0 } },
      { player_id: 'p020', players: { id: 'p020', name: 'Trent Boult', team: 'MI', role: 'BWL', credit: 9.0 } },
    ],
  };

  // ====== DUMMY FRIENDS ======
  const MOCK_FRIENDS = [
    { id: 'u001', name: 'Rahul', squad_name: 'RahulXI', avatar_url: null },
    { id: 'u002', name: 'Sneha', squad_name: 'QueenSneha', avatar_url: null },
    { id: 'u003', name: 'Amit', squad_name: 'AmitStrikers', avatar_url: null },
    { id: 'u004', name: 'Vikram', squad_name: 'VikramForce', avatar_url: null },
    { id: 'u005', name: 'Priya', squad_name: 'PriyaPower', avatar_url: null },
  ];

  // ====== OVERRIDE D11API WHEN READY ======
  function overrideAPI() {
    if (typeof window.D11API === 'undefined') {
      // Try again after supabase-client.js loads
      setTimeout(overrideAPI, 100);
      return;
    }

    const originalAPI = { ...window.D11API };

    // Auth overrides
    window.D11API.getUser = async () => MOCK_USER;
    window.D11API.googleLogin = async () => {
      console.log('🧪 Pre-prod: Simulated Google login');
      return { url: null };
    };
    window.D11API.setSquadName = async (name) => {
      MOCK_USER.squadName = name;
      return { success: true };
    };
    window.D11API.updateProfile = async (updates) => {
      Object.assign(MOCK_USER, updates);
      return { success: true };
    };
    window.D11API.logout = async () => {
      console.log('🧪 Pre-prod: Simulated logout');
    };

    // Matches overrides
    window.D11API.getMatches = async (status) => {
      if (status) return MOCK_MATCHES.filter(m => m.status === status);
      return MOCK_MATCHES;
    };
    window.D11API.getMatch = async (matchId) => {
      return MOCK_MATCHES.find(m => m.id === matchId || m.id === Number(matchId)) || null;
    };

    // Players overrides
    window.D11API.getPlayers = async (team) => {
      if (team) return MOCK_PLAYERS[team] || [];
      return Object.values(MOCK_PLAYERS).flat();
    };
    window.D11API.getPlayersByMatch = async (matchId) => {
      const match = MOCK_MATCHES.find(m => m.id === matchId || m.id === Number(matchId));
      if (!match) return [];
      return [...(MOCK_PLAYERS[match.team_a] || []), ...(MOCK_PLAYERS[match.team_b] || [])];
    };

    // Team overrides
    window.D11API.saveTeam = async (matchId, playerIds, captainId, viceCaptainId) => {
      console.log('🧪 Pre-prod: Team saved', { matchId, playerIds: playerIds.length, captainId, viceCaptainId });
      return { success: true, team_id: 'preprod-team-001' };
    };
    window.D11API.getMyTeam = async (matchId) => {
      if (matchId === 901 || matchId === '901') return MOCK_MY_TEAM;
      return null;
    };

    // Contests overrides
    window.D11API.getContestsByMatch = async (matchId) => {
      return MOCK_CONTESTS.filter(c => c.match_id === matchId || c.match_id === Number(matchId));
    };
    window.D11API.createContest = async (matchId, name, entryFee) => {
      const c = { id: 'c_new_' + Date.now(), match_id: matchId, name: name || 'New Contest', entry_fee: entryFee || 25, prize_pool: entryFee || 25, max_entries: 20, invite_code: 'NEW' + Date.now().toString(36).toUpperCase(), contest_entries: [] };
      MOCK_CONTESTS.push(c);
      return { success: true, contest: c };
    };
    window.D11API.joinContest = async (contestId, userTeamId) => {
      console.log('🧪 Pre-prod: Joined contest', contestId);
      return { success: true };
    };
    window.D11API.joinByInviteCode = async (code) => {
      const c = MOCK_CONTESTS.find(c => c.invite_code === code);
      return c ? { contestId: c.id } : { success: false, error: 'Invalid invite code' };
    };

    // Live Scores overrides
    window.D11API.getLiveScores = async (matchId) => {
      return MOCK_LIVE_SCORES.filter(s => s.match_id === matchId || s.match_id === Number(matchId));
    };
    window.D11API.subscribeToMatch = async (matchId, onUpdate) => {
      console.log('🧪 Pre-prod: Simulated Realtime subscription for match', matchId);
      // Simulate periodic updates
      const interval = setInterval(() => {
        MOCK_LIVE_SCORES.forEach(s => {
          s.fantasy_pts += Math.round((Math.random() * 3 - 0.5) * 10) / 10;
          if (s.fantasy_pts < 0) s.fantasy_pts = 0;
        });
        onUpdate({ type: 'score_update', scores: MOCK_LIVE_SCORES });
      }, 8000);
      return { unsubscribe: () => clearInterval(interval) };
    };
    window.D11API.unsubscribeLive = () => console.log('🧪 Pre-prod: Unsubscribed');

    // Wallet overrides
    window.D11API.getBalance = async () => MOCK_USER.walletBalance;
    window.D11API.getTransactions = async (limit) => MOCK_TRANSACTIONS.slice(0, limit || 20);

    // Leaderboard overrides
    window.D11API.getMatchLeaderboard = async (matchId) => MOCK_LEADERBOARD;
    window.D11API.getContestLeaderboard = async (contestId) => {
      const c = MOCK_CONTESTS.find(c => c.id === contestId);
      return c ? c.contest_entries : [];
    };

    // Friends overrides
    window.D11API.getFriends = async () => MOCK_FRIENDS;

    // Admin overrides (still allow admin to work but with mock data)
    window.D11API.syncMatches = async () => {
      console.log('🧪 Pre-prod: Simulated match sync');
      return { success: true, provider: 'preprod-mock', matches_synced: MOCK_MATCHES.length, matches_skipped: 0, api_calls_made: 0 };
    };
    window.D11API.getProviderStatus = async () => {
      return { reachable: true, provider: 'preprod-mock', note: 'Pre-prod mode — using dummy data' };
    };
    window.D11API.triggerLiveUpdate = async (matchExternalId) => {
      console.log('🧪 Pre-prod: Simulated live update for', matchExternalId);
      return { success: true, score_a: '178/4 (18.2)', score_b: '95/3 (12.0)', status: 'live' };
    };

    // Score poller — use mock data
    window.D11API.startScorePolling = (matchId, onUpdate, interval) => {
      console.log('🧪 Pre-prod: Mock score polling started');
      const iv = setInterval(() => {
        MOCK_LIVE_SCORES.forEach(s => {
          s.fantasy_pts += Math.round((Math.random() * 2) * 10) / 10;
        });
        onUpdate(MOCK_LIVE_SCORES);
      }, interval || 5000);
      window._mockScorePolling = iv;
    };
    window.D11API.stopScorePolling = () => {
      if (window._mockScorePolling) clearInterval(window._mockScorePolling);
      console.log('🧪 Pre-prod: Mock score polling stopped');
    };

    // Init override — skip real Supabase auth
    window.D11API.init = async () => {
      console.log('🧪 Pre-prod: Supabase init skipped (using mock data)');
      return null;
    };

    console.log('🧪 D11API overridden with pre-prod mock data');
    console.log('🧪 Available: 7 matches, 120 players, 3 contests, 8 transactions, leaderboard, live scores');
  }

  // Start overriding
  overrideAPI();

  // ====== OVERRIDE initApp to skip real Supabase auth ======
  window.addEventListener('load', () => {
    // Give a tick for the normal initApp to be defined
    setTimeout(() => {
      // Force-show the user as logged in
      window.userName = MOCK_USER.name;
      window.userSquadName = MOCK_USER.squadName;
      if (typeof updateSquadNameUI === 'function') updateSquadNameUI();

      // If we're still on splash or login, go to home
      const hash = window.location.hash.slice(1);
      if (!hash || hash === 'splash' || hash === 'login') {
        if (typeof showScreen === 'function') showScreen('home');
      }
    }, 300);
  });

})();
