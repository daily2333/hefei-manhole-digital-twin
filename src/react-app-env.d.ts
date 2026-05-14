/// <reference types="react-scripts" />

interface Window {
  _AMapSecurityConfig?: {
    securityJsCode: string;
  };
  AMap: any;
  initAMap?: () => void;
}
