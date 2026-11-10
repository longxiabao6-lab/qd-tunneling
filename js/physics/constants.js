// 物理常數（SI）與 CdSe 參數，和 code/common.py 一樣
export const HBAR = 1.054571817e-34;
export const M0 = 9.1093837e-31;
export const QE = 1.602176634e-19;
export const HC = 1239.84193;      // 光子能量 eV 與波長 nm 換算
export const COUL = 1.43996;       // e²/(4πε₀)，單位 eV·nm

export const EG = 1.74, ME = 0.13, MH = 0.45, EPS = 10.6;
export const V0 = 0.56;            // 位障高度 eV，報告 4.3 節擬合的值

// k = kf(m)·√(E − V)，單位 1/nm
export const kf = m => Math.sqrt(2 * m * M0 * QE) / HBAR * 1e-9;

// 格距 h（nm）的 −ħ²/2m d²/dx² 換成矩陣後，對角線外的係數 t（eV）
export const hop = (h, m) => HBAR * HBAR / (2 * m * M0 * (h * 1e-9) ** 2) / QE;
