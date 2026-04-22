"use client";
import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  value: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
  includeMargin?: boolean;
}

const QRCode: React.FC<QRCodeProps> = (props) => {
  return <QRCodeSVG {...props} />;
};

export default QRCode;
