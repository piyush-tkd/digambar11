(function() {
  'use strict';

  // ====== UTILITY FUNCTIONS ======
  function randomDelay() {
    return Math.random() * 150 + 50; // 50-200ms
  }

  function getStorage(key, defaultValue) {
    const stored = sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  }

  function setStorage(key, value) {
    sessionStorage.setItem(key, JSON.stringify(value));
  }

  // ====== IPL TEAMS DATA ======
  const IPL_TEAMS = {
    CSK: { code: 'CSK', name: 'Chennai Super Kings', color: '#FFCB05', bgColor: '#004BA0' },
    MI: { code: 'MI', name: 'Mumbai Indians', color: '#004BA0', bgColor: '#1E293B' },
    RCB: { code: 'RCB', name: 'Royal Challengers Bangalore', color: '#D4213D', bgColor: '#1E1E2E' },
    KKR: { code: 'KKR', name: 'Kolkata Knight Riders', color: '#3A225D', bgColor: '#1E1E2E' },
    DC: { code: 'DC', name: 'Delhi Capitals', color: '#004C93', bgColor: '#1E293B' },
    SRH: { code: 'SRH', name: 'Sunrisers Hyderabad', color: '#FF822A', bgColor: '#1E1E2E' },
    RR: { code: 'RR', name: 'Rajasthan Royals', color: '#EA1A85', bgColor: '#1E293B' },
    PBKS: { code: 'PBKS', name: 'Punjab Kings', color: '#ED1B24', bgColor: '#1E1E2E' },
    GT: { code: 'GT', name: 'Gujarat Titans', color: '#1C1C2B', bgColor: '#1E293B' },
    LSG: { code: 'LSG', name: 'Lucknow Super Giants', color: '#A72056', bgColor: '#1E1E2E' }
  };

  // ====== PLAYERS DATA ======
  const CSK_PLAYERS = [
    { id: 'csk_1', name: 'MS Dhoni', team: 'CSK', role: 'WK', credit: 9.0, overseas: false, pts: 0, selPct: 95 },
    { id: 'csk_2', name: 'Ruturaj Gaikwad', team: 'CSK', role: 'BAT', credit: 10.0, overseas: false, pts: 0, selPct: 88 },
    { id: 'csk_3', name: 'Devon Conway', team: 'CSK', role: 'BAT', credit: 9.0, overseas: true, pts: 0, selPct: 72 },
    { id: 'csk_4', name: 'Shivam Dube', team: 'CSK', role: 'AR', credit: 8.5, overseas: false, pts: 0, selPct: 65 },
    { id: 'csk_5', name: 'Ravindra Jadeja', team: 'CSK', role: 'AR', credit: 9.5, overseas: false, pts: 0, selPct: 92 },
    { id: 'csk_6', name: 'Deepak Chahar', team: 'CSK', role: 'BWL', credit: 8.5, overseas: false, pts: 0, selPct: 78 },
    { id: 'csk_7', name: 'Matheesha Pathirana', team: 'CSK', role: 'BWL', credit: 8.0, overseas: true, pts: 0, selPct: 68 },
    { id: 'csk_8', name: 'Tushar Deshpande', team: 'CSK', role: 'BWL', credit: 7.0, overseas: false, pts: 0, selPct: 45 },
    { id: 'csk_9', name: 'Rachin Ravindra', team: 'CSK', role: 'AR', credit: 8.5, overseas: true, pts: 0, selPct: 52 },
    { id: 'csk_10', name: 'Shaik Rasheed', team: 'CSK', role: 'BAT', credit: 7.0, overseas: false, pts: 0, selPct: 38 },
    { id: 'csk_11', name: 'Noor Ahmad', team: 'CSK', role: 'BWL', credit: 7.5, overseas: true, pts: 0, selPct: 42 },
    { id: 'csk_12', name: 'R Ashwin', team: 'CSK', role: 'BWL', credit: 8.0, overseas: false, pts: 0, selPct: 55 }
  ];

  const MI_PLAYERS = [
    { id: 'mi_1', name: 'Ishan Kishan', team: 'MI', role: 'WK', credit: 8.5, overseas: false, pts: 0, selPct: 82 },
    { id: 'mi_2', name: 'Rohit Sharma', team: 'MI', role: 'BAT', credit: 10.5, overseas: false, pts: 0, selPct: 96 },
    { id: 'mi_3', name: 'Suryakumar Yadav', team: 'MI', role: 'BAT', credit: 10.0, overseas: false, pts: 0, selPct: 91 },
    { id: 'mi_4', name: 'Tilak Varma', team: 'MI', role: 'BAT', credit: 8.5, overseas: false, pts: 0, selPct: 75 },
    { id: 'mi_5', name: 'Hardik Pandya', team: 'MI', role: 'AR', credit: 9.5, overseas: false, pts: 0, selPct: 89 },
    { id: 'mi_6', name: 'Tim David', team: 'MI', role: 'BAT', credit: 8.0, overseas: true, pts: 0, selPct: 61 },
    { id: 'mi_7', name: 'Jasprit Bumrah', team: 'MI', role: 'BWL', credit: 11.0, overseas: false, pts: 0, selPct: 98 },
    { id: 'mi_8', name: 'Trent Boult', team: 'MI', role: 'BWL', credit: 9.0, overseas: true, pts: 0, selPct: 79 },
    { id: 'mi_9', name: 'Piyush Chawla', team: 'MI', role: 'BWL', credit: 7.0, overseas: false, pts: 0, selPct: 48 },
    { id: 'mi_10', name: 'Naman Dhir', team: 'MI', role: 'AR', credit: 7.5, overseas: false, pts: 0, selPct: 35 },
    { id: 'mi_11', name: 'Deepak Hooda', team: 'MI', role: 'AR', credit: 7.5, overseas: false, pts: 0, selPct: 41 },
    { id: 'mi_12', name: 'Will Jacks', team: 'MI', role: 'AR', credit: 8.5, overseas: true, pts: 0, selPct: 58 }
  ];

  const RCB_PLAYERS = [
    { id: 'rcb_1', name: 'Anuj Rawat', team: 'RCB', role: 'WK', credit: 7.5, overseas: false, pts: 0, selPct: 42 },
    { id: 'rcb_2', name: 'Virat Kohli', team: 'RCB', role: 'BAT', credit: 10.5, overseas: false, pts: 0, selPct: 93 },
    { id: 'rcb_3', name: 'du Plessis', team: 'RCB', role: 'BAT', credit: 9.5, overseas: true, pts: 0, selPct: 87 },
    { id: 'rcb_4', name: 'Glenn Maxwell', team: 'RCB', role: 'AR', credit: 9.0, overseas: true, pts: 0, selPct: 74 },
    { id: 'rcb_5', name: 'Rajat Patidar', team: 'RCB', role: 'BAT', credit: 7.5, overseas: false, pts: 0, selPct: 38 },
    { id: 'rcb_6', name: 'Reece Topley', team: 'RCB', role: 'BWL', credit: 8.5, overseas: true, pts: 0, selPct: 65 },
    { id: 'rcb_7', name: 'Mohammed Siraj', team: 'RCB', role: 'BWL', credit: 8.0, overseas: false, pts: 0, selPct: 71 },
    { id: 'rcb_8', name: 'Yash Dayal', team: 'RCB', role: 'BWL', credit: 7.5, overseas: false, pts: 0, selPct: 44 },
    { id: 'rcb_9', name: 'Karn Sharma', team: 'RCB', role: 'BWL', credit: 7.0, overseas: false, pts: 0, selPct: 33 },
    { id: 'rcb_10', name: 'Romesh Shepherd', team: 'RCB', role: 'BWL', credit: 7.5, overseas: true, pts: 0, selPct: 28 },
    { id: 'rcb_11', name: 'Mahipal Lomror', team: 'RCB', role: 'AR', credit: 7.0, overseas: false, pts: 0, selPct: 32 },
    { id: 'rcb_12', name: 'Nuwan Pradeep', team: 'RCB', role: 'BWL', credit: 7.0, overseas: true, pts: 0, selPct: 24 }
  ];

  const KKR_PLAYERS = [
    { id: 'kkr_1', name: 'Phil Salt', team: 'KKR', role: 'WK', credit: 8.5, overseas: true, pts: 0, selPct: 76 },
    { id: 'kkr_2', name: 'Venkatesh Iyer', team: 'KKR', role: 'BAT', credit: 8.0, overseas: false, pts: 0, selPct: 64 },
    { id: 'kkr_3', name: 'Shreyas Iyer', team: 'KKR', role: 'BAT', credit: 9.0, overseas: false, pts: 0, selPct: 81 },
    { id: 'kkr_4', name: 'Anrich Nortje', team: 'KKR', role: 'BWL', credit: 8.5, overseas: true, pts: 0, selPct: 69 },
    { id: 'kkr_5', name: 'Sunil Narine', team: 'KKR', role: 'BWL', credit: 9.0, overseas: true, pts: 0, selPct: 83 },
    { id: 'kkr_6', name: 'Andre Russell', team: 'KKR', role: 'AR', credit: 9.5, overseas: true, pts: 0, selPct: 86 },
    { id: 'kkr_7', name: 'Varun Chakravarthy', team: 'KKR', role: 'BWL', credit: 8.0, overseas: false, pts: 0, selPct: 59 },
    { id: 'kkr_8', name: 'Harshit Rana', team: 'KKR', role: 'BWL', credit: 7.5, overseas: false, pts: 0, selPct: 47 },
    { id: 'kkr_9', name: 'Rinku Singh', team: 'KKR', role: 'BAT', credit: 8.0, overseas: false, pts: 0, selPct: 52 },
    { id: 'kkr_10', name: 'Ramandeep Singh', team: 'KKR', role: 'AR', credit: 7.5, overseas: false, pts: 0, selPct: 29 },
    { id: 'kkr_11', name: 'Mitchell Starc', team: 'KKR', role: 'BWL', credit: 9.5, overseas: true, pts: 0, selPct: 77 },
    { id: 'kkr_12', name: 'Manish Pandey', team: 'KKR', role: 'BAT', credit: 7.5, overseas: false, pts: 0, selPct: 33 }
  ];

  // ====== SQUAD NAME DATA ======
  const SQUAD_NAME_ADJECTIVES = [
    'Savage', 'Thunder', 'Royal', 'Mighty', 'Storm', 'Shadow', 'Blazing', 'Golden',
    'Iron', 'Electric', 'Cosmic', 'Phantom', 'Rising', 'Fearless', 'Wild', 'Stealth',
    'Turbo', 'Mystic', 'Power', 'Ultra', 'Neo', 'Dark', 'Fire', 'Ice', 'Hyper',
    'Alpha', 'Omega', 'Super', 'Mega', 'Prime', 'Elite', 'Rogue', 'Titan'
  ];

  const SQUAD_NAME_NOUNS = [
    'Strikers', 'Warriors', 'Titans', 'Panthers', 'Hawks', 'Wolves', 'Lions', 'Gladiators',
    'Knights', 'Legends', 'Spartans', 'Vipers', 'Dragons', 'Falcons', 'Chargers', 'Mavericks',
    'Blazers', 'Crushers', 'Stormers', 'Raiders', 'Avengers', 'Demons', 'Thunderbolts', 'Jaguars',
    'Cobras', 'Eagles', 'Sharks'
  ];

  const TAKEN_SQUAD_NAMES = [
    'warriors xi', 'thunder xi', 'storm xi', 'phoenix xi', 'blaze xi',
    'royal strikers', 'super kings', 'knight riders'
  ];

  // ====== MATCHES DATA ======
  function getDefaultMatches() {
    return [
      {
        id: 'match_1',
        matchNumber: 1,
        homeTeam: IPL_TEAMS.CSK,
        awayTeam: IPL_TEAMS.MI,
        status: 'completed',
        startTime: '2026-03-20T19:30:00',
        venue: 'MA Chidambaram Stadium, Chennai',
        friendsJoined: 5,
        poolAmount: 150,
        teamsCreated: 6,
        score: {
          home: '185/4',
          homeOvers: '20',
          away: '142/6',
          awayOvers: '16.4',
          summary: 'CSK won by 43 runs'
        }
      },
      {
        id: 'match_2',
        matchNumber: 2,
        homeTeam: IPL_TEAMS.RCB,
        awayTeam: IPL_TEAMS.KKR,
        status: 'live',
        startTime: '2026-03-21T19:30:00',
        venue: 'M. Chinnaswamy Stadium, Bangalore',
        friendsJoined: 4,
        poolAmount: 150,
        teamsCreated: 5,
        score: {
          home: '127/4',
          homeOvers: '15.2',
          away: null,
          awayOvers: null,
          summary: 'RCB batting, need to bat well'
        }
      },
      {
        id: 'match_3',
        matchNumber: 3,
        homeTeam: IPL_TEAMS.DC,
        awayTeam: IPL_TEAMS.SRH,
        status: 'upcoming',
        startTime: '2026-03-22T15:30:00',
        venue: 'Arun Jaitley Stadium, Delhi',
        friendsJoined: 3,
        poolAmount: 150,
        teamsCreated: 4,
        score: null
      },
      {
        id: 'match_4',
        matchNumber: 4,
        homeTeam: IPL_TEAMS.RR,
        awayTeam: IPL_TEAMS.PBKS,
        status: 'upcoming',
        startTime: '2026-03-23T19:30:00',
        venue: 'Sawai Mansingh Stadium, Jaipur',
        friendsJoined: 2,
        poolAmount: 125,
        teamsCreated: 3,
        score: null
      },
      {
        id: 'match_5',
        matchNumber: 5,
        homeTeam: IPL_TEAMS.GT,
        awayTeam: IPL_TEAMS.LSG,
        status: 'upcoming',
        startTime: '2026-03-24T19:30:00',
        venue: 'Narendra Modi Stadium, Ahmedabad',
        friendsJoined: 1,
        poolAmount: 100,
        teamsCreated: 2,
        score: null
      }
    ];
  }

  // ====== FRIENDS DATA ======
  function getDefaultFriends() {
    return [
      { name: 'Rahul K', handle: '@rahul_k', wins: 8, losses: 4, net: 175, avatar: 'RK' },
      { name: 'Amit S', handle: '@amit_s', wins: 6, losses: 6, net: 25, avatar: 'AS' },
      { name: 'Sneha P', handle: '@sneha_p', wins: 5, losses: 7, net: -50, avatar: 'SP' },
      { name: 'Vikram J', handle: '@vikram_j', wins: 5, losses: 7, net: -100, avatar: 'VJ' },
      { name: 'Priya M', handle: '@priya_m', wins: 4, losses: 8, net: -150, avatar: 'PM' }
    ];
  }

  // ====== WALLET DATA ======
  function getDefaultWallet() {
    return {
      balance: 175,
      transactions: [
        { id: 'txn_1', title: 'Won Match 1 - RCB vs KKR', date: '2026-03-20', amount: 75, type: 'credit' },
        { id: 'txn_2', title: 'Joined Match 2 - CSK vs MI', date: '2026-03-19', amount: 50, type: 'debit' },
        { id: 'txn_3', title: 'Won Match 3 - DC vs SRH', date: '2026-03-18', amount: 100, type: 'credit' },
        { id: 'txn_4', title: 'Joined Match 4 - RR vs PBKS', date: '2026-03-17', amount: 50, type: 'debit' },
        { id: 'txn_5', title: 'Sign-up Bonus', date: '2026-03-15', amount: 100, type: 'credit' }
      ]
    };
  }

  // ====== API OBJECT ======
  const API = {
    // ====== AUTH ======
    googleLogin: function(googleUser) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const user = {
            id: 'user_' + Date.now(),
            name: googleUser?.name || 'Player',
            email: googleUser?.email || 'player@digambar11.com',
            avatar: googleUser?.avatar || 'https://via.placeholder.com/40',
            squadName: null
          };
          setStorage('d11_user', user);
          resolve(user);
        }, randomDelay());
      });
    },

    setSquadName: function(name) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const validation = this.checkSquadName(name);
          if (!validation.available) {
            reject(new Error(validation.error));
            return;
          }
          const user = getStorage('d11_user', null);
          if (!user) {
            reject(new Error('User not logged in'));
            return;
          }
          user.squadName = name;
          setStorage('d11_user', user);
          resolve({ success: true, squadName: name });
        }, randomDelay());
      });
    },

    getUser: function() {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(getStorage('d11_user', null));
        }, randomDelay());
      });
    },

    logout: function() {
      return new Promise((resolve) => {
        setTimeout(() => {
          sessionStorage.removeItem('d11_user');
          sessionStorage.removeItem('d11_teams');
          resolve({ success: true });
        }, randomDelay());
      });
    },

    // ====== MATCHES ======
    getMatches: function() {
      return new Promise((resolve) => {
        setTimeout(() => {
          const matches = getStorage('d11_matches', getDefaultMatches());
          setStorage('d11_matches', matches);
          resolve(matches);
        }, randomDelay());
      });
    },

    getMatch: function(matchId) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const matches = getStorage('d11_matches', getDefaultMatches());
          const match = matches.find(m => m.id === matchId);
          if (!match) {
            reject(new Error('Match not found'));
            return;
          }
          resolve(match);
        }, randomDelay());
      });
    },

    // ====== PLAYERS ======
    getPlayers: function(matchId) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const matches = getStorage('d11_matches', getDefaultMatches());
          const match = matches.find(m => m.id === matchId);
          if (!match) {
            reject(new Error('Match not found'));
            return;
          }

          let homeTeamPlayers = [];
          let awayTeamPlayers = [];

          if (match.homeTeam.code === 'CSK') homeTeamPlayers = CSK_PLAYERS;
          else if (match.homeTeam.code === 'MI') homeTeamPlayers = MI_PLAYERS;
          else if (match.homeTeam.code === 'RCB') homeTeamPlayers = RCB_PLAYERS;
          else if (match.homeTeam.code === 'KKR') homeTeamPlayers = KKR_PLAYERS;

          if (match.awayTeam.code === 'CSK') awayTeamPlayers = CSK_PLAYERS;
          else if (match.awayTeam.code === 'MI') awayTeamPlayers = MI_PLAYERS;
          else if (match.awayTeam.code === 'RCB') awayTeamPlayers = RCB_PLAYERS;
          else if (match.awayTeam.code === 'KKR') awayTeamPlayers = KKR_PLAYERS;

          resolve({
            homeTeam: match.homeTeam,
            awayTeam: match.awayTeam,
            players: [...homeTeamPlayers, ...awayTeamPlayers]
          });
        }, randomDelay());
      });
    },

    // ====== TEAM MANAGEMENT ======
    validateTeam: function(players) {
      const errors = [];

      if (!players || players.length !== 11) {
        errors.push('Team must have exactly 11 players');
      }

      const roles = players.reduce((acc, p) => {
        acc[p.role] = (acc[p.role] || 0) + 1;
        return acc;
      }, {});

      if (!roles['WK'] || roles['WK'] < 1) errors.push('Minimum 1 wicket-keeper required');
      if (!roles['BAT'] || roles['BAT'] < 3) errors.push('Minimum 3 batsmen required');
      if (!roles['AR'] || roles['AR'] < 1) errors.push('Minimum 1 all-rounder required');
      if (!roles['BWL'] || roles['BWL'] < 3) errors.push('Minimum 3 bowlers required');

      const overseasCount = players.filter(p => p.overseas).length;
      if (overseasCount > 4) errors.push('Maximum 4 overseas players allowed');

      const totalCredits = players.reduce((sum, p) => sum + p.credit, 0);
      if (totalCredits > 100) errors.push(`Total credits exceed 100 (Current: ${totalCredits.toFixed(1)})`);

      return {
        valid: errors.length === 0,
        errors
      };
    },

    saveTeam: function(matchId, players, captainId, viceCaptainId) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const validation = this.validateTeam(players);
          if (!validation.valid) {
            reject(new Error(validation.errors.join(', ')));
            return;
          }

          const teams = getStorage('d11_teams', {});
          teams[matchId] = {
            matchId,
            players,
            captainId,
            viceCaptainId,
            savedAt: new Date().toISOString()
          };
          setStorage('d11_teams', teams);
          resolve({ success: true, team: teams[matchId] });
        }, randomDelay());
      });
    },

    getMyTeam: function(matchId) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const teams = getStorage('d11_teams', {});
          resolve(teams[matchId] || null);
        }, randomDelay());
      });
    },

    // ====== FRIENDS & LEAGUE ======
    getFriends: function() {
      return new Promise((resolve) => {
        setTimeout(() => {
          const friends = getStorage('d11_friends', getDefaultFriends());
          setStorage('d11_friends', friends);
          resolve(friends);
        }, randomDelay());
      });
    },

    getInviteLink: function() {
      return new Promise((resolve) => {
        setTimeout(() => {
          const code = Math.random().toString(36).substring(2, 8).toUpperCase();
          resolve(`https://digambar11.app/join/${code}`);
        }, randomDelay());
      });
    },

    // ====== LIVE MATCH ======
    getLiveData: function(matchId) {
      return new Promise((resolve, reject) => {
        setTimeout(() => {
          if (matchId !== 'match_2') {
            reject(new Error('No live data available for this match'));
            return;
          }

          const liveData = {
            matchId,
            updatedAt: new Date().toISOString(),
            friendSquads: [
              {
                rank: 1,
                name: 'Rahul K',
                squadName: 'Warriors XI',
                pts: 412.5,
                players: [
                  { name: 'Virat Kohli', team: 'RCB', role: 'BAT', pts: 67, status: 'batting', cap: 'C' },
                  { name: 'du Plessis', team: 'RCB', role: 'BAT', pts: 45, status: 'batting' },
                  { name: 'Glenn Maxwell', team: 'RCB', role: 'AR', pts: 38, status: 'waiting' },
                  { name: 'Anuj Rawat', team: 'RCB', role: 'WK', pts: 52, status: 'out' },
                  { name: 'Rajat Patidar', team: 'RCB', role: 'BAT', pts: 28, status: 'waiting' },
                  { name: 'Phil Salt', team: 'KKR', role: 'WK', pts: 61, status: 'batting', cap: 'VC' },
                  { name: 'Andre Russell', team: 'KKR', role: 'AR', pts: 55, status: 'waiting' },
                  { name: 'Sunil Narine', team: 'KKR', role: 'BWL', pts: 44, status: 'bowling' },
                  { name: 'Anrich Nortje', team: 'KKR', role: 'BWL', pts: 14, status: 'bowling' },
                  { name: 'Varun Chakravarthy', team: 'KKR', role: 'BWL', pts: 8, status: 'waiting' },
                  { name: 'Shreyas Iyer', team: 'KKR', role: 'BAT', pts: 0, status: 'waiting' }
                ]
              },
              {
                rank: 2,
                name: 'Piyush',
                squadName: 'Digambar XI',
                pts: 324.5,
                players: [
                  { name: 'Virat Kohli', team: 'RCB', role: 'BAT', pts: 67, status: 'batting' },
                  { name: 'du Plessis', team: 'RCB', role: 'BAT', pts: 45, status: 'batting' },
                  { name: 'Reece Topley', team: 'RCB', role: 'BWL', pts: 22, status: 'bowling' },
                  { name: 'Mohammed Siraj', team: 'RCB', role: 'BWL', pts: 16, status: 'bowling' },
                  { name: 'Anuj Rawat', team: 'RCB', role: 'WK', pts: 52, status: 'out' },
                  { name: 'Phil Salt', team: 'KKR', role: 'WK', pts: 61, status: 'batting', cap: 'C' },
                  { name: 'Andre Russell', team: 'KKR', role: 'AR', pts: 55, status: 'waiting' },
                  { name: 'Mitchell Starc', team: 'KKR', role: 'BWL', pts: 6, status: 'bowling', cap: 'VC' },
                  { name: 'Venkatesh Iyer', team: 'KKR', role: 'BAT', pts: 0, status: 'waiting' },
                  { name: 'Shreyas Iyer', team: 'KKR', role: 'BAT', pts: 0, status: 'waiting' },
                  { name: 'Rinku Singh', team: 'KKR', role: 'BAT', pts: 0, status: 'waiting' }
                ]
              },
              {
                rank: 3,
                name: 'Amit S',
                squadName: 'Thunder XI',
                pts: 298.0,
                players: [
                  { name: 'Virat Kohli', team: 'RCB', role: 'BAT', pts: 67, status: 'batting', cap: 'C' },
                  { name: 'Rajat Patidar', team: 'RCB', role: 'BAT', pts: 28, status: 'waiting' },
                  { name: 'Glenn Maxwell', team: 'RCB', role: 'AR', pts: 38, status: 'waiting' },
                  { name: 'Yash Dayal', team: 'RCB', role: 'BWL', pts: 5, status: 'bowling' },
                  { name: 'Anuj Rawat', team: 'RCB', role: 'WK', pts: 52, status: 'out' },
                  { name: 'Phil Salt', team: 'KKR', role: 'WK', pts: 61, status: 'batting' },
                  { name: 'Shreyas Iyer', team: 'KKR', role: 'BAT', pts: 0, status: 'waiting', cap: 'VC' },
                  { name: 'Andre Russell', team: 'KKR', role: 'AR', pts: 55, status: 'waiting' },
                  { name: 'Sunil Narine', team: 'KKR', role: 'BWL', pts: 44, status: 'bowling' },
                  { name: 'Harshit Rana', team: 'KKR', role: 'BWL', pts: 12, status: 'bowling' },
                  { name: 'Venkatesh Iyer', team: 'KKR', role: 'BAT', pts: 0, status: 'waiting' }
                ]
              },
              {
                rank: 4,
                name: 'Sneha P',
                squadName: 'Phoenix XI',
                pts: 276.5,
                players: [
                  { name: 'Virat Kohli', team: 'RCB', role: 'BAT', pts: 67, status: 'batting' },
                  { name: 'Glenn Maxwell', team: 'RCB', role: 'AR', pts: 38, status: 'waiting' },
                  { name: 'du Plessis', team: 'RCB', role: 'BAT', pts: 45, status: 'batting', cap: 'VC' },
                  { name: 'Mohammed Siraj', team: 'RCB', role: 'BWL', pts: 16, status: 'bowling' },
                  { name: 'Anuj Rawat', team: 'RCB', role: 'WK', pts: 52, status: 'out' },
                  { name: 'Shreyas Iyer', team: 'KKR', role: 'BAT', pts: 0, status: 'waiting', cap: 'C' },
                  { name: 'Phil Salt', team: 'KKR', role: 'WK', pts: 61, status: 'batting' },
                  { name: 'Andre Russell', team: 'KKR', role: 'AR', pts: 55, status: 'waiting' },
                  { name: 'Anrich Nortje', team: 'KKR', role: 'BWL', pts: 14, status: 'bowling' },
                  { name: 'Varun Chakravarthy', team: 'KKR', role: 'BWL', pts: 8, status: 'waiting' },
                  { name: 'Rinku Singh', team: 'KKR', role: 'BAT', pts: 0, status: 'waiting' }
                ]
              }
            ]
          };

          resolve(liveData);
        }, randomDelay());
      });
    },

    // ====== LEADERBOARD ======
    getMatchLeaderboard: function(matchId) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const leaderboard = [
            { rank: 1, name: 'Rahul K', squadName: 'Warriors XI', pts: 412.5, won: true, isYou: false },
            { rank: 2, name: 'Piyush', squadName: 'Digambar XI', pts: 324.5, won: false, isYou: true },
            { rank: 3, name: 'Amit S', squadName: 'Thunder XI', pts: 298.0, won: false, isYou: false },
            { rank: 4, name: 'Sneha P', squadName: 'Phoenix XI', pts: 276.5, won: false, isYou: false },
            { rank: 5, name: 'Vikram J', squadName: 'Storm XI', pts: 245.0, won: false, isYou: false },
            { rank: 6, name: 'Priya M', squadName: 'Blaze XI', pts: 198.5, won: false, isYou: false }
          ];
          resolve(leaderboard);
        }, randomDelay());
      });
    },

    getLeagueStandings: function() {
      return new Promise((resolve) => {
        setTimeout(() => {
          const standings = [
            { rank: 1, name: 'Rahul K', squad: 'Warriors XI', wins: 8, losses: 4, avgPts: 385.2, net: 175, isYou: false },
            { rank: 2, name: 'Piyush', squad: 'Digambar XI', wins: 6, losses: 6, avgPts: 312.5, net: 50, isYou: true },
            { rank: 3, name: 'Amit S', squad: 'Thunder XI', wins: 6, losses: 6, avgPts: 298.0, net: 25, isYou: false },
            { rank: 4, name: 'Sneha P', squad: 'Phoenix XI', wins: 5, losses: 7, avgPts: 275.3, net: -50, isYou: false },
            { rank: 5, name: 'Vikram J', squad: 'Storm XI', wins: 5, losses: 7, avgPts: 265.8, net: -100, isYou: false }
          ];
          resolve(standings);
        }, randomDelay());
      });
    },

    getMatchHistory: function(playerName) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const history = [
            { match: 'CSK vs MI', date: '2026-03-20', rank: 2, pts: 324.5, won: false },
            { match: 'RCB vs KKR', date: '2026-03-15', rank: 1, pts: 412.5, won: true },
            { match: 'DC vs SRH', date: '2026-03-10', rank: 3, pts: 287.0, won: false },
            { match: 'RR vs PBKS', date: '2026-03-05', rank: 1, pts: 398.0, won: true },
            { match: 'GT vs LSG', date: '2026-03-01', rank: 2, pts: 356.5, won: false }
          ];
          resolve(history);
        }, randomDelay());
      });
    },

    // ====== WALLET ======
    getWallet: function() {
      return new Promise((resolve) => {
        setTimeout(() => {
          const wallet = getStorage('d11_wallet', getDefaultWallet());
          setStorage('d11_wallet', wallet);
          resolve(wallet);
        }, randomDelay());
      });
    },

    // ====== SQUAD NAME ======
    checkSquadName: function(name) {
      if (!name || name.trim().length === 0) {
        return { available: false, error: 'Squad name cannot be empty' };
      }
      if (name.length < 3) {
        return { available: false, error: 'Squad name must be at least 3 characters' };
      }
      if (name.length > 25) {
        return { available: false, error: 'Squad name must be at most 25 characters' };
      }
      if (!/^[a-zA-Z0-9\s]+$/.test(name)) {
        return { available: false, error: 'Squad name can only contain letters, numbers, and spaces' };
      }
      if (TAKEN_SQUAD_NAMES.includes(name.toLowerCase())) {
        return { available: false, error: 'This squad name is already taken' };
      }
      return { available: true, error: null };
    },

    generateSquadName: function(firstName) {
      const adjective = SQUAD_NAME_ADJECTIVES[Math.floor(Math.random() * SQUAD_NAME_ADJECTIVES.length)];
      const noun = SQUAD_NAME_NOUNS[Math.floor(Math.random() * SQUAD_NAME_NOUNS.length)];
      return `${adjective} ${noun}`;
    },

    getSuggestions: function(firstName) {
      return new Promise((resolve) => {
        setTimeout(() => {
          const suggestions = [];
          const usedIndices = new Set();

          while (suggestions.length < 6) {
            const adjIdx = Math.floor(Math.random() * SQUAD_NAME_ADJECTIVES.length);
            const nounIdx = Math.floor(Math.random() * SQUAD_NAME_NOUNS.length);
            const key = `${adjIdx}-${nounIdx}`;

            if (!usedIndices.has(key)) {
              usedIndices.add(key);
              const name = `${SQUAD_NAME_ADJECTIVES[adjIdx]} ${SQUAD_NAME_NOUNS[nounIdx]}`;
              if (!TAKEN_SQUAD_NAMES.includes(name.toLowerCase())) {
                suggestions.push(name);
              }
            }
          }

          resolve(suggestions);
        }, randomDelay());
      });
    }
  };

  // Attach to window
  window.D11API = API;
})();
