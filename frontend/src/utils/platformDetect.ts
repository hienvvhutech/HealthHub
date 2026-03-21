/**
 * Detect nếu app chạy trên Capacitor (Mobile) hay Web
 */

export const isPlatformMobile = (): boolean => {
  // Check nếu Capacitor plugins có sẵn
  if (typeof (window as any).Capacitor !== "undefined") {
    return true;
  }

  // Check user agent
  const userAgent = navigator.userAgent.toLowerCase();
  const mobilePatterns = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  
  return mobilePatterns.test(userAgent);
};

export const getPlatformName = (): "mobile" | "web" => {
  return isPlatformMobile() ? "mobile" : "web";
};

// Context provider để sử dụng ở khắp nơi
export const usePlatform = () => {
  return {
    isMobile: isPlatformMobile(),
    isWeb: !isPlatformMobile(),
    platform: getPlatformName(),
  };
};
