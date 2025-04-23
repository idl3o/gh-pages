/**
 * Fourier Transform Utilities
 *
 * Provides Fast Fourier Transform (FFT) implementations for signal processing
 * and data analysis in the StreamChain platform.
 */

/**
 * Compute the Fast Fourier Transform of a real-valued array
 * Implementation of the Cooley-Tukey FFT algorithm
 *
 * @param {Array<number>} x - Input array (must be power of 2 length)
 * @returns {Array<{re: number, im: number}>} - Complex output representing frequency components
 */
function fft(x) {
  const N = x.length;

  // Check if input length is power of 2
  if (N <= 1 || (N & (N - 1)) !== 0) {
    throw new Error('FFT requires input array length to be power of 2');
  }

  // Base case
  if (N === 1) {
    return [{ re: x[0], im: 0 }];
  }

  // Split even and odd indices
  const even = new Array(N / 2);
  const odd = new Array(N / 2);

  for (let i = 0; i < N / 2; i++) {
    even[i] = x[i * 2];
    odd[i] = x[i * 2 + 1];
  }

  // Recursive FFT on even and odd indices
  const evenFFT = fft(even);
  const oddFFT = fft(odd);

  // Combine results
  const result = new Array(N);
  for (let k = 0; k < N / 2; k++) {
    // Complex exponential factor
    const theta = (-2 * Math.PI * k) / N;
    const wk = {
      re: Math.cos(theta),
      im: Math.sin(theta)
    };

    // Complex multiplication with odd[k]
    const oddK = {
      re: oddFFT[k].re * wk.re - oddFFT[k].im * wk.im,
      im: oddFFT[k].re * wk.im + oddFFT[k].im * wk.re
    };

    // Combine
    result[k] = {
      re: evenFFT[k].re + oddK.re,
      im: evenFFT[k].im + oddK.im
    };

    result[k + N / 2] = {
      re: evenFFT[k].re - oddK.re,
      im: evenFFT[k].im - oddK.im
    };
  }

  return result;
}

/**
 * Compute the Inverse Fast Fourier Transform
 *
 * @param {Array<{re: number, im: number}>} X - Complex input in frequency domain
 * @returns {Array<number>} - Real output in time domain
 */
function ifft(X) {
  const N = X.length;

  // Conjugate the complex numbers
  const x_conjugated = X.map(x => ({ re: x.re, im: -x.im }));

  // Forward FFT
  let result = fft(x_conjugated);

  // Conjugate the complex numbers again and scale
  result = result.map(x => x.re / N);

  return result;
}

/**
 * Compute the power spectrum of a signal
 *
 * @param {Array<number>} x - Input signal
 * @returns {Array<number>} - Power spectrum
 */
function powerSpectrum(x) {
  // Ensure input length is power of 2
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(x.length)));

  // Zero-padding if necessary
  const paddedX = new Array(nextPow2).fill(0);
  for (let i = 0; i < x.length; i++) {
    paddedX[i] = x[i];
  }

  // Compute FFT
  const X = fft(paddedX);

  // Compute power spectrum: |X|²
  return X.map(x => x.re * x.re + x.im * x.im);
}

/**
 * Apply a windowing function to the input signal
 *
 * @param {Array<number>} x - Input signal
 * @param {string} windowType - Window type ('hamming', 'hann', 'blackman', 'rectangular')
 * @returns {Array<number>} - Windowed signal
 */
function applyWindow(x, windowType = 'hamming') {
  const N = x.length;
  const windowed = new Array(N);

  switch (windowType.toLowerCase()) {
    case 'rectangular':
      return [...x]; // No change

    case 'hann':
      for (let n = 0; n < N; n++) {
        const window = 0.5 * (1 - Math.cos((2 * Math.PI * n) / (N - 1)));
        windowed[n] = x[n] * window;
      }
      break;

    case 'blackman':
      const alpha = 0.16;
      const a0 = (1 - alpha) / 2;
      const a1 = 0.5;
      const a2 = alpha / 2;

      for (let n = 0; n < N; n++) {
        const window =
          a0 -
          a1 * Math.cos((2 * Math.PI * n) / (N - 1)) +
          a2 * Math.cos((4 * Math.PI * n) / (N - 1));
        windowed[n] = x[n] * window;
      }
      break;

    case 'hamming':
    default:
      for (let n = 0; n < N; n++) {
        const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * n) / (N - 1));
        windowed[n] = x[n] * window;
      }
      break;
  }

  return windowed;
}

/**
 * Pad input array to the next power of 2
 *
 * @param {Array<number>} x - Input array
 * @returns {Array<number>} - Padded array with length = next power of 2
 */
function padToPowerOf2(x) {
  const nextPow2 = Math.pow(2, Math.ceil(Math.log2(x.length)));
  const padded = new Array(nextPow2).fill(0);

  for (let i = 0; i < x.length; i++) {
    padded[i] = x[i];
  }

  return padded;
}

/**
 * Perform spectral analysis on a signal
 *
 * @param {Array<number>} x - Input signal
 * @param {number} sampleRate - Sample rate in Hz
 * @param {object} options - Analysis options
 * @returns {object} - Analysis results
 */
function spectralAnalysis(x, sampleRate, options = {}) {
  const { windowType = 'hamming', normalization = true } = options;

  // Apply windowing
  const windowed = applyWindow(x, windowType);

  // Pad to power of 2
  const padded = padToPowerOf2(windowed);

  // Compute FFT
  const X = fft(padded);

  // Compute power spectrum
  const N = padded.length;
  const powerSpec = X.map(x => x.re * x.re + x.im * x.im);

  // Normalize if requested
  const normalizedPower = normalization ? powerSpec.map(p => p / N) : powerSpec;

  // Compute frequency bins
  const freqBins = Array(N / 2)
    .fill(0)
    .map((_, i) => (i * sampleRate) / N);

  // Only return the positive frequencies (up to Nyquist frequency)
  return {
    frequencies: freqBins,
    magnitude: normalizedPower.slice(0, N / 2),
    phase: X.slice(0, N / 2).map(x => Math.atan2(x.im, x.re))
  };
}

module.exports = {
  fft,
  ifft,
  powerSpectrum,
  applyWindow,
  padToPowerOf2,
  spectralAnalysis
};
