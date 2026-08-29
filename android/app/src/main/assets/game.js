/**
 * DISC RUN - 3D Turntable Runner Game Engine
 * Powered by Three.js & Web Audio API
 */

(function () {
  'use strict';

  // Safe localStorage helper for file:// or private browsing
  function safeGet(key, fallback) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value.toString());
    } catch (e) {
      // Ignore in restricted environments
    }
  }

  function safeRemove(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      // Ignore
    }
  }

  function formatDuration(totalSeconds) {
    const s = Math.floor(totalSeconds % 60);
    const m = Math.floor((totalSeconds / 60) % 60);
    const h = Math.floor(totalSeconds / 3600);
    if (h > 0) {
      return `${h}h ${m}m ${s}s`;
    }
    return `${m}m ${s.toString().padStart(2, '0')}s`;
  }

  // --- 20 Distinct In-Game Runner Achievements ---
  const ACHIEVEMENTS = [
    {
      id: 'first_run',
      icon: '🏃',
      title: 'FIRST STEPS',
      desc: 'Complete your first runner run on the turntable disc',
      reward: 250,
      check: (game) => game.totalRuns >= 1,
      progress: (game) => `${Math.min(1, game.totalRuns)}/1 Runs`
    },
    {
      id: 'perfect_duck_10',
      icon: '⚡',
      title: 'REFLEX NOVICE',
      desc: 'Execute 10 Perfect Ducks under overhead bars',
      reward: 500,
      check: (game) => game.totalPerfectDucks >= 10,
      progress: (game) => `${Math.min(10, game.totalPerfectDucks)}/10 Ducks`
    },
    {
      id: 'perfect_duck_25',
      icon: '⚡',
      title: 'REFLEX VETERAN',
      desc: 'Execute 25 total Perfect Ducks under overhead bars',
      reward: 1500,
      check: (game) => game.totalPerfectDucks >= 25,
      progress: (game) => `${Math.min(25, game.totalPerfectDucks)}/25 Ducks`
    },
    {
      id: 'perfect_duck_50',
      icon: '🧘',
      title: 'ZEN MASTER',
      desc: 'Execute 50 total Perfect Ducks with pinpoint timing',
      reward: 5000,
      check: (game) => game.totalPerfectDucks >= 50,
      progress: (game) => `${Math.min(50, game.totalPerfectDucks)}/50 Ducks`
    },
    {
      id: 'streak_3',
      icon: '🔥',
      title: 'TRIPLE REFLEX',
      desc: 'Achieve a 3x consecutive Perfect Duck streak in a single run',
      reward: 1000,
      check: (game) => game.bestPerfectDuckStreak >= 3,
      progress: (game) => `${Math.min(3, game.bestPerfectDuckStreak)}/3 Streak`
    },
    {
      id: 'orbit_mult_5',
      icon: '🚀',
      title: 'ORBIT SURGE MASTER',
      desc: 'Reach a 5X Orbit Multiplier in a single run (40+ Revs)',
      reward: 5000,
      check: (game) => game.bestRotations >= 40.0,
      progress: (game) => `${Math.min(5, Math.floor(game.bestRotations / 10) + 1)}X/5X Mult`
    },
    {
      id: 'upgrades_5',
      icon: '🛠️',
      title: 'TUNED & READY',
      desc: 'Purchase 5 workshop upgrades across any category',
      reward: 2000,
      check: (game) => ((game.duckLevel - 1) + game.revBonusLevel + game.shieldLevel + game.deflectorLevel + game.boosterLevel + game.magnetLevel) >= 5,
      progress: (game) => `${Math.min(5, (game.duckLevel - 1) + game.revBonusLevel + game.shieldLevel + game.deflectorLevel + game.boosterLevel + game.magnetLevel)}/5 Upgrades`
    },
    {
      id: 'all_upgrades',
      icon: '👑',
      title: 'FULL ARSENAL',
      desc: 'Purchase all workshop upgrades to max out all 6 categories',
      reward: 25000,
      check: (game) => (game.duckLevel >= 10 && game.revBonusLevel >= 5 && game.shieldLevel >= 3 && game.deflectorLevel >= 3 && game.boosterLevel >= 3 && game.magnetLevel >= 3),
      progress: (game) => `${(game.duckLevel - 1) + game.revBonusLevel + game.shieldLevel + game.deflectorLevel + game.boosterLevel + game.magnetLevel}/26 Upgrades`
    },
    {
      id: 'gems_300',
      icon: '💎',
      title: 'CRYSTAL COLLECTOR',
      desc: 'Collect 300 total score gems across your career',
      reward: 5000,
      check: (game) => game.totalGems >= 300,
      progress: (game) => `${Math.min(300, game.totalGems)}/300 Gems`
    },
    {
      id: 'powerups_500',
      icon: '🔋',
      title: 'SUPERCHARGED',
      desc: 'Collect 500 Multiplier and Invincibility powerups',
      reward: 7500,
      check: (game) => game.totalPowerups >= 500,
      progress: (game) => `${Math.min(500, game.totalPowerups)}/500 Powerups`
    },
    {
      id: 'shields_50',
      icon: '🛡️',
      title: 'FORCEFIELD VETERAN',
      desc: 'Absorb 50 fatal obstacle hits using Crash Shields',
      reward: 5000,
      check: (game) => game.totalShieldsUsed >= 50,
      progress: (game) => `${Math.min(50, game.totalShieldsUsed)}/50 Saves`
    },
    {
      id: 'hazards_50',
      icon: '🧿',
      title: 'HAZARD DEFLECTOR',
      desc: 'Deflect 50 stage hazards using the Hazard Deflector',
      reward: 5000,
      check: (game) => game.totalHazardsDeflected >= 50,
      progress: (game) => `${Math.min(50, game.totalHazardsDeflected)}/50 Deflects`
    },
    {
      id: 'portals_50',
      icon: '🌀',
      title: 'DIMENSION HOPPER',
      desc: 'Traverse 50 paired Void Portals in Stage 4/8',
      reward: 5000,
      check: (game) => game.totalPortals >= 50,
      progress: (game) => `${Math.min(50, game.totalPortals)}/50 Warps`
    },
    {
      id: 'rotations_50',
      icon: '🚀',
      title: 'ORBIT CENTURY',
      desc: 'Survive and reach 50.0 Rotations in a single run',
      reward: 5000,
      check: (game) => game.bestRotations >= 50.0,
      progress: (game) => `${Math.min(50, game.bestRotations).toFixed(1)}/50.0 Rot`
    },
    {
      id: 'rotations_100',
      icon: '🌌',
      title: 'DEEP SPACE ORBIT',
      desc: 'Reach 100.0 Rotations in a single run',
      reward: 15000,
      check: (game) => game.bestRotations >= 100.0,
      progress: (game) => `${Math.min(100, game.bestRotations).toFixed(1)}/100.0 Rot`
    },
    {
      id: 'score_10k',
      icon: '🌟',
      title: 'HIGH ROLLER',
      desc: 'Achieve a single-run high score of 10,000 Points',
      reward: 2500,
      check: (game) => game.highScore >= 10000,
      progress: (game) => `${Math.min(10000, game.highScore).toLocaleString()}/10,000 PTS`
    },
    {
      id: 'score_100k',
      icon: '👑',
      title: 'TURNTABLE LEGEND',
      desc: 'Achieve a single-run high score of 100,000 Points',
      reward: 15000,
      check: (game) => game.highScore >= 100000,
      progress: (game) => `${Math.min(100000, game.highScore).toLocaleString()}/100,000 PTS`
    },
    {
      id: 'career_1m',
      icon: '🏆',
      title: 'MILESTONE MILLIONAIRE',
      desc: 'Amass 1,000,000 Total Lifetime Career Points',
      reward: 25000,
      check: (game) => game.careerPoints >= 1000000,
      progress: (game) => `${Math.min(1000000, game.careerPoints).toLocaleString()}/1,000,000 PTS`
    },
    {
      id: 'stage_solar',
      icon: '🌅',
      title: 'SOLAR VOYAGER',
      desc: 'Unlock Stage 2: Solar Flare',
      reward: 1000,
      check: (game) => game.highestSeenStage >= 1 || game.careerPoints >= 7000,
      progress: (game) => (game.highestSeenStage >= 1 || game.careerPoints >= 7000) ? 'UNLOCKED' : 'LOCKED'
    },
    {
      id: 'stage_abyss',
      icon: '🌌',
      title: 'ABYSS CONQUEROR',
      desc: 'Unlock Stage 8: Fractured Abyss (2.5M PTS)',
      reward: 20000,
      check: (game) => game.highestSeenStage >= 7 || game.careerPoints >= 2500000,
      progress: (game) => (game.highestSeenStage >= 7 || game.careerPoints >= 2500000) ? 'UNLOCKED' : 'LOCKED'
    }
  ];

  // --- 8 Distinct Stages Configurations & Interactive Unique Hazards ---
  const STAGES = [
    {
      id: 0,
      name: 'STAGE 1: CYBER GRID',
      shortName: 'STAGE 1',
      unlockPts: 0,
      revPoints: 15,
      revRate: 1.0,
      lanes: [11.0, 14.5, 18.0, 21.5], // 4 lanes
      defaultLane: 1,
      hazardName: 'Overhead Duck Bars',
      theme: {
        bgColor: 0x060714,
        fogColor: 0x060714,
        discBase: 0x0c1024,
        rimColor: 0x00f0ff,
        rimEmissive: 0x00c0ff,
        trackActive: 0x00f0ff,
        trackInactive: 0x3d5885,
        lineColor: 0x1f2e54,
        spindleEmissive: 0xff0055,
        orbColor: 0xff0066,
        ambientLight: 0xffffff,
        dirLight: 0x00f0ff,
        playerGlow: 0x00f0ff,
        centerLight: 0xff0055,
        particleColor: 0x00e1ff,
        blockColor: 0xff0055,
        blockEmissive: 0xaa0033,
        barColor: 0x00f0ff,
        barEmissive: 0x0077bb
      },
      patterns: ['single_block', 'double_block', 'overhead_bar', 'bar_with_block']
    },
    {
      id: 1,
      name: 'STAGE 2: SOLAR FLARE',
      shortName: 'STAGE 2',
      unlockPts: 7000,
      revPoints: 25,
      revRate: 1.6,
      lanes: [10.0, 13.0, 16.0, 19.0, 22.0], // 5 lanes
      defaultLane: 2,
      hazardName: '🔥 Orbiting Fireballs',
      theme: {
        bgColor: 0x140702,
        fogColor: 0x140702,
        discBase: 0x241006,
        rimColor: 0xffaa00,
        rimEmissive: 0xff4400,
        trackActive: 0xffaa00,
        trackInactive: 0x85441a,
        lineColor: 0x4a220d,
        spindleEmissive: 0xff2200,
        orbColor: 0xff7700,
        ambientLight: 0xffe0cc,
        dirLight: 0xffaa00,
        playerGlow: 0xffaa00,
        centerLight: 0xff2200,
        particleColor: 0xffaa00,
        blockColor: 0xff3300,
        blockEmissive: 0x991100,
        barColor: 0xffcc00,
        barEmissive: 0xbb8800
      },
      patterns: ['single_block', 'double_block', 'wide_gap_wall', 'overhead_bar', 'fireball_hazard', 'triple_stagger']
    },
    {
      id: 2,
      name: 'STAGE 3: TOXIC CORE',
      shortName: 'STAGE 3',
      unlockPts: 35000,
      revPoints: 40,
      revRate: 2.4,
      lanes: [10.0, 13.0, 16.0, 19.0, 22.0], // 5 lanes
      defaultLane: 2,
      hazardName: '☣️ Toxic Slime Pools',
      theme: {
        bgColor: 0x02140a,
        fogColor: 0x02140a,
        discBase: 0x062414,
        rimColor: 0x00ff66,
        rimEmissive: 0x00cc44,
        trackActive: 0x00ff66,
        trackInactive: 0x1a8544,
        lineColor: 0x0d4a26,
        spindleEmissive: 0xbf00ff,
        orbColor: 0x9900ff,
        ambientLight: 0xd4ffe0,
        dirLight: 0x00ff66,
        playerGlow: 0x00ff66,
        centerLight: 0xbf00ff,
        particleColor: 0x00ff88,
        blockColor: 0x9900ff,
        blockEmissive: 0x6600aa,
        barColor: 0x00ff66,
        barEmissive: 0x00aa44
      },
      patterns: ['single_block', 'double_block', 'wide_gap_wall', 'overhead_bar', 'toxic_puddle_hazard', 'staggered_gate']
    },
    {
      id: 3,
      name: 'STAGE 4: VOID HORIZON',
      shortName: 'STAGE 4',
      unlockPts: 100000,
      revPoints: 60,
      revRate: 3.5,
      lanes: [9.0, 11.8, 14.6, 17.4, 20.2, 23.0], // 6 lanes
      defaultLane: 2,
      hazardName: '🌀 Warp Portals (+500 PTS)',
      theme: {
        bgColor: 0x0d0417,
        fogColor: 0x0d0417,
        discBase: 0x160826,
        rimColor: 0xcc00ff,
        rimEmissive: 0x9900cc,
        trackActive: 0xffcc00,
        trackInactive: 0x6b299e,
        lineColor: 0x3d1759,
        spindleEmissive: 0xffcc00,
        orbColor: 0xffea00,
        ambientLight: 0xf0d9ff,
        dirLight: 0xcc00ff,
        playerGlow: 0xffcc00,
        centerLight: 0xcc00ff,
        particleColor: 0xd000ff,
        blockColor: 0xff0088,
        blockEmissive: 0xaa0055,
        barColor: 0xffcc00,
        barEmissive: 0xbb8800
      },
      patterns: ['single_block', 'double_block', 'wide_gap_wall', 'overhead_bar', 'void_portal_hazard', 'void_double_bar']
    },
    {
      id: 4,
      name: 'STAGE 5: CYBER GLACIER',
      shortName: 'STAGE 5',
      unlockPts: 250000,
      revPoints: 85,
      revRate: 5.0,
      lanes: [9.0, 11.8, 14.6, 17.4, 20.2, 23.0], // 6 lanes
      defaultLane: 2,
      hazardName: '❄️ Cryo Ice (Slows)',
      theme: {
        bgColor: 0x040e1a,
        fogColor: 0x040e1a,
        discBase: 0x081c2e,
        rimColor: 0x00f5d4,
        rimEmissive: 0x00c4aa,
        trackActive: 0x00f5d4,
        trackInactive: 0x1c4a6b,
        lineColor: 0x0f2a3d,
        spindleEmissive: 0x00f5d4,
        orbColor: 0xe0f7fa,
        ambientLight: 0xe0f7fa,
        dirLight: 0x00f5d4,
        playerGlow: 0x00f5d4,
        centerLight: 0x00f5d4,
        particleColor: 0x80deea,
        blockColor: 0x0288d1,
        blockEmissive: 0x01579b,
        barColor: 0x00f5d4,
        barEmissive: 0x00b4d8
      },
      patterns: ['single_block', 'double_block', 'wide_gap_wall', 'overhead_bar', 'ice_spike_hazard', 'triple_stagger']
    },
    {
      id: 5,
      name: 'STAGE 6: SUPERNOVA',
      shortName: 'STAGE 6',
      unlockPts: 600000,
      revPoints: 120,
      revRate: 7.2,
      lanes: [8.0, 10.5, 13.0, 15.5, 18.0, 20.5, 23.0], // 7 lanes
      defaultLane: 3,
      hazardName: '☀️ Plasma Sweepers',
      theme: {
        bgColor: 0x1a0505,
        fogColor: 0x1a0505,
        discBase: 0x2e0c0c,
        rimColor: 0xffffff,
        rimEmissive: 0xff3300,
        trackActive: 0xffea00,
        trackInactive: 0x801b1b,
        lineColor: 0x471010,
        spindleEmissive: 0xffaa00,
        orbColor: 0xffffff,
        ambientLight: 0xfff0f5,
        dirLight: 0xff3300,
        playerGlow: 0xffea00,
        centerLight: 0xff3300,
        particleColor: 0xffdd00,
        blockColor: 0xff1100,
        blockEmissive: 0x990000,
        barColor: 0xffea00,
        barEmissive: 0xff8800
      },
      patterns: ['single_block', 'double_block', 'wide_gap_wall', 'overhead_bar', 'plasma_sweeper_hazard', 'quantum_matrix']
    },
    {
      id: 6,
      name: 'STAGE 7: NEON HIGHWAY',
      shortName: 'STAGE 7',
      unlockPts: 1200000,
      revPoints: 170,
      revRate: 10.0,
      lanes: [8.0, 10.5, 13.0, 15.5, 18.0, 20.5, 23.0], // 7 lanes
      defaultLane: 3,
      hazardName: '🚗 Lane Shifter Drone',
      theme: {
        bgColor: 0x16021f,
        fogColor: 0x16021f,
        discBase: 0x260733,
        rimColor: 0xff00aa,
        rimEmissive: 0xff0077,
        trackActive: 0x00ffff,
        trackInactive: 0x6e1b64,
        lineColor: 0x471141,
        spindleEmissive: 0x00ffff,
        orbColor: 0xff00aa,
        ambientLight: 0xffd9fa,
        dirLight: 0xff00aa,
        playerGlow: 0x00ffff,
        centerLight: 0xff00aa,
        particleColor: 0xff00bb,
        blockColor: 0xff0066,
        blockEmissive: 0xaa0033,
        barColor: 0x00ffff,
        barEmissive: 0x0088cc
      },
      patterns: ['single_block', 'double_block', 'overhead_bar', 'lane_shifter_hazard', 'wide_gap_wall']
    },
    {
      id: 7,
      name: 'STAGE 8: FRACTURED ABYSS',
      shortName: 'STAGE 8',
      unlockPts: 2500000,
      revPoints: 250,
      revRate: 15.0,
      lanes: [7.5, 9.8, 12.1, 14.4, 16.7, 19.0, 21.3, 23.6], // 8 lanes
      defaultLane: 3,
      hazardName: '⚠️ Collapsing Lanes',
      theme: {
        bgColor: 0x050614,
        fogColor: 0x050614,
        discBase: 0x0d1028,
        rimColor: 0x00f0ff,
        rimEmissive: 0x0088cc,
        trackActive: 0xffea00,
        trackInactive: 0x2e3b6e,
        lineColor: 0x161e3f,
        spindleEmissive: 0x00f0ff,
        orbColor: 0xffea00,
        ambientLight: 0xf0f5ff,
        dirLight: 0x00f0ff,
        playerGlow: 0xffea00,
        centerLight: 0x00f0ff,
        particleColor: 0x00e1ff,
        blockColor: 0xff0066,
        blockEmissive: 0xaa0044,
        barColor: 0xffea00,
        barEmissive: 0xaa7700
      },
      patterns: ['single_block', 'double_block', 'overhead_bar', 'void_portal_hazard', 'wide_gap_wall']
    }
  ];

  // --- Constants & Config ---
  const DISC_RADIUS = 26;
  const DISC_HEIGHT = 1.2;
  const PLAYER_SIZE = 1.15;
  const STANDING_HEIGHT = 1.2;
  const DUCKING_HEIGHT = 0.32;
  const BAR_CLEARANCE_HEIGHT = 0.78;

  // Calibrated Upgrade Progression Tables (6 Upgrades - Premium Economy)
  const BASE_DUCK_DURATION = 0.50;
  const DUCK_INCREMENT = 0.05;
  const MAX_DUCK_LEVEL = 10;
  const DUCK_COSTS = [1200, 3000, 7500, 15000, 28000, 48000, 75000, 115000, 175000];

  const MAX_REV_BONUS_LEVEL = 5;
  const REV_BONUS_TIERS = [0, 1, 3, 6, 10, 15];
  const REV_BONUS_COSTS = [4000, 12000, 32000, 80000, 200000];

  const MAX_SHIELD_LEVEL = 3;
  const SHIELD_COSTS = [5000, 16000, 45000];

  const MAX_DEFLECTOR_LEVEL = 3;
  const DEFLECTOR_COSTS = [8000, 28000, 85000];

  const MAX_BOOSTER_LEVEL = 3;
  const BOOSTER_COSTS = [6000, 20000, 55000];
  const BOOSTER_BONUS_SEC = [0, 3.0, 6.0, 9.0];

  const MAX_MAGNET_LEVEL = 3;
  const MAGNET_COSTS = [30000, 75000, 180000];
  const MAGNET_RADII = [0, 6.0, 12.0, 24.0];

  // Game States
  const STATE = {
    START: 'START',
    DROPPING: 'DROPPING',
    PLAYING: 'PLAYING',
    GAME_OVER: 'GAME_OVER'
  };

  // Reusable vectors for zero GC
  const _tempWorldPos = new THREE.Vector3();
  const _tempPlayerPos = new THREE.Vector3();
  const _tempLocalTarget = new THREE.Vector3();

  // --- Game Engine Class ---
  class DiscRunGame {
    constructor() {
      this.state = STATE.START;
      this.isPaused = false;
      this.canRestart = true;
      this.score = 0;

      // Perfect Duck Combo Multiplier System
      this.perfectDuckStreak = 0;
      this.bestPerfectDuckStreak = parseInt(safeGet('disc_run_best_streak', '0'), 10) || 0;

      // Persistence & Lifetime Stats
      this.highScore = parseInt(safeGet('disc_run_highscore', '0'), 10) || 0;
      this.careerPoints = parseInt(safeGet('disc_run_career_points', '0'), 10) || 0;
      this.bankPoints = parseInt(safeGet('disc_run_bank_points', '0'), 10) || 0;

      // Rewarded Ad States
      this.lastEarnedPoints = 0;
      this.canReviveThisRun = true;
      this.pointsDoubledThisLoss = false;

      this.totalRuns = parseInt(safeGet('disc_run_total_runs', '0'), 10) || 0;
      this.totalRotations = parseFloat(safeGet('disc_run_total_rotations', '0')) || 0;
      this.bestRotations = parseFloat(safeGet('disc_run_best_rotations', '0')) || 0;
      this.totalTimePlayed = parseFloat(safeGet('disc_run_total_time_played', '0')) || 0;
      this.totalPerfectDucks = parseInt(safeGet('disc_run_total_perfect_ducks', '0'), 10) || 0;
      this.totalDucks = parseInt(safeGet('disc_run_total_ducks', '0'), 10) || 0;
      this.totalGems = parseInt(safeGet('disc_run_total_gems', '0'), 10) || 0;
      this.totalPowerups = parseInt(safeGet('disc_run_total_powerups', '0'), 10) || 0;
      this.totalPortals = parseInt(safeGet('disc_run_total_portals', '0'), 10) || 0;
      this.totalHazardsDeflected = parseInt(safeGet('disc_run_total_hazards_deflected', '0'), 10) || 0;
      this.totalShieldsUsed = parseInt(safeGet('disc_run_total_shields_used', '0'), 10) || 0;

      // Achievements Set
      this.unlockedAchievements = new Set(JSON.parse(safeGet('disc_run_unlocked_achievements', '[]')));

      this.selectedStageIndex = parseInt(safeGet('disc_run_selected_stage', '0'), 10) || 0;
      if (this.selectedStageIndex < 0 || this.selectedStageIndex >= STAGES.length) {
        this.selectedStageIndex = 0;
      }
      this.highestSeenStage = parseInt(safeGet('disc_run_highest_unlocked', '0'), 10) || 0;

      this.rotationsCleared = 0;
      this.lastAwardedRevolution = 0;
      this.lastOrbitMultiplier = 1;
      this.speedMultiplier = 1.0;
      this.baseAngularSpeed = 0.52;
      this.currentAngularSpeed = 0.52;
      this.discAngle = 0;

      // Controls Inversion Setting
      this.invertedControls = safeGet('disc_run_inverted_controls', 'false') === 'true';

      // 6 Persistent Upgrades (Duck, Rev Yield, Shield, Deflector, Booster, Magnet)
      this.duckLevel = parseInt(safeGet('disc_run_duck_level', '1'), 10) || 1;
      if (this.duckLevel < 1) this.duckLevel = 1;
      if (this.duckLevel > MAX_DUCK_LEVEL) this.duckLevel = MAX_DUCK_LEVEL;

      this.revBonusLevel = parseInt(safeGet('disc_run_rev_bonus_level', '0'), 10) || 0;
      if (this.revBonusLevel > MAX_REV_BONUS_LEVEL) this.revBonusLevel = MAX_REV_BONUS_LEVEL;

      this.shieldLevel = parseInt(safeGet('disc_run_shield_level', '0'), 10) || 0;
      if (this.shieldLevel > MAX_SHIELD_LEVEL) this.shieldLevel = MAX_SHIELD_LEVEL;

      this.deflectorLevel = parseInt(safeGet('disc_run_deflector_level', '0'), 10) || 0;
      if (this.deflectorLevel > MAX_DEFLECTOR_LEVEL) this.deflectorLevel = MAX_DEFLECTOR_LEVEL;

      this.boosterLevel = parseInt(safeGet('disc_run_booster_level', '0'), 10) || 0;
      if (this.boosterLevel > MAX_BOOSTER_LEVEL) this.boosterLevel = MAX_BOOSTER_LEVEL;

      this.magnetLevel = parseInt(safeGet('disc_run_magnet_level', '0'), 10) || 0;
      if (this.magnetLevel > MAX_MAGNET_LEVEL) this.magnetLevel = MAX_MAGNET_LEVEL;

      this.hasSeenUpgradePrompt = safeGet('disc_run_afford_upgrade_prompt_shown', 'false') === 'true';

      this.maxDuckDuration = this.getDuckDuration(this.duckLevel);
      this.currentDuckTime = this.maxDuckDuration;
      this.isDuckExhausted = false;

      // In-Run Active Powerups, Shields & Effects
      this.currentShields = this.shieldLevel;
      this.currentHazardShields = this.deflectorLevel;
      this.activePowerup = null;
      this.powerupTimer = 0;
      this.powerupMaxDuration = 0;
      this.invulnerableTimer = 0;
      this.slowTimer = 0;
      this.scoreMultiplier = 1;

      // Stage 8: Collapsing Lane State
      this.collapsingLanes = [];
      this.collapsedLanes = new Set();
      this.laneCollapseTimer = 0;
      this.nextLaneCollapseInterval = 7.0;

      // Current Active Stage properties
      this.currentStage = STAGES[this.selectedStageIndex];
      this.lanes = this.currentStage.lanes;
      this.laneCount = this.lanes.length;
      this.playerLane = this.currentStage.defaultLane;
      this.targetRadius = this.lanes[this.playerLane];
      this.currentRadius = this.lanes[this.playerLane];

      // Player physical state
      this.playerY = 25;
      this.playerVelocityY = 0;
      this.isDucking = false;
      this.duckScaleY = 1.0;
      this.targetDuckScaleY = 1.0;
      this.squashScaleX = 1.0;
      this.squashScaleZ = 1.0;

      // Obstacles & Timed Collectibles
      this.obstacles = [];
      this.collectibles = [];
      this.trackRings = [];
      this.lastSpawnAngle = 0;
      this.nextSpawnAngleGap = 1.35;
      
      // Timed Collectibles
      this.collectibleTimer = 0;
      this.nextCollectibleTime = 1.5;

      // Visuals & Juice
      this.cameraShakeIntensity = 0;
      this.particles = [];
      this.debris = [];
      this.clock = new THREE.Clock();

      // UI Elements
      this.initDOMElements();

      // Three.js Core
      this.initThree();

      // Build 3D World
      this.buildDisc();
      this.buildPlayer();
      this.buildEnvironment();

      // Apply initial stage visuals & music
      this.applyStageTheme(this.selectedStageIndex, false);

      // Event Listeners
      this.initEvents();

      // Initial Checks & Sync
      this.checkAchievements();
      this.updateAchievementsCountUI();
      this.updateHUD();
      this.updateControlsUI();
      this.updateUpgradeShopUI();
      this.animate = this.animate.bind(this);
      requestAnimationFrame(this.animate);

      // Automated Screenshot Hook Support
      try {
        const urlParams = new URLSearchParams(window.location.search);
        let screenParam = urlParams.get('screen');
        let promoParam = urlParams.get('promo');

        if (window.location.hash) {
          const hashRaw = window.location.hash.replace(/^#/, '');
          const hashParams = new URLSearchParams(hashRaw);
          if (hashParams.get('screen')) screenParam = hashParams.get('screen');
          if (hashParams.get('promo')) promoParam = hashParams.get('promo');

          if (!screenParam && !promoParam) {
            if (hashRaw.startsWith('promo_')) {
              promoParam = hashRaw.replace('promo_', '');
              const promoToScreen = {
                '1': 'gameplay_stage1',
                '2': 'gameplay_stage2',
                '3': 'gameplay_stage3',
                '4': 'gameplay_stage4',
                '5': 'gameplay_stage5',
                '6': 'gameplay_stage8'
              };
              screenParam = promoToScreen[promoParam] || 'gameplay_stage1';
            } else {
              screenParam = hashRaw;
            }
          }
        }

        // Store Promo Banner Setup
        if (promoParam) {
          const promoEl = document.getElementById('store-promo-overlay');
          const promoTag = document.getElementById('promo-tag');
          const promoTitle = document.getElementById('promo-title');
          const promoSub = document.getElementById('promo-subtitle');

          const PROMO_DATA = {
            '1': {
              tag: 'DISC RUN • CYBER TURNTABLE RUNNER',
              title: 'SURVIVE THE ROTATING TURNTABLE',
              sub: 'Hold to <b>Duck Under Overhead Bars</b> & chain massive Perfect Duck streaks!'
            },
            '2': {
              tag: 'STAGE 2 • SOLAR FLARE',
              title: 'DODGE ORBITING FIREBALLS',
              sub: 'Dynamic stage hazards, molten tracks & high-speed radial navigation!'
            },
            '3': {
              tag: 'STAGE 3 • TOXIC CORE',
              title: 'DEPLOY CRASH SHIELDS & DEFLECTORS',
              sub: 'Absorb fatal obstacles & deflect acid slime pools with workshop upgrades!'
            },
            '4': {
              tag: 'STAGE 4 • VOID HORIZON',
              title: 'WARP THROUGH QUANTUM PORTALS',
              sub: 'Traverse instant teleporters across 7 glowing sci-fi lanes!'
            },
            '5': {
              tag: 'STAGE 5 • CYBER GLACIER',
              title: 'CHARGE 10X ORBIT SURGES',
              sub: 'Every 10 revolutions charges the vertical meter for <b>massive global multipliers!</b>'
            },
            '6': {
              tag: 'STAGE 8 • FRACTURED ABYSS',
              title: 'MASTER 8 EXPANDING WORLDS',
              sub: 'Survive up to <b>11 high-speed lanes</b> with intense collapsing abyss tracks!'
            }
          };

          if (promoEl && PROMO_DATA[promoParam]) {
            promoEl.classList.remove('hidden');
            if (promoTag) promoTag.textContent = PROMO_DATA[promoParam].tag;
            if (promoTitle) promoTitle.textContent = PROMO_DATA[promoParam].title;
            if (promoSub) promoSub.innerHTML = PROMO_DATA[promoParam].sub;
          }
        }
        if (screenParam === 'mainmenu_clean' || screenParam === 'clean_menu') {
          document.body.classList.add('clean-screenshot');
          this.careerPoints = 48500;
          this.bankPoints = 12400;
          this.duckLevel = 4;
          this.shieldLevel = 1;
          this.deflectorLevel = 1;
          this.boosterLevel = 1;
          this.magnetLevel = 1;
          this.highestSeenStage = 2;
          this.updateUpgradeShopUI();
          this.updateStageSelectorUI();
          this.updateHUD();
        } else if (screenParam === 'achievements') {
          setTimeout(() => {
            this.totalRuns = 32;
            this.totalPerfectDucks = 42;
            this.bestPerfectDuckStreak = 7;
            this.bestRotations = 32.4;
            this.highScore = 28650;
            this.careerPoints = 185000;
            this.duckLevel = 5;
            this.shieldLevel = 2;
            this.deflectorLevel = 1;
            this.boosterLevel = 2;
            this.magnetLevel = 1;
            this.totalGems = 120;
            this.totalPowerups = 104;
            this.totalShieldsUsed = 18;
            this.totalHazardsDeflected = 14;
            this.totalPortals = 16;
            this.checkAchievements();
            this.openAchievementsModal();
          }, 350);
        } else if (screenParam === 'stats') {
          setTimeout(() => {
            this.careerPoints = 185000;
            this.highScore = 28650;
            this.totalRuns = 32;
            this.totalRotations = 412.8;
            this.bestRotations = 32.4;
            this.totalTimePlayed = 3840;
            this.totalPerfectDucks = 42;
            this.bestPerfectDuckStreak = 7;
            this.totalDucks = 158;
            this.totalGems = 120;
            this.totalPowerups = 104;
            this.totalPortals = 16;
            this.totalHazardsDeflected = 14;
            this.totalShieldsUsed = 18;
            this.highestSeenStage = 4;
            this.openStatsModal();
          }, 350);
        } else if (screenParam === 'pause') {
          setTimeout(() => {
            this.applyStageTheme(0, false);
            this.startGame();
            this.score = 6450;
            this.rotationsCleared = 7.8;
            this.togglePause();
          }, 350);
        } else if (screenParam === 'stage_unlocked') {
          setTimeout(() => {
            this.openStageUnlockedModal(STAGES[1]);
          }, 350);
        } else if (screenParam === 'postrun') {
          setTimeout(() => {
            this.score = 2450;
            this.rotationsCleared = 6.4;
            this.perfectDuckStreak = 4;
            this.triggerGameOver('CRASHED INTO ROTATING BLOCK');
          }, 350);
        } else if (screenParam === 'gameplay' || screenParam === 'gameplay_stage1') {
          setTimeout(() => {
            this.applyStageTheme(0, false);
            this.startGame();
            this.score = 4850;
            this.rotationsCleared = 5.6;
            this.perfectDuckStreak = 5;
            this.scoreMultiplier = 2;
            this.playerY = 0;
            this.isDucking = true;
            this.duckScaleY = 0.35;
            this.targetDuckScaleY = 0.35;
            this.showDuckBonusToast('⚡ PERFECT DUCK x5! +150', true);
            this.createOverheadBar(0, this.laneCount - 1, 0.18);
            this.createBlockObstacle((this.playerLane + 1) % this.laneCount, 0.55);
            this.createBlockObstacle((this.playerLane + 2) % this.laneCount, 0.75);
            this.updateHUD();
          }, 350);
        } else if (screenParam === 'gameplay_stage2') {
          setTimeout(() => {
            this.applyStageTheme(1, false);
            this.startGame();
            this.score = 7200;
            this.rotationsCleared = 8.4;
            this.perfectDuckStreak = 3;
            this.playerY = 0;
            this.showDuckBonusToast('🔥 SOLAR FLARE: ORBITING FIREBALLS!', true);
            this.createFireballHazard(this.playerLane, 0.35);
            this.createFireballHazard((this.playerLane + 2) % this.laneCount, 0.6);
            this.createBlockObstacle((this.playerLane + 1) % this.laneCount, 0.75);
            this.updateHUD();
          }, 350);
        } else if (screenParam === 'gameplay_stage3') {
          setTimeout(() => {
            this.applyStageTheme(2, false);
            this.startGame();
            this.score = 12400;
            this.rotationsCleared = 12.1;
            this.perfectDuckStreak = 4;
            this.currentShields = 2;
            this.playerY = 0;
            this.showDuckBonusToast('☣️ TOXIC CORE: ACID SLIME HAZARD!', true);
            this.createToxicPuddleHazard(this.playerLane, 0.4);
            this.createBlockObstacle((this.playerLane + 2) % this.laneCount, 0.65);
            this.createOverheadBar(0, this.laneCount - 1, 1.1);
            this.updateHUD();
          }, 350);
        } else if (screenParam === 'gameplay_stage4') {
          setTimeout(() => {
            this.applyStageTheme(3, false);
            this.startGame();
            this.score = 19800;
            this.rotationsCleared = 16.8;
            this.perfectDuckStreak = 6;
            this.playerY = 0;
            this.showDuckBonusToast('🌀 VOID WARP: QUANTUM PORTALS ACTIVE!', true);
            this.createPairedVoidPortals(1, 3, 0.45);
            this.createBlockObstacle((this.playerLane + 3) % this.laneCount, 0.7);
            this.updateHUD();
          }, 350);
        } else if (screenParam === 'gameplay_stage5') {
          setTimeout(() => {
            this.applyStageTheme(4, false);
            this.startGame();
            this.score = 31500;
            this.rotationsCleared = 22.4;
            this.perfectDuckStreak = 7;
            this.playerY = 0;
            this.showDuckBonusToast('❄️ CYBER GLACIER: CRYO ICE SPIKES!', true);
            this.createIceSpikeHazard(this.playerLane, 0.4);
            this.createIceSpikeHazard((this.playerLane + 2) % this.laneCount, 0.65);
            this.createOverheadBar(0, this.laneCount - 1, 1.2);
            this.updateHUD();
          }, 350);
        } else if (screenParam === 'gameplay_stage8') {
          setTimeout(() => {
            this.applyStageTheme(7, false);
            this.startGame();
            this.score = 68400;
            this.rotationsCleared = 34.6;
            this.perfectDuckStreak = 8;
            this.playerY = 0;
            this.showDuckBonusToast('⚠️ FRACTURED ABYSS: COLLAPSING TRACKS!', true);
            this.triggerLaneCollapseWarning();
            this.createBlockObstacle((this.playerLane + 3) % this.laneCount, 0.6);
            this.createOverheadBar(0, this.laneCount - 1, 1.0);
            this.updateHUD();
          }, 350);
        } else if (screenParam === 'gameplay_video') {
          setTimeout(() => {
            this.applyStageTheme(0, false);
            this.startGame();
            this.duckLevel = 6;
            this.shieldLevel = 2;
            this.deflectorLevel = 1;
            this.boosterLevel = 2;
            this.magnetLevel = 2;
            this.currentShields = 2;
            this.updateHUD();

            let demoTime = 0;
            const demoInterval = setInterval(() => {
              demoTime += 0.1;
              if (this.state !== STATE.PLAYING) return;

              for (let i = 0; i < this.obstacles.length; i++) {
                const obs = this.obstacles[i];
                if (obs.passed) continue;
                obs.mesh.getWorldPosition(_tempWorldPos);
                const wx = _tempWorldPos.x;
                const wz = _tempWorldPos.z;

                if (obs.type === 'BAR' && wz > 3.0 && wx >= -0.8 && wx <= 2.5) {
                  if (!this.isDucking) {
                    this.setDucking(true);
                    setTimeout(() => { this.setDucking(false); }, 420);
                  }
                } else if (obs.type === 'BLOCK' && Math.abs(wx) < 3.0 && Math.abs(wz - this.currentRadius) < 1.1) {
                  if (this.playerLane < this.laneCount - 1) {
                    this.shiftLane(-1);
                  } else {
                    this.shiftLane(1);
                  }
                }
              }

              if (demoTime >= 12.0) {
                clearInterval(demoInterval);
              }
            }, 80);
          }, 350);
        }
      } catch (err) {
        console.warn('Screenshot hook error:', err);
      }

      this.checkAffordableUpgradePrompt();
    }

    createBarObstacle(angle, length) {
      this.createOverheadBar(0, this.laneCount - 1, angle);
    }

    createVoidPortalPair(angle) {
      this.createPairedVoidPortals(1, Math.min(3, this.laneCount - 1), angle);
    }

    createToxicSlimeHazard(lane, angle) {
      this.createToxicPuddleHazard(lane, angle);
    }

    getDuckDuration(level) {
      return parseFloat((BASE_DUCK_DURATION + (level - 1) * DUCK_INCREMENT).toFixed(2));
    }

    updateControlsHintUI() {
      const dur = this.getDuckDuration(this.duckLevel).toFixed(2) + 's';
      if (this.hintDuckDuration) this.hintDuckDuration.textContent = dur;
      if (this.hintDuckDurationMobile) this.hintDuckDurationMobile.textContent = dur;

      const isMobile = this.isMobileDevice();
      if (this.controlsHintDesktop && this.controlsHintMobile) {
        if (isMobile) {
          this.controlsHintDesktop.classList.add('hidden');
          this.controlsHintMobile.classList.remove('hidden');
        } else {
          this.controlsHintDesktop.classList.remove('hidden');
          this.controlsHintMobile.classList.add('hidden');
        }
      }

      if (this.startKeyTip) {
        this.startKeyTip.textContent = isMobile ? '' : ' (SPACE)';
      }
      if (this.gameoverKeyTip) {
        this.gameoverKeyTip.textContent = isMobile ? '' : ' (SPACE)';
      }
    }

    isMobileDevice() {
      return (
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.innerWidth <= 860
      );
    }

    initDOMElements() {
      this.canvas = document.getElementById('game-canvas');
      this.hud = document.getElementById('hud');
      this.scoreDisplay = document.getElementById('score-display');
      this.hudStageName = document.getElementById('hud-stage-name');
      this.hudMultiplierTag = document.getElementById('hud-multiplier-tag');
      this.hudShieldsDisplay = document.getElementById('hud-shields-display');
      this.duckStaminaBar = document.getElementById('duck-stamina-bar');
      this.duckStaminaText = document.getElementById('duck-stamina-text');
      this.duckIndicator = document.getElementById('duck-indicator');
      this.floatingDuckTime = document.getElementById('floating-duck-time');
      this.floatingDuckTimerFill = document.getElementById('floating-duck-timer-fill');
      this.controlsHint = document.getElementById('controls-hint');
      this.controlsHintDesktop = document.getElementById('controls-hint-desktop');
      this.controlsHintMobile = document.getElementById('controls-hint-mobile');
      this.hintKeys = document.getElementById('hint-keys');
      this.hintDuckDuration = document.getElementById('hint-duck-duration');
      this.hintDuckDurationMobile = document.getElementById('hint-duck-duration-mobile');

      // Full-Screen Mobile Touch Zones Elements
      this.touchZonesContainer = document.getElementById('touch-zones-container');
      this.zoneLeftGuide = document.getElementById('zone-left-guide');
      this.zoneCenterGuide = document.getElementById('zone-center-guide');
      this.zoneRightGuide = document.getElementById('zone-right-guide');

      // Device detection for adaptive controls
      this.isTouchDevice = this.isMobileDevice();
      this.centerDuckTouchId = null;

      // Vertical Orbit Revolution Multiplier Bar Elements
      this.orbitMultiplierContainer = document.getElementById('orbit-multiplier-container');
      this.orbitMultBadge = document.getElementById('orbit-mult-badge');
      this.orbitMeterFill = document.getElementById('orbit-meter-fill');
      this.orbitRevsText = document.getElementById('orbit-revs-text');
      this.orbitNextTierText = document.getElementById('orbit-next-tier-text');

      // Top action buttons
      this.pauseBtn = document.getElementById('pause-btn');
      this.soundToggleBtn = document.getElementById('sound-toggle');
      this.fullscreenBtn = document.getElementById('fullscreen-btn');

      // Mobile Responsive Tabs Elements
      this.startTabStages = document.getElementById('start-tab-stages');
      this.startTabWorkshop = document.getElementById('start-tab-workshop');
      this.gameoverTabResults = document.getElementById('gameover-tab-results');
      this.gameoverTabWorkshop = document.getElementById('gameover-tab-workshop');
      this.mobileStartBankBadge = document.getElementById('mobile-start-bank-badge');
      this.mobileGameoverBankBadge = document.getElementById('mobile-gameover-bank-badge');
      this.startPanelsWrapper = document.querySelector('#start-screen .start-panels-wrapper');
      this.gameoverPanelsWrapper = document.querySelector('#game-over-screen .start-panels-wrapper');

      // Pause Screen Modal
      this.pauseScreen = document.getElementById('pause-screen');
      this.pauseCurrentScore = document.getElementById('pause-current-score');
      this.pauseStageName = document.getElementById('pause-stage-name');
      this.pauseResumeBtn = document.getElementById('pause-resume-btn');
      this.pauseRestartBtn = document.getElementById('pause-restart-btn');
      this.pauseMenuBtn = document.getElementById('pause-menu-btn');

      // Active Powerup Bar & Toast
      this.activePowerupBar = document.getElementById('active-powerup-bar');
      this.activePowerupIcon = document.getElementById('active-powerup-icon');
      this.activePowerupName = document.getElementById('active-powerup-name');
      this.activePowerupTimer = document.getElementById('active-powerup-timer');
      this.duckBonusToast = document.getElementById('duck-bonus-toast');

      // Stage Unlocked Celebratory Modal
      this.stageUnlockedModal = document.getElementById('stage-unlocked-modal');
      this.unlockedStageTitle = document.getElementById('unlocked-stage-title');
      this.unlockedStageDesc = document.getElementById('unlocked-stage-desc');
      this.unlockedCloseBtn = document.getElementById('unlocked-close-btn');

      // First Time Upgrade Available Modal
      this.upgradeAvailableModal = document.getElementById('upgrade-available-modal');
      this.upgradePromptGoBtn = document.getElementById('upgrade-prompt-go-btn');
      this.upgradePromptCloseBtn = document.getElementById('upgrade-prompt-close-btn');

      // Lifetime Career Stats Modal
      this.lifetimeStatsModal = document.getElementById('lifetime-stats-modal');
      this.startStatsBtn = document.getElementById('start-stats-btn');
      this.gameoverStatsBtn = document.getElementById('gameover-stats-btn');
      this.closeStatsBtn = document.getElementById('close-stats-btn');

      this.statCareerPoints = document.getElementById('stat-career-points');
      this.statHighScore = document.getElementById('stat-high-score');
      this.statTotalRuns = document.getElementById('stat-total-runs');
      this.statTotalRotations = document.getElementById('stat-total-rotations');
      this.statBestRotations = document.getElementById('stat-best-rotations');
      this.statTotalTime = document.getElementById('stat-total-time');
      this.statPerfectDucks = document.getElementById('stat-perfect-ducks');
      this.statBestStreak = document.getElementById('stat-best-streak');
      this.statTotalDucks = document.getElementById('stat-total-ducks');
      this.statGemsCollected = document.getElementById('stat-gems-collected');
      this.statPowerupsCollected = document.getElementById('stat-powerups-collected');
      this.statPortalsEntered = document.getElementById('stat-portals-entered');
      this.statHazardsDeflected = document.getElementById('stat-hazards-deflected');
      this.statShieldsUsed = document.getElementById('stat-shields-used');
      this.statHighestStage = document.getElementById('stat-highest-stage');

      // Achievements Modal Elements
      this.achievementsModal = document.getElementById('achievements-modal');
      this.startAchieveBtn = document.getElementById('start-achieve-btn');
      this.gameoverAchieveBtn = document.getElementById('gameover-achieve-btn');
      this.closeAchieveBtn = document.getElementById('close-achieve-btn');
      this.startAchieveCount = document.getElementById('start-achieve-count');
      this.gameoverAchieveCount = document.getElementById('gameover-achieve-count');
      this.achieveSummaryText = document.getElementById('achieve-summary-text');
      this.achieveTotalPointsEarned = document.getElementById('achieve-total-points-earned');
      this.achieveProgressBarFill = document.getElementById('achieve-progress-bar-fill');
      this.achievementsListContainer = document.getElementById('achievements-list-container');

      // Screens & Buttons
      this.startScreen = document.getElementById('start-screen');
      this.gameOverScreen = document.getElementById('game-over-screen');
      this.startBtn = document.getElementById('start-btn');
      this.startStageBtnLabel = document.getElementById('start-stage-btn-label');
      this.startKeyTip = document.getElementById('start-key-tip');
      this.gameoverStageBtnLabel = document.getElementById('gameover-stage-btn-label');
      this.gameoverKeyTip = document.getElementById('gameover-key-tip');
      this.restartBtn = document.getElementById('restart-btn');

      // Post-Run Second Chance / Ad Option Screen Elements
      this.postRunModal = document.getElementById('post-run-modal');
      this.postrunDeathReason = document.getElementById('postrun-death-reason');
      this.postrunRunScore = document.getElementById('postrun-run-score');
      this.postrunRunRotations = document.getElementById('postrun-run-rotations');
      this.postrunRunStreak = document.getElementById('postrun-run-streak');
      this.postrunReviveBtn = document.getElementById('postrun-revive-btn');
      this.postrunReviveBadge = document.getElementById('postrun-revive-badge');
      this.postrunDoubleBtn = document.getElementById('postrun-double-btn');
      this.postrunDoubleBadge = document.getElementById('postrun-double-badge');
      this.postrunDoubleDesc = document.getElementById('postrun-double-desc');
      this.postrunSkipBtn = document.getElementById('postrun-skip-btn');
      this.postrunSkipDesc = document.getElementById('postrun-skip-desc');

      this.deathReasonEl = document.getElementById('death-reason');
      this.finalScoreEl = document.getElementById('final-score');
      this.gameOverBestScoreEl = document.getElementById('game-over-best-score');
      this.earnedPointsDisplay = document.getElementById('earned-points-display');
      this.shopBankPoints = document.getElementById('shop-bank-points');
      this.gameoverBankPoints = document.getElementById('gameover-bank-points');
      this.gameoverShopBankPoints = document.getElementById('gameover-shop-bank-points');
      this.startCareerPoints = document.getElementById('start-career-points');
      this.gameoverCareerPoints = document.getElementById('gameover-career-points');

      // Milestone progress bars
      this.startMilestoneLabel = document.getElementById('start-milestone-label');
      this.startMilestoneText = document.getElementById('start-milestone-text');
      this.startMilestoneBarFill = document.getElementById('start-milestone-bar-fill');
      this.gameoverMilestoneLabel = document.getElementById('gameover-milestone-label');
      this.gameoverMilestoneText = document.getElementById('gameover-milestone-text');
      this.gameoverMilestoneBarFill = document.getElementById('gameover-milestone-bar-fill');

      // Controls Inversion Toggles
      this.startControlsToggleBtn = document.getElementById('start-controls-toggle');
      this.startControlsLabel = document.getElementById('start-controls-label');
      this.gameoverControlsToggleBtn = document.getElementById('gameover-controls-toggle');
      this.gameoverControlsLabel = document.getElementById('gameover-controls-label');

      // Upgrade Shop Elements (6 Upgrades)
      this.startDuckStat = document.getElementById('start-duck-stat');
      this.startUpgradeDuckBtn = document.getElementById('start-upgrade-duck-btn');
      this.gameoverDuckStat = document.getElementById('gameover-duck-stat');
      this.gameoverUpgradeDuckBtn = document.getElementById('gameover-upgrade-duck-btn');

      this.startRevBonusStat = document.getElementById('start-rev-bonus-stat');
      this.startUpgradeRevBonusBtn = document.getElementById('start-upgrade-rev-bonus-btn');
      this.gameoverRevBonusStat = document.getElementById('gameover-rev-bonus-stat');
      this.gameoverUpgradeRevBonusBtn = document.getElementById('gameover-upgrade-rev-bonus-btn');

      this.startShieldStat = document.getElementById('start-shield-stat');
      this.startUpgradeShieldBtn = document.getElementById('start-upgrade-shield-btn');
      this.gameoverShieldStat = document.getElementById('gameover-shield-stat');
      this.gameoverUpgradeShieldBtn = document.getElementById('gameover-upgrade-shield-btn');

      this.startDeflectorStat = document.getElementById('start-deflector-stat');
      this.startUpgradeDeflectorBtn = document.getElementById('start-upgrade-deflector-btn');
      this.gameoverDeflectorStat = document.getElementById('gameover-deflector-stat');
      this.gameoverUpgradeDeflectorBtn = document.getElementById('gameover-upgrade-deflector-btn');

      this.startBoosterStat = document.getElementById('start-booster-stat');
      this.startUpgradeBoosterBtn = document.getElementById('start-upgrade-booster-btn');
      this.gameoverBoosterStat = document.getElementById('gameover-booster-stat');
      this.gameoverUpgradeBoosterBtn = document.getElementById('gameover-upgrade-booster-btn');

      this.startMagnetStat = document.getElementById('start-magnet-stat');
      this.startUpgradeMagnetBtn = document.getElementById('start-upgrade-magnet-btn');
      this.gameoverMagnetStat = document.getElementById('gameover-magnet-stat');
      this.gameoverUpgradeMagnetBtn = document.getElementById('gameover-upgrade-magnet-btn');

      // Reset Data Modal Elements
      this.startResetDataBtn = document.getElementById('start-reset-data-btn');
      this.gameoverResetDataBtn = document.getElementById('gameover-reset-data-btn');
      this.resetConfirmModal = document.getElementById('reset-confirm-modal');
      this.cancelResetBtn = document.getElementById('cancel-reset-btn');
      this.confirmResetBtn = document.getElementById('confirm-reset-btn');

      // Mobile touch buttons
      this.touchLeftBtn = document.getElementById('touch-left');
      this.touchRightBtn = document.getElementById('touch-right');
      this.touchDuckBtn = document.getElementById('touch-duck');
      this.touchDuckTimer = document.getElementById('touch-duck-timer');
    }

    // --- Achievements System ---

    checkAchievements() {
      let anyNew = false;
      for (const ach of ACHIEVEMENTS) {
        if (!this.unlockedAchievements.has(ach.id) && ach.check(this)) {
          this.unlockedAchievements.add(ach.id);
          anyNew = true;

          // Grant reward bonus
          this.bankPoints += ach.reward;
          this.careerPoints += ach.reward;
          safeSet('disc_run_bank_points', this.bankPoints);
          safeSet('disc_run_career_points', this.careerPoints);

          this.showDuckBonusToast(`🏆 UNLOCKED: ${ach.title} (+${ach.reward.toLocaleString()} PTS)!`, true);
          if (window.soundEngine) window.soundEngine.playUpgradeSound();
        }
      }

      if (anyNew) {
        safeSet('disc_run_unlocked_achievements', JSON.stringify([...this.unlockedAchievements]));
        this.updateAchievementsCountUI();
        this.updateHUD();
        this.updateUpgradeShopUI();
        this.updateStageSelectorUI();
      }
    }

    updateAchievementsCountUI() {
      const countStr = `${this.unlockedAchievements.size}/${ACHIEVEMENTS.length}`;
      if (this.startAchieveCount) this.startAchieveCount.textContent = countStr;
      if (this.gameoverAchieveCount) this.gameoverAchieveCount.textContent = countStr;
    }

    openAchievementsModal() {
      this.checkAchievements();

      const total = ACHIEVEMENTS.length;
      const unlockedCount = this.unlockedAchievements.size;
      const pct = Math.floor((unlockedCount / total) * 100);

      let totalPoints = 0;
      ACHIEVEMENTS.forEach((ach) => {
        if (this.unlockedAchievements.has(ach.id)) {
          totalPoints += ach.reward;
        }
      });

      if (this.achieveSummaryText) {
        this.achieveSummaryText.textContent = `${unlockedCount} / ${total} UNLOCKED (${pct}%)`;
      }
      if (this.achieveTotalPointsEarned) {
        this.achieveTotalPointsEarned.textContent = `+${totalPoints.toLocaleString()} PTS EARNED`;
      }
      if (this.achieveProgressBarFill) {
        this.achieveProgressBarFill.style.width = `${pct}%`;
      }

      if (this.achievementsListContainer) {
        this.achievementsListContainer.innerHTML = ACHIEVEMENTS.map((ach) => {
          const isUnlocked = this.unlockedAchievements.has(ach.id);
          const progText = isUnlocked ? 'COMPLETED' : ach.progress(this);
          const badgeClass = isUnlocked ? 'achieve-badge-unlocked' : 'achieve-badge-locked';
          const badgeText = isUnlocked ? 'UNLOCKED' : 'LOCKED';
          const cardClass = isUnlocked ? 'achieve-card unlocked' : 'achieve-card locked';

          return `
            <div class="${cardClass}">
              <div class="achieve-card-icon-box">${ach.icon}</div>
              <div class="achieve-card-info">
                <div class="achieve-card-top-row">
                  <span class="achieve-card-title">${ach.title}</span>
                  <span class="achieve-card-reward">+${ach.reward.toLocaleString()} PTS</span>
                </div>
                <p class="achieve-card-desc">${ach.desc}</p>
                <div class="achieve-card-status-row">
                  <span class="achieve-card-progress-text">${progText}</span>
                  <span class="achieve-card-badge ${badgeClass}">${badgeText}</span>
                </div>
              </div>
            </div>
          `;
        }).join('');
      }

      if (this.achievementsModal) this.achievementsModal.classList.remove('hidden');
      if (window.soundEngine) window.soundEngine.playScoreChime();
    }

    closeAchievementsModal() {
      if (this.achievementsModal) this.achievementsModal.classList.add('hidden');
    }

    // --- Lifetime Career Stats System ---

    openStatsModal() {
      if (this.statCareerPoints) this.statCareerPoints.textContent = this.careerPoints.toLocaleString() + ' PTS';
      if (this.statHighScore) this.statHighScore.textContent = this.highScore.toLocaleString() + ' PTS';
      if (this.statTotalRuns) this.statTotalRuns.textContent = this.totalRuns.toLocaleString();
      if (this.statTotalRotations) this.statTotalRotations.textContent = this.totalRotations.toFixed(1) + ' ROT';
      if (this.statBestRotations) this.statBestRotations.textContent = this.bestRotations.toFixed(1) + ' ROT';
      if (this.statTotalTime) this.statTotalTime.textContent = formatDuration(this.totalTimePlayed);
      if (this.statPerfectDucks) this.statPerfectDucks.textContent = this.totalPerfectDucks.toLocaleString();
      if (this.statBestStreak) this.statBestStreak.textContent = this.bestPerfectDuckStreak + 'x';
      if (this.statTotalDucks) this.statTotalDucks.textContent = this.totalDucks.toLocaleString();
      if (this.statGemsCollected) this.statGemsCollected.textContent = this.totalGems.toLocaleString();
      if (this.statPowerupsCollected) this.statPowerupsCollected.textContent = this.totalPowerups.toLocaleString();
      if (this.statPortalsEntered) this.statPortalsEntered.textContent = this.totalPortals.toLocaleString();
      if (this.statHazardsDeflected) this.statHazardsDeflected.textContent = this.totalHazardsDeflected.toLocaleString();
      if (this.statShieldsUsed) this.statShieldsUsed.textContent = this.totalShieldsUsed.toLocaleString();

      const highestStageDef = STAGES[this.highestSeenStage] || STAGES[0];
      if (this.statHighestStage) this.statHighestStage.textContent = highestStageDef.shortName;

      if (this.lifetimeStatsModal) this.lifetimeStatsModal.classList.remove('hidden');
      if (window.soundEngine) window.soundEngine.playScoreChime();

      // Trigger Marquee scrolling animation for any stat title that overflows its box
      setTimeout(() => {
        const labelBoxes = document.querySelectorAll('.stat-card-label-box');
        labelBoxes.forEach((box) => {
          const label = box.querySelector('.stat-card-label');
          if (!label) return;
          const boxWidth = box.clientWidth;
          const textWidth = label.scrollWidth;
          if (textWidth > boxWidth + 2) {
            const overflow = textWidth - boxWidth + 8;
            label.style.setProperty('--marquee-dist', `-${overflow}px`);
            label.classList.add('marquee-active');
          } else {
            label.classList.remove('marquee-active');
          }
        });
      }, 60);
    }

    closeStatsModal() {
      if (this.lifetimeStatsModal) this.lifetimeStatsModal.classList.add('hidden');
    }

    // --- Fullscreen Toggle System ---

    toggleFullscreen() {
      if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
          elem.requestFullscreen().catch(() => {});
        } else if (elem.webkitRequestFullscreen) {
          elem.webkitRequestFullscreen();
        }
        if (this.fullscreenBtn) this.fullscreenBtn.textContent = '🗗';
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        }
        if (this.fullscreenBtn) this.fullscreenBtn.textContent = '⛶';
      }
    }

    // --- Pausing System ---

    togglePause() {
      if (this.state !== STATE.PLAYING) return;
      if (this.isPaused) {
        this.resumeGame();
      } else {
        this.pauseGame();
      }
    }

    pauseGame() {
      if (this.state !== STATE.PLAYING) return;
      this.setDucking(false);
      this.isPaused = true;
      if (this.pauseScreen) this.pauseScreen.classList.remove('hidden');
      if (this.touchZonesContainer) this.touchZonesContainer.classList.add('hidden');
      if (this.pauseCurrentScore) this.pauseCurrentScore.textContent = Math.floor(this.score);
      if (this.pauseStageName) this.pauseStageName.textContent = this.currentStage.shortName;
      if (window.soundEngine) window.soundEngine.stopBgm();
    }

    resumeGame() {
      this.isPaused = false;
      if (this.pauseScreen) this.pauseScreen.classList.add('hidden');
      if (this.isTouchDevice && this.touchZonesContainer && this.state === STATE.PLAYING) {
        this.touchZonesContainer.classList.remove('hidden');
      }
      if (window.soundEngine && this.state === STATE.PLAYING) {
        window.soundEngine.startBgm();
      }
    }

    exitToMainMenu() {
      this.isPaused = false;
      this.state = STATE.START;
      if (this.pauseScreen) this.pauseScreen.classList.add('hidden');
      if (this.hud) this.hud.classList.add('hidden');
      if (this.controlsHint) this.controlsHint.classList.add('hidden');
      if (this.touchZonesContainer) this.touchZonesContainer.classList.add('hidden');
      if (this.orbitMultiplierContainer) this.orbitMultiplierContainer.classList.add('hidden');
      if (this.startScreen) this.startScreen.classList.remove('hidden');
      if (window.soundEngine) window.soundEngine.stopBgm();
      this.clearObstacles();
      this.clearCollectibles();
      this.resetCollapsingLanes();
      this.updateStageSelectorUI();
      this.updateUpgradeShopUI();
    }

    // --- Stage Selection & Theming ---

    applyStageTheme(stageIndex, playChime = true) {
      this.selectedStageIndex = stageIndex;
      this.currentStage = STAGES[stageIndex];
      this.lanes = this.currentStage.lanes;
      this.laneCount = this.lanes.length;
      this.playerLane = Math.min(this.currentStage.defaultLane, this.laneCount - 1);
      this.targetRadius = this.lanes[this.playerLane];
      this.currentRadius = this.lanes[this.playerLane];

      safeSet('disc_run_selected_stage', this.selectedStageIndex);

      const theme = this.currentStage.theme;

      // 1. Scene background & fog
      if (this.scene) {
        this.scene.background.setHex(theme.bgColor);
        if (this.scene.fog) this.scene.fog.color.setHex(theme.fogColor);
      }

      // 2. Turntable base & rim
      if (this.discMesh) {
        this.discMesh.material.color.setHex(theme.discBase);
      }
      if (this.rimMesh) {
        this.rimMesh.material.color.setHex(theme.rimColor);
        this.rimMesh.material.emissive.setHex(theme.rimEmissive);
      }

      // 3. Spindle & center orb
      if (this.spindleMesh) {
        this.spindleMesh.material.emissive.setHex(theme.spindleEmissive);
      }
      if (this.orbMesh) {
        this.orbMesh.material.color.setHex(theme.orbColor);
      }

      // 4. Scene Lights
      if (this.dirLight) this.dirLight.color.setHex(theme.dirLight);
      if (this.playerGlowLight) this.playerGlowLight.color.setHex(theme.playerGlow);
      if (this.centerLight) {
        this.centerLight.color.setHex(theme.centerLight);
        this.centerLight.intensity = 0.65;
      }
      if (this.bgParticles) this.bgParticles.material.color.setHex(theme.particleColor);

      // 5. Sound Engine Stage Soundtrack
      if (window.soundEngine) {
        window.soundEngine.setStage(stageIndex);
      }

      // 6. Rebuild concentric lane rings on disc
      this.resetCollapsingLanes();
      this.rebuildTrackRings();

      if (playChime && window.soundEngine) {
        window.soundEngine.playScoreChime();
      }

      this.updateStageSelectorUI();
      this.updateHUD();
      this.updatePlayerTransform();
    }

    rebuildTrackRings() {
      this.trackRings.forEach((ring) => {
        this.discGroup.remove(ring);
        ring.geometry.dispose();
        ring.material.dispose();
      });
      this.trackRings = [];

      const theme = this.currentStage.theme;

      this.lanes.forEach((radius, index) => {
        const trackGeo = new THREE.RingGeometry(radius - 0.12, radius + 0.12, 72);
        const isMiddle = index === this.currentStage.defaultLane;
        const trackMat = new THREE.MeshBasicMaterial({
          color: isMiddle ? theme.trackActive : theme.trackInactive,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: isMiddle ? 0.75 : 0.4
        });
        const trackRing = new THREE.Mesh(trackGeo, trackMat);
        trackRing.rotation.x = Math.PI / 2;
        trackRing.position.y = 0.02;
        this.discGroup.add(trackRing);
        this.trackRings.push(trackRing);
      });
    }

    // --- Stage 8: Collapsing Lane Mechanic ---

    resetCollapsingLanes() {
      if (this.collapsingLanes) {
        this.collapsingLanes.forEach((entry) => {
          if (entry.group) {
            this.discGroup.remove(entry.group);
            entry.group.traverse((c) => {
              if (c.geometry) c.geometry.dispose();
              if (c.material) c.material.dispose();
            });
          }
        });
      }
      this.collapsingLanes = [];
      if (this.collapsedLanes) this.collapsedLanes.clear();
      if (this.trackRings) {
        this.trackRings.forEach((r) => { if (r) r.visible = true; });
      }
      this.laneCollapseTimer = 0;
      this.nextLaneCollapseInterval = 6.0;
    }

    triggerLaneCollapseWarning() {
      if (this.selectedStageIndex !== 7 || this.laneCount < 4) return;

      const validLanes = [];
      for (let L = 1; L < this.laneCount - 1; L++) {
        const isSelfActive = this.collapsingLanes.some((e) => e.lane === L);
        const isLeftActive = this.collapsingLanes.some((e) => e.lane === L - 1);
        const isRightActive = this.collapsingLanes.some((e) => e.lane === L + 1);

        if (!isSelfActive && !isLeftActive && !isRightActive) {
          validLanes.push(L);
        }
      }

      if (validLanes.length === 0) return;

      const chosenLane = validLanes[Math.floor(Math.random() * validLanes.length)];
      const radius = this.lanes[chosenLane];
      const gapWidth = 0.85;

      const group = new THREE.Group();

      const warnGeo = new THREE.RingGeometry(radius - gapWidth, radius + gapWidth, 72);
      const warnMat = new THREE.MeshBasicMaterial({
        color: 0xffaa00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const warnMesh = new THREE.Mesh(warnGeo, warnMat);
      warnMesh.rotation.x = Math.PI / 2;
      warnMesh.position.y = 0.03;
      group.add(warnMesh);

      const innerBorderGeo = new THREE.RingGeometry(radius - gapWidth - 0.06, radius - gapWidth + 0.06, 72);
      const innerBorderMat = new THREE.MeshBasicMaterial({ color: 0xff0055, side: THREE.DoubleSide });
      const innerBorder = new THREE.Mesh(innerBorderGeo, innerBorderMat);
      innerBorder.rotation.x = Math.PI / 2;
      innerBorder.position.y = 0.04;
      group.add(innerBorder);

      const outerBorderGeo = new THREE.RingGeometry(radius + gapWidth - 0.06, radius + gapWidth + 0.06, 72);
      const outerBorderMat = new THREE.MeshBasicMaterial({ color: 0xff0055, side: THREE.DoubleSide });
      const outerBorder = new THREE.Mesh(outerBorderGeo, outerBorderMat);
      outerBorder.rotation.x = Math.PI / 2;
      outerBorder.position.y = 0.04;
      group.add(outerBorder);

      this.discGroup.add(group);

      this.collapsingLanes.push({
        lane: chosenLane,
        radius: radius,
        state: 'WARNING',
        timer: 2.0,
        maxTimer: 2.0,
        group: group,
        floorMesh: warnMesh,
        innerBorder: innerBorder,
        outerBorder: outerBorder
      });

      if (this.playerLane === chosenLane) {
        this.showDuckBonusToast('⚠️ WARNING: LANE COLLAPSING!', true);
        if (window.soundEngine) window.soundEngine.playExhaustSound();
      }
    }

    updateCollapsingLanes(dt) {
      if (this.selectedStageIndex !== 7) return;

      this.laneCollapseTimer += dt;
      if (this.laneCollapseTimer >= this.nextLaneCollapseInterval) {
        this.triggerLaneCollapseWarning();
        this.laneCollapseTimer = 0;
        this.nextLaneCollapseInterval = 14.0 + Math.random() * 4.0;
      }

      for (let i = this.collapsingLanes.length - 1; i >= 0; i--) {
        const entry = this.collapsingLanes[i];
        entry.timer -= dt;

        if (entry.state === 'WARNING') {
          const flashPhase = (Date.now() * 0.02) % (Math.PI * 2);
          entry.floorMesh.material.opacity = 0.4 + Math.sin(flashPhase) * 0.4;
          entry.floorMesh.material.color.setHex(Math.floor(Date.now() / 80) % 2 === 0 ? 0xffaa00 : 0xff2200);

          if (entry.timer <= 0) {
            if (this.playerLane === entry.lane) {
              if (this.currentHazardShields > 0) {
                this.currentHazardShields--;
                this.totalHazardsDeflected++;
                safeSet('disc_run_total_hazards_deflected', this.totalHazardsDeflected);

                const safeLeft = entry.lane > 0 && !this.collapsedLanes.has(entry.lane - 1);
                const shiftTarget = safeLeft ? entry.lane - 1 : entry.lane + 1;
                this.playerLane = shiftTarget;
                this.targetRadius = this.lanes[this.playerLane];
                this.currentRadius = this.lanes[this.playerLane];
                this.invulnerableTimer = 1.6;
                this.cameraShakeIntensity = 0.8;

                if (window.soundEngine) window.soundEngine.playHazardDeflectSound();
                this.showDuckBonusToast(`🧿 DEFLECTOR SAVED YOU! (${this.currentHazardShields} LEFT)`, true);
              } else {
                this.triggerGameOver('Fell with a Collapsing Lane! Steer off flashing lanes before they disappear.');
                return;
              }
            }

            entry.state = 'COLLAPSED';
            entry.timer = 10.0;
            entry.maxTimer = 10.0;
            this.collapsedLanes.add(entry.lane);

            if (this.trackRings[entry.lane]) {
              this.trackRings[entry.lane].visible = false;
            }

            entry.floorMesh.material.color.setHex(0x000000);
            entry.floorMesh.material.opacity = 0.98;
            entry.innerBorder.material.color.setHex(0x00f0ff);
            entry.outerBorder.material.color.setHex(0x00f0ff);

            if (window.soundEngine) window.soundEngine.playCrashSound();
            this.cameraShakeIntensity = 0.45;
            this.showDuckBonusToast('🕳️ LANE COLLAPSED (10s)', true);
          }
        } else if (entry.state === 'COLLAPSED') {
          const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
          entry.innerBorder.material.opacity = pulse;
          entry.outerBorder.material.opacity = pulse;

          if (entry.timer <= 0) {
            this.collapsedLanes.delete(entry.lane);
            if (this.trackRings[entry.lane]) {
              this.trackRings[entry.lane].visible = true;
            }
            this.discGroup.remove(entry.group);
            entry.group.traverse((c) => {
              if (c.geometry) c.geometry.dispose();
              if (c.material) c.material.dispose();
            });

            if (window.soundEngine) window.soundEngine.playScoreChime();
            this.showDuckBonusToast('⚡ LANE RESTORED', false);
            this.collapsingLanes.splice(i, 1);
          }
        }
      }
    }

    // Guaranteed At Least 2 Safe Lanes in Every Partitioned Zone
    filterSafeObstacleLanes(proposedBlockLanes) {
      const zones = [];
      let currentZone = [];

      for (let l = 0; l < this.laneCount; l++) {
        if (this.collapsedLanes && this.collapsedLanes.has(l)) {
          if (currentZone.length > 0) {
            zones.push(currentZone);
            currentZone = [];
          }
        } else {
          currentZone.push(l);
        }
      }
      if (currentZone.length > 0) {
        zones.push(currentZone);
      }

      let safeBlockLanes = [...proposedBlockLanes];

      // For EVERY contiguous partition, guarantee at least 2 safe lanes (or all open if zone <= 2)
      zones.forEach((zone) => {
        const requiredSafeCount = Math.min(2, zone.length);
        const maxAllowedBlocks = Math.max(0, zone.length - requiredSafeCount);

        let blocksInZone = safeBlockLanes.filter((l) => zone.includes(l));

        while (blocksInZone.length > maxAllowedBlocks && blocksInZone.length > 0) {
          const removeLane = blocksInZone[Math.floor(Math.random() * blocksInZone.length)];
          const removeIdx = safeBlockLanes.indexOf(removeLane);
          if (removeIdx !== -1) {
            safeBlockLanes.splice(removeIdx, 1);
          }
          blocksInZone = safeBlockLanes.filter((l) => zone.includes(l));
        }
      });

      return safeBlockLanes;
    }

    checkStageUnlockCelebration() {
      let newestUnlocked = 0;
      for (let i = STAGES.length - 1; i >= 0; i--) {
        if (this.careerPoints >= STAGES[i].unlockPts) {
          newestUnlocked = i;
          break;
        }
      }

      if (newestUnlocked > this.highestSeenStage) {
        this.highestSeenStage = newestUnlocked;
        safeSet('disc_run_highest_unlocked', this.highestSeenStage);
        this.showStageUnlockModal(newestUnlocked);
      }
    }

    showStageUnlockModal(stageIndex) {
      const stage = STAGES[stageIndex];
      if (this.unlockedStageTitle) this.unlockedStageTitle.textContent = stage.name;
      if (this.unlockedStageDesc) this.unlockedStageDesc.textContent = `${stage.lanes.length} Lanes • Hazard: ${stage.hazardName}`;
      if (this.stageUnlockedModal) this.stageUnlockedModal.classList.remove('hidden');

      this.setDucking(false);
      if (this.state === STATE.PLAYING) {
        this.isPaused = true;
        if (window.soundEngine) window.soundEngine.stopBgm();
      }

      if (window.soundEngine) window.soundEngine.playUpgradeSound();

      const closeAndResume = () => {
        if (this.stageUnlockedModal) this.stageUnlockedModal.classList.add('hidden');
        if (this.state === STATE.PLAYING) {
          setTimeout(() => {
            if (this.state === STATE.PLAYING && this.isPaused) {
              this.isPaused = false;
              if (window.soundEngine) window.soundEngine.startBgm();
            }
          }, 1000);
        }
      };

      if (this.unlockedCloseBtn) {
        this.unlockedCloseBtn.onclick = (e) => {
          e.stopPropagation();
          closeAndResume();
        };
      }
      if (this.stageUnlockedModal) {
        this.stageUnlockedModal.onclick = (e) => {
          if (e.target === this.stageUnlockedModal) {
            closeAndResume();
          }
        };
      }
    }

    updateStageSelectorUI() {
      if (this.startCareerPoints) this.startCareerPoints.textContent = this.careerPoints.toLocaleString() + ' PTS';
      if (this.gameoverCareerPoints) this.gameoverCareerPoints.textContent = this.careerPoints.toLocaleString() + ' PTS';
      if (this.hudStageName) this.hudStageName.textContent = this.currentStage.shortName;
      if (this.startStageBtnLabel) this.startStageBtnLabel.textContent = this.currentStage.shortName;
      if (this.gameoverStageBtnLabel) this.gameoverStageBtnLabel.textContent = this.currentStage.shortName;

      let nextStage = null;
      for (let i = 0; i < STAGES.length; i++) {
        if (this.careerPoints < STAGES[i].unlockPts) {
          nextStage = STAGES[i];
          break;
        }
      }

      let milestonePct = 100;
      let milestoneText = 'ALL STAGES UNLOCKED!';
      let milestoneLabel = 'MAX PROGRESS';

      if (nextStage) {
        const prevPts = nextStage.id > 0 ? STAGES[nextStage.id - 1].unlockPts : 0;
        const ptsInTier = nextStage.unlockPts - prevPts;
        const currentTierProgress = Math.max(0, this.careerPoints - prevPts);
        milestonePct = Math.min(100, Math.floor((currentTierProgress / ptsInTier) * 100));
        milestoneText = `${this.careerPoints.toLocaleString()} / ${nextStage.unlockPts.toLocaleString()} PTS`;
        milestoneLabel = `Unlock ${nextStage.shortName} (${milestonePct}%)`;
      }

      [
        { label: this.startMilestoneLabel, text: this.startMilestoneText, fill: this.startMilestoneBarFill },
        { label: this.gameoverMilestoneLabel, text: this.gameoverMilestoneText, fill: this.gameoverMilestoneBarFill }
      ].forEach((bar) => {
        if (!bar.label || !bar.text || !bar.fill) return;
        bar.label.textContent = milestoneLabel;
        bar.text.textContent = milestoneText;
        bar.fill.style.width = milestonePct + '%';
      });

      const bonusPts = REV_BONUS_TIERS[this.revBonusLevel] || 0;
      const stageCards = document.querySelectorAll('.stage-card');
      stageCards.forEach((card) => {
        const stageId = parseInt(card.dataset.stage, 10);
        const stageDef = STAGES[stageId];
        if (!stageDef) return;
        const isUnlocked = this.careerPoints >= stageDef.unlockPts;
        const isActive = this.selectedStageIndex === stageId;

        card.classList.toggle('active-stage', isActive);
        card.classList.toggle('locked-stage', !isUnlocked);

        const descEl = card.querySelector('.stage-theme-desc');
        if (descEl) {
          const totalRevPts = stageDef.revPoints + bonusPts;
          descEl.textContent = `${stageDef.lanes.length} Lanes • +${totalRevPts} PTS/Rev (${stageDef.revRate.toFixed(1)}x) • Hazard: ${stageDef.hazardName}`;
        }

        const badgeEl = card.querySelector('.stage-status-badge');
        if (badgeEl) {
          if (isActive) {
            badgeEl.className = 'stage-status-badge unlocked-badge';
            badgeEl.textContent = 'ACTIVE';
          } else if (isUnlocked) {
            badgeEl.className = 'stage-status-badge unlocked-badge';
            badgeEl.textContent = 'UNLOCKED';
          } else {
            badgeEl.className = 'stage-status-badge locked-badge';
            badgeEl.textContent = `🔒 ${stageDef.unlockPts.toLocaleString()} PTS`;
          }
        }
      });
    }

    toggleControlsInversion() {
      this.invertedControls = !this.invertedControls;
      safeSet('disc_run_inverted_controls', this.invertedControls ? 'true' : 'false');
      this.updateControlsUI();
      if (window.soundEngine) {
        window.soundEngine.playScoreChime();
      }
    }

    updateControlsUI() {
      const isMobile = this.isMobileDevice();
      let modeText;
      if (isMobile) {
        modeText = this.invertedControls ? 'TAP RIGHT◀ LEFT▶ (INVERTED)' : 'TAP LEFT◀ RIGHT▶ (NORMAL)';
      } else {
        modeText = this.invertedControls ? 'A▶ D◀ (INVERTED)' : 'A◀ D▶ (NORMAL)';
      }
      if (this.startControlsLabel) this.startControlsLabel.textContent = modeText;
      if (this.gameoverControlsLabel) this.gameoverControlsLabel.textContent = modeText;

      if (this.hintKeys) {
        this.hintKeys.innerHTML = this.invertedControls
          ? '<kbd>A</kbd> &rarr; / <kbd>D</kbd> &larr;'
          : '<kbd>&larr;</kbd> <kbd>&rarr;</kbd> or <kbd>A</kbd> <kbd>D</kbd>';
      }

      this.updateControlsHintUI();
    }

    updateUpgradeShopUI() {
      const formattedBank = this.bankPoints.toLocaleString();
      const currentDurStr = this.maxDuckDuration.toFixed(2) + 's';

      if (this.shopBankPoints) this.shopBankPoints.textContent = formattedBank;
      if (this.gameoverBankPoints) this.gameoverBankPoints.textContent = formattedBank + ' PTS';
      if (this.gameoverShopBankPoints) this.gameoverShopBankPoints.textContent = formattedBank;
      if (this.mobileStartBankBadge) this.mobileStartBankBadge.textContent = formattedBank;
      if (this.mobileGameoverBankBadge) this.mobileGameoverBankBadge.textContent = formattedBank;

      // 1. Duck Upgrade Status
      const duckLvlText = `LVL ${this.duckLevel} (${currentDurStr})`;
      if (this.startDuckStat) this.startDuckStat.textContent = duckLvlText;
      if (this.gameoverDuckStat) this.gameoverDuckStat.textContent = duckLvlText;

      const isDuckMax = this.duckLevel >= MAX_DUCK_LEVEL;
      const duckCost = DUCK_COSTS[this.duckLevel - 1] || 0;
      const canAffordDuck = !isDuckMax && this.bankPoints >= duckCost;
      const duckBtnHtml = isDuckMax
        ? `MAX LEVEL (${currentDurStr})`
        : `UPGRADE (+0.05s) &bull; <span>${duckCost.toLocaleString()}</span> PTS`;

      [this.startUpgradeDuckBtn, this.gameoverUpgradeDuckBtn].forEach((btn) => {
        if (!btn) return;
        btn.innerHTML = duckBtnHtml;
        btn.disabled = isDuckMax || !canAffordDuck;
      });

      // 2. Orbit Turbine (Rotation Yield Bonus)
      const bonusYield = REV_BONUS_TIERS[this.revBonusLevel] || 0;
      const revBonusLvlText = this.revBonusLevel === 0
        ? 'LVL 0 (OFF)'
        : `LVL ${this.revBonusLevel} (+${bonusYield}/REV)`;
      if (this.startRevBonusStat) this.startRevBonusStat.textContent = revBonusLvlText;
      if (this.gameoverRevBonusStat) this.gameoverRevBonusStat.textContent = revBonusLvlText;

      const isRevBonusMax = this.revBonusLevel >= MAX_REV_BONUS_LEVEL;
      const revBonusCost = REV_BONUS_COSTS[this.revBonusLevel] || 0;
      const nextBonusYield = REV_BONUS_TIERS[this.revBonusLevel + 1] || 0;
      const yieldGain = nextBonusYield - bonusYield;
      const revBonusBtnHtml = isRevBonusMax
        ? `MAX TURBINE (+15/REV)`
        : (this.revBonusLevel === 0
            ? `UNLOCK TURBINE (+1/REV) &bull; <span>${revBonusCost.toLocaleString()}</span> PTS`
            : `UPGRADE (+${yieldGain}/REV) &bull; <span>${revBonusCost.toLocaleString()}</span> PTS`);

      [this.startUpgradeRevBonusBtn, this.gameoverUpgradeRevBonusBtn].forEach((btn) => {
        if (!btn) return;
        btn.innerHTML = revBonusBtnHtml;
        btn.disabled = isRevBonusMax || this.bankPoints < revBonusCost;
      });

      // 3. Crash Shield Status
      const shieldLvlText = this.shieldLevel === 0
        ? 'LVL 0 (OFF)'
        : `LVL ${this.shieldLevel} (${this.shieldLevel}/3 SHIELDS)`;
      if (this.startShieldStat) this.startShieldStat.textContent = shieldLvlText;
      if (this.gameoverShieldStat) this.gameoverShieldStat.textContent = shieldLvlText;

      const isShieldMax = this.shieldLevel >= MAX_SHIELD_LEVEL;
      const shieldCost = SHIELD_COSTS[this.shieldLevel] || 0;
      const canAffordShield = !isShieldMax && this.bankPoints >= shieldCost;
      const shieldBtnHtml = isShieldMax
        ? `MAX SHIELDS (3/3)`
        : (this.shieldLevel === 0
            ? `UNLOCK SHIELD (1x) &bull; <span>${shieldCost.toLocaleString()}</span> PTS`
            : `UPGRADE (+1 SHIELD) &bull; <span>${shieldCost.toLocaleString()}</span> PTS`);

      [this.startUpgradeShieldBtn, this.gameoverUpgradeShieldBtn].forEach((btn) => {
        if (!btn) return;
        btn.innerHTML = shieldBtnHtml;
        btn.disabled = isShieldMax || !canAffordShield;
      });

      // 3. Hazard Deflector Status
      const deflectorLvlText = this.deflectorLevel === 0
        ? 'LVL 0 (OFF)'
        : `LVL ${this.deflectorLevel} (${this.deflectorLevel}/3 NEGATIONS)`;
      if (this.startDeflectorStat) this.startDeflectorStat.textContent = deflectorLvlText;
      if (this.gameoverDeflectorStat) this.gameoverDeflectorStat.textContent = deflectorLvlText;

      const isDeflectorMax = this.deflectorLevel >= MAX_DEFLECTOR_LEVEL;
      const deflectorCost = DEFLECTOR_COSTS[this.deflectorLevel] || 0;
      const canAffordDeflector = !isDeflectorMax && this.bankPoints >= deflectorCost;
      const deflectorBtnHtml = isDeflectorMax
        ? `MAX DEFLECTOR (3/3)`
        : (this.deflectorLevel === 0
            ? `UNLOCK DEFLECTOR &bull; <span>${deflectorCost.toLocaleString()}</span> PTS`
            : `UPGRADE (+1 DEFLECT) &bull; <span>${deflectorCost.toLocaleString()}</span> PTS`);

      [this.startUpgradeDeflectorBtn, this.gameoverUpgradeDeflectorBtn].forEach((btn) => {
        if (!btn) return;
        btn.innerHTML = deflectorBtnHtml;
        btn.disabled = isDeflectorMax || !canAffordDeflector;
      });

      // 4. Powerup Booster Status
      const boosterLvlText = this.boosterLevel === 0
        ? 'LVL 0 (OFF)'
        : `LVL ${this.boosterLevel} (+${BOOSTER_BONUS_SEC[this.boosterLevel]}s DURATION)`;
      if (this.startBoosterStat) this.startBoosterStat.textContent = boosterLvlText;
      if (this.gameoverBoosterStat) this.gameoverBoosterStat.textContent = boosterLvlText;

      const isBoosterMax = this.boosterLevel >= MAX_BOOSTER_LEVEL;
      const boosterCost = BOOSTER_COSTS[this.boosterLevel] || 0;
      const canAffordBooster = !isBoosterMax && this.bankPoints >= boosterCost;
      const boosterBtnHtml = isBoosterMax
        ? `MAX BOOSTER (+9s)`
        : (this.boosterLevel === 0
            ? `UNLOCK BOOSTER &bull; <span>${boosterCost.toLocaleString()}</span> PTS`
            : `UPGRADE (+3s) &bull; <span>${boosterCost.toLocaleString()}</span> PTS`);

      [this.startUpgradeBoosterBtn, this.gameoverUpgradeBoosterBtn].forEach((btn) => {
        if (!btn) return;
        btn.innerHTML = boosterBtnHtml;
        btn.disabled = isBoosterMax || !canAffordBooster;
      });

      // 5. Powerup Magnet Status
      const magnetLabels = ['LVL 0 (OFF)', 'LVL 1 (1 LANE)', 'LVL 2 (2 LANES)', 'LVL 3 (FULL DISC)'];
      const magnetLvlText = magnetLabels[this.magnetLevel] || 'LVL 3 (MAX)';
      if (this.startMagnetStat) this.startMagnetStat.textContent = magnetLvlText;
      if (this.gameoverMagnetStat) this.gameoverMagnetStat.textContent = magnetLvlText;

      const isMagnetMax = this.magnetLevel >= MAX_MAGNET_LEVEL;
      const magnetCost = MAGNET_COSTS[this.magnetLevel] || 0;
      const canAffordMagnet = !isMagnetMax && this.bankPoints >= magnetCost;
      const magnetBtnHtml = isMagnetMax
        ? `MAX MAGNET`
        : (this.magnetLevel === 0
            ? `UNLOCK MAGNET &bull; <span>${magnetCost.toLocaleString()}</span> PTS`
            : `EXPAND RADIUS &bull; <span>${magnetCost.toLocaleString()}</span> PTS`);

      [this.startUpgradeMagnetBtn, this.gameoverUpgradeMagnetBtn].forEach((btn) => {
        if (!btn) return;
        btn.innerHTML = magnetBtnHtml;
        btn.disabled = isMagnetMax || !canAffordMagnet;
      });

      if (this.hintDuckDuration) this.hintDuckDuration.textContent = currentDurStr;
    }

    buyDuckUpgrade() {
      if (this.duckLevel >= MAX_DUCK_LEVEL) return;
      const cost = DUCK_COSTS[this.duckLevel - 1] || 0;
      if (this.bankPoints >= cost) {
        this.bankPoints -= cost;
        this.duckLevel += 1;
        this.maxDuckDuration = this.getDuckDuration(this.duckLevel);
        this.currentDuckTime = this.maxDuckDuration;
        this.isDuckExhausted = false;

        safeSet('disc_run_duck_level', this.duckLevel);
        safeSet('disc_run_bank_points', this.bankPoints);

        if (window.soundEngine) window.soundEngine.playUpgradeSound();
        this.updateUpgradeShopUI();
      }
    }

    buyRevBonusUpgrade() {
      if (this.revBonusLevel >= MAX_REV_BONUS_LEVEL) return;
      const cost = REV_BONUS_COSTS[this.revBonusLevel] || 0;
      if (this.bankPoints >= cost) {
        this.bankPoints -= cost;
        this.revBonusLevel += 1;

        safeSet('disc_run_rev_bonus_level', this.revBonusLevel);
        safeSet('disc_run_bank_points', this.bankPoints);

        if (window.soundEngine) window.soundEngine.playUpgradeSound();
        this.updateUpgradeShopUI();
        this.updateStageSelectorUI();
      }
    }

    buyShieldUpgrade() {
      if (this.shieldLevel >= MAX_SHIELD_LEVEL) return;
      const cost = SHIELD_COSTS[this.shieldLevel] || 0;
      if (this.bankPoints >= cost) {
        this.bankPoints -= cost;
        this.shieldLevel += 1;
        this.currentShields = this.shieldLevel;

        safeSet('disc_run_shield_level', this.shieldLevel);
        safeSet('disc_run_bank_points', this.bankPoints);

        if (window.soundEngine) window.soundEngine.playUpgradeSound();
        this.updateUpgradeShopUI();
      }
    }

    buyDeflectorUpgrade() {
      if (this.deflectorLevel >= MAX_DEFLECTOR_LEVEL) return;
      const cost = DEFLECTOR_COSTS[this.deflectorLevel] || 0;
      if (this.bankPoints >= cost) {
        this.bankPoints -= cost;
        this.deflectorLevel += 1;
        this.currentHazardShields = this.deflectorLevel;

        safeSet('disc_run_deflector_level', this.deflectorLevel);
        safeSet('disc_run_bank_points', this.bankPoints);

        if (window.soundEngine) window.soundEngine.playUpgradeSound();
        this.updateUpgradeShopUI();
      }
    }

    buyBoosterUpgrade() {
      if (this.boosterLevel >= MAX_BOOSTER_LEVEL) return;
      const cost = BOOSTER_COSTS[this.boosterLevel] || 0;
      if (this.bankPoints >= cost) {
        this.bankPoints -= cost;
        this.boosterLevel += 1;

        safeSet('disc_run_booster_level', this.boosterLevel);
        safeSet('disc_run_bank_points', this.bankPoints);

        if (window.soundEngine) window.soundEngine.playUpgradeSound();
        this.updateUpgradeShopUI();
      }
    }

    buyMagnetUpgrade() {
      if (this.magnetLevel >= MAX_MAGNET_LEVEL) return;
      const cost = MAGNET_COSTS[this.magnetLevel] || 0;
      if (this.bankPoints >= cost) {
        this.bankPoints -= cost;
        this.magnetLevel += 1;

        safeSet('disc_run_magnet_level', this.magnetLevel);
        safeSet('disc_run_bank_points', this.bankPoints);

        if (window.soundEngine) window.soundEngine.playUpgradeSound();
        this.updateUpgradeShopUI();
      }
    }

    // --- Toast Notifications ---
    showDuckBonusToast(text, isPerfect = false) {
      if (!this.duckBonusToast) return;
      this.duckBonusToast.textContent = text;
      this.duckBonusToast.className = isPerfect ? 'perfect-duck-theme' : '';
      this.duckBonusToast.classList.remove('hidden');

      this.duckBonusToast.style.animation = 'none';
      void this.duckBonusToast.offsetHeight;
      this.duckBonusToast.style.animation = null;

      if (this.duckBonusTimeout) clearTimeout(this.duckBonusTimeout);
      this.duckBonusTimeout = setTimeout(() => {
        if (this.duckBonusToast) this.duckBonusToast.classList.add('hidden');
      }, isPerfect ? 1400 : 1100);
    }

    // --- Reset Progress Feature ---
    openResetModal() {
      if (this.resetConfirmModal) this.resetConfirmModal.classList.remove('hidden');
    }

    closeResetModal() {
      if (this.resetConfirmModal) this.resetConfirmModal.classList.add('hidden');
    }

    resetAllData() {
      safeRemove('disc_run_career_points');
      safeRemove('disc_run_selected_stage');
      safeRemove('disc_run_duck_level');
      safeRemove('disc_run_rev_bonus_level');
      safeRemove('disc_run_shield_level');
      safeRemove('disc_run_deflector_level');
      safeRemove('disc_run_booster_level');
      safeRemove('disc_run_magnet_level');
      safeRemove('disc_run_bank_points');
      safeRemove('disc_run_highscore');
      safeRemove('disc_run_highest_unlocked');
      safeRemove('disc_run_total_runs');
      safeRemove('disc_run_total_rotations');
      safeRemove('disc_run_best_rotations');
      safeRemove('disc_run_total_time_played');
      safeRemove('disc_run_total_perfect_ducks');
      safeRemove('disc_run_total_ducks');
      safeRemove('disc_run_total_gems');
      safeRemove('disc_run_total_powerups');
      safeRemove('disc_run_total_portals');
      safeRemove('disc_run_total_hazards_deflected');
      safeRemove('disc_run_total_shields_used');
      safeRemove('disc_run_best_streak');
      safeRemove('disc_run_unlocked_achievements');
      safeRemove('disc_run_afford_upgrade_prompt_shown');

      this.careerPoints = 0;
      this.selectedStageIndex = 0;
      this.highestSeenStage = 0;
      this.hasSeenUpgradePrompt = false;
      this.duckLevel = 1;
      this.revBonusLevel = 0;
      this.shieldLevel = 0;
      this.deflectorLevel = 0;
      this.boosterLevel = 0;
      this.magnetLevel = 0;
      this.bankPoints = 0;
      this.highScore = 0;

      this.perfectDuckStreak = 0;
      this.bestPerfectDuckStreak = 0;
      this.unlockedAchievements.clear();

      this.totalRuns = 0;
      this.totalRotations = 0;
      this.bestRotations = 0;
      this.totalTimePlayed = 0;
      this.totalPerfectDucks = 0;
      this.totalDucks = 0;
      this.totalGems = 0;
      this.totalPowerups = 0;
      this.totalPortals = 0;
      this.totalHazardsDeflected = 0;
      this.totalShieldsUsed = 0;

      this.currentShields = 0;
      this.currentHazardShields = 0;
      this.maxDuckDuration = this.getDuckDuration(1);
      this.currentDuckTime = this.maxDuckDuration;
      this.isDuckExhausted = false;

      this.resetCollapsingLanes();
      this.applyStageTheme(0, false);
      this.closeResetModal();

      if (window.soundEngine) window.soundEngine.playDropSound();

      this.updateAchievementsCountUI();
      this.updateHUD();
      this.updateControlsUI();
      this.updateUpgradeShopUI();
      this.updateStageSelectorUI();
    }

    initThree() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x060714);
      this.scene.fog = new THREE.FogExp2(0x060714, 0.012);

      this.camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        250
      );
      this.cameraBasePos = new THREE.Vector3(-6.0, 18.5, 32.0);
      this.cameraLookTarget = new THREE.Vector3(2.5, 1.2, 11.5);
      this.camera.position.copy(this.cameraBasePos);
      this.camera.lookAt(this.cameraLookTarget);

      this.renderer = new THREE.WebGLRenderer({
        canvas: this.canvas,
        antialias: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance'
      });
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      this.updateCameraLayout();

      this.ambientLight = new THREE.AmbientLight(0xffffff, 0.65);
      this.scene.add(this.ambientLight);

      this.dirLight = new THREE.DirectionalLight(0x00f0ff, 1.3);
      this.dirLight.position.set(15, 35, 25);
      this.dirLight.castShadow = true;
      this.dirLight.shadow.mapSize.width = 2048;
      this.dirLight.shadow.mapSize.height = 2048;
      this.dirLight.shadow.camera.near = 0.5;
      this.dirLight.shadow.camera.far = 100;
      this.dirLight.shadow.camera.left = -30;
      this.dirLight.shadow.camera.right = 30;
      this.dirLight.shadow.camera.top = 30;
      this.dirLight.shadow.camera.bottom = -30;
      this.dirLight.shadow.bias = -0.0005;
      this.scene.add(this.dirLight);

      this.playerGlowLight = new THREE.PointLight(0x00f0ff, 2.5, 14);
      this.playerGlowLight.position.set(0, 3, this.lanes[this.playerLane]);
      this.scene.add(this.playerGlowLight);

      this.centerLight = new THREE.PointLight(0xff0055, 0.65, 14);
      this.centerLight.position.set(0, 5, 0);
      this.scene.add(this.centerLight);
    }

    updateCameraLayout() {
      if (!this.camera || !this.renderer) return;
      const aspect = window.innerWidth / window.innerHeight;
      this.camera.aspect = aspect;

      if (aspect < 1.0) {
        // Portrait mobile: higher elevated angle with wider horizontal view of incoming track
        this.camera.fov = 58;
        this.cameraBasePos.set(-4.5, 21.5, 35.0);
        this.cameraLookTarget.set(2.2, 1.2, 10.5);
      } else if (aspect < 1.4) {
        // Tablet / Square
        this.camera.fov = 52;
        this.cameraBasePos.set(-5.5, 19.0, 33.0);
        this.cameraLookTarget.set(2.2, 1.2, 11.0);
      } else {
        // Landscape / Desktop
        this.camera.fov = 46;
        this.cameraBasePos.set(-7.5, 16.5, 30.5);
        this.cameraLookTarget.set(2.5, 1.2, 11.5);
      }

      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    buildDisc() {
      this.discGroup = new THREE.Group();
      this.scene.add(this.discGroup);

      const discGeometry = new THREE.CylinderGeometry(
        DISC_RADIUS,
        DISC_RADIUS + 0.5,
        DISC_HEIGHT,
        72
      );
      const discMaterial = new THREE.MeshStandardMaterial({
        color: 0x0c1024,
        metalness: 0.35,
        roughness: 0.68
      });
      this.discMesh = new THREE.Mesh(discGeometry, discMaterial);
      this.discMesh.position.y = -DISC_HEIGHT / 2;
      this.discMesh.receiveShadow = true;
      this.discGroup.add(this.discMesh);

      const rimGeometry = new THREE.TorusGeometry(DISC_RADIUS, 0.4, 16, 72);
      const rimMaterial = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x00c0ff,
        emissiveIntensity: 0.8,
        metalness: 0.8,
        roughness: 0.2
      });
      this.rimMesh = new THREE.Mesh(rimGeometry, rimMaterial);
      this.rimMesh.rotation.x = Math.PI / 2;
      this.rimMesh.position.y = 0.05;
      this.discGroup.add(this.rimMesh);

      const spindleGeo = new THREE.CylinderGeometry(2.2, 3.0, 2.8, 32);
      const spindleMat = new THREE.MeshStandardMaterial({
        color: 0x181e3a,
        emissive: 0xff0055,
        emissiveIntensity: 0.35,
        metalness: 0.5,
        roughness: 0.45
      });
      this.spindleMesh = new THREE.Mesh(spindleGeo, spindleMat);
      this.spindleMesh.position.y = 1.4;
      this.spindleMesh.castShadow = true;
      this.spindleMesh.receiveShadow = true;
      this.discGroup.add(this.spindleMesh);

      const orbGeo = new THREE.SphereGeometry(1.1, 24, 24);
      const orbMat = new THREE.MeshStandardMaterial({
        color: 0xff0066,
        emissive: 0xff0066,
        emissiveIntensity: 0.45,
        roughness: 0.6
      });
      this.orbMesh = new THREE.Mesh(orbGeo, orbMat);
      this.orbMesh.position.y = 3.0;
      this.discGroup.add(this.orbMesh);

      const sectorCount = 24;
      for (let i = 0; i < sectorCount; i++) {
        const angle = (i / sectorCount) * Math.PI * 2;
        const lineGeo = new THREE.PlaneGeometry(0.08, DISC_RADIUS - 3.2);
        const lineMat = new THREE.MeshBasicMaterial({
          color: 0x1f2e54,
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide
        });
        const lineMesh = new THREE.Mesh(lineGeo, lineMat);
        lineMesh.rotation.x = Math.PI / 2;
        lineMesh.rotation.z = angle;
        const midR = (3.2 + DISC_RADIUS) / 2;
        lineMesh.position.set(Math.cos(angle) * midR, 0.025, Math.sin(angle) * midR);
        this.discGroup.add(lineMesh);
      }

      this.obstaclesContainer = new THREE.Group();
      this.discGroup.add(this.obstaclesContainer);

      this.collectiblesContainer = new THREE.Group();
      this.discGroup.add(this.collectiblesContainer);
    }

    buildPlayer() {
      this.playerGroup = new THREE.Group();
      this.scene.add(this.playerGroup);

      const geometry = new THREE.BoxGeometry(PLAYER_SIZE, PLAYER_SIZE, PLAYER_SIZE);
      this.playerMaterial = new THREE.MeshStandardMaterial({
        color: 0x00ffff,
        emissive: 0x0088cc,
        emissiveIntensity: 0.65,
        metalness: 0.5,
        roughness: 0.2
      });
      this.playerMesh = new THREE.Mesh(geometry, this.playerMaterial);
      this.playerMesh.castShadow = true;
      this.playerMesh.receiveShadow = true;
      this.playerGroup.add(this.playerMesh);

      const coreGeo = new THREE.BoxGeometry(
        PLAYER_SIZE * 0.65,
        PLAYER_SIZE * 0.65,
        PLAYER_SIZE * 0.65
      );
      this.playerCoreMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      this.playerCore = new THREE.Mesh(coreGeo, this.playerCoreMaterial);
      this.playerGroup.add(this.playerCore);

      const edges = new THREE.EdgesGeometry(geometry);
      const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
      this.playerWireframe = new THREE.LineSegments(edges, lineMat);
      this.playerGroup.add(this.playerWireframe);

      const shieldGeo = new THREE.IcosahedronGeometry(PLAYER_SIZE * 1.15, 1);
      const shieldMat = new THREE.MeshBasicMaterial({
        color: 0x00ffcc,
        wireframe: true,
        transparent: true,
        opacity: 0.8
      });
      this.shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
      this.shieldMesh.visible = false;
      this.playerGroup.add(this.shieldMesh);

      const shadowGeo = new THREE.RingGeometry(0.2, PLAYER_SIZE * 0.85, 32);
      const shadowMat = new THREE.MeshBasicMaterial({
        color: 0x00f0ff,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55
      });
      this.playerShadow = new THREE.Mesh(shadowGeo, shadowMat);
      this.playerShadow.rotation.x = Math.PI / 2;
      this.playerShadow.position.y = 0.03;
      this.scene.add(this.playerShadow);

      this.updatePlayerTransform();
    }

    buildEnvironment() {
      const gridHelper = new THREE.GridHelper(180, 60, 0x00f0ff, 0x0e1830);
      gridHelper.position.y = -DISC_HEIGHT - 1.5;
      this.scene.add(gridHelper);

      const particleCount = 200;
      const partGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 120;
        positions[i + 1] = Math.random() * 40 - 5;
        positions[i + 2] = (Math.random() - 0.5) * 120;
      }

      partGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const partMat = new THREE.PointsMaterial({
        color: 0x00e1ff,
        size: 0.6,
        transparent: true,
        opacity: 0.4,
        blending: THREE.AdditiveBlending
      });
      this.bgParticles = new THREE.Points(partGeo, partMat);
      this.scene.add(this.bgParticles);
    }

    initEvents() {
      window.addEventListener('resize', () => {
        this.updateCameraLayout();
      });

      // In-game Pause Button & Modal Actions
      if (this.pauseBtn) {
        this.pauseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.soundEngine) window.soundEngine.init();
          this.togglePause();
        });
      }

      if (this.fullscreenBtn) {
        this.fullscreenBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleFullscreen();
        });
      }

      // Mobile Start Screen Tabs (Stages vs Workshop)
      if (this.startTabStages && this.startTabWorkshop && this.startPanelsWrapper) {
        this.startPanelsWrapper.classList.add('mobile-show-stages');
        this.startTabStages.addEventListener('click', (e) => {
          e.stopPropagation();
          this.startTabStages.classList.add('active');
          this.startTabWorkshop.classList.remove('active');
          this.startPanelsWrapper.classList.add('mobile-show-stages');
          this.startPanelsWrapper.classList.remove('mobile-show-workshop');
          if (window.soundEngine) window.soundEngine.init();
        });
        this.startTabWorkshop.addEventListener('click', (e) => {
          e.stopPropagation();
          this.startTabWorkshop.classList.add('active');
          this.startTabStages.classList.remove('active');
          this.startPanelsWrapper.classList.add('mobile-show-workshop');
          this.startPanelsWrapper.classList.remove('mobile-show-stages');
          if (window.soundEngine) window.soundEngine.init();
        });
      }

      // Mobile Game Over Screen Tabs (Results vs Workshop)
      if (this.gameoverTabResults && this.gameoverTabWorkshop && this.gameoverPanelsWrapper) {
        this.gameoverPanelsWrapper.classList.add('mobile-show-stages');
        this.gameoverTabResults.addEventListener('click', (e) => {
          e.stopPropagation();
          this.gameoverTabResults.classList.add('active');
          this.gameoverTabWorkshop.classList.remove('active');
          this.gameoverPanelsWrapper.classList.add('mobile-show-stages');
          this.gameoverPanelsWrapper.classList.remove('mobile-show-workshop');
          if (window.soundEngine) window.soundEngine.init();
        });
        this.gameoverTabWorkshop.addEventListener('click', (e) => {
          e.stopPropagation();
          this.gameoverTabWorkshop.classList.add('active');
          this.gameoverTabResults.classList.remove('active');
          this.gameoverPanelsWrapper.classList.add('mobile-show-workshop');
          this.gameoverPanelsWrapper.classList.remove('mobile-show-stages');
          if (window.soundEngine) window.soundEngine.init();
        });
      }

      if (this.pauseResumeBtn) {
        this.pauseResumeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.resumeGame();
        });
      }

      if (this.pauseRestartBtn) {
        this.pauseRestartBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.isPaused = false;
          if (this.pauseScreen) this.pauseScreen.classList.add('hidden');
          this.restartGame();
        });
      }

      if (this.pauseMenuBtn) {
        this.pauseMenuBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.exitToMainMenu();
        });
      }

      // Lifetime Career Stats Modal Triggers
      const bindStats = (btn) => {
        if (!btn) return;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openStatsModal();
        });
      };
      bindStats(this.startStatsBtn);
      bindStats(this.gameoverStatsBtn);

      if (this.closeStatsBtn) {
        this.closeStatsBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeStatsModal();
        });
      }
      if (this.lifetimeStatsModal) {
        this.lifetimeStatsModal.addEventListener('click', (e) => {
          if (e.target === this.lifetimeStatsModal) {
            this.closeStatsModal();
          }
        });
      }

      // Achievements Modal Triggers
      const bindAchieve = (btn) => {
        if (!btn) return;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openAchievementsModal();
        });
      };
      bindAchieve(this.startAchieveBtn);
      bindAchieve(this.gameoverAchieveBtn);

      if (this.closeAchieveBtn) {
        this.closeAchieveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeAchievementsModal();
        });
      }
      if (this.achievementsModal) {
        this.achievementsModal.addEventListener('click', (e) => {
          if (e.target === this.achievementsModal) {
            this.closeAchievementsModal();
          }
        });
      }

      // First Time Upgrade Prompt Modal Actions
      if (this.upgradePromptGoBtn) {
        this.upgradePromptGoBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.soundEngine) window.soundEngine.init();
          this.openWorkshopFromPrompt();
        });
      }
      if (this.upgradePromptCloseBtn) {
        this.upgradePromptCloseBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (this.upgradeAvailableModal) this.upgradeAvailableModal.classList.add('hidden');
        });
      }
      if (this.upgradeAvailableModal) {
        this.upgradeAvailableModal.addEventListener('click', (e) => {
          if (e.target === this.upgradeAvailableModal) {
            this.upgradeAvailableModal.classList.add('hidden');
          }
        });
      }

      // Stage Card Click Selectors (Works across all 8 cards)
      document.addEventListener('click', (e) => {
        const card = e.target.closest('.stage-card');
        if (!card) return;
        const stageId = parseInt(card.dataset.stage, 10);
        if (this.careerPoints >= STAGES[stageId].unlockPts) {
          this.applyStageTheme(stageId, true);
        } else {
          if (window.soundEngine) window.soundEngine.playExhaustSound();
        }
      });

      // Keyboard Controls
      window.addEventListener('keydown', (e) => {
        if (e.repeat) return;
        if (window.soundEngine) window.soundEngine.init();

        // Pause Key: ESC or KeyP
        if (e.code === 'Escape' || e.code === 'KeyP') {
          this.togglePause();
          return;
        }

        if (this.isPaused) return;

        if (e.code === 'KeyC' || e.code === 'KeyI') {
          this.toggleControlsInversion();
          return;
        }

        if (e.code === 'KeyU') {
          this.buyDuckUpgrade();
          return;
        }

        if (this.state === STATE.START) {
          if (e.code === 'Space' || e.code === 'Enter') {
            this.startGame();
          }
          return;
        }

        if (this.state === STATE.GAME_OVER) {
          if ((e.code === 'Space' || e.code === 'Enter') && this.canRestart) {
            this.restartGame();
          }
          return;
        }

        if (this.state === STATE.PLAYING) {
          if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
            this.shiftLane(this.invertedControls ? -1 : 1);
          } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
            this.shiftLane(this.invertedControls ? 1 : -1);
          } else if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'KeyS') {
            this.setDucking(true);
          }
        }
      });

      window.addEventListener('keyup', (e) => {
        if (e.code === 'Space' || e.code === 'ArrowDown' || e.code === 'KeyS') {
          this.setDucking(false);
        }
      });

      // Controls Inversion Toggle Buttons
      const bindToggle = (btn) => {
        if (!btn) return;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.soundEngine) window.soundEngine.init();
          this.toggleControlsInversion();
        });
      };
      bindToggle(this.startControlsToggleBtn);
      bindToggle(this.gameoverControlsToggleBtn);

      // Upgrade Action Buttons (Duck, Shield, Deflector, Booster, Magnet)
      const bindClick = (btn, action) => {
        if (!btn) return;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.soundEngine) window.soundEngine.init();
          action();
        });
      };

      bindClick(this.startUpgradeDuckBtn, () => this.buyDuckUpgrade());
      bindClick(this.gameoverUpgradeDuckBtn, () => this.buyDuckUpgrade());

      bindClick(this.startUpgradeRevBonusBtn, () => this.buyRevBonusUpgrade());
      bindClick(this.gameoverUpgradeRevBonusBtn, () => this.buyRevBonusUpgrade());

      bindClick(this.startUpgradeShieldBtn, () => this.buyShieldUpgrade());
      bindClick(this.gameoverUpgradeShieldBtn, () => this.buyShieldUpgrade());

      bindClick(this.startUpgradeDeflectorBtn, () => this.buyDeflectorUpgrade());
      bindClick(this.gameoverUpgradeDeflectorBtn, () => this.buyDeflectorUpgrade());

      bindClick(this.startUpgradeBoosterBtn, () => this.buyBoosterUpgrade());
      bindClick(this.gameoverUpgradeBoosterBtn, () => this.buyBoosterUpgrade());

      bindClick(this.startUpgradeMagnetBtn, () => this.buyMagnetUpgrade());
      bindClick(this.gameoverUpgradeMagnetBtn, () => this.buyMagnetUpgrade());

      // Reset Data Modal Triggers
      if (this.startResetDataBtn) {
        this.startResetDataBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openResetModal();
        });
      }
      if (this.gameoverResetDataBtn) {
        this.gameoverResetDataBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.openResetModal();
        });
      }
      if (this.cancelResetBtn) {
        this.cancelResetBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.closeResetModal();
        });
      }
      if (this.confirmResetBtn) {
        this.confirmResetBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          this.resetAllData();
        });
      }

      // UI Buttons
      if (this.startBtn) {
        this.startBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.soundEngine) window.soundEngine.init();
          this.startGame();
        });
      }

      if (this.restartBtn) {
        this.restartBtn.addEventListener('click', (e) => {
          if (!this.canRestart) return;
          e.stopPropagation();
          if (window.soundEngine) window.soundEngine.init();
          this.restartGame();
        });
      }

      // Post-Run Second Chance / Ad Option Modal Buttons
      if (this.postrunReviveBtn) {
        this.postrunReviveBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.soundEngine) window.soundEngine.init();
          this.handleAdRevive();
        });
      }

      if (this.postrunDoubleBtn) {
        this.postrunDoubleBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.soundEngine) window.soundEngine.init();
          this.handleAdDoublePoints();
        });
      }

      if (this.postrunSkipBtn) {
        this.postrunSkipBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (window.soundEngine) window.soundEngine.init();
          this.handlePostRunSkip();
        });
      }

      if (this.soundToggleBtn) {
        this.soundToggleBtn.addEventListener('click', () => {
          if (window.soundEngine) {
            window.soundEngine.init();
            const muted = window.soundEngine.toggleMute();
            this.soundToggleBtn.textContent = muted ? '🔇' : '🔊';
          }
        });
      }

      // Mobile & Desktop Adaptive Touch Controls
      this.centerDuckTouchId = null;

      const handleTouchStart = (e) => {
        if (this.isPaused || this.state !== STATE.PLAYING) return;
        if (window.soundEngine) window.soundEngine.init();

        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          const xPct = touch.clientX / window.innerWidth;
          const yPct = touch.clientY / window.innerHeight;

          // Ignore top 14% where Pause / Sound buttons live
          if (yPct < 0.14 && (touch.clientX < 150 || touch.clientX > window.innerWidth - 90)) {
            continue;
          }

          if (xPct < 0.275) {
            // LEFT ZONE: Tap anywhere on left side of screen
            this.shiftLane(this.invertedControls ? -1 : 1);
            if (this.zoneLeftGuide) {
              this.zoneLeftGuide.classList.add('touch-active');
              setTimeout(() => { if (this.zoneLeftGuide) this.zoneLeftGuide.classList.remove('touch-active'); }, 140);
            }
          } else if (xPct > 0.725) {
            // RIGHT ZONE: Tap anywhere on right side of screen
            this.shiftLane(this.invertedControls ? 1 : -1);
            if (this.zoneRightGuide) {
              this.zoneRightGuide.classList.add('touch-active');
              setTimeout(() => { if (this.zoneRightGuide) this.zoneRightGuide.classList.remove('touch-active'); }, 140);
            }
          } else {
            // CENTER ZONE: Hold anywhere in middle 45% to duck (+15% wider zone)
            this.centerDuckTouchId = touch.identifier;
            this.setDucking(true);
            if (this.zoneCenterGuide) {
              this.zoneCenterGuide.classList.add('touch-active');
            }
          }
        }
      };

      const handleTouchMove = (e) => {
        if (this.isPaused || this.state !== STATE.PLAYING) return;

        // Check if any touch moved out of or into zones
        for (let i = 0; i < e.touches.length; i++) {
          const touch = e.touches[i];
          if (touch.identifier === this.centerDuckTouchId) {
            const xPct = touch.clientX / window.innerWidth;
            if (xPct < 0.23 || xPct > 0.77) {
              // Drifted out of center zone, release duck
              this.centerDuckTouchId = null;
              this.setDucking(false);
              if (this.zoneCenterGuide) this.zoneCenterGuide.classList.remove('touch-active');
            }
          }
        }
      };

      const handleTouchEnd = (e) => {
        if (this.state !== STATE.PLAYING) return;

        for (let i = 0; i < e.changedTouches.length; i++) {
          const touch = e.changedTouches[i];
          if (touch.identifier === this.centerDuckTouchId) {
            this.centerDuckTouchId = null;
            this.setDucking(false);
            if (this.zoneCenterGuide) this.zoneCenterGuide.classList.remove('touch-active');
          }
        }

        if (e.touches.length === 0) {
          this.centerDuckTouchId = null;
          this.setDucking(false);
          if (this.zoneCenterGuide) this.zoneCenterGuide.classList.remove('touch-active');
          if (this.zoneLeftGuide) this.zoneLeftGuide.classList.remove('touch-active');
          if (this.zoneRightGuide) this.zoneRightGuide.classList.remove('touch-active');
        }
      };

      if (this.canvas) {
        this.canvas.addEventListener('touchstart', (e) => {
          if (this.state === STATE.PLAYING && e.cancelable) e.preventDefault();
          handleTouchStart(e);
        }, { passive: false });
        this.canvas.addEventListener('touchmove', (e) => {
          if (this.state === STATE.PLAYING && e.cancelable) e.preventDefault();
          handleTouchMove(e);
        }, { passive: false });
        this.canvas.addEventListener('touchend', (e) => {
          if (this.state === STATE.PLAYING && e.cancelable) e.preventDefault();
          handleTouchEnd(e);
        }, { passive: false });
        this.canvas.addEventListener('touchcancel', handleTouchEnd, { passive: true });
      }

      // Legacy on-screen buttons support (if displayed)
      const addTouchBtn = (elem, onPress, onRelease) => {
        if (!elem) return;
        elem.addEventListener('touchstart', (e) => {
          e.preventDefault();
          e.stopPropagation();
          if (window.soundEngine) window.soundEngine.init();
          if (this.isPaused) return;
          if (this.state === STATE.START) { this.startGame(); return; }
          if (this.state === STATE.GAME_OVER) { if (this.canRestart) this.restartGame(); return; }
          onPress();
        }, { passive: false });
        if (onRelease) {
          elem.addEventListener('touchend', (e) => { e.preventDefault(); e.stopPropagation(); onRelease(); }, { passive: false });
          elem.addEventListener('touchcancel', (e) => { e.preventDefault(); e.stopPropagation(); onRelease(); }, { passive: false });
        }
      };

      addTouchBtn(this.touchLeftBtn, () => this.shiftLane(this.invertedControls ? -1 : 1));
      addTouchBtn(this.touchRightBtn, () => this.shiftLane(this.invertedControls ? 1 : -1));
      addTouchBtn(this.touchDuckBtn, () => this.setDucking(true), () => this.setDucking(false));
    }

    // --- State Transitions ---

    startGame() {
      this.state = STATE.DROPPING;
      this.isPaused = false;
      this.canRestart = true;
      if (this.startScreen) this.startScreen.classList.add('hidden');
      if (this.gameOverScreen) this.gameOverScreen.classList.add('hidden');
      if (this.pauseScreen) this.pauseScreen.classList.add('hidden');
      if (this.hud) this.hud.classList.remove('hidden');
      if (this.controlsHint) this.controlsHint.classList.remove('hidden');
      if (this.orbitMultiplierContainer) this.orbitMultiplierContainer.classList.remove('hidden');
      if (this.isTouchDevice && this.touchZonesContainer) {
        this.touchZonesContainer.classList.remove('hidden');
      }
      this.updateControlsHintUI();

      // Lifetime Stat: Total Runs Played
      this.totalRuns++;
      safeSet('disc_run_total_runs', this.totalRuns);

      // Reset run stats, Orbit Multiplier & Perfect Duck streak
      this.score = 0;
      this.perfectDuckStreak = 0;
      this.rotationsCleared = 0;
      this.lastAwardedRevolution = 0;
      this.lastOrbitMultiplier = 1;
      this.speedMultiplier = 1.0;
      this.currentAngularSpeed = this.baseAngularSpeed;
      this.discAngle = 0;
      this.discGroup.rotation.y = 0;
      this.updateOrbitMultiplierUI();

      // Reset in-run powerups, shields & status effects
      this.currentShields = this.shieldLevel;
      this.currentHazardShields = this.deflectorLevel;
      this.activePowerup = null;
      this.powerupTimer = 0;
      this.invulnerableTimer = 0;
      this.slowTimer = 0;
      this.scoreMultiplier = 1;
      if (this.activePowerupBar) this.activePowerupBar.classList.add('hidden');
      if (this.hudMultiplierTag) this.hudMultiplierTag.classList.add('hidden');
      if (this.duckBonusToast) this.duckBonusToast.classList.add('hidden');

      // Reset duck timer
      this.maxDuckDuration = this.getDuckDuration(this.duckLevel);
      this.currentDuckTime = this.maxDuckDuration;
      this.isDuckExhausted = false;

      // Reset Stage 8 Collapsing Lanes
      this.resetCollapsingLanes();

      // Reset player on active stage default lane
      this.playerLane = Math.min(this.currentStage.defaultLane, this.laneCount - 1);
      this.targetRadius = this.lanes[this.playerLane];
      this.currentRadius = this.lanes[this.playerLane];
      this.playerY = 24;
      this.playerVelocityY = 0;
      this.isDucking = false;
      this.targetDuckScaleY = 1.0;
      this.duckScaleY = 1.0;
      this.squashScaleX = 1.0;
      this.squashScaleZ = 1.0;

      // Reset rewarded ad options for new run
      this.canReviveThisRun = true;
      this.pointsDoubledThisLoss = false;
      if (this.postRunModal) this.postRunModal.classList.add('hidden');
      if (this.postrunReviveBtn) this.postrunReviveBtn.disabled = false;
      if (this.postrunDoubleBtn) this.postrunDoubleBtn.disabled = false;
      if (this.postrunSkipBtn) this.postrunSkipBtn.disabled = false;

      // Clear obstacles & collectibles
      this.clearObstacles();
      this.clearCollectibles();
      this.lastSpawnAngle = 0;
      
      // Timed Collectible Spawner
      this.collectibleTimer = 0;
      this.nextCollectibleTime = 1.5;

      this.checkAchievements();

      if (window.soundEngine) {
        window.soundEngine.setStage(this.selectedStageIndex);
        window.soundEngine.playStartSound();
      }
      this.updateHUD();
      this.updateUpgradeShopUI();
    }

    restartGame() {
      this.clearDebris();
      this.startGame();
    }

    exitToMainMenu() {
      this.state = STATE.START;
      this.isPaused = false;
      this.clearDebris();
      this.clearObstacles();
      this.clearCollectibles();
      if (this.pauseScreen) this.pauseScreen.classList.add('hidden');
      if (this.gameOverScreen) this.gameOverScreen.classList.add('hidden');
      if (this.postRunModal) this.postRunModal.classList.add('hidden');
      if (this.hud) this.hud.classList.add('hidden');
      if (this.controlsHint) this.controlsHint.classList.add('hidden');
      if (this.orbitMultiplierContainer) this.orbitMultiplierContainer.classList.add('hidden');
      if (this.touchZonesContainer) this.touchZonesContainer.classList.add('hidden');
      if (this.startScreen) this.startScreen.classList.remove('hidden');

      this.updateUpgradeShopUI();
      this.updateStageSelectorUI();
      this.checkAffordableUpgradePrompt();
    }

    checkAffordableUpgradePrompt() {
      if (this.hasSeenUpgradePrompt) return;

      // Check if any upgrade can currently be afforded
      const duckCost = this.duckLevel < MAX_DUCK_LEVEL ? (DUCK_COSTS[this.duckLevel - 1] || Infinity) : Infinity;
      const shieldCost = this.shieldLevel < MAX_SHIELD_LEVEL ? (SHIELD_COSTS[this.shieldLevel] || Infinity) : Infinity;
      const deflectorCost = this.deflectorLevel < MAX_DEFLECTOR_LEVEL ? (DEFLECTOR_COSTS[this.deflectorLevel] || Infinity) : Infinity;
      const boosterCost = this.boosterLevel < MAX_BOOSTER_LEVEL ? (BOOSTER_COSTS[this.boosterLevel] || Infinity) : Infinity;
      const magnetCost = this.magnetLevel < MAX_MAGNET_LEVEL ? (MAGNET_COSTS[this.magnetLevel] || Infinity) : Infinity;

      const minCost = Math.min(duckCost, shieldCost, deflectorCost, boosterCost, magnetCost);
      if (minCost < Infinity && this.bankPoints >= minCost) {
        this.hasSeenUpgradePrompt = true;
        safeSet('disc_run_afford_upgrade_prompt_shown', 'true');
        if (this.upgradeAvailableModal) {
          this.upgradeAvailableModal.classList.remove('hidden');
          if (window.soundEngine) window.soundEngine.playUpgradeSound();
        }
      }
    }

    openWorkshopFromPrompt() {
      if (this.upgradeAvailableModal) this.upgradeAvailableModal.classList.add('hidden');

      // If on mobile start screen, switch to Workshop tab
      if (this.state === STATE.START && this.startTabWorkshop) {
        this.startTabWorkshop.click();
      } else if (this.state === STATE.GAME_OVER && this.gameoverTabWorkshop) {
        this.gameoverTabWorkshop.click();
      }

      const shopPanel = document.querySelector('.workshop-panel');
      if (shopPanel) {
        shopPanel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }

    // --- Post-Run Second Chance / Rewarded Ad Option Handlers ---

    handleAdRevive() {
      if (!this.canReviveThisRun || this.state !== STATE.GAME_OVER) return;

      this.canReviveThisRun = false;
      this.state = STATE.PLAYING;
      this.isPaused = false;

      if (this.postRunModal) this.postRunModal.classList.add('hidden');
      if (this.gameOverScreen) this.gameOverScreen.classList.add('hidden');
      if (this.hud) this.hud.classList.remove('hidden');
      if (this.controlsHint) this.controlsHint.classList.remove('hidden');

      // Clear crash debris
      this.clearDebris();

      // Grant brief invulnerability & emergency shield
      this.invulnerableTimer = 2.5;
      if (this.currentShields <= 0) {
        this.currentShields = 1;
      }

      // Clear any hazardous blocks/bars directly in front of the player
      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];
        obs.mesh.getWorldPosition(_tempWorldPos);
        if (_tempWorldPos.x > -4.0 && _tempWorldPos.x < 4.0 && _tempWorldPos.z > 3.0) {
          this.obstaclesContainer.remove(obs.mesh);
          if (obs.mesh.geometry) obs.mesh.geometry.dispose();
          this.obstacles.splice(i, 1);
        }
      }

      this.playerY = 0;
      this.playerVelocityY = 0;
      this.squashScaleX = 1.0;
      this.squashScaleZ = 1.0;
      this.duckScaleY = 1.0;
      this.isDucking = false;

      if (window.soundEngine) {
        window.soundEngine.playUpgradeSound();
        window.soundEngine.startBgm();
      }

      this.cameraShakeIntensity = 0.5;
      this.showDuckBonusToast('❤️ REVIVED! INVULNERABLE (2.5s)', true);
      this.updateHUD();
      if (this.orbitMultiplierContainer) this.orbitMultiplierContainer.classList.remove('hidden');
      this.updateOrbitMultiplierUI();
    }

    handleAdDoublePoints() {
      if (this.pointsDoubledThisLoss || this.state !== STATE.GAME_OVER) return;

      this.pointsDoubledThisLoss = true;
      if (this.postrunDoubleBtn) this.postrunDoubleBtn.disabled = true;

      // 2X points ONLY applies to this specific run's points
      const bonusPoints = this.lastEarnedPoints;
      this.bankPoints += bonusPoints;
      this.careerPoints += bonusPoints;
      safeSet('disc_run_bank_points', this.bankPoints);
      safeSet('disc_run_career_points', this.careerPoints);

      if (this.earnedPointsDisplay) {
        this.earnedPointsDisplay.textContent = '+' + (this.lastEarnedPoints * 2).toLocaleString() + ' PTS (2X BONUS)';
      }

      this.checkAchievements();
      this.checkStageUnlockCelebration();
      this.updateUpgradeShopUI();

      if (window.soundEngine) window.soundEngine.playScoreChime();
      this.showDuckBonusToast(`🎉 +${bonusPoints.toLocaleString()} BONUS PTS (2X RUN REWARD)!`, true);

      // Close post-run popup and proceed to Main Menu / Workshop screen
      if (this.orbitMultiplierContainer) this.orbitMultiplierContainer.classList.add('hidden');
      if (this.postRunModal) this.postRunModal.classList.add('hidden');
      if (this.gameOverScreen) this.gameOverScreen.classList.remove('hidden');
      this.checkAffordableUpgradePrompt();
    }

    handlePostRunSkip() {
      if (this.state !== STATE.GAME_OVER) return;
      // Close post-run popup and proceed to Main Menu / Workshop screen with standard run points
      if (this.orbitMultiplierContainer) this.orbitMultiplierContainer.classList.add('hidden');
      if (this.postRunModal) this.postRunModal.classList.add('hidden');
      if (this.gameOverScreen) this.gameOverScreen.classList.remove('hidden');
      this.checkAffordableUpgradePrompt();
    }

    triggerGameOver(reason) {
      if (this.state === STATE.GAME_OVER) return;
      this.setDucking(false);
      this.state = STATE.GAME_OVER;
      this.isPaused = false;
      this.canRestart = false;

      if (this.restartBtn) {
        this.restartBtn.classList.add('restart-locked');
      }

      if (this.pauseScreen) this.pauseScreen.classList.add('hidden');
      if (this.touchZonesContainer) this.touchZonesContainer.classList.add('hidden');
      if (this.controlsHint) this.controlsHint.classList.add('hidden');

      if (window.soundEngine) {
        window.soundEngine.stopBgm();
        window.soundEngine.playCrashSound();
      }

      this.cameraShakeIntensity = 1.5;
      this.spawnCrashExplosion();

      // Economy & Lifetime Stats Persistence for this run
      const earned = Math.floor(this.score);
      this.lastEarnedPoints = earned;
      this.bankPoints += earned;
      this.careerPoints += earned;
      safeSet('disc_run_bank_points', this.bankPoints);
      safeSet('disc_run_career_points', this.careerPoints);

      this.totalRotations += this.rotationsCleared;
      safeSet('disc_run_total_rotations', this.totalRotations);

      if (this.rotationsCleared > this.bestRotations) {
        this.bestRotations = this.rotationsCleared;
        safeSet('disc_run_best_rotations', this.bestRotations);
      }

      if (this.score > this.highScore) {
        this.highScore = Math.floor(this.score);
        safeSet('disc_run_highscore', this.highScore);
      }

      safeSet('disc_run_total_time_played', this.totalTimePlayed);

      // Game Over Screen Values
      if (this.deathReasonEl) this.deathReasonEl.textContent = reason;
      if (this.finalScoreEl) this.finalScoreEl.textContent = Math.floor(this.score);
      if (this.gameOverBestScoreEl) this.gameOverBestScoreEl.textContent = this.highScore;
      if (this.earnedPointsDisplay) this.earnedPointsDisplay.textContent = '+' + earned.toLocaleString() + ' PTS';

      // Populate Post-Run Second Chance / Ad Option Screen
      if (this.postrunDeathReason) this.postrunDeathReason.textContent = reason;
      if (this.postrunRunScore) this.postrunRunScore.textContent = '+' + earned.toLocaleString() + ' PTS';
      if (this.postrunRunRotations) this.postrunRunRotations.textContent = this.rotationsCleared.toFixed(1) + ' ROT';
      if (this.postrunRunStreak) {
        const streakVal = this.perfectDuckStreak > 0 ? this.perfectDuckStreak : this.bestPerfectDuckStreak;
        this.postrunRunStreak.textContent = streakVal + 'x';
      }

      // Update Revive Option (1 UP / USED)
      if (this.postrunReviveBtn) this.postrunReviveBtn.disabled = !this.canReviveThisRun;
      if (this.postrunReviveBadge) this.postrunReviveBadge.textContent = this.canReviveThisRun ? '1 UP' : 'USED';

      // Update 2X Points Option (Indicates exact points to be gained)
      const bonusPoints = earned;
      const totalEarnedWithBonus = earned * 2;
      if (this.postrunDoubleBadge) this.postrunDoubleBadge.textContent = '+' + bonusPoints.toLocaleString() + ' PTS BONUS';
      if (this.postrunDoubleDesc) {
        this.postrunDoubleDesc.textContent = `🎬 Watch Ad • Claim +${bonusPoints.toLocaleString()} PTS Bonus (Total: ${totalEarnedWithBonus.toLocaleString()} PTS)`;
      }
      if (this.postrunDoubleBtn) this.postrunDoubleBtn.disabled = false;

      // Update Skip Option
      if (this.postrunSkipDesc) {
        this.postrunSkipDesc.textContent = `Bank standard +${earned.toLocaleString()} PTS & proceed to Workshop`;
      }

      this.checkAchievements();
      this.checkStageUnlockCelebration();
      this.updateUpgradeShopUI();
      this.updateStageSelectorUI();

      // Show Post-Run Second Chance / Ad Option Modal first (before main menu / hub)
      setTimeout(() => {
        if (this.state === STATE.GAME_OVER && this.postRunModal) {
          this.postRunModal.classList.remove('hidden');
        }
      }, 350);

      setTimeout(() => {
        this.canRestart = true;
        if (this.restartBtn) {
          this.restartBtn.classList.remove('restart-locked');
        }
      }, 1000);
    }

    // --- Player Actions & True Perfect Duck Detection ---

    shiftLane(direction) {
      if (this.state !== STATE.PLAYING || this.isPaused) return;

      const newLane = this.playerLane + direction;
      if (newLane >= 0 && newLane < this.laneCount) {
        if (this.collapsedLanes && this.collapsedLanes.has(newLane)) {
          if (window.soundEngine) window.soundEngine.playExhaustSound();
          this.cameraShakeIntensity = 0.12;
          this.showDuckBonusToast('🚫 LANE COLLAPSED / BLOCKED', false);
          return;
        }

        this.playerLane = newLane;
        this.targetRadius = this.lanes[this.playerLane];
        if (window.soundEngine) window.soundEngine.playLaneSwitchSound(direction);
        this.playerMesh.rotation.z = -direction * 0.22;
      }
    }

    setDucking(isDuck) {
      if (!isDuck) {
        this.isDucking = false;
        this.targetDuckScaleY = 1.0;
        this.squashScaleX = 1.0;
        this.squashScaleZ = 1.0;
        this.duckScaleY = 1.0;
        if (this.playerMesh) this.playerMesh.scale.set(1.0, 1.0, 1.0);
        if (this.duckIndicator) this.duckIndicator.classList.add('hidden');
        if (this.state === STATE.PLAYING && window.soundEngine && !this.isPaused) {
          window.soundEngine.playUnduckSound();
        }
        return;
      }

      if (this.isPaused || this.state !== STATE.PLAYING) return;

      if (this.isDuckExhausted || this.currentDuckTime <= 0.02) {
        if (!this.isDucking && this.state === STATE.PLAYING && window.soundEngine) {
          window.soundEngine.playExhaustSound();
        }
        return;
      }

      if (this.isDucking) return;
      this.isDucking = true;

      // Tag approaching bars with the exact position when duck key was pressed
      if (this.state === STATE.PLAYING) {
        for (let i = 0; i < this.obstacles.length; i++) {
          const obs = this.obstacles[i];
          if (obs.type === 'BAR' && !obs.passed) {
            obs.mesh.getWorldPosition(_tempWorldPos);
            const worldX = _tempWorldPos.x;
            const worldZ = _tempWorldPos.z;
            if (worldZ > 2.8 && worldX >= -1.0 && worldX <= 5.0) {
              obs.duckInitiatedAtX = worldX;
            }
          }
        }
      }

      this.targetDuckScaleY = DUCKING_HEIGHT / STANDING_HEIGHT;
      this.squashScaleX = 1.35;
      this.squashScaleZ = 1.35;
      if (this.duckIndicator) this.duckIndicator.classList.remove('hidden');
      if (this.state === STATE.PLAYING && window.soundEngine) {
        window.soundEngine.playDuckSound();
      }
    }

    // --- Powerup Activations ---

    activatePowerup(type, duration) {
      const extraSec = BOOSTER_BONUS_SEC[this.boosterLevel] || 0;
      const totalDuration = duration + extraSec;

      this.activePowerup = type;
      this.powerupTimer = totalDuration;
      this.powerupMaxDuration = totalDuration;

      if (type === 'MULTIPLIER') {
        this.scoreMultiplier = 2;
        if (this.hudMultiplierTag) this.hudMultiplierTag.classList.remove('hidden');
        if (this.activePowerupBar) {
          this.activePowerupBar.className = '';
          this.activePowerupIcon.textContent = '⭐';
          this.activePowerupName.textContent = '2X POINTS';
          this.activePowerupBar.classList.remove('hidden');
        }
      } else if (type === 'INVINCIBLE') {
        this.scoreMultiplier = 1;
        if (this.hudMultiplierTag) this.hudMultiplierTag.classList.add('hidden');
        if (this.activePowerupBar) {
          this.activePowerupBar.className = 'invincible-theme';
          this.activePowerupIcon.textContent = '⚡';
          this.activePowerupName.textContent = 'INVINCIBLE';
          this.activePowerupBar.classList.remove('hidden');
        }
      }
    }

    // --- Floating Text Billboard Sprites for Collectibles ---

    createFloatingTextSprite(text, colorHex) {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 64;
      const ctx = canvas.getContext('2d');

      // Rounded badge pill background
      ctx.fillStyle = 'rgba(8, 12, 28, 0.88)';
      ctx.beginPath();
      ctx.roundRect(8, 6, 240, 52, 14);
      ctx.fill();

      // Border with glowing neon accent
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = colorHex;
      ctx.stroke();

      // Text label
      ctx.font = '900 24px "Rajdhani", "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(text, 128, 32);

      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(3.4, 0.85, 1.0);
      sprite.position.y = 1.35;
      return sprite;
    }

    // --- Obstacle & Unique Hazard Spawner ---

    clearObstacles() {
      while (this.obstaclesContainer.children.length > 0) {
        const obj = this.obstaclesContainer.children[0];
        this.obstaclesContainer.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      }
      this.obstacles = [];
    }

    spawnObstacleWave(angleOnDisc) {
      const patterns = this.currentStage.patterns;
      let choice = patterns[Math.floor(Math.random() * patterns.length)];

      if (this.rotationsCleared < 1.0) {
        choice = Math.random() < 0.5 ? 'single_block' : 'overhead_bar';
      }

      if (choice === 'void_portal_hazard') {
        const activePortalCount = this.obstacles.filter(o => o.type === 'HAZARD_VOID_PAIR').length;
        if (activePortalCount >= 2 || Math.random() < 0.6) {
          choice = 'single_block';
        }
      }

      switch (choice) {
        case 'single_block': {
          const lane = Math.floor(Math.random() * this.laneCount);
          const safeBlocks = this.filterSafeObstacleLanes([lane], angleOnDisc);
          safeBlocks.forEach(l => this.createBlockObstacle(l, angleOnDisc));
          break;
        }
        case 'double_block': {
          const lane1 = Math.floor(Math.random() * this.laneCount);
          let lane2 = (lane1 + 2) % this.laneCount;
          const safeBlocks = this.filterSafeObstacleLanes([lane1, lane2], angleOnDisc);
          safeBlocks.forEach(l => this.createBlockObstacle(l, angleOnDisc));
          break;
        }
        case 'wide_gap_wall': {
          const proposed = [];
          for (let i = 0; i < this.laneCount; i++) {
            proposed.push(i);
          }
          // Filter guarantees at least 2 open lanes in EVERY partition!
          const safeBlocks = this.filterSafeObstacleLanes(proposed, angleOnDisc);
          safeBlocks.forEach(l => this.createBlockObstacle(l, angleOnDisc));
          break;
        }
        case 'overhead_bar': {
          const spanAll = Math.random() < 0.35;
          if (spanAll) {
            this.createOverheadBar(0, this.laneCount - 1, angleOnDisc);
          } else {
            const startLane = Math.floor(Math.random() * (this.laneCount - 1));
            const endLane = Math.min(this.laneCount - 1, startLane + 1);
            this.createOverheadBar(startLane, endLane, angleOnDisc);
          }
          break;
        }
        case 'bar_with_block': {
          const barStart = 0;
          const barEnd = Math.min(this.laneCount - 3, 1);
          const blockLane = this.laneCount - 1;
          this.createOverheadBar(barStart, barEnd, angleOnDisc);
          const safeBlocks = this.filterSafeObstacleLanes([blockLane], angleOnDisc);
          safeBlocks.forEach(l => this.createBlockObstacle(l, angleOnDisc));
          break;
        }
        case 'fireball_hazard': {
          const lane = Math.floor(Math.random() * this.laneCount);
          this.createFireballHazard(lane, angleOnDisc);
          break;
        }
        case 'toxic_puddle_hazard': {
          const lane = Math.floor(Math.random() * this.laneCount);
          this.createToxicPuddleHazard(lane, angleOnDisc);
          break;
        }
        case 'void_portal_hazard': {
          const lane1 = Math.floor(Math.random() * this.laneCount);
          let lane2 = (lane1 + 2) % this.laneCount;
          this.createPairedVoidPortals(lane1, lane2, angleOnDisc);
          break;
        }
        case 'ice_spike_hazard': {
          const lane = Math.floor(Math.random() * this.laneCount);
          this.createIceSpikeHazard(lane, angleOnDisc);
          break;
        }
        case 'plasma_sweeper_hazard': {
          const lane = Math.floor(Math.random() * (this.laneCount - 2)) + 1;
          this.createPlasmaSweeperHazard(lane, angleOnDisc);
          break;
        }
        case 'lane_shifter_hazard': {
          const lane = Math.floor(Math.random() * this.laneCount);
          this.createLaneShifterHazard(lane, angleOnDisc);
          break;
        }
        case 'triple_stagger':
        case 'staggered_gate': {
          const skip = Math.floor(Math.random() * this.laneCount);
          const proposed = [];
          for (let i = 0; i < this.laneCount; i++) {
            if (i !== skip && i !== (skip + 1) % this.laneCount) {
              proposed.push(i);
            }
          }
          const safeBlocks = this.filterSafeObstacleLanes(proposed, angleOnDisc);
          safeBlocks.forEach(l => this.createBlockObstacle(l, angleOnDisc));
          break;
        }
        case 'void_double_bar': {
          this.createOverheadBar(0, 1, angleOnDisc);
          this.createOverheadBar(3, this.laneCount - 1, angleOnDisc);
          break;
        }
        default:
          this.createBlockObstacle(Math.floor(Math.random() * this.laneCount), angleOnDisc);
          break;
      }
    }

    createBlockObstacle(laneIndex, angle) {
      // Avoid spawning on top of an existing collectible
      const testRadius = this.lanes[laneIndex];
      for (let c = 0; c < this.collectibles.length; c++) {
        const col = this.collectibles[c];
        const angleDiff = Math.abs(col.angle - angle);
        const directDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);
        if (directDiff < 0.85 && Math.abs(col.radius - testRadius) < 1.6) {
          return; // Skip spawning block inside collectible!
        }
      }

      const radius = testRadius;
      const width = 1.35;
      const height = 1.8;
      const depth = 1.2;
      const theme = this.currentStage.theme;

      const geometry = new THREE.BoxGeometry(width, height, depth);
      const material = new THREE.MeshStandardMaterial({
        color: theme.blockColor,
        emissive: theme.blockEmissive,
        emissiveIntensity: 0.85,
        metalness: 0.6,
        roughness: 0.25
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      mesh.position.set(
        Math.cos(angle) * radius,
        height / 2,
        Math.sin(angle) * radius
      );
      mesh.rotation.y = -angle + Math.PI / 2;

      const edgeGeo = new THREE.EdgesGeometry(geometry);
      const edgeMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
      const edgeMesh = new THREE.LineSegments(edgeGeo, edgeMat);
      mesh.add(edgeMesh);

      this.obstaclesContainer.add(mesh);

      this.obstacles.push({
        type: 'BLOCK',
        mesh: mesh,
        lane: laneIndex,
        radius: radius,
        angle: angle,
        passed: false
      });
    }

    createOverheadBar(startLane, endLane, angle) {
      const rStart = this.lanes[startLane] - 0.9;
      const rEnd = this.lanes[endLane] + 0.9;
      const barLength = Math.abs(rEnd - rStart);
      const barMidR = (rStart + rEnd) / 2;
      const barHeight = 0.45;
      const barDepth = 0.75;
      const elevationY = BAR_CLEARANCE_HEIGHT + barHeight / 2;
      const theme = this.currentStage.theme;

      const group = new THREE.Group();

      const beamGeo = new THREE.BoxGeometry(barLength, barHeight, barDepth);
      const beamMat = new THREE.MeshStandardMaterial({
        color: theme.barColor,
        emissive: theme.barEmissive,
        emissiveIntensity: 0.9,
        metalness: 0.8,
        roughness: 0.2
      });
      const beamMesh = new THREE.Mesh(beamGeo, beamMat);
      beamMesh.position.y = elevationY;
      beamMesh.castShadow = true;
      group.add(beamMesh);

      const stripeGeo = new THREE.BoxGeometry(barLength * 0.96, barHeight * 0.22, barDepth * 1.02);
      const stripeMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
      const stripeMesh = new THREE.Mesh(stripeGeo, stripeMat);
      stripeMesh.position.y = elevationY;
      group.add(stripeMesh);

      const postRadius = 0.2;
      const postGeo = new THREE.CylinderGeometry(postRadius, postRadius, elevationY + barHeight / 2, 16);
      const postMat = new THREE.MeshStandardMaterial({
        color: 0x223355,
        metalness: 0.9,
        roughness: 0.3
      });

      const post1 = new THREE.Mesh(postGeo, postMat);
      post1.position.set(-barLength / 2, (elevationY + barHeight / 2) / 2, 0);
      post1.castShadow = true;
      group.add(post1);

      const post2 = new THREE.Mesh(postGeo, postMat);
      post2.position.set(barLength / 2, (elevationY + barHeight / 2) / 2, 0);
      post2.castShadow = true;
      group.add(post2);

      group.position.set(
        Math.cos(angle) * barMidR,
        0,
        Math.sin(angle) * barMidR
      );
      group.rotation.y = -angle;

      this.obstaclesContainer.add(group);

      this.obstacles.push({
        type: 'BAR',
        mesh: group,
        startLane: startLane,
        endLane: endLane,
        rMin: rStart,
        rMax: rEnd,
        barMidR: barMidR,
        angle: angle,
        passed: false,
        duckInitiatedAtX: null
      });
    }

    // --- Interactive Stage Hazards ---

    createFireballHazard(laneIndex, angle) {
      const radius = this.lanes[laneIndex];
      const group = new THREE.Group();

      const ballGeo = new THREE.SphereGeometry(0.85, 16, 16);
      const ballMat = new THREE.MeshStandardMaterial({
        color: 0xff3300,
        emissive: 0xff7700,
        emissiveIntensity: 1.8,
        metalness: 0.2
      });
      const ballMesh = new THREE.Mesh(ballGeo, ballMat);
      ballMesh.position.y = 0.9;
      group.add(ballMesh);

      const lavaRingGeo = new THREE.RingGeometry(0.2, 1.3, 24);
      const lavaRingMat = new THREE.MeshBasicMaterial({
        color: 0xff3300,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
      });
      const lavaRing = new THREE.Mesh(lavaRingGeo, lavaRingMat);
      lavaRing.rotation.x = Math.PI / 2;
      lavaRing.position.y = 0.04;
      group.add(lavaRing);

      group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      this.obstaclesContainer.add(group);

      if (window.soundEngine) window.soundEngine.playFireballSound();

      this.obstacles.push({
        type: 'HAZARD_FIREBALL',
        mesh: group,
        lane: laneIndex,
        radius: radius,
        angle: angle,
        lifeTimer: 9.0,
        passed: false
      });
    }

    createToxicPuddleHazard(laneIndex, angle) {
      const radius = this.lanes[laneIndex];
      const group = new THREE.Group();

      const puddleGeo = new THREE.RingGeometry(0.1, 1.45, 24);
      const puddleMat = new THREE.MeshBasicMaterial({
        color: 0x00ff44,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const puddleMesh = new THREE.Mesh(puddleGeo, puddleMat);
      puddleMesh.rotation.x = Math.PI / 2;
      puddleMesh.position.y = 0.03;
      group.add(puddleMesh);

      for (let i = 0; i < 3; i++) {
        const bubbleGeo = new THREE.SphereGeometry(0.25, 12, 12);
        const bubbleMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });
        const bubble = new THREE.Mesh(bubbleGeo, bubbleMat);
        bubble.position.set((Math.random() - 0.5) * 1.2, 0.2, (Math.random() - 0.5) * 1.2);
        group.add(bubble);
      }

      group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      this.obstaclesContainer.add(group);

      this.obstacles.push({
        type: 'HAZARD_SLIME',
        mesh: group,
        radius: radius,
        angle: angle,
        passed: false
      });
    }

    createPairedVoidPortals(lane1, lane2, angle) {
      const pairId = 'portal_' + Math.random().toString(36).substr(2, 5);
      const angle2 = (angle + 0.35) % (Math.PI * 2);

      const makePortalMesh = (radius, ang, colorHex) => {
        const group = new THREE.Group();
        const diskGeo = new THREE.RingGeometry(0.1, 1.4, 32);
        const diskMat = new THREE.MeshBasicMaterial({
          color: colorHex,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        });
        const diskMesh = new THREE.Mesh(diskGeo, diskMat);
        diskMesh.rotation.x = Math.PI / 2;
        diskMesh.position.y = 0.04;
        group.add(diskMesh);

        const vortexGeo = new THREE.TorusGeometry(0.9, 0.2, 16, 32);
        const vortexMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
        const vortexMesh = new THREE.Mesh(vortexGeo, vortexMat);
        vortexMesh.position.y = 0.6;
        group.add(vortexMesh);

        group.position.set(Math.cos(ang) * radius, 0, Math.sin(ang) * radius);
        this.obstaclesContainer.add(group);
        return { group, vortexMesh };
      };

      const p1 = makePortalMesh(this.lanes[lane1], angle, 0xaa00ff);
      const p2 = makePortalMesh(this.lanes[lane2], angle2, 0x00f0ff);

      this.obstacles.push({
        type: 'HAZARD_VOID_PAIR',
        pairId: pairId,
        mesh: p1.group,
        vortexMesh: p1.vortexMesh,
        lane: lane1,
        targetLane: lane2,
        targetRadius: this.lanes[lane2],
        radius: this.lanes[lane1],
        angle: angle,
        passed: false
      });

      this.obstacles.push({
        type: 'HAZARD_VOID_PAIR',
        pairId: pairId,
        mesh: p2.group,
        vortexMesh: p2.vortexMesh,
        lane: lane2,
        targetLane: lane1,
        targetRadius: this.lanes[lane1],
        radius: this.lanes[lane2],
        angle: angle2,
        passed: false
      });
    }

    createIceSpikeHazard(laneIndex, angle) {
      const radius = this.lanes[laneIndex];
      const group = new THREE.Group();

      for (let i = 0; i < 3; i++) {
        const spikeGeo = new THREE.ConeGeometry(0.38, 2.0, 6);
        const spikeMat = new THREE.MeshStandardMaterial({
          color: 0x00f5d4,
          emissive: 0x00b4d8,
          emissiveIntensity: 0.8,
          roughness: 0.1,
          metalness: 0.3
        });
        const spike = new THREE.Mesh(spikeGeo, spikeMat);
        spike.position.set((i - 1) * 0.45, 1.0, (Math.random() - 0.5) * 0.3);
        spike.castShadow = true;
        group.add(spike);
      }

      group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      this.obstaclesContainer.add(group);

      this.obstacles.push({
        type: 'HAZARD_ICE_SLOW',
        mesh: group,
        radius: radius,
        angle: angle,
        passed: false
      });
    }

    createPlasmaSweeperHazard(laneIndex, angle) {
      const radius = this.lanes[laneIndex];
      const group = new THREE.Group();

      const bladeGeo = new THREE.BoxGeometry(3.5, 0.4, 0.4);
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0xff1100,
        emissive: 0xffea00,
        emissiveIntensity: 1.6
      });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.y = 0.9;
      group.add(blade);

      group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      this.obstaclesContainer.add(group);

      this.obstacles.push({
        type: 'HAZARD_PLASMA',
        mesh: group,
        bladeMesh: blade,
        radius: radius,
        angle: angle,
        passed: false
      });
    }

    createLaneShifterHazard(startLane, angle) {
      const group = new THREE.Group();

      const droneGeo = new THREE.BoxGeometry(1.6, 0.9, 1.4);
      const droneMat = new THREE.MeshStandardMaterial({
        color: 0xff00aa,
        emissive: 0xff0055,
        emissiveIntensity: 1.5,
        metalness: 0.7,
        roughness: 0.2
      });
      const droneMesh = new THREE.Mesh(droneGeo, droneMat);
      droneMesh.position.y = 0.6;
      group.add(droneMesh);

      const lightGeo = new THREE.SphereGeometry(0.35, 12, 12);
      const lightMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
      const light = new THREE.Mesh(lightGeo, lightMat);
      light.position.set(0, 0.6, 0.8);
      group.add(light);

      const radius = this.lanes[startLane];
      group.position.set(Math.cos(angle) * radius, 0, Math.sin(angle) * radius);
      this.obstaclesContainer.add(group);

      this.obstacles.push({
        type: 'HAZARD_LANE_SHIFTER',
        mesh: group,
        laneFloat: startLane,
        laneDir: Math.random() < 0.5 ? 1 : -1,
        laneSpeed: 2.2,
        radius: radius,
        angle: angle,
        passed: false
      });
    }

    // --- Collectibles & Powerups Spawner (Guaranteed Two-Way Collision Clearance + Floating Text) ---

    clearCollectibles() {
      while (this.collectiblesContainer.children.length > 0) {
        const obj = this.collectiblesContainer.children[0];
        this.collectiblesContainer.remove(obj);
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) {
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      }
      this.collectibles = [];
    }

    spawnCollectibleWave(angleOnDisc) {
      let chosenLane = -1;
      let chosenAngle = angleOnDisc;

      const testLanes = [...Array(this.laneCount).keys()].sort(() => Math.random() - 0.5);

      for (let testAngleOffset = 0; testAngleOffset <= 1.4; testAngleOffset += 0.35) {
        const candidateAngle = (angleOnDisc + testAngleOffset) % (Math.PI * 2);

        for (let laneIdx of testLanes) {
          if (this.collapsedLanes && this.collapsedLanes.has(laneIdx)) continue;

          const testRadius = this.lanes[laneIdx];
          let isSafe = true;

          for (let i = 0; i < this.obstacles.length; i++) {
            const obs = this.obstacles[i];
            const angleDiff = Math.abs(obs.angle - candidateAngle);
            const directDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);

            if (directDiff < 0.90) {
              if (obs.type === 'BLOCK' && Math.abs(obs.radius - testRadius) < 1.8) {
                isSafe = false; break;
              }
              if (obs.type === 'BAR' && testRadius >= (obs.rMin - 0.8) && testRadius <= (obs.rMax + 0.8)) {
                isSafe = false; break;
              }
              if (obs.type.startsWith('HAZARD_') && Math.abs(obs.radius - testRadius) < 2.2) {
                isSafe = false; break;
              }
            }
          }

          if (isSafe) {
            chosenLane = laneIdx;
            chosenAngle = candidateAngle;
            break;
          }
        }
        if (chosenLane !== -1) break;
      }

      if (chosenLane === -1) {
        chosenLane = Math.floor(Math.random() * this.laneCount);
        chosenAngle = (angleOnDisc + 0.9) % (Math.PI * 2);
      }

      const radius = this.lanes[chosenLane];

      const rand = Math.random();
      let type = 'GEM';
      if (rand < 0.30) {
        type = 'INVINCIBLE';
      } else if (rand < 0.60) {
        type = 'MULTIPLIER';
      }

      const group = new THREE.Group();

      if (type === 'GEM') {
        const geo = new THREE.OctahedronGeometry(0.75, 0);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xff00bb,
          emissive: 0xff00cc,
          emissiveIntensity: 1.5,
          metalness: 0.8,
          roughness: 0.1
        });
        const mesh = new THREE.Mesh(geo, mat);
        group.add(mesh);

        const ringGeo = new THREE.RingGeometry(0.2, 1.0, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xff00cc,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -1.2;
        group.add(ring);

        const gemPts = ((this.selectedStageIndex || 0) + 1) * 25;
        const textSprite = this.createFloatingTextSprite(`+${gemPts} PTS`, '#ff00cc');
        group.add(textSprite);

      } else if (type === 'MULTIPLIER') {
        const geo = new THREE.IcosahedronGeometry(0.8, 0);
        const mat = new THREE.MeshStandardMaterial({
          color: 0xffea00,
          emissive: 0xffaa00,
          emissiveIntensity: 1.6,
          metalness: 0.9,
          roughness: 0.1
        });
        const mesh = new THREE.Mesh(geo, mat);
        group.add(mesh);

        const torusGeo = new THREE.TorusGeometry(1.1, 0.14, 12, 32);
        const torusMat = new THREE.MeshBasicMaterial({ color: 0xffea00 });
        const torus = new THREE.Mesh(torusGeo, torusMat);
        torus.rotation.x = Math.PI / 3;
        group.add(torus);

        const ringGeo = new THREE.RingGeometry(0.3, 1.1, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0xffea00,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -1.2;
        group.add(ring);

        const textSprite = this.createFloatingTextSprite('2X POINTS', '#ffea00');
        group.add(textSprite);

      } else if (type === 'INVINCIBLE') {
        const geo = new THREE.TorusGeometry(0.7, 0.28, 16, 32);
        const mat = new THREE.MeshStandardMaterial({
          color: 0x00f0ff,
          emissive: 0x00ffff,
          emissiveIntensity: 1.6,
          metalness: 0.9,
          roughness: 0.1
        });
        const mesh = new THREE.Mesh(geo, mat);
        group.add(mesh);

        const sphereGeo = new THREE.SphereGeometry(0.4, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const sphere = new THREE.Mesh(sphereGeo, sphereMat);
        group.add(sphere);

        const ringGeo = new THREE.RingGeometry(0.3, 1.1, 24);
        const ringMat = new THREE.MeshBasicMaterial({
          color: 0x00f0ff,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.rotation.x = Math.PI / 2;
        ring.position.y = -1.2;
        group.add(ring);

        const textSprite = this.createFloatingTextSprite('INVINCIBLE', '#00f0ff');
        group.add(textSprite);
      }

      group.position.set(
        Math.cos(chosenAngle) * radius,
        1.3,
        Math.sin(chosenAngle) * radius
      );
      this.collectiblesContainer.add(group);

      this.collectibles.push({
        type: type,
        mesh: group,
        lane: chosenLane,
        radius: radius,
        angle: chosenAngle,
        baseY: 1.3,
        passed: false,
        collected: false
      });
    }

    // --- Particle Juice & Effects ---

    spawnLandingImpact() {
      const ringGeo = new THREE.RingGeometry(0.5, 1.2, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: this.currentStage.theme.rimColor,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.9
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, 0.05, this.currentRadius);
      this.scene.add(ring);

      this.particles.push({
        mesh: ring,
        type: 'ring',
        life: 0.4,
        maxLife: 0.4,
        scaleSpeed: 16.0
      });
    }

    spawnPickupBurst(pos, colorHex) {
      const count = 18;
      for (let i = 0; i < count; i++) {
        const size = Math.random() * 0.3 + 0.15;
        const geo = new THREE.BoxGeometry(size, size, size);
        const mat = new THREE.MeshBasicMaterial({ color: colorHex });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(pos);
        this.scene.add(mesh);

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 9 + 4;
        this.particles.push({
          mesh: mesh,
          type: 'spark',
          vx: Math.cos(angle) * speed,
          vy: Math.random() * 7 + 3,
          vz: Math.sin(angle) * speed,
          life: 0.5,
          maxLife: 0.5
        });
      }
    }

    spawnCrashExplosion() {
      const count = 35;
      for (let i = 0; i < count; i++) {
        const size = Math.random() * 0.4 + 0.2;
        const geo = new THREE.BoxGeometry(size, size, size);
        const mat = new THREE.MeshStandardMaterial({
          color: Math.random() < 0.6 ? this.currentStage.theme.rimColor : this.currentStage.theme.blockColor,
          emissive: this.currentStage.theme.rimEmissive,
          emissiveIntensity: 0.8,
          metalness: 0.5
        });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(
          0 + (Math.random() - 0.5) * 1.5,
          this.playerY + (Math.random() - 0.5) * 1.5,
          this.currentRadius + (Math.random() - 0.5) * 1.5
        );
        mesh.castShadow = true;
        this.scene.add(mesh);

        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 14 + 5;
        this.debris.push({
          mesh: mesh,
          vx: Math.cos(angle) * speed,
          vy: Math.random() * 12 + 6,
          vz: Math.sin(angle) * speed,
          rotX: (Math.random() - 0.5) * 15,
          rotY: (Math.random() - 0.5) * 15,
          life: 2.5
        });
      }
    }

    clearDebris() {
      this.debris.forEach((d) => {
        this.scene.remove(d.mesh);
        d.mesh.geometry.dispose();
        d.mesh.material.dispose();
      });
      this.debris = [];
    }

    // --- Updates & Physics ---

    updatePlayerTransform() {
      this.playerGroup.position.set(0, this.playerY, this.currentRadius);
      this.playerShadow.position.set(0, 0.03, this.currentRadius);
      this.playerGlowLight.position.set(0, this.playerY + 1.5, this.currentRadius);

      this.playerMesh.scale.set(this.squashScaleX, this.duckScaleY, this.squashScaleZ);
      this.playerCore.scale.set(this.squashScaleX, this.duckScaleY, this.squashScaleZ);
      this.playerWireframe.scale.set(this.squashScaleX, this.duckScaleY, this.squashScaleZ);

      const currentHeight = STANDING_HEIGHT * this.duckScaleY;
      this.playerMesh.position.y = currentHeight / 2;
      this.playerCore.position.y = currentHeight / 2;
      this.playerWireframe.position.y = currentHeight / 2;

      if (this.shieldMesh) {
        if (this.currentShields > 0 || this.currentHazardShields > 0) {
          this.shieldMesh.visible = true;
          this.shieldMesh.rotation.y += 0.04;
          this.shieldMesh.rotation.x += 0.02;
        } else {
          this.shieldMesh.visible = false;
        }
      }

      if (this.invulnerableTimer > 0) {
        this.playerMesh.visible = Math.floor(Date.now() / 80) % 2 === 0;
      } else {
        this.playerMesh.visible = true;
      }

      if (this.activePowerup === 'INVINCIBLE') {
        const hue = (Date.now() % 1500) / 1500;
        this.playerMaterial.color.setHSL(hue, 1.0, 0.6);
        this.playerMaterial.emissive.setHSL(hue, 1.0, 0.5);
      } else if (this.slowTimer > 0) {
        this.playerMaterial.color.setHex(0x00f5d4);
        this.playerMaterial.emissive.setHex(0x0088aa);
      } else {
        this.playerMaterial.color.setHex(0x00ffff);
        this.playerMaterial.emissive.setHex(0x0088cc);
      }
    }

    getOrbitMultiplier() {
      const tier = Math.floor(this.rotationsCleared / 10);
      return Math.min(10, 1 + tier);
    }

    updateOrbitMultiplierUI() {
      const mult = this.getOrbitMultiplier();
      if (this.orbitMultBadge) this.orbitMultBadge.textContent = mult + 'X';
      if (this.orbitRevsText) this.orbitRevsText.textContent = this.rotationsCleared.toFixed(1) + ' REV';

      if (this.orbitMeterFill) {
        if (mult >= 10) {
          this.orbitMeterFill.style.height = '100%';
        } else {
          const tierPct = ((this.rotationsCleared % 10) / 10) * 100;
          this.orbitMeterFill.style.height = Math.max(0, Math.min(100, tierPct)) + '%';
        }
      }

      if (this.orbitNextTierText) {
        if (mult >= 10) {
          this.orbitNextTierText.textContent = 'MAX (10X)';
        } else {
          const nextTarget = mult * 10;
          this.orbitNextTierText.textContent = `Next: ${nextTarget.toFixed(0)}`;
        }
      }
    }

    updateHUD() {
      if (this.scoreDisplay) this.scoreDisplay.textContent = Math.floor(this.score);

      if (this.hudShieldsDisplay) {
        let shieldIcons = '';
        for (let s = 0; s < this.currentShields; s++) {
          shieldIcons += '<span class="shield-active-icon">🛡️</span>';
        }
        for (let h = 0; h < this.currentHazardShields; h++) {
          shieldIcons += '<span class="shield-active-icon">🧿</span>';
        }
        this.hudShieldsDisplay.innerHTML = shieldIcons;
      }
    }

    // --- Main Game Loop ---

    animate() {
      requestAnimationFrame(this.animate);

      const dt = Math.min(this.clock.getDelta(), 0.1);

      if (this.isPaused) {
        this.renderer.render(this.scene, this.camera);
        return;
      }

      if (this.bgParticles) {
        this.bgParticles.rotation.y += dt * 0.03;
      }

      if (this.state === STATE.START) {
        this.discGroup.rotation.y -= dt * 0.25;
        this.playerGroup.position.set(0, 20, this.lanes[this.playerLane]);
      } else if (this.state === STATE.DROPPING) {
        this.updateDroppingState(dt);
      } else if (this.state === STATE.PLAYING) {
        this.updatePlayingState(dt);
      } else if (this.state === STATE.GAME_OVER) {
        this.updateGameOverState(dt);
      }

      this.updateParticles(dt);
      this.updateDebris(dt);

      if (this.cameraShakeIntensity > 0.01) {
        this.camera.position.x = this.cameraBasePos.x + (Math.random() - 0.5) * this.cameraShakeIntensity;
        this.camera.position.y = this.cameraBasePos.y + (Math.random() - 0.5) * this.cameraShakeIntensity;
        this.camera.position.z = this.cameraBasePos.z + (Math.random() - 0.5) * this.cameraShakeIntensity;
        this.cameraShakeIntensity *= Math.pow(0.05, dt);
      } else {
        this.camera.position.copy(this.cameraBasePos);
      }
      this.camera.lookAt(this.cameraLookTarget);

      this.renderer.render(this.scene, this.camera);
    }

    updateDroppingState(dt) {
      const gravity = 65;
      this.playerVelocityY -= gravity * dt;
      this.playerY += this.playerVelocityY * dt;

      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVelocityY = 0;

        if (window.soundEngine) {
          window.soundEngine.playDropSound();
          window.soundEngine.startBgm();
        }
        this.spawnLandingImpact();
        this.cameraShakeIntensity = 0.8;

        this.squashScaleX = 1.6;
        this.squashScaleZ = 1.6;
        this.duckScaleY = 0.4;

        this.state = STATE.PLAYING;
      }

      this.updatePlayerTransform();
    }

    updatePlayingState(dt) {
      // 1. Difficulty & Speed Scaling
      this.speedMultiplier += dt * 0.022;
      const slowFactor = this.slowTimer > 0 ? 0.55 : 1.0;
      this.currentAngularSpeed = this.baseAngularSpeed * Math.min(2.8, this.speedMultiplier) * slowFactor;
      if (window.soundEngine) window.soundEngine.setSpeedMultiplier(this.speedMultiplier * slowFactor);

      // 2. Rotate Disc & Track Lifetime In-Game Time (Clockwise Rotation)
      const angleDelta = this.currentAngularSpeed * dt;
      this.discAngle += angleDelta;
      this.discGroup.rotation.y = -this.discAngle;
      this.rotationsCleared = this.discAngle / (Math.PI * 2);

      this.totalTimePlayed += dt;

      // Revolution Complete Milestone Award (Per-Stage Points + Orbit Multiplier)
      const currentFullRev = Math.floor(this.rotationsCleared);
      if (currentFullRev > this.lastAwardedRevolution) {
        const bonusYield = REV_BONUS_TIERS[this.revBonusLevel] || 0;
        const stageRevPts = (this.currentStage.revPoints || 15) + bonusYield;
        const revBonus = stageRevPts * this.getOrbitMultiplier() * this.scoreMultiplier;
        this.score += revBonus;
        this.lastAwardedRevolution = currentFullRev;
        this.showDuckBonusToast(`🌀 REV ${currentFullRev} (+${revBonus.toLocaleString()} PTS)!`, false);
        if (window.soundEngine) window.soundEngine.playScoreChime();
      }

      // Check for Orbit Multiplier Tier Increases (Every 10 Revs -> 2X, 3X, 4X ... 10X)
      const currentOrbitMult = this.getOrbitMultiplier();
      if (currentOrbitMult > this.lastOrbitMultiplier) {
        this.lastOrbitMultiplier = currentOrbitMult;
        if (window.soundEngine) {
          window.soundEngine.playUpgradeSound();
          window.soundEngine.playScoreChime();
        }
        this.cameraShakeIntensity = 0.6;
        this.showDuckBonusToast(`🚀 ORBIT SURGE: ${currentOrbitMult}X GLOBAL MULTIPLIER (REV ${currentFullRev})!`, true);
      }

      this.updateOrbitMultiplierUI();

      // 3. Timers: Active Powerup, Invulnerability & Glacier Chill
      if (this.invulnerableTimer > 0) this.invulnerableTimer -= dt;
      if (this.slowTimer > 0) this.slowTimer -= dt;

      if (this.activePowerup) {
        this.powerupTimer -= dt;
        if (this.activePowerupTimer) {
          this.activePowerupTimer.textContent = this.powerupTimer.toFixed(1) + 's';
        }

        if (this.powerupTimer <= 0) {
          this.activePowerup = null;
          this.scoreMultiplier = 1;
          if (this.activePowerupBar) this.activePowerupBar.classList.add('hidden');
          if (this.hudMultiplierTag) this.hudMultiplierTag.classList.add('hidden');
        }
      }

      // 4. Escalating Point Accumulation (Stage Difficulty Rate * Orbit Multiplier)
      const stageRate = this.currentStage.revRate || 1.0;
      this.score += dt * 0.8 * stageRate * this.speedMultiplier * this.scoreMultiplier * currentOrbitMult;
      this.updateHUD();

      // 5. Duck Timer & Stamina Mechanics
      if (this.isDucking) {
        this.currentDuckTime -= dt;
        if (this.currentDuckTime <= 0) {
          this.currentDuckTime = 0;
          this.isDuckExhausted = true;
          this.setDucking(false);
          if (window.soundEngine) window.soundEngine.playExhaustSound();
          this.cameraShakeIntensity = 0.4;
        }
      } else {
        this.currentDuckTime = Math.min(this.maxDuckDuration, this.currentDuckTime + dt * 0.7);
        if (this.currentDuckTime >= this.maxDuckDuration * 0.5) {
          this.isDuckExhausted = false;
        }
      }

      // Update Duck Gauge UI
      const duckPct = Math.max(0, Math.min(100, (this.currentDuckTime / this.maxDuckDuration) * 100));
      if (this.duckStaminaBar) {
        this.duckStaminaBar.style.width = duckPct + '%';
        this.duckStaminaBar.style.background = this.isDuckExhausted
          ? '#ff0055'
          : (duckPct < 30 ? 'linear-gradient(90deg, #ff0055, #ffaa00)' : 'linear-gradient(90deg, #ff0055, #00f0ff)');
      }
      if (this.duckStaminaText) this.duckStaminaText.textContent = this.currentDuckTime.toFixed(2) + 's';
      if (this.floatingDuckTime) this.floatingDuckTime.textContent = this.currentDuckTime.toFixed(2) + 's';
      if (this.floatingDuckTimerFill) this.floatingDuckTimerFill.style.width = duckPct + '%';
      if (this.touchDuckTimer) this.touchDuckTimer.textContent = this.currentDuckTime.toFixed(2) + 's';

      // 6. Stage 8: Update Collapsing Lanes
      this.updateCollapsingLanes(dt);

      // 7. Smooth Lane Switching & Ducking Lerps
      const laneLerpSpeed = this.slowTimer > 0 ? 10 : 18;
      this.currentRadius += (this.targetRadius - this.currentRadius) * (1 - Math.exp(-laneLerpSpeed * dt));
      this.duckScaleY += (this.targetDuckScaleY - this.duckScaleY) * (1 - Math.exp(-22 * dt));
      this.squashScaleX += ((this.isDucking ? 1.35 : 1.0) - this.squashScaleX) * (1 - Math.exp(-18 * dt));
      this.squashScaleZ += ((this.isDucking ? 1.35 : 1.0) - this.squashScaleZ) * (1 - Math.exp(-18 * dt));

      this.playerMesh.rotation.z *= Math.pow(0.01, dt);

      this.updatePlayerTransform();

      // 8. Spawning: Obstacles Ahead on Horizon (Clockwise Approach from Right)
      const spawnLeadAngle = Math.PI * 1.35;
      if (this.discAngle - this.lastSpawnAngle > this.nextSpawnAngleGap) {
        const raw = (Math.PI * 0.5 - spawnLeadAngle - this.discAngle) % (Math.PI * 2);
        const angleOnDisc = raw < 0 ? raw + Math.PI * 2 : raw;
        this.spawnObstacleWave(angleOnDisc);
        this.lastSpawnAngle = this.discAngle;
        this.nextSpawnAngleGap = Math.max(0.95, 1.45 - (this.speedMultiplier - 1.0) * 0.12);
      }

      // 9. Timed Collectible & Powerup Spawner
      this.collectibleTimer += dt;
      if (this.collectibleTimer >= this.nextCollectibleTime) {
        const rawCol = (Math.PI * 0.5 - spawnLeadAngle - 0.4 - this.discAngle) % (Math.PI * 2);
        const colAngleOnDisc = rawCol < 0 ? rawCol + Math.PI * 2 : rawCol;
        this.spawnCollectibleWave(colAngleOnDisc);
        this.collectibleTimer = 0;
        this.nextCollectibleTime = 8.0 + Math.random() * 2.0;
      }

      // 10. Collectibles & Magnet Logic
      _tempPlayerPos.set(0, this.playerY + 0.6, this.currentRadius);
      _tempLocalTarget.copy(_tempPlayerPos);
      this.collectiblesContainer.worldToLocal(_tempLocalTarget);
      const magnetRadius = MAGNET_RADII[this.magnetLevel] || 0;

      for (let i = this.collectibles.length - 1; i >= 0; i--) {
        const col = this.collectibles[i];
        col.mesh.getWorldPosition(_tempWorldPos);
        const worldX = _tempWorldPos.x;
        const worldZ = _tempWorldPos.z;

        col.mesh.rotation.y += dt * 3.0;

        const dist = _tempWorldPos.distanceTo(_tempPlayerPos);

        if (this.magnetLevel > 0 && dist < magnetRadius && !col.collected) {
          const pullSpeed = 7.5 * dt;
          col.mesh.position.x += (_tempLocalTarget.x - col.mesh.position.x) * pullSpeed;
          col.mesh.position.z += (_tempLocalTarget.z - col.mesh.position.z) * pullSpeed;
        }

        if (dist < 1.85 && !col.collected) {
          col.collected = true;

          if (col.type === 'GEM') {
            const stageGemBasePoints = ((this.selectedStageIndex || 0) + 1) * 25;
            const pts = stageGemBasePoints * this.scoreMultiplier;
            this.score += pts;
            this.bankPoints += stageGemBasePoints;
            this.totalGems++;
            safeSet('disc_run_total_gems', this.totalGems);

            if (window.soundEngine) window.soundEngine.playGemSound();
            this.spawnPickupBurst(_tempWorldPos, 0xff00bb);
            this.showDuckBonusToast(`+${pts} PTS!`, false);
          } else if (col.type === 'MULTIPLIER') {
            this.activatePowerup('MULTIPLIER', 10);
            this.totalPowerups++;
            safeSet('disc_run_total_powerups', this.totalPowerups);

            if (window.soundEngine) window.soundEngine.playPowerupSound();
            this.spawnPickupBurst(_tempWorldPos, 0xffcc00);
          } else if (col.type === 'INVINCIBLE') {
            this.activatePowerup('INVINCIBLE', 7);
            this.totalPowerups++;
            safeSet('disc_run_total_powerups', this.totalPowerups);

            if (window.soundEngine) window.soundEngine.playPowerupSound();
            this.spawnPickupBurst(_tempWorldPos, 0x00f0ff);
          }

          this.collectiblesContainer.remove(col.mesh);
          if (col.mesh.geometry) col.mesh.geometry.dispose();
          this.collectibles.splice(i, 1);
          this.checkAchievements();
          continue;
        }

        if (!col.passed && worldX < -1.1 && worldZ > 4.0) {
          col.passed = true;
        }

        if (col.passed && (worldZ < -2.0 || worldX < -22.0)) {
          this.collectiblesContainer.remove(col.mesh);
          if (col.mesh.geometry) col.mesh.geometry.dispose();
          this.collectibles.splice(i, 1);
        }
      }

      // 11. Direct 3D World Collision Detection & Interactive Hazards
      this.updateObstacleCollisions(dt);
    }

    getGameOverReason(type) {
      const isMobile = this.isMobileDevice();
      switch (type) {
        case 'BLOCK':
          return isMobile
            ? 'Crashed into a Standing Block! Tap LEFT or RIGHT side of screen to dodge.'
            : 'Crashed into a Standing Block! Use A/D or Left/Right Arrow keys to dodge.';
        case 'BAR_EXHAUSTED':
          return 'Duck timer ran out! Upgrade your Duck Duration in the Workshop to stay down longer.';
        case 'BAR_HIT':
          return isMobile
            ? 'Hit an Overhead Bar! Hold the CENTER of the screen to duck, or steer around it!'
            : 'Hit an Overhead Bar! Hold SPACEBAR or Down Arrow to duck, or steer around it!';
        case 'HAZARD_FIREBALL':
          return isMobile
            ? 'Incinerated by an Orbiting Fireball! Tap LEFT or RIGHT to change lanes.'
            : 'Incinerated by an Orbiting Fireball! Steer across lanes to dodge.';
        case 'HAZARD_SLIME':
          return 'Stepped in Toxic Acid Slime! Ducking will not protect against floor hazards.';
        case 'HAZARD_PLASMA':
          return 'Sliced by a Plasma Sweeper blade!';
        case 'HAZARD_LANE_SHIFTER':
          return isMobile
            ? 'Collided with a Lane Shifter Drone! Steer away from its flight lane.'
            : 'Collided with a Lane Shifter Drone! Steer away from its flight lane.';
        default:
          return 'Crashed into a Stage Hazard!';
      }
    }

    // 11. Direct 3D World Collision Detection & Interactive Hazards
    updateObstacleCollisions(dt) {
      const currentPlayerHeight = STANDING_HEIGHT * this.duckScaleY;

      for (let i = this.obstacles.length - 1; i >= 0; i--) {
        const obs = this.obstacles[i];

        if (obs.type === 'HAZARD_FIREBALL') {
          obs.angle += dt * 1.6;
          obs.mesh.position.set(Math.cos(obs.angle) * obs.radius, 0.9, Math.sin(obs.angle) * obs.radius);
          obs.lifeTimer -= dt;
          if (obs.lifeTimer <= 0) {
            this.obstaclesContainer.remove(obs.mesh);
            if (obs.mesh.geometry) obs.mesh.geometry.dispose();
            this.obstacles.splice(i, 1);
            continue;
          }
        } else if (obs.type === 'HAZARD_VOID_PAIR' && obs.vortexMesh) {
          obs.vortexMesh.rotation.z += dt * 6.0;
        } else if (obs.type === 'HAZARD_PLASMA' && obs.bladeMesh) {
          obs.bladeMesh.rotation.y += dt * 4.5;
        } else if (obs.type === 'HAZARD_LANE_SHIFTER') {
          obs.laneFloat += obs.laneDir * obs.laneSpeed * dt;
          if (obs.laneFloat >= (this.laneCount - 1)) {
            obs.laneFloat = this.laneCount - 1;
            obs.laneDir = -1;
          } else if (obs.laneFloat <= 0) {
            obs.laneFloat = 0;
            obs.laneDir = 1;
          }

          const lowerIdx = Math.floor(obs.laneFloat);
          const upperIdx = Math.min(this.laneCount - 1, lowerIdx + 1);
          const frac = obs.laneFloat - lowerIdx;
          obs.radius = this.lanes[lowerIdx] + (this.lanes[upperIdx] - this.lanes[lowerIdx]) * frac;
          obs.mesh.position.set(Math.cos(obs.angle) * obs.radius, 0, Math.sin(obs.angle) * obs.radius);
        }

        obs.mesh.getWorldPosition(_tempWorldPos);
        const worldX = _tempWorldPos.x;
        const worldZ = _tempWorldPos.z;

        // Standard Standing Block
        if (obs.type === 'BLOCK') {
          const dx = Math.abs(worldX);
          const dz = Math.abs(worldZ - this.currentRadius);

          if (dx < 0.95 && dz < 0.85) {
            if (this.activePowerup === 'INVINCIBLE') {
              this.destroyObstacleWithBonus(obs, i);
              continue;
            }
            if (this.invulnerableTimer > 0) continue;

            if (this.currentShields > 0) {
              this.absorbHitWithShield(obs, i);
              continue;
            }

            this.triggerGameOver(this.getGameOverReason('BLOCK'));
            return;
          }

          if (!obs.passed && worldX < -1.1 && worldZ > 4.0) {
            obs.passed = true;
            this.score += 5 * this.scoreMultiplier;
            if (window.soundEngine) window.soundEngine.playScoreChime();
          }
        } 
        // Overhead Bar
        else if (obs.type === 'BAR') {
          const dx = Math.abs(worldX);
          const inRadialRange = this.currentRadius >= (obs.rMin - 0.4) && this.currentRadius <= (obs.rMax + 0.4);

          if (dx < 0.95 && inRadialRange && worldZ > 4.0) {
            if (currentPlayerHeight > BAR_CLEARANCE_HEIGHT) {
              if (this.activePowerup === 'INVINCIBLE') {
                this.destroyObstacleWithBonus(obs, i);
                continue;
              }
              if (this.invulnerableTimer > 0) continue;

              if (this.currentShields > 0) {
                this.absorbHitWithShield(obs, i);
                continue;
              }

              const reasonKey = this.currentDuckTime <= 0 ? 'BAR_EXHAUSTED' : 'BAR_HIT';
              this.triggerGameOver(this.getGameOverReason(reasonKey));
              return;
            }
          }

          if (!obs.passed && worldX < -1.0 && worldZ > 3.8) {
            obs.passed = true;
            const wasDuckingUnder = inRadialRange && (this.duckScaleY < 0.75 || this.isDucking);

            if (wasDuckingUnder) {
              // Clutch timing window: bar is right in front of the player (0.08 - 1.45 units)
              const wasPressedJustInTime = obs.duckInitiatedAtX !== null && obs.duckInitiatedAtX >= 0.08 && obs.duckInitiatedAtX <= 1.45;

              if (wasPressedJustInTime) {
                // Perfect Duck Streak & Multiplier!
                this.perfectDuckStreak++;
                if (this.perfectDuckStreak > this.bestPerfectDuckStreak) {
                  this.bestPerfectDuckStreak = this.perfectDuckStreak;
                  safeSet('disc_run_best_streak', this.bestPerfectDuckStreak);
                }

                const streakMult = this.perfectDuckStreak;
                const bonus = 30 * streakMult * this.scoreMultiplier;
                const bankBonus = 15 + Math.min(30, (this.perfectDuckStreak - 1) * 5);

                this.score += bonus;
                this.bankPoints += bankBonus;
                this.totalPerfectDucks++;
                this.totalDucks++;
                safeSet('disc_run_total_perfect_ducks', this.totalPerfectDucks);
                safeSet('disc_run_total_ducks', this.totalDucks);

                if (window.soundEngine) window.soundEngine.playPerfectDuckSound();
                this.spawnPickupBurst(_tempWorldPos, 0xffea00);
                this.cameraShakeIntensity = 0.35;

                const streakLabel = streakMult > 1 ? `⚡ PERFECT DUCK x${streakMult}! +${bonus}` : '⚡ PERFECT DUCK! +30';
                this.showDuckBonusToast(streakLabel, true);
                this.checkAchievements();
              } else {
                // Regular Duck under bar (too early or held down) - resets perfect streak
                this.perfectDuckStreak = 0;

                const bonus = 10 * this.scoreMultiplier;
                this.score += bonus;
                this.bankPoints += 5;
                this.totalDucks++;
                safeSet('disc_run_total_ducks', this.totalDucks);

                if (window.soundEngine) window.soundEngine.playDuckBonusSound();
                this.spawnPickupBurst(_tempWorldPos, 0x00f0ff);
                this.cameraShakeIntensity = 0.15;
                this.showDuckBonusToast('DUCK BONUS +10', false);
                this.checkAchievements();
              }
            } else {
              // Missed/steered around bar without ducking - resets perfect streak
              this.perfectDuckStreak = 0;
              this.score += 5 * this.scoreMultiplier;
              if (window.soundEngine) window.soundEngine.playScoreChime();
            }
          }
        }
        // Stage 4: Paired Void Portals
        else if (obs.type === 'HAZARD_VOID_PAIR') {
          const dx = Math.abs(worldX);
          const dz = Math.abs(worldZ - this.currentRadius);

          if (dx < 0.95 && dz < 0.95 && !obs.passed) {
            obs.passed = true;
            this.playerLane = obs.targetLane;
            this.targetRadius = obs.targetRadius;
            this.currentRadius = obs.targetRadius;
            this.cameraShakeIntensity = 0.6;
            this.invulnerableTimer = 1.0;

            const warpBonus = 500 * this.scoreMultiplier;
            this.score += warpBonus;
            this.bankPoints += 500;
            this.totalPortals++;
            safeSet('disc_run_total_portals', this.totalPortals);

            if (window.soundEngine) window.soundEngine.playPortalWarpSound();
            this.spawnPickupBurst(_tempWorldPos, 0xcc00ff);
            this.showDuckBonusToast(`🌀 WARP BONUS! +${warpBonus}`, true);

            const pId = obs.pairId;
            for (let p = this.obstacles.length - 1; p >= 0; p--) {
              if (this.obstacles[p].pairId === pId) {
                this.obstaclesContainer.remove(this.obstacles[p].mesh);
                if (this.obstacles[p].mesh.geometry) this.obstacles[p].mesh.geometry.dispose();
                this.obstacles.splice(p, 1);
              }
            }
            this.checkAchievements();
            continue;
          }
        }
        // Stage 5: Cryo Ice Spikes
        else if (obs.type === 'HAZARD_ICE_SLOW') {
          const dx = Math.abs(worldX);
          const dz = Math.abs(worldZ - this.currentRadius);

          if (dx < 0.95 && dz < 0.95) {
            if (this.currentHazardShields > 0) {
              this.deflectHazardHit(obs, i);
              continue;
            }

            this.slowTimer = 3.0;
            this.cameraShakeIntensity = 0.4;
            this.spawnPickupBurst(_tempWorldPos, 0x00f5d4);
            if (window.soundEngine) window.soundEngine.playScoreChime();
            this.showDuckBonusToast('❄️ FROST SLOW!', false);

            this.obstaclesContainer.remove(obs.mesh);
            if (obs.mesh.geometry) obs.mesh.geometry.dispose();
            this.obstacles.splice(i, 1);
            continue;
          }
        }
        // Other Hazards
        else if (obs.type.startsWith('HAZARD_')) {
          const dx = Math.abs(worldX);
          const dz = Math.abs(worldZ - this.currentRadius);

          if (dx < 0.95 && dz < 0.95) {
            if (this.activePowerup === 'INVINCIBLE') {
              this.destroyObstacleWithBonus(obs, i);
              continue;
            }
            if (this.invulnerableTimer > 0) continue;

            if (this.currentHazardShields > 0) {
              this.deflectHazardHit(obs, i);
              continue;
            }

            if (this.currentShields > 0) {
              this.absorbHitWithShield(obs, i);
              continue;
            }

            this.triggerGameOver(this.getGameOverReason(obs.type));
            return;
          }

          if (!obs.passed && worldX < -1.1 && worldZ > 4.0) {
            obs.passed = true;
            this.score += 10 * this.scoreMultiplier;
            if (window.soundEngine) window.soundEngine.playScoreChime();
          }
        }

        if (obs.passed && (worldZ < -2.0 || worldX < -22.0)) {
          this.obstaclesContainer.remove(obs.mesh);
          if (obs.mesh.geometry) obs.mesh.geometry.dispose();
          this.obstacles.splice(i, 1);
        }
      }
    }

    deflectHazardHit(obs, index) {
      this.currentHazardShields--;
      this.totalHazardsDeflected++;
      safeSet('disc_run_total_hazards_deflected', this.totalHazardsDeflected);

      this.invulnerableTimer = 1.4;
      this.cameraShakeIntensity = 0.6;

      if (window.soundEngine) window.soundEngine.playHazardDeflectSound();

      obs.mesh.getWorldPosition(_tempWorldPos);
      this.spawnPickupBurst(_tempWorldPos, 0xb400ff);
      this.showDuckBonusToast(`🧿 HAZARD DEFLECTED! (${this.currentHazardShields} LEFT)`, true);

      this.obstaclesContainer.remove(obs.mesh);
      if (obs.mesh.geometry) obs.mesh.geometry.dispose();
      this.obstacles.splice(index, 1);

      this.checkAchievements();
      this.updateHUD();
      this.updateUpgradeShopUI();
    }

    absorbHitWithShield(obs, index) {
      this.currentShields--;
      this.totalShieldsUsed++;
      safeSet('disc_run_total_shields_used', this.totalShieldsUsed);

      this.invulnerableTimer = 1.4;
      this.cameraShakeIntensity = 0.9;

      if (window.soundEngine) window.soundEngine.playShieldPopSound();

      obs.mesh.getWorldPosition(_tempWorldPos);
      this.spawnPickupBurst(_tempWorldPos, 0x00ffcc);

      this.obstaclesContainer.remove(obs.mesh);
      if (obs.mesh.geometry) obs.mesh.geometry.dispose();
      this.obstacles.splice(index, 1);

      this.checkAchievements();
      this.updateHUD();
      this.updateUpgradeShopUI();
    }

    destroyObstacleWithBonus(obs, index) {
      this.cameraShakeIntensity = 0.5;
      this.score += 15 * this.scoreMultiplier;

      if (window.soundEngine) window.soundEngine.playScoreChime();

      obs.mesh.getWorldPosition(_tempWorldPos);
      this.spawnPickupBurst(_tempWorldPos, 0xff0055);

      this.obstaclesContainer.remove(obs.mesh);
      if (obs.mesh.geometry) obs.mesh.geometry.dispose();
      this.obstacles.splice(index, 1);
    }

    updateGameOverState(dt) {
      this.currentAngularSpeed *= Math.pow(0.2, dt);
      this.discAngle += this.currentAngularSpeed * dt;
      this.discGroup.rotation.y = this.discAngle;
    }

    updateParticles(dt) {
      for (let i = this.particles.length - 1; i >= 0; i--) {
        const p = this.particles[i];
        p.life -= dt;
        if (p.life <= 0) {
          this.scene.remove(p.mesh);
          p.mesh.geometry.dispose();
          p.mesh.material.dispose();
          this.particles.splice(i, 1);
          continue;
        }

        if (p.type === 'ring') {
          const progress = 1 - (p.life / p.maxLife);
          const scale = 1 + progress * p.scaleSpeed;
          p.mesh.scale.set(scale, scale, 1);
          p.mesh.material.opacity = (1 - progress) * 0.9;
        } else if (p.type === 'spark') {
          p.mesh.position.x += p.vx * dt;
          p.mesh.position.y += p.vy * dt;
          p.mesh.position.z += p.vz * dt;
          p.mesh.rotation.x += dt * 5;
        }
      }
    }

    updateDebris(dt) {
      const gravity = 35;
      for (let i = this.debris.length - 1; i >= 0; i--) {
        const d = this.debris[i];
        d.life -= dt;
        if (d.life <= 0) {
          this.scene.remove(d.mesh);
          d.mesh.geometry.dispose();
          d.mesh.material.dispose();
          this.debris.splice(i, 1);
          continue;
        }

        d.vy -= gravity * dt;
        d.mesh.position.x += d.vx * dt;
        d.mesh.position.y += d.vy * dt;
        d.mesh.position.z += d.vz * dt;

        d.mesh.rotation.x += d.rotX * dt;
        d.mesh.rotation.y += d.rotY * dt;

        if (d.mesh.position.y < 0) {
          d.mesh.position.y = 0;
          d.vy = -d.vy * 0.45;
          d.vx *= 0.8;
          d.vz *= 0.8;
        }
      }
    }
  }

  // Robust Initialization handler
  function bootGame() {
    if (typeof THREE === 'undefined') {
      setTimeout(bootGame, 100);
      return;
    }
    if (!window.game) {
      window.game = new DiscRunGame();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootGame);
  } else {
    bootGame();
  }
})();
