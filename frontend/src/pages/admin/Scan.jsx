import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from "html5-qrcode";

const Scan = () => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
    scanner.render(
      (decodedText) => {
        console.log("Scanned:", decodedText);
      },
      (error) => {
        console.warn(error);
      }
    );
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>QR Code Scanner</h1>
      <div id="reader" style={{ width: "300px", marginTop: 20 }}></div>
    </div>
  );
};

export default Scan;